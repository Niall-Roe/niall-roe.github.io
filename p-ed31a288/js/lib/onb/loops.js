import {esc} from "../dom.js";
import {get} from "../api.js";
import {CALM} from "./stage.js";
let LOOPS = null;
export function loops() {
  LOOPS ||= get("/setup/loops").then(r => new Map((r?.loops || []).map(x => [x.name, x]))).catch(() => { LOOPS = null; return new Map(); });
  return LOOPS;
}
export const clipUrl = n => `api/v1/setup/loop/${encodeURIComponent(n)}.mp4`;
export const stillUrl = n => `api/v1/setup/loop/${encodeURIComponent(n)}.jpg`;
const SOURCE = "recorded from the app";
function player(host, L, {told = () => {}, upTo = "", cycle = () => {}, round = true} = {}) {
  const fig = document.createElement("figure"); fig.className = "lp";
  const cap = `<figcaption class="cap lp-cap" title="${esc(`${L.caption} · ${SOURCE}`)}">${esc(L.caption)} <span class="k">· ${SOURCE}</span></figcaption>`;
  const marks = (L.marks || []).slice().sort((a, b) => a[0] - b[0]);
  if (CALM.matches) {
    fig.innerHTML = `<img class="lp-v" src="${stillUrl(L.name)}" alt="${esc(L.caption)}">${cap}`;
    host.append(fig); told("still");
    return {stop: () => fig.remove(), restart: () => {}, seek: k => told(k), el: fig};
  }
  const endAt = upTo ? (marks.find(m => m[1] === upTo)?.[0] ?? null) : null;
  fig.innerHTML = `<video class="lp-v" muted playsinline preload="auto" poster="${stillUrl(L.name)}" aria-label="${esc(L.caption)}"></video>` +
    `<button type="button" class="lp-play" hidden aria-label="Play">▶</button>${cap}`;
  host.append(fig);
  const v = fig.querySelector("video"), btn = fig.querySelector(".lp-play");
  v.loop = round && endAt == null; v.src = clipUrl(L.name);
  let at = "", last = 0, live = true, held = null;
  const span = ks => { ks = [].concat(ks); const i = marks.findIndex(m => ks.includes(m[1])); return i < 0 ? null : [marks[i][0], (marks.slice(i + 1).find(m => !ks.includes(m[1])) || [v.duration || 1e9])[0]]; };
  const tick = () => {
    if (!live) return;
    const t = v.currentTime;
    if (held && t >= held[1] - 0.05) { v.currentTime = held[0]; last = held[0]; return; }
    if (endAt != null && t >= endAt + 1.6) { v.currentTime = 0; cycle(); return; }
    if (t + 0.05 < last) { at = ""; cycle(); }
    last = t;
    let k = ""; for (const [mt, mk] of marks) if (mt <= t + 0.05) k = mk;
    if (k && k !== at) { at = k; told(k); }
  };
  const go = () => v.play().then(() => { btn.hidden = true; }).catch(() => { btn.hidden = false; });
  v.addEventListener("timeupdate", tick);
  v.addEventListener("ended", () => { if (!live) return; if (held) { v.currentTime = held[0]; go(); return; } cycle(); if (!round) return; v.currentTime = 0; go(); });
  btn.addEventListener("click", go);
  go();
  const seek = (k, hold = false) => { const sp = span(k); if (!sp) return; held = hold ? sp : null; v.currentTime = sp[0]; last = sp[0]; at = ""; if (v.paused) go(); };
  return {stop: () => { live = false; v.pause(); v.removeAttribute("src"); v.load(); fig.remove(); },
    restart: () => { v.currentTime = 0; last = 0; at = ""; if (v.paused) go(); }, seek, el: fig, video: v};
}
export async function play(host, name, opts = {}) {
  const L = (await loops()).get(name);
  if (!L) return null;
  host.innerHTML = ""; host.classList.add("loopy");
  const P = player(host, L, opts);
  const ctl = () => { P.stop(); host.classList.remove("loopy"); };
  ctl.seek = P.seek; ctl.seconds = L.seconds; ctl.loop = name; ctl.marks = (L.marks || []).map(m => m[1]);
  return ctl;
}
export async function playlist(host, names, {told = () => {}, onClip = () => {}, cycle = () => {}} = {}) {
  const M = await loops(), list = names.filter(n => M.has(n));
  if (!list.length) return null;
  host.innerHTML = ""; host.classList.add("loopy");
  if (CALM.matches) { const P = player(host, M.get(list[0]), {told: k => told(list[0], k)}); onClip(list[0]); return () => { P.stop(); host.classList.remove("loopy"); }; }
  let i = 0, P = null, live = true;
  const next = () => {
    if (!live) return;
    P?.stop(); const n = list[i++ % list.length]; onClip(n);
    P = player(host, M.get(n), {told: k => told(n, k), round: list.length === 1, cycle: () => { cycle(); if (list.length > 1) setTimeout(next, 0); }});
  };
  next();
  const ctl = () => { live = false; P?.stop(); host.classList.remove("loopy"); };
  ctl.restart = () => P?.restart?.();
  return ctl;
}
export async function pair(cards, hosts, a, b, {told = () => {}} = {}) {
  const M = await loops(), has = x => [].concat(x).some(n => M.has(n));
  if (!has(a) || !has(b)) return null;
  let lit = 0, held = -1, done = false;
  const paint = () => !done && cards.forEach((c, i) => { const on = (held >= 0 ? held : lit) === i; c.classList.toggle("lit", on); c.classList.toggle("dim", !on); });
  const pass = from => { if (held >= 0 || from !== lit) return; lit = 1 - lit; paint(); ctl[lit]?.restart?.(); };
  const ctl = [];
  ctl[0] = await playlist(hosts[0], [].concat(a), {told: (n, k) => told(0, n, k), cycle: () => pass(0)});
  ctl[1] = await playlist(hosts[1], [].concat(b), {told: (n, k) => told(1, n, k), cycle: () => pass(1)});
  const offs = cards.map((c, i) => {
    const enter = () => { held = i; paint(); }, leave = () => { if (held === i) { held = -1; lit = i; paint(); } };
    c.addEventListener("pointerenter", enter); c.addEventListener("pointerleave", leave);
    return () => { c.removeEventListener("pointerenter", enter); c.removeEventListener("pointerleave", leave); };
  });
  paint();
  return () => { done = true; ctl.forEach(s => s?.()); offs.forEach(f => f()); cards.forEach(c => c.classList.remove("lit", "dim")); };
}
