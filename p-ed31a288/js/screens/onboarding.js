import {$, esc, on} from "../lib/dom.js";
import {demoEnd, demoStart, get, inDemo, post} from "../lib/api.js";
import {S, save, demo, showcase, enqueue, dequeue} from "../lib/onbstate.js";
import {DEMO_START, demoSetup} from "../lib/onb/demodata.js";
import {DEMO_FROM} from "../lib/demomark.js";
import {CALM, atFolder, cellRect, darken, fadeWires, follow, fx, grid, light, outline, pipeIds, pulse, squarePipes, tok, unwire, wire} from "../lib/onb/stage.js";
import {compare, fast, reels, search} from "../lib/onb/shows.js";
import {fixes, hard, tourPage} from "../lib/onb/tour.js";
import {draftTree} from "../lib/onb/story.js";
import {askLib, flourish, helpBoxes, mirror, sortThree, twoCards, twoReaders, wholeLib} from "../lib/onb/acts.js";
import {pair, play} from "../lib/onb/loops.js";
import {glow, mount as mountScheme, nodeEl, route, show as scheme, slot, walk} from "../lib/onb/scheme.js";
import {COL, FOLDER, ZMARK} from "../lib/schematic.js";
import {enter as linkEnter, glasses, poll, relight, dropZone, replaceNext, setRoute, laterIsBack} from "../lib/onb/link.js";
import {leaveOvernight, loadTopics, overnight, timeOwnPages, topics} from "../lib/onb/choose.js";
import {fmtDur, fmtLeft, TONIGHT, unknown} from "../lib/ring.js";
import {start as preload, on as onLoad, finished as loaded, line as loadLine, share as loadShare, took} from "../lib/onb/preload.js";
import {failNote, loadingNote} from "../lib/state.js";
import {modelsFor} from "../lib/modelget.js";
import {ASKS, always, answer, answers, applying, card as actCard, download, lineOf, passBy, use as useApprovals} from "../lib/approvals.js";
import {num, plural} from "../lib/fmt.js";
const DRAFT = `<i class="dr" title="drafted"></i>`;
const card = (h, items, extra = "") => `<h2 class="hd">${h}</h2>${items.length ? `<ul class="bl">${items.map(([k, t]) => `<li data-b="${k}">${t}</li>`).join("")}</ul>` : ""}${extra}`;
const W = {
  what: `<p class="big">The Peirceptron is a collection of tools designed for Peirce scholars.</p>`,
  two: `<p class="big">It uses your library of Peirce's writings to:</p>`,
  link: () => linkedNow() ? `<p class="big">${esc(S.runs.map(r => r.label).filter(Boolean).join(" · ") || "Your library")}</p><p class="then">Linked.</p><p><button type="button" class="mini" data-linkmore>Link another</button></p>`
    : EMPTY ? `<p class="big">Nothing of Peirce's was found in ${esc(EMPTY)}.</p><p class="then">Link another folder or Zotero collection.</p>`
    : `<p class="big">To get started, link to a folder or Zotero collection containing your Peirce library.</p><p class="then">(The Peirceptron will not alter or share anything you connect.)</p>`,
  "r-sort": () => card(`First, it sorts your library into three categories.`, [
    ["ms", `Manuscripts`], ["lp", `Lifetime publications`], ["le", `Later editions`]]),
  "r-reels": () => card(`If you have any manuscripts, whether individual or as part of a reel, it will try to sort them for you.`, [
    ["frames", `${DRAFT}a reel's frames`], ["split", `${DRAFT}which frames are which manuscript`], ["stacks", `${DRAFT}each manuscript stacked and labelled`]]),
  "r-read": () => card(`MSs are then prepared to be read, and then read by two different readers, both trained to read Peirce's handwriting.`, [
    ["found", `finding the drawings`], ["found", `finding the lines`], ["cut", `cutting them out`],
    ["two", `The Peirceptron uses two readers that read in different ways, so their agreement can be used as a sort of confidence score.`],
    ["local", `This happens locally on your computer and uses your copies of the manuscripts.`]],
    `<div class="readers" id="readers"></div>`),
  "r-whole": () => card(`In addition, this helps you organize and work with your whole library.`, [
    ["arr", `${DRAFT}arrange it`], ["find", `${DRAFT}search it`], ["read", `${DRAFT}read it beside the scans`]]),
  "r-search": () => card(`To do so, it creates cleaned up mirrors of your PDFs and indexes them with its search tools, which make them searchable and comparable.`,
    FLIP.map(f => [f.key, f.label]), `<p class="sm">All of this happens locally on your machine. Nothing is shared.</p>`),
  "r-lib": () => card(`If you'd like, you can also attach a locally running LLM to act as a librarian.`, [
    ["", `You can ask it questions about your results, have it suggest searches or related works, ${DRAFT}or group a search's results by context, each line pointing to its passage.`]],
    `<p class="k" id="lmline"></p>`),
  confirm: () => card(`Please confirm that you are happy to:`, [],
    `<p class="sm">None of your files will be changed or shared.</p><div class="acts" id="confirms"><p class="k">${loadingNote("what your files need")}</p></div>`),
  "r-when": () => `<h2 class="hd">It can take a while to read all the manuscripts.</h2>
    <p>If you'd like you can set up a schedule to have them read when your machine is idle.</p>
    <p>In addition, you can prioritize MSs on certain topics of interest.</p>
    <div class="k" id="whenline">${loadingNote("the estimate")}</div>` +
    actCard({q: "Would you like to set up either now?", buttons: [
      [OVDONE.has("night") ? "✓ Schedule set" : "Set a schedule", `data-go="night"${OVDONE.has("night") ? ` class="done"` : ` class="go"`}`],
      [OVDONE.has("topics") ? "✓ Topics chosen" : "Choose topics", `data-go="topics"${OVDONE.has("topics") ? ` class="done"` : ` class="go"`}`],
      [OVDONE.size === 2 ? "Next" : "Later", `data-go="r-hard" class="quiet"`]]}),
  "r-hard": () => card(`The Peirceptron is still being developed. Peirce really puts an automated reader through its paces.`, [
    ["greek", `${DRAFT}Greek: both readers write it in Latin letters. There is space for a Greek reader.`],
    ["other", `${DRAFT}Other scripts: the same, with space for their reader.`],
    ["maths", `${DRAFT}Maths is read as words. There is space for a maths reader.`],
    ["struck", `${DRAFT}A struck word with a word written above it: the readers run them together.`],
    ["inserted", `${DRAFT}A word written above the line: the readers misplace it.`]]),
  "r-fix": () => card(`It comes with the tools you need to correct its mistakes.`, [
    ["type", `${DRAFT}A wrong reading: retype it`],
    ["line", `${DRAFT}A line missed: draw it, or stretch it`],
    ["fig", `${DRAFT}A drawing missed: box it`],
    ["help", `${DRAFT}Anything else: describe the problem`],
    ["", `These fixes are saved locally, so you only have to do them once.`]]),
  "r-help": () => card(`However, there are two ways your fixes can help other Peirceptron users, if you'd like.`, [],
    `<p class="sm">This is all anonymous (unless you elect to share a username) and the Peirceptron does not collect any data from you aside from these corrections, should you decide to share them.</p>`),
  "r-done": () => `<h2 class="hd">Thank you!</h2><div id="doneline" class="k">${loadingNote("sorting")}</div><p class="k"><a href="settings.html#approvals">Approvals in Settings</a></p>`,
};
const FLIP = [
  {key: "clean", label: "Your PDFs, cleaned up", lit: ["pdf"], dur: 9000, show: () => mirror($("show"))},
  {key: "index", label: "Indexed by the search tools", lit: ["st"], dur: 9000, show: sc => search($("show"), sc?.search, () => {}, tourPage(sc, "clean") || S.demo?.page, {buildOnly: true})},
  {key: "find", label: "Searched", lit: ["st", "lib"], show: sc => loopOr(play($("show"), "meaning"), () => loopOr(play($("show"), "search"), () => search($("show"), sc?.search)))},
  {key: "cmp", label: "Versions compared", lit: ["lib"], show: sc => loopOr(play($("show"), "compare"), () => compare($("show"), sc?.compare))},
  {key: "drafts", label: "A work's drafts, in order", lit: ["lib"], show: sc => loopOr(play($("show"), "drafts"), () => draftTree($("show"), sc?.drafts))},
];
const HARD = ["greek", "other", "maths", "struck", "inserted"];
const FIX = ["type", "line", "fig", "help"];
const FOLDERS = ["ms", "lp", "le"], READING = ["det", "pre", "r1", "r2"], ALL = ["src", ...FOLDERS, ...READING, "pdf", "st", "lib"];
const TO_HEAD = [["ms", "lib", "det"], ["lp", "lib", "pdf"], ["le", "lib", "pdf"], ["det", "lib", "pre"], ["pre", "lib", "r1"]];
const TO_ST = [["lp", "st", "pdf"], ["le", "st", "pdf"]];
const EVERY = [...ALL, "q", "xs", "lbn"];
const SCM = {
  "r-sort": {on: ["src", ...FOLDERS, "lib"], lit: FOLDERS, extra: TO_HEAD},
  "r-reels": {on: ["src", ...FOLDERS, "det", "lib"], dim: ["lp", "le"], lit: ["det"], extra: TO_HEAD},
  "r-read": {on: ["src", ...FOLDERS, ...READING, "lib"], dim: ["lp", "le"], lit: ["pre"], extra: TO_HEAD},
  "r-whole": {on: ["src", ...FOLDERS, ...READING, "st", "lib"], lit: ["st"], extra: TO_ST},
  "r-search": {on: ALL, lit: ["pdf", "st"]},
  "r-lib": {on: [...ALL, "lbn"], lit: ["lbn"]},
  confirm: {on: EVERY.filter(x => x !== "xs" && x !== "q")},
  "r-when": {on: [...ALL, "q", "lbn"], lit: ["q"]},
  "r-hard": {on: [...ALL, "xs", "lbn"], dim: ["lp", "le", "pdf", "st"], lit: ["xs"]},
  "r-fix": {on: [...ALL, "xs", "lbn"], dim: ["lp", "le", "pdf", "st"]},
  "r-help": {on: EVERY},
  "r-done": {on: EVERY},
};
const PANELS = [
  {id: "start", next: "Get started"},
  {id: "what"},
  {id: "two", show2: true},
  {id: "link", layout: "link"},
  {id: "r-sort", run: true, steps: ["ms", "lp", "le"], show: (sc, told) => loopOr(play($("show"), "sort", {told}),
    () => arrData().then(D => S.O.step === "r-sort" ? sortThree($("show"), D.demo, D.lib, nodeEl("src")) : () => {}))},
  {id: "r-reels", run: true, steps: ["frames", "split", "stacks"], show: (sc, told) => reels($("show"), S.demo?.reel, told)},
  {id: "r-read", run: true, steps: ["found", "cut", "two"], stepOf: {found: "found", line: "cut", cut: "cut", r1: "two", r2: "two", ag: "two", page: "two", done: "two"},
    show: (sc, told) => loopOr(play($("show"), "read", {told}), () => twoReaders($("show"), [tourPage(sc, "clean"), tourPage(sc, "diagram")], told)),
    told: k => readStep(k)},
  {id: "r-whole", run: true, parts: [
    {key: "arr", show: sc => loopOr(play($("show"), "wall"), () => arrData().then(D => S.O.step === "r-whole" ? wholeLib($("show"), D, sc) : () => {}))},
    {key: "find", lit: ["st"], show: sc => loopOr(play($("show"), "search"), () => search($("show"), sc?.search))},
    {key: "read", show: sc => loopOr(play($("show"), "reader"), () => compare($("show"), sc?.compare))}]},
  {id: "r-search", run: true, parts: FLIP},
  {id: "r-lib", run: true, steps: ["ask", "suggest", "results", "group"], stepOf: {ask: "ask", suggest: "suggest", results: "results", open: "results", group: "group"},
    show: (sc, told) => askLib($("show"), sc?.search, told)},
  {id: "confirm", run: true},
  {id: "r-when", run: true},
  {id: "topics", layout: "over", over: "ov-topics", back: "r-when", next: "Done"},
  {id: "night", layout: "over", over: "ov-night", back: "r-when", next: "Done"},
  {id: "r-hard", run: true, parts: HARD.map(k => ({key: k, dur: 8500, show: sc => hard($("show"), sc?.tour, hardStep, {only: k})}))},
  {id: "r-fix", run: true, parts: FIX.map(k => ({key: k, dur: 9500, show: sc => fixes($("show"), sc?.tour, fixStep, {train: false, only: k})}))},
  {id: "r-help", run: true, help: true, parts: ["share", "train"].map(k => ({key: k, dur: 9000, show: sc => helpBoxes($("hp-l"), $("hp-r"), sc, helpStep, {only: k})}))},
  {id: "r-done", run: true, next: "Finish"},
];
const IDS = PANELS.map(p => p.id);
async function loopOr(p, fallback) { return (await p) || fallback(); }
const OLD = {"r-pre": "r-read", first: "two", read: "two", diagram: "two", hard: "two", fix: "two", second: "two", compare: "two", search: "two", tools: "two", plan: "two",
  perm: "r-sort", "p-split": "r-sort", "p-text": "r-sort", "p-tidy": "r-sort", "p-search": "r-sort", have: "r-done",
  "r-eds": "r-search", "r-compare": "r-search", "r-drafts": "r-search", "r-arrange": "r-whole", "r-tools": "confirm"};
let stops = [], SC = null, STATUS = 0, LEAVING = false, TIDY = [];
let RELINK = false, EMPTY = "";
const linkedNow = () => S.runs.length > 0 && !RELINK;
const peirceFound = () => (S.summary?.rows || []).filter(r => r.kind !== "other").reduce((t, r) => t + (r.count ?? r.so_far ?? 0), 0);
const OVDONE = new Set((() => { try { return JSON.parse(sessionStorage.getItem("pc_ovdone") || "[]"); } catch (e) { return []; } })());
const hi = k => document.querySelectorAll("#say [data-b]").forEach(li => li.classList.toggle("on", !!k && li.dataset.b === k));
const applies = k => !!TIDY.find(t => t.key === k)?.applies;
const pause = ms => new Promise(r => setTimeout(r, ms));
const BLUE = "#3d7ef0", GREEN = "#22c38a";
const msKey = stem => stem ? "ms:" + (stem.match(/^0*(\d+[a-z]?)/i)?.[1] || "") : "";
async function readStep(name) {
  if (S.O.step !== "r-read") return;
  const page = tourPage(SC, "clean"), ms = msKey(page?.stem);
  if (name === "pick") { glow(["ms"]); await fly(ms, nodeEl("ms")?.querySelector(".fi")); return; }
  if (name === "found" || name === "cut") { glow(["pre"]); if (name === "found") walk(["ms", "det", "pre"], BLUE); }
  if (name === "line") { glow(["pre"]); walk(["ms", "det", "pre"], BLUE); }
  if (name === "r1") { glow(["r1"]); walk(["pre", "r1"], BLUE); }
  if (name === "r2") { glow(["r2"]); walk(["pre", "r2"], BLUE); }
  if (name === "ag") glow(["r1", "r2"]);
  if (name === "done") { glow(["lib"]); walk(["r1", "lib"], BLUE, () => { glasses(BLUE); if (ms) light(ms, 0.6, "#2a55b0"); }); walk(["r2", "lib"], BLUE); }
  if (name === "still") glow(["r1", "r2"]);
}
function hardStep(name, k) {
  if (S.O.step !== "r-hard") return;
  if (name === "look") { glow(["pre"]); slot(null); walk(["det", "pre"], BLUE); }
  if (name === "read") { glow(["r1", "r2"]); walk(["pre", "r1"], BLUE); walk(["pre", "r2"], BLUE); }
  if (name === "slot") { glow(["xs"]); slot(k); walk(["pre", "xs"], "#e1715f"); }
  if (name === "still") { glow(["r1", "r2", "xs"]); slot(null); }
}
function fixStep(name, el) {
  if (S.O.step !== "r-fix") return Promise.resolve();
  if (name === "tool" || name === "still") { if (name === "still") glow(["r1", "r2"]); return Promise.resolve(); }
  if (name === "pulse") {
    glow([]); if (!el || CALM.matches) return Promise.resolve();
    const id = "fixp:" + Math.random().toString(36).slice(2, 7);
    wire(id, el, $("face"), "--w-load", "auto", 1.5); follow(1500);
    return new Promise(res => pulse(id, GREEN, () => { glasses(GREEN); glow(["lib"]); unwire(id); res(); }, 0.9));
  }
  return Promise.resolve();
}
function fly(key, to) {
  const r = key && cellRect(key), t = to?.getBoundingClientRect();
  if (!r || !t?.width || CALM.matches || document.body.dataset.sch !== "1") return Promise.resolve();
  light(key, 0.95, "#7db4ff");
  const d = document.createElement("i"); d.className = "flyer"; d.style.cssText = `left:${r.x}px;top:${r.y}px;width:${r.s}px;height:${r.s}px`;
  document.body.append(d);
  return new Promise(res => {
    setTimeout(() => { Object.assign(d.style, {left: `${t.left + t.width / 2 - 7}px`, top: `${t.top + t.height / 2 - 7}px`, width: "14px", height: "14px"}); }, 500);
    setTimeout(() => { d.classList.add("in"); light(key, 0.22, "#7db4ff"); }, 1450);
    setTimeout(() => { d.remove(); res(); }, 1750);
  });
}
const LIVE_MS = 450;
let LIVE_AT = 0;
function sortWires(on) {
  if (!on) { setRoute(null); return; }
  setRoute((it, col, dest) => {
    const f = !dest || dest === "other" ? null : dest === "MSS" ? "ms" : dest === "LP" ? "lp" : "le";
    const lightIt = () => { if (it.file) for (const k of it.corpus) light(k, 0.38); };
    const now = performance.now();
    if (!f || now - LIVE_AT < LIVE_MS || document.body.dataset.sch !== "1") { lightIt(); return; }
    LIVE_AT = now;
    walk(["src", f], col, () => walk(route(f), col, () => { glasses(col); lightIt(); }));
  });
}
function folderFigures() {
  const rows = Object.fromEntries((S.summary?.rows || []).map(r => [r.kind, r]));
  const fig = (r, unit = n => num(n)) => !r ? "" : r.count != null ? `${unit(r.count)}${r.of && !r.unit?.startsWith("vol") ? ` of ${num(r.of)}` : ""}` : r.so_far ? `${unit(r.so_far)} so far` : "not known yet";
  const set = (id, t) => { const lv = nodeEl(id)?.querySelector(".live"); if (lv) lv.textContent = t; };
  set("ms", [fig(rows.scan), rows.reel?.count ? plural(rows.reel.count, "reel", "reels") : rows.reel?.so_far ? `${plural(rows.reel.so_far, "reel", "reels")} so far` : ""].filter(Boolean).join(" · "));
  set("lp", fig(rows.lifetime));
  set("le", fig(rows.edition, n => plural(n, "volume", "volumes")));
  set("src", S.runs.map(r => r.label).filter(Boolean).join(" · "));
}
let PACE = [];
function sortState() {
  const runs = S.runs, looking = runs.some(r => r.state === "looking");
  const looked = runs.reduce((t, r) => t + (r.looked || 0), 0), total = runs.reduce((t, r) => t + (r.total || 0), 0);
  const now = Date.now(); PACE.push([now, looked]); PACE = PACE.filter(p => now - p[0] < 120000);
  let left = null;
  if (looking && total && PACE.length > 2) { const [t0, l0] = PACE[0], rate = (looked - l0) / ((now - t0) / 1000); if (rate > 0) left = (total - looked) / rate; }
  return {looking, looked, total, left, done: runs.length > 0 && !looking};
}
function sortLine() {
  const s = sortState();
  if (!S.runs.length) return "Nothing linked yet.";
  if (s.done && S.summary && !S.summary.complete) return `${plural(s.looked, "item", "items")} looked at · lining up the scans with the film`;
  if (s.done) return `Sorted: ${plural(s.looked, "item", "items")} looked at.`;
  return `${num(s.looked)}${s.total ? ` of ${num(s.total)}` : ""} looked at${s.left != null ? ` · ${(t => /^about/.test(t) ? t : "~" + t)(fmtDur(s.left))} left` : s.total ? "" : " · how many: being counted"}`;
}
let GOES = 0;
const BEFORE = ["start", "what", "two", "link"];
async function go(id, dir = 1) {
  const me = ++GOES;
  id = OLD[id] || id;
  if (!IDS.includes(id)) id = "start";
  if (id !== "link") { RELINK = false; EMPTY = ""; replaceNext(false); }
  const P = PANELS[IDS.indexOf(id)];
  stops.forEach(f => f && f()); stops = []; leaveOvernight();
  const wasShow = document.body.dataset.show === "1", wasP = S.O.step;
  const B = document.body;
  B.dataset.p = id;
  B.dataset.layout = P.layout || (id === "start" ? "start" : P.run ? "run" : "intro");
  const sc = SCM[id];
  B.dataset.sch = sc ? "1" : "";
  B.dataset.show = P.show || P.parts || P.help ? "1" : "";
  B.dataset.linked = linkedNow() ? "1" : ""; pdocsName();
  S.O.step = id; save({step: id});
  try { history.replaceState(null, "", "#" + id); } catch (e) {   }
  const say = $("say"), w = W[id];
  passBy(say); passBy($("helpc"));
  document.querySelectorAll("#helpc .asks").forEach(a => { a.innerHTML = ""; });
  say.innerHTML = typeof w === "function" ? w() : w || "";
  STEP = null;
  if (P.steps || P.parts) stepUI(P);
  $("toans").hidden = true;
  say.classList.toggle("cardy", !!P.run);
  const cords = BEFORE.includes(id) && !(id === "link" && linkedNow());
  if (cords) {
    const have = pipeIds();
    if (id === "start" ? !have.some(k => k.startsWith("pp:")) : !have.includes("pf:0")) { squarePipes($("pdocs"), $("face")); if (id !== "start") unwire("pp:"); }
    atFolder(id !== "start");
    if (id !== "start") fadeWires("pp:", 1100);
  } else if (pipeIds().length) { fadeWires("pp:", 900); fadeWires("pf:", 900); }
  if (!(id === "link" && linkedNow())) unwire("in");
  else wire("in", $("pdocs"), $("face"), "--w", "auto", 2.4);
  follow(1800);
  if (id === "what") stops.push(sortOut());
  if (id === "two" && dir > 0 && !CALM.matches && wasP === "what") {
    B.classList.add("cards-later");
    stops.push((t => () => { clearTimeout(t); B.classList.remove("cards-later"); })(setTimeout(() => B.classList.remove("cards-later"), 1400)));
  }
  scheme(sc ? sc : {on: []}, dir > 0);
  for (const el of document.querySelectorAll(".scm .live")) el.textContent = "";
  sortWires(!!P.run);
  if (P.run) folderFigures();
  $("next").textContent = P.next || (id === "link" ? "See how it works" : "Next");
  $("next").disabled = false;
  if (id === "start") boot(); else leaveBoot();
  $("back").hidden = id === "start";
  $("nomss").hidden = true;
  document.querySelectorAll(".over").forEach(o => { o.hidden = o.id !== P.over; });
  const show = $("show");
  if (wasShow && P.show && !CALM.matches) { show.classList.add("swap"); await pause(220); if (S.O.step !== id) return; }
  show.className = "show"; show.innerHTML = "";
  for (const h of ["tw-l", "tw-r", "hp-l", "hp-r"]) $(h).innerHTML = "";
  if (S.runs.length || S.O.run) laterIsBack();
  if (id === "link" && dir > 0 && wasP === "two") darken(0.65);
  if (P.layout || P.run) setTimeout(relight, 0);
  if (id !== "topics") outline([]);
  if (P.run) { await loadTidy(); if (S.O.step !== id) return; asks(); }
  if (P.show || P.parts || P.show2 || P.help) {
    if (!S.demo) await demo();
    if (!SC) { show.innerHTML = `<p class="cap">loading the example…</p>`; SC = await showcase(); }
    slot(null);
    if (S.O.step !== id || me !== GOES) return;
    show.innerHTML = "";
    if (P.steps || P.parts) { stepper(P, me); }
    else if (P.show) { const r = await P.show(SC); if (S.O.step !== id || me !== GOES) { r?.(); return; } if (typeof r === "function") stops.push(r); }
    if (P.show2) { const D = await arrData(); if (S.O.step !== id || me !== GOES) return;
      const cards = [$("tw-l"), $("tw-r")].map(h => h.closest(".tw-card"));
      const two = await pair(cards, [$("tw-l"), $("tw-r")], "read", ["wall", "search", "reader"]);
      if (S.O.step !== id || me !== GOES) { two?.(); return; }
      stops.push(two || twoCards($("tw-l"), $("tw-r"), {pages: [tourPage(SC, "clean"), tourPage(SC, "diagram")], demo: S.demo, lib: D.lib, sc: SC, from: $("pdocs")})); }
    if (P.help && !P.parts) stops.push(helpBoxes($("hp-l"), $("hp-r"), SC, helpStep));
  }
  if (id === "link") { const r = await linkEnter(); if (typeof r === "function") stops.push(r); }
  if (P.layout === "over") { unwire("out:"); }
  if (id === "r-read") readersRow();
  if (id === "r-lib") lmLine();
  if (id === "confirm") confirms();
  if (id === "r-when") { await readItem(); whenLine(); }
  if (id === "topics") { post("/import/queue/start").catch(() => {}); await topics(); }
  if (id === "night") { await readItem(); await overnight(SC); }
  if (id === "r-done") { FLOURISHED = false; }
  if (id !== "start" && (S.runs.length || P.run || ["link", "topics", "night"].includes(id))) status(); else { clearTimeout(STATUS); $("status").innerHTML = ""; $("stfail").innerHTML = ""; $("sline").textContent = ""; $("sbar").hidden = true; }
  toAnswer();
  $("next").focus({preventScroll: true});
}
const SORT3 = [["ms", 6], ["lp", 2], ["le", 2]];
function sortOut() {
  const box = $("sorted3"), fs = [...box.querySelectorAll(".so3")];
  fs.forEach(f => { wire("s3:" + f.dataset.k, $("face"), f, "--w-pipe", "auto", 2.4); });
  follow(1200);
  if (CALM.matches) return () => unwire("s3:");
  let live = true, T = 0;
  const kinds = SORT3.flatMap(([k, n]) => Array(n).fill(k));
  const one = () => {
    if (!live) return;
    const k = kinds[Math.floor(Math.random() * kinds.length)], col = COL[k], f = box.querySelector(`.so3[data-k="${k}"]`);
    pulse("pf:0", col, () => { if (!live) return; glasses(col);
      pulse("s3:" + k, col, () => { if (!live) return; f.classList.remove("got"); void f.offsetWidth; f.classList.add("got"); }, 1.1); }, 1.1);
    T = setTimeout(one, 650 + Math.random() * 500);
  };
  T = setTimeout(one, 900);
  return () => { live = false; clearTimeout(T); fadeWires("s3:", 500); };
}
function pdocsName() { const l = S.runs.map(r => r.label).filter(Boolean)[0]; if (l) $("pdocs").querySelector(".pd-n").textContent = l.split("›").pop().trim(); }
document.addEventListener("onb-linked", () => {
  pdocsName();
  if (S.O.step !== "link") return;
  RELINK = false; EMPTY = "";
  document.body.dataset.linked = "1"; fadeWires("pp:", 900); fadeWires("pf:", 900); $("say").innerHTML = W.link(); laterIsBack();
  status();
});
let STEP = null;
const stepArrows = () => `<div class="flip" data-flip="steps"><button type="button" class="fl-b" data-fl="-1" aria-label="the previous step">◂</button><span class="fl-n" aria-live="polite"></span><button type="button" class="fl-b" data-fl="1" aria-label="the next step">▸</button></div>`;
const stepKeys = P => P.parts ? P.parts.map(x => x.key) : P.steps;
function stepUI(P) {
  const keys = stepKeys(P), say = $("say");
  say.querySelectorAll("[data-b]").forEach(li => { const i = keys.indexOf(li.dataset.b); if (i < 0) return;
    li.dataset.step = i; li.tabIndex = 0; li.setAttribute("role", "button"); li.classList.add("stepb"); });
  (say.querySelector("ul.bl") || say.querySelector("h2.hd"))?.insertAdjacentHTML("afterend", stepArrows());
  const n = keys.length, ui = {keys, at: -1, go: i => { i = Math.max(0, Math.min(n - 1, i)); ui.at = i; hi(keys[i]);
    say.querySelector('[data-flip="steps"] .fl-n').textContent = `${i + 1} of ${n}`;
    say.querySelectorAll('[data-flip="steps"] [data-fl]').forEach(b => { b.disabled = b.dataset.fl === "-1" ? i === 0 : i === n - 1; }); }};
  ui.go(0); STEP = ui;
}
function stepper(P, me) {
  const keys = stepKeys(P), n = keys.length, say = $("say");
  const T = STEP = {P, keys, at: -1, held: false, stop: null, timer: 0, aim: null, live: true};
  const mine = () => T.live && STEP === T && me === GOES;
  const mark = i => {
    if (i === T.at) return;
    T.at = i; hi(keys[i]); const nEl = say.querySelector('[data-flip="steps"] .fl-n'); if (nEl) nEl.textContent = `${i + 1} of ${n}`;
    say.querySelectorAll('[data-flip="steps"] [data-fl]').forEach(b => { b.disabled = b.dataset.fl === "-1" ? i === 0 : i === n - 1; });
    const part = P.parts?.[i]; if (part?.lit) glow(part.lit);
  };
  const end = () => { clearTimeout(T.timer); const st = T.stop; T.stop = null; st?.(); };
  const showPart = async i => {
    end(); const sh = $("show"); if (!P.help) { sh.className = "show"; sh.innerHTML = ""; }
    mark(i);
    const r = await P.parts[i].show(SC);
    if (!mine() || T.at !== i) { r?.(); return; }
    T.stop = typeof r === "function" ? r : null;
    if (!T.held && !CALM.matches) T.timer = setTimeout(() => { if (mine() && !T.held) showPart((i + 1) % n); }, (r?.seconds ? r.seconds * 1000 + 300 : 0) || P.parts[i].dur || 9000);
  };
  const told = k => {
    if (!mine()) return;
    P.told?.(k);
    const i = keys.indexOf(P.stepOf ? P.stepOf[k] : k); if (i < 0) return;
    if (T.aim != null) { if (i === T.aim) { fast(false); T.aim = null; } else return; }
    if (T.held && i !== T.at && !T.stop?.seek) { runAt(T.at); return; }
    mark(i);
  };
  const runAt = async i => {
    end(); T.aim = i; fast(true); mark(i);
    const r = await P.show(SC, told);
    if (!mine()) { r?.(); fast(false); return; }
    T.stop = typeof r === "function" ? r : null;
    if (T.at === 0 && i === 0) { fast(false); T.aim = null; }
  };
  T.go = (i, user = true) => {
    i = ((i % n) + n) % n;
    if (user) T.held = true;
    if (P.parts) { showPart(i); return; }
    if (T.stop?.seek) { T.stop.seek(P.stepOf ? Object.keys(P.stepOf).filter(k => P.stepOf[k] === keys[i]) : keys[i], true); mark(i); return; }
    runAt(i);
  };
  stops.push(() => { T.live = false; fast(false); end(); if (STEP === T) STEP = null; });
  if (P.parts) { showPart(0); return; }
  (async () => {
    const r = await P.show(SC, told);
    if (!mine()) { r?.(); return; }
    T.stop = typeof r === "function" ? r : null;
    if (T.at < 0) mark(0);
  })();
}
on("click", "[data-fl]", b => { if (STEP) STEP.go(STEP.at + Number(b.dataset.fl)); });
on("click", "[data-step]", li => { if (STEP) STEP.go(Number(li.dataset.step)); });
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-step]")) { e.preventDefault(); STEP?.go(Number(e.target.dataset.step)); } });
function helpStep(name) {
  if (S.O.step !== "r-help") return Promise.resolve();
  if (name === "tidy") glow(["r1", "r2"]);
  if (name === "share") glow(["lib"]);
  if (name === "train") { glow(["lib"]); glasses(GREEN); }
  if (name === "pulse") {
    if (CALM.matches) return Promise.resolve();
    const go1 = id => new Promise(res => { const w = "tr:" + id; wire(w, $("face"), nodeEl(id), "--w-load", "auto", 1.5); follow(1500);
      pulse(w, GREEN, () => { glow(["r1", "r2"]); const lv = nodeEl(id)?.querySelector(".live"); if (lv) lv.textContent = "new version"; unwire(w); res(); }, 0.8); });
    return Promise.all([go1("r1"), pause(250).then(() => go1("r2"))]).then(() => pause(2200)).then(() => {
      for (const id of ["r1", "r2"]) { const lv = nodeEl(id)?.querySelector(".live"); if (lv) lv.textContent = ""; } glow([]); });
  }
  return Promise.resolve();
}
const next = () => {
  if (document.body.dataset.boot === "loading") return;
  const i = IDS.indexOf(S.O.step), P = PANELS[i];
  if (P.back) {
    if (S.O.step === "topics" && !S.O.topics.length) OVDONE.delete("topics"); else OVDONE.add(S.O.step);
    try { sessionStorage.setItem("pc_ovdone", JSON.stringify([...OVDONE])); } catch (e) {   }
    go(P.back); return;
  }
  if (S.O.step === "r-done") { if (!$("next").disabled) finish(); return; }
  let j = i + 1; while (PANELS[j]?.layout === "over") j++;
  go(IDS[j]);
};
$("next").addEventListener("click", next);
$("back").addEventListener("click", () => {
  const i = IDS.indexOf(S.O.step), P = PANELS[i];
  if (P.back) { go(P.back, -1); return; }
  if (S.O.step === "link" && linkedNow()) { RELINK = true; replaceNext(true); go("link", -1); return; }
  let j = i - 1; while (j > 0 && PANELS[j]?.layout === "over") j--;
  go(IDS[Math.max(0, j)], -1);
});
on("click", "[data-linkmore]", () => { RELINK = true; replaceNext(false); go("link"); });
$("nomss").addEventListener("click", () => { save({no_mss: true}); go("r-whole"); });
on("click", "[data-go]", b => go(b.dataset.go));
on("click", "[data-skipall]", async (a, e) => {
  e.preventDefault();
  if (inDemo()) { document.querySelector("[data-demo-leave]")?.click(); return; }
  await save({finished: true, welcome: "pending", skipped: [...new Set([...S.O.skipped, S.O.step])]});
  location.href = "mylibrary.html";
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !e.defaultPrevented && !inDemo() && !LEAVING && !e.target.closest?.("input, select, textarea, [role=dialog], [role=menu]") &&
      !document.querySelector("[role=dialog]:not([hidden]), [role=menu]:not([hidden])") && $("later")?.offsetParent) { e.preventDefault(); $("later").click(); return; }
  if (e.target.closest("input, select, textarea, details")) return;
  if (STEP && !e.metaKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    const d = e.key === "ArrowRight" ? 1 : -1, i = STEP.at + d;
    if (i >= 0 && i < STEP.keys.length) { e.preventDefault(); STEP.go(i); return; }
  }
  if (e.key === "ArrowRight" && !e.metaKey) $("next").click();
  if (e.key === "ArrowLeft" && !e.metaKey && !$("back").hidden) $("back").click();
});
async function readItem() {
  const sum = await get("/import/summary", {run: "all"}).catch(() => null);
  if (sum) S.summary = sum;
  if (S.O.no_mss || (sum?.complete && sum.to_read === 0)) { await dequeue("read"); return; }
  const t = S.O.topics.length, n = (sum?.complete && sum.to_read) || 0;
  await enqueue({kind: "read", label: `Read your manuscripts${n ? `: ${num(n)} pages` : ""}${t ? ", the chosen topics first" : ""}`, count: n, ref: "read"});
}
let MPOLL = 0;
async function modelsLine(kind) {
  clearTimeout(MPOLL);
  const at = kind === "reading" ? "r-read" : "r-search", el = $(kind === "reading" ? "readers" : "smodels");
  if (!el) return;
  const M = await get("/models").catch(() => null);
  if (S.O.step !== at || !el.isConnected) return;
  if (!M?.managed) { el.innerHTML = ""; return; }
  const rows = M.models.filter(r => r.kind === kind && r.needed), need = rows.filter(r => !r.current), I = M.install;
  const mine = I?.state === "running" && I.roles.some(r => rows.some(x => x.role === r));
  const what = kind === "reading" ? "the readers" : "the search models";
  if (mine) {
    const share = I.total ? Math.min(1, I.done / I.total) : 0;
    el.innerHTML = `<div class="mrun"><span class="k">${I.source === "download" ? `Downloading ${what}` : `Unpacking ${what}`}</span><div class="bar"><span class="done" style="width:${(100 * share).toFixed(1)}%"></span></div></div>`;
    MPOLL = setTimeout(() => modelsLine(kind), 800); return;
  }
  if (!need.length) { el.innerHTML = kind === "reading" ? `<p class="ok">Both readers are on this Mac.</p>` : ""; return; }
  const d = download(M, kind);
  if (d) { el.innerHTML = `<div class="acts">${actCard(d)}</div>`; return; }
  const fromPack = M.bundled && need.every(r => M.bundled.roles.includes(r.role));
  el.innerHTML = fromPack && I?.state === "failed" ? failNote(new Error(`Not unpacked: ${I.error}`), async () => { await post("/models/from-app", {}).catch(() => null); modelsLine(kind); })
    : `<p class="k">${kind === "reading" ? "The readers" : "The search models"}: not on this Mac. Install them in Settings.</p>`;
}
const readersRow = () => modelsLine("reading");
document.addEventListener("act-answer", e => { if (e.detail.key === "dl_reading") setTimeout(() => modelsLine("reading"), 300); if (e.detail.key === "dl_search") setTimeout(() => modelsLine("search"), 300); });
let OWN_T = 0;
let OWN_JOB = (() => { try { return sessionStorage.getItem("pc_timejob") || ""; } catch (e) { return ""; } })();
async function ownJob() {
  if (!OWN_JOB) return null;
  const R = await get("/reading").catch(() => null);
  return [...(R?.queue || []), ...(R?.recent || [])].find(j => j.id === OWN_JOB) || null;
}
async function timing() {
  const [Wn, st] = await Promise.all([get("/setup/when").catch(() => null), get("/import/status").catch(() => null)]);
  const meas = [...(st?.now || []), ...(st?.next || []), ...(st?.done || [])].find(x => /test sheets/.test(x.label));
  return {Wn, meas, can: st?.can_time !== false};
}
async function whenLine() {
  if (!$("whenline")) return;
  const [{Wn}, J] = await Promise.all([timing(), ownJob()]);
  if (S.O.step !== "r-when" || !$("whenline")) return;
  const pages = S.summary?.to_read, what = pages ? `Your manuscripts: ${plural(pages, "page", "pages")}.` : "";
  if (J && !["done", "failed", "cancelled"].includes(J.status)) {
    $("whenline").innerHTML = `${what} Timing 10 pages… ${num(J.done || 0)} of ${num(J.total || 10)}`;
    stops.push((t => () => clearTimeout(t))(setTimeout(() => { if (S.O.step === "r-when") whenLine(); }, 3000)));
    return;
  }
  $("whenline").innerHTML = Wn?.per_day != null ? `${what} About <b class="num">${num(Wn.per_day)}</b> pages a day at the hours set. ${Wn.left ? fmtLeft(Wn.left, "") : ""}`
    : `${what} How long: ${unknown(Wn?.reason || "not timed on this Mac yet")}.`;
}
async function timeCard() {
  const {Wn, meas, can} = await timing();
  if (Wn?.per_day != null) return "";
  const need = !can && !OWN_T ? ((await modelsFor("reading").catch(() => null)) || []).filter(r => r.needed && !r.current) : [];
  const J = !can && (OWN_T || OWN_JOB) ? await ownJob() : null;
  const going = !can ? (OWN_T || OWN_JOB ? (J?.status === "done" ? "Ten of your pages timed" : `Reading ten of your pages to time this Mac${J ? ` (${num(J.done || 0)} of ${num(J.total || 10)})` : ""}`) : "")
    : meas && meas.state !== "failed" ? `Ten test pages: ${meas.state === "done" ? "timed" : meas.state === "running" ? `being timed (${num(meas.done)} of ${num(meas.total || 10)})` : "queued"}` : "";
  if (going) return `<div class="act answered" role="group" aria-label="Time 10 test pages"><div class="aq">Time 10 test pages, to see how fast reading is on this Mac?</div><div class="aa"><span class="as">${esc(going)}</span></div></div>`;
  return actCard({approve: true, q: "Time 10 test pages, to see how fast reading is on this Mac?", line: need.length ? "once the readers are on this Mac" : "",
    buttons: [["Approve", `class="go" id="time10"${!can ? ` data-own="1"` : ""}${need.length ? " disabled" : ""}`], ["Not now", `class="quiet" data-time-no`]]});
}
on("click", "#time10", async b => {
  b.disabled = true;
  if (b.dataset.own) {
    try { OWN_JOB = await timeOwnPages(); OWN_T = Date.now(); try { sessionStorage.setItem("pc_timejob", OWN_JOB); } catch (e) {   } }
    catch (e) { b.disabled = false; b.closest(".act")?.insertAdjacentHTML("beforeend", failNote(e, () => b.click())); return; }
  } else { await enqueue({kind: "measure", label: "Time ten test sheets on this Mac", count: 10, ref: "measure"}); post("/import/queue/start").catch(() => {}); }
  confirms();
});
on("click", "[data-time-no]", b => { const c = b.closest(".act"); c.classList.add("answered"); c.insertAdjacentHTML("beforeend", `<div class="aa"><span class="as">Not now</span></div>`); toAnswer(); });
async function lmLine() {
  const L = await get("/librarian").catch(() => null), el = $("lmline");
  if (!el || S.O.step !== "r-lib") return;
  const models = L?.models || [];
  el.innerHTML = models.length ? `LM Studio on this Mac has ${plural(models.length, "model", "models")}. Choose one later, in Settings.`
    : L?.lmstudio === "here" ? "LM Studio is on this Mac but not running. Choose a model later, in Settings." : "It runs with LM Studio, which is not on this Mac. Optional: set it up later, in Settings.";
}
async function loadTidy() { TIDY = (await get("/import/tidy", {run: "all"}).catch(() => null)) || TIDY; }
async function asks() {
  for (const el of document.querySelectorAll(S.O.step === "r-help" ? "#say .asks, #helpc .asks" : "#say .asks")) {
    const keys = el.dataset.asks.split(",");
    el.innerHTML = keys.map(k => always(k) ? actCard({key: k}) : (t => t?.applies ? actCard({key: t.key, line: lineOf(t) + (t.estimate ? ` · ${fmtLeft(t.estimate, "")}` : "")}) : "")(TIDY.find(x => x.key === k))).join("");
    el.classList.add("acts");
  }
  toAnswer();
}
on("mouseover", ".act[data-act]", a => glow([ASKS[a.dataset.act]?.part]));
document.addEventListener("act-answer", e => { glow([ASKS[e.detail.key]?.part]); setTimeout(toAnswer, 0); });
function toAnswer() {
  const n = document.querySelectorAll("#say .act.ask:not(.answered), #helpc .act.ask:not(.answered)").length, el = $("toans");
  el.hidden = !n; el.textContent = n ? `${n} approval${n === 1 ? "" : "s"} to answer, here or later in Settings` : "";
}
let CONFIRM = 0;
async function confirms() {
  const me = ++CONFIRM;
  const [A, tc] = await Promise.all([applying().catch(() => null), timeCard()]);
  const el = $("confirms"); if (!el || me !== CONFIRM || S.O.step !== "confirm") return;
  const due = (A || []).filter(a => !always(a.key));
  const est = k => TIDY.find(t => t.key === k)?.estimate;
  el.innerHTML = (A == null ? failNote(new Error("What your files need did not come"), confirms) : "") +
    due.map(a => actCard({key: a.key, line: a.line + (est(a.key) ? ` · ${fmtLeft(est(a.key), "")}` : "")})).join("") + tc +
    (A && !due.length ? `<p class="k">Nothing else is needed for your files now.</p>` : "") +
    (due.filter(a => !answers()[a.key] && !ASKS[a.key]?.net).length > 1 ? `<div class="ab"><button type="button" class="quiet" id="okall">Approve all of these${due.some(a => ASKS[a.key]?.net) ? " but the fetching" : ""}</button></div>` : "");
  el.insertAdjacentHTML("afterbegin", `<p class="k">The two readers come with the app: nothing to download.</p>`);
  toAnswer();
  if (OWN_T || /being timed|queued/.test(tc)) stops.push((t => () => clearTimeout(t))(setTimeout(() => { if (S.O.step === "confirm") confirms(); }, 5000)));
}
on("click", "#okall", async b => { b.disabled = true; for (const c of document.querySelectorAll("#confirms .act[data-act]:not(.answered)")) if (!ASKS[c.dataset.act]?.net) await answer(c.dataset.act, true); confirms(); });
let DATA = null;
async function arrData() {
  if (DATA) return DATA;
  const [lib, T] = await Promise.all([get("/library").catch(() => null), loadTopics()]);
  DATA = {lib, T: T?.error ? null : T, demo: S.demo || await demo()};
  return DATA;
}
const C = 2 * Math.PI * 95;
function setRing(share) { $("rf").style.strokeDasharray = C; $("rf").style.strokeDashoffset = C * (1 - Math.max(0, Math.min(1, share))); }
function ringNow(share) { const r = $("rf"); r.style.transition = "none"; setRing(share); void r.getBoundingClientRect(); r.style.transition = ""; }
let BOOT = null, LINE_AT = 0, LINE_T = 0, RING_OURS = false, PULSES = [];
function bootLine(now = false) {
  clearTimeout(LINE_T);
  LINE_T = setTimeout(() => { $("boot").textContent = loadLine(); LINE_AT = performance.now(); }, now ? 0 : Math.max(0, LINE_AT + 350 - performance.now()));
}
function boot() {
  if (BOOT) return;
  if (document.body.dataset.boot === "ready" || loaded() || S.runs.length) {
    if (!S.runs.length) { ringNow(1); RING_OURS = true; }
    document.body.dataset.boot = "ready"; $("boot").textContent = ""; return;
  }
  document.body.dataset.boot = "loading";
  setRing(loadShare()); bootLine(true); RING_OURS = true;
  const pace = () => { if (document.body.dataset.boot !== "loading") return; setRing(loadShare()); requestAnimationFrame(pace); };
  requestAnimationFrame(pace);
  BOOT = onLoad(kind => {
    if (kind === "done") { ready(); return; }
    if (kind !== "land") return;
    setRing(loadShare()); bootLine();
    if (CALM.matches) return;
    const ids = pipeIds(), id = ids[Math.floor(Math.random() * ids.length)];
    if (id) PULSES.push(setTimeout(() => { const col = tok("--s1", "#3d7ef0"); pulse(id, col, () => glasses(col), 1.2); }, Math.random() * 300));
  });
  if (loaded()) ready();
}
const stopPulses = () => { PULSES.forEach(clearTimeout); PULSES = []; };
async function ready() {
  BOOT?.(); BOOT = null; stopPulses();
  setRing(1); bootLine(true);
  await pause(CALM.matches ? 0 : 520);
  if (document.body.dataset.boot !== "loading") return;
  document.body.dataset.boot = "ready";
  if (S.O?.step === "start") $("next").focus({preventScroll: true});
  console.debug(`setup loaded in ${Math.round(took())} ms`);
}
function leaveBoot() {
  BOOT?.(); BOOT = null; clearTimeout(LINE_T); stopPulses();
  if (document.body.dataset.boot === "loading") document.body.dataset.boot = "";
  if (RING_OURS && !S.runs.length && !LEAVING) {
    RING_OURS = false; const r = $("rf"); r.classList.add("out");
    setTimeout(() => { r.classList.remove("out"); if (!S.runs.length) ringNow(0); }, CALM.matches ? 0 : 600);
  }
}
document.addEventListener("onb-ring", e => { if (S.runs.length) setRing(e.detail.share); });
const TICK_MS = 1400;
let TICK = null, TICK_AT = 0, TICK_T = 0;
document.addEventListener("onb-item", e => { TICK = e.detail; const t = performance.now(); if (t - TICK_AT > TICK_MS) tick(); else if (!TICK_T) TICK_T = setTimeout(tick, TICK_MS - (t - TICK_AT)); });
const FOLDER_NAME = {MSS: "Manuscripts", LP: "Lifetime publications", other: "Other"};
function tick() {
  TICK_T = 0; TICK_AT = performance.now();
  if (!TICK || S.O?.step === "start" || !sortState().looking) return;
  const {it, dest} = TICK, where = dest ? FOLDER_NAME[dest] || "Later editions" : "not sorted";
  $("sline").innerHTML = `${esc(sortLine())} <span class="k">· ${esc(it.name.length > 60 ? it.name.slice(0, 58) + "…" : it.name)}${it.detail ? ` → ${esc(it.detail)}` : ""}, ${esc(where)}</span>`;
}
async function status() {
  clearTimeout(STATUS);
  if (LEAVING || S.O?.step === "start") return;
  let fail = null;
  const st = await get("/import/status").catch(e => { fail = e; return null; });
  if (S.O?.step === "start") return;
  $("stfail").innerHTML = fail ? failNote(fail, status) : "";
  if (S.runs.length && S.summary?.complete !== true && !S.runs.some(r => r.state === "looking"))
    S.summary = await get("/import/summary", {run: "all"}).catch(() => S.summary);
  if (S.O?.step === "start") return;
  SORTING_NOW = !!st?.now?.some(p => String(p.key || "").startsWith("link:"));
  if (st) {
    const fmt = p => `${p.label}${p.total ? ` (${num(p.done)} of ${num(p.total)})` : ""}`;
    const now = st.now.filter(p => !(S.runs.length && String(p.key || "").startsWith("link:"))).map(fmt).join("; "), nx = st.next[0], bad = st.done.filter(p => p.state === "failed");
    $("status").innerHTML = (now ? `<div>${esc(now)}</div>` : "") +
      (nx ? `<div class="k">Next: ${esc(nx.label)}${!now && st.why ? ` (${esc(st.why)})` : ""}</div>` : "") +
      bad.map(p => `<div class="k">Not done: ${esc(p.label)}${p.error ? ` (${esc(p.error.replace(/[.]$/, ""))})` : ""}</div>`).join("");
  }
  pdocsName();
  if (S.O.step === "link" && linkedNow() && sortState().done && S.summary?.complete !== false && !peirceFound() && !S.runs.some(r => r.state === "failed")) {
    EMPTY = S.runs.map(r => r.label).filter(Boolean).map(l => l.split("›").pop().trim()).join(", ") || "what you linked";
    RELINK = true; replaceNext(true); go("link"); return;
  }
  if (S.O.step === "link" && linkedNow()) { const b = $("say").querySelector(".big"), l = S.runs.map(r => r.label).filter(Boolean).join(" · "); if (b && l && b.textContent !== l) b.textContent = l; }
  const s = sortState();
  $("sbar").hidden = !S.runs.length;
  $("sbarf").style.width = `${s.done ? 100 : s.total ? (100 * s.looked / s.total).toFixed(1) : 0}%`;
  if (S.O.step === "r-done") $("sline").textContent = "";
  else if (S.runs.length && (!s.looking || performance.now() - TICK_AT > 4000)) $("sline").textContent = sortLine();
  if (document.body.dataset.layout === "run") folderFigures();
  if (S.O.step === "r-done") doneState(s);
  STATUS = setTimeout(status, 2000);
}
let FLOURISHED = false, SORTING_NOW = false;
function doneState(s) {
  const line = $("doneline"); if (!line || LEAVING) return;
  const waiting = S.runs.length > 0 && (s.looking || SORTING_NOW || S.summary?.complete === false);
  const bad = (S.summary?.sources || []).filter(x => x.failed);
  line.innerHTML = !S.runs.length ? "Nothing linked yet: the Library shows Peirce's corpus. Link your files from Settings at any time."
    : waiting ? esc(`Sorting… ${num(s.looked)} so far.`)
    : (peirceFound() ? "Sorted." : bad.length ? "" : "Nothing of Peirce's was found in what you linked. Link files from Settings at any time.") +
      bad.map(x => `<div>Stopped: ${esc(x.label)} · ${esc(x.failed)}</div>`).join("");
  $("next").disabled = waiting;
  $("next").textContent = waiting ? "Sorting…" : "Finish";
  if (!waiting && !FLOURISHED) {
    FLOURISHED = true;
    flourish({order: ["src", "ms", "lp", "le", "det", "pre", "r1", "r2", "xs", "pdf", "st", "q", "lbn", "lib"], glow, walk, glasses, on: () => S.O.step === "r-done"})
      .then(() => { if (S.O.step !== "r-done" || LEAVING) return; glow([]); $("next").focus({preventScroll: true}); });
  }
}
const SETTINGS_AT = "settings.html#welcome";
async function finish() {
  LEAVING = true;
  const b = $("next"); b.disabled = true; b.textContent = "Opening…"; b.classList.add("pressed");
  await save({finished: true, welcome: "pending"});
  clearTimeout(STATUS); unwire(""); setRoute(null); stops.forEach(f => f && f()); stops = [];
  const at = {};
  for (const n of document.querySelectorAll(".scm .nd[data-n]")) { const r = n.getBoundingClientRect(); if (r.width && r.height) at[n.dataset.n] = [r.left, r.top, r.width, r.height]; }
  try { sessionStorage.setItem("pc_schema_from", JSON.stringify({at, t: Date.now()})); } catch (e) {   }
  document.body.classList.add("leaving");
  const f = $("face"), r = f.getBoundingClientRect();
  f.classList.add("fly"); Object.assign(f.style, {left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", transform: "none"});
  requestAnimationFrame(() => requestAnimationFrame(() => { Object.assign(f.style, {left: "20px", top: "8px", width: "28px", height: "28px"}); }));
  await pause(CALM.matches ? 0 : 600);
  if (inDemo()) { demoEnd(); try { sessionStorage.removeItem(DEMO_FROM); } catch (e) {   } }
  location.href = SETTINGS_AT;
}
const demoLeft = () => /[?&]demo=1\b/.test(location.search) && !inDemo();
const backHere = () => performance.getEntriesByType?.("navigation")?.[0]?.type === "back_forward";
const GONE = demoLeft() && backHere();
if (GONE) location.replace("settings.html");
addEventListener("pageshow", e => { if (e.persisted && demoLeft()) location.replace("settings.html"); });
if ((/[?&]demo=1\b/.test(location.search) && !backHere()) || inDemo()) {
  if (!inDemo()) demoStart(DEMO_START);
  demoSetup();
  const m = document.createElement("div"); m.className = "demomark"; m.setAttribute("role", "status");
  m.innerHTML = `Demo setup <button type="button" data-demo-leave>Leave the demo</button>`; document.querySelector("header.brand").after(m);
}
if (!GONE) preload();
if (/[?&]drafts=1/.test(location.search)) document.body.classList.add("drafts");
(async () => {
  if (GONE) return;
  try {
    const [p, s] = await Promise.all([get("/preferences"), get("/session").catch(() => ({}))]);
    S.O = p.onboarding; S.library = s.library || "";
  } catch (e) {
    S.O = {step: "start", skipped: [], topics: [], readers: [], schedule: {when: "tonight", hours: TONIGHT, plugged_in: true, pause_in_use: true, week: []}, tutorial: "new", tips_seen: [], approvals: {}};
  }
  useApprovals(S.O);
  fx($("fx"));
  $("pdocs").querySelector(".pd-f").innerHTML = FOLDER; $("pdocs").querySelector(".pd-z").innerHTML = ZMARK;
  $("sorted3").querySelectorAll(".pd-f").forEach(f => { f.innerHTML = FOLDER; });
  mountScheme($("scm"));
  dropZone($("lk"));
  demo().then(D => {
    grid($("grid"), D?.corpus || [], D?.corpus_kind || []); $("grid").classList.add("on");
    if (S.O.step === "start" && !pipeIds().length) squarePipes($("pdocs"), $("face"));
  });
  showcase().then(x => { SC = x; });
  for (const r of (S.O.run || "").split(",").filter(Boolean)) S.runs.push({run: r, label: "", next: 0, state: "looking"});
  if (S.runs.length) poll();
  const h = location.hash.slice(1);
  const at = OLD[S.O.step] || S.O.step;
  go(IDS.includes(h) || OLD[h] ? h : S.O.finished ? "start" : IDS.includes(at) ? at : "start");
})();
addEventListener("hashchange", () => { const h = location.hash.slice(1); if ((IDS.includes(h) || OLD[h]) && h !== S.O?.step) go(h); });
