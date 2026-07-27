<script>
/* ============================================================================
   Tab 3: Severity (after Mayo).

   The other two tabs ask what a test does in the long run. This one asks
   what a PARTICULAR result licenses you to say. A result that barely clears
   the critical value warrants almost nothing; one far past it warrants a lot.

   Ported from Severity.R's continuous case, in the standardized units the
   rest of this page uses (H0 at 0, population SD 1, so SE = 1/√n).
   ==========================================================================*/

Object.assign(State, {
  sevObserved: 0.40,
  sevClaim: 0.30,
  sevAlpha: 0.05,
  sevN: 25,
});

const SEV_LABELS = {
  sdt: {
    nullName: 'Noise', nullShort: 'noise',
    claimName: 'Claimed signal strength',
    observedName: 'Observed evidence',
    aboveClaim: 'true signal >', belowClaim: 'true signal ≤',
    xAxis: 'Mean evidence value',
  },
  np: {
    nullName: 'H₀ (μ = 0)', nullShort: 'H₀',
    claimName: 'Claim μ₁',
    observedName: 'Observed mean',
    aboveClaim: 'μ >', belowClaim: 'μ ≤',
    xAxis: 'Sample mean',
  },
};
const SL = () => SEV_LABELS[State.mode === 'compare' ? 'sdt' : State.mode];

function sevCompute() {
  const S = State;
  const se = 1 / Math.sqrt(S.sevN);
  const critical = qnorm(1 - S.sevAlpha) * se;
  const reject = S.sevObserved >= critical;
  const z = (S.sevObserved - S.sevClaim) / se;
  const severity = reject ? pnorm(z) : 1 - pnorm(z);
  return { se, critical, reject, z, severity };
}

function assessLabel(sev) {
  if (sev >= 0.84) return ['Pass', 'assess-pass'];
  if (sev >= 0.5) return ['Weak', 'assess-weak'];
  return ['BENT', 'assess-bent'];
}

/* ---------------------------------------------------------------- PLOT --- */

function drawSeverityPlot(pl) {
  const S = State, lab = SL();
  const { se, critical, reject } = sevCompute();
  const xMin = Math.min(-4 * se, S.sevClaim - 4 * se, S.sevObserved - 2 * se);
  const xMax = Math.max(5 * se, S.sevClaim + 4 * se, S.sevObserved + 2 * se);
  const n = 500; const xs = new Array(n);
  for (let i = 0; i < n; i++) xs[i] = xMin + (i / (n - 1)) * (xMax - xMin);
  const h0 = xs.map((x) => dnorm(x, 0, se));
  const claim = xs.map((x) => dnorm(x, S.sevClaim, se));
  const peak = Math.max(...h0);
  const yMax = peak * 1.35;

  pl.setup({ xlim: [xMin, xMax], ylim: [0, yMax], mar: [4, 4.2, 5, 1.5] });

  // rejection region: the tail of the null beyond the critical value
  let iCrit = xs.findIndex((x) => x >= critical); if (iCrit === -1) iCrit = n;
  fillRegion(pl, xs, h0, iCrit, n, 0, rgba('#d62728', 0.20));

  /* severity region: under the CLAIM distribution, the outcomes that would
     have counted against the claim. Rejecting: results no more extreme than
     what we saw. Not rejecting: results at least as extreme. */
  let iObs = xs.findIndex((x) => x >= S.sevObserved); if (iObs === -1) iObs = n;
  if (reject) fillRegion(pl, xs, claim, 0, iObs, 0, rgba('#2ca02c', 0.28));
  else fillRegion(pl, xs, claim, iObs, n, 0, rgba('#2ca02c', 0.28));

  pl.lines(xs, h0, { col: '#d62728', lwd: 2.2 });
  pl.lines(xs, claim, { col: '#1565c0', lwd: 2.2, lty: 2 });
  pl.abline({ v: critical, col: '#ef6c00', lwd: 1.8, lty: 3 });
  pl.abline({ v: S.sevObserved, col: '#6a1b9a', lwd: 2.4 });

  /* claim, critical and observed often sit within a fraction of an SE of one
     another, so stagger them by height and hang each off its own side of its
     line rather than centring on it. */
  const dx = (xMax - xMin) * 0.015;
  pl.text(0, peak * 1.10, lab.nullShort, { col: '#d62728', font: 2, cex: 0.85 });
  pl.text(S.sevClaim - dx, Math.max(...claim) * 1.06, `claim ${rround(S.sevClaim, 2)}`, { col: '#1565c0', adj: 1, font: 2, cex: 0.72 });
  pl.text(critical - dx, yMax * 0.95, `critical ${rround(critical, 3)}`, { col: '#ef6c00', adj: 1, cex: 0.66 });
  pl.text(S.sevObserved + dx, yMax * 0.85, `observed ${rround(S.sevObserved, 3)}`, { col: '#6a1b9a', adj: 0, font: 2, cex: 0.7 });

  pl.axes(); pl.box();
  pl.axisLabels(lab.xAxis, 'Density');
  pl.title('Rejection region (red) and severity region (green)', { cex: 0.95 });
  pl.subtitle(`n = ${S.sevN}, SE = ${rround(se, 3)}`, { cex: 0.78 });
}

/* --------------------------------------------------------------- PANELS --- */

function buildSevDecisionHtml() {
  const S = State, lab = SL();
  const { critical, reject } = sevCompute();
  if (reject) {
    return `<div class="result-box reject-h0">
      <strong>Decision: REJECT ${lab.nullShort}</strong><br>
      observed ${rround(S.sevObserved, 3)} ≥ critical ${rround(critical, 3)}<br>
      Indication of a real effect above 0.</div>`;
  }
  return `<div class="result-box fail-reject">
    <strong>Decision: DO NOT REJECT ${lab.nullShort}</strong><br>
    observed ${rround(S.sevObserved, 3)} &lt; critical ${rround(critical, 3)}</div>`;
}

function buildSevReadoutHtml() {
  const S = State, lab = SL();
  const { se, reject, severity } = sevCompute();
  const [cls, level] = severityClass(severity);
  const claimText = `${reject ? lab.aboveClaim : lab.belowClaim} ${rround(S.sevClaim, 2)}`;
  return `<div class="severity-box ${cls}">
    <strong>Claim:</strong> ${claimText}<br>
    <strong>Severity:</strong> ${rround(severity, 3)} (${level})
    <div class="severity-bar" style="background: linear-gradient(to right, #4caf50 ${Math.round(severity * 100)}%, #eee ${Math.round(severity * 100)}%);"></div>
    <strong>SE:</strong> ${rround(se, 3)}
  </div>`;
}

/* The canonical table: claims placed at fixed multiples of the standard
   error either side of what was actually observed. Because severity depends
   only on that distance, the column of numbers is the same shape whatever n
   is — n just changes how much ground each step covers. */
function buildSevTableHtml() {
  const S = State, lab = SL();
  const { se, reject, severity } = sevCompute();
  const offsets = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
  const rows = offsets.map((k) => {
    const claimVal = S.sevObserved + k * se;
    const sev = reject ? pnorm(-k) : pnorm(k);
    const [assess, cls] = assessLabel(sev);
    const near = Math.abs(claimVal - S.sevClaim) < se * 0.25;
    return `<tr class="${near ? 'claim-current' : ''}">
      <td class="lbl">${reject ? lab.aboveClaim : lab.belowClaim} ${rround(claimVal, 3)}</td>
      <td>${k === 0 ? '0' : (k > 0 ? '+' : '') + k} SE</td>
      <td>${rround(sev, 3)}</td>
      <td class="assess ${cls}">${assess}</td>
    </tr>`;
  }).join('');
  return `<table class="tbl">
    <thead><tr><th>Claim</th><th>vs observed</th><th>Severity</th><th>Assessment</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p class="help-text">Pass ≥ 0.84 &nbsp;·&nbsp; Weak ≥ 0.5 &nbsp;·&nbsp; below that the claim is
    <em>BENT</em> — the data would look like this even if it were false.</p>`;
}

function buildSevInterpretationHtml() {
  const S = State, lab = SL();
  const { se, critical, reject, severity } = sevCompute();
  if (reject) {
    return `<p>The result cleared the critical value, so ${lab.nullShort} is rejected. How far past
      it the result fell then matters. Severity for the claim ${lab.aboveClaim}
      ${rround(S.sevClaim, 2)} is <strong>${rround(severity, 3)}</strong>, the probability of having
      seen a result no larger than ${rround(S.sevObserved, 3)} if the true value were
      ${rround(S.sevClaim, 2)}.</p>
      <p>Raising the claim lowers severity, since a result of this size gives little reason to
      believe a discrepancy that large. Lowering it raises severity. One rejection therefore
      supports modest claims well and ambitious ones poorly.</p>
      <p class="note-block">For the claim tested at the critical value itself, severity is
      1 − p-value. Observed = ${rround(S.sevObserved, 3)}, critical = ${rround(critical, 3)},
      SE = ${rround(se, 3)}.</p>`;
  }
  return `<p>The result fell short of the critical value, so ${lab.nullShort} is not rejected. On
    its own that is not evidence that the effect is absent; it depends on whether the test was
    capable of detecting one.</p>
    <p>Severity for ${lab.belowClaim} ${rround(S.sevClaim, 2)} is
    <strong>${rround(severity, 3)}</strong>, the probability of having seen a result at least as
    large as ${rround(S.sevObserved, 3)} if the true value were ${rround(S.sevClaim, 2)}. High
    severity means an effect of that size would probably have shown up, so its absence counts
    against it. Low severity means the test was too imprecise to distinguish the two.</p>
    <p class="note-block">Raising n shrinks SE (currently ${rround(se, 3)}), which sharpens every
    claim in the table at once.</p>`;
}

/* --------------------------------------------------------------- BUILD --- */

const Sev = { canvas: null, decisionEl: null, readoutEl: null, tableEl: null, interpEl: null };

function renderSeverity() {
  if (Sev.canvas) drawCanvas(Sev.canvas);
  if (Sev.decisionEl) Sev.decisionEl.innerHTML = buildSevDecisionHtml();
  if (Sev.readoutEl) Sev.readoutEl.innerHTML = buildSevReadoutHtml();
  if (Sev.tableEl) Sev.tableEl.innerHTML = buildSevTableHtml();
  if (Sev.interpEl) Sev.interpEl.innerHTML = buildSevInterpretationHtml();
}

function buildSeverityTab() {
  const container = $('#tab3'), S = State, lab = SL();
  container.innerHTML = '';

  container.appendChild(h(`<div>
    <p>Severity is Deborah Mayo's criterion for when data count as evidence for a hypothesis.
    On her account a hypothesis passes a severe test when two conditions are met: the data agree
    with the hypothesis, and the test was such that, were the hypothesis false, it would very
    probably have produced data agreeing less well with it than the data actually obtained. The
    severity of a passing result is the probability attaching to that second condition.</p>
    <p>This is a question about the particular result rather than about the test's long-run error
    rates. A result that only just clears the critical value passes an ambitious claim with very
    little severity, though its reject/do-not-reject verdict is the same as one that clears the
    critical value comfortably.</p>
    <p class="citation">Mayo, D. (1996), <em>Error and the Growth of Experimental Knowledge</em>,
    University of Chicago Press. Mayo, D. &amp; Spanos, A. (2006), &lsquo;Severe Testing as a Basic
    Concept in a Neyman&ndash;Pearson Philosophy of Induction&rsquo;, <em>British Journal for the
    Philosophy of Science</em> 57(2), 323&ndash;57. Mayo, D. (2018), <em>Statistical Inference as
    Severe Testing</em>, Cambridge University Press.</p>
  </div>`));

  const row = h('<div class="row"></div>');
  const sidebarCol = h('<div class="col col-4"><div class="sidebar" id="sev-sidebar"></div></div>');
  const mainCol = h('<div class="col col-8"></div>');
  const sidebar = sidebarCol.querySelector('#sev-sidebar');

  sidebar.appendChild(h('<h4>The Result</h4>'));
  const obsSl = slider('sev_observed', lab.observedName + ':', -0.5, 2, S.sevObserved, 0.01, (v) => v.toFixed(2));
  obsSl.querySelector('input').addEventListener('input', (e) => { S.sevObserved = +e.target.value; renderSeverity(); });
  sidebar.appendChild(obsSl);

  const claimSl = slider('sev_claim', lab.claimName + ':', -0.5, 2, S.sevClaim, 0.01, (v) => v.toFixed(2));
  claimSl.querySelector('input').addEventListener('input', (e) => { S.sevClaim = +e.target.value; renderSeverity(); });
  sidebar.appendChild(claimSl);
  sidebar.appendChild(h('<hr>'));

  sidebar.appendChild(h('<h4>The Test</h4>'));
  const alphaSl = slider('sev_alpha', 'Significance level α:', 0.005, 0.20, S.sevAlpha, 0.005, (v) => v.toFixed(3));
  alphaSl.querySelector('input').addEventListener('input', (e) => { S.sevAlpha = +e.target.value; renderSeverity(); });
  sidebar.appendChild(alphaSl);

  const nSl = slider('sev_n', 'Sample size (n):', 5, 500, S.sevN, 5, (v) => v);
  nSl.querySelector('input').addEventListener('input', (e) => { S.sevN = +e.target.value; renderSeverity(); });
  sidebar.appendChild(nSl);
  sidebar.appendChild(helpText('Population SD is fixed at 1, so SE = 1/√n.'));
  sidebar.appendChild(h('<hr>'));

  sidebar.appendChild(h('<h4>Decision</h4>'));
  const decDiv = h('<div></div>');
  sidebar.appendChild(decDiv); Sev.decisionEl = decDiv;

  sidebar.appendChild(h('<h4>Severity</h4>'));
  const readDiv = h('<div></div>');
  sidebar.appendChild(readDiv); Sev.readoutEl = readDiv;

  const plotWrap = h('<div class="plot-container"></div>');
  Sev.canvas = mkCanvas(400, drawSeverityPlot);
  plotWrap.appendChild(Sev.canvas);
  mainCol.appendChild(plotWrap);

  mainCol.appendChild(h('<h4>Which claims pass severely?</h4>'));
  const tableDiv = h('<div class="table-scroll"></div>');
  mainCol.appendChild(tableDiv); Sev.tableEl = tableDiv;

  mainCol.appendChild(h('<h4>Interpretation</h4>'));
  const interpDiv = h('<div></div>');
  mainCol.appendChild(interpDiv); Sev.interpEl = interpDiv;

  row.appendChild(sidebarCol); row.appendChild(mainCol);
  container.appendChild(row);
  renderSeverity();
}
</script>
