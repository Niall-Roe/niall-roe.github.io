import {ApiError, get} from "./api.js";
import {esc, on, sleep} from "./dom.js";
const RETRY = new Map();
let N = 0, POLLING = false;
export const searchDown = e => e instanceof ApiError && e.body?.service === "search";
const comingBack = e => searchDown(e) && ["starting", "restarting"].includes(e.body.state);
const final = e => e?.body?.state === "none" || (e instanceof ApiError && e.status >= 400 && e.status < 500);
const sentence = s => { s = String(s || "").trim(); return s ? s[0].toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? "" : ".") : ""; };
export function failNote(e, retry, {what = "", cls = ""} = {}) {
  const id = "st" + (++N), again = !!retry && !final(e);
  if (again) RETRY.set(id, retry);
  if (again && comingBack(e)) poll();
  const why = sentence(e?.message || "No answer.");
  const by = comingBack(e) ? ` <span class="k">It will try again by itself.</span>` : "";
  return `<div class="state fail${again ? "" : " final"}${cls ? " " + esc(cls) : ""}" role="alert" data-st="${id}">` +
    (what ? `${esc(what)} could not be read. ` : "") + esc(why) + by +
    (again ? ` <button type="button" class="small stretry" data-st="${id}">Try again</button>` : "") + `</div>`;
}
export const loadingNote = (text = "loading", cls = "") => `<div class="state loading${cls ? " " + esc(cls) : ""}">${esc(text)}…</div>`;
function run(id) {
  const f = RETRY.get(id); RETRY.delete(id);
  if (f && document.querySelector(`.state.fail[data-st="${id}"]`)) f();
}
on("click", ".stretry", b => { b.disabled = true; b.textContent = "Trying…"; run(b.dataset.st); });
async function poll() {
  if (POLLING) return; POLLING = true;
  try {
    for (let i = 0; i < 200 && RETRY.size; i++) {
      await sleep(3000);
      let st; try { st = await get("/search/process"); } catch { continue; }
      if (st.state === "running") { [...RETRY.keys()].forEach(run); break; }
      if (!["starting", "restarting"].includes(st.state)) break;
    }
  } finally { POLLING = false; }
}
