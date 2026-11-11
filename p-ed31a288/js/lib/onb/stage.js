export const CALM = matchMedia("(prefers-reduced-motion: reduce)");
export const COLOUR = {scan: "#3a6fd8", reel: "#3a6fd8", read: "#2a4f9e", lifetime: "#c08a3e", edition: "#8f6bd1",
  other: "#4d93b8", unknown: "#6b6b66"};
const TOK = new Map();
export function tok(name, fallback = "") {
  if (!TOK.has(name)) TOK.set(name, getComputedStyle(document.body).getPropertyValue(name).trim() || fallback);
  return TOK.get(name);
}
(window.PXDARK || matchMedia("(prefers-color-scheme: dark)")).addEventListener("change", () => { TOK.clear(); if (G) { if (FREE) drawFree(); else draw(); } kick(); });
const GROUND = () => tok("--st-ground", "#0b0b0c"), LINE = () => tok("--st-line", "#1c1d20");
let G = null;
let F = null;
let raf = 0;
export function grid(canvas, corpus, kinds) {
  const cx = canvas.getContext("2d");
  G = {cv: canvas, cx, keys: corpus, kinds, cells: [], byKey: new Map(), moving: null};
  layout();
  addEventListener("resize", () => {
    if (FREE) { const dpr = devicePixelRatio || 1; G.cv.width = innerWidth * dpr; G.cv.height = innerHeight * dpr; G.cx.setTransform(dpr, 0, 0, dpr, 0, 0); drawFree(); }
    else layout();
    if (F) sizeFx();
  });
  return G;
}
function layout() {
  const dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  G.cv.width = W * dpr; G.cv.height = H * dpr; G.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = G.keys.length;
  let cell = Math.floor(Math.sqrt(W * H / (n * 1.6)));
  cell = Math.max(12, Math.min(28, cell));
  const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
  const old = new Map(G.cells.map(c => [c.key, c]));
  let seed = 1234567; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const slots = Array.from({length: cols * rows}, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  G.cell = cell; G.cols = cols; G.rows = rows; G.cells = []; G.byKey.clear(); G.byVol = new Map(); G.byWork = new Map();
  G.keys.forEach((key, i) => {
    if (i >= slots.length) return;
    const s = slots[i], o = old.get(key);
    const c = {key, kind: G.kinds[i], x: (s % cols) * cell, y: Math.floor(s / cols) * cell, a: o?.a || 0, ta: o?.ta || 0, col: o?.col || null, outline: o?.outline || 0};
    G.cells.push(c); G.byKey.set(key, c);
    const h = key.indexOf("#");
    if (h > 0) { const v = key.slice(0, h), w = key.slice(h + 1);
      (G.byVol.get(v) || G.byVol.set(v, []).get(v)).push(c); (G.byWork.get(w) || G.byWork.set(w, []).get(w)).push(c); }
  });
  draw();
}
function draw() {
  const {cx, cell, cols, rows} = G, W = cols * cell, H = rows * cell;
  cx.fillStyle = GROUND(); cx.fillRect(0, 0, W, H);
  cx.strokeStyle = LINE(); cx.lineWidth = 1; cx.beginPath();
  for (let i = 0; i <= cols; i++) { cx.moveTo(i * cell + .5, 0); cx.lineTo(i * cell + .5, H); }
  for (let j = 0; j <= rows; j++) { cx.moveTo(0, j * cell + .5); cx.lineTo(W, j * cell + .5); }
  cx.stroke();
  for (const c of G.cells) {
    if (c.a > 0.004) { cx.globalAlpha = c.a; cx.fillStyle = c.col || COLOUR[c.kind]; cx.fillRect(c.x + 2, c.y + 2, cell - 3, cell - 3); }
    if (c.outline > 0.01) { cx.globalAlpha = c.outline; cx.strokeStyle = tok("--st-outline", "#7aa0e6"); cx.strokeRect(c.x + 1.5, c.y + 1.5, cell - 2, cell - 2); }
  }
  cx.globalAlpha = 1;
}
function settle() {
  let moving = false;
  for (const c of G.cells) {
    if (Math.abs(c.a - c.ta) > 0.004) { c.a += (c.ta - c.a) * 0.08; moving = true; } else c.a = c.ta;
    const to = c.oto || 0; if (Math.abs(c.outline - to) > 0.01) { c.outline += (to - c.outline) * 0.12; moving = true; } else c.outline = to;
  }
  return moving;
}
export function cellsOf(key) {
  if (!G) return [];
  if (key.startsWith("work:")) return G.byWork.get(key.slice(5)) || [];
  const c = G.byKey.get(key);
  return c ? [c] : G.byVol.get(key) || [];
}
export function light(key, a = 0.35, col = null) {
  for (const c of cellsOf(key)) { c.ta = Math.max(c.ta, a); if (col) c.col = col; if (CALM.matches) c.a = c.ta; }
  kick();
}
export function outline(keys, on = 0.55) {
  if (!G) return;
  const S = new Set(keys.flatMap(k => cellsOf(k).map(c => c.key)));
  for (const c of G.cells) c.oto = S.has(c.key) ? on : 0;
  if (CALM.matches) for (const c of G.cells) c.outline = c.oto;
  kick();
}
export function darken(share = 1, keep = null) {
  if (!G) return;
  for (const c of G.cells) if ((!keep || !keep.has(c.key)) && Math.random() < share) { c.ta = 0; c.col = null; }
  if (CALM.matches) for (const c of G.cells) c.a = c.ta;
  kick();
}
export const cells = () => G?.cells || [];
export function fx(canvas) { F = {cv: canvas, cx: canvas.getContext("2d"), wires: new Map(), pulses: []}; sizeFx(); return F; }
function sizeFx() { const dpr = devicePixelRatio || 1; F.cv.width = innerWidth * dpr; F.cv.height = innerHeight * dpr; F.cx.setTransform(dpr, 0, 0, dpr, 0, 0); kick(); }
const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width / 2, r.height / 2]; };
export function wire(id, from, to, col = "--w", side = "auto", width = 2, dash = null) { if (!F) return; F.wires.set(id, {id, from, to, col, side, lit: 0, width, dash}); kick(); }
export const wireOf = id => F?.wires.get(id) || null;
export function fadeWires(prefix, ms = 700) {
  if (!F) return;
  const ws = [...F.wires.values()].filter(w => w.id.startsWith(prefix));
  if (CALM.matches || !ws.length) { unwire(prefix); return; }
  const t0 = performance.now(), step = now => {
    const f = Math.min(1, (now - t0) / ms);
    for (const w of ws) w.alpha = (w.a0 ??= (w.alpha ?? 1)) * (1 - f);
    drawFx(now);
    if (f < 1) requestAnimationFrame(step); else for (const w of ws) if (F.wires.get(w.id) === w) F.wires.delete(w.id);
    if (f >= 1) kick();
  };
  requestAnimationFrame(step);
}
export function unwire(prefix = "") { if (!F) return; for (const k of [...F.wires.keys()]) if (k.startsWith(prefix)) F.wires.delete(k); kick(); }
let PSEED = 7;
const prnd = () => (PSEED = (PSEED * 16807) % 2147483647) / 2147483647;
export const pipeIds = () => F ? [...F.wires.keys()].filter(k => k.startsWith("pp:") || k.startsWith("pf:")) : [];
export function squarePipes(folder, to, n = 8, col = "--w-pipe") {
  if (!F) return; PSEED = 11; unwire("pp:"); unwire("pf:");
  F.wires.set("pf:0", {id: "pf:0", from: folder, to, col, side: "mpipe", edge: true, lit: 0, width: 3, alpha: .9, dash: null, r: [.5, .5, .5]});
  const EDGES = ["top", "right", "top", "right", "left", "right", "top", "left", "right"];
  for (let i = 1; i < n; i++) {
    const r = Array.from({length: 3}, prnd);
    F.wires.set(`pp:${i}`, {id: `pp:${i}`, from: null, to, col, side: "mpipe", side0: EDGES[(i - 1) % EDGES.length], lit: 0, width: 2 + 1.6 * r[2], alpha: .5 + .35 * r[1], dash: null, r});
  }
  kick();
}
export function atFolder(on) { const w = F?.wires.get("pf:0"); if (w) { w.edge = !on; kick(); } }
function mpipePts(w) {
  const b = w.to.getBoundingClientRect();
  if (!b.width) return null;
  const cx = b.left + b.width / 2, cy = b.top + b.height / 2, R = b.width / 2 - 2, r = w.r, W = innerWidth, H = innerHeight;
  const off = (r[2] - .5) * 1.1 * R;
  let P;
  if (w.from) {
    const a = w.from.getBoundingClientRect();
    if (!a.height) return null;
    const x0 = w.edge ? 0 : a.right - a.width * .12, y0 = a.top + a.height * .45;
    const yE = cy + (y0 - cy) * .4, xm = x0 + (cx - R - x0) * (w.edge ? .7 : .55);
    P = [[x0, y0], [xm, y0], [xm, yE], [cx - Math.sqrt(Math.max(0, R * R - (yE - cy) ** 2)), yE]];
  } else if (w.side0 === "left" || w.side0 === "right") {
    const s = w.side0 === "left" ? -1 : 1, x0 = s < 0 ? -4 : W + 4, y0 = H * (.08 + .84 * r[0]);
    const xm = x0 + (cx - x0) * (.35 + .4 * r[1]), yE = cy + off;
    P = [[x0, y0], [xm, y0], [xm, yE], [cx + s * Math.sqrt(Math.max(0, R * R - off * off)), yE]];
  } else {
    const x0 = W * (.08 + .84 * r[0]), y0 = -4, ym = y0 + (cy - y0) * (.3 + .4 * r[1]), xE = cx + off;
    P = [[x0, y0], [x0, ym], [xE, ym], [xE, cy - Math.sqrt(Math.max(0, R * R - off * off))]];
  }
  const poly = [P[0]], rad = 14;
  for (let i = 1; i < P.length - 1; i++) {
    const [p0, p1, p2] = [P[i - 1], P[i], P[i + 1]];
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const k1 = Math.min(rad, d1 / 2) / d1, k2 = Math.min(rad, d2 / 2) / d2;
    const A = [p1[0] - (p1[0] - p0[0]) * k1, p1[1] - (p1[1] - p0[1]) * k1], B = [p1[0] + (p2[0] - p1[0]) * k2, p1[1] + (p2[1] - p1[1]) * k2];
    for (let t = 0; t <= 1; t += .2) { const u = 1 - t; poly.push([u * u * A[0] + 2 * u * t * p1[0] + t * t * B[0], u * u * A[1] + 2 * u * t * p1[1] + t * t * B[1]]); }
  }
  poly.push(P[P.length - 1]);
  return {poly};
}
function path(w) {
  if (w.side === "mpipe") return mpipePts(w);
  const [ax, ay, aw, ah] = centre(w.from), [bx, by, bw, bh] = centre(w.to);
  if (!aw || !bw) return null;
  if (w.side === "down") { const y0 = ay + ah, y1 = by - bh, m = (y0 + y1) / 2; return [bx, y0, bx, m, bx, m, bx, y1]; }
  if (w.side === "edge") {
    const x0 = ax + aw, x1 = bx - bw, dx = Math.max(24, (x1 - x0) / 2);
    const y0 = ay - ah + 2 * ah * (w.p0 ?? .5), y1 = by - bh + 2 * bh * (w.p1 ?? .5);
    return [x0, y0, x0 + dx, y0, x1 - dx, y1, x1, y1];
  }
  const dir = Math.sign(bx - ax) || 1;
  const x0 = ax + dir * aw, x1 = bx - dir * (bw * 0.96);
  const y1 = by + (ay - by) * 0.25;
  const mx = (x0 + x1) / 2;
  return [x0, ay, mx, ay, mx, y1, x1, y1];
}
function at(p, t) {
  if (p.poly) {
    const P = p.poly, L = p.len || (p.len = P.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - P[i][0], q[1] - P[i][1]), 0));
    let d = t * L;
    for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (d <= l || i === P.length - 1) { const f = l ? Math.min(1, d / l) : 1; return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]; } d -= l; }
  }
  const [x0, y0, c1x, c1y, c2x, c2y, x1, y1] = p, u = 1 - t;
  return [u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1, u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1];
}
export function pulse(id, col, land, speed = 1) {
  const w = F?.wires.get(id); if (!w) { land?.(); return; }
  if (CALM.matches) { land?.(); return; }
  F.pulses.push({w, col, t0: performance.now(), dur: 900 / speed, land});
  kick();
}
function drawFx(now) {
  const {cx} = F; cx.clearRect(0, 0, innerWidth, innerHeight);
  for (const w of F.wires.values()) {
    const p = path(w); if (!p) continue; w.p = p;
    cx.beginPath();
    if (p.poly) { cx.lineJoin = "round"; cx.moveTo(p.poly[0][0], p.poly[0][1]); for (const q of p.poly.slice(1)) cx.lineTo(q[0], q[1]); }
    else { cx.moveTo(p[0], p[1]); cx.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]); }
    cx.setLineDash(w.dash || []);
    cx.globalAlpha = w.alpha ?? 1; cx.strokeStyle = w.col.startsWith("--") ? tok(w.col, "#2b3442") : w.col; cx.lineWidth = w.width || 2; cx.stroke();
  }
  cx.globalAlpha = 1; cx.setLineDash([]);
  const landed = [];
  F.pulses = F.pulses.filter(q => {
    const t = (now - q.t0) / q.dur, p = q.w.p || path(q.w);
    if (!p || t >= 1) { landed.push(q); return false; }
    for (let k = 0; k < 6; k++) {
      const [x, y] = at(p, Math.max(0, t - k * 0.018));
      cx.globalAlpha = k ? (1 - k / 6) * 0.6 : 1; cx.fillStyle = q.col;
      cx.beginPath(); cx.arc(x, y, k ? 2.6 - k * 0.3 : 3.6, 0, 7); cx.fill();
    }
    cx.globalAlpha = 1;
    return true;
  });
  for (const q of landed) q.land?.();
}
function tick(now) {
  raf = 0;
  const m = G ? settle() : false;
  if (G) { if (FREE) drawFree(); else draw(); }
  if (F) drawFx(now);
  if (m || F?.pulses.length || G?.moving) raf = requestAnimationFrame(tick);
}
export function kick() { if (!raf) raf = requestAnimationFrame(tick); }
let FOLLOW = 0;
export function follow(ms) {
  if (!F) return;
  const until = performance.now() + ms, step = now => { drawFx(now); FOLLOW = now < until ? requestAnimationFrame(step) : 0; };
  cancelAnimationFrame(FOLLOW); FOLLOW = requestAnimationFrame(step);
}
let FREE = null;
function drawFree() {
  const {cx} = G, f = FREE;
  cx.fillStyle = GROUND(); cx.fillRect(0, 0, innerWidth, innerHeight);
  if (f.gridA > 0.01) {
    cx.globalAlpha = f.gridA; cx.strokeStyle = LINE(); cx.beginPath();
    for (let i = 0; i <= G.cols; i++) { cx.moveTo(i * G.cell + .5, 0); cx.lineTo(i * G.cell + .5, innerHeight); }
    for (let j = 0; j <= G.rows; j++) { cx.moveTo(0, j * G.cell + .5); cx.lineTo(innerWidth, j * G.cell + .5); }
    cx.stroke();
  }
  if (f.gathered) {
    for (const c of G.cells) {
      const g = f.gathered.has(c.key), h = g && f.hi && f.hi.has(c.key);
      cx.globalAlpha = g ? (f.hi ? (h ? 1 : f.rest ?? 0.22) : f.lit) : Math.min(c.a, f.dim);
      cx.fillStyle = h && f.hiCol ? f.hiCol : (c.col || COLOUR[c.kind]);
      if (cx.globalAlpha > 0.004) cx.fillRect(c.px, c.py, c.ps, c.ps);
    }
    cx.globalAlpha = 1; return;
  }
  for (const c of G.cells) {
    const lit = f.em ? (f.em.has(c.key) ? 0.95 : 0.12) : Math.max(c.a, f.floor);
    cx.globalAlpha = lit; cx.fillStyle = f.em && f.em.has(c.key) ? tok(c.kind === "scan" ? "--st-em-scan" : c.kind === "lifetime" ? "--st-em-life" : "--st-em-ed", "#b79cf0") : (c.col || COLOUR[c.kind]);
    cx.fillRect(c.px, c.py, c.ps, c.ps);
  }
  cx.globalAlpha = .55; cx.strokeStyle = tok("--st-link", "#a9c6f7"); cx.lineWidth = 1;
  for (const [x0, y0, x1, y1] of f.links) { cx.beginPath(); cx.moveTo(x0, y0); cx.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1); cx.stroke(); }
  cx.globalAlpha = 1;
}
export function freeMode() {
  if (!G || FREE) return;
  for (const c of G.cells) { c.px = c.x + 2; c.py = c.y + 2; c.ps = G.cell - 3; }
  FREE = {floor: 0, em: null, links: [], gridA: 1};
}
export function arrange(targets, dur = 1300, floor = 0.55) {
  freeMode();
  return new Promise(res => {
    if (!G) { res(); return; }
    const t0 = performance.now(), d = CALM.matches ? 0 : dur;
    for (const c of G.cells) { c.f = [c.px, c.py, c.ps]; const t = targets.get(c.key); c.t = t || [innerWidth + 30 + Math.random() * 200, c.py, c.ps]; }
    const g0 = FREE.gridA, fl0 = FREE.floor;
    const step = now => {
      const f = d ? Math.min(1, (now - t0) / d) : 1, e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      for (const c of G.cells) { c.px = c.f[0] + (c.t[0] - c.f[0]) * e; c.py = c.f[1] + (c.t[1] - c.f[1]) * e; c.ps = c.f[2] + (c.t[2] - c.f[2]) * e; }
      FREE.gridA = g0 * (1 - e); FREE.floor = fl0 + (floor - fl0) * e;
      drawFree();
      if (f < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}
export function blocks(groups) {
  const T = new Map();
  for (const {keys, box} of groups) {
    if (!keys.length) continue;
    let s = Math.floor(Math.sqrt(box.w * box.h / keys.length));
    while (s > 2 && Math.ceil(keys.length / Math.floor(box.w / s)) * s > box.h) s--;
    const per = Math.max(1, Math.floor(box.w / s)), size = Math.max(1.5, s - (s > 5 ? 2 : 1));
    keys.forEach((k, i) => T.set(k, [box.x + (i % per) * s, box.y + Math.floor(i / per) * s, size]));
  }
  return T;
}
export const keysOf = prefix => (G?.cells || []).filter(c => c.key.startsWith(prefix)).map(c => c.key);
export function cellRect(key) {
  const c = cellsOf(key)[0]; if (!c) return null;
  return FREE ? {x: c.px, y: c.py, s: c.ps} : {x: c.x + 2, y: c.y + 2, s: G.cell - 3};
}
let GEN = 0;
export function gather(targets, dur = 1100, {dim = 0.05, lit = 0.9} = {}) {
  freeMode();
  FREE.em = null; FREE.links = []; FREE.gathered = new Set(targets.keys()); FREE.dim = dim; FREE.lit = lit;
  const gen = ++GEN;
  return new Promise(res => {
    const t0 = performance.now(), d = CALM.matches ? 0 : dur;
    for (const c of G.cells) { c.f = [c.px, c.py, c.ps]; c.t = targets.get(c.key) || [c.x + 2, c.y + 2, G.cell - 3]; }
    const step = now => {
      if (!FREE || gen !== GEN) { res(); return; }
      const f = d ? Math.min(1, (now - t0) / d) : 1, e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      for (const c of G.cells) { c.px = c.f[0] + (c.t[0] - c.f[0]) * e; c.py = c.f[1] + (c.t[1] - c.f[1]) * e; c.ps = c.f[2] + (c.t[2] - c.f[2]) * e; }
      drawFree();
      if (f < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}
export function pick(hi, col = null, rest = 0.22) { if (!FREE) return; FREE.hi = hi; FREE.hiCol = col; FREE.rest = rest; drawFree(); }
export async function release(dur = 900) {
  if (!FREE || !FREE.gathered) return;
  FREE.hi = null;
  const home = gather(new Map(), dur), g = GEN;
  await home;
  if (g !== GEN || !FREE) return;
  FREE = null; layout(); kick();
}
export const gathered = () => !!FREE?.gathered;
