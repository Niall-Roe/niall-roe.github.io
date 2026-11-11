const num = v => typeof v === "number" && Number.isFinite(v);
export const usable = m => !!(m && typeof m.question === "string" && m.question && m.q && num(m.q.x) && num(m.q.y)
  && Array.isArray(m.points) && m.points.length >= 3 && m.points.every(p => p && num(p.x) && num(p.y) && p.cite)
  && m.points.some(p => p.near));
export const nearest = m => m.points.filter(p => p.near).sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9));
export const opened = m => nearest(m).find(p => !p.machine && !p.think && typeof p.excerpt === "string" && p.excerpt.trim()) || null;
export const groups = m => [...new Set(m.points.map(p => p.group))];
export function fit(m, W, H, {pad = 10, top = 0, stretch = 1.8} = {}) {
  const xs = [...m.points.map(p => p.x), m.q.x], ys = [...m.points.map(p => p.y), m.q.y];
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = Math.max(1, W - 2 * pad), h = Math.max(1, H - 2 * pad - top), dx = x1 - x0 || 1, dy = y1 - y0 || 1;
  const sy = Math.min(h / dy, w / dx), sx = Math.min(w / dx, sy * stretch);
  const ox = pad + (w - dx * sx) / 2, oy = pad + top + (h - dy * sy) / 2;
  const at = (x, y) => [ox + (x - x0) * sx, oy + (y1 - y) * sy];
  return {pts: m.points.map(p => at(p.x, p.y)), q: at(m.q.x, m.q.y)};
}
export function stack(ys, h, lo, hi) {
  const order = ys.map((y, i) => [y, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = new Array(ys.length);
  let last = -Infinity;
  for (const [y, i] of order) { const v = Math.max(y, last + h, lo); out[i] = v; last = v; }
  const over = last - hi;
  if (over > 0) for (let i = 0; i < out.length; i++) out[i] = Math.max(lo, out[i] - over);
  return out;
}
