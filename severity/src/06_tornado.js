<script>
/* ============================================================================
   Finley's tornado forecasts, 1884-1891.

   Finley reported 2803 forecasts of which he called 96.6% correctly, and
   presented that as a success. Peirce pointed out in Science the same year
   that a forecaster who simply never predicted a tornado would have scored
   higher still, because tornadoes are rare — and proposed the measure now
   called the Peirce Skill Score, TPR − FPR, which is immune to that trick.

   Severity is the natural next question. TPR and FPR are estimates from
   finite counts, so each has a sampling distribution; a claim about the true
   rate behind them can be tested severely or not at all. Two claims are
   assessed here, in the two directions that matter:
       SEV(TPR > t) = Pr(TPR̂ ≤ TPR̂_obs ; TPR = t)
       SEV(FPR < f) = Pr(FPR̂ ≥ FPR̂_obs ; FPR = f)
   Both use the normal approximation to the binomial proportion, which is
   sound for the 2752 non-tornado occasions and rough for the 51 tornadoes —
   and that asymmetry is the whole lesson of the panel.
   ==========================================================================*/

function tornadoMetrics() {
  const S = State;
  const tp = S.tp, tn = S.tn, fp = S.fp, fn = S.fn;
  const total = tp + tn + fp + fn;
  const rate = (a, b) => (a + b) === 0 ? NaN : a / (a + b);

  const tpr = rate(tp, fn);           // sensitivity: caught tornadoes / tornadoes
  const fnr = rate(fn, tp);
  const tnr = rate(tn, fp);           // specificity
  const fpr = rate(fp, tn);           // false alarms / calm days
  const ppv = rate(tp, fp);           // precision
  const npv = rate(tn, fn);
  const accuracy = total === 0 ? NaN : (tp + tn) / total;

  // binomial standard errors, floored so a degenerate 0 or 1 rate still plots
  const seOf = (p, n) => (!Number.isFinite(p) || n <= 0) ? NaN
    : Math.max(Math.sqrt(p * (1 - p) / n), 1e-6);
  const tprSe = seOf(tpr, tp + fn);
  const fprSe = seOf(fpr, fp + tn);

  return { tp, tn, fp, fn, total, tpr, fnr, tnr, fpr, ppv, npv, accuracy, tprSe, fprSe,
    pss: (Number.isFinite(tpr) && Number.isFinite(fpr)) ? tpr - fpr : NaN,
    nPos: tp + fn, nNeg: fp + tn };
}

// headroom in SEs, then severity — the same two steps as every other scenario
const hTpr = (m, claim) => (m.tpr - claim) / m.tprSe;
const hFpr = (m, claim) => (claim - m.fpr) / m.fprSe;
const sevTpr = (m, claim) => pnorm(hTpr(m, claim));
const sevFpr = (m, claim) => pnorm(hFpr(m, claim));

/* ------------------------------------------------- PANEL 1: THE ANSWER --- */

/* One panel per rate, each zoomed to four standard errors either side of what
   was observed. Drawn together on a common [0,1] axis the false alarm curve
   would be a step pinned at 1 across the whole width, which is unreadable and
   says less than it seems to. Zoomed, both are clean sigmoids of the same
   shape, and the message moves into the axes: sensitivity is in play across
   half the unit interval, the false alarm rate across two percentage points.
   The width of each window IS the precision of that estimate. */
const TOR_SPEC = {
  tpr: {
    col: '#2e7d32', label: 'TPR', sign: '>', state: 'claimTpr',
    centre: (m) => m.tpr, se: (m) => m.tprSe, sev: sevTpr, h: hTpr,
    title: 'Claims about sensitivity',
    note: (m) => `from ${m.nPos} tornadoes · SE ${rround(m.tprSe, 3)}`,
    // the control's granularity has to match the estimate's precision, or the
    // claim jumps several standard errors at a time
    sliderId: 'tor_claim_tpr', max: 1, step: 0.01, dp: 2,
  },
  fpr: {
    col: '#b71c1c', label: 'FPR', sign: '<', state: 'claimFpr',
    centre: (m) => m.fpr, se: (m) => m.fprSe, sev: sevFpr, h: hFpr,
    title: 'Claims about false alarms',
    note: (m) => `from ${m.nNeg} calm occasions · SE ${rround(m.fprSe, 4)}`,
    sliderId: 'tor_claim_fpr', max: 0.3, step: 0.001, dp: 3,
  },
};

function drawTornadoCurve(pl, which) {
  const sp = TOR_SPEC[which], m = tornadoMetrics();
  const c = sp.centre(m), se = sp.se(m);
  if (!Number.isFinite(c) || !Number.isFinite(se)) { pl.setup({}); return; }

  const xMin = Math.max(0, c - 4 * se), xMax = Math.min(1, c + 4 * se);
  const xs = grid(xMin, xMax, 300);
  const ys = xs.map((v) => sp.sev(m, v));
  const claim = clamp(State[sp.state], xMin, xMax);
  const sev = sp.sev(m, State[sp.state]);
  const rising = which === 'fpr';

  pl.setup({ xlim: [xMin, xMax], ylim: [0, 1], mar: [4, 4.2, 5, 1.2] });
  // put the benchmark captions on whichever side the curve has left empty
  severityBenchmarks(pl, { at: rising ? xMin : xMax, adj: rising ? 0 : 1 });

  pl.lines(xs, ys, { col: sp.col, lwd: 2.8 });
  pl.handle(claim, { col: COL.observed, lwd: 2, lty: 2 });
  pl.points([claim], [sev], { col: COL.observed, cex: 2 });

  const dx = (xMax - xMin) * 0.03;
  const toFlat = rising ? -dx : dx;   // label into the low, empty side
  pl.text(claim + toFlat, severityLabelY(sev), rround(sev, 3),
    { col: COL.observed, adj: rising ? 1 : 0, font: 2, cex: 0.82 });

  pl.axes({ nx: 4 }); pl.box();
  pl.axisLabels(`Claim: ${sp.label} ${sp.sign} …`, 'Severity');
  pl.title(sp.title, { cex: 0.9 });
  pl.subtitle(sp.note(m), { cex: 0.72 });
}

/* ------------------------------------------- PANEL 2: WHERE IT COMES FROM --- */

function drawTornadoDistns(pl) {
  const S = State, m = tornadoMetrics();
  const tprC = Number.isFinite(m.tpr) ? m.tpr : 0;
  const fprC = Number.isFinite(m.fpr) ? m.fpr : 0;
  const tprSe = Number.isFinite(m.tprSe) ? m.tprSe : 1e-6;
  const fprSe = Number.isFinite(m.fprSe) ? m.fprSe : 1e-6;

  const xt = grid(Math.max(0, tprC - 4 * tprSe), Math.min(1, tprC + 4 * tprSe), 400);
  const xf = grid(Math.max(0, fprC - 4 * fprSe), Math.min(1, fprC + 4 * fprSe), 400);
  const yt = xt.map((x) => dnorm(x, tprC, tprSe));
  let yf = xf.map((x) => dnorm(x, fprC, fprSe));

  /* The FPR estimate rests on 2752 occasions and the TPR estimate on 51, so
     the FPR density is roughly twenty times taller and would flatten the TPR
     curve into the axis. Rescale it to 80% of the TPR peak: the shapes stay
     comparable, the heights no longer mean anything. */
  const peakT = Math.max(...yt), peakF = Math.max(...yf);
  const scale = peakF > 0 ? (peakT / peakF) * 0.8 : 1;
  yf = yf.map((y) => y * scale);
  const yMax = peakT * 1.28;

  pl.setup({ xlim: [0, 1], ylim: [0, yMax], mar: [4, 4.4, 2.4, 1.5] });

  /* Severity regions: outcomes that would have agreed less well with the claim
     than the observed rate did. The FPR region is there and is too narrow to
     see, which is exactly the point the panel is making. */
  fillRegion(pl, xt, yt, 0, cutAt(xt, tprC), 0, rgba(COL.severity, 0.26));
  fillRegion(pl, xf, yf, cutAt(xf, fprC), xf.length, 0, rgba(COL.severity, 0.26));

  pl.lines(xt, yt, { col: COL.severity, lwd: 2.2 });
  pl.lines(xf, yf, { col: '#b71c1c', lwd: 2.2, lty: 2 });

  pl.abline({ v: tprC, col: COL.severity, lwd: 1.6 });
  pl.abline({ v: fprC, col: '#b71c1c', lwd: 1.6 });
  pl.handle(S.claimTpr, { col: COL.severity, lwd: 1.5, lty: 2 });
  pl.handle(S.claimFpr, { col: '#b71c1c', lwd: 1.5, lty: 2 });

  pl.text(tprC + 0.015, yMax * 0.9, `observed TPR ${rround(tprC, 3)}`,
    { col: COL.severity, adj: 0, font: 2, cex: 0.7 });
  pl.text(fprC + 0.015, yMax * 0.66, `observed FPR ${rround(fprC, 3)}`,
    { col: '#b71c1c', adj: 0, font: 2, cex: 0.7 });

  pl.axes(); pl.box();
  pl.axisLabels('Rate', 'Density (FPR rescaled)');
  pl.subtitle(`TPR from ${m.nPos} tornadoes, SE ${rround(m.tprSe, 3)} · ` +
    `FPR from ${m.nNeg} calm occasions, SE ${rround(m.fprSe, 4)}`, { cex: 0.72 });
}

/* --------------------------------------------- PANEL 3: PEIRCE'S POINT --- */

function drawRocPlot(pl) {
  const m = tornadoMetrics();
  pl.setup({ xlim: [-0.05, 1.05], ylim: [-0.05, 1.05], mar: [4, 4.4, 5, 1.5],
    ext: false, square: true });

  pl.abline({ slope: 1, intercept: 0, col: '#aaa', lwd: 1.5, lty: 2 });
  pl.text(0.62, 0.55, 'random guessing', { col: '#888', cex: 0.7 });

  pl.points([0], [1], { col: COL.null, cex: 1.6 });
  pl.text(0.04, 1.0, 'perfect', { col: COL.null, adj: 0, font: 2, cex: 0.72 });
  pl.points([0], [0], { col: '#78909c', cex: 1.6 });
  pl.text(0.04, 0.05, 'never predict tornado', { col: '#78909c', adj: 0, cex: 0.72 });
  pl.points([1], [1], { col: '#78909c', cex: 1.6 });
  pl.text(0.96, 0.96, 'always predict tornado', { col: '#78909c', adj: 1, cex: 0.72 });

  if (Number.isFinite(m.tpr) && Number.isFinite(m.fpr)) {
    // the Peirce Skill Score IS this vertical drop to the diagonal
    pl.segments(m.fpr, m.fpr, m.fpr, m.tpr, { col: COL.observed, lwd: 2.4 });
    pl.text(m.fpr + 0.03, (m.fpr + m.tpr) / 2, `PSS = ${rround(m.pss, 3)}`,
      { col: COL.observed, adj: 0, font: 2, cex: 0.8 });
    pl.points([m.fpr], [m.tpr], { col: COL.observed, cex: 2.2 });
    pl.text(m.fpr, m.tpr + 0.07, 'Finley', { col: COL.observed, font: 2, cex: 0.85 });
  }

  pl.axes({ nx: 5, ny: 5 }); pl.box();
  pl.axisLabels('False positive rate', 'True positive rate');
  pl.title('ROC space', { cex: 0.95 });
  pl.subtitle('the skill score is the height above the diagonal', { cex: 0.78 });
}

/* -------------------------------------------------------------- PANELS --- */

function tornadoPerformanceHtml() {
  const m = tornadoMetrics();
  const rows = [
    ['TPR (sensitivity)', m.tpr, 'tornadoes correctly forecast, of all tornadoes'],
    ['TNR (specificity)', m.tnr, 'calm days correctly forecast, of all calm days'],
    ['FPR (false alarm rate)', m.fpr, '1 − specificity'],
    ['FNR (miss rate)', m.fnr, '1 − sensitivity'],
    ['PPV (precision)', m.ppv, 'tornadoes, of all tornado forecasts'],
    ['NPV', m.npv, 'calm, of all calm forecasts'],
    ['Accuracy', m.accuracy, 'the figure Finley reported'],
    ['PSS = TPR − FPR', m.pss, 'the figure Peirce proposed instead'],
  ].map(([name, v, note]) => `<tr>
      <td class="lbl">${name}</td>
      <td>${Number.isFinite(v) ? rround(v, 3) : '—'}</td>
      <td class="lbl" style="color:#666;">${note}</td>
    </tr>`).join('');
  return `<div class="table-scroll"><table class="tbl">
    <thead><tr><th>Metric</th><th>Value</th><th>Reading</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

/* The four cells are shaded on one neutral ramp rather than four categorical
   colours: on this page a colour means severity, and the matrix is data. */
function tornadoMatrixHtml() {
  const m = tornadoMetrics();
  const denomPos = Math.max(m.nPos, 1), denomNeg = Math.max(m.nNeg, 1);
  const cell = (name, count, prop) =>
    `<td style="background-color: rgba(69,90,100,${(0.08 + 0.42 * prop).toFixed(3)});">
      <span class="cell-name">${name}</span>${count}</td>`;
  return `<table class="conf-table">
    <tr>
      <th class="label-cell"></th>
      <th class="label-cell">Tornado occurred</th>
      <th class="label-cell">No tornado</th>
    </tr>
    <tr>
      <th class="label-cell">Forecast: tornado</th>
      ${cell('hit', m.tp, m.tp / denomPos)}
      ${cell('false alarm', m.fp, m.fp / denomNeg)}
    </tr>
    <tr>
      <th class="label-cell">Forecast: none</th>
      ${cell('miss', m.fn, m.fn / denomPos)}
      ${cell('correct rejection', m.tn, m.tn / denomNeg)}
    </tr>
  </table>
  <p class="help-text">${m.total} occasions, ${m.nPos} of them tornadoes
  (${rround(100 * m.nPos / Math.max(m.total, 1), 2)}%).</p>`;
}

function tornadoSummaryHtml() {
  const m = tornadoMetrics();
  const alwaysNo = m.tn + m.fp;
  return `<div class="result-box neutral-box">
    <strong>Finley's record</strong><br>
    TPR ${Number.isFinite(m.tpr) ? rround(m.tpr, 3) : '—'} ·
    FPR ${Number.isFinite(m.fpr) ? rround(m.fpr, 3) : '—'}<br>
    Accuracy ${Number.isFinite(m.accuracy) ? rround(m.accuracy, 3) : '—'} ·
    PSS ${Number.isFinite(m.pss) ? rround(m.pss, 3) : '—'}
    <div class="help-text" style="margin:6px 0 0 0;">Forecasting &ldquo;no tornado&rdquo; every
    time would have scored ${rround(alwaysNo / Math.max(m.total, 1), 3)} accuracy and 0 skill.</div>
  </div>`;
}

function tornadoSeverityHtml() {
  const S = State, m = tornadoMetrics();
  const st = sevTpr(m, S.claimTpr), sf = sevFpr(m, S.claimFpr);
  const note = (hv) => `<span class="help-text" style="margin:0;">headroom
    ${(hv >= 0 ? '+' : '')}${rround(hv, 2)} SE</span>`;
  return severityReadout(`<strong>TPR &gt; ${rround(S.claimTpr, 2)}</strong>`, st,
      note(hTpr(m, S.claimTpr)))
    + severityReadout(`<strong>FPR &lt; ${rround(S.claimFpr, 3)}</strong>`, sf,
      note(hFpr(m, S.claimFpr)));
}

function tornadoTablesHtml() {
  const S = State, m = tornadoMetrics();
  const mk = (vals, hFn, sevFn, current, fmtClaim) => {
    const rows = vals.map((v) => {
      const sev = sevFn(m, v), hv = hFn(m, v);
      const [assess, cls] = assessLabel(sev);
      return `<tr class="${Math.abs(v - current) < 1e-9 ? 'claim-current' : ''}">
        <td class="lbl">${fmtClaim(v)}</td>
        <td>${Number.isFinite(hv) ? (hv >= 0 ? '+' : '') + rround(hv, 2) : '—'}</td>
        <td>${Number.isFinite(sev) ? rround(sev, 3) : '—'}</td>
        <td class="assess ${cls}">${assess}</td></tr>`;
    }).join('');
    return `<div class="table-scroll"><table class="tbl">
      <thead><tr><th>Claim</th><th>Headroom (SE)</th><th>Severity</th><th>Assessment</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  };
  return `<div class="row">
    <div class="col col-6"><h5>Claims about sensitivity</h5>
      ${mk(seqBy(0.1, 0.9, 0.1), hTpr, sevTpr, +S.claimTpr.toFixed(10),
        (v) => `TPR &gt; ${rround(v, 2)}`)}</div>
    <div class="col col-6"><h5>Claims about the false alarm rate</h5>
      ${mk(seqBy(0.015, 0.05, 0.005), hFpr, sevFpr, +S.claimFpr.toFixed(10),
        (v) => `FPR &lt; ${rround(v, 3)}`)}</div>
  </div>${SEV_KEY}
  <h5>Performance metrics</h5>${tornadoPerformanceHtml()}`;
}

function tornadoInterpretationHtml() {
  const S = State, m = tornadoMetrics();
  const st = sevTpr(m, S.claimTpr), sf = sevFpr(m, S.claimFpr);
  const naive = m.total === 0 ? NaN : (m.tn + m.fp) / m.total;
  return `<p><strong>The base rate problem.</strong> ${m.nPos} of ${m.total} occasions were
    tornadoes — ${rround(100 * m.nPos / Math.max(m.total, 1), 2)}%. Finley's accuracy of
    ${rround(m.accuracy, 3)} sounds impressive until you notice that forecasting no tornado every
    single time scores ${rround(naive, 3)}, with no skill whatever. Accuracy is inflated by class
    imbalance; the Peirce Skill Score, TPR − FPR = <strong>${rround(m.pss, 3)}</strong>, is not,
    because it weights performance on the two classes equally.</p>
    <p><strong>What the record licenses.</strong> Skill scores are point estimates from finite
    counts, and severity asks what the counts support. The claim TPR &gt;
    ${rround(S.claimTpr, 2)} passes with severity
    <strong>${Number.isFinite(st) ? rround(st, 3) : '—'}</strong>; the claim FPR &lt;
    ${rround(S.claimFpr, 3)} with <strong>${Number.isFinite(sf) ? rround(sf, 3) : '—'}</strong>.
    The two curves have the same shape, and the asymmetry is entirely in their horizontal
    scales. Sensitivity is undetermined across half the unit interval, because 51 tornadoes pin
    nothing down; the false alarm rate is settled within about two percentage points, because
    2752 calm occasions pin it very tightly indeed. Read on a common axis the second curve would
    be a vertical step. Rare events are precisely the ones you learn least about, and the width
    of each window says so directly.</p>
    <p class="note-block">The normal approximation to a binomial proportion is used throughout.
    It is comfortable for the ${m.nNeg}-occasion FPR and strained for the ${m.nPos}-occasion TPR,
    so the sensitivity severities should be read as indicative rather than exact.</p>`;
}

/* --------------------------------------------------------------- BUILD --- */

const Tor = {};

function renderTornado() {
  if (!Tor.tprCanvas) return;
  drawCanvas(Tor.tprCanvas);
  drawCanvas(Tor.fprCanvas);
  drawCanvas(Tor.distCanvas);
  drawCanvas(Tor.rocCanvas);
  Tor.summaryEl.innerHTML = tornadoSummaryHtml();
  Tor.severityEl.innerHTML = tornadoSeverityHtml();
  Tor.matrixEl.innerHTML = tornadoMatrixHtml();
  Tor.tablesEl.innerHTML = tornadoTablesHtml();
  Tor.interpEl.innerHTML = tornadoInterpretationHtml();
}

function tornadoSetFromDrag(which, x) {
  const sp = TOR_SPEC[which];
  const v = clamp(snap(x, sp.step), 0, sp.max);
  State[sp.state] = v;
  setSliderValue(sp.sliderId, v, (n) => n.toFixed(sp.dp));
  renderTornado();
}
const tornadoHandles = () => [
  { x: State.claimTpr, key: 'tpr' },
  { x: State.claimFpr, key: 'fpr' },
];

function buildTornadoPanel() {
  const container = $('#panel-tornado'), S = State;
  container.innerHTML = '';

  container.appendChild(h(`<div>
    <p>In 1884 John Finley published the results of a tornado forecasting programme and reported
    that 96.6% of his forecasts were correct. Charles Peirce replied in <em>Science</em> that the
    figure was worthless as stated: a forecaster who never predicted a tornado at all would have
    beaten it, because tornadoes are rare. He proposed measuring skill as the excess of the hit
    rate over the false alarm rate.</p>
    <p>The counts below are Finley's. The severity question is what they establish about the
    <em>true</em> rates behind them — and the two curves answer it very differently, for reasons
    that have nothing to do with Finley and everything to do with how many of each kind of
    occasion there were.</p>
  </div>`));

  const row = h('<div class="row"></div>');
  const sideCol = h('<div class="col col-4"><div class="sidebar"></div></div>');
  const mainCol = h('<div class="col col-8"></div>');
  const side = sideCol.querySelector('.sidebar');

  side.appendChild(h('<h4>Severity of each claim</h4>'));
  const severityEl = h('<div></div>'); side.appendChild(severityEl);

  side.appendChild(h('<hr>'));
  side.appendChild(h('<h4>The claims</h4>'));
  side.appendChild(helpText('Both can be dragged directly on the plots.'));
  [['tpr', 'Claim: TPR (sensitivity) &gt;'],
   ['fpr', 'Claim: FPR (1 − specificity) &lt;'],
  ].forEach(([which, label]) => {
    const sp = TOR_SPEC[which];
    const sl = slider(sp.sliderId, label, 0, sp.max, S[sp.state], sp.step,
      (v) => v.toFixed(sp.dp));
    sl.querySelector('input').addEventListener('input', (e) => {
      S[sp.state] = +e.target.value; renderTornado();
    });
    side.appendChild(sl);
  });

  side.appendChild(h('<hr>'));
  const summaryEl = h('<div></div>'); side.appendChild(summaryEl);

  const countsFold = h('<details class="fold"><summary>Edit the counts</summary></details>');
  countsFold.appendChild(helpText('2803 occasions, 1884&ndash;1891.'));
  [['tor_tp', 'Hits:', 'tp'], ['tor_fn', 'Misses:', 'fn'],
   ['tor_fp', 'False alarms:', 'fp'], ['tor_tn', 'Correct rejections:', 'tn'],
  ].forEach(([id, label, field]) => {
    const el = numberInput(id, label, S[field], 0, 100000, 1);
    el.querySelector('input').addEventListener('input', (e) => {
      S[field] = Math.max(0, Math.round(+e.target.value || 0)); renderTornado();
    });
    countsFold.appendChild(el);
  });
  const resetBtn = h('<button class="btn btn-sm">Reset to Finley\'s counts</button>');
  resetBtn.addEventListener('click', () => {
    S.tp = 28; S.fn = 23; S.fp = 72; S.tn = 2680;
    ['tp', 'fn', 'fp', 'tn'].forEach((f) => {
      const e = document.getElementById('tor_' + f); if (e) e.value = S[f];
    });
    renderTornado();
  });
  countsFold.appendChild(resetBtn);
  side.appendChild(countsFold);

  const matrixWrap = h('<div></div>'); mainCol.appendChild(matrixWrap);

  const figure = h('<div class="plot-container"></div>');
  const curveRow = h('<div class="row"></div>');
  const tprCol = h('<div class="col col-6"></div>');
  const fprCol = h('<div class="col col-6"></div>');
  Tor.tprCanvas = mkCanvas(280, (pl) => drawTornadoCurve(pl, 'tpr'), {
    drag: {
      handles: () => [{ x: State.claimTpr, key: 'tpr' }],
      onDrag: tornadoSetFromDrag,
    },
  });
  Tor.fprCanvas = mkCanvas(280, (pl) => drawTornadoCurve(pl, 'fpr'), {
    drag: {
      handles: () => [{ x: State.claimFpr, key: 'fpr' }],
      onDrag: tornadoSetFromDrag,
    },
  });
  tprCol.appendChild(Tor.tprCanvas); fprCol.appendChild(Tor.fprCanvas);
  curveRow.appendChild(tprCol); curveRow.appendChild(fprCol);
  figure.appendChild(curveRow);
  figure.appendChild(h(`<p class="plot-hint">Note the two horizontal scales: the same four
    standard errors span half the range on the left and two percentage points on the right.</p>`));
  Tor.distCanvas = mkCanvas(300, drawTornadoDistns, {
    drag: { handles: tornadoHandles, onDrag: tornadoSetFromDrag },
  });
  figure.appendChild(Tor.distCanvas);
  figure.appendChild(h('<p class="plot-hint">Drag any claim line to move it.</p>'));
  mainCol.appendChild(figure);

  const rocWrap = h('<div class="plot-container"></div>');
  Tor.rocCanvas = mkCanvas(420, drawRocPlot);
  rocWrap.appendChild(Tor.rocCanvas);
  mainCol.appendChild(rocWrap);

  const tablesFold = foldedNumbers('Show the numbers');
  mainCol.appendChild(tablesFold);

  mainCol.appendChild(h('<h4>Interpretation</h4>'));
  const interpEl = h('<div></div>'); mainCol.appendChild(interpEl);

  row.appendChild(sideCol); row.appendChild(mainCol);
  container.appendChild(row);

  Object.assign(Tor, {
    summaryEl, severityEl, interpEl,
    matrixEl: matrixWrap,
    tablesEl: tablesFold.querySelector('.fold-body'),
  });
  renderTornado();
}

registerScenario('tornado', buildTornadoPanel);
</script>
