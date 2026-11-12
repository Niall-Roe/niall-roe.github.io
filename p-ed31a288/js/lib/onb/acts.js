import {esc} from "../dom.js";
import {CALM, tok} from "./stage.js";
import {blackline, compare, imageUrl, pagePlay, search, sleep} from "./shows.js";
import {layouts, release, show as showLayout} from "./story.js";
import {pointer} from "./tour.js";
import {chip, marker, plan, withRefs} from "./libplay.js";
import {COL} from "../schematic.js";
const pause = ms => new Promise(r => setTimeout(r, ms));
function loop(list) {
  let on = true;
  (async () => { while (on) for (const s of list) { if (!on) return; await s(() => on); await pause(30); } })();
  return () => { on = false; };
}
async function runFor(fn, ms, on) { const stop = fn(); for (let t = 0; t < ms && on(); t += 200) await pause(200); stop?.(); }
const LV = {ok: "ok", part: "pa", bad: "di", one: "one"};
const pageName = p => String(p?.cite || "").replace(/^R /, "MS ");
export function twoCards(L, R, {pages, demo, lib, sc, from}) {
  const a = readCard(L, pages, from, {scene: true}), b = sortCard(R, demo, lib, sc, from, {scene: true});
  if (CALM.matches) return () => {};
  const cards = [L.closest(".tw-card"), R.closest(".tw-card")];
  const turn = k => cards.forEach((c, i) => c?.classList.toggle("rest", i !== k));
  const stop = loop([async on => { turn(0); await a(on); await pause(600); }, async on => { turn(1); await b(on); await pause(600); }]);
  return () => { stop(); cards.forEach(c => c?.classList.remove("rest")); };
}
export function sortThree(host, demo, lib, from) {
  const scene = sortCard(host, demo, lib, null, from, {scene: true, only: "sort"});
  return CALM.matches ? () => {} : loop([async on => { await scene(on); await pause(1500); }]);
}
function jump(from, to, col = "#7db4ff") {
  const a = from?.getBoundingClientRect(), b = to?.getBoundingClientRect();
  if (!a?.width || !b?.width || CALM.matches) return Promise.resolve();
  const d = document.createElement("i"); d.className = "flyer";
  d.style.cssText = `left:${a.left + a.width * .45}px;top:${a.top + a.height * .35}px;width:12px;height:12px;background:${col}`;
  document.body.append(d);
  return new Promise(res => {
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(d.style, {left: `${b.left + b.width / 2 - 6}px`, top: `${b.top + b.height / 2 - 6}px`})));
    setTimeout(() => { d.classList.add("in"); }, 950);
    setTimeout(() => { d.remove(); res(); }, 1250);
  });
}
function readCard(host, pages, from, {scene = false} = {}) {
  pages = pages.filter(Boolean);
  if (!pages.length) { host.innerHTML = `<p class="cap">no example page in this library</p>`; return () => {}; }
  if (CALM.matches) { pagePlay(host, pages[0])?.still(); return () => {}; }
  let i = 0;
  const one = async on => {
    const p = pages[i++ % pages.length];
    host.innerHTML = "";
    await jump(from, host); if (!on()) return;
    const P = pagePlay(host, p); if (!P) return;
    await P.run(on);
  };
  return scene ? one : loop([one]);
}
function sortCard(host, demo, lib, sc, from, {scene = false, only = ""} = {}) {
  const keys = demo?.corpus || [], kinds = demo?.corpus_kind || [];
  if (!keys.length) { host.innerHTML = `<p class="cap">no catalogue in this library</p>`; return () => {}; }
  const hitMs = new Set((sc?.search?.manuscripts || []).map(h => (h.cite.match(/^MS (L?\d+)/) || [])[1]).filter(Boolean).map(m => "ms:" + m));
  const pick = (kind, n) => { const all = keys.filter((k, i) => kinds[i] === kind && !k.includes("#") || (kind === "edition" && kinds[i] === kind));
    const vols = kind === "edition" ? [...new Set(all.map(k => k.split("#")[0]))] : all;
    const step = Math.max(1, Math.floor(vols.length / n)); return vols.filter((k, i) => i % step === 0).slice(0, n); };
  const ms = [...new Set([...[...hitMs].filter(k => keys.includes(k)), ...pick("scan", 46)])].slice(0, 46);
  const items = [...ms.map(k => ({k, kind: "ms"})), ...pick("lifetime", 18).map(k => ({k, kind: "lp"})), ...pick("edition", 14).map(k => ({k, kind: "le"}))];
  const year = new Map();
  (lib?.manuscripts || []).forEach(m => year.set("ms:" + m.ms, m.year)); (lib?.publications || []).forEach(p => year.set("pub:" + p.P, p.year));
  if (!year.size) keys.forEach((k, i) => { if (demo.ms_year?.[i]) year.set(k, demo.ms_year[i]); });
  host.innerHTML = `<div class="sq-stage"></div><div class="sq-labs"></div><div class="sq-cap k" aria-live="polite"></div>
    <div class="sq-cmp"><div class="sq-c"><b></b><div class="rv-text"></div></div></div><div class="sq-search"><span class="sr-q"></span><span class="sr-caret"></span></div>`;
  const st = host.querySelector(".sq-stage"), labs = host.querySelector(".sq-labs"), cap = host.querySelector(".sq-cap");
  const cmp = host.querySelector(".sq-cmp"), sbar = host.querySelector(".sq-search"), q = host.querySelector(".sr-q");
  const els = items.map(it => { const e = document.createElement("i"); e.className = "sq"; e.style.setProperty("--c", COL[it.kind]); st.append(e); return e; });
  const W = () => host.clientWidth, H = () => host.clientHeight;
  const s = 13;
  const put = (e, x, y, sz = s - 3) => { e.style.transform = `translate(${x}px, ${y}px)`; e.style.width = e.style.height = `${sz}px`; };
  const say = t => { cap.textContent = t; };
  let LT = 0;
  const lab = list => { clearTimeout(LT); labs.innerHTML = ""; if (!list.length) return;
    LT = setTimeout(() => { labs.innerHTML = list.map(([x, y, t, w]) => `<span style="left:${x}px;top:${y}px${w ? `;width:${w}px` : ""}">${esc(t)}</span>`).join(""); }, CALM.matches ? 0 : 1150); };
  const groups = () => {
    const gw = (W() - 40) / 3, by = 54;
    ["ms", "lp", "le"].forEach((kd, g) => { const L = items.map((it, i) => [it, i]).filter(([it]) => it.kind === kd), per = Math.max(1, Math.floor((gw - 10) / s));
      L.forEach(([, i], n) => put(els[i], 14 + g * (gw + 6) + (n % per) * s, by + Math.floor(n / per) * s)); });
    lab([[14, 30, "Manuscripts", gw - 4], [14 + gw + 6, 30, "Lifetime publications", gw - 4], [14 + 2 * (gw + 6), 30, "Later editions", gw - 4]]);
  };
  const byDate = () => {
    const dec = it => { const y = year.get(it.k); return y ? Math.floor(y / 10) * 10 : null; };
    const D = [...new Set(items.filter(it => it.kind !== "le").map(dec).filter(Boolean))].sort();
    const row = new Map(D.map((d, i) => [d, i])), n = new Map(), rh = Math.min(s + 4, (H() - 90) / Math.max(1, D.length));
    items.forEach((it, i) => { const d = it.kind === "le" ? null : dec(it); if (d == null) { els[i].classList.add("off"); return; }
      els[i].classList.remove("off"); const c = n.get(d) || 0; n.set(d, c + 1); put(els[i], 70 + c * s, 34 + row.get(d) * rh, Math.min(s, rh) - 3); });
    lab(D.map(d => [10, 34 + row.get(d) * rh - 3, d + "s"]));
  };
  const home = () => { const a = from?.getBoundingClientRect(), b = host.getBoundingClientRect(); return a?.width ? [a.left - b.left + a.width * .4, a.top - b.top + a.height * .3] : [-20, -20]; };
  const C = (sc?.compare?.versions || []).find(v => v.segments?.length);
  const hits = new Set([...hitMs, ...keys.filter(k => /^ed:(CP 4|CP 5|W2|EP2)#/.test(k)).slice(0, 999)].flatMap(k => items.filter(it => it.k === k || it.k === k.split("#")[0]).map(it => it.k)));
  if (CALM.matches) { els.forEach(e => e.classList.add("in")); groups(); say(""); return () => {}; }
  const one = async on => {
    cmp.classList.remove("on"); sbar.classList.remove("on"); lab([]); say("");
    els.forEach(e => { e.classList.remove("in", "off", "hit", "dim", "pk"); e.style.transition = "none"; const [x, y] = home(); put(e, x, y, 4); });
    void host.offsetWidth; els.forEach(e => { e.style.transition = ""; });
    await pause(300); if (!on()) return;
    els.forEach((e, i) => setTimeout(() => { e.classList.add("in"); put(e, 14 + Math.random() * (W() - 40), 40 + Math.random() * (H() - 90)); }, i * 22));
    await sleep(2600); if (!on()) return;
    say("sorted into three"); groups(); await sleep(3600); if (!on()) return;
    if (only === "sort") return;
    say("arranged by date"); byDate(); await sleep(3600); if (!on()) return;
    if (C) {
      say("two versions compared"); const shown = i => !els[i].classList.contains("off"), a = items.findIndex((it, i) => it.kind === "ms" && shown(i)), b = items.findIndex((it, i) => it.kind !== "ms" && shown(i));
      els.forEach((e, i) => e.classList.toggle("dim", i !== a && i !== b)); els[a]?.classList.add("pk"); els[b]?.classList.add("pk");
      await sleep(900); if (!on()) return;
      cmp.querySelector("b").textContent = `${C.draft} against ${C.label}`; cmp.classList.add("on");
      await blackline(cmp.querySelector(".rv-text"), C.segments.slice(0, 40), on); await sleep(2400); if (!on()) return;
      cmp.classList.remove("on"); els.forEach(e => e.classList.remove("dim", "pk"));
    }
    const qq = sc?.search?.q;
    if (qq) {
      groups(); say("searched"); sbar.classList.add("on"); q.textContent = "";
      for (const ch of qq) { if (!on()) return; q.textContent += ch; await sleep(110); }
      await sleep(500); els.forEach((e, i) => { e.classList.toggle("hit", hits.has(items[i].k)); e.classList.toggle("dim", !hits.has(items[i].k)); });
      say(`“${qq}”: its passages lit`); await sleep(3400);
    }
  };
  return scene ? one : loop([one]);
}
export function preLoop(host, pages, told = () => {}) {
  pages = pages.filter(Boolean);
  if (!pages.length) { host.innerHTML = `<p class="cap">no example page in this library</p>`; return () => {}; }
  if (CALM.matches) { const P = pagePlay(host, pages[0], told); P?.still("cut"); return () => {}; }
  let i = 0;
  return loop([async on => { host.innerHTML = ""; const P = pagePlay(host, pages[i++ % pages.length], told); if (P) await P.run(on, "cut"); }]);
}
const focusOf = p => {
  const L = p.lines.map((l, i) => [l, i]).filter(([l]) => (l.words || []).length >= 5);
  return (L.find(([l]) => l.words.some(w => w[1] !== "ok") && l.words.filter(w => w[1] === "ok").length >= 3) || L[0] || [p.lines[0], 0])[1];
};
const wordsOf = l => (l.words?.length ? l.words : (l.a || "").split(/\s+/).map(t => [t, "ok"]));
export function twoReaders(host, pages, told = () => {}) {
  pages = pages.filter(p => p?.lines?.length);
  if (!pages.length) { host.innerHTML = `<p class="cap">no example page in this library</p>`; return () => {}; }
  const frame = p => {
    const f = focusOf(p), l = p.lines[f], [x0, y0, x1, y1] = l.box, W = host.clientWidth - 28, s = Math.min(W / (x1 - x0), 64 / (y1 - y0));
    host.innerHTML = `<div class="tr-ms"><b>${esc(pageName(p))}</b><span class="k">not read yet</span><button type="button" tabindex="-1" class="tr-go">Read</button></div>
      <div class="tr-line"><i style="width:${(x1 - x0) * s}px;height:${(y1 - y0) * s}px;background-image:url('${imageUrl(p.stem)}');background-size:${p.width * s}px ${p.height * s}px;background-position:-${x0 * s}px -${y0 * s}px"></i></div>
      <div class="tr-r r1"><span class="k">Reader 1</span><span class="t"></span></div>
      <div class="tr-r r2"><span class="k">Reader 2</span><span class="t"></span></div>
      <div class="tr-r ag"><span class="k">together</span><span class="t">${wordsOf(l).map(([t, lv]) => `<span class="w ${LV[lv] || "ok"}">${esc(t)}</span>`).join(" ")}</span></div>
      <p class="tr-key k">green: both readers agree · yellow: partly · red: they differ</p>
      <div class="tr-page"></div><span class="cap">${esc(p.cite || "")}</span>`;
    return {f, l};
  };
  if (CALM.matches) {
    frame(pages[0]); host.classList.add("tr-still", "s-line", "s-ag");
    const l = pages[0].lines[focusOf(pages[0])];
    host.querySelector(".r1 .t").textContent = l.a; host.querySelector(".r2 .t").textContent = l.b; told("still"); return () => {};
  }
  let i = 0;
  return loop([async on => {
    const p = pages[i++ % pages.length]; host.classList.remove("tr-still", "s-line", "s-ag", "s-page");
    const {l} = frame(p), ptr = pointer(host);
    told("pick"); await sleep(900); if (!on()) return;
    await ptr.click(host.querySelector(".tr-go")); ptr.hide(); if (!on()) return;
    host.querySelector(".tr-ms .k").textContent = "reading…"; host.classList.add("s-line"); told("line"); await sleep(1100); if (!on()) return;
    const type = async (el, text, k) => { told(k); for (const w of text.split(/\s+/)) { if (!on()) return; el.textContent += (el.textContent ? " " : "") + w; await sleep(170); } };
    await type(host.querySelector(".r1 .t"), l.a || "", "r1"); await sleep(500); if (!on()) return;
    await type(host.querySelector(".r2 .t"), l.b || "", "r2"); await sleep(800); if (!on()) return;
    host.classList.add("s-ag"); told("ag"); await sleep(3200); if (!on()) return;
    host.classList.add("s-page"); told("page");
    const box = host.querySelector(".tr-page");
    for (const ln of p.lines.slice(0, 16)) { if (!on()) return; box.insertAdjacentHTML("beforeend", `<div>${wordsOf(ln).map(([t, lv]) => `<span class="w ${LV[lv] || "ok"}">${esc(t)}</span>`).join(" ")}</div>`); box.scrollTop = box.scrollHeight; await sleep(240); }
    host.querySelector(".tr-ms .k").textContent = "read"; told("done"); await sleep(3600);
  }]);
}
export function wholeLib(host, D, sc, told = () => {}) {
  if (CALM.matches) { told("cmp"); return compare(host, sc?.compare); }
  return loop([
    async on => {
      if (!D?.lib) return;
      host.classList.add("clear"); host.innerHTML = "";
      const labs = document.createElement("div"); labs.className = "ar-labs"; document.body.append(labs);
      const r = host.getBoundingClientRect(), Ls = layouts(D, {x: r.left + 8, y: r.top + 26, w: r.width - 16, h: r.height - 60}).slice(0, 2);
      told("arr");
      for (const L of Ls) { if (!on()) break; await showLayout(L, labs); await sleep(3800); }
      labs.remove(); await release(700); host.classList.remove("clear");
    },
    async on => { told("find"); if (sc?.search) await runFor(() => search(host, sc.search), 13000, on); },
    async on => { told("cmp"); if (sc?.compare) await runFor(() => compare(host, sc.compare), 11000, on); },
  ]);
}
const PAGE = [
  ["Consider what effects, that might conceiv-", "Consider what <u>e ects</u>, that might <u>conceiv-</u>", "Consider what <u>effects</u>, that might <u>conceivably</u>"],
  ["ably have practical bearings, we conceive", "<u>ably</u> have practical bearings, we <u>con ceive</u>", "have practical bearings, we <u>conceive</u>"],
  ["the object of our conception to have. Then,", "the object of our conception to have. Then,", "the object of our conception to have. Then,"],
  ["our conception of these effects is the whole", "our conception of these <u>e ects</u> is the whole", "our conception of these <u>effects</u> is the whole"],
  ["of our conception of the object.", "of our conception of the object.", "of our conception of the object."]];
export function mirror(host) {
  const col = j => PAGE.map(l => l[j]).join(j === 2 ? " " : "<br>");
  host.innerHTML = `<div class="mr"><div class="mr-c mr-pdf"><b>PDF</b><div class="mr-pg">${col(0)}</div></div>
    <i class="mr-a">→</i><div class="mr-c mr-raw"><b>plain text</b><div class="mr-t">${col(1)}</div></div>
    <i class="mr-a">→</i><div class="mr-c mr-ok"><b>cleaned up</b><div class="mr-t">${col(2)}</div></div></div>
    <p class="mr-note k">Example page: How to Make Our Ideas Clear (1878). Your PDF is never changed.</p>`;
  const m = host.querySelector(".mr");
  if (CALM.matches) { m.classList.add("s1", "s2"); return () => {}; }
  return loop([async on => {
    m.classList.remove("s1", "s2"); await sleep(1600); if (!on()) return;
    m.classList.add("s1"); await sleep(2800); if (!on()) return;
    m.classList.add("s2"); await sleep(4500);
  }]);
}
export {search, compare};
export function askLib(host, s, told = () => {}, ex = null) {
  const P = plan(ex);
  if (P) return askReal(host, P, told);
  if (!s?.manuscripts?.length) { host.innerHTML = `<p class="cap">no example search in this library</p>`; return () => {}; }
  const Q = `Where does Peirce talk about ${s.q}, and in what contexts?`, SEARCHES = [s.q, "abductive", "retroduction"];
  const res = [...s.manuscripts.map(h => ({cite: h.cite, text: h.text, ms: true})), ...s.editions.map(h => ({cite: h.cite}))].slice(0, 6);
  const ctx = h => /correspondence/i.test(h.cite) ? "In letters" : /Dict|Baldwin/i.test(h.cite) ? "In his dictionary work" : /Lecture/i.test(h.cite) ? "In his lectures" : null;
  const groups = []; res.forEach((h, i) => { const c = ctx(h); if (!c) return; const g = groups.find(x => x.c === c) || (groups.push({c, n: []}), groups[groups.length - 1]); g.n.push(i + 1); });
  const ed = res.map((h, i) => h.ms ? null : i + 1).filter(Boolean); if (ed.length) groups.push({c: "In the printed editions", n: ed});
  const hiq = t => esc(t).replace(new RegExp(`(${s.q.slice(0, 7)}\\w*)`, "ig"), "<mark>$1</mark>");
  host.innerHTML = `<div class="ak"><div class="ak-h"><b>Librarian</b> <span class="k">· Ask a question · example</span></div>
    <div class="ak-q"></div><div class="ak-row"><button type="button" tabindex="-1" class="ak-p">Propose searches</button></div>
    <div class="ak-chips"></div><div class="ak-row"><button type="button" tabindex="-1" class="ak-g" hidden>Search, then group</button></div>
    <div class="ak-res"></div><div class="ak-out"></div></div>
    <div class="ak-rd" hidden><div class="ak-rdh"><b></b><span class="k">machine reading</span></div><div class="ak-rdt"></div></div>`;
  const $q = c => host.querySelector(c), ptr = pointer(host);
  const row = (h, i) => `<div class="ak-r" data-i="${i}"><span class="lbref">${i + 1}</span><b>${esc(h.cite)}</b>${h.text ? ` <span class="k">${hiq(h.text)}</span>` : ""}</div>`;
  const R = () => res.map(row).join("");
  const G = () => groups.map(g => `<p>${esc(g.c)} ${g.n.map(n => `<span class="lbref">${n}</span>`).join("")}</p>`).join("");
  if (CALM.matches) { $q(".ak-q").textContent = Q; $q(".ak-chips").innerHTML = SEARCHES.map(x => `<span class="ak-c">${esc(x)}</span>`).join(""); $q(".ak-res").innerHTML = R(); $q(".ak-out").innerHTML = G(); told("still"); return () => {}; }
  return loop([async on => {
    host.querySelector(".ak").hidden = false; $q(".ak-rd").hidden = true;
    $q(".ak-q").textContent = ""; $q(".ak-chips").innerHTML = ""; $q(".ak-res").innerHTML = ""; $q(".ak-out").innerHTML = ""; $q(".ak-g").hidden = true;
    told("ask"); for (const ch of Q) { if (!on()) return; $q(".ak-q").textContent += ch; await sleep(38); }
    await sleep(500); await ptr.click($q(".ak-p")); if (!on()) return;
    told("suggest"); for (const x of SEARCHES) { if (!on()) return; $q(".ak-chips").insertAdjacentHTML("beforeend", `<span class="ak-c">${esc(x)}</span>`); await sleep(450); }
    $q(".ak-g").hidden = false; await sleep(700); await ptr.click($q(".ak-g")); if (!on()) return;
    told("results"); for (let i = 0; i < res.length; i++) { if (!on()) return; $q(".ak-res").insertAdjacentHTML("beforeend", row(res[i], i)); await sleep(300); }
    await sleep(700); if (!on()) return;
    told("open");
    for (const i of res.map((h, i) => h.ms ? i : -1).filter(i => i >= 0).slice(0, 2)) {
      if (!on()) return; const row = $q(`.ak-r[data-i="${i}"]`); if (!row) continue;
      await ptr.click(row); ptr.hide(); if (!on()) return;
      $q(".ak-rd b").textContent = res[i].cite; $q(".ak-rdt").innerHTML = hiq(res[i].text); $q(".ak-rd").hidden = false; host.querySelector(".ak").hidden = true;
      await sleep(3200); if (!on()) return;
      $q(".ak-rd").hidden = true; host.querySelector(".ak").hidden = false; await sleep(500);
    }
    if (!on()) return;
    told("group"); $q(".ak-out").innerHTML = `<p class="k">Grouped by context:</p>` + G(); await sleep(3800);
    await sleep(1500);
  }]);
}
function askReal(host, P, told) {
  const hiq = marker(P.searches);
  host.innerHTML = `<div class="ak"><div class="ak-h"><b>Librarian</b> <span class="k">· Ask a question · example</span></div>
    <div class="ak-q"></div><div class="ak-row"><button type="button" tabindex="-1" class="ak-p">Propose searches</button></div>
    <div class="ak-chips"></div><div class="ak-row"><button type="button" tabindex="-1" class="ak-g" hidden>Search, then group</button></div>
    <div class="ak-res"></div><div class="ak-out"></div></div>
    <div class="ak-rd long" hidden><div class="ak-rdh"><b></b><span class="k">machine reading</span></div><div class="ak-rdt"></div></div>`;
  const $q = c => host.querySelector(c), ptr = pointer(host), ak = $q(".ak");
  const row = h => `<div class="ak-r one" data-n="${h.n}">${chip(h.n)}<b>${esc(h.citation)}</b>${h.reading ? ` <span class="k">${hiq(h.reading)}</span>` : ""}</div>`;
  let rows = P.rows, left = P.more;
  const more = () => left ? `<p class="k ak-more">and ${left} more</p>` : "";
  const G = () => P.none ? `<p class="k">The model says none of these results bears on the question.</p>`
    : P.error ? `<p class="k">${esc(P.error)}</p>`
    : (P.lead.length ? `<p class="ak-s">${P.lead.map(x => withRefs(x.text)).join(" ")}</p>` : "") +
      P.groups.map(g => `<div class="ak-grp"><p>${g.ok ? esc(g.name) : "<i>a group whose name was not shown</i>"} ${g.refs.map(chip).join("")}</p>${g.ss.length ? `<p class="ak-s">${g.ss.map(x => withRefs(x.text)).join(" ")}</p>` : ""}</div>`).join("");
  const grouped = () => { ak.classList.add("grouped"); $q(".ak-out").innerHTML = `<p class="k">Grouped by context:</p>` + G(); };
  const scrollBy = async (el, ms, on) => {
    el.scrollTop = 0; await sleep(2500);
    const far = el.scrollHeight - el.clientHeight, steps = Math.max(1, Math.round((ms - 4500) / 60));
    if (far <= 0) { await sleep(ms - 2500); return; }
    for (let i = 1; i <= steps; i++) { if (!on()) return; el.scrollTop = far * i / steps; await sleep(60); }
    await sleep(2000);
  };
  if (CALM.matches) {
    ak.classList.add("still");
    $q(".ak-q").textContent = P.question; $q(".ak-chips").innerHTML = P.searches.map(x => `<span class="ak-c">${esc(x)}</span>`).join("");
    $q(".ak-res").innerHTML = P.rows.map(row).join("") + more();
    $q(".ak-out").innerHTML = `<p class="k">Grouped by context:</p>` + G(); told("still"); return () => {};
  }
  $q(".ak-q").textContent = P.question; $q(".ak-chips").innerHTML = P.searches.map(x => `<span class="ak-c">${esc(x)}</span>`).join("");
  $q(".ak-g").hidden = false; $q(".ak-res").innerHTML = rows.map(row).join("") + more();
  const opened = new Set(P.picks.map(h => h.n));
  while (ak.scrollHeight > ak.clientHeight) {
    const drop = [...rows].reverse().find(h => !opened.has(h.n)); if (!drop) break;
    rows = rows.filter(h => h !== drop); left++; $q(".ak-res").innerHTML = rows.map(row).join("") + more();
  }
  return loop([async on => {
    ak.hidden = false; $q(".ak-rd").hidden = true; ak.classList.remove("grouped");
    $q(".ak-q").textContent = ""; $q(".ak-chips").innerHTML = ""; $q(".ak-res").innerHTML = ""; $q(".ak-out").innerHTML = ""; $q(".ak-g").hidden = true;
    told("ask"); for (const ch of P.question) { if (!on()) return; $q(".ak-q").textContent += ch; await sleep(38); }
    await sleep(500); await ptr.click($q(".ak-p")); if (!on()) return;
    told("suggest"); for (const x of P.searches) { if (!on()) return; $q(".ak-chips").insertAdjacentHTML("beforeend", `<span class="ak-c">${esc(x)}</span>`); await sleep(450); }
    $q(".ak-g").hidden = false; await sleep(700); await ptr.click($q(".ak-g")); if (!on()) return;
    told("results"); for (const h of rows) { if (!on()) return; $q(".ak-res").insertAdjacentHTML("beforeend", row(h)); await sleep(300); }
    $q(".ak-res").insertAdjacentHTML("beforeend", more());
    await sleep(900); if (!on()) return;
    told("open");
    for (const h of P.picks) {
      if (!on()) return; const r = $q(`.ak-r[data-n="${h.n}"]`); if (!r) continue;
      await ptr.click(r); ptr.hide(); if (!on()) return;
      $q(".ak-rd b").textContent = h.citation; $q(".ak-rdt").innerHTML = hiq(h.reading); $q(".ak-rd").hidden = false; ak.hidden = true;
      await scrollBy($q(".ak-rdt"), 7000, on); if (!on()) return;
      $q(".ak-rd").hidden = true; ak.hidden = false; await sleep(500);
    }
    if (!on()) return;
    told("group"); grouped(); await scrollBy($q(".ak-out"), 11000, on);
  }]);
}
const cropOf = (p, [x0, y0, x1, y1], s) =>
  `width:${Math.round((x1 - x0) * s)}px;height:${Math.round((y1 - y0) * s)}px;background-image:url('${imageUrl(p.stem)}');background-size:${p.width * s}px ${p.height * s}px;background-position:-${x0 * s}px -${y0 * s}px`;
const fit = (box, w, h) => Math.min(w / (box[2] - box[0]), h / (box[3] - box[1]));
const markedLine = t => esc(t).replace(/~([^~]+)~/g, `<s class="mk-s">$1</s>`).replace(/\{([^}]+)\}/g, `<span class="mk-i">$1</span>`);
export function helpBoxes(L, R, sc, told = () => {}, {only = null} = {}) {
  const tour = sc?.tour || [], K = tour.find(t => t.role === "struck"), G = tour.find(t => t.role === "line"), D = tour.find(t => t.role === "diagram");
  const l = K?.focus != null ? K.lines[K.focus] : null;
  if (!l || !K.his) { L.innerHTML = R.innerHTML = `<p class="cap">no example line in this library</p>`; return () => {}; }
  const ms = pageName(K).replace(/, p\. .*/, "");
  const lineBox = [l.box[0] - 6, l.box[1] - (l.box[3] - l.box[1]) * .9, l.box[2] + 6, l.box[3] + 6];
  const crop = (w, h) => `<i class="hb-crop" style="${cropOf(K, lineBox, fit(lineBox, w, h))}"></i>`;
  const machine = `<span class="hb-t">${wordsOf(l).map(([t, lv]) => `<span class="w ${LV[lv] || "ok"}">${esc(t)}</span>`).join(" ")}</span>`;
  const W = Math.max(160, L.clientWidth - 40);
  L.innerHTML = `<div class="hs">
      <div class="hs-box mine"><span class="k">your Mac · ${esc(pageName(K))}</span>${crop(W, 30)}
        <div class="hs-r m"><span class="k">machine</span>${machine}</div>
        <div class="hs-r y"><span class="k">your fix</span><span class="hb-t yours">${markedLine(K.his)}</span></div></div>
      <i class="hb-ar">↓</i>
      <div class="hs-box theirs"><span class="k">another user with ${esc(ms)}</span>
        <div class="hs-r m"><span class="k">machine</span>${machine}</div>
        <div class="hs-r y"><span class="k">from another user</span><span class="hb-t yours">${markedLine(K.his)}</span></div></div></div>`;
  const fx = [];
  fx.push({lab: "retyped", html: crop(150, 30)});
  if (G?.missed) { const m = G.missed, b = [m[0] - 6, m[1] - 6, m[2] + 6, m[3] + 6]; fx.push({lab: "line drawn", html: `<i class="hb-crop" style="${cropOf(G, b, fit(b, 150, 30))}"></i>`}); }
  if (D?.missed) { const m = D.missed; fx.push({lab: "drawing boxed", html: `<i class="hb-crop" style="${cropOf(D, m, fit(m, 80, 46))}"></i>`}); }
  R.innerHTML = `<div class="ht">
      <div class="ht-col fixes"><span class="k">your fixes</span>${fx.map(f => `<div class="ht-fix">${f.html}<span class="k">${esc(f.lab)}</span></div>`).join("")}</div>
      <i class="hb-ar">→</i><div class="ht-col hq"><b>Peirceptron HQ</b><span class="k">training</span></div>
      <i class="hb-ar">→</i><div class="ht-col new"><span class="k">new readers</span><div class="ht-rd">Reader 1</div><div class="ht-rd">Reader 2</div></div></div>`;
  const cards = [L.closest(".tw-card"), R.closest(".tw-card")], mine = L.querySelector(".mine"), other = L.querySelector(".theirs"), T = R.querySelector(".ht");
  const which = only === "train" ? 1 : only === "share" ? 0 : -1;
  cards.forEach((c, i) => { c?.classList.toggle("lit", which === i); c?.classList.toggle("dim", which >= 0 && which !== i); });
  const done = () => cards.forEach(c => c?.classList.remove("lit", "dim"));
  const end = {share: () => { mine.classList.add("s1"); other.classList.add("on", "s1"); }, train: () => T.classList.add("s1", "s2")};
  if (CALM.matches || which < 0) { end.share(); end.train(); told("still"); return done; }
  if (which === 0) end.train(); else end.share();
  const play = which === 0 ? [async on => {
    mine.classList.remove("s1"); other.classList.remove("on", "s1");
    await sleep(1400); if (!on()) return;
    told("tidy"); mine.classList.add("s1"); await sleep(1800); if (!on()) return;
    told("share"); other.classList.add("on"); await sleep(1200); if (!on()) return;
    other.classList.add("s1"); await sleep(3600);
  }] : [async on => {
    T.classList.remove("s1", "s2");
    await sleep(1200); if (!on()) return;
    told("train"); T.classList.add("s1"); await sleep(1300); if (!on()) return;
    await told("pulse"); T.classList.add("s2"); await sleep(3200);
  }];
  const stop = loop(play);
  return () => { stop(); done(); };
}
export async function flourish({order, glow, walk, glasses, on = () => true}) {
  if (CALM.matches) { glow(order); return; }
  const col = tok("--s1", "#3d7ef0");
  for (const id of order) { if (!on()) return; glow([id]); await pause(170); }
  for (const r of [["src", "ms", "det", "pre", "r1", "lib"], ["src", "ms", "det", "pre", "r2", "lib"], ["src", "lp", "pdf", "st", "lib"], ["src", "le", "pdf", "st", "lib"], ["ms", "st", "lib"]]) {
    if (!on()) return; walk(r, col); await pause(260);
  }
  await pause(1700); if (!on()) return;
  glasses(col); glow(order); await pause(900);
}
