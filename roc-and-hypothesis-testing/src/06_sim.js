<script>
/* ============================================================================
   Tab 2: Simulation.

   Both modes sample from the SAME two distributions set on the Parameters
   tab. What differs is the apparatus each mode needs on top:
     SDT — a stream of trials, classified into the four outcome cells.
     NP  — one sample of size n, plus a "reality" distribution that may sit
           anywhere (not just on H0 or H1), so you can watch a Type I/II
           error actually happen.
   ==========================================================================*/

Object.assign(State, {
  simNTotal: 200, simPropSignal: 0.5, simRandomize: false, simSpeed: 10, simSeparate: false,
  trueMeanSim: 0, simSpeedNp: 5, showSeverityShading: false,
  simSdt: { observations: [], labels: [], idx: 0, running: false, timer: null },
  simNp: {
    sampleData: [], idx: 0, running: false, timer: null, completed: false,
    trueMean: null, se: null, zCrit: null, n: null,
    sampleMean: null, zStatistic: null, pValue: null, decision: null,
  },
});

function shuffleIdx(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function severityClass(sev) {
  if (sev >= 0.95) return ['severity-high', 'Very High'];
  if (sev >= 0.84) return ['severity-high', 'High'];
  if (sev >= 0.5) return ['severity-medium', 'Moderate'];
  return ['severity-low', 'Low (BENT)'];
}
const effectSize = () => State.core.d / Math.sqrt(State.nInterp);

/* The proportion slider is coarse next to a base rate like Finley's 51/2803
   (1.82%), so the split is always computed from State — which keeps the exact
   fraction a preset put there — and shown as counts. */
function trialSplit() {
  const nSig = Math.round(State.simNTotal * State.simPropSignal);
  return { nSig, nNoi: State.simNTotal - nSig };
}
function updateTrialCounts() {
  const el = document.getElementById('trial-counts');
  if (!el) return;
  const { nSig, nNoi } = trialSplit(), lab = L();
  el.textContent = `${nSig} ${lab.dist1.toLowerCase()} · ${nNoi} ${lab.dist2.toLowerCase()}`
    + ` — base rate ${rround(State.simPropSignal * 100, 2)}%`;
}

/* ========================================================== SDT BRANCH === */

function classifyOutcome(v, lab, t) { return lab === 'signal' ? (v > t ? 0 : 1) : (v > t ? 2 : 3); }

function drawSimHist(pl) {
  const S = State.simSdt, lab = L();
  if (!S.observations.length || S.idx === 0) {
    pl.setup({ xlim: [0, 1], ylim: [0, 1], mar: [2, 2, 2, 2] });
    pl.text(0.5, 0.5, "Click ‘Run Simulation’ to begin", { col: '#999' });
    return;
  }
  const obs = S.observations.slice(0, S.idx), labels = S.labels.slice(0, S.idx);
  const { d, t, s } = State.core;
  const xMin = -4, xMax = Math.max(8, d + 4 * s), nbins = 50, bw = (xMax - xMin) / nbins;
  const binIndex = (v) => Math.max(0, Math.min(nbins - 1, Math.floor((v - xMin) / bw)));
  const n = 400; const tx = new Array(n);
  for (let i = 0; i < n; i++) tx[i] = xMin + (i / (n - 1)) * (xMax - xMin);
  /* The bars are relative frequencies, so the overlaid curves have to be
     densities × bin width — and, in the pooled view, × each class's share of
     the sample. Without the share the curves float far above the bars as soon
     as the base rate is lopsided (Finley's tornadoes are 1.8% of trials).
     The R original omitted both factors; it only looked right at 50/50. */
  const tNoise = tx.map((x) => dnorm(x, 0, 1));
  const tSignal = tx.map((x) => dnorm(x, d, s));

  if (State.simSeparate) {
    const sig = [new Array(nbins).fill(0), new Array(nbins).fill(0)];
    const noi = [new Array(nbins).fill(0), new Array(nbins).fill(0)];
    let nSig = 0, nNoi = 0;
    for (let i = 0; i < obs.length; i++) {
      const k = classifyOutcome(obs[i], labels[i], t), b = binIndex(obs[i]);
      if (labels[i] === 'signal') { sig[k][b]++; nSig++; } else { noi[k - 2][b]++; nNoi++; }
    }
    // each panel is normalised within its own class, so bin width alone
    const cSignal = tSignal.map((v) => v * bw);
    const cNoise = tNoise.map((v) => v * bw);
    const sigMax = Math.max(...sig[0], ...sig[1]) / Math.max(nSig, 1);
    const noiMax = Math.max(...noi[0], ...noi[1]) / Math.max(nNoi, 1);
    const yTop = Math.max(sigMax, Math.max(...cSignal)) * 1.25;
    const yBot = Math.max(noiMax, Math.max(...cNoise)) * 1.25;
    pl.setup({ xlim: [xMin, xMax], ylim: [-yBot, yTop], mar: [4, 4.2, 4, 1.5] });
    [0, 1].forEach((k) => {
      for (let i = 0; i < nbins; i++) {
        const f = sig[k][i] / Math.max(nSig, 1);
        if (f > 0) pl.ribbon([xMin + i * bw, xMin + (i + 1) * bw], [f, f], 0, { col: rgba(OUTCOME_COLORS[k], 0.7) });
      }
    });
    [0, 1].forEach((k) => {
      for (let i = 0; i < nbins; i++) {
        const f = noi[k][i] / Math.max(nNoi, 1);
        if (f > 0) pl.ribbon([xMin + i * bw, xMin + (i + 1) * bw], [-f, -f], 0, { col: rgba(OUTCOME_COLORS[k + 2], 0.7) });
      }
    });
    pl.lines(tx, cSignal, { col: 'black', lwd: 1.6 });
    pl.lines(tx, cNoise.map((v) => -v), { col: 'black', lwd: 1.6, lty: 2 });
    pl.abline({ v: t, col: 'black', lwd: 2 });
    pl.abline({ h: 0, col: '#999', lty: 3 });
    pl.text(xMin + 0.5, yTop * 0.86, lab.state1, { adj: 0, font: 2, cex: 0.8 });
    pl.text(xMin + 0.5, -yBot * 0.86, lab.state2, { adj: 0, font: 2, cex: 0.8 });
    pl.axes({ yat: [] }); pl.box();
  } else {
    const counts = [0, 1, 2, 3].map(() => new Array(nbins).fill(0));
    for (let i = 0; i < obs.length; i++) counts[classifyOutcome(obs[i], labels[i], t)][binIndex(obs[i])]++;
    const total = obs.length || 1;
    // pooled view: weight each curve by its class's share of the sample
    let nSig = 0;
    for (let i = 0; i < labels.length; i++) if (labels[i] === 'signal') nSig++;
    const cSignal = tSignal.map((v) => v * bw * (nSig / total));
    const cNoise = tNoise.map((v) => v * bw * ((total - nSig) / total));
    const yMax = Math.max(
      Math.max(...counts.flat()) / total,
      Math.max(...cSignal, ...cNoise)
    ) * 1.25;
    pl.setup({ xlim: [xMin, xMax], ylim: [0, yMax], mar: [4, 4.2, 4, 1.5] });
    [3, 2, 1, 0].forEach((k) => {
      for (let i = 0; i < nbins; i++) {
        const f = counts[k][i] / total;
        if (f > 0) pl.ribbon([xMin + i * bw, xMin + (i + 1) * bw], [f, f], 0, { col: rgba(OUTCOME_COLORS[k], 0.65) });
      }
    });
    pl.lines(tx, cNoise, { col: 'black', lwd: 1.6, lty: 2 });
    pl.lines(tx, cSignal, { col: 'black', lwd: 1.6 });
    pl.abline({ v: t, col: 'black', lwd: 2 });
    pl.axes(); pl.box();
  }
  pl.title(`Simulated Trials (n = ${S.idx})`, { cex: 1.0 });
  pl.axisLabels(lab.distX, 'Relative Frequency');
  pl.legend('topright', { legend: lab.cells, fill: OUTCOME_COLORS, cex: 0.7 });
}

function sdtSimCounts() {
  const S = State.simSdt, { t } = State.core;
  const obs = S.observations.slice(0, S.idx), labels = S.labels.slice(0, S.idx);
  const c = [0, 0, 0, 0];
  for (let i = 0; i < obs.length; i++) c[classifyOutcome(obs[i], labels[i], t)]++;
  return { c, totalSignal: c[0] + c[1], totalNoise: c[2] + c[3] };
}
function buildSdtSimMatrixHtml() {
  const S = State.simSdt;
  if (!S.observations.length || S.idx === 0) return '<p class="help-text">No trials yet.</p>';
  const { c, totalSignal, totalNoise } = sdtSimCounts();
  const hit = totalSignal ? c[0] / totalSignal : 0;
  const fa = totalNoise ? c[2] / totalNoise : 0;
  return buildMatrixHtml(hit, fa, c);
}
function buildSdtCountsTableHtml() {
  const S = State.simSdt, lab = L();
  if (!S.observations.length || S.idx === 0) return '<p class="help-text">No trials yet.</p>';
  const { c } = sdtSimCounts();
  return tableHtml(['Outcome', 'Count'], lab.cells.map((name, i) => [name, c[i]]));
}

/* =========================================================== NP BRANCH === */

function drawNpSimPlot(pl) {
  const S = State.simNp, lab = L();
  const n = State.nInterp, se = 1 / Math.sqrt(n);
  const zCrit = State.core.t, mu1 = effectSize();

  const previewing = !S.sampleData.length || S.idx === 0;
  const trueMean = previewing ? State.trueMeanSim : S.trueMean;
  const seUsed = previewing ? se : S.se;
  const xCrit = (previewing ? zCrit : S.zCrit) * seUsed;

  let xMin, xMax, data = [], currentMean = 0;
  if (previewing) {
    xMin = Math.min(-3.2 * seUsed, trueMean - 3.2 * seUsed);
    xMax = Math.max(3.2 * seUsed, mu1 + 3.2 * seUsed, trueMean + 3.2 * seUsed);
  } else {
    data = S.sampleData.slice(0, S.idx);
    currentMean = data.reduce((a, b) => a + b, 0) / data.length;
    xMin = Math.min(-3 * seUsed, Math.min(...data) - seUsed, currentMean - 2 * seUsed);
    xMax = Math.max(3 * seUsed + Math.max(trueMean, mu1), Math.max(...data) + seUsed);
  }

  const N = 400; const xs = new Array(N);
  for (let i = 0; i < N; i++) xs[i] = xMin + (i / (N - 1)) * (xMax - xMin);
  const h0 = xs.map((x) => dnorm(x, 0, seUsed));
  const h1 = xs.map((x) => dnorm(x, mu1, seUsed));
  const reality = xs.map((x) => dnorm(x, trueMean, seUsed));
  const peak = Math.max(...h0);
  const yMax = peak * 1.4;
  const floor = previewing ? 0 : -yMax * 0.14;

  pl.setup({ xlim: [xMin, xMax], ylim: [floor, yMax], mar: [4, 4.2, 5, 1.5] });

  if (State.showSeverityShading) {
    let split = xs.findIndex((x) => x > xCrit); if (split === -1) split = N;
    fillRegion(pl, xs, h0, split, N, 0, rgba('#ff7f0e', 0.28));
    fillRegion(pl, xs, reality, split, N, 0, rgba('#2ca02c', 0.28));
    if (!previewing) fillRegion(pl, xs, reality, 0, split, 0, rgba('#d62728', 0.22));
  }
  pl.lines(xs, h0, { col: 'steelblue', lwd: 2, lty: 2 });
  pl.lines(xs, h1, { col: 'orange', lwd: 2, lty: 3 });
  pl.lines(xs, reality, { col: 'darkgreen', lwd: 2.4 });
  pl.abline({ v: xCrit, col: 'black', lwd: 2, lty: 2 });

  pl.text(0, peak * 1.12, 'H₀', { col: 'steelblue', font: 2, cex: 0.85 });
  pl.text(mu1, Math.max(...h1) * 1.12, 'H₁', { col: 'orange', font: 2, cex: 0.85 });
  pl.text(trueMean, Math.max(...reality) * 1.26, 'REALITY', { col: 'darkgreen', font: 2, cex: 0.85 });

  if (previewing) {
    pl.axes(); pl.box();
    pl.axisLabels('Sample Mean', 'Density');
    pl.title('Preview: Sampling Distributions', { cex: 1.0 });
    pl.subtitle(`Reality = ${rround(trueMean, 2)}  |  H₁ = ${rround(mu1, 2)}  |  run the simulation to draw a sample`, { cex: 0.75 });
    return;
  }

  const zCurrent = currentMean / S.se;
  pl.abline({ v: currentMean, col: 'red', lwd: 2.2 });
  pl.points(data, data.map(() => floor * 0.5), { col: 'rgba(20,20,20,0.45)', cex: 0.9 });
  pl.text(xCrit, peak * 1.3, `critical\n${rround(S.zCrit, 2)}`, { cex: 0.65 });
  pl.text(currentMean, peak * 0.72, `x̄ = ${rround(currentMean, 3)}\nz = ${rround(zCurrent, 2)}`, { col: 'red', cex: 0.72 });
  pl.axes(); pl.box();
  pl.axisLabels('Sample Mean', 'Density');
  pl.title(`Hypothesis Test (n = ${S.idx} of ${S.sampleData.length})`, { cex: 1.0 });
  pl.subtitle(`z = ${rround(zCurrent, 3)}  |  Reality = ${rround(S.trueMean, 2)}`, { cex: 0.75 });
}

function buildNpSampleStatsHtml() {
  const S = State.simNp;
  if (!S.sampleData.length || S.idx === 0) return '<p class="help-text">No sample yet.</p>';
  const data = S.sampleData.slice(0, S.idx);
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.length > 1 ? data.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (data.length - 1) : 0;
  const z = mean / S.se, p = 1 - pnorm(z);
  return tableHtml(['Statistic', 'Value'], [
    ['Sample size so far', S.idx],
    ['Sample mean', rround(mean, 4)],
    ['Sample SD', rround(Math.sqrt(variance), 4)],
    ['Standard error', rround(S.se, 4)],
    ['Z-statistic', rround(z, 4)],
    ['P-value (one-tailed)', p < 0.0001 ? p.toExponential(3) : rround(p, 4)],
  ]);
}
function buildNpDecisionHtml() {
  const S = State.simNp;
  if (S.decision == null) return '<p class="help-text">Run the simulation to see the test decision.</p>';
  const alpha = 1 - pnorm(S.zCrit);
  const pStr = S.pValue < 0.0001 ? S.pValue.toExponential(3) : rround(S.pValue, 4);
  if (S.decision === 'reject') {
    return `<div class="result-box reject-h0"><strong>Decision: REJECT H₀</strong><br>
      z = ${rround(S.zStatistic, 3)} &gt; ${rround(S.zCrit, 3)} (critical value)<br>
      p = ${pStr} &lt; α = ${rround(alpha, 4)}</div>`;
  }
  return `<div class="result-box fail-reject"><strong>Decision: FAIL TO REJECT H₀</strong><br>
    z = ${rround(S.zStatistic, 3)} ≤ ${rround(S.zCrit, 3)} (critical value)<br>
    p = ${pStr} ≥ α = ${rround(alpha, 4)}</div>`;
}
function buildNpInterpretationHtml() {
  const S = State.simNp;
  if (S.decision == null) return '';
  const h0True = Math.abs(S.trueMean) < 0.001;
  let outcome, explanation, cls;
  if (h0True) {
    if (S.decision === 'reject') { outcome = 'TYPE I ERROR (False Positive)'; explanation = 'H₀ was true (true mean = 0) but we rejected it.'; cls = 'incorrect-decision'; }
    else { outcome = 'CORRECT RETENTION'; explanation = 'H₀ was true (true mean = 0) and we correctly failed to reject it.'; cls = 'correct-decision'; }
  } else if (S.decision === 'reject') {
    outcome = 'CORRECT DETECTION (Power)'; explanation = `The true mean was ${rround(S.trueMean, 2)}, and we correctly rejected H₀.`; cls = 'correct-decision';
  } else {
    outcome = 'TYPE II ERROR (False Negative)'; explanation = `The true mean was ${rround(S.trueMean, 2)}, but we failed to reject H₀.`; cls = 'incorrect-decision';
  }
  return `<div class="result-box ${cls}"><strong>Reality: true mean = ${rround(S.trueMean, 2)}</strong><br>
    <strong>Outcome: ${outcome}</strong><br><br>${explanation}</div>`;
}
function buildNpSeverityHtml() {
  const S = State.simNp;
  if (S.decision == null) return '<p class="help-text">Run the simulation to see the severity analysis.</p>';
  const { zStatistic: z, zCrit, se, n } = S;
  if (S.decision === 'reject') {
    const sev = pnorm(z), discrepancy = (z - zCrit) * se;
    const [cls, level] = severityClass(sev);
    return `<div class="severity-box ${cls}">
      <strong>Severity for rejecting H₀:</strong> ${rround(sev, 3)} (${level})
      <div class="severity-bar" style="background: linear-gradient(to right, #4caf50 ${Math.round(sev * 100)}%, #eee ${Math.round(sev * 100)}%);"></div>
      <p>${rround(sev * 100, 1)}% probability of a less extreme result if H₀ were true.</p>
      <p><strong>Warranted:</strong> claims of an effect ≥ ${rround(discrepancy, 3)} are severely tested.</p>
      <p><em>Severity = 1 − p-value when we reject.</em></p>
    </div>`;
  }
  const levels = [[0.2, 'small'], [0.5, 'medium'], [0.8, 'large']];
  const sevs = levels.map(([dv]) => 1 - pnorm(zCrit - dv * Math.sqrt(n)));
  let cls, level, msg;
  if (sevs[2] >= 0.80) { cls = 'severity-high'; level = 'High'; msg = 'Good power for large effects — this is real evidence against them.'; }
  else if (sevs[1] >= 0.80) { cls = 'severity-medium'; level = 'Moderate'; msg = 'Power for medium effects, but small ones could be missed.'; }
  else { cls = 'severity-low'; level = 'Low'; msg = 'Low power — failing to reject does NOT rule out an effect.'; }
  return `<div class="severity-box ${cls}">
    <strong>Severity for failing to reject H₀:</strong> ${level}
    <p>Power to have detected an effect of size:</p>
    ${tableHtml(['Effect', 'Power'], levels.map(([dv, name], i) => [`d = ${dv} (${name})`, `${rround(sevs[i] * 100, 1)}%`]))}
    <p><strong>Interpretation:</strong> ${msg}</p>
  </div>`;
}

/* ------------------------------------------------------------ RUN/RESET --- */

function simProgressText() {
  if (State.mode === 'sdt') {
    const S = State.simSdt;
    if (!S.observations.length) return "Click ‘Run Simulation’ to begin";
    if (S.running) return `Simulating… ${S.idx} of ${S.observations.length} trials`;
    return `Simulation complete: ${S.idx} trials`;
  }
  const S = State.simNp;
  if (!S.sampleData.length) return 'Set the true mean (Reality) above, then run the simulation';
  if (S.running) return `Collecting sample… ${S.idx} of ${S.sampleData.length} observations`;
  return `Sample complete: ${S.idx} observations`;
}

function startSim() {
  computeCore();
  if (State.mode === 'sdt') {
    const S = State.simSdt;
    clearInterval(S.timer);
    const { nSig, nNoi } = trialSplit();
    let obs = rnorm(nSig, State.core.d, State.core.s).concat(rnorm(nNoi, 0, 1));
    let labels = new Array(nSig).fill('signal').concat(new Array(nNoi).fill('noise'));
    if (State.simRandomize) {
      const order = shuffleIdx(obs.length);
      obs = order.map((i) => obs[i]); labels = order.map((i) => labels[i]);
    }
    S.observations = obs; S.labels = labels; S.idx = 0; S.running = true;
    S.timer = setInterval(() => {
      S.idx += Math.min(State.simSpeed, S.observations.length - S.idx);
      if (S.idx >= S.observations.length) { S.running = false; clearInterval(S.timer); }
      renderSim();
    }, 100);
  } else {
    const S = State.simNp;
    clearInterval(S.timer);
    const n = State.nInterp, se = 1 / Math.sqrt(n);
    S.trueMean = State.trueMeanSim; S.se = se; S.zCrit = State.core.t; S.n = n; S.completed = false;
    S.sampleData = rnorm(n, S.trueMean, 1);
    S.idx = 0; S.running = true;
    S.sampleMean = null; S.zStatistic = null; S.pValue = null; S.decision = null;
    S.timer = setInterval(() => {
      S.idx += Math.min(State.simSpeedNp, S.sampleData.length - S.idx);
      if (S.idx >= S.sampleData.length) {
        S.running = false; S.completed = true; clearInterval(S.timer);
        const mean = S.sampleData.reduce((a, b) => a + b, 0) / S.sampleData.length;
        S.sampleMean = mean; S.zStatistic = mean / S.se;
        S.pValue = 1 - pnorm(S.zStatistic);
        S.decision = S.zStatistic > S.zCrit ? 'reject' : 'fail';
      }
      renderSim();
    }, 100);
  }
  renderSim();
}

function resetSim() {
  clearInterval(State.simSdt.timer); clearInterval(State.simNp.timer);
  State.simSdt = { observations: [], labels: [], idx: 0, running: false, timer: null };
  State.simNp = {
    sampleData: [], idx: 0, running: false, timer: null, completed: false,
    trueMean: null, se: null, zCrit: null, n: null,
    sampleMean: null, zStatistic: null, pValue: null, decision: null,
  };
  renderSim();
}

/* ------------------------------------------------------------ ASSEMBLY --- */

const Sim = { canvas: null, matrixEl: null, statsEl: null, severityEl: null, decisionEl: null, interpEl: null, progressEl: null };

function renderSim() {
  if (Sim.canvas) drawCanvas(Sim.canvas);
  if (State.mode === 'sdt') {
    if (Sim.matrixEl) Sim.matrixEl.innerHTML = buildSdtSimMatrixHtml();
    if (Sim.statsEl) Sim.statsEl.innerHTML = buildSdtCountsTableHtml();
    updateTrialCounts();
  } else {
    if (Sim.statsEl) Sim.statsEl.innerHTML = buildNpSampleStatsHtml();
    if (Sim.decisionEl) Sim.decisionEl.innerHTML = buildNpDecisionHtml();
    if (Sim.interpEl) Sim.interpEl.innerHTML = buildNpInterpretationHtml();
    if (Sim.severityEl) Sim.severityEl.innerHTML = buildNpSeverityHtml();
    refreshNpReadout();
  }
  if (Sim.progressEl) Sim.progressEl.textContent = simProgressText();
}

function refreshNpReadout() {
  const el = document.getElementById('np-readout');
  if (!el) return;
  const m = metrics();
  el.innerHTML = `d = <strong>${rround(effectSize(), 3)}</strong> ·`
    + ` α = <strong>${rround(m.fa, 4)}</strong> ·`
    + ` power = <strong>${rround(m.hit, 3)}</strong>`;
}

function syncTrueMeanSlider() {
  const e = document.getElementById('true_mean_sim');
  if (e) e.value = State.trueMeanSim;
  const disp = document.getElementById('true_mean_sim_val');
  if (disp) disp.textContent = (+State.trueMeanSim).toFixed(2);
}

function buildSimTab() {
  computeCore();
  const container = $('#tab2'), S = State, lab = L();
  container.innerHTML = '';
  const row = h('<div class="row"></div>');
  const sidebarCol = h('<div class="col col-4"><div class="sidebar" id="sim-sidebar"></div></div>');
  const mainCol = h('<div class="col col-8"></div>');
  const sidebar = sidebarCol.querySelector('#sim-sidebar');

  if (S.mode === 'sdt') {
    // the same distribution controls as the Parameters tab, so you can steer
    // from here rather than tabbing back and forth
    sidebar.appendChild(h('<h4>Distributions</h4>'));
    appendCoreControls(sidebar, 's', () => renderSim(), { spread: true });
    sidebar.appendChild(h('<hr>'));

    sidebar.appendChild(h('<h4>Trial Simulation</h4>'));
    // step 1 so odd totals from a preset (Finley's 2803) land exactly
    const nSl = slider('n_total', 'Total number of trials:', 10, 3000, S.simNTotal, 1, (v) => v);
    nSl.querySelector('input').addEventListener('input', (e) => { S.simNTotal = +e.target.value; updateTrialCounts(); });
    sidebar.appendChild(nSl);
    const pSl = slider('prop_signal', `Proportion ${lab.dist1.toLowerCase()} trials:`, 0, 1, S.simPropSignal, 0.001, (v) => v.toFixed(3));
    pSl.querySelector('input').addEventListener('input', (e) => { S.simPropSignal = +e.target.value; updateTrialCounts(); });
    sidebar.appendChild(pSl);
    sidebar.appendChild(h('<p class="help-text" id="trial-counts"></p>'));
    const cbRand = checkbox('randomize_order', 'Randomize trial order', S.simRandomize);
    cbRand.querySelector('input').addEventListener('change', (e) => { S.simRandomize = e.target.checked; });
    sidebar.appendChild(cbRand);
    const spSl = slider('speed', 'Animation speed (trials/frame):', 1, 200, S.simSpeed, 1, (v) => v);
    spSl.querySelector('input').addEventListener('input', (e) => { S.simSpeed = +e.target.value; });
    sidebar.appendChild(spSl);
    const cbSep = checkbox('separate_dists_sim', 'Separate the two distributions', S.simSeparate);
    cbSep.querySelector('input').addEventListener('change', (e) => { S.simSeparate = e.target.checked; renderSim(); });
    sidebar.appendChild(cbSep);
  } else {
    sidebar.appendChild(h('<h4>Test Parameters</h4>'));
    appendCoreControls(sidebar, 's', () => { renderSim(); refreshNpReadout(); }, { n: true });
    sidebar.appendChild(h('<p id="np-readout" class="help-text"></p>'));
    sidebar.appendChild(h('<hr>'));
    sidebar.appendChild(h('<h4>The True State of Reality</h4>'));
    sidebar.appendChild(helpText('Reality need not equal H₀ or H₁ — put it anywhere and watch what the test concludes.'));
    const btnRow = h('<div></div>');
    const btnH0 = h('<button class="btn btn-info btn-sm">Snap to H₀</button>');
    const btnH1 = h('<button class="btn btn-warning btn-sm">Snap to H₁</button>');
    btnH0.addEventListener('click', () => { S.trueMeanSim = 0; syncTrueMeanSlider(); renderSim(); });
    btnH1.addEventListener('click', () => { S.trueMeanSim = +effectSize().toFixed(2); syncTrueMeanSlider(); renderSim(); });
    btnRow.appendChild(btnH0); btnRow.appendChild(btnH1);
    sidebar.appendChild(btnRow);
    const tmSl = slider('true_mean_sim', 'True population mean:', -1, 3, S.trueMeanSim, 0.05, (v) => v.toFixed(2));
    tmSl.querySelector('input').addEventListener('input', (e) => { S.trueMeanSim = +e.target.value; renderSim(); });
    sidebar.appendChild(tmSl);
    sidebar.appendChild(h('<hr>'));
    const cbSev = checkbox('show_severity_shading', 'Show severity shading', S.showSeverityShading);
    cbSev.querySelector('input').addEventListener('change', (e) => { S.showSeverityShading = e.target.checked; renderSim(); });
    sidebar.appendChild(cbSev);
    const spSl = slider('speed_np', 'Animation speed:', 1, 50, S.simSpeedNp, 1, (v) => v);
    spSl.querySelector('input').addEventListener('input', (e) => { S.simSpeedNp = +e.target.value; });
    sidebar.appendChild(spSl);
  }

  sidebar.appendChild(h('<hr>'));
  const btnRow = h('<div></div>');
  const runBtn = h('<button class="btn btn-primary">Run Simulation</button>');
  const resetBtn = h('<button class="btn btn-warning">Reset</button>');
  runBtn.addEventListener('click', startSim);
  resetBtn.addEventListener('click', resetSim);
  btnRow.appendChild(runBtn); btnRow.appendChild(resetBtn);
  sidebar.appendChild(btnRow);
  sidebar.appendChild(h('<hr>'));

  const plotWrap = h('<div class="plot-container"></div>');
  Sim.canvas = mkCanvas(390, S.mode === 'sdt' ? drawSimHist : drawNpSimPlot);
  plotWrap.appendChild(Sim.canvas);
  mainCol.appendChild(plotWrap);

  if (S.mode === 'sdt') {
    sidebar.appendChild(h('<h4>Current Counts</h4>'));
    const countsDiv = h('<div></div>');
    sidebar.appendChild(countsDiv); Sim.statsEl = countsDiv;

    mainCol.appendChild(h(`<h4>${lab.matrixTitle} (observed)</h4>`));
    const matrixDiv = h('<div></div>');
    mainCol.appendChild(matrixDiv); Sim.matrixEl = matrixDiv;
    // No severity panel here: severity is about how well a particular result
    // tested a claim, which does not fit a stream of independent trials.
    Sim.decisionEl = null; Sim.interpEl = null; Sim.severityEl = null;
  } else {
    sidebar.appendChild(h('<h4>Sample Statistics</h4>'));
    const statsDiv = h('<div></div>');
    sidebar.appendChild(statsDiv); Sim.statsEl = statsDiv;

    mainCol.appendChild(h('<h4>Test Decision</h4>'));
    const decDiv = h('<div></div>');
    mainCol.appendChild(decDiv); Sim.decisionEl = decDiv;
    mainCol.appendChild(h('<h4>Interpretation</h4>'));
    const interpDiv = h('<div></div>');
    mainCol.appendChild(interpDiv); Sim.interpEl = interpDiv;
    Sim.matrixEl = null;

    mainCol.appendChild(h('<h4>Severity (Mayo)</h4>'));
    const sevDiv = h('<div></div>');
    mainCol.appendChild(sevDiv); Sim.severityEl = sevDiv;
  }

  mainCol.appendChild(h('<hr>'));
  const progP = h('<p id="sim-progress"></p>');
  mainCol.appendChild(progP); Sim.progressEl = progP;

  row.appendChild(sidebarCol); row.appendChild(mainCol);
  container.appendChild(row);
  renderSim();
}
</script>
