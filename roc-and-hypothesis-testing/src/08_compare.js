<script>
/* ============================================================================
   Comparison mode. Not a third framework — the same picture, captioned twice.
   It reads the shared parameters, so whatever you set in either mode is what
   you see here.
   ==========================================================================*/

const SDT_C = '#1565c0';   // blue  = signal-detection vocabulary
const NP_C = '#e07b1a';    // amber = Neyman-Pearson vocabulary

function drawCompareDist(pl) {
  const { d, t, s } = State.core;
  const xMin = -4, xMax = Math.max(7, d + 4 * s);
  const n = 400; const xs = new Array(n);
  for (let i = 0; i < n; i++) xs[i] = xMin + (i / (n - 1)) * (xMax - xMin);
  const noise = xs.map((x) => dnorm(x, 0, 1));
  const signal = xs.map((x) => dnorm(x, d, s));
  let split = xs.findIndex((x) => x > t);
  if (split === -1) split = n;
  // extra headroom so the threshold captions clear the curve captions
  const yMax = Math.max(dnorm(0, 0, 1), Math.max(...signal)) * 1.62;

  pl.setup({ xlim: [xMin, xMax], ylim: [0, yMax], mar: [4, 4.2, 4, 1.5] });
  fillRegion(pl, xs, signal, split, n, 0, rgba(OUTCOME_COLORS[0], 0.45));
  fillRegion(pl, xs, signal, 0, split, 0, rgba(OUTCOME_COLORS[1], 0.45));
  fillRegion(pl, xs, noise, split, n, 0, rgba(OUTCOME_COLORS[2], 0.45));
  fillRegion(pl, xs, noise, 0, split, 0, rgba(OUTCOME_COLORS[3], 0.45));
  pl.lines(xs, noise, { col: '#555', lwd: 2, lty: 2 });
  pl.lines(xs, signal, { col: '#555', lwd: 2 });
  pl.abline({ v: t, col: 'black', lwd: 2 });

  /* The same two curves, named twice. Each pair sits above its own peak; the
     threshold pair straddles the vertical line (SDT name to its left, NP name
     to its right) so nothing lands on top of anything else at any spread. */
  const dx = (xMax - xMin) * 0.015;
  pl.text(0, dnorm(0, 0, 1) * 1.13, 'Noise', { col: SDT_C, font: 2, cex: 0.8 });
  pl.text(0, dnorm(0, 0, 1) * 1.27, 'H₀ (null)', { col: NP_C, font: 2, cex: 0.8 });
  pl.text(d, Math.max(...signal) * 1.13, 'Signal', { col: SDT_C, font: 2, cex: 0.8 });
  pl.text(d, Math.max(...signal) * 1.27, 'H₁ (alternative)', { col: NP_C, font: 2, cex: 0.8 });
  pl.text(t - dx, yMax * 0.96, `criterion c = ${rround(t, 2)}`, { col: SDT_C, adj: 1, font: 2, cex: 0.68 });
  pl.text(t + dx, yMax * 0.96, `critical value z = ${rround(t, 2)}`, { col: NP_C, adj: 0, font: 2, cex: 0.68 });

  pl.axes(); pl.box();
  pl.axisLabels('Evidence  /  Test statistic', 'Density');
  pl.title('One threshold, two vocabularies', { cex: 1.0 });
}

function drawCompareCurve(pl) {
  const { d, s } = State.core;
  const m = metrics();
  pl.setup({ xlim: [0, 1], ylim: [0, 1], square: true, mar: [4, 4.2, 4, 1.5] });
  const xs = [], ys = [];
  for (let i = 0; i <= 160; i++) {
    const x = 0.0005 + (i / 160) * 0.999;
    xs.push(x); ys.push(1 - pnorm((qnorm(1 - x) - d) / s));
  }
  pl.lines(xs, ys, { col: 'steelblue', lwd: 2.2 });
  pl.abline({ slope: 1, intercept: 0, lty: 2, col: '#999' });
  pl.segments(m.fa, m.fa, m.fa, m.hit, { col: 'purple', lwd: 2 });
  pl.points([m.fa], [m.hit], { col: 'red', cex: 1.7 });
  pl.text(Math.min(m.fa + 0.34, 0.82), (m.fa + m.hit) / 2 + 0.10,
    `PSS  /  power − α\n= ${rround(m.skill, 3)}`, { col: 'purple', font: 2, cex: 0.68 });
  pl.axes(); pl.box();
  pl.axisLabels('P(False Alarm)   /   α', 'P(Hit)   /   Power');
  pl.title('ROC curve  =  power function', { cex: 1.0 });
}

function dualRow(sdtName, npName, value) {
  return `<div class="dual-label">
    <div class="sdt-col"><span class="lab-name" style="color:${SDT_C}">${sdtName}</span></div>
    <span class="equals">=</span>
    <div class="ht-col"><span class="lab-name" style="color:${NP_C}">${npName}</span></div>
    <div style="flex:0 0 5.5em;text-align:right;align-self:center;" class="lab-val"><strong>${value}</strong></div>
  </div>`;
}

function buildCompareMappingHtml() {
  const { d, t } = State.core;
  const m = metrics();
  return [
    dualRow('Sensitivity (d′)', 'Standardized effect (d√n)', rround(d, 3)),
    dualRow('Criterion (c)', 'Critical value (z_crit)', rround(t, 3)),
    dualRow('Hit rate', 'Power (1 − β)', rround(m.hit, 3)),
    dualRow('False alarm rate', 'Type I error (α)', rround(m.fa, 3)),
    dualRow('Miss rate', 'Type II error (β)', rround(1 - m.hit, 3)),
    dualRow('Correct rejection rate', 'Correct retention (1 − α)', rround(1 - m.fa, 3)),
    dualRow('Likelihood ratio at c', 'Likelihood ratio at z_crit', rround(m.lr, 3)),
    dualRow('Peirce Skill Score', 'Power − α', rround(m.skill, 3)),
  ].join('');
}

const Compare = { distCanvas: null, curveCanvas: null, mapEl: null };

function renderCompare() {
  computeCore();
  if (Compare.distCanvas) drawCanvas(Compare.distCanvas);
  if (Compare.curveCanvas) drawCanvas(Compare.curveCanvas);
  if (Compare.mapEl) Compare.mapEl.innerHTML = buildCompareMappingHtml();
}

function buildCompareTab() {
  const container = $('#tab-compare');
  container.innerHTML = '';

  container.appendChild(h(`<p class="compare-legend">
    <span class="swatch-sdt"></span>Signal detection &nbsp;&nbsp;
    <span class="swatch-ht"></span>Neyman&ndash;Pearson</p>`));

  const ctlRow = h('<div class="row"></div>');
  const c1 = h('<div class="col col-6"></div>');
  const c2 = h('<div class="col col-6"></div>');
  const sepSl = slider('cmp_sep', 'Separation &nbsp;<span style="color:' + SDT_C + '">d′</span> / <span style="color:' + NP_C + '">d√n</span>:', 0, 4, State.separation, 0.05, (v) => v.toFixed(2));
  sepSl.querySelector('input').addEventListener('input', (e) => {
    State.separation = +e.target.value; State.constraint = 'none'; renderCompare();
  });
  c1.appendChild(sepSl);
  const thSl = slider('cmp_thr', 'Threshold &nbsp;<span style="color:' + SDT_C + '">c</span> / <span style="color:' + NP_C + '">z_crit</span>:', -1, 4, State.threshold, 0.05, (v) => v.toFixed(2));
  thSl.querySelector('input').addEventListener('input', (e) => {
    State.threshold = +e.target.value; State.constraint = 'none'; renderCompare();
  });
  c2.appendChild(thSl);
  ctlRow.appendChild(c1); ctlRow.appendChild(c2);
  container.appendChild(ctlRow);

  const plotRow = h('<div class="row"></div>');
  const pc1 = h('<div class="col col-6"></div>');
  const pc2 = h('<div class="col col-6"></div>');
  const w1 = h('<div class="plot-container"></div>');
  Compare.distCanvas = mkCanvas(360, drawCompareDist);
  w1.appendChild(Compare.distCanvas); pc1.appendChild(w1);
  const w2 = h('<div class="plot-container"></div>');
  Compare.curveCanvas = mkCanvas(360, drawCompareCurve);
  w2.appendChild(Compare.curveCanvas); pc2.appendChild(w2);
  plotRow.appendChild(pc1); plotRow.appendChild(pc2);
  container.appendChild(plotRow);

  container.appendChild(h('<h3>Corresponding terms</h3>'));
  const mapDiv = h('<div></div>');
  container.appendChild(mapDiv); Compare.mapEl = mapDiv;

  container.appendChild(h(`<p>The likelihood ratio equals the slope of the ROC curve at the
    operating point. Where the slope is 1 the curve runs parallel to the diagonal and the
    evidence does not discriminate between the two states. Steeper slopes indicate stronger
    evidence at that threshold.</p>`));

  renderCompare();
}
</script>
