import {esc, on, toast} from "../dom.js";
import {get} from "../api.js";
import {openPdf} from "../pdfview.js";
export const imageUrl = stem => `api/v1/setup/image/${encodeURIComponent(stem)}.jpg`;
import {CALM} from "./stage.js";
const copyLink = cite => ` <button type="button" class="pplink" data-pp="${esc(String(cite).split(/[–-]/)[0].trim())}">your copy ›</button>`;
on("click", ".pplink[data-pp]", async b => {
  try { const i = await get("/reference/printed-page", {cite: b.dataset.pp}); openPdf(`/api/v1/reference/printed-pdf/${i.file_id}#page=${i.pdf_page + 1}`, "Setup", `${b.dataset.pp} · your copy of the edition`); }
  catch (e) { toast(e.message); }
});
let FAST = 0;
export const fast = on => { FAST = on ? performance.now() + 4000 : 0; };
export const sleep = ms => new Promise(r => setTimeout(r, CALM.matches || performance.now() < FAST ? 0 : ms));
export function scenes(list) {
  let on = true;
  (async () => {
    while (on) {
      let waited = false; const t = setTimeout(() => { waited = true; }, 0);
      for (const s of list) { if (!on) return; await s(() => on); }
      clearTimeout(t);
      if (!waited) return;
    }
  })();
  return () => { on = false; };
}
function pointer(host) {
  let p = host.querySelector(".ptr");
  if (!p) { p = document.createElement("div"); p.className = "ptr"; p.innerHTML = `<svg viewBox="0 0 16 22"><path d="M1 1l13 12h-7l4 8-3 1-4-8-3 4z"/></svg>`; host.append(p); }
  return async el => {
    const h = host.getBoundingClientRect(), r = el.getBoundingClientRect();
    p.style.transform = `translate(${r.left - h.left + r.width * .6}px, ${r.top - h.top + r.height * .55}px)`; p.classList.add("on");
    await sleep(650); p.classList.add("click"); el.classList.add("pressed"); await sleep(220); p.classList.remove("click"); el.classList.remove("pressed");
  };
}
const LV = {ok: "ok", part: "pa", bad: "di", one: "one"};
const credit = (cite, link) => `${esc(cite)}${link ? ` · <a href="${esc(link)}" target="_blank" rel="noopener">Harvard's scan</a>` : ""}`;
export function pipeline(host, page, told = () => {}) {
  const P = pagePlay(host, page, told);
  if (!P) return () => {};
  if (CALM.matches) { P.still(); return () => {}; }
  return scenes([P.run]);
}
export function pagePlay(host, page, told = () => {}) {
  if (!page) { host.innerHTML = `<p class="cap">no example page in this library</p>`; return null; }
  const W = host.clientWidth - 20, H = host.clientHeight - 52, lines = page.lines.map(l => ({...l, text: l.text ?? l.a ?? ""})), n = lines.length;
  const figs = (page.figures || []).filter(f => f.kind === "diagram");
  const ps = Math.min(H / page.height, W / page.width), pw = page.width * ps, ph = page.height * ps, px = (W - pw) / 2;
  const colW = Math.floor(W * 0.46), gap = 5;
  const sumH = lines.reduce((t, l) => t + (l.box[3] - l.box[1]), 0);
  const ss = Math.min((H - gap * n) / sumH, colW / Math.max(...lines.map(l => l.box[2] - l.box[0])));
  let y = 0;
  const cut = lines.map(l => { const r = {x: 0, y, w: (l.box[2] - l.box[0]) * ss, h: (l.box[3] - l.box[1]) * ss}; y += r.h + gap; return r; });
  const img = imageUrl(page.stem);
  const at = l => `left:${px + l.box[0] * ps}px;top:${l.box[1] * ps}px;width:${(l.box[2] - l.box[0]) * ps}px;height:${(l.box[3] - l.box[1]) * ps}px`;
  const words = l => (l.words?.length ? l.words : l.text.split(/\s+/).map(t => [t, "ok"]));
  const tw = W - colW - 22, at0 = f => lines.filter(l => l.box[1] < f.box[1]).length;
  const figAt = k => figs.filter(f => at0(f) === k).map(f => { const fw = f.box[2] - f.box[0], fs = Math.min(tw * .9 / fw, 110 / (f.box[3] - f.box[1]));
    return `<div class="pl-fim" data-at="${k}" style="width:${fw * fs}px;height:${(f.box[3] - f.box[1]) * fs}px;background-image:url('${img}');background-size:${page.width * fs}px ${page.height * fs}px;background-position:-${f.box[0] * fs}px -${f.box[1] * fs}px"></div>`; }).join("");
  host.innerHTML = `<div class="pl-stage">
    <div class="pl-page" style="left:${px}px;width:${pw}px;height:${ph}px"><img src="${img}" alt="${esc(page.cite)}"></div>
    <svg class="pl-found" style="left:${px}px;width:${pw}px;height:${ph}px" viewBox="0 0 ${page.width} ${page.height}" preserveAspectRatio="none" aria-hidden="true">
      ${lines.map(l => { const [x0, y0, x1, y1] = l.box, c = l.core ?? Math.round(y0 + (y1 - y0) * .62);
        return `<path class="ol" d="M${x0} ${c - (c - y0) * .9}Q${x0 - 6} ${c} ${x0} ${y1}L${x1} ${y1}Q${x1 + 6} ${c} ${x1} ${y0 + (c - y0) * .1}Z"/><line class="bl" x1="${x0 + 4}" y1="${c}" x2="${x1 - 4}" y2="${c}"/>`; }).join("")}</svg>
    ${lines.map((l, k) => `<span class="pl-strip" data-k="${k}" style="${at(l)};background-image:url('${img}');background-size:${pw}px ${ph}px;background-position:-${l.box[0] * ps}px -${l.box[1] * ps}px"></span>`).join("")}
    ${figs.map(f => `<span class="pl-fig" style="left:${px + f.box[0] * ps}px;top:${f.box[1] * ps}px;width:${(f.box[2] - f.box[0]) * ps}px;height:${(f.box[3] - f.box[1]) * ps}px"><i>drawing</i></span>`).join("")}
    <div class="pl-beam"></div>
    <div class="pl-text" style="left:${colW + 22}px"><div class="pl-tin">${lines.map((l, k) => figAt(k) + `<div data-k="${k}">${words(l).map(([t, lv]) => `<span class="w ${LV[lv] || "ok"}">${esc(t)}</span>`).join(" ")}</div>`).join("")}${figAt(n)}</div></div></div>
    <div class="pl-step" aria-live="polite"></div><span class="cap">${credit(page.cite, page.link)}</span>`;
  const $$ = q => [...host.querySelectorAll(q)];
  const strips = $$(".pl-strip"), txt = $$(".pl-tin > div"), beam = host.querySelector(".pl-beam"), step = host.querySelector(".pl-step");
  const pg = host.querySelector(".pl-page"), tin = host.querySelector(".pl-tin"), tbox = host.querySelector(".pl-text");
  const say = t => { step.textContent = t; };
  const home = () => strips.forEach((s, k) => { const l = lines[k]; s.style.cssText += `;${at(l)};background-size:${pw}px ${ph}px;background-position:-${l.box[0] * ps}px -${l.box[1] * ps}px`; });
  const separate = () => strips.forEach((s, k) => { const l = lines[k], c = cut[k];
    s.style.cssText += `;left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;background-size:${page.width * ss}px ${page.height * ss}px;background-position:-${l.box[0] * ss}px -${l.box[1] * ss}px`; });
  const follow = k => { const d = txt[k], over = d.offsetTop + d.offsetHeight - tbox.clientHeight; tin.style.transform = `translateY(${-Math.max(0, over)}px)`; };
  const fims = $$(".pl-fim"), showFig = k => fims.forEach(f => { if (+f.dataset.at <= k) f.classList.add("on"); });
  const reset = () => { host.classList.remove("found", "lift", "cut", "reading", "figs"); fims.forEach(f => f.classList.remove("on")); home(); txt.forEach(t => t.querySelectorAll(".w").forEach(w => w.classList.remove("on"))); tin.style.transform = ""; beam.style.opacity = 0; pg.style.opacity = 1; };
  const KEY = "word by word · green: both readers agree · yellow: partly · red: they differ";
  const still = upTo => { host.classList.add("lift", "cut", "still"); separate(); showFig(n); pg.style.opacity = 0;
    if (upTo === "cut") { say("cut into lines, ready to be read"); host.classList.add("precut"); told("still"); return; }
    host.classList.add("reading"); $$(".pl-tin .w").forEach(w => w.classList.add("on")); say(KEY); told("still"); };
  return {still, run: async (on, upTo = "") => {
    reset(); pg.style.opacity = 0; say(""); await told("pick"); if (!on()) return;
    pg.style.opacity = 1; say("the page"); told("page"); await sleep(1400); if (!on()) return;
    if (figs.length) { say("finding the drawings"); told("figs"); host.classList.add("figs"); await sleep(2200); if (!on()) return; }
    say("finding the lines"); told("found"); host.classList.add("found"); await sleep(2000); host.classList.remove("found"); if (!on()) return;
    say("cutting them out"); told("cut"); host.classList.add("lift"); await sleep(1200); pg.style.opacity = .12; if (!on()) return;
    host.classList.add("cut"); separate(); await sleep(1500); if (!on()) return;
    if (upTo === "cut") { host.classList.add("precut"); say("cut into lines, ready to be read"); told("ready"); await sleep(3200); return; }
    say("reading them, line by line"); told("read"); host.classList.add("reading"); pg.style.opacity = 0;
    for (let k = 0; k < n && on(); k++) {
      showFig(k);
      const c = cut[k], ws = [...txt[k].querySelectorAll(".w")], dur = 380 + 22 * ws.length;
      beam.style.transition = "none"; Object.assign(beam.style, {left: `${c.x}px`, top: `${c.y - 2}px`, height: `${c.h + 4}px`, opacity: .95});
      void beam.offsetWidth; beam.style.transition = `left ${dur}ms linear, opacity .2s`; beam.style.left = `${c.x + c.w}px`;
      follow(k);
      for (let j = 0; j < ws.length && on(); j++) { ws[j].classList.add("on"); await sleep(dur / ws.length); }
    }
    showFig(n); beam.style.opacity = 0; say(KEY); if (on()) told("done"); await sleep(4500);
  }};
}
export const SECTION_NAME = {"I.A": "Mathematics", "I.B": "Pragmatism", "I.C": "Phenomenology", "I.D": "Logic", "I.E": "Metaphysics", "I.F": "Physics",
  "I.G": "Chemistry", "I.H": "Astronomy", "I.I": "Geodesy", "I.J": "Psychology", "I.K": "Linguistics", "I.L": "History", "I.M": "Sciences of review",
  "I.N": "Practical science", "I.O": "Reviews", "I.P": "Translations", "I.Q": "Miscellanea", "I.R": "Biographical"};
export function compare(host, c) {
  const V = (c?.versions || []).filter(v => v.segments?.length);
  if (!V.length) { host.innerHTML = `<p class="cap">no example compare in this library</p>`; return () => {}; }
  const msOf = stem => parseInt(stem.slice(0, 5), 10);
  const mcHTML = v => {
    const strip = v.strip?.length ? v.strip : c.strip, here = parseInt(v.stem.slice(6), 10) || 0;
    const row = ed => `<div class="mc-row"><span>${esc(ed)}</span><i>${strip.map(p => `<b class="${p.eds.includes(ed) ? "on" : ""}${p.sheet === here ? " here" : ""}"></b>`).join("")}</i></div>`;
    return `<div class="mc-h">${esc(c.work)} <span class="k">· MS ${msOf(v.stem)}'s pages matched to each edition</span></div>${c.editions.filter(ed => strip.some(p => p.eds.includes(ed))).map(row).join("")}`;
  };
  const drafts = [...new Map(V.map(v => [v.stem, v])).values()], prints = [...new Set(V.map(v => v.label))];
  host.innerHTML = `<div class="mc">${mcHTML(V[0])}</div>
    <div class="rv"><div class="rv-scan"><img alt=""><a class="rv-cr" target="_blank" rel="noopener">Harvard's scan</a></div>
      <div class="rv-col"><div class="rv-chips"><span class="k">draft</span>${drafts.map(v => `<button type="button" tabindex="-1" data-d="${esc(v.stem)}">${esc(v.draft)}</button>`).join("")}
        <span class="k">against</span>${prints.map(p => `<button type="button" tabindex="-1" data-p="${esc(p)}">${esc(p)}</button>`).join("")}</div>
      <div class="rv-text"></div><p class="rv-key k"><s>struck</s>: the draft's words, as read here · <span class="edbar same"></span> words the printing keeps · <span class="edbar add"></span> words it adds, in ${prints.map(p => `${esc(p)}${copyLink(p)}`).join(" and ")}</p></div></div>`;
  const text = host.querySelector(".rv-text"), img = host.querySelector(".rv-scan img"), cr = host.querySelector(".rv-cr");
  const fit = () => { host.querySelector(".rv").style.top = host.querySelector(".mc").offsetHeight + "px"; };
  fit();
  const show = async (v, on) => {
    host.querySelectorAll("[data-d]").forEach(b => b.classList.toggle("on", b.dataset.d === v.stem));
    host.querySelectorAll("[data-p]").forEach(b => b.classList.toggle("on", b.dataset.p === v.label));
    img.src = imageUrl(v.stem); img.alt = v.draft; cr.href = v.link || "#"; cr.hidden = !v.link;
    const mc = host.querySelector(".mc"); if (!mc || !on()) return;
    if (mc.dataset.ms !== String(msOf(v.stem))) { mc.innerHTML = mcHTML(v); mc.dataset.ms = msOf(v.stem); fit(); }
    await blackline(text, v.segments, on);
  };
  if (CALM.matches) { show(V[1] || V[0], () => true); return () => {}; }
  const ptr = pointer(host);
  return scenes([async on => {
    for (const v of V) {
      if (!on()) return;
      const bd = host.querySelector(`[data-d="${CSS.escape(v.stem)}"]`), bp = host.querySelector(`[data-p="${CSS.escape(v.label)}"]`);
      if (bd && !bd.classList.contains("on")) await ptr(bd);
      if (bp) await ptr(bp);
      await show(v, on); await sleep(2200);
    }
  }]);
}
const words = segs => segs.flatMap(sg => sg.t ? sg.t.split(/\s+/).filter(Boolean).map(t => [sg.k, t, 0]) : sg.n ? [[sg.k, "", sg.n]] : []);
export async function blackline(el, segs, on = () => true) {
  el.innerHTML = words(segs).map(([k, t, n]) => n ? `<span class="cw edbar ${k}" style="--n:${Math.min(n, 40)}"></span>` : `<span class="cw ${k}">${esc(t)}</span>`).join(" ");
  const els = [...el.querySelectorAll(".cw")];
  if (CALM.matches) { els.forEach(e => e.classList.add("done")); return; }
  await sleep(900);
  for (const e of els) { if (!on()) return; if (!e.classList.contains("same")) { e.classList.add("done"); await sleep(140); } }
}
async function build(host, page, s, on, told) {
  const lines = (page?.lines || []).map(l => l.text).filter(Boolean).slice(0, 9);
  const cites = [page?.cite, ...(s.manuscripts || []).map(h => h.cite), ...(s.editions || []).map(h => h.cite)].filter(Boolean).slice(0, 6);
  host.innerHTML = `<div class="sb"><div class="sb-cap"></div>
    <div class="sb-a"><img class="sb-img" alt=""><div class="sb-txt"></div></div>
    <div class="sb-run">${cites.map((c, i) => `<span class="sb-blk" style="--c:${RUNC[i % RUNC.length]}"><b>${esc(c)}</b></span>`).join("")}<i class="sb-scan"></i></div>
    <div class="sb-b"><div class="sb-idx"></div><div class="sb-map"><svg aria-hidden="true"></svg><div class="sb-q"></div></div></div></div>`;
  const cap = host.querySelector(".sb-cap"), img = host.querySelector(".sb-img"), txt = host.querySelector(".sb-txt"), sb = host.querySelector(".sb");
  const run = host.querySelector(".sb-run"), scan = host.querySelector(".sb-scan"), idx = host.querySelector(".sb-idx"), map = host.querySelector(".sb-map svg"), q = host.querySelector(".sb-q");
  const say = (k, t) => { cap.textContent = t; told(k); };
  say("b-plain", "plain text");
  if (page?.stem) img.src = imageUrl(page.stem);
  for (const l of lines) { if (!on()) return; txt.insertAdjacentHTML("beforeend", `<p>${esc(l)}</p>`); await sleep(260); }
  await sleep(900);
  say("b-join", "run together"); sb.classList.add("joined"); await sleep(1400);
  run.classList.add("tight"); await sleep(1200);
  say("b-index", "an index of words"); sb.classList.add("pass1");
  const count = new Map();
  for (const w of lines.join(" ").toLowerCase().match(/[a-z]{5,}/g) || []) count.set(w, (count.get(w) || 0) + 1);
  const W = [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).sort((a, b) => a[0].localeCompare(b[0]));
  scan.className = "sb-scan go1";
  for (const [w, n] of W) { if (!on()) return; idx.insertAdjacentHTML("beforeend", `<div><span>${esc(w)}</span><span class="k">${n}</span></div>`); await sleep(330); }
  await sleep(900);
  say("b-meaning", "a map of meaning"); sb.classList.add("pass2"); scan.className = "sb-scan go2";
  const B = map.getBoundingClientRect(), Wd = B.width || 260, Ht = B.height || 160;
  map.setAttribute("viewBox", `0 0 ${Wd} ${Ht}`);
  const C = [[.25, .3], [.7, .28], [.35, .72], [.75, .7]], P = [];
  for (let i = 0; i < 36; i++) { const c = C[i % 4], a = (i * 2.4) % (2 * Math.PI), r = 6 + (i * 7) % 26; P.push([c[0] * Wd + Math.cos(a) * r, c[1] * Ht + Math.sin(a) * r * .8, RUNC[i % 4]]); }
  for (const [x, y, col] of P) { if (!on()) return; map.insertAdjacentHTML("beforeend", `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${col}" class="dot"/>`); await sleep(45); }
  await sleep(600);
  const Q = [C[1][0] * Wd + 9, C[1][1] * Ht + 4];
  q.textContent = s.meaning_q || ""; q.classList.add("on"); await sleep(1200);
  map.insertAdjacentHTML("beforeend", `<circle cx="${Q[0]}" cy="${Q[1]}" r="5" class="qdot"/>`);
  const near = P.map((p, i) => [Math.hypot(p[0] - Q[0], p[1] - Q[1]), i]).sort((a, b) => a[0] - b[0]).slice(0, 5);
  const dots = map.querySelectorAll(".dot");
  for (const [, i] of near) { if (!on()) return; map.insertAdjacentHTML("afterbegin", `<line x1="${Q[0]}" y1="${Q[1]}" x2="${P[i][0].toFixed(1)}" y2="${P[i][1].toFixed(1)}" class="nl"/>`); dots[i].classList.add("hi"); await sleep(220); }
  await sleep(1400);
  say("b-local", "on this Mac, from your own files"); sb.classList.add("local"); await sleep(2600);
}
export function search(host, s, told = () => {}, page = null, {buildOnly = false} = {}) {
  if (!s) { host.innerHTML = `<p class="cap">no example search in this library</p>`; return () => {}; }
  if (buildOnly && page) {
    if (CALM.matches) { host.innerHTML = `<p class="cap">the search built on this Mac: an index of words, a map of meaning</p>`; return () => {}; }
    return scenes([async on => { await build(host, page, s, on, told); await sleep(1800); }]);
  }
  const modes = [["hits", "Hits"], ["work", "By work"], ["define", "Define"], ["time", "Over time"], ...(s.meaning?.length ? [["meaning", "By meaning"]] : [])];
  host.innerHTML = `<div class="sr-bar"><span class="sr-q"></span><span class="sr-caret"></span><button type="button" tabindex="-1" class="sr-go">Search</button></div>
    <div class="sr-modes">${modes.map(([k, l]) => `<button type="button" tabindex="-1" data-m="${k}">${l}</button>`).join("")}</div><div class="sr-out"></div>`;
  const out = host.querySelector(".sr-out"), q = host.querySelector(".sr-q"), btn = k => host.querySelector(`[data-m="${k}"]`);
  const max = Math.max(1, ...s.overtime.map(x => x[1]));
  const body = {
    hits: () => `<div class="sr-cols"><div><h5>Editions</h5>${s.editions.map(h => `<p><b>${esc(h.cite)}</b>${copyLink(h.cite)}</p>`).join("")}</div>
      <div><h5>Manuscripts <span class="k">(machine readings)</span></h5>${s.manuscripts.map(h => `<p><b>${esc(h.cite)}</b> ${esc(h.text)}</p>`).join("")}</div></div>`,
    work: () => s.works.map(w => `<div class="sr-w"><b>${esc(w.title)}</b>${w.year ? ` <span class="k">${w.year}</span>` : ""}${w.rows.map(([k, l, lit, n]) => `<div class="sr-r"><span class="k">${esc(l.length > 30 ? l.slice(0, 28) + "…" : l)}</span><i>${Array.from({length: Math.min(n, 40)}, (_, j) => `<b class="${j < lit ? "on " + k : ""}"></b>`).join("")}</i></div>`).join("")}</div>`).join(""),
    define: () => `${s.century ? `<p><b>Century Dictionary</b> <span class="k">(Peirce wrote its logic definitions)</span>: the entry <i>${esc(s.century)}</i></p>` : ""}${s.printed.map(h => `<p><b>${esc(h.cite)}</b>${copyLink(h.cite)}</p>`).join("")}`,
    meaning: () => `<p class="k">a question in plain words: the passages closest in meaning, though none uses the word “abduction”</p>${s.meaning.map(h => `<p class="mh"><b>${esc(h.cite)}</b>${copyLink(h.cite)}</p>`).join("")}`,
    time: () => `<div class="sr-time">${s.overtime.map(([d, n]) => `<div><i style="height:${Math.max(3, 90 * n / max)}px"></i><span>${d}s</span><span class="k">${n}</span></div>`).join("")}</div><p class="k">passages using “${esc(s.q)}”, by when he wrote them (dated to within fifteen years)</p>`,
  };
  const show = k => { host.querySelectorAll("[data-m]").forEach(b => b.classList.toggle("on", b.dataset.m === k)); out.innerHTML = body[k](); told(k); };
  if (CALM.matches) { q.textContent = s.q; show("hits"); return () => {}; }
  const frame = host.innerHTML;
  return scenes([async on => {
    if (page) { await build(host, page, s, on, told); if (!on()) return; host.innerHTML = frame; }
    const out = host.querySelector(".sr-out"), q = host.querySelector(".sr-q"), btn = k => host.querySelector(`[data-m="${k}"]`), ptr = pointer(host);
    const show = k => { host.querySelectorAll("[data-m]").forEach(b => b.classList.toggle("on", b.dataset.m === k)); out.innerHTML = body[k](); told(k); };
    q.textContent = ""; out.innerHTML = ""; host.querySelectorAll("[data-m]").forEach(b => b.classList.remove("on"));
    for (const ch of s.q) { if (!on()) return; q.textContent += ch; await sleep(110); }
    await ptr(host.querySelector(".sr-go")); show("hits"); await sleep(2600);
    for (const [k] of modes.slice(1)) {
      if (!on()) return;
      if (k === "meaning") { await ptr(btn(k)); host.querySelectorAll("[data-m]").forEach(b => b.classList.toggle("on", b.dataset.m === k)); out.innerHTML = "";
        q.textContent = ""; for (const ch of s.meaning_q) { if (!on()) return; q.textContent += ch; await sleep(45); }
        await ptr(host.querySelector(".sr-go")); show(k); await sleep(4200); continue; }
      await ptr(btn(k)); show(k); await sleep(2800);
    }
  }]);
}
export const RUNC = ["#3a6fd8", "#22c38a", "#c08a3e", "#a77be0", "#d95926", "#4d93b8"];
export function reels(host, parts, told = () => {}) {
  if (!parts?.length) { host.innerHTML = `<p class="cap">no reel map in this library</p>`; return () => {}; }
  const f0 = parts[0].first, f1 = parts[parts.length - 1].last, N = f1 - f0 + 1;
  const runOf = f => parts.findIndex(p => f >= p.first && f <= p.last);
  host.innerHTML = `<div class="rl"><div class="rl-cap" aria-live="polite"></div><div class="rl-film slow"></div></div>`;
  const cap = host.querySelector(".rl-cap"), film = host.querySelector(".rl-film");
  const W = film.clientWidth, H = film.clientHeight;
  const PF = 1.32;
  let cols = 1; for (; cols < N; cols++) { const w = W / cols, h = w / .72; if (Math.ceil(N / cols) * h * PF <= H) break; }
  const rows = Math.ceil(N / cols);
  const tw = Math.min(W / cols, (H / rows / PF) * .72), th = tw / .72, gx = Math.max(1, tw * .1);
  const ox = (W - cols * tw) / 2, oy = (H - rows * th * PF) / 2 + th * (PF - 1) / 2;
  const home = i => [ox + (i % cols) * tw, oy + Math.floor(i / cols) * th * PF];
  for (let r = 0; r < rows; r++) {
    const strip = document.createElement("div"); strip.className = "rl-strip2";
    strip.style.cssText = `top:${oy + r * th * PF - th * (PF - 1) / 2}px;height:${th * PF}px;--sp:${Math.max(3, th * (PF - 1) / 2 * .55)}px;--sw:${Math.max(4, tw * .5)}px`;
    film.append(strip);
  }
  const sw = Math.min(110, (W - 20) / parts.length - 22), sh = sw / .72, sy = Math.max(10, (H - sh - 54) / 2);
  const stackX = k => (W - parts.length * (sw + 22) + 22) / 2 + k * (sw + 22);
  const tiles = [];
  for (let i = 0; i < N; i++) {
    const k = runOf(f0 + i), t = document.createElement("i");
    t.className = "rl-t"; t.title = `frame ${f0 + i}`;
    const ss = k >= 0 ? parts[k].stems || [] : [], img = ss.length ? `;background-image:url('${imageUrl(ss[(i - (parts[k].first - f0)) % ss.length])}')` : "";
    t.style.cssText = `width:${tw - gx}px;height:${th - gx}px;--c:${k >= 0 ? RUNC[k % RUNC.length] : "#6b6b66"}${img}`;
    tiles.push([t, k, i]); film.append(t);
  }
  const tops = parts.map((p, k) => {
    const d = document.createElement("div"); d.className = "rl-top"; d.style.cssText = `left:${stackX(k) + 14}px;top:${sy}px;width:${sw}px;height:${sh}px;--c:${RUNC[k % RUNC.length]}`;
    const st = p.stems?.[0]; d.innerHTML = (st ? `<img alt="" src="${imageUrl(st)}">` : "") + `<div class="rl-lab"><b>MS ${esc(p.ms)}</b><span>frames ${p.first}–${p.last}</span></div>`;
    d.querySelector("img")?.addEventListener("error", e => e.target.remove()); film.append(d); return d;
  });
  const sc = sw / (tw - gx);
  const put = (t, x, y, s = 1) => { t.style.transform = `translate(${x}px, ${y}px) scale(${s})`; };
  const scatter = () => tiles.forEach(([t, , i]) => { const [x, y] = home(i); put(t, x, y); t.classList.remove("hl"); t.style.zIndex = ""; t.style.outlineWidth = ""; });
  const stack = () => tiles.forEach(([t, k, i]) => {
    const p = parts[k]; if (!p) return;
    const j = i - (p.first - f0), n = p.last - p.first + 1, depth = Math.round(Math.min(n - 1, 14) * (j / Math.max(1, n - 1)));
    put(t, stackX(k) + depth, sy + 14 - depth, sc); t.style.zIndex = String(j); t.style.outlineWidth = `${(1.5 / sc).toFixed(2)}px`;
  });
  const label = on => tops.forEach(d => d.classList.toggle("on", on));
  const reel = `Reel ${esc(String(parts[0].reel).replace("R-", ""))}, frames ${f0}–${f1}`;
  const all = `${reel} <span class="k">· ${parts.length} manuscripts</span>`;
  if (CALM.matches) {
    host.classList.add("calm"); tiles.forEach(([t]) => t.classList.add("hl")); stack(); label(true); cap.innerHTML = all; told("stacks"); return () => {};
  }
  return scenes([async on => {
    film.classList.add("jump"); scatter(); label(false); void film.offsetWidth; film.classList.remove("jump");
    cap.innerHTML = reel; told("frames"); await sleep(2200); if (!on()) return;
    told("split");
    for (let k = 0; k < parts.length && on(); k++) {
      const p = parts[k]; cap.innerHTML = `${reel} <span class="k">·</span> <b style="color:${RUNC[k % RUNC.length]}">MS ${esc(p.ms)}</b> <span class="k">frames ${p.first}–${p.last}</span>`;
      tiles.forEach(([t, kk]) => { if (kk === k) t.classList.add("hl"); });
      await sleep(1900);
    }
    if (!on()) return;
    cap.innerHTML = all; told("stacks"); stack(); await sleep(2000); if (!on()) return; label(true); await sleep(5000);
  }]);
}
