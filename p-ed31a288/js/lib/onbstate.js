import {esc, toast} from "./dom.js";
import {get, post} from "./api.js";
export const S = {
  O: null,
  library: "",
  demo: null,
  runs: [],
  items: new Map(),
  summary: null,
};
export {num as nf, plural} from "./fmt.js";
export async function save(changes) {
  Object.assign(S.O, changes);
  try { await post("/preferences", {onboarding: changes}); } catch (e) {   }
}
let DEMO = null, SHOW = null;
export async function demo(fresh = false) {
  if (fresh) { S.demo = null; DEMO = null; }
  if (!S.demo) { DEMO ||= get("/setup/demo").catch(() => null); S.demo = await DEMO; if (!S.demo) DEMO = null; }
  return S.demo;
}
export function showcase() {
  SHOW ||= get("/setup/showcase").catch(() => { SHOW = null; return null; });
  return SHOW;
}
export async function enqueue(item) { try { return await post("/import/queue", {items: [item]}); } catch (e) { toast(`Not added to the queue: ${e.message}`); return null; } }
export async function dequeue(ref) {
  try { const Q = await get("/import/queue"), q = Q.items.find(x => x.ref === ref); if (q) await post("/import/queue/remove", {id: q.id}); } catch (e) {   }
}
export function guide(id, why, suggest, next) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<p><b>Why</b><span>${why}</span></p><p><b>We suggest</b><span>${suggest}</span></p><p><b>Next</b><span>${next}</span></p>`;
}
export const sample = what => `<span class="mocktag" title="${esc(what)}">sample</span>`;
