import {esc} from "../dom.js";
import {num} from "../fmt.js";
import {CALM, gather, pick, release} from "./stage.js";
import {blackline, scenes, SECTION_NAME, sleep} from "./shows.js";
import {vennBlocks, VENN_COLOURS} from "../vennblocks.js";
const KCOL = {draft: "#3a6fd8", lifetime: "#c08a3e", later: "#8f6bd1"};
export function draftTree(host, D, told = () => {}) {
  if (!D?.nodes?.length) { host.innerHTML = `<p class="cap">no example work in this library</p>`; return () => {}; }
  const depth = new Map(D.nodes.map(n => [n.id, 0]));
  for (let i = 0; i < D.nodes.length; i++) for (const l of D.links) depth.set(l.b, Math.max(depth.get(l.b), depth.get(l.a) + 1));
  const ncol = Math.max(...depth.values()) + 1, byCol = Array.from({length: ncol}, () => []);
  D.nodes.forEach(n => byCol[depth.get(n.id)].push(n));
  const anyBl = D.links.some(l => l.segments?.length);
  host.innerHTML = `<div class="dt-h"><b>${esc(D.work)}</b></div><div class="dt${anyBl ? " withbl" : ""}"><svg class="dt-w" aria-hidden="true"></svg></div><p class="dt-how${anyBl ? " withbl" : ""}" aria-live="polite"></p>` +
    (anyBl ? `<div class="dt-bl"><div class="dt-pair k"></div><div class="rv-text dt-txt"></div></div>` : "");
  const box = host.querySelector(".dt"), svg = host.querySelector(".dt-w"), how = host.querySelector(".dt-how");
  const pairEl = host.querySelector(".dt-pair"), txt = host.querySelector(".dt-txt");
  const black = async (l, on) => {
    if (!txt) return;
    if (!l.segments?.length) { pairEl.textContent = ""; txt.innerHTML = ""; return; }
    pairEl.textContent = l.pair; await blackline(txt, l.segments, on);
  };
  const W = box.clientWidth, H = box.clientHeight, cw = W / ncol;
  const pos = new Map();
  byCol.forEach((L, c) => L.forEach((n, j) => pos.set(n.id, [cw * c + cw / 2, H * (j + 1) / (L.length + 1)])));
  box.insertAdjacentHTML("beforeend", D.nodes.map(n => { const [x, y] = pos.get(n.id);
    return `<div class="dt-n" data-id="${esc(n.id)}" style="left:${x}px;top:${y}px;--k:${KCOL[n.kind] || "#6b6b66"}" title="${esc(n.title)}"><i></i><b>${esc(n.label)}</b><span>${n.year || ""}${n.kind === "lifetime" ? " · in his lifetime" : n.kind === "later" ? " · later edition" : ""}</span></div>`; }).join(""));
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = `<defs><marker id="dta" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z"/></marker></defs>` +
    D.links.map((l, i) => { const [x0, y0] = pos.get(l.a), [x1, y1] = pos.get(l.b), mx = (x0 + x1) / 2;
      return `<path class="dt-l ${l.source}" data-i="${i}" d="M${x0 + 13} ${y0}C${mx} ${y0} ${mx} ${y1} ${x1 - 14} ${y1}" pathLength="1"/>`; }).join("");
  const nodes = id => host.querySelector(`.dt-n[data-id="${CSS.escape(id)}"]`), paths = [...svg.querySelectorAll(".dt-l")];
  const label = id => D.nodes.find(n => n.id === id)?.label || id;
  const say = l => { how.innerHTML = `<b>${esc(label(l.a))} → ${esc(label(l.b))}</b> <span class="k">· ${esc(l.how)}</span>`; };
  if (CALM.matches) { host.querySelectorAll(".dt-n").forEach(n => n.classList.add("on")); paths.forEach(p => p.classList.add("on")); how.innerHTML = `<span class="k">each arrow: how it is known (hover a square for its title)</span>`; const l0 = D.links.find(l => l.segments?.length); if (l0) black(l0, () => true); told("still"); return () => {}; }
  return scenes([async on => {
    host.querySelectorAll(".dt-n").forEach(n => n.classList.remove("on", "hi")); paths.forEach(p => p.classList.remove("on")); how.textContent = "";
    for (let c = 0; c < ncol && on(); c++) {
      for (const n of byCol[c]) nodes(n.id)?.classList.add("on");
      told("col", c);
      const L = D.links.filter(l => depth.get(l.b) === c);
      for (const l of L) { if (!on()) return; const i = D.links.indexOf(l); paths[i].classList.add("on"); nodes(l.b)?.classList.add("hi"); say(l); await black(l, on); await sleep(l.segments?.length ? 2600 : 1900); nodes(l.b)?.classList.remove("hi"); }
      if (!L.length) await sleep(1200);
    }
    await sleep(3500);
  }]);
}
const decade = y => { const n = parseInt(String(y || ""), 10); return n >= 1830 && n <= 1920 ? Math.floor(n / 10) * 10 : null; };
export function layouts(data, R, {mine = false} = {}) {
  const {lib, T, demo} = data || {};
  if (!lib) return [];
  const msK = m => "ms:" + m.ms, pubK = p => "pub:" + p.P;
  const sec = new Map(); (demo?.corpus || []).filter((k, i) => demo.corpus_kind[i] === "scan").forEach((k, i) => sec.set(k, demo.ms_section?.[i]));
  const held = new Set([...lib.manuscripts.filter(m => m.held).map(msK), ...lib.publications.filter(p => p.held).map(pubK)]);
  const out = [];
  const grid = (name, axes, rows, cols, cellOf, keys, {est = false} = {}) => {
    const LW = 108, TH = 22, x0 = R.x + LW, y0 = R.y + TH, W = R.w - LW, Hh = R.h - TH;
    const cells = new Map(); let none = 0;
    for (const k of keys) { const c = cellOf(k); if (!c) { none++; continue; } const id = c[0] + "|" + c[1]; (cells.get(id) || cells.set(id, []).get(id)).push(k); }
    const cnt = (r, c) => (cells.get(r + "|" + c) || []).length;
    let s = 14;
    const fit = s => { const cw = cols.map(c => Math.max(1, ...rows.map(r => Math.ceil(Math.sqrt(cnt(r, c) * 2.2))))), rh = rows.map(r => Math.max(1, ...cols.map((c, j) => Math.ceil(cnt(r, c) / cw[j]))));
      return [cw, rh, cw.reduce((a, b) => a + b * s + 8, 0) <= W && rh.reduce((a, b) => a + b * s + 6, 0) <= Hh]; };
    let F; while (s > 2 && !(F = fit(s))[2]) s--;
    const [cw, rh] = F || fit(2);
    const T2 = new Map(), labs = [];
    let x = x0; const cx = cols.map((c, j) => { const v = x; x += cw[j] * s + 8; return v; });
    let y = y0; const ry = rows.map((r, i) => { const v = y; y += rh[i] * s + 6; return v; });
    rows.forEach((r, i) => cols.forEach((c, j) => (cells.get(r + "|" + c) || []).forEach((k, n) => T2.set(k, [cx[j] + (n % cw[j]) * s, ry[i] + Math.floor(n / cw[j]) * s, Math.max(1.5, s - (s > 5 ? 2 : 1))]))));
    let last = -99;
    rows.forEach((r, i) => { if (ry[i] - last >= 12 && rh[i] * s >= 4) { labs.push({x: R.x, y: ry[i] - 2, w: LW - 8, t: String(r)}); last = ry[i]; } });
    cols.forEach((c, j) => { const w = cw[j] * s + 6, t = String(c); labs.push({x: cx[j], y: R.y, w: Math.max(24, w), t: w < 40 && /^1\d{3}s$/.test(t) ? "\u2019" + t.slice(2) : t, top: true}); });
    out.push({name, axes, targets: T2, labs, none, est});
  };
  const mss = lib.manuscripts.map(msK), pubs = lib.publications.map(pubK);
  const year = new Map([...lib.manuscripts.map(m => [msK(m), m.year]), ...lib.publications.map(p => [pubK(p), p.year])]);
  const decs = [...new Set([...year.values()].map(decade).filter(Boolean))].sort();
  grid("date across kind", "down: when written or printed · across: kind", [...decs.map(d => d + "s"), "not dated"], ["Manuscripts", "In his lifetime"],
    k => [decade(year.get(k)) ? decade(year.get(k)) + "s" : "not dated", k.startsWith("ms:") ? "Manuscripts" : "In his lifetime"], [...mss, ...pubs]);
  const secs = [...new Set([...sec.values()].filter(Boolean))].sort((a, b) => a.localeCompare(b, "en", {numeric: true}));
  if (secs.length) grid("Harvard's sections across date", "down: Harvard's sections · across: decade written", [...secs.map(s => `${s} ${SECTION_NAME[s] || ""}`.trim()), "no section"],
    [...decs.filter(d => d >= 1850).map(d => d + "s"), "?"],
    k => { const s = sec.get(k), d = decade(year.get(k)); return [s ? `${s} ${SECTION_NAME[s] || ""}`.trim() : "no section", d && d >= 1850 ? d + "s" : "?"]; }, mss);
  if (T?.works?.length) {
    const lifeW = new Set(T.works.filter(w => T.publications?.[w.id]?.P).flatMap(w => w.ms.map(m => "ms:" + m)));
    const laterW = new Set(T.works.filter(w => w.eds?.length).flatMap(w => w.ms.map(m => "ms:" + m)));
    const items = mss.map(k => ({vk: k, mask: (lifeW.has(k) ? 1 : 0) | (laterW.has(k) ? 2 : 0)}));
    const sets = [{name: "a draft of a lifetime printing", title: "works data: estimate"}, {name: "printed in a later edition", title: "works data: estimate"}];
    let SQ = 14, V;
    for (; SQ > 3; SQ--) { V = vennBlocks({items, sets, W: R.w, SQ, est: true}); if (V.h <= R.h) break; }
    const T3 = new Map(); for (const [k, [x, y]] of V.pos) T3.set(k, [R.x + x, R.y + y, Math.max(1.5, SQ - (SQ > 5 ? 2 : 1))]);
    out.push({name: "Venn", axes: "two questions: a draft of a lifetime printing? printed in a later edition?", targets: T3, marks: V.marks, origin: [R.x, R.y], est: true});
  }
  for (const L of out) { L.mine = mine ? held : null; L.at = [R.x, R.y + R.h + 10]; }
  return out;
}
export async function show(L, labs, dur = 1300) {
  labs.classList.add("out");
  await gather(L.targets, dur, {dim: 0.04, lit: 0.85});
  if (L.mine) pick(L.mine, null, 0.28); else pick(null);
  labs.innerHTML = `${L.marks ? `<div class="ar-marks" style="left:${L.origin[0]}px;top:${L.origin[1]}px">${L.marks}</div>` : ""}` +
    (L.labs || []).map(l => `<span class="${l.top ? "top" : ""}" style="left:${l.x}px;top:${l.y}px;max-width:${l.w}px">${esc(l.t)}</span>`).join("") +
    `<p class="ar-axes" style="left:${L.at[0]}px;top:${L.at[1]}px">${esc(L.axes)}${L.est ? " <span class=\"k\">· ~ estimates</span>" : ""}${L.none ? ` <span class="k">· ${num(L.none)} not placed</span>` : ""}</p>`;
  labs.classList.remove("out");
}
export { release };
void VENN_COLOURS;
