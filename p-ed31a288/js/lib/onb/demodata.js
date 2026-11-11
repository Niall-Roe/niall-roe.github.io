import {demoAnswers, demoState, get} from "../api.js";
const RUN = "demo", LABEL = "Demo library";
const RATE = 90;
let ITEMS = null;
const CLOCK = "pc_demo_clock";
const keep = t => { try { sessionStorage.setItem(CLOCK, String(t)); } catch (e) {   } return t; };
let FROM = (() => { try { return +sessionStorage.getItem(CLOCK) || 0; } catch (e) { return 0; } })();
let ARMED = false;
export function demoLinked() { ARMED = true; }
export const demoSorting = () => !demoState() || !!FROM || ARMED;
const looked = () => { if (!FROM && !ARMED) return 0; FROM ||= keep(Date.now()); return Math.min(ITEMS.length, Math.floor((Date.now() - FROM) / 1000 * RATE)); };
async function items() {
  if (ITEMS) return ITEMS;
  let L = null; try { L = await get("/library"); } catch (e) { L = null; }
  const out = [];
  const add = (kind, name, detail, pages, corpus) => out.push({i: out.length, id: "demo-" + out.length, kind, name, detail, pages: pages || 0, corpus, file: true, how: [], strength: "exact", suggestions: []});
  for (const m of L?.manuscripts || []) if (m.held) add("scan", m.title ? `${m.name} ${m.title}` : m.name, m.name, m.pages, [`ms:${m.ms}`]);
  for (const p of L?.publications || []) if (p.held) add("lifetime", p.title || p.P, p.P, p.pages, [`pub:${p.P}`]);
  for (const e of L?.editions || []) if (e.held) add("edition", e.title || e.code, e.code, 0, [`ed:${e.code}`]);
  return (ITEMS = out);
}
const counts = L => { const c = {}, p = {}; for (const x of L) { c[x.kind] = (c[x.kind] || 0) + 1; p[x.kind] = (p[x.kind] || 0) + x.pages; } return {c, p}; };
const ROWS = [["scan", "Manuscripts", "manuscripts"], ["lifetime", "Published in his lifetime", "entries in Ketner's list"], ["edition", "Later editions", "volumes"]];
const linked = () => !!demoState()?.O?.run;
async function answerGet(path, q) {
  if (path === "/import/sources") return {zotero: [], zotero_state: "absent", folders: [], developer_folders: []};
  if (!linked() && path === "/import/status") return {now: [], next: [], done: [], why: "", reading: null, can_time: false};
  if (!["/import/progress", "/import/summary", "/import/status", "/import/queue", "/import/tidy", "/setup/have", "/setup/when"].includes(path)) return undefined;
  const L = await items(), n = looked(), done = n >= L.length, seen = L.slice(0, n), {c, p} = counts(seen);
  if (path === "/import/progress") {
    const from = Math.max(0, +q.since || 0);
    return {run: RUN, label: LABEL, state: done ? "done" : "looking", items: L.slice(from, n), next: n, counts: c, pages: p, looked: n, total: L.length, sample: true};
  }
  if (path === "/import/summary") {
    return {run: "all", complete: done, sources: [{run: RUN, label: LABEL, complete: done, looked: n, found: L.length}], looked: n, found: n,
      rows: ROWS.map(([k, label, unit]) => ({kind: k, label, unit, count: done ? c[k] || 0 : null, so_far: done ? null : c[k] || 0, pages: done ? p[k] || 0 : null, names: []})),
      pages: done ? seen.reduce((t, x) => t + x.pages, 0) : null, to_read: done ? p.scan || 0 : null, check: []};
  }
  if (path === "/import/status") {
    return {now: done ? [] : [{key: "link:" + RUN, label: `sorting files (${LABEL})`, state: "running", done: n, total: L.length, left: null}], next: [], done: [], why: "", reading: null, can_time: false};
  }
  if (path === "/import/queue") return {started: false, items: [], share: 0, left: null, sample: true};
  if (path === "/import/tidy") return [];
  if (path === "/setup/have") {
    return {state: done ? "done" : "sorting", sources: [{label: LABEL, state: done ? "done" : "looking", looked: n, total: L.length}],
      rows: ROWS.map(([k, label, unit]) => ({kind: k, label, unit, count: done ? c[k] || 0 : null})), unsure: 0, reason: "a demonstration: nothing is said to be missing"};
  }
  if (path === "/setup/when") return {pages: done ? p.scan || 0 : null, hours_week: 56, per_day: null, left: null, finish: null, reason: "a demonstration: nothing is read"};
  return undefined;
}
function answerPost(path) {
  if (path === "/import/choose-folder") return {path: LABEL};
  if (path === "/import/link") { FROM = keep(Date.now()); return {run: RUN, label: LABEL}; }
  if (path.startsWith("/import/queue") || path === "/search/build") return {started: false, items: [], share: 0, left: null, sample: true};
  if (path === "/reading/jobs") return {id: "demo", status: "queued", pages: 0};
  if (path === "/import/reset") return {};
  return undefined;
}
export function demoSetup() { demoAnswers({get: answerGet, post: answerPost}); }
export const DEMO_START = {step: "start", finished: false, skipped: [], run: RUN, zotero_lib: null, topic_other: "", topics: [], readers: [],
  schedule: {when: "tonight", hours: [23, 0, 1, 2, 3, 4, 5, 6], week: [], plugged_in: true, pause_in_use: true}, tutorial: "new", welcome: "",
  no_mss: false, tutorial_step: 0, search_tour: "", search_step: 0, tips_seen: [], approvals: {}};
