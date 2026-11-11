import {esc} from "../dom.js";
import {CALM} from "./stage.js";
import {imageUrl, scenes, sleep} from "./shows.js";
const LV = {ok: "ok", part: "pa", bad: "di", one: "one"};
export const tourPage = (sc, role) => (sc?.tour || []).find(t => t.role === role) || null;
const credit = p => `${esc(p.cite)}${p.film ? " · Houghton film" : p.link ? ` · <a href="${esc(p.link)}" target="_blank" rel="noopener">Harvard's scan</a>` : ""}`;
const cropCSS = (p, [x0, y0, x1, y1], s) =>
  `width:${(x1 - x0) * s}px;height:${(y1 - y0) * s}px;background-image:url('${imageUrl(p.stem)}');background-size:${p.width * s}px ${p.height * s}px;background-position:-${x0 * s}px -${y0 * s}px`;
const pad = ([x0, y0, x1, y1], p, k = 10) => [Math.max(0, x0 - k), Math.max(0, y0 - k), Math.min(p.width, x1 + k), Math.min(p.height, y1 + k)];
const union = boxes => [Math.min(...boxes.map(b => b[0])), Math.min(...boxes.map(b => b[1])), Math.max(...boxes.map(b => b[2])), Math.max(...boxes.map(b => b[3]))];
const wordsHTML = (l, mark = () => "") => (l.words?.length ? l.words : (l.a || "").split(/\s+/).map(t => [t, "ok"]))
  .map(([t, lv], i) => `<span class="w ${LV[lv] || "ok"} ${mark(i)}">${esc(t)}</span>`).join(" ");
const plainHTML = (t, mark = () => "") => (t || "").split(/\s+/).filter(Boolean).map((w, i) => `<span class="w ${mark(i)}">${esc(w)}</span>`).join(" ");
const marked = t => esc(t).replace(/~([^~]+)~/g, `<s class="mk-s">$1</s>`).replace(/\{([^}]+)\}/g, `<span class="mk-i">$1</span>`);
export function pointer(host) {
  let p = host.querySelector(".ptr");
  if (!p) { p = document.createElement("div"); p.className = "ptr"; p.innerHTML = `<svg viewBox="0 0 16 22"><path d="M1 1l13 12h-7l4 8-3 1-4-8-3 4z"/></svg>`; host.append(p); }
  const at = (x, y) => { p.style.transform = `translate(${x}px, ${y}px)`; p.classList.add("on"); };
  return {
    at, hide: () => p.classList.remove("on"),
    async click(el) {
      const h = host.getBoundingClientRect(), r = el.getBoundingClientRect();
      at(r.left - h.left + r.width * .6, r.top - h.top + r.height * .55); await sleep(650);
      p.classList.add("click"); el.classList.add("pressed"); await sleep(220); p.classList.remove("click"); el.classList.remove("pressed");
    },
  };
}
const DRAFTED = `<i class="dr" title="drafted"></i>`;
export function hard(host, tour, told = () => {}, {only = null} = {}) {
  const G = tour?.find(t => t.role === "greek"), E = tour?.find(t => t.role === "egyptian"), M = tour?.find(t => t.role === "maths"), K = tour?.find(t => t.role === "struck");
  const I = tour?.find(t => t.role === "inserted");
  const items = [];
  if (G?.focus != null) {
    const l = G.lines[G.focus], [g0, g1] = G.greek || [0, 0], gk = i => (i >= g0 && i < g1 ? "gk" : "");
    items.push({key: "greek", page: G, label: "Greek", box: pad(l.box, G, 8), a: wordsHTML(l, gk), b: plainHTML(l.b, gk), as: G.his, slot: "Greek reader"});
  }
  if (E?.focus != null) {
    const l = E.lines[E.focus];
    items.push({key: "other", page: E, label: "Egyptian", split: true, box: pad(l.box, E, 8), a: wordsHTML(l), b: plainHTML(l.b), slot: "a reader for other scripts"});
  }
  if (M) {
    const f = M.figures.find(x => x.kind === "maths" && M.focus != null && x.box[1] <= M.lines[M.focus].box[1] + 30 && M.lines[M.focus].box[3] - 30 <= x.box[3]) || M.figures.find(x => x.kind === "maths");
    const inside = f ? M.lines.filter(l => f.box[1] <= (l.box[1] + l.box[3]) / 2 && (l.box[1] + l.box[3]) / 2 <= f.box[3]) : [];
    if (f && inside.length) items.push({key: "maths", page: M, label: "a maths display", box: pad(f.box, M, 6), fig: true,
      a: inside.map(l => wordsHTML(l)).join(` <span class="k">·</span> `), b: inside.map(l => plainHTML(l.b)).join(` <span class="k">·</span> `), slot: "Maths reader"});
  }
  if (K?.focus != null) {
    const l = K.lines[K.focus], h = l.box[3] - l.box[1];
    items.push({key: "struck", page: K, label: "a struck word, a word above it", split: true, box: pad([l.box[0], l.box[1] - h * .9, l.box[2], l.box[3]], K, 6),
      a: wordsHTML(l), b: plainHTML(l.b), as: K.his ? marked(K.his) : "", asLabel: "as he wrote it", asHTML: true});
  }
  if (I?.focus != null && I.focus > 0) {
    const l = I.lines[I.focus], u = I.lines[I.focus - 1], ins = i => "in";
    items.push({key: "inserted", page: I, label: "words written in above the line", box: pad(union([u.box, l.box]), I, 8),
      a: `${wordsHTML(u, ins)} <span class="k">↵</span> ${wordsHTML(l)}`, b: `${plainHTML(u.b, ins)} <span class="k">↵</span> ${plainHTML(l.b)}`,
      as: I.his ? marked(I.his) : "", asLabel: `${DRAFTED}where they go`, asHTML: true});
  }
  if (!items.length) { host.innerHTML = `<p class="cap">no example pages in this library</p>`; return () => {}; }
  const keys = items.map(it => it.key);
  if (only != null) {
    const i = typeof only === "string" ? keys.indexOf(only) : ((only % items.length) + items.length) % items.length;
    if (i < 0) { host.innerHTML = `<p class="cap">no example page for this in this library</p>`; return Object.assign(() => {}, {n: keys.length, keys}); }
    items.splice(0, items.length, items[i]);
  }
  const W = host.clientWidth - 24, still2 = CALM.matches && innerWidth > 860;
  const card = (it, still) => {
    const W2 = still2 ? (W - 16) / 2 : W;
    const [x0, y0, x1, y1] = it.box, xm = Math.round((x0 + x1) / 2), parts = it.split && !still ? [[x0, y0, xm + 20, y1], [xm - 20, y0, x1, y1]] : [it.box];
    const s = Math.min(W2 / (parts[0][2] - parts[0][0]), (still ? 46 : it.split ? 120 : 170) / (y1 - y0));
    const sl = it.slot ? `<span class="hc-slot"><span>${esc(it.slot)}</span><span class="k">empty</span></span>` : "";
    return `<div class="hc-it" data-k="${it.key}"><div class="hc-h"><b>${esc(it.label)}</b> <span class="k">${credit(it.page)}</span>${still ? sl : ""}</div>
      ${parts.map(b => `<div class="hc-crop${it.fig ? " fig" : ""}"><i class="hc-img" style="${cropCSS(it.page, b, s)}"></i>${it.fig ? `<i class="tag">maths</i>` : ""}</div>`).join("")}
      <div class="hc-r ra"><span class="k">Reader 1</span><span>${it.a}</span></div>
      <div class="hc-r rb"><span class="k">Reader 2</span><span>${it.b}</span></div>
      ${it.as ? `<div class="hc-r rs"><span class="k">${it.asLabel || "as written"}</span>${it.asHTML ? `<span class="hc-as">${it.as}</span>` : `<span lang="grc">${esc(it.as)}</span>`}</div>` : ""}
      ${still ? "" : sl}</div>`;
  };
  const tag = f => Object.assign(f, {n: keys.length, keys});
  if (CALM.matches) {
    host.innerHTML = `<div class="hc still${only != null ? " one" : ""}">${items.map(it => card(it, true)).join("")}</div>`;
    told("still", items[0].key); return tag(() => {});
  }
  host.innerHTML = `<div class="hc"></div>`;
  const box = host.querySelector(".hc");
  return tag(scenes(items.map(it => async on => {
    box.innerHTML = card(it, false);
    const el = box.firstElementChild; told("look", it.key);
    await sleep(1300); if (!on()) return;
    el.classList.add("s1"); told("read", it.key); await sleep(1400); if (!on()) return;
    el.classList.add("s2"); await sleep(1200); if (!on()) return;
    el.classList.add("s3"); if (it.slot) told("slot", it.key); await sleep(3200);
  })));
}
function view(host, p, region, rows) {
  const W = host.clientWidth, H = (host.clientHeight - 64) * .56, lw = W - 20;
  const [x0, y0, x1, y1] = region, s = Math.min(lw / (x1 - x0), H / (y1 - y0));
  const at = b => `left:${(b[0] - x0) * s}px;top:${(b[1] - y0) * s}px;width:${(b[2] - b[0]) * s}px;height:${(b[3] - b[1]) * s}px`;
  const lines = p.lines.map((l, i) => [l, i]).filter(([l]) => (l.box[1] + l.box[3]) / 2 > y0 && (l.box[1] + l.box[3]) / 2 < y1 && l.box[2] > x0 && l.box[0] < x1);
  const [w, h] = [(x1 - x0) * s, (y1 - y0) * s];
  host.querySelector(".fx-v").innerHTML = `<div class="fx-scan" style="width:${w}px;height:${h}px"><i class="fx-img" style="${cropCSS(p, region, s)}"></i>${lines.map(([l, i]) => `<span class="fx-box" data-i="${i}" style="${at(l.box)}"></span>`).join("")}</div>
    <div class="fx-text">${(rows || lines.map(([l, i]) => [i, wordsHTML(l)])).map(([i, h]) => `<div class="fx-l" data-i="${i}">${h}</div>`).join("")}</div>
    <span class="cap">${credit(p)}</span>`;
  const scan = host.querySelector(".fx-scan"), H0 = host.getBoundingClientRect();
  const pt = (x, y) => { const r = scan.getBoundingClientRect(); return [r.left - H0.left + (x - x0) * s, r.top - H0.top + (y - y0) * s]; };
  return {scan, at, pt, s, lines, text: host.querySelector(".fx-text")};
}
export function fixes(host, tour, told = () => {}, {train = true, only = null} = {}) {
  const K = tour?.find(t => t.role === "struck"), G = tour?.find(t => t.role === "line"), D = tour?.find(t => t.role === "diagram"), M = tour?.find(t => t.role === "maths");
  if (!K && !G && !D && !M) { host.innerHTML = `<p class="cap">no example pages in this library</p>`; return () => {}; }
  const tools = [["type", "retype"], ["line", "draw a line"], ["fig", "box a drawing"], ["help", "Suggestion / issue"]];
  host.innerHTML = `<div class="fx-tools">${tools.map(([k, l]) => `<span data-t="${k}">${esc(l)}</span>`).join("")}<span class="fx-n" aria-live="polite"></span></div>
    <div class="fx-v"></div><div class="fx-train" hidden></div>`;
  const tool = k => { host.querySelectorAll("[data-t]").forEach(t => t.classList.toggle("on", t.dataset.t === k)); told("tool", k); };
  const n = host.querySelector(".fx-n");
  let fixed = 0;
  const count = () => { n.textContent = fixed ? `${fixed} fix${fixed > 1 ? "es" : ""}` : ""; };
  const ptr = pointer(host);
  const drag = async (el, from, to, off, ms = 900) => {
    el.style.transition = "none"; Object.assign(el.style, {left: from[0] + "px", top: from[1] + "px", width: "0px", height: "0px"}); void el.offsetWidth;
    ptr.at(off[0] + from[0], off[1] + from[1]); await sleep(450);
    el.style.transition = `width ${ms}ms linear, height ${ms}ms linear`; Object.assign(el.style, {width: to[0] - from[0] + "px", height: to[1] - from[1] + "px"});
    ptr.at(off[0] + to[0], off[1] + to[1]); await sleep(ms + 150);
  };
  const S = [];
  const want = k => only == null || only === k;
  if (K?.focus != null && K.his && want("type")) {
    const f = K.focus, region = pad(union(K.lines.slice(Math.max(0, f - 1), f + 2).map(l => l.box)), K, 14);
    S.push(async on => {
      tool("type"); const v = view(host, K, region); const row = v.text.querySelector(`[data-i="${f}"]`); if (!row) return;
      v.scan.querySelector(`[data-i="${f}"]`)?.classList.add("hi"); await sleep(900); if (!on()) return;
      await ptr.click(row); if (!on()) return;
      row.classList.add("edit"); row.textContent = ""; const raw = K.his;
      for (let i = 1; i <= raw.length && on(); i++) { row.textContent = raw.slice(0, i); await sleep(55); }
      if (!on()) return;
      await sleep(350); row.classList.remove("edit"); row.classList.add("yours"); row.innerHTML = marked(raw);
      v.scan.querySelector(`[data-i="${f}"]`)?.classList.add("yours");
      fixed++; count(); ptr.hide(); await told("pulse", row); await sleep(1600);
    });
  }
  if (G?.missed && want("line")) {
    const m = G.missed, below = G.lines.findIndex(l => l.box[1] >= m[1]), u = pad(union([m, ...G.lines.slice(Math.max(0, below - 1), below + 2).map(l => l.box)]), G, 14);
    const region = [Math.max(u[0], m[0] - (m[2] - m[0]) * 1.1), u[1], u[2], u[3]];
    S.push(async on => {
      tool("line"); const rows = [];
      const v0 = G.lines.map((l, i) => [l, i]).filter(([l]) => (l.box[1] + l.box[3]) / 2 > region[1] && (l.box[1] + l.box[3]) / 2 < region[3] && l.box[2] > region[0]);
      for (const [l, i] of v0) { if (i === below) rows.push(["new", `<span class="k">drawn · not read yet</span>`]); rows.push([i, wordsHTML(l)]); }
      const v = view(host, G, region, rows), nl = v.text.querySelector(`[data-i="new"]`); nl.classList.add("new");
      const b = document.createElement("span"); b.className = "fx-box drawn"; v.scan.append(b);
      const sc = v.scan.getBoundingClientRect(), H0 = host.getBoundingClientRect(), ox = sc.left - H0.left, oy = sc.top - H0.top;
      const X = x => (x - region[0]) * v.s, Y = y => (y - region[1]) * v.s;
      await sleep(900); if (!on()) return;
      b.style.transition = "none"; Object.assign(b.style, {left: X(m[0]) + "px", top: Y(m[1]) + "px", width: "0px", height: "0px"}); void b.offsetWidth;
      ptr.at(ox + X(m[0]), oy + Y(m[1])); await sleep(500); if (!on()) return;
      const mid = m[0] + (m[2] - m[0]) * .62;
      b.style.transition = "width .8s linear, height .8s linear"; Object.assign(b.style, {width: X(mid) - X(m[0]) + "px", height: Y(m[3]) - Y(m[1]) + "px"});
      ptr.at(ox + X(mid), oy + Y(m[3])); await sleep(1000); if (!on()) return;
      b.classList.add("short"); ptr.at(ox + X(mid), oy + Y((m[1] + m[3]) / 2)); await sleep(700); if (!on()) return;
      b.style.transition = "width .7s ease-in-out"; b.style.width = X(m[2]) - X(m[0]) + "px"; ptr.at(ox + X(m[2]), oy + Y((m[1] + m[3]) / 2)); await sleep(850);
      if (!on()) return;
      b.classList.remove("short"); nl.classList.add("on"); fixed++; count(); ptr.hide(); await told("pulse", b); await sleep(1600);
    });
  }
  if (D?.missed && want("fig")) {
    const m = D.missed, after = D.lines.filter(l => l.box[1] < m[1]).length, region = pad(union([m, ...D.lines.slice(Math.max(0, after - 1), after + 1).map(l => l.box)]), D, 14);
    S.push(async on => {
      tool("fig"); const v = view(host, D, region);
      const b = document.createElement("span"); b.className = "fx-box fig"; v.scan.append(b);
      const sc = v.scan.getBoundingClientRect(), H0 = host.getBoundingClientRect(), ox = sc.left - H0.left, oy = sc.top - H0.top;
      const X = x => (x - region[0]) * v.s, Y = y => (y - region[1]) * v.s;
      await sleep(900); if (!on()) return;
      await drag(b, [X(m[0]), Y(m[1])], [X(m[2]), Y(m[3])], [ox, oy], 1000); if (!on()) return;
      b.classList.add("done");
      const tw = v.text.clientWidth * .7, fs = Math.min(tw / (m[2] - m[0]), 110 / (m[3] - m[1]));
      const im = document.createElement("div"); im.className = "fx-fim"; im.style.cssText = cropCSS(D, m, fs);
      const nextRow = v.text.querySelector(`[data-i="${after}"]`); v.text.insertBefore(im, nextRow || null);
      await sleep(80); im.classList.add("on");
      fixed++; count(); ptr.hide(); await told("pulse", b); await sleep(1700);
    });
  }
  if (M && want("help")) {
    const f = M.figures.find(x => x.kind === "maths"), region = f ? pad(f.box, M, 10) : pad(M.lines[0].box, M, 10);
    S.push(async on => {
      tool("help"); const v = view(host, M, region);
      const btn = document.createElement("button"); btn.type = "button"; btn.tabIndex = -1; btn.className = "fx-help"; btn.textContent = "Suggestion / issue";
      const box = document.createElement("div"); box.className = "fx-hbox"; box.innerHTML = `<div class="fx-ta"></div><div class="fx-hrow"><span class="k">saved on this Mac</span><button type="button" tabindex="-1">Save</button></div>`;
      host.append(btn, box); await sleep(900); if (!on()) { btn.remove(); box.remove(); return; }
      await ptr.click(btn); box.classList.add("on"); const ta = box.querySelector(".fx-ta"), note = "maths read as words";
      for (let i = 1; i <= note.length && on(); i++) { ta.textContent = note.slice(0, i); await sleep(70); }
      if (on()) await ptr.click(box.querySelector("button"));
      if (on()) { box.querySelector(".k").textContent = "Saved on this Mac"; fixed++; count(); ptr.hide(); await told("pulse", box); await sleep(1300); }
      if (!CALM.matches) { btn.remove(); box.remove(); } void v;
    });
  }
  if (!S.length) { host.innerHTML = `<p class="cap">no example pages in this library</p>`; return () => {}; }
  if (train && only == null) S.push(async on => {
    tool(""); const t = host.querySelector(".fx-train"), v = host.querySelector(".fx-v");
    v.innerHTML = ""; t.hidden = false;
    t.innerHTML = `<div class="fx-flow"><span>${fixed} fixes</span><i></i><span>training</span><i></i><span>new readers</span></div><p class="k">shared only if you choose</p>`;
    await sleep(600); if (!on()) return;
    t.classList.add("go"); await told("train"); await sleep(3000);
    t.hidden = true; t.classList.remove("go"); fixed = 0; count();
  });
  else S.push(async () => { fixed = 0; count(); });
  if (CALM.matches) {
    if (only) { if (S[0]) S[0](() => true); told("still"); return () => {}; }
    tool("type");
    if (K?.focus != null && K.his) {
      const f = K.focus, region = pad(union(K.lines.slice(Math.max(0, f - 1), f + 2).map(l => l.box)), K, 14), v = view(host, K, region);
      const row = v.text.querySelector(`[data-i="${f}"]`); if (row) { row.classList.add("yours"); row.innerHTML = marked(K.his); }
      v.scan.querySelector(`[data-i="${f}"]`)?.classList.add("yours");
    }
    const t = host.querySelector(".fx-train"); if (!train) { told("still"); return () => {}; }
    t.hidden = false; t.classList.add("still");
    t.innerHTML = `<div class="fx-flow"><span>your fixes</span><i></i><span>training</span><i></i><span>new readers</span></div><p class="k">shared only if you choose</p>`;
    told("still"); return () => {};
  }
  return scenes(S);
}
export function toc(host, c, told = async () => {}) {
  const strip = c?.strip || [];
  const eds = [...new Set(strip.flatMap(p => p.eds))].sort((a, b) => (c.editions || []).indexOf(a) - (c.editions || []).indexOf(b));
  if (!strip.length || !eds.length) { host.innerHTML = `<p class="cap">no example manuscript in this library</p>`; return () => {}; }
  const here = parseInt(String(c.stem).slice(6), 10) || 0, ms = parseInt(String(c.stem).slice(0, 5), 10);
  const row = (lab, on) => `<div class="mc-row tc-row" data-ed="${esc(lab)}"><span>${esc(lab)}</span><i>${strip.map(p => `<b class="${on(p) ? "lit" : ""}${p.sheet === here ? " here" : ""}"></b>`).join("")}</i></div>`;
  host.innerHTML = `<div class="tc-sc"><div class="tc-in">
      <div class="mc tc-toc"><div class="mc-h">MS ${ms} <span class="k">· ${strip.length} pages</span></div>
        ${row("pages", () => true).replace('class="mc-row tc-row"', 'class="mc-row tc-row tc-pages"')}
        <div class="tc-eds"></div><p class="k tc-none">no editions yet</p></div>
      <div class="tc-pg"><div class="tc-scan"><img alt="" src="${imageUrl(c.stem)}"></div>
        <div class="tc-read">${(c.reading || []).slice(0, 14).map(t => `<div>${esc(t)}</div>`).join("")}</div></div></div></div>
    <span class="cap">${esc(String(c.cite || "").replace(/^R /, "MS "))}${c.link ? ` · <a href="${esc(c.link)}" target="_blank" rel="noopener">Harvard's scan</a>` : ""}</span>`;
  const inner = host.querySelector(".tc-in"), list = host.querySelector(".tc-eds"), none = host.querySelector(".tc-none"), tocEl = host.querySelector(".tc-toc");
  const add = async (ed, still) => {
    none.hidden = true;
    list.insertAdjacentHTML("beforeend", row(ed, p => p.eds.includes(ed)));
    const r = list.lastElementChild; if (still) { r.classList.add("on"); r.querySelectorAll("b.lit").forEach(b => b.classList.add("on")); return; }
    await sleep(30); r.classList.add("on");
    for (const b of r.querySelectorAll("b.lit")) { b.classList.add("on"); await sleep(70); }
  };
  if (CALM.matches) { eds.forEach(e => add(e, true)); told("still"); return () => {}; }
  return scenes([async on => {
    list.innerHTML = ""; none.hidden = false;
    inner.style.transition = "none"; inner.style.transform = `translateY(${-tocEl.offsetHeight - 8}px)`; void inner.offsetWidth;
    await sleep(1500); if (!on()) return;
    inner.style.transition = ""; inner.style.transform = "";
    await sleep(1800); if (!on()) return;
    for (const ed of eds) { if (!on()) return; await told("file", ed); if (!on()) return; await add(ed); await sleep(500); }
    await sleep(3800);
  }]);
}
