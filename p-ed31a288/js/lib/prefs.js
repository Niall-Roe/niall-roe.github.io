export function pref(key, fallback) {
  try { const v = localStorage.getItem("pc_" + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
}
export const secDefault = key => !["library", "mine"].includes(key);
export function setPref(key, value) {
  try { if (sessionStorage.getItem("pc_demo")) return; } catch (e) {   }
  try { localStorage.setItem("pc_" + key, JSON.stringify(value)); } catch (e) {   }
}
export function noteOpened(ms, p, title, stem) {
  const L = pref("last", []).filter(x => x.ms !== ms);
  L.unshift({ms, p, title, stem, when: Date.now()}); setPref("last", L.slice(0, 12));
}
export {ago} from "./fmt.js";
