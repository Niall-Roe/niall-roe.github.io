import {$, esc, on} from "../dom.js";
import {get, post} from "../api.js";
import {S, nf, plural, save, enqueue} from "../onbstate.js";
import {items, lookedAt} from "../fmt.js";
import {failNote} from "../state.js";
import {fmtIso, fmtLeft, hoursOf, TONIGHT, unknown} from "../ring.js";
import {light, outline} from "./stage.js";
let T = null, TP = null, ROWS = [];
const GROUPS = [
  ["Logic", [[null, ["sec:I.D"]], [null, ["topic:deduction"]], [null, ["topic:relatives"]], [null, ["topic:graphs"]],
    [null, ["topic:probability"]], [null, ["topic:abduction"]], [null, ["topic:signs"]]]],
  ["Mathematics", [["Mathematics", ["sec:I.A", "topic:mathematics"]]]],
  ["Philosophy", [["Pragmatism", ["sec:I.B", "topic:pragmatism"]], ["Phenomenology and the categories", ["sec:I.C", "topic:categories"]],
    ["Metaphysics", ["sec:I.E", "topic:metaphysics"]], [null, ["topic:cosmology"]], [null, ["topic:ethics"]], [null, ["topic:religion"]],
    [null, ["topic:classification"]], [null, ["topic:philosophers"]]]],
  ["Sciences", [["Physics and astronomy", ["sec:I.F", "sec:I.H", "topic:physics"]], [null, ["sec:I.G"]],
    ["Geodesy and metrology", ["sec:I.I", "topic:measurement"]], ["Psychology and mind", ["sec:I.J", "topic:mind"]],
    [null, ["sec:I.M"]], [null, ["sec:I.N"]], [null, ["topic:science_history"]]]],
  ["Language and history", [["Linguistics, words and grammar", ["sec:I.K", "topic:language"]], [null, ["sec:I.L"]]]],
  ["Other", [[null, ["sec:I.O"]], [null, ["sec:I.P"]], [null, ["sec:I.Q"]], [null, ["sec:I.R"]], ["Letters", ["sec:II.A"]]]],
];
export const loadTopics = () => (TP ||= get("/setup/topics").catch(e => { TP = null; return {error: e.message}; }));
const short = n => String(n || "").split(":")[0].trim();
function rows() {
  const byKey = new Map([...T.topics.map(t => [t.key, {...t, kind: "topic"}]), ...T.sections.filter(x => x.ms.length).map(x => [x.key, {...x, kind: "sec"}])]);
  const used = new Set(), out = [];
  const mk = (group, name, keys) => {
    const parts = keys.map(k => byKey.get(k)).filter(Boolean); if (!parts.length) return;
    parts.forEach(p => used.add(p.key));
    out.push({id: parts.map(p => p.key).join("+"), group, keys: parts.map(p => p.key), name: name || short(parts[0].name),
      secs: parts.filter(p => p.kind === "sec"), tops: parts.filter(p => p.kind === "topic")});
  };
  for (const [g, list] of GROUPS) for (const [name, keys] of list) mk(g, name, keys);
  for (const p of byKey.values()) if (!used.has(p.key)) mk("Other", null, [p.key]);
  return out;
}
function rowSets(r) {
  const exact = new Set(r.secs.flatMap(x => x.ms.map(String))), est = new Set(), pubs = new Set();
  for (const t of r.tops) { (t.touches?.length ? t.touches : t.ms).forEach(m => { if (!exact.has(String(m))) est.add(String(m)); }); t.pubs.forEach(p => pubs.add(p)); }
  r.secs.forEach(x => x.pubs.forEach(p => pubs.add(p)));
  return {exact, est, pubs};
}
function rowLine(r) {
  const {exact} = rowSets(r), parts = [];
  if (r.secs.length) {
    const letters = r.secs.every(x => x.series.startsWith("II.")), of = r.secs.reduce((t, x) => t + (x.of || 0), 0);
    parts.push(letters && of > exact.size ? `${nf(exact.size)} of its ${nf(of)} letters in the catalogue` : `${nf(exact.size)} filed by Harvard`);
  }
  if (r.tops.length) { const n = new Set(r.tops.flatMap(t => (t.touches?.length ? t.touches : t.ms).map(String))).size; parts.push(`~${nf(n)} touch on it`); }
  return parts.join(" · ");
}
const isOn = r => r.keys.some(k => S.O.topics.includes(k));
export async function topics() {
  if (!T || T.error) T = await loadTopics();
  if (T.error) { $("tp-list").innerHTML = `<p class="note">Topics are not available: ${esc(T.error)}</p>`; return; }
  ROWS = rows();
  const groups = [...new Set(ROWS.map(r => r.group))];
  $("tp-groups").innerHTML = groups.map(g => `<div class="tgroup"><div class="tgh">${esc(g)}</div>` + ROWS.filter(r => r.group === g).map(r =>
    `<label class="trow" title="${esc(r.tops.map(t => t.line).join("; "))}"><input type="checkbox" value="${esc(r.id)}"${isOn(r) ? " checked" : ""}>
      <span class="nm">${esc(r.name)}</span><span class="ct">${esc(rowLine(r))}</span></label>`).join("") + `</div>`).join("") +
    (T.stand_in ? `<p class="note bad">${esc(T.stand_in)}</p>` : "");
  $("tp-wq").value = ""; works();
  $("tp-other").value = S.O.topic_other || "";
  offer(S.O.topic_other || "");
  sum();
}
const norm = t => String(t || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function works() {
  const q = norm($("tp-wq")?.value), chosen = new Set(S.O.topics);
  const W = (T.works || []).filter(w => q ? norm(w.title).includes(q) : chosen.has("work:" + w.id));
  $("tp-works").innerHTML = W.slice(0, 40).map(w => `<label class="wrow"><input type="checkbox" value="work:${esc(w.id)}"${chosen.has("work:" + w.id) ? " checked" : ""}><span>${esc(w.title)}</span><span class="k">${w.year || ""} · ${plural(w.ms.length, "manuscript", "manuscripts")}, ${plural(w.printings, "printing", "printings")}</span></label>`).join("") +
    (W.length > 40 ? `<p class="note">and ${nf(W.length - 40)} more: type more of the title.</p>` : q && !W.length ? `<p class="note">No work by that name.</p>` : "");
}
function chosenSet() {
  const exact = new Set(), est = new Set(), pubs = new Set();
  for (const r of ROWS) if (isOn(r)) { const s = rowSets(r); s.exact.forEach(m => exact.add(m)); s.est.forEach(m => est.add(m)); s.pubs.forEach(p => pubs.add(p)); }
  for (const w of T.works || []) if (S.O.topics.includes("work:" + w.id)) { w.ms.forEach(m => exact.add(String(m))); pubs.add(w.id); }
  exact.forEach(m => est.delete(m));
  return {exact, est, pubs};
}
let SUMT = 0;
function sum() {
  const {exact, est, pubs} = chosenSet();
  const pk = [...pubs].flatMap(p => [`work:${p}`, ...(T.publications[p]?.P ? [`pub:${T.publications[p].P}`] : [])]);
  const sure = [...[...exact].map(m => "ms:" + m), ...pk];
  outline(sure); for (const k of sure) light(k, 0.3); for (const m of est) light("ms:" + m, 0.14);
  clearTimeout(SUMT);
  SUMT = setTimeout(async () => {
    const F = await get("/setup/topics/figures", {keys: S.O.topics.join(",")}).catch(() => null);
    if (!F) { $("tp-sum").innerHTML = unknown("the figures did not come"); return; }
    const names = [...new Set([...ROWS.filter(isOn).map(r => r.name), ...(T.works || []).filter(w => S.O.topics.includes("work:" + w.id)).map(w => w.title)])];
    const what = names.length ? ` (${names.length > 2 ? `${esc(names.slice(0, 2).join("; "))} and ${names.length - 2} more` : esc(names.join("; "))})` : "";
    $("tp-sum").innerHTML = !F.manuscripts && !F.publications ? `Nothing chosen: your manuscripts are read in catalogue order, the tidier pages first.` :
      `On what you chose${what}: ` + `<b class="num">${F.yours ? `${nf(F.yours)} of your manuscripts` : "none of your linked manuscripts"}</b>` +
      (F.yours ? ` (${plural(F.pages, "page", "pages")}): reading them first takes ${fmtLeft(F.first, "", F.reason)}` : "") +
      `. <span class="k">In the whole catalogue: ${plural(F.manuscripts, "manuscript", "manuscripts")}${F.publications ? ` · ${plural(F.publications, "publication", "publications")}` : ""}.</span>`;
  }, 150);
}
function setKeys(keys, onOff) {
  const S2 = new Set(S.O.topics); keys.forEach(k => onOff ? S2.add(k) : S2.delete(k));
  save({topics: [...S2]}); sum();
}
on("input", "#tp-wq", works);
on("change", "#tp-groups input", x => { const r = ROWS.find(y => y.id === x.value); if (r) setKeys(r.keys, x.checked); });
on("change", "#tp-works input", x => setKeys([x.value], x.checked));
on("change", "#tp-other", x => save({topic_other: x.value.trim()}));
let OTH = 0;
on("input", "#tp-other", x => { clearTimeout(OTH); OTH = setTimeout(() => offer(x.value), 200); });
function offer(text) {
  const words = norm(text).split(" ").filter(w => w.length >= 4 && !["about", "their", "which", "peirce", "peirce's"].includes(w));
  const stem = w => w.replace(/(ies|es|s|ing|ism|ist|ical|ic|al)$/, "").slice(0, 7);
  const ws = words.map(stem).filter(w => w.length >= 4);
  const hits = !ws.length ? [] : [
    ...ROWS.map(r => ({key: r.id, name: r.name, where: r.group, on: isOn(r), text: [r.name, ...r.secs.map(x => x.name), ...r.tops.map(t => t.name + " " + t.line)].join(" ")})),
    ...(T.works || []).map(w => ({key: "work:" + w.id, name: w.title, where: "work", on: S.O.topics.includes("work:" + w.id), text: w.title})),
  ].map(h => ({...h, n: ws.filter(w => norm(h.text).split(" ").some(x => x.startsWith(w))).length})).filter(h => h.n).sort((a, b) => b.n - a.n).slice(0, 8);
  $("tp-offer").innerHTML = !text.trim() ? "" : hits.length ? `<span class="k">Close to it:</span> ` + hits.map(h => `<button type="button" data-offer="${esc(h.key)}"${h.on ? " disabled" : ""}>${h.on ? "✓ " : "+ "}${esc(h.name)} <span class="k">${esc(h.where)}</span></button>`).join("")
    : `<span class="k">Nothing in the lists matches those words; it is kept as you wrote it.</span>`;
}
on("click", "[data-offer]", b => {
  const k = b.dataset.offer, r = ROWS.find(y => y.id === k);
  setKeys(r ? r.keys : [k], true);
  if (r) { const i = document.querySelector(`#tp-groups input[value="${CSS.escape(k)}"]`); if (i) i.checked = true; } else works();
  b.disabled = true; b.firstChild.textContent = "✓ " + b.firstChild.textContent.slice(2);
});
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let STOPS = [];
export async function overnight() {
  STOPS.forEach(f => f()); STOPS = [];
  week(); est();
}
export const leaveOvernight = () => { STOPS.forEach(f => f()); STOPS = []; };
const weekOf = sc => sc.week?.length === 7 ? sc.week.map(d => new Set(d)) : DAYS.map(() => hoursOf(sc.when === "hours" ? sc : {...sc, when: "tonight", hours: TONIGHT}));
function week() {
  const W = weekOf(S.O.schedule);
  $("on-week").innerHTML = `<div class="wk-h"><span></span>${Array.from({length: 24}, (_, h) => `<span>${h % 6 ? "" : String(h).padStart(2, "0")}</span>`).join("")}</div>` +
    DAYS.map((d, i) => `<div class="wk-r"><span>${d}</span>${Array.from({length: 24}, (_, h) => `<button type="button" class="${W[i].has(h) ? "on" : ""}" data-d="${i}" data-h="${h}" aria-pressed="${W[i].has(h)}" aria-label="${d} ${String(h).padStart(2, "0")}:00"></button>`).join("")}</div>`).join("");
  $("on-plug").checked = S.O.schedule.plugged_in; $("on-pause").checked = S.O.schedule.pause_in_use;
}
function setWeek(W) { save({schedule: {...S.O.schedule, when: "hours", week: W.map(s => [...s].sort((a, b) => a - b)), hours: [...W[0]].sort((a, b) => a - b)}}); week(); est(); }
on("click", "#on-week [data-h]", b => { const W = weekOf(S.O.schedule), d = +b.dataset.d, h = +b.dataset.h; W[d].has(h) ? W[d].delete(h) : W[d].add(h); setWeek(W); });
on("click", "[data-preset]", b => {
  const p = b.dataset.preset, W = DAYS.map((_, i) => new Set(p === "nights" ? TONIGHT : p === "weekends" ? (i >= 5 ? Array.from({length: 24}, (_, h) => h) : TONIGHT) : p === "always" ? Array.from({length: 24}, (_, h) => h) : []));
  setWeek(W);
});
on("change", "#on-plug", x => save({schedule: {...S.O.schedule, plugged_in: x.checked}}));
on("change", "#on-pause", x => save({schedule: {...S.O.schedule, pause_in_use: x.checked}}));
export async function timeOwnPages() {
  const L = await get("/library"), m = (L.manuscripts || []).find(x => x.held && (x.pages || 0) > 0);
  if (!m) throw new Error("No manuscript pages are in your library yet");
  const M = await get(`/manuscripts/${m.ms}`);
  return (await post("/reading/jobs", {pages: [M.sheets[0].stem], span: "next", n: 10})).id;
}
on("click", "#on-test", async b => {
  b.disabled = true;
  if (b.dataset.own) {
    try { await timeOwnPages(); b.textContent = "Reading ten of your pages now"; }
    catch (e) { b.disabled = false; $("on-est").insertAdjacentHTML("afterbegin", failNote(e, () => b.click())); return; }
    est(); return;
  }
  b.textContent = "Added: ten sheets are timed first"; await enqueue({kind: "measure", label: "Time ten test sheets on this Mac", count: 10, ref: "measure"}); est();
});
let EST = 0;
export async function est() {
  const [W, st] = await Promise.all([get("/setup/when").catch(() => null), get("/import/status").catch(() => null)]);
  const meas = [...(st?.now || []), ...(st?.next || []), ...(st?.done || [])].find(x => /test sheets/.test(x.label));
  const can = st?.can_time !== false;
  const own = !can && !st?.reading?.seconds_per_page, tb = $("on-test");
  if (own && !tb.dataset.own) { tb.dataset.own = "1"; tb.textContent = "Time 10 test pages"; }
  tb.hidden = !can && !own && !tb.disabled;
  $("on-act").hidden = tb.hidden || (!!meas && meas.state === "done");
  if (own && tb.disabled) { clearTimeout(EST); EST = setTimeout(() => S.O.step === "night" && est(), 5000); }
  if (!W) { $("on-est").innerHTML = `<p>${unknown("the figures did not come")}</p>`; return; }
  const per = W.per_day != null ? `About <b class="num">${nf(W.per_day)}</b> pages a day at these hours` : `Pages a day: ${unknown(W.reason)}`;
  const spp = st?.reading?.seconds_per_page;
  const timed = !can && spp ? `<p>Timed on this Mac: about ${spp.seconds.toFixed(0)} s a page <span class="k">(${esc(spp.source)})</span>.</p>` : "";
  const mline = !meas ? timed : meas.state === "done" && spp ? `<p>Ten test sheets timed on this Mac: about ${spp.seconds.toFixed(1)} s a page.</p>` :
    meas.state === "failed" ? `<p>The ten test sheets could not be timed here; the figures below stay rough.</p>` :
    `<p>Ten test sheets: ${meas.state === "running" ? `being timed (${nf(meas.done)} of ${nf(meas.total || 10)})` : "queued"}. Until they are timed, the figures below are rough.</p>`;
  if (meas && meas.state !== "done" && meas.state !== "failed") { clearTimeout(EST); EST = setTimeout(() => S.O.step === "night" && est(), 2500); }
  const slow = W.slow?.length ? `<p class="slowmac">This Mac is on the slow side for reading (${esc(W.slow.join("; "))})${W.per_day != null ? `: about ${nf(W.per_day)} pages a ${S.O.schedule.when === "tonight" ? "night" : "day"}` : ""}. Sorting and reading will take longer here; both will get faster in later versions.</p>` : "";
  $("on-est").innerHTML = mline + slow +
    `<p>${per}${W.pages ? `; your ${nf(W.pages)} pages, with what else is queued, ${W.finish ? `would be done by about <b>${fmtIso(W.finish)}</b>` : `finish: ${unknown(W.reason)}`}` : ""} ${W.left ? fmtLeft(W.left, "").replace(/^[^<]*/, "") : ""}</p>`;
}
export async function overview() {
  const H = await get("/setup/have").catch(() => null);
  if (!H) { $("ov-body").innerHTML = `<p>${unknown("the figures did not come")}</p>`; return; }
  const KINDS = [["scan", "Manuscripts"], ["lifetime", "Published in his lifetime"], ["edition", "Later collections"]];
  const src = H.sources.map(r => `<div class="ov-s"><span>${esc(r.label)}</span><span class="k">${r.state === "looking" ? `still sorting · ${lookedAt(r.looked, r.total)}` : `sorted · ${items(r.looked)}`}</span></div>`).join("");
  const row = (label, v) => `<div class="ov-r"><b>${label}</b><span>${v}</span></div>`;
  if (H.state === "nothing") $("ov-body").innerHTML = `<p>Nothing linked yet. The corpus works without it: the catalogue, the concordance, Works and search are all there.</p>`;
  else if (H.state === "sorting") $("ov-body").innerHTML = KINDS.map(([, l]) => row(l, `<span class="k">still separating</span>`)).join("") + src + `<p class="k">The counts come once sorting is finished. It carries on in the background if you go on.</p>`;
  else {
    const by = Object.fromEntries(H.rows.map(r => [r.kind, r])), sc = by.scan;
    const msMiss = sc && sc.count != null && sc.of != null && sc.of > sc.count ? sc.of - sc.count : 0;
    const fig = r => !r ? `<span class="k">none found</span>` : r.count == null ? unknown("withheld: out of the importer's bounds") : `estimate: <b class="num">${nf(r.count)}</b>${r.of != null ? ` out of ${nf(r.of)}` : ""} ${esc(r.unit)}${r.part ? `, ${nf(r.part)} in part` : ""}${r.unknown ? `, ${nf(r.unknown)} not known` : ""}`;
    $("ov-body").innerHTML = KINDS.map(([k, l]) => row(l, fig(by[k] || (k === "scan" ? by.reel : null)))).join("") + src +
      `<p class="k">From file names${H.sources.some(r => /^Zotero/.test(r.label || "")) ? ", Zotero records" : ""} and the files' text: estimates; check them in the Library.</p>` +
      (H.missing ? `<p>It looks like you are missing a few texts <span class="k">(${msMiss ? `${nf(msMiss)} of the manuscripts; ` : ""}${nf(H.missing)} of his lifetime publications${H.free != null ? `, ${nf(H.free)} of them free online` : ""})</span>. Later, we can point you to links for open access versions of the texts you are missing.</p>`
        : H.reason ? `<p class="k">${esc(H.reason)}, so nothing is said to be missing yet.</p>` : "");
  }
}
