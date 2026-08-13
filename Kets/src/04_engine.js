<script>
/* ==========================================================================
   Kets engine: the machinery shared by the mixture-of-standards examples.

   One idea drawn many ways: a few STANDARDS on a grain axis, COPIES scattered
   about them by some process of manufacture, and the histogram + component
   curves + sum curve that Peirce drew on his own (omitted) diagram. Binning
   is half a grain from 136.7, matching the Kets.R Shiny app.
   ==========================================================================*/

const KCOL  = [PAL.accent, PAL.accent3, PAL.accent4, PAL.accent2, "#7b5ea7", "#5f7d8c"];
const KTINT = ["rgba(47,111,159,.35)", "rgba(74,124,89,.35)", "rgba(154,123,63,.35)",
               "rgba(176,86,63,.35)", "rgba(123,94,167,.35)", "rgba(95,125,140,.35)"];
const PE_TO_SD = 1 / 0.6745;                  /* probable error -> standard deviation */
const BIN_W = 0.5, BIN_0 = 136.7;

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* Copies by each of the processes of PP 210. `tol` is the workman's allowance
   either side of the standard; the numbers are chosen so every process has
   probable error in the neighbourhood of Peirce's 5/8 grain. */
const PROCESSES = {
  skillful: {
    label: "skillful workman",
    blurb: "departures follow the probability curve",
    draw: (std, pe) => std + pe * PE_TO_SD * randn(),
  },
  guesswork: {
    label: "guesswork, then inspection",
    blurb: "curve cut down vertically at two ordinates, maximum right of the standard",
    draw: (std, pe) => {
      const tol = 2 * pe, shift = 0.6 * pe;
      for (let i = 0; i < 200; i++) {
        const v = std + shift + 1.4 * pe * PE_TO_SD * randn();
        if (v >= std - tol && v <= std + tol) return v;
      }
      return std + shift;
    },
  },
  aiming: {
    label: "modern balance, aiming at the maximum",
    blurb: "concave upwards, stopping abruptly at its maximum ordinate",
    draw: (std, pe) => {
      const max = std + 1.2 * pe, span = 3.2 * pe;
      for (let i = 0; i < 200; i++) {
        const v = max + span * Math.log(Math.random()) / 3;   /* rises toward max */
        if (v >= max - span) return v;
      }
      return max;
    },
  },
  topheavy: {
    label: "top-heavy balance, equal grinds",
    blurb: "a horizontal line cut off by vertical ordinates",
    draw: (std, pe) => std + 1.2 * pe - 2.4 * pe * Math.random(),
  },
  topheavyVar: {
    label: "top-heavy balance, variable grinds",
    blurb: "the same, with a contrary flexure",
    draw: (std, pe) => std + 1.2 * pe - 2.4 * pe * Math.random() + 0.5 * pe * randn(),
  },
};

function histCounts(vals, x0, x1, w) {
  const n = Math.ceil((x1 - x0) / w);
  const c = new Array(n).fill(0);
  vals.forEach((v) => {
    const i = Math.floor((v - x0) / w);
    if (i >= 0 && i < n) c[i]++;
  });
  return c;
}

/* posterior share of each standard at weight v, equal-variance normal mixture */
function responsibilities(v, stds, weights, sd) {
  const d = stds.map((m, i) => (weights ? weights[i] : 1) * dnorm(v, m, sd));
  const s = d.reduce((a, b) => a + b, 0) || 1;
  return d.map((x) => x / s);
}

function nearestCounts(vals, stds) {
  const c = stds.map(() => 0);
  vals.forEach((v) => {
    let bi = 0, bd = Infinity;
    stds.forEach((m, i) => { const d = Math.abs(v - m); if (d < bd) { bd = d; bi = i; } });
    c[bi]++;
  });
  return c;
}

/* --------------------------------------------------------------------------
   The standard mixture picture. o: {stds, copies (array of arrays per std, or
   null), data (plain values, uncoloured), pe, showCurves, showSum, weights
   (expected count per std for curve scaling), xlim, queries: [{v}], blend}
   ------------------------------------------------------------------------*/
function drawMixture(pl, W, H, o) {
  if (o.mixture) { o.blocks = true; o.gradientSum = o.gradientSum !== false; }
  const xlim = o.xlim || [136, 153.5];
  const sd = (o.pe || PEIRCE_PE) * PE_TO_SD;
  const stds = o.stds || [];
  const all = (o.data || []).concat(...(o.copies || []));
  const counts = histCounts(all, BIN_0, xlim[1], BIN_W);
  const wts = o.weights || (o.copies ? o.copies.map((c) => c.length)
                                     : stds.map(() => all.length / (stds.length || 1)));
  const ymax = Math.max(4, ...counts,
    ...stds.map((m, i) => wts[i] * BIN_W * dnorm(m, m, sd)) ) * 1.12;
  pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, o.title ? 2 : 0.8, 0.8] });
  pl.axes({ xat: seqBy(Math.ceil(xlim[0] / 2) * 2, xlim[1], 2), yat: pretty0(ymax) });
  pl.axisLabels("grains (value of one ket)", "weights per half-grain");
  if (o.title) pl.title(o.title);

  /* histogram: plain, blended, or stacked unit blocks per standard */
  if (o.blocks && stds.length && !o.sumOnly) {
    /* per-bin, per-standard composition: from parenthood when copies are given,
       else from each value's likeliest standard */
    const nb = counts.length;
    const per = stds.map(() => new Array(nb).fill(0));
    const put = (v, si) => {
      const b = Math.floor((v - BIN_0) / BIN_W);
      if (b >= 0 && b < nb) per[si][b]++;
    };
    if (o.copies) o.copies.forEach((c, si) => c.forEach((v) => put(v, si)));
    (o.data || []).forEach((v) => {
      const r = responsibilities(v, stds, wts, sd);
      let bi = 0; r.forEach((q, j) => { if (q > r[bi]) bi = j; });
      put(v, bi);
    });
    for (let b = 0; b < nb; b++) {
      let y = 0;
      const x0 = BIN_0 + b * BIN_W;
      for (let si = 0; si < stds.length; si++) {
        for (let u = 0; u < per[si][b]; u++) {
          pl.rect(x0, y, x0 + BIN_W, y + 1, { col: KTINT[si % KTINT.length], border: PAL.paper });
          y += 1;
        }
      }
    }
  } else if (!o.sumOnly) {
    for (let i = 0; i < counts.length; i++) {
      if (!counts[i]) continue;
      const b0 = BIN_0 + i * BIN_W, mid = b0 + BIN_W / 2;
      let fill = "rgba(87,93,102,.35)";
      if (o.binTint && o.binTint[i]) fill = o.binTint[i];
      else if (o.blend && stds.length) {
        const r = responsibilities(mid, stds, wts, sd);
        let bi = 0; r.forEach((v, j) => { if (v > r[bi]) bi = j; });
        fill = KTINT[bi % KTINT.length];
      }
      pl.rect(b0, 0, b0 + BIN_W, counts[i], { col: fill, border: PAL.paper });
    }
  }
  /* gradient fill under the sum curve: each slice blends the standards' colours
     by their share at that abscissa */
  if (o.gradientSum && stds.length) {
    for (let x = xlim[0]; x < xlim[1]; x += 0.08) {
      const y = o.sumOnly
        ? stds.reduce((a, m, i) => a + wts[i] * BIN_W * dnorm(x + 0.04, m, sd), 0)
        : Math.max(...stds.map((m, i) => wts[i] * BIN_W * dnorm(x + 0.04, m, sd)));
      if (y < ymax * 0.004) continue;
      const r = responsibilities(x + 0.04, stds, wts, sd);
      pl.rect(x, 0, x + 0.08, y, { col: mixCol(KCOL, r, o.mixture ? 0.22 : 0.35), border: null });
    }
  }
  /* component curves and their sum, scaled to expected bin counts */
  if (o.showCurves !== false && stds.length) {
    const xs = [];
    for (let x = xlim[0]; x <= xlim[1]; x += 0.05) xs.push(x);
    if (!o.sumOnly) stds.forEach((m, i) => {
      pl.lines(xs, xs.map((x) => wts[i] * BIN_W * dnorm(x, m, sd)),
               { col: KCOL[i % KCOL.length], lwd: 1.6 });
    });
    if ((o.showSum !== false && stds.length > 1) || o.sumOnly) {
      pl.lines(xs, xs.map((x) =>
        stds.reduce((a, m, i) => a + wts[i] * BIN_W * dnorm(x, m, sd), 0)),
        { col: PAL.ink, lwd: 1.2, lty: 2 });
    }
  }
  /* the standards themselves: little weights sitting on the axis */
  if (!o.hideStds) stds.forEach((m, i) => {
    const col = KCOL[i % KCOL.length];
    pl.segments(m, 0, m, ymax * 0.93, { col, lwd: 1, lty: 3 });
    drawKetGlyph(pl, m, 0, col, o.bigStd ? 9 : 7);
    pl.text(m, ymax * 0.965, m.toFixed(1), { col, cex: 0.78 });
  });
  (o.queries || []).forEach((q) => {
    pl.segments(q.v, 0, q.v, ymax * 0.9, { col: PAL.ink, lwd: 1.6 });
    drawKetGlyph(pl, q.v, 0, PAL.ink, 8);
  });
}

/* a ket in profile: Petrie's "domed type", a flat base under a dome */
function drawKetGlyph(pl, x, y, col, px) {
  const c = pl.ctx, X = pl.X(x), Y = pl.Y(y);
  c.save();
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(X - px, Y);
  c.arc(X, Y, px, Math.PI, 0);
  c.closePath();
  c.fill();
  c.restore();
}

function seqBy(a, b, by) { const o = []; for (let v = a; v <= b + 1e-9; v += by) o.push(v); return o; }
function pretty0(m) {
  return RPlot.ticks(0, m, 5).filter((v) => v >= 0);
}

/* pointer-drag plumbing for canvases whose standards can be moved */
function attachDrag(el, hit, move, done) {
  let active = null;
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", (ev) => {
    const r = el.getBoundingClientRect(), pl = el._pl;
    if (!pl) return;
    active = hit(pl.invX(ev.clientX - r.left), pl.invY(ev.clientY - r.top));
    if (active !== null) el.setPointerCapture(ev.pointerId);
  });
  el.addEventListener("pointermove", (ev) => {
    if (active === null) return;
    const r = el.getBoundingClientRect(), pl = el._pl;
    move(active, pl.invX(ev.clientX - r.left));
  });
  el.addEventListener("pointerup", () => { if (active !== null && done) done(active); active = null; });
}

/* blend colours by weights, returning rgba at the given alpha */
function mixCol(cols, weights, alpha) {
  let r = 0, g = 0, b = 0, W = 0;
  cols.forEach((c, i) => {
    const w = weights[i] || 0; W += w;
    const n = c.length === 4 ? c.split("").map((ch) => parseInt(ch + ch, 16)) : null;
    const hex = c.replace("#", "");
    r += w * parseInt(hex.slice(0, 2), 16);
    g += w * parseInt(hex.slice(2, 4), 16);
    b += w * parseInt(hex.slice(4, 6), 16);
  });
  if (!W) return "rgba(87,93,102," + (alpha || 0.35) + ")";
  return `rgba(${Math.round(r / W)},${Math.round(g / W)},${Math.round(b / W)},${alpha || 0.35})`;
}

/* equal-variance normal mixture by EM. Returns {mu, w, sd}. opts.sd fixes the
   spread (Peirce's move); opts.init seeds the means (else spread quantiles). */
function emFit(vals, k, opts) {
  const o = opts || {};
  const sorted = vals.slice().sort((a, b) => a - b);
  let mu = (o.init && o.init.slice(0, k).length === k) ? o.init.slice(0, k)
    : Array.from({ length: k }, (_, i) => sorted[Math.floor((i + 0.5) / k * (sorted.length - 1))]);
  let w = new Array(k).fill(1 / k);
  let sd = o.sd || (PEIRCE_PE * PE_TO_SD);
  for (let it = 0; it < (o.iters || 80); it++) {
    const R = vals.map((v) => responsibilities(v, mu, w, sd));
    const nk = mu.map((_, j) => R.reduce((a, r) => a + r[j], 0));
    mu = mu.map((_, j) => R.reduce((a, r, i) => a + r[j] * vals[i], 0) / (nk[j] || 1e-9));
    w = nk.map((n) => n / vals.length);
    if (!o.sd) {
      let ss = 0;
      vals.forEach((v, i) => mu.forEach((m, j) => { ss += R[i][j] * (v - m) * (v - m); }));
      sd = Math.sqrt(ss / vals.length) || 0.5;
    }
  }
  const ord = mu.map((m, i) => i).sort((a, b) => mu[a] - mu[b]);
  return { mu: ord.map((i) => +mu[i].toFixed(2)), w: ord.map((i) => w[i]), sd };
}

/* laws of error, shared by the figuring-out modes. Density of a copy at x
   about standard m, probable error pe. 'gauss' is the probability curve;
   'uniform' flat within a tolerance; 'cutR' smooth to the left with a sharp
   cutoff just right of the standard; 'beta' a Beta(a,b) reshaped onto
   m ± 2.5pe (opts.a, opts.b). */
function lawDens(law, x, m, pe, opts) {
  const sd = pe * PE_TO_SD;
  if (law === "gauss") return dnorm(x, m, (opts && opts.sd) || sd);
  if (law === "uniform") { const a = 1.9 * pe; return Math.abs(x - m) <= a ? 1 / (2 * a) : 0; }
  if (law === "cutR") {
    const tau = 1.6 * pe, c = 0.5 * pe;
    return x > m + c ? 0 : Math.exp((x - m - c) / tau) / tau;
  }
  if (law === "beta") {
    const A = (opts && opts.a) || 2, B = (opts && opts.b) || 2, half = 2.5 * pe;
    const t = (x - m + half) / (2 * half);
    if (t <= 0 || t >= 1) return 0;
    const lg = lgamma(A + B) - lgamma(A) - lgamma(B);
    return Math.exp(lg + (A - 1) * Math.log(t) + (B - 1) * Math.log(1 - t)) / (2 * half);
  }
  return 0;
}

/* best fit of k standards to values under a law: EM-style, means (and weights)
   updated from posteriors; approximate for the non-gaussian laws, where the
   M-step mean is still the responsibility-weighted average. opts.perSd fits a
   separate gaussian spread per standard. */
function lawFit(vals, k, law, pe, opts) {
  const o = opts || {};
  let mu = (o.init || []).slice(0, k);
  const sorted = vals.slice().sort((a, b) => a - b);
  while (mu.length < k) mu.push(sorted[Math.floor((mu.length + 0.5) / k * (sorted.length - 1))]);
  let w = new Array(k).fill(1 / k);
  let sds = new Array(k).fill(pe * PE_TO_SD);
  for (let it = 0; it < 60; it++) {
    const R = vals.map((v) => {
      const d = mu.map((m, j) => w[j] * (lawDens(law, v, m, pe, { ...o, sd: sds[j] }) + 1e-12));
      const t = d.reduce((a, b) => a + b, 0);
      return d.map((x) => x / t);
    });
    const nk = mu.map((_, j) => R.reduce((a, r) => a + r[j], 0));
    mu = mu.map((_, j) => R.reduce((a, r, i) => a + r[j] * vals[i], 0) / (nk[j] || 1e-9));
    w = nk.map((n) => n / vals.length);
    if (o.perSd && law === "gauss") {
      sds = mu.map((m, j) => {
        let ss = 0;
        vals.forEach((v, i) => { ss += R[i][j] * (v - m) * (v - m); });
        return Math.max(0.25, Math.sqrt(ss / (nk[j] || 1e-9)));
      });
    }
  }
  const ord = mu.map((m, i) => i).sort((a, b) => mu[a] - mu[b]);
  return { mu: ord.map((i) => +mu[i].toFixed(2)), w: ord.map((i) => w[i]), sds: ord.map((i) => sds[i]) };
}

/* a smoothed curve over binned data: moving average of the half-grain counts,
   scaled to counts — "the curve representing the data" */
function dataCurve(vals, xlim, win) {
  const c = histCounts(vals, BIN_0, xlim[1], BIN_W);
  const k = Math.max(1, Math.round(win || 2));
  const xs = [], ys = [];
  for (let i = 0; i < c.length; i++) {
    let s = 0, n = 0;
    for (let j = -k; j <= k; j++) { const q = i + j; if (q >= 0 && q < c.length) { s += c[q]; n++; } }
    xs.push(BIN_0 + (i + 0.5) * BIN_W); ys.push(s / n);
  }
  return { xs, ys };
}

/* one slider row in house style; returns {row, input, val} */
function ctlSlider(labelHtml, key, min, max, step, value, fmt) {
  const row = h(`<div class="ctl ${key || "k1"}"><label>${labelHtml}
      <span class="slider-val"></span></label>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${value}"></input></div>`);
  const input = $("input", row), val = $(".slider-val", row);
  const show = () => { val.textContent = (fmt || ((v) => v))(parseFloat(input.value)); };
  input.addEventListener("input", show);
  show();
  return { row, input, val, get: () => parseFloat(input.value) };
}
</script>
