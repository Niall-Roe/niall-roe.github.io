export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || (status ? `The app could not answer this request (error ${status}).` : NOT_ANSWERING));
    this.status = status; this.body = body || {};
  }
}
export const NOT_ANSWERING = "The app is not answering. If you closed it, open it again.";
async function call(url, init) {
  try { return await fetch(url, init); }
  catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError(0, {error: NOT_ANSWERING, service: "app"});
  }
}
const BASE = "/api/v1";
let session = null;
export let KIND = null;
async function token() {
  if (!session) session = call(BASE + "/session").then(parse);
  try { return (await session).csrf; } catch (e) { session = null; throw e; }
}
export async function libraryKind() {
  if (!session) session = call(BASE + "/session").then(parse);
  try { KIND = (await session).library || null; } catch (e) { session = null; }
  return KIND;
}
async function parse(r) {
  const body = (r.headers.get("content-type") || "").includes("json") ? await r.json().catch(() => null) : null;
  if (!r.ok) throw new ApiError(r.status, body);
  return body;
}
const DEMO_KEY = "pc_demo";
export function demoState() { try { return JSON.parse(sessionStorage.getItem(DEMO_KEY) || "null"); } catch (e) { return null; } }
export const inDemo = () => typeof sessionStorage !== "undefined" && !!demoState();
export function demoStart(O) { try { sessionStorage.removeItem("pc_demo_clock"); sessionStorage.setItem(DEMO_KEY, JSON.stringify({O, t0: Date.now()})); } catch (e) {   } }
export function demoEnd() { try { sessionStorage.removeItem(DEMO_KEY); sessionStorage.removeItem("pc_demo_clock"); } catch (e) {   } keptAgain(); }
function keptAgain() {
  try {
    const x = new XMLHttpRequest(); x.open("GET", BASE + "/webstate", false); x.setRequestHeader("Accept", "application/json"); x.send();
    if (x.status !== 200) return;
    const d = JSON.parse(x.responseText) || {};
    localStorage.clear();
    for (const [k, v] of Object.entries(d)) localStorage.setItem(k, String(v));
  } catch (e) {   }
}
const demoKeep = st => { try { sessionStorage.setItem(DEMO_KEY, JSON.stringify(st)); } catch (e) {   } };
export const demoLog = [];
let DEMO_ANSWERS = null;
export function demoAnswers(h) { DEMO_ANSWERS = h; }
const merge = (a, b) => { const o = {...a}; for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === "object" && !Array.isArray(v) && a?.[k] && typeof a[k] === "object" ? merge(a[k], v) : v; return o; };
async function demoGet(path, params) {
  const st = demoState();
  if (path === "/preferences") { const real = await getReal("/preferences"); return {...real, onboarding: st.O}; }
  if (path === "/setup/demo" || path === "/setup/showcase") return getReal(path, {...(params || {}), shipped: 1});
  const a = await DEMO_ANSWERS?.get?.(path, params || {}, st);
  return a === undefined ? getReal(path, params) : a;
}
function demoPost(path, body) {
  const st = demoState();
  demoLog.push({path, body});
  if (path === "/preferences") { st.O = merge(st.O, body?.onboarding || {}); demoKeep(st); return getReal("/preferences").then(r => ({...r, onboarding: st.O})); }
  const a = DEMO_ANSWERS?.post?.(path, body || {}, st);
  return a === undefined ? Promise.reject(new ApiError(0, {error: DEMO_REFUSED})) : Promise.resolve(a);
}
export const DEMO_REFUSED = "Not saved: this is the demonstration.";
export async function get(path, params) {
  if (inDemo()) return demoGet(path, params);
  return getReal(path, params);
}
async function getReal(path, params) {
  const q = params ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")) : "";
  return parse(await call(BASE + path + q, {headers: {Accept: "application/json"}}));
}
export async function post(path, body) {
  if (inDemo()) return demoPost(path, body);
  const send = async () => call(BASE + path, {method: "POST", body: JSON.stringify(body ?? {}),
    headers: {"Content-Type": "application/json", Accept: "application/json", "X-CSRF-Token": await token()}});
  let r = await send();
  if (r.status === 403) { session = null; r = await send(); }
  return parse(r);
}
export async function postStream(path, body, signal) {
  if (inDemo()) { demoLog.push({path, body}); throw new ApiError(0, {error: "Not in the demonstration: nothing is sent while it runs."}); }
  const send = async () => call(BASE + path, {method: "POST", body: JSON.stringify(body ?? {}), signal,
    headers: {"Content-Type": "application/json", Accept: "application/x-ndjson", "X-CSRF-Token": await token()}});
  let r = await send();
  if (r.status === 403) { session = null; r = await send(); }
  if (!r.ok) await parse(r);
  return r;
}
export const imageUrl = stem => `${BASE}/pages/${encodeURIComponent(stem)}/image`;
export const cropUrl = rel => `${BASE}/crops/${rel.split("/").map(encodeURIComponent).join("/")}`;
