import {demo, showcase} from "../onbstate.js";
import {imageUrl} from "./shows.js";
import {loadTopics} from "./choose.js";
import {loops, stillUrl} from "./loops.js";
export const TIMEOUT = 20000;
export const MIN_MS = 1500;
const reduced = () => matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const GROUPS = [
  ["portrait", "Peirce's portrait"],
  ["fonts", "the fonts"],
  ["demo", "the examples"],
  ["pages", "the example pages"],
  ["showcase", "the demonstrations"],
  ["readers", "the readers' demo"],
  ["compare", "the comparison demo"],
  ["topics", "the topics"],
  ["loops", "the recordings"],
];
const FACES = ['400 16px "EB Garamond"', 'italic 400 16px "EB Garamond"', '500 16px "EB Garamond"', 'italic 500 16px "EB Garamond"', '600 16px "EB Garamond"'];
const L = {items: [], seen: new Set(), best: 0, last: null, finished: false, timedOut: false, t0: performance.now(), ms: 0, subs: new Set()};
const KEEP = [];
const emit = (kind, group) => { for (const f of L.subs) f(kind, group); };
function add(group, p) {
  const it = {group, ok: false};
  L.items.push(it); emit("add", group);
  Promise.resolve(p).catch(() => null).finally(() => { it.ok = true; L.last = group; emit("land", group); check(); });
}
function image(group, stem, url = imageUrl(stem)) {
  if (!stem || L.seen.has(url)) return;
  L.seen.add(url);
  const im = new Image(); im.decoding = "async"; KEEP.push(im);
  add(group, new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = url; }).then(() => im.decode?.()));
}
function check() {
  if (L.finished || L.loaded || L.items.some(i => !i.ok)) return;
  L.loaded = true; L.ms = performance.now() - L.t0;
  const wait = reduced() ? 0 : Math.max(0, MIN_MS - (performance.now() - L.t0));
  setTimeout(() => { if (!L.finished) { L.finished = true; emit("done"); } }, wait);
}
let started = false;
export function start() {
  if (started) return L; started = true;
  const face = document.querySelector(".face img");
  add("portrait", face?.complete ? face.decode?.() : new Promise((res, rej) => { face.onload = res; face.onerror = rej; }));
  for (const f of FACES) add("fonts", document.fonts?.load(f));
  add("demo", demo().then(D => {
    image("pages", D?.page?.stem);
    for (const p of D?.reel || []) for (const st of p.stems || []) image("pages", st);
  }));
  add("showcase", showcase().then(sc => {
    image("readers", sc?.readers?.stem);
    for (const v of sc?.compare?.versions || []) image("compare", v.stem);
  }));
  add("topics", loadTopics());
  add("loops", loops().then(M => { for (const n of M.keys()) image("loops", n, stillUrl(n)); }));
  setTimeout(() => { if (!L.finished) { L.finished = L.timedOut = true; L.ms = performance.now() - L.t0; emit("done"); } }, TIMEOUT);
  return L;
}
export const on = f => { L.subs.add(f); return () => L.subs.delete(f); };
export const finished = () => L.finished;
export const timedOut = () => L.timedOut;
export const took = () => L.ms;
export function share() {
  if (L.finished) return 1;
  const n = L.items.length, d = L.items.filter(i => i.ok).length;
  L.best = Math.max(L.best, n ? d / n : 0);
  const pace = reduced() ? 1 : Math.min(1, (performance.now() - L.t0) / MIN_MS);
  return Math.min(L.best, pace);
}
export function line() {
  if (L.finished) return L.timedOut ? "Ready (some examples are still loading)" : "Ready";
  if (L.loaded) return "Ready";
  const state = g => { const its = L.items.filter(i => i.group === g); return [its.length, its.filter(i => !i.ok).length]; };
  const pick = (L.last && state(L.last)[1] ? L.last : null) || GROUPS.map(x => x[0]).find(g => state(g)[1]);
  if (!pick) return "Loading…";
  const [n, left] = state(pick), label = GROUPS.find(x => x[0] === pick)[1];
  return `Loading ${label}${n > 1 && pick !== "fonts" ? ` (${n - left + 1} of ${n})` : ""}…`;
}
