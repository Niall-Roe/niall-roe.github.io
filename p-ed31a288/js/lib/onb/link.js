import {$, esc, on, toast} from "../dom.js";
import {get, inDemo, post} from "../api.js";
import {S, nf, plural, save} from "../onbstate.js";
import {items} from "../fmt.js";
import {COLOUR, light, pulse, wire} from "./stage.js";
import {failNote} from "../state.js";
export const EDITIONS = [
  {id: "MSS", label: "Manuscripts", full: "the manuscripts", role: "scan",
    parts: [["MS film", "Microfilm", "reels, or PDFs of the film"], ["MS hollis", "Harvard's scans", "Hollis: Houghton's own scans"]]},
  {id: "LP", label: "Lifetime publications", full: "his lifetime publications (Ketner's list)", role: "lifetime"},
  {id: "CP", label: "Collected Papers", full: "Collected Papers", series: "CP", parts: Array.from({length: 8}, (_, i) => [`CP ${i + 1}`, `CP ${i + 1}`])},
  {id: "W", label: "Writings", full: "Writings (the Chronological Edition)", series: "W", parts: [1, 2, 3, 4, 5, 6, 8].map(v => [`W${v}`, `W ${v}`])},
  {id: "EP", label: "Essential Peirce", full: "The Essential Peirce", parts: [["EP1", "EP 1"], ["EP2", "EP 2"]]},
  {id: "NEM", label: "New Elements", full: "The New Elements of Mathematics", series: "NEM", parts: [1, 2, 3, 4].map(v => [`NEM ${v}`, v === 3 ? "NEM 3 (both books)" : `NEM ${v}`])},
  {id: "RLT", label: "RLT", full: "Reasoning and the Logic of Things", edition: "RLT"},
  {id: "CN", label: "CN", full: "Contributions to The Nation", series: "CN", parts: [1, 2, 3, 4].map(v => [`CN:${v}`, `CN ${v}`])},
  {id: "HP", label: "HP", full: "Historical Perspectives on Peirce's Logic of Science", edition: "HP"},
  {id: "LF", label: "LF", full: "Logic of the Future", series: "LF", parts: [["LF:1", "LF 1"], ["LF:2.1", "LF 2.1"], ["LF:2.2", "LF 2.2"]]},
  {id: "ILS", label: "ILS", full: "Illustrations of the Logic of Science", edition: "ILS"},
  {id: "CD", label: "Century Dictionary", full: "The Century Dictionary", edition: "CD"},
  {id: "DPP", label: "Baldwin's Dictionary", full: "Baldwin's Dictionary of Philosophy and Psychology", edition: "DPP"},
  {id: "other", label: "Other", full: "Other: writing about Peirce", role: "other"},
];
const seriesOf = code => code.startsWith("CP ") ? "CP" : /^W\d/.test(code) ? "W" : code.startsWith("NEM ") ? "NEM" : /^EP\d/.test(code) ? "EP" : code;
export const folderOf = key => key.startsWith("ms:") || key.startsWith("reel:") ? "MSS" : key.startsWith("pub:") ? "LP" : key.startsWith("ed:") ? seriesOf(key.slice(3)) : null;
let SRC = null, POLL = 0, T0 = 0, FROM = null, QUEUE = [], PUMP = 0, ON = false, REPLACE = false;
export const replaceNext = on => { REPLACE = on; };
const LINKED = new Set();
function folderSVG(level) {
  const sheets = [0, 1, 2].map(i => `<g class="sheet${i < level ? " in" : ""}"><rect x="${16 + i * 5}" y="${8 + i * 3}" width="64" height="52" rx="2" transform="rotate(${[-4, 2, -1][i]} 50 40)"/>
     <path d="M${24 + i * 5} ${18 + i * 3}h44M${24 + i * 5} ${24 + i * 3}h40M${24 + i * 5} ${30 + i * 3}h46" transform="rotate(${[-4, 2, -1][i]} 50 40)"/></g>`).join("");
  return `<svg viewBox="0 0 100 80" aria-hidden="true"><path class="back" d="M4 12a4 4 0 0 1 4-4h24l7 7h53a4 4 0 0 1 4 4v53a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/>${sheets}
    <path class="front" d="M2 32a3 3 0 0 1 3-3h90a3 3 0 0 1 3 3l-3 41a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/></svg>`;
}
export const ZMARK = `<svg viewBox="0 0 40 40" aria-hidden="true" class="zmark"><rect width="40" height="40" rx="8"/><path d="M11 11h18v4L17 26h12v4H11v-4l12-11H11z"/></svg>`;
export function render() {
  $("lk-left").innerHTML = `<div class="lk-icons"><button type="button" class="go lk-b" id="lk-folder">Link a folder</button>
      <button type="button" class="lk-b" id="lk-zot">${ZMARK}<span>Link a Zotero collection</span></button></div>
    <p class="k zrec">A Zotero collection includes its subcollections. Its records carry titles, volumes and dates, which sort files more surely than the files alone.</p>
    <p class="k mac">macOS may ask once whether the app may read your Documents, Desktop or Downloads folder: allow it to link files kept there.</p>
    <div class="lk-sugg" id="lk-sugg"></div>
    <details class="typed"><summary>or type the folder's path</summary><div class="orow"><input id="lk-path" placeholder="~/Documents/Peirce" spellcheck="false" aria-label="folder path"><button type="button" id="lk-pathgo">Link</button></div></details>
    <div class="lk-run" id="lk-run" aria-live="polite"></div>`;
  const fold = e => `<button type="button" class="fold" data-e="${e.id}" aria-expanded="false">${folderSVG(0)}<span>${esc(e.id === "LP" ? "Published in his lifetime" : e.id === "MSS" ? "Manuscripts" : e.full || e.label)}</span><small></small></button>`;
  const one = id => fold(EDITIONS.find(e => e.id === id));
  $("lk-right").innerHTML = `<details class="lk-eds" id="lk-eds"><summary>Or link your editions one by one</summary>
    <div class="egrid" id="egrid"><div class="eg-top">${one("MSS")}${one("LP")}</div>
      <div class="eg-h">Later editions</div><div class="eg-eds">${EDITIONS.filter(e => !["MSS", "LP", "other"].includes(e.id)).map(fold).join("")}</div>
      <div class="eg-other">${one("other")}</div></div>
    <div class="eopen" id="eopen" hidden></div></details>`;
  paint();
}
export async function enter() {
  ON = true;
  if (!$("egrid")) render();
  await sources();
  for (const r of (S.O.run || "").split(",").filter(Boolean)) if (!S.runs.some(x => x.run === r)) S.runs.push({run: r, label: "", next: 0, state: "looking"});
  if (S.runs.length) { wire("in", FROM || $("pdocs") || $("lk-folder"), $("face"), "--w", "auto", 2.4); poll(); }
  const t = setInterval(() => { if (!ON) { clearInterval(t); return; } if (SRC?.zotero_state !== "ready") sources(true); }, 4000);
  return () => { ON = false; clearInterval(t); };
}
export function leave() { ON = false; }
let ROUTE = null;
export const setRoute = fn => { ROUTE = fn; };
function figures() {
  const D = S.demo, rows = Object.fromEntries((S.summary?.rows || []).map(r => [r.kind, r]));
  const vols = id => D?.volumes?.[id] || null;
  const out = {};
  for (const e of EDITIONS) {
    let n = 0, of = null, text = "";
    const nOf = (k, o) => k ? (o ? `${nf(k)} of ${nf(o)}` : nf(k)) : "";
    if (e.id === "MSS") { n = (rows.scan?.count || 0); of = rows.scan?.of || D?.kinds?.scan || null; const reels = rows.reel?.count || 0; text = [nOf(n, of), reels ? plural(reels, "reel", "reels") : ""].filter(Boolean).join(" · "); n += reels; }
    else if (e.id === "LP") { n = rows.lifetime?.count || 0; of = rows.lifetime?.of || null; text = nOf(n, of); }
    else if (e.id === "other") { n = rows.other?.count || 0; text = n ? plural(n, "item", "items") : ""; }
    else { const names = (rows.edition?.names || []).filter(c => seriesOf(c) === e.id); n = names.length; of = vols(e.id); text = n ? (of > 1 ? `${n} of ${of} volumes` : "linked") : ""; }
    const withheld = (e.id === "MSS" ? [rows.scan, rows.reel] : e.id === "LP" ? [rows.lifetime] : e.id === "other" ? [rows.other] : [rows.edition]).some(r => r && r.count == null);
    const soFar = e.id === "MSS" ? (rows.scan?.so_far || 0) : e.id === "LP" ? (rows.lifetime?.so_far || 0) : e.id === "other" ? (rows.other?.so_far || 0) : 0;
    if (withheld) text = soFar ? `${nf(soFar)} so far` : "not known yet";
    if (!text && LINKED.has(e.id)) text = "linked";
    out[e.id] = {n, of, text};
  }
  return out;
}
const levelOf = (n, of) => !n ? 0 : of ? 1 + (n / of >= 1 / 3) + (n / of >= 2 / 3) : 1 + (n > 5) + (n > 20);
export function paint() {
  const F = figures();
  for (const el of document.querySelectorAll("#egrid .fold")) {
    const f = F[el.dataset.e]; const lv = levelOf(f.n, f.of) || (LINKED.has(el.dataset.e) ? 1 : 0);
    el.classList.toggle("linked", lv > 0);
    el.querySelector("small").textContent = f.text;
    el.querySelectorAll(".sheet").forEach((s, i) => s.classList.toggle("in", i < lv));
  }
  const any = S.runs.length > 0;
  $("lk-folder")?.classList.toggle("linked", any);
}
const ZSTATE = {
  absent: "Zotero is not on this Mac. Link a folder instead.",
  closed: "Zotero is on this Mac but not open. Open it, and its libraries appear here.",
  no_api: "Zotero is open but not answering. In Zotero, open Settings › Advanced and tick “Allow other applications on this computer to communicate with Zotero”, then try again.",
};
async function sources(quiet) {
  const was = SRC?.zotero_state;
  try { SRC = await get("/import/sources"); } catch (e) { SRC = {zotero: [], zotero_state: null, error: e, folders: [], developer_folders: []}; }
  if (quiet && SRC.zotero_state === was) return;
  const short = p => p.replace(/^\/Users\/[^/]+/, "~");
  const dev = new Set(S.library === "developer" ? SRC.developer_folders || [] : []);
  SRC.folders = [...new Set(SRC.folders || [])].filter(f => !dev.has(f));
  $("lk-sugg").innerHTML = (SRC.folders || []).length ? `<span class="k">Found on this Mac:</span> ${SRC.folders.map(f => `<button type="button" data-folder="${esc(f)}">${esc(short(f))}</button>`).join(" ")}` : "";
  if (S.library === "developer" && (SRC.developer_folders || []).length)
    $("lk-sugg").insertAdjacentHTML("beforeend", `<details class="dev"><summary>Developer library: THE PEIRCEPTRON's own folders</summary>${SRC.developer_folders.map(f => `<button type="button" data-folder="${esc(f)}">${esc(f.split("/").pop())}</button>`).join(" ")}</details>`);
  const pop = $("zpop"); if (pop && !pop.hidden) zpop(pop.dataset.for ? JSON.parse(pop.dataset.for) : {});
}
function zpop(extra, anchor) {
  const pop = $("zpop");
  pop.dataset.for = JSON.stringify(extra); pop.hidden = false;
  const title = extra.label ? `Link a Zotero collection of ${esc(extra.label)}` : "Link your Zotero library, or one collection";
  if (SRC?.error) pop.innerHTML = `<b>${title}</b>${failNote(SRC.error, async () => { await sources(); zpop(JSON.parse(pop.dataset.for || "{}")); }, {what: "The list of Zotero libraries"})}
    <div class="orow"><button type="button" data-zclose>Close</button></div>`;
  else if (SRC?.zotero_state !== "ready") pop.innerHTML = `<b>${title}</b><p>${esc(ZSTATE[SRC?.zotero_state] || SRC?.zotero_note || "")}</p>
    <div class="orow">${SRC?.zotero_state === "absent" ? "" : `<button type="button" class="go" data-ztry>Try again</button>`}<button type="button" data-zclose>Close</button></div>`;
  else {
    const libs = SRC.zotero, pick = libs.find(l => l.id === S.O.zotero_lib) || libs[0];
    pop.innerHTML = `<b>${title}</b>
      <div class="orow"><select id="zlib" aria-label="Zotero library">${libs.map(l => `<option value="${esc(l.id)}"${l === pick ? " selected" : ""}>${esc(l.name)}${l.group ? " (group)" : ""}${l.items != null ? ` · ${plural(l.items, "item", "items")}` : ""}</option>`).join("")}</select></div>
      <div class="orow"><select id="zcol" aria-label="collection"></select></div>
      <div class="k">A collection includes its subcollections.</div>
      <div class="orow"><button type="button" class="go" id="zgo">Connect</button><button type="button" data-zclose>Cancel</button></div>`;
    zcols();
  }
  if (anchor) { const r = anchor.getBoundingClientRect(); pop.style.left = Math.max(12, Math.min(innerWidth - 360, r.left)) + "px"; pop.style.top = Math.min(innerHeight - 220, r.bottom + 8) + "px"; }
  pop.querySelector("select, button")?.focus();
}
function zcols() {
  const L = SRC?.zotero.find(l => l.id === $("zlib")?.value);
  const kids = p => (L?.collections || []).filter(c => c.parent === p).sort((a, b) => a.name.localeCompare(b.name));
  const opt = (c, d) => `<option value="${esc(c.key)}">${" ".repeat(d * 2)}${esc(c.name)}${c.n ? ` (${nf(c.n)})` : ""}</option>` + kids(c.key).map(x => opt(x, d + 1)).join("");
  $("zcol").innerHTML = `<option value="">the whole library</option>` + kids(null).map(c => opt(c, 0)).join("");
}
export function laterIsBack() {
  const a = $("later"); if (!a) return;
  if (inDemo()) { a.remove(); return; }
  a.textContent = "Back to the app"; a.title = "Leave setup (Esc); Settings › Run setup again opens it again";
}
async function link(src, from, label) {
  if ($("lk-run")) $("lk-run").innerHTML = `<div class="k">connecting…</div>`;
  try {
    if (REPLACE) {
      await post("/import/reset", {});
      S.runs.length = 0; S.items.clear(); LINKED.clear(); QUEUE.length = 0; S.summary = null; REPLACE = false;
      await save({run: ""});
    }
    const r = await post("/import/link", src);
    S.runs.push({run: r.run, label: r.label, next: 0, state: "looking"});
    const which = src.edition ? EDITIONS.find(e => e.parts?.some(p => p[0] === src.edition) || e.edition === src.edition)?.id : src.series || (src.role === "lifetime" ? "LP" : src.role === "other" ? "other" : src.role === "scan" ? "MSS" : null);
    if (which) LINKED.add(which);
    await save({run: S.runs.map(x => x.run).join(",")});
    laterIsBack();
    FROM = $("pdocs") || from || $("lk-folder"); T0 = Date.now();
    wire("in", FROM, $("face"), "--w", "auto", 2.4);
    paint();
    document.dispatchEvent(new CustomEvent("onb-linked"));
    setTimeout(poll, 700);
  } catch (e) { toast(e.message); }
  void label;
}
async function choose(btn, extra = {}) {
  const span = btn.querySelector("span"), was = span ? span.textContent : btn.textContent;
  const setT = t => { if (span) span.textContent = t; else btn.textContent = t; };
  btn.disabled = true; setT("waiting for the folder chooser…");
  try {
    const r = await post("/import/choose-folder", {prompt: extra.label ? `Choose your folder of ${extra.label}` : "Choose the folder that holds your Peirce files"});
    if (r.path) await link({kind: "folder", path: r.path, ...extra.src}, btn);
  } catch (e) { toast(e.message); }
  finally { btn.disabled = false; setT(was); }
}
function srcOf(e, part) {
  if (part && part.includes(":")) return {role: "edition", series: e.series};
  if (part) return e.id === "MSS" ? {role: "scan", edition: part} : {role: "edition", edition: part};
  if (e.edition) return {role: "edition", edition: e.edition};
  if (e.series) return {role: "edition", series: e.series};
  return e.role ? {role: e.role} : {role: "edition"};
}
on("click", "#lk-folder", b => choose(b));
on("click", "#lk-zot", b => zpop({}, b));
on("click", "#lk-pathgo", () => { const p = $("lk-path").value.trim(); if (!p) { toast("Type a folder's path first"); return; } link({kind: "folder", path: p}, $("lk-folder")); });
on("click", "[data-folder]", b => link({kind: "folder", path: b.dataset.folder}, $("lk-folder")));
on("change", "#zlib", () => { zcols(); save({zotero_lib: $("zlib").value}); });
on("click", "#zgo", async b => {
  const extra = JSON.parse($("zpop").dataset.for || "{}");
  b.disabled = true; b.textContent = "Connecting…";
  await link({kind: "zotero", library: $("zlib").value, collection: $("zcol").value || null, ...(extra.src || {})}, extra.src ? null : $("lk-zot"));
  $("zpop").hidden = true;
});
on("click", "[data-zclose]", () => { $("zpop").hidden = true; });
on("click", "[data-ztry]", async b => { b.disabled = true; b.textContent = "Looking for Zotero…"; await sources(); zpop(JSON.parse($("zpop").dataset.for || "{}")); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if ($("zpop") && !$("zpop").hidden) { $("zpop").hidden = true; return; }
  const box = $("eopen");
  if (box && !box.hidden) { box.hidden = true; const f = document.querySelector(`#egrid [data-e="${box.dataset.e}"]`); f?.setAttribute("aria-expanded", "false"); f?.focus(); }
});
on("click", "#egrid .fold", b => {
  const e = EDITIONS.find(x => x.id === b.dataset.e), box = $("eopen"), open = !box.hidden && box.dataset.e === e.id;
  document.querySelectorAll("#egrid .fold").forEach(x => x.setAttribute("aria-expanded", "false"));
  if (open) { box.hidden = true; return; }
  b.setAttribute("aria-expanded", "true");
  box.dataset.e = e.id; box.hidden = false;
  const held = new Set((S.summary?.rows || []).find(r => r.kind === "edition")?.names || []);
  const row = (code, label, note, aria = label) => `<div class="erow"><span>${esc(label)}${note ? ` <span class="k">${esc(note)}</span>` : ""}${held.has(code) ? ` <span class="ok">✓ found</span>` : ""}</span>
    <button type="button" class="mini" data-pf="${esc(code || "")}" aria-label="link a folder of ${esc(aria)}">${folderSVG(0)}</button><button type="button" class="mini" data-pz="${esc(code || "")}" aria-label="link a Zotero collection of ${esc(aria)}">${ZMARK}</button></div>`;
  box.innerHTML = `<div class="eo-h"><b>${esc(e.full || e.label)}</b><button type="button" class="eo-x" data-eoclose aria-label="Close">×</button></div>` +
    row("", e.parts ? `All of it in one folder${e.series === "CP" ? " (or one PDF of all eight volumes)" : ""}` : "Its folder", "", `all of ${e.full || e.label}`) +
    (e.parts ? `<div class="eo-parts">${e.parts.map(([c, l, n]) => row(c, l, n)).join("")}</div>` : "");
  const f = b.getBoundingClientRect(), r = box.getBoundingClientRect();
  box.style.transformOrigin = `${f.left + f.width / 2 - r.left}px ${f.top + f.height / 2 - r.top}px`;
  box.classList.remove("pop"); void box.offsetWidth; box.classList.add("pop");
  box.querySelector("[data-pf]")?.focus();
});
const partSrc = b => { const e = EDITIONS.find(x => x.id === $("eopen").dataset.e), part = b.dataset.pf ?? b.dataset.pz; const p = (e.parts || []).find(x => x[0] === part); return {e, src: srcOf(e, part || null), label: p ? p[1] : e.full || e.label}; };
on("click", "[data-eoclose]", () => { $("eopen").hidden = true; document.querySelectorAll("#egrid .fold").forEach(x => x.setAttribute("aria-expanded", "false")); });
on("click", "[data-pf]", b => { const {e, src, label} = partSrc(b); choose(b, {src, label, id: e.id}); });
on("click", "[data-pz]", b => { const {src, label} = partSrc(b); zpop({src, label}, b); });
export function dropZone(el) {
  el.addEventListener("dragover", e => { e.preventDefault(); el.classList.add("over"); });
  el.addEventListener("dragleave", e => { if (!el.contains(e.relatedTarget)) el.classList.remove("over"); });
  el.addEventListener("drop", e => {
    e.preventDefault(); el.classList.remove("over");
    if (!e.dataTransfer.files.length) return;
    $("lk-run").innerHTML = `<div>A dropped file is read where it is, so the app needs its folder: choose the folder it is in.</div>`;
    choose($("lk-folder"));
  });
}
export async function poll() {
  clearTimeout(POLL);
  for (const r of S.runs.filter(x => x.state === "looking")) {
    try {
      const p = await get("/import/progress", {run: r.run, since: r.next});
      for (const it of p.items) { it.run = r.run; S.items.set(`${r.run}:${it.i}`, it); QUEUE.push(it); }
      Object.assign(r, {state: p.state, label: p.label || r.label, next: p.next, looked: p.looked, total: p.total, error: p.error});
    } catch (e) {
      if (e.status === 404) { S.runs = S.runs.filter(x => x !== r); save({run: S.runs.map(x => x.run).join(",")}); }
      else if (!e.status) r.retry = (r.retry || 0) + 1;
      else { r.state = "failed"; r.error = e.message; }
    }
  }
  try { S.summary = await get("/import/summary", {run: "all"}); } catch (e) {   }
  for (const x of S.summary?.sources || []) { const r = S.runs.find(y => y.run === x.run); if (r && x.label) r.label = x.label; }
  pump(); runLine(); ring();
  if ($("egrid")) paint();
  if (S.runs.some(r => r.state === "looking")) POLL = setTimeout(poll, Math.min(10000, 600 * 2 ** Math.min(4, Math.max(0, ...S.runs.map(r => r.retry || 0)))));
}
const lit = () => ["link", "topics", "night"].includes(S.O.step) || S.O.step.startsWith("r-");
export function relight() { for (const it of S.items.values()) if (it.file) for (const k of it.corpus) light(k, 0.32); }
function pump() {
  if (PUMP) return;
  const go = () => {
    PUMP = 0;
    const take = QUEUE.splice(0, QUEUE.length > 40 ? QUEUE.length - 30 : 0);
    for (const it of take) if (it.file && lit()) for (const k of it.corpus) light(k, 0.3);
    const it = QUEUE.shift();
    if (it) {
      const col = COLOUR[it.kind] || COLOUR.unknown, dest = it.corpus.map(folderOf).find(Boolean);
      document.dispatchEvent(new CustomEvent("onb-item", {detail: {it, dest}}));
      const out = () => { if (dest) pulse(`out:${dest}`, col, () => { if (it.file && lit()) for (const k of it.corpus) light(k, 0.38); }); else if (it.file && lit()) for (const k of it.corpus) light(k, 0.38); };
      if (ROUTE && S.O.step !== "link") ROUTE(it, col, dest);
      else if (S.O.step === "link" && FROM) pulse("in", col, () => { glasses(col); out(); }); else out();
      PUMP = setTimeout(go, 160);
    }
  };
  go();
}
export function glasses(col) {
  const g = $("glasses"); if (!g) return;
  g.style.setProperty("--g", col); g.classList.remove("flash"); void g.offsetWidth; g.classList.add("flash");
}
function runLine() {
  const el = $("lk-run"); if (!el) return;
  const runs = S.runs, looking = runs.some(r => r.state === "looking");
  const long = looking && Date.now() - T0 > 30000;
  el.innerHTML = runs.map(r => `<div>${esc(r.label || "a source")} <span class="k">· ${r.state === "looking" ? "sorting…" : r.state === "failed" ? "stopped" : r.looked ? `sorted, ${items(r.looked)}` : "nothing found"}</span></div>`).join("") +
    runs.filter(r => r.error).map(r => `<div class="bad">${esc(r.error)}${/not permitted|permission/i.test(r.error) ? `<br>macOS did not let the app read these files. Allow it in System Settings › Privacy &amp; Security › Files and Folders, then link again.` : ""}</div>`).join("") +
    (long ? `<div class="nudge">This takes a while. It carries on in the background: press Next.</div>` : "");
}
export function ring() {
  const runs = S.runs; if (!runs.length) return;
  const looked = runs.reduce((t, r) => t + (r.looked || 0), 0), total = runs.reduce((t, r) => t + (r.total || 0), 0);
  const share = runs.every(r => r.state !== "looking") ? 1 : total ? looked / total : 0;
  document.dispatchEvent(new CustomEvent("onb-ring", {detail: {share, what: "sorting"}}));
}
