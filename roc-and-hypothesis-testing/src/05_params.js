<script>
/* ============================================================================
   Tab 1: Parameters. One set of controls, relabelled per mode.
   ==========================================================================*/

/* ------------------------------------------------------- ROC / POWER --- */

function drawCurvePlot(pl) {
  const lab = L();
  const { d, s } = State.core;
  const m = metrics();
  // `square` keeps the plot region 1:1 so ROC space actually looks square.
  pl.setup({ xlim: [0, 1], ylim: [0, 1], square: true, mar: [4, 4.2, 5, 1.5] });

  const xs = [], ys = [];
  for (let i = 0; i <= 160; i++) {
    const x = 0.0005 + (i / 160) * 0.999;
    xs.push(x);
    ys.push(1 - pnorm((qnorm(1 - x) - d) / s));
  }
  pl.lines(xs, ys, { col: 'steelblue', lwd: 2.2 });
  pl.abline({ slope: 1, intercept: 0, lty: 2, col: '#999' });

  if (State.showSkill) pl.segments(m.fa, m.fa, m.fa, m.hit, { col: 'purple', lwd: 2 });
  if (State.showLr && State.showLrSlope) {
    const slope = m.lr, intercept = m.hit - slope * m.fa;
    pl.abline({ slope, intercept, col: 'darkgreen', lwd: 1.5 });
    pl.text(0.68, 0.12, `slope = LR = ${rround(m.lr, 2)}`, { col: 'darkgreen', font: 2, cex: 0.8 });
  }
  pl.points([m.fa], [m.hit], { col: 'red', cex: 1.7 });
  pl.axes(); pl.box();
  pl.axisLabels(lab.curveX, lab.curveY);
  pl.title(lab.curveTitle);
  pl.subtitle('click anywhere to move the threshold', {});
}

function onCurveClick(faRaw, hitRaw) {
  const fa = Math.min(Math.max(faRaw, 0.001), 0.999);
  const hit = Math.min(Math.max(hitRaw, 0.001), 0.999);
  const t = qnorm(1 - fa);
  State.threshold = t;
  State.separation = t - qnorm(1 - hit) * State.spread;
  State.constraint = 'none';
  State.preset[State.mode] = 'custom';
  rebuildParamsSidebar();
}

/* ------------------------------------------------------- DISTRIBUTIONS --- */

function drawDistPlot(pl) {
  const lab = L();
  const { d, t, s } = State.core;
  const xMin = -4, xMax = Math.max(8, d + 4 * s);
  const n = 400;
  const xs = new Array(n);
  for (let i = 0; i < n; i++) xs[i] = xMin + (i / (n - 1)) * (xMax - xMin);
  const noise = xs.map((x) => dnorm(x, 0, 1));
  const signal = xs.map((x) => dnorm(x, d, s));
  let split = xs.findIndex((x) => x > t);
  if (split === -1) split = n;

  /* Anchor the y-axis to the (fixed) noise peak rather than autoscaling to
     whichever curve is currently tallest. Otherwise widening the spread
     lowers the signal peak, which rescales the axis, which makes the
     *unchanged* noise curve appear to move too. */
  const noisePeak = dnorm(0, 0, 1);
  const alpha = 0.55;

  if (State.separateDists) {
    const yTop = Math.max(noisePeak, Math.max(...signal)) * 1.25;
    const off = -0.45 * (yTop / 0.5);
    const noiseOff = noise.map((v) => v + off);
    pl.setup({ xlim: [xMin, xMax], ylim: [off - 0.05, yTop], mar: [4, 4.2, 4, 1.5] });
    fillRegion(pl, xs, signal, split, n, 0, rgba(OUTCOME_COLORS[0], alpha));
    fillRegion(pl, xs, signal, 0, split, 0, rgba(OUTCOME_COLORS[1], alpha));
    pl.lines(xs, signal, { col: 'steelblue', lwd: 2 });
    fillRegion(pl, xs, noiseOff, split, n, off, rgba(OUTCOME_COLORS[2], alpha));
    fillRegion(pl, xs, noiseOff, 0, split, off, rgba(OUTCOME_COLORS[3], alpha));
    pl.lines(xs, noiseOff, { col: 'steelblue', lwd: 2, lty: 2 });
    pl.abline({ v: t, col: 'black', lwd: 2 });
    pl.abline({ h: off, col: '#999', lty: 3 });
    pl.abline({ h: 0, col: 'black', lwd: 0.7 });
    pl.text(xMin + 0.5, yTop * 0.86, lab.state1, { adj: 0, font: 2, cex: 0.85 });
    pl.text(xMin + 0.5, off * 0.28, lab.state2, { adj: 0, font: 2, cex: 0.85 });
    pl.axes({ yat: [] }); pl.box();
    pl.title(lab.distTitleSep, { cex: 1.0 });
    pl.axisLabels(lab.distX, 'Density');
  } else {
    const yMax = Math.max(noisePeak, Math.max(...signal)) * 1.2;
    pl.setup({ xlim: [xMin, xMax], ylim: [0, yMax], mar: [4, 4.2, 4, 1.5] });
    fillRegion(pl, xs, signal, split, n, 0, rgba(OUTCOME_COLORS[0], alpha));
    fillRegion(pl, xs, signal, 0, split, 0, rgba(OUTCOME_COLORS[1], alpha));
    fillRegion(pl, xs, noise, split, n, 0, rgba(OUTCOME_COLORS[2], alpha));
    fillRegion(pl, xs, noise, 0, split, 0, rgba(OUTCOME_COLORS[3], alpha));
    pl.lines(xs, noise, { col: 'steelblue', lwd: 2, lty: 2 });
    pl.lines(xs, signal, { col: 'steelblue', lwd: 2 });
    pl.abline({ v: t, col: 'black', lwd: 2 });
    pl.abline({ h: 0, col: 'black', lwd: 0.7 });
    if (State.showLr) {
      const m = metrics();
      pl.points([t], [dnorm(t, 0, 1)], { pch: 21, col: 'black', fill: 'white', cex: 1.3 });
      pl.points([t], [dnorm(t, d, s)], { pch: 21, col: 'black', fill: 'white', cex: 1.3 });
      pl.text(t + 0.95, yMax * 0.85, `LR = ${rround(m.lr, 2)}`, { font: 2, cex: 0.85 });
    }
    pl.axes(); pl.box();
    pl.title(lab.distTitle, { cex: 1.0 });
    pl.axisLabels(lab.distX, 'Density');
  }
  pl.legend('topright', { legend: lab.cells, fill: OUTCOME_COLORS, cex: 0.7 });
}

/* -------------------------------------------------------------- BUILD --- */

const Params = { curveCanvas: null, distCanvas: null, matrixEl: null, metricsEl: null };

function renderParams() {
  computeCore();
  const lab = L(), m = metrics();
  if (Params.curveCanvas) drawCanvas(Params.curveCanvas);
  if (Params.distCanvas) drawCanvas(Params.distCanvas);
  if (Params.matrixEl) Params.matrixEl.innerHTML = buildMatrixHtml(m.hit, m.fa);
  if (Params.metricsEl) Params.metricsEl.innerHTML = buildMetricsTableHtml();
  const mt = $('#matrix-title'); if (mt) mt.textContent = lab.matrixTitle;
  const mh = $('#metrics-header'); if (mh) mh.textContent = lab.metricsTitle;
}

function rebuildParamsSidebar() {
  const root = $('#params-sidebar');
  if (!root) return;
  const S = State, lab = L();
  root.innerHTML = '';

  root.appendChild(h('<h4>Preset Scenarios</h4>'));
  const presetSel = select('preset', 'Load Preset:', PRESETS[S.mode], S.preset[S.mode]);
  presetSel.querySelector('select').addEventListener('change', (e) => {
    S.preset[S.mode] = e.target.value;
    if (e.target.value !== 'custom') applyPreset(e.target.value);
    rebuildParamsSidebar();
    updateFinleyNote();
  });
  root.appendChild(presetSel);
  root.appendChild(h('<hr>'));

  // ---- constraint mode: the same four options, named for the mode ----
  const cmode = radios('constraint', 'Constraint Mode:', [
    ['none', 'None (set threshold directly)'],
    ['lr', 'Fix likelihood ratio'],
    ['hit', lab.fixHit],
    ['fa', lab.fixFa],
  ], S.constraint, true);
  cmode.querySelectorAll('input').forEach((r) => r.addEventListener('change', (e) => {
    S.constraint = e.target.value; rebuildParamsSidebar();
  }));
  root.appendChild(cmode);

  if (S.constraint === 'lr') {
    const ni = numberInput('target_lr', 'Target likelihood ratio:', S.targetLr, 0.01, 50, 0.1);
    ni.querySelector('input').addEventListener('input', (e) => { S.targetLr = +e.target.value; renderParams(); });
    root.appendChild(ni);
  } else if (S.constraint === 'hit') {
    const sl = slider('target_hit', `Target ${lab.hitName}:`, 0.01, 0.99, S.targetHit, 0.01, (v) => v.toFixed(2));
    sl.querySelector('input').addEventListener('input', (e) => { S.targetHit = +e.target.value; renderParams(); });
    root.appendChild(sl);
  } else if (S.constraint === 'fa') {
    const sl = slider('target_fa', `Target ${lab.faName}:`, 0.001, 0.5, S.targetFa, 0.001, (v) => v.toFixed(3));
    sl.querySelector('input').addEventListener('input', (e) => { S.targetFa = +e.target.value; renderParams(); });
    root.appendChild(sl);
  }
  root.appendChild(h('<hr>'));

  // ---- the shared distribution parameters ----
  root.appendChild(h('<h4>Distribution Parameters</h4>'));
  appendCoreControls(root, 'p', renderParams, { spread: true });

  // ---- NP-only: sample size, and what it is allowed to move ----
  if (S.mode === 'np') {
    root.appendChild(h('<hr>'));
    root.appendChild(h('<h4>Sample Size</h4>'));
    const hold = radios('np_hold', 'When n changes, hold fixed:', [
      ['separation', 'Standardized effect (d√n)'],
      ['d', "Effect size (Cohen's d)"],
    ], S.npHold, true);
    hold.querySelectorAll('input').forEach((r) => r.addEventListener('change', (e) => {
      S.npHold = e.target.value;
      syncEffectD();          // adopt the current picture; nothing jumps
      rebuildParamsSidebar();
    }));
    root.appendChild(hold);
    appendCoreControls(root, 'pn', renderParams, { n: true });
  }
  root.appendChild(h('<hr>'));

  const cbLr = checkbox('show_lr', 'Show likelihood ratios', S.showLr);
  cbLr.querySelector('input').addEventListener('change', (e) => { S.showLr = e.target.checked; rebuildParamsSidebar(); });
  root.appendChild(cbLr);
  if (S.showLr) {
    const cbSlope = checkbox('show_lr_slope', 'Show LR as slope on the curve', S.showLrSlope);
    cbSlope.querySelector('input').addEventListener('change', (e) => { S.showLrSlope = e.target.checked; renderParams(); });
    root.appendChild(cbSlope);
  }
  const cbSkill = checkbox('show_skill', `Show ${lab.skill}`, S.showSkill);
  cbSkill.querySelector('input').addEventListener('change', (e) => { S.showSkill = e.target.checked; renderParams(); });
  root.appendChild(cbSkill);
  const cbSep = checkbox('separate_dists', 'Separate the two distributions', S.separateDists);
  cbSep.querySelector('input').addEventListener('change', (e) => { S.separateDists = e.target.checked; renderParams(); });
  root.appendChild(cbSep);

  root.appendChild(h('<hr>'));
  root.appendChild(h(`<h4 id="metrics-header">${lab.metricsTitle}</h4>`));
  const metricsDiv = h('<div></div>');
  root.appendChild(metricsDiv);
  Params.metricsEl = metricsDiv;

  renderParams();
}

function buildParamsTab() {
  const container = $('#tab1');
  container.innerHTML = '';
  const row = h('<div class="row"></div>');
  const sidebarCol = h('<div class="col col-4"><div class="sidebar" id="params-sidebar"></div></div>');
  const mainCol = h('<div class="col col-8"></div>');

  const curveWrap = h('<div class="plot-container"></div>');
  Params.curveCanvas = mkCanvas(400, drawCurvePlot, { onclick: onCurveClick });
  curveWrap.appendChild(Params.curveCanvas);
  mainCol.appendChild(curveWrap);

  const distWrap = h('<div class="plot-container"></div>');
  Params.distCanvas = mkCanvas(340, drawDistPlot);
  distWrap.appendChild(Params.distCanvas);
  mainCol.appendChild(distWrap);

  mainCol.appendChild(h('<h4 id="matrix-title"></h4>'));
  const matrixDiv = h('<div></div>');
  mainCol.appendChild(matrixDiv);
  Params.matrixEl = matrixDiv;

  row.appendChild(sidebarCol); row.appendChild(mainCol);
  container.appendChild(row);
  rebuildParamsSidebar();
}
</script>
