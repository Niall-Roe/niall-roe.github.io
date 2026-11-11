import {NODES, WIRES, nodeHTML} from "../schematic.js";
import {CALM, pulse, unwire, wire, wireOf, follow} from "./stage.js";
const XS = {id: "xs", type: "xs"};
const ST = {id: "st", type: "box", icon: "lens", name: "Search tools", sub: "an index of words, two search models"};
const PARTS = [...NODES.filter(d => d.id !== "gen" && d.id !== "learn"), XS, ST];
const XS_HTML = `<div class="cell a-xs"><div class="nd t-xs" data-n="xs"><span class="slot" data-slot="greek">Greek</span><span class="slot" data-slot="other">other scripts</span><span class="slot" data-slot="maths">Maths</span><span class="live" data-live="xs"></span></div></div>`;
const XS_WIRES = [["pre", "xs", "right", true], ["xs", "lib", "right", true], ["ms", "st", "right"], ["pdf", "st", "right"], ["st", "lib", "right"]];
const FLOW = matchMedia("(max-width: 860px), (max-height: 620px)");
let host = null, ON = new Set(), WIRED = new Map(), TIMER = 0;
const el = id => host?.querySelector(`[data-n="${id}"]`);
export function mount(h) {
  host = h;
  host.innerHTML = `<div class="scm-nodes">${PARTS.map(d => d === XS ? XS_HTML : nodeHTML(d, {asButton: false})).join("")}</div>`;
  for (const c of host.querySelectorAll(".cell")) c.classList.add("off");
  addEventListener("resize", () => { place(); });
}
export function show({on = [], dim = [], lit = [], extra = [], bare = false} = {}, stagger = true) {
  if (!host) return;
  const was = ON; ON = new Set(on);
  let k = 0;
  for (const d of PARTS) {
    const c = host.querySelector(`.a-${d.id}`), shown = ON.has(d.id), fresh = shown && !was.has(d.id);
    c.style.transitionDelay = fresh && stagger && !CALM.matches ? `${300 + 260 * k++}ms` : "";
    c.classList.toggle("off", !shown);
    c.classList.toggle("dim", dim.includes(d.id));
    c.classList.toggle("here", lit.includes(d.id));
    el(d.id).classList.toggle("lit", lit.includes(d.id));
  }
  host.classList.toggle("has-here", lit.length > 0);
  const ws = WIRES.filter(w => ON.has(w.a) && ON.has(w.b) && !(ON.has("st") && w.a === "pdf" && w.b === "lib")).map(w => [w.a, w.b, w.side]);
  for (const w of XS_WIRES) if (ON.has(w[0]) && ON.has(w[1])) ws.push(w);
  for (const [a, b, via] of extra) if (ON.has(a) && ON.has(b) && !(via && ON.has(via))) ws.push([a, b, "right"]);
  const cy = id => { const r = el(id)?.getBoundingClientRect(); return r ? r.top + r.height / 2 : 0; };
  const outs = {}, ins = {};
  for (const w of ws) if (w[2] === "right") { (outs[w[0]] ||= []).push(w); (ins[w[1]] ||= []).push(w); }
  const port = (list, w, other) => { const L = list.slice().sort((p, q) => cy(p[other]) - cy(q[other])), i = L.indexOf(w); return L.length === 1 ? .5 : .22 + .56 * i / (L.length - 1); };
  const dimmed = w => dim.includes(w[0]) || dim.includes(w[1]);
  const later = (stagger && !CALM.matches) ? 300 + 260 * k : 0;
  const draw = list => {
    unwire("s:"); WIRED.clear();
    if (FLOW.matches || bare) return;
    for (const w of list) {
      const id = `s:${w[0]}-${w[1]}`, from = w[0] === "lib" ? faceEl() : el(w[0]), to = w[1] === "lib" ? faceEl() : el(w[1]);
      if (w[2] === "down") wire(id, from, to, dimmed(w) ? "--w-dim" : "--w-sch", "down", 1.5, [3, 4]);
      else { wire(id, from, to, dimmed(w) ? "--w-dim" : "--w-sch", "edge", w[3] ? 1.5 : 2, w[3] ? [4, 4] : null); const W = wireOf(id); if (W) { W.p0 = port(outs[w[0]], w, 1); W.p1 = port(ins[w[1]], w, 0); } }
      WIRED.set(id, w);
    }
    follow(1400);
  };
  clearTimeout(TIMER);
  if (later) { draw(ws.filter(w => was.has(w[0]) && was.has(w[1]))); TIMER = setTimeout(() => draw(ws), later); }
  else draw(ws);
  place();
}
const faceEl = () => document.getElementById("face");
export const shown = id => ON.has(id);
export function glow(ids) { for (const d of PARTS) el(d.id)?.classList.toggle("lit", ids.includes(d.id)); }
export function slot(k) { host?.querySelectorAll(".slot").forEach(x => x.classList.toggle("lit", x.dataset.slot === k)); }
export function busy(ids) { for (const d of PARTS) el(d.id)?.classList.toggle("busy", ids.includes(d.id)); }
export const nodeEl = el;
export function place() {
  const b = document.body;
  if (!host || b.dataset.sch !== "1" || FLOW.matches) { b.style.removeProperty("--fx"); b.style.removeProperty("--fy"); b.style.removeProperty("--face"); return; }
  const slot = host.querySelector(".a-lib .face"); if (!slot) return;
  const r = slot.getBoundingClientRect(); if (!r.width) return;
  const s = r.width + 8;
  b.style.setProperty("--fx", `${r.left + r.width / 2}px`); b.style.setProperty("--fy", `${r.top + r.height / 2}px`); b.style.setProperty("--face", `${s}px`);
  follow(900);
}
export function walk(route, col, land, speed = 1.6) {
  const hop = i => {
    if (i >= route.length - 1) { land?.(); return; }
    const id = `s:${route[i]}-${route[i + 1]}`;
    if (!WIRED.has(id)) { land?.(); return; }
    pulse(id, col, () => hop(i + 1), speed);
  };
  hop(0);
}
export function route(from) {
  const has = (a, b) => WIRED.has(`s:${a}-${b}`);
  if (from === "ms") { if (!has("ms", "det")) return ["ms", "lib"]; if (has("det", "lib")) return ["ms", "det", "lib"]; const r = ["r1", "r2", ...(ON.has("tp") ? ["tp"] : [])][Math.floor(Math.random() * (ON.has("tp") ? 3 : 2))]; return ["ms", "det", "pre", r, "lib"]; }
  if (from === "lp" || from === "le") { const via = has(from, "pdf") ? [from, "pdf"] : [from]; const t = via[via.length - 1]; return has(t, "st") ? [...via, "st", "lib"] : [...via, "lib"]; }
  if (from === "src") return ["src", ["ms", "lp", "le"][Math.floor(Math.random() * 3)]];
  return [from, "lib"];
}
