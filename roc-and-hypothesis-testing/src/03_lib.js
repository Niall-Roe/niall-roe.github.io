<script>
/* ============================================================================
   Signal Detection & Hypothesis Testing — interactive edition
   Port of "ROC and Hypothesis Testing.R" (R/Shiny) to a self-contained page.

   Part 1: statistical primitives (replacing R's stats package)
   Part 2: a small canvas renderer that mimics R base graphics
   Part 3: tiny DOM / control-building utilities
   Shared lineage with ../probability-of-induction/src/03_lib.js, trimmed to
   what this app needs and extended with rnorm (used by both simulation tabs).
   ==========================================================================*/

/* ---------------------------------------------------------------- MATH --- */

function dnorm(x, mean = 0, sd = 1) {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

// Chebyshev erfc (NR 6.2) — accurate enough for the tail probabilities used
// by severity calculations, unlike the cruder A&S 7.1.26 approximation.
function erfc(x) {
  const z = Math.abs(x), t = 2 / (2 + z);
  const ty = 4 * t - 2;
  const cof = [-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
    -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
    4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
    1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
    6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
    -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
    -6.886027e-12, 8.94487e-13, 3.13092e-13,
    -1.12708e-13, 3.81e-16, 7.106e-15];
  let d = 0, dd = 0, tmp;
  for (let j = cof.length - 1; j > 0; j--) { tmp = d; d = ty * d - dd + cof[j]; dd = tmp; }
  const ans = t * Math.exp(-z * z + 0.5 * (cof[0] + ty * d) - dd);
  return x >= 0 ? ans : 2 - ans;
}

function pnorm(x, mean = 0, sd = 1) { return 0.5 * erfc(-((x - mean) / sd) / Math.SQRT2); }

// Wichura AS241-quality inverse normal (Acklam + one Halley refinement)
function qnorm(p, mean = 0, sd = 1) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
    6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
    3.754408661907416e+00];
  const pl = 0.02425, ph = 1 - pl;
  let q, r, x;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= ph) {
    q = p - 0.5; r = q * q;
    x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
        (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  const e = pnorm(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
  x = x - u / (1 + x * u / 2);
  return mean + sd * x;
}

// Inverse-CDF normal draw: reuses the qnorm above rather than a second
// (Box-Muller) code path, so simulated trials and theoretical curves share
// exactly one implementation of "what normal means" throughout the app.
function rnorm(n, mean = 0, sd = 1) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = qnorm(Math.random(), mean, sd);
  return out;
}

/* ---------------------------------------------------------- FORMATTING --- */

// R's round(x, d) then default printing: 0.5 -> "0.5", not "0.5000"
function rround(x, d) {
  if (!Number.isFinite(x)) return String(x);
  const r = Number(x.toFixed(d));
  return String(r);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ------------------------------------------------------------ PLOTTING --- */
/* A minimal re-implementation of the parts of R base graphics the app uses:
   plot(NULL)/rect/text/lines/points/segments/polygon/abline/axis/legend.
   Coordinates passed to these methods are USER (data) coordinates.          */

const BASE_FONT = 12;

class RPlot {
  constructor(ctx, cssW, cssH) {
    this.ctx = ctx; this.W = cssW; this.H = cssH;
    this.mar = [40, 45, 32, 16];   // bottom, left, top, right, in px
    this.xlim = [0, 1]; this.ylim = [0, 1];
  }
  setup(opts) {
    const o = opts || {};
    if (o.mar) this.mar = o.mar.map((m) => m * 13);
    let xlim = (o.xlim || [0, 1]).slice(), ylim = (o.ylim || [0, 1]).slice();
    if (o.ext !== false) {
      const dx = (xlim[1] - xlim[0]) * 0.04, dy = (ylim[1] - ylim[0]) * 0.04;
      xlim = [xlim[0] - dx, xlim[1] + dx];
      ylim = [ylim[0] - dy, ylim[1] + dy];
    }
    const [mb, ml, mt, mr] = this.mar;
    let px0 = ml, px1 = this.W - mr, py0 = this.H - mb, py1 = mt;
    /* `square` shrinks the PLOT REGION to a square and centres it, so a 1:1
       plot really looks 1:1. (R's coord_fixed instead widens the roomier
       axis's limits, which leaves the box itself a rectangle — not what an
       ROC square wants.) Assumes xlim and ylim already span equal ranges. */
    if (o.square) {
      const side = Math.min(px1 - px0, py0 - py1);
      const cx = (px0 + px1) / 2;
      px0 = cx - side / 2; px1 = cx + side / 2;
      py1 = py0 - side;
    }
    this.xlim = xlim; this.ylim = ylim;
    this.px0 = px0; this.px1 = px1; this.py0 = py0; this.py1 = py1;
    return this;
  }
  X(x) { return this.px0 + (x - this.xlim[0]) / (this.xlim[1] - this.xlim[0]) * (this.px1 - this.px0); }
  Y(y) { return this.py0 + (y - this.ylim[0]) / (this.ylim[1] - this.ylim[0]) * (this.py1 - this.py0); }
  invX(px) { return this.xlim[0] + (px - this.px0) / (this.px1 - this.px0) * (this.xlim[1] - this.xlim[0]); }
  invY(py) { return this.ylim[0] + (py - this.py0) / (this.py1 - this.py0) * (this.ylim[1] - this.ylim[0]); }

  _font(cex, font) {
    const size = BASE_FONT * (cex || 1);
    const weight = (font === 2) ? "bold " : "";
    const style = (font === 3) ? "italic " : "";
    this.ctx.font = `${style}${weight}${size}px "Helvetica Neue", Arial, sans-serif`;
    return size;
  }
  _lty(lty) {
    const c = this.ctx;
    if (lty === 2) c.setLineDash([7, 5]);
    else if (lty === 3) c.setLineDash([2, 3]);
    else c.setLineDash([]);
  }
  text(x, y, str, o = {}) {
    const c = this.ctx;
    this._font(o.cex, o.font);
    c.fillStyle = o.col || "black";
    c.textBaseline = "middle";
    c.textAlign = o.adj === 0 ? "left" : (o.adj === 1 ? "right" : "center");
    const lines = String(str).split("\n");
    const lh = BASE_FONT * (o.cex || 1) * 1.25;
    const y0 = this.Y(y) - lh * (lines.length - 1) / 2;
    lines.forEach((ln, i) => c.fillText(ln, this.X(x), y0 + i * lh));
  }
  lines(xs, ys, o = {}) {
    const c = this.ctx;
    c.strokeStyle = o.col || "black"; c.lineWidth = o.lwd || 1; this._lty(o.lty || 1);
    c.beginPath();
    let started = false;
    for (let i = 0; i < xs.length; i++) {
      if (!Number.isFinite(ys[i])) { started = false; continue; }
      const px = this.X(xs[i]), py = this.Y(ys[i]);
      if (!started) { c.moveTo(px, py); started = true; } else c.lineTo(px, py);
    }
    c.stroke(); c.setLineDash([]);
  }
  points(xs, ys, o = {}) {
    const c = this.ctx;
    c.fillStyle = o.col || "black"; c.strokeStyle = o.col || "black";
    const r = 2.4 * (o.cex || 1);
    for (let i = 0; i < xs.length; i++) {
      c.beginPath(); c.arc(this.X(xs[i]), this.Y(ys[i]), r, 0, 2 * Math.PI);
      if (o.pch === 21) { c.fillStyle = o.fill || "white"; c.fill(); c.stroke(); } else c.fill();
    }
  }
  segments(x0, y0, x1, y1, o = {}) {
    const c = this.ctx;
    c.strokeStyle = o.col || "black"; c.lineWidth = o.lwd || 1; this._lty(o.lty || 1);
    c.beginPath(); c.moveTo(this.X(x0), this.Y(y0)); c.lineTo(this.X(x1), this.Y(y1));
    c.stroke(); c.setLineDash([]);
  }
  abline(o = {}) {
    if (o.h !== undefined) this.segments(this.xlim[0], o.h, this.xlim[1], o.h, o);
    if (o.v !== undefined) this.segments(o.v, this.ylim[0], o.v, this.ylim[1], o);
    if (o.slope !== undefined) {
      const y0 = o.intercept + o.slope * this.xlim[0], y1 = o.intercept + o.slope * this.xlim[1];
      this.segments(this.xlim[0], y0, this.xlim[1], y1, o);
    }
  }
  polygon(xs, ys, o = {}) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(this.X(xs[0]), this.Y(ys[0]));
    for (let i = 1; i < xs.length; i++) c.lineTo(this.X(xs[i]), this.Y(ys[i]));
    c.closePath();
    if (o.col) { c.fillStyle = o.col; c.fill(); }
    if (o.border) { c.strokeStyle = o.border; c.lineWidth = o.lwd || 1; c.stroke(); }
  }
  // filled area between a curve and a horizontal baseline, clipped to x in [x0,x1]
  ribbon(xs, ys, baseline, o = {}) {
    const pts = [];
    for (let i = 0; i < xs.length; i++) pts.push([xs[i], ys[i]]);
    const top = pts.map((p) => p);
    const bottom = pts.slice().reverse().map((p) => [p[0], baseline]);
    const all = top.concat(bottom);
    this.polygon(all.map((p) => p[0]), all.map((p) => p[1]), o);
  }
  arrow(x0, y0, x1, y1, o = {}) {
    const c = this.ctx;
    this.segments(x0, y0, x1, y1, o);
    const P0 = [this.X(x0), this.Y(y0)], P1 = [this.X(x1), this.Y(y1)];
    const len = o.length || 8;
    const ang = Math.atan2(P1[1] - P0[1], P1[0] - P0[0]);
    const spread = (o.angle || 20) * Math.PI / 180;
    c.strokeStyle = o.col || "black"; c.lineWidth = o.lwd || 1;
    c.beginPath();
    c.moveTo(P1[0], P1[1]); c.lineTo(P1[0] - len * Math.cos(ang - spread), P1[1] - len * Math.sin(ang - spread));
    c.moveTo(P1[0], P1[1]); c.lineTo(P1[0] - len * Math.cos(ang + spread), P1[1] - len * Math.sin(ang + spread));
    c.stroke();
  }
  static ticks(lo, hi, n = 5) {
    const span = hi - lo;
    if (!(span > 0)) return [lo];
    const raw = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  axes(o = {}) {
    const c = this.ctx;
    c.strokeStyle = "black"; c.fillStyle = "black"; c.lineWidth = 1; c.setLineDash([]);
    this._font(0.85, 1);
    const xt = o.xat || RPlot.ticks(this.xlim[0], this.xlim[1], o.nx || 5);
    const yt = o.yat || RPlot.ticks(this.ylim[0], this.ylim[1], o.ny || 5);
    c.beginPath(); c.moveTo(this.px0, this.py0); c.lineTo(this.px1, this.py0); c.stroke();
    c.textAlign = "center"; c.textBaseline = "top";
    xt.forEach((v, i) => {
      const px = this.X(v);
      if (px < this.px0 - 0.5 || px > this.px1 + 0.5) return;
      c.beginPath(); c.moveTo(px, this.py0); c.lineTo(px, this.py0 + 5); c.stroke();
      c.fillText(o.xlabels ? o.xlabels[i] : String(v), px, this.py0 + 7);
    });
    c.beginPath(); c.moveTo(this.px0, this.py0); c.lineTo(this.px0, this.py1); c.stroke();
    c.textAlign = "right"; c.textBaseline = "middle";
    yt.forEach((v, i) => {
      const py = this.Y(v);
      if (py > this.py0 + 0.5 || py < this.py1 - 0.5) return;
      c.beginPath(); c.moveTo(this.px0, py); c.lineTo(this.px0 - 5, py); c.stroke();
      c.fillText(o.ylabels ? o.ylabels[i] : String(v), this.px0 - 7, py);
    });
  }
  box() {
    const c = this.ctx;
    c.strokeStyle = "black"; c.lineWidth = 1; c.setLineDash([]);
    c.strokeRect(this.px0, this.py1, this.px1 - this.px0, this.py0 - this.py1);
  }
  title(main, o = {}) {
    const c = this.ctx;
    this._font(o.cex || 1.1, 2);
    c.fillStyle = "black"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(main, (this.px0 + this.px1) / 2, Math.max(12, this.py1 - 24));
  }
  subtitle(sub, o = {}) {
    const c = this.ctx;
    this._font(o.cex || 0.85, 1);
    c.fillStyle = "#555"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(sub, (this.px0 + this.px1) / 2, Math.max(24, this.py1 - 8));
  }
  axisLabels(xlab, ylab) {
    const c = this.ctx;
    if (xlab) {
      this._font(0.95, 1); c.fillStyle = "black"; c.textAlign = "center"; c.textBaseline = "alphabetic";
      c.fillText(xlab, (this.px0 + this.px1) / 2, this.H - 6);
    }
    if (ylab) {
      c.save(); this._font(0.95, 1); c.fillStyle = "black";
      c.translate(11, (this.py0 + this.py1) / 2); c.rotate(-Math.PI / 2);
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ylab, 0, 0); c.restore();
    }
  }
  legend(pos, o = {}) {
    const c = this.ctx;
    const cex = o.cex || 0.82;
    this._font(cex, 1);
    const items = o.legend;
    const pad = 6, sw = 20, gap = 6;
    const lh = BASE_FONT * cex * 1.5;
    const boxW = 2 * pad + sw + gap + Math.max(...items.map((t) => c.measureText(t).width));
    const boxH = 2 * pad + items.length * lh;
    let x, y;
    if (pos === "topright") { x = this.px1 - boxW - 4; y = this.py1 + 4; }
    else if (pos === "topleft") { x = this.px0 + 4; y = this.py1 + 4; }
    else if (pos === "bottomright") { x = this.px1 - boxW - 4; y = this.py0 - boxH - 4; }
    else { x = this.px0 + 4; y = this.py0 - boxH - 4; }
    c.fillStyle = "rgba(255,255,255,0.9)"; c.fillRect(x, y, boxW, boxH);
    c.strokeStyle = "#999"; c.lineWidth = 1; c.setLineDash([]); c.strokeRect(x, y, boxW, boxH);
    let cy = y + pad + lh / 2;
    items.forEach((t, i) => {
      const cx = x + pad;
      const pick = (v) => Array.isArray(v) ? v[i] : v;
      if (o.fill) {
        c.fillStyle = pick(o.fill); c.fillRect(cx, cy - 6, sw - 4, 12);
        c.strokeStyle = "#333"; c.lineWidth = 0.8; c.strokeRect(cx, cy - 6, sw - 4, 12);
      } else {
        c.strokeStyle = pick(o.col) || "black"; c.lineWidth = pick(o.lwd) || 1;
        this._lty(pick(o.lty) || 1);
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + sw - 4, cy); c.stroke(); c.setLineDash([]);
      }
      c.fillStyle = "black"; c.textAlign = "left"; c.textBaseline = "middle";
      this._font(cex, 1); c.fillText(t, cx + sw + gap, cy);
      cy += lh;
    });
  }
}

/* ---- canvas plumbing: responsive sizing, redraw registry, click mapping -- */

const CANVASES = [];

function mkCanvas(height, drawFn, opts = {}) {
  const el = document.createElement("canvas");
  el.className = "plot";
  el.style.height = height + "px";
  el._draw = drawFn;
  el._h = height;
  CANVASES.push(el);
  if (opts.onclick) {
    el.style.cursor = "pointer";
    el.addEventListener("click", (ev) => {
      const r = el.getBoundingClientRect();
      const pl = el._pl;
      if (!pl) return;
      opts.onclick(pl.invX(ev.clientX - r.left), pl.invY(ev.clientY - r.top), pl);
    });
  }
  requestAnimationFrame(() => drawCanvas(el));
  return el;
}

function drawCanvas(el) {
  const cssW = el.clientWidth || (el.parentElement && el.parentElement.clientWidth) || 600;
  const cssH = el._h;
  if (!cssW) return;
  const dpr = window.devicePixelRatio || 1;
  el.width = Math.round(cssW * dpr);
  el.height = Math.round(cssH * dpr);
  const ctx = el.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cssW, cssH);
  const pl = new RPlot(ctx, cssW, cssH);
  el._pl = pl;
  try { el._draw(pl, cssW, cssH); } catch (e) { console.error(e); }
}

// Rebuilding a tab throws its old canvases away; drop them from the registry
// so repeated mode switches don't accumulate detached nodes forever.
function pruneCanvases() {
  for (let i = CANVASES.length - 1; i >= 0; i--) if (!CANVASES[i].isConnected) CANVASES.splice(i, 1);
}

function redrawAll() {
  pruneCanvases();
  CANVASES.forEach((el) => { if (el.offsetParent !== null) drawCanvas(el); });
}

let _rzT = null;
window.addEventListener("resize", () => { clearTimeout(_rzT); _rzT = setTimeout(redrawAll, 120); });

/* ------------------------------------------------- tiny DOM utilities --- */

function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function slider(id, label, min, max, value, step, fmtFn) {
  const d = document.createElement("div");
  d.className = "ctl";
  d.innerHTML = `<label for="${id}">${label} <span class="slider-val" id="${id}_val"></span></label>
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">`;
  const inp = d.querySelector("input"), out = d.querySelector(".slider-val");
  const show = () => { out.textContent = fmtFn ? fmtFn(+inp.value) : inp.value; };
  inp.addEventListener("input", show);
  show();
  return d;
}
function select(id, label, choices, selected) {
  const opts = choices.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(selected) ? " selected" : ""}>${esc(t)}</option>`).join("");
  return h(`<div class="ctl"><label for="${id}">${label}</label><select id="${id}">${opts}</select></div>`);
}
function checkbox(id, label, checked) {
  return h(`<div class="ctl checkbox"><label><input type="checkbox" id="${id}"${checked ? " checked" : ""}> ${label}</label></div>`);
}
function radios(name, label, choices, selected, stacked) {
  const items = choices.map(([v, t]) =>
    `<label><input type="radio" name="${name}" value="${esc(v)}"${v === selected ? " checked" : ""}> ${esc(t)}</label>`).join("");
  return h(`<div class="ctl"><label>${label}</label><div class="radio-row${stacked ? " stacked" : ""}">${items}</div></div>`);
}
function helpText(str) { return h(`<p class="help-text">${str}</p>`); }
function numberInput(id, label, value, min, max, step) {
  return h(`<div class="ctl"><label for="${id}">${label}</label>
    <input type="number" id="${id}" value="${value}" min="${min}" max="${max}" step="${step}"></div>`);
}
function readonlyRow(label, value, id, note) {
  return h(`<div class="ctl"><label>${label}</label>
    <div class="readonly-val"${id ? ` id="${id}"` : ''}>${value}${note ? ` <span class="ro-note">${note}</span>` : ''}</div></div>`);
}
// update a slider's position and its printed value together
function setSliderValue(id, v, fmtFn) {
  const e = document.getElementById(id);
  if (!e) return;
  e.value = v;
  const out = document.getElementById(id + '_val');
  if (out) out.textContent = fmtFn ? fmtFn(+v) : v;
}
const val = (id) => { const e = document.getElementById(id); return e ? e.value : null; };
const num = (id) => +val(id);
const chk = (id) => { const e = document.getElementById(id); return e ? e.checked : false; };
const radioVal = (name) => { const e = document.querySelector(`input[name="${name}"]:checked`); return e ? e.value : null; };
</script>
