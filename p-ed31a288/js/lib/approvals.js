import {get, post} from "./api.js";
import {esc, on} from "./dom.js";
import {bytes} from "./fmt.js";
const KEPT = "Planned: nothing is sent in this version.<br>Shared or not, your corrections are kept on this Mac for your own readings.";
export const ASKS = {
  split_reels: {q: "Sort the reels into manuscripts?", part: "det"},
  ocr: {q: "Make a plain text copy of each PDF?", part: "pdf"},
  repair_text: {q: "Tidy those copies?", part: "pdf"},
  search: {q: "Build my search?", part: "st"},
  complete: {q: "Fetch his lifetime publications that are free to read online?", part: "lp", net: true},
  dl_reading: {q: "Download the readers?", part: "r1", net: true},
  dl_search: {q: "Download the search models?", part: "lib", net: true},
  share: {q: "Share my corrections with the community?", part: "lib", line: KEPT},
  train: {q: "Let the community train new readers on my corrections?", part: "r1", line: KEPT},
};
const ALWAYS = ["share", "train"];
const TIDY_KEYS = ["split_reels", "ocr", "repair_text", "search", "complete"];
let O = null;
let TIDY = null;
export const answers = () => O?.approvals || {};
export function use(onboarding) { O = onboarding; if (O && !O.approvals) O.approvals = {}; }
export async function tidy(fresh = false) {
  if (!TIDY || fresh) TIDY = await get("/import/tidy", {run: "all"}).catch(() => TIDY);
  return TIDY || [];
}
const tidyOf = k => (TIDY || []).find(t => t.key === k);
const TAG = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l5.5 2v4c0 3.4-2.3 6-5.5 7-3.2-1-5.5-3.6-5.5-7v-4z"/><path d="M5.4 8.2l1.8 1.8 3.4-3.6"/></svg>`;
export function card({key = null, q = ASKS[key]?.q || "", line = "", buttons = null, body = "", again = false, approve = false}) {
  const st = key && !again ? answers()[key] || "" : "";
  if (key && !line) line = ASKS[key]?.line || "";
  const btns = buttons ? buttons.map(([l, a]) => `<button type="button" ${a}>${l}</button>`).join("")
    : `<button type="button" class="go" data-act-ok="1">Approve</button><button type="button" class="quiet" data-act-ok="0">Not now</button>`;
  const done = st === "yes" ? "Approved" : st === "later" ? "Not now" : "";
  const ask = key || approve;
  if (ask) return `<div class="act ask demo" role="group" aria-label="${esc(q)}"><div class="atag">${TAG}Your approval</div><div class="aq">${esc(q)}</div><div class="al">This is just a demo, so there is nothing to approve.</div></div>`;
  return `<div class="act${done ? " answered" : ""}${ask ? " ask" : ""}" ${key ? `data-act="${esc(key)}"` : ""} role="group" aria-label="${esc(ask ? `Your approval: ${q}` : q)}">
    ${ask ? `<div class="atag">${TAG}Your approval</div>` : ""}<div class="aq">${esc(q)}</div>${line ? `<div class="al">${line}</div>` : ""}${body}
    <div class="ab">${btns}</div>
    ${key ? `<div class="aa"><span class="as">${done}</span><button type="button" class="link" data-act-change>Change</button></div>` : ""}</div>`;
}
function paint(k) {
  const st = answers()[k] || "";
  document.querySelectorAll(`.act[data-act="${k}"]`).forEach(c => {
    c.classList.toggle("answered", !!st);
    const s = c.querySelector(".as"); if (s) s.textContent = st === "yes" ? "Approved" : st === "later" ? "Not now" : "";
  });
}
async function remember(changes) {
  Object.assign(O.approvals, changes);
  try { await post("/preferences", {onboarding: {approvals: O.approvals}}); } catch (e) {   }
}
export async function answer(k, yes) {
  const kept = remember({[k]: yes ? "yes" : "later"});
  paint(k);
  await kept;
  if (TIDY_KEYS.includes(k)) {
    await tidy();
    const t = tidyOf(k);
    if (yes && t?.adds && t.applies && t.runs_here !== false) await post("/import/queue", {items: [t.adds]}).catch(() => null);
    if (!yes) {
      const Q = await get("/import/queue").catch(() => null), q = Q?.items.find(x => x.ref === k);
      if (q) await post("/import/queue/remove", {id: q.id}).catch(() => null);
    }
    if (yes) post("/import/queue/start").catch(() => {});
    if (yes && k === "search") await post("/import/queue/now", {kind: "search"}).catch(() => null);
  }
  if (yes && (k === "dl_reading" || k === "dl_search")) await post("/models/download", {kind: k === "dl_reading" ? "reading" : "search"}).catch(() => null);
  document.dispatchEvent(new CustomEvent("act-answer", {detail: {key: k, yes}}));
}
export async function passBy(root) {
  const ks = [...root.querySelectorAll(".act[data-act]:not(.answered)")].map(c => c.dataset.act).filter(k => !answers()[k]);
  if (ks.length) await remember(Object.fromEntries(ks.map(k => [k, "later"])));
}
export async function applying() {
  const T = await tidy(true), M = await get("/models").catch(() => null), out = [];
  for (const k of TIDY_KEYS) { const t = T.find(x => x.key === k); if (t?.applies && offered(k)) out.push({key: k, line: lineOf(t)}); }
  for (const kind of ["reading", "search"]) {
    const d = download(M, kind); if (d) out.push(d);
  }
  for (const k of ALWAYS) out.push({key: k, line: ASKS[k].line});
  return out;
}
export const always = k => ALWAYS.includes(k);
export const offered = k => tidyOf(k)?.runs_here !== false;
export const lineOf = t => esc(t?.figure || "") + (t?.where ? ` · from ${esc(t.where)}` : "") +
  (t?.key === "complete" ? " · sizes known only once fetched" : "") + (t?.runs_here === false ? "<br>Not in this version yet: nothing is fetched, your answer is kept for when it is." : "");
export function download(M, kind) {
  if (!M?.managed) return null;
  const need = (M.models || []).filter(r => r.kind === kind && r.needed && !r.current && !r.env);
  if (!need.length || (M.bundled && need.every(r => M.bundled.roles.includes(r.role))) || !need.every(r => r.host)) return null;
  const host = [...new Set(need.map(r => r.host))].join(", "), total = need.reduce((s, r) => s + r.bytes, 0);
  return {key: kind === "reading" ? "dl_reading" : "dl_search", line: `${bytes(total)} from ${esc(host)}`};
}
on("click", ".act [data-act-ok]", b => { const c = b.closest(".act"); if (c?.dataset.act) answer(c.dataset.act, b.dataset.actOk === "1"); });
on("click", ".act [data-act-change]", b => b.closest(".act")?.classList.remove("answered"));
