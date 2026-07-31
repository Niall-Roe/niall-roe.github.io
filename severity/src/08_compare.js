<script>
/* ============================================================================
   All four scenarios on one axis.

   Each panel of this page measures something different — a temperature, a hit
   rate, a false alarm rate, a taster's discrimination — and each has its own
   standard error. Divide the gap between the claim and the observed result by
   that standard error and the units drop out. What is left is HEADROOM: how
   far inside the observed result a claim sits, counted in standard errors.

   Under a normal sampling distribution the severity of a claim is then Φ(h),
   full stop. The measurement, the units and the subject matter make no
   difference at all. Three of the four curves on this plot are therefore the
   same curve, and saying so is the point of drawing them together.

   The fourth is not, and that is the more interesting half. The tea
   experiment has five possible outcomes, so its severity function is a step
   function of the data and no amount of rescaling turns it into Φ(h). Where
   the discrete curve sits relative to the normal one is a measure of how much
   the normal approximation would have flattered — or in this case understated
   — a very small experiment.
   ==========================================================================*/

// each entry reports where its own current claim sits on the common scale
function comparisonSeries() {
  const cont = contCompute('water');
  const m = tornadoMetrics();
  const tea = teaCompute();
  const S = State;

  return [
    {
      name: 'Water plant',
      col: '#1565c0',
      claim: `μ ${cont.reject ? '>' : '≤'} ${rround(S.cont.water.claimMu, 2)}`,
      h: cont.h,
      sev: cont.severity,
      unit: `SE = ${rround(cont.se, 3)} °F`,
      curve: null,   // exactly Φ(h)
    },
    {
      name: 'Finley, sensitivity',
      col: '#00838f',
      claim: `TPR > ${rround(S.claimTpr, 2)}`,
      h: hTpr(m, S.claimTpr),
      sev: sevTpr(m, S.claimTpr),
      unit: `SE = ${rround(m.tprSe, 3)}`,
      curve: null,
    },
    {
      name: 'Finley, false alarms',
      col: '#4527a0',
      claim: `FPR < ${rround(S.claimFpr, 3)}`,
      h: hFpr(m, S.claimFpr),
      sev: sevFpr(m, S.claimFpr),
      unit: `SE = ${rround(m.fprSe, 4)}`,
      curve: null,
    },
    {
      name: 'Lady tasting tea',
      col: '#6a1b9a',
      claim: `θ ${tea.reject ? '>' : '≤'} ${rround(S.teaClaim, 2)}`,
      h: tea.hOf(State.teaClaim),
      sev: tea.severity,
      unit: 'five outcomes, no normal law',
      /* The discrete severity function on the common scale. Outside θ ∈ [½, 1]
         there is no claim to have a severity, so the curve stops rather than
         running along zero and inviting a reading it does not support. */
      curve: (hv) => {
        const th = tea.reject
          ? tea.thetaTilde - hv * tea.seTilde
          : tea.thetaTilde + hv * tea.seTilde;
        return (th < 0.5 || th > 1) ? NaN : tea.sevAt(th);
      },
    },
  ];
}

/* ---------------------------------------------------------------- PLOT --- */

function drawComparison(pl) {
  const series = comparisonSeries();
  const hs = grid(-3, 3, 400);

  pl.setup({ xlim: [-3, 3], ylim: [0, 1], mar: [4, 4.4, 5, 1.5] });
  severityBenchmarks(pl, { at: -2.9, adj: 0 });

  // the normal law, drawn wide and pale: every continuous scenario lies on it
  pl.lines(hs, hs.map((hv) => pnorm(hv)), { col: rgba('#1565c0', 0.28), lwd: 12 });
  pl.lines(hs, hs.map((hv) => pnorm(hv)), { col: '#1565c0', lwd: 1.6 });

  // the one series that departs from it
  series.filter((s) => s.curve).forEach((s) => {
    pl.lines(hs, hs.map(s.curve), { col: s.col, lwd: 2.6, lty: 2 });
  });

  /* Where each scenario's current claim actually sits. A claim can be so far
     inside its result that it falls off this axis entirely — a hollow marker
     pinned to the edge says so, rather than a solid one at h = 3 implying a
     headroom it does not have. */
  series.forEach((s, i) => {
    if (!Number.isFinite(s.h) || !Number.isFinite(s.sev)) return;
    const off = Math.abs(s.h) > 3;
    const hv = clamp(s.h, -2.94, 2.94);
    pl.points([hv], [s.sev], off
      ? { col: s.col, cex: 1.5, pch: 21, fill: '#fff' }
      : { col: s.col, cex: 2.1 });
    const right = hv < 1.4;
    const label = off
      ? `${s.name} (h ${s.h > 0 ? '+' : ''}${rround(s.h, 1)}, off scale)`
      : s.name;
    pl.text(hv + (right ? 0.12 : -0.12), clamp(s.sev + 0.07 - 0.035 * i, 0.05, 0.96),
      label, { col: s.col, adj: right ? 0 : 1, font: 2, cex: 0.72 });
  });

  pl.abline({ v: 0, col: '#bbb', lwd: 1, lty: 3 });
  pl.text(0.08, 0.055, 'claim sits exactly at the observed result',
    { col: '#999', adj: 0, cex: 0.62 });

  pl.axes(); pl.box();
  pl.axisLabels('Headroom h: standard errors between the claim and the result', 'Severity');
  pl.legend('bottomright', {
    legend: ['Φ(h) — every normal-theory claim on this page', 'Lady tasting tea (exact, discrete)'],
    col: ['#1565c0', '#6a1b9a'], lty: [1, 2], lwd: [2.4, 2.6],
  });
  pl.title('One curve, four scenarios', { cex: 0.95 });
}

/* --------------------------------------------------------------- TABLE --- */

function comparisonTableHtml() {
  const rows = comparisonSeries().map((s) => {
    const [assess, cls] = assessLabel(s.sev);
    const gap = Number.isFinite(s.h) && Number.isFinite(s.sev)
      ? s.sev - pnorm(s.h) : NaN;
    return `<tr>
      <td class="lbl"><strong style="color:${s.col};">${s.name}</strong></td>
      <td class="lbl">${s.claim}</td>
      <td>${Number.isFinite(s.h) ? (s.h >= 0 ? '+' : '') + rround(s.h, 2) : '—'}</td>
      <td>${Number.isFinite(s.sev) ? rround(s.sev, 3) : '—'}</td>
      <td>${Number.isFinite(gap) ? (Math.abs(gap) < 5e-4 ? '—' : (gap > 0 ? '+' : '') + rround(gap, 3)) : '—'}</td>
      <td class="assess ${cls}">${assess}</td>
      <td class="lbl" style="color:#666;">${s.unit}</td>
    </tr>`;
  }).join('');
  return `<div class="table-scroll"><table class="tbl">
    <thead><tr><th>Scenario</th><th>Current claim</th><th>Headroom (SE)</th><th>Severity</th>
    <th>vs Φ(h)</th><th>Assessment</th><th>Scale</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="help-text">The &ldquo;vs Φ(h)&rdquo; column is the departure from the normal law.
    It is empty wherever the normal law is exact, which is everywhere except the tea.</p>`;
}

function comparisonInterpretationHtml() {
  const series = comparisonSeries();
  const tea = series[3];
  const gap = tea.sev - pnorm(tea.h);
  return `<p>Severity has units of nothing. Once the distance between a claim and the result it
    is judged against is measured in standard errors, the temperature scale, the two rate scales
    and the taster's scale all disappear, and every normal-theory claim on this page lands on the
    same curve, Φ(h). That is not a coincidence to be admired so much as a reason the criterion
    is usable: it means the question &ldquo;how well was this tested?&rdquo; has an answer that
    does not depend on what was being measured.</p>
    <p>It also means the four scenarios can be compared directly. Reading the markers left to
    right tells you which of the claims currently set on the other tabs are doing real work and
    which are coasting. A claim with two standard errors of headroom passes at 0.977 whether it
    is about a river, a tornado or a teacup; a claim with none passes at 0.5, which is to say it
    has not been tested at all.</p>
    <p><strong>Where the analogy breaks.</strong> The tea experiment has five possible outcomes,
    so no rescaling makes it normal. Its curve is drawn dashed, and at the claim currently set it
    sits ${Math.abs(gap) < 5e-4 ? 'almost exactly on' : (gap > 0 ? 'above' : 'below')} the normal
    curve${Math.abs(gap) < 5e-4 ? '' : ` by ${rround(Math.abs(gap), 3)}`}. Small discrete designs
    are where the normal approximation earns or loses its keep, and plotting the exact answer
    against Φ(h) is the cheapest way to see which it has done.</p>
    <p class="note-block">The tea scenario has no ordinary standard error to divide by — a
    perfect score puts the estimate on the boundary, where the binomial SE is zero. The scale
    used here comes from the Bayes–Laplace estimate (j+1)/(n+2), which stays inside the interval.
    It is an approximation, used for this comparison only; the severities reported on the tea tab
    itself are exact. The Custom Test scenario is omitted from the plot because it is the same
    machinery as the water plant and lies on the same curve by construction.</p>`;
}

/* --------------------------------------------------------------- BUILD --- */

const Cmp = {};

function renderComparison() {
  if (!Cmp.canvas) return;
  drawCanvas(Cmp.canvas);
  Cmp.tableEl.innerHTML = comparisonTableHtml();
  Cmp.interpEl.innerHTML = comparisonInterpretationHtml();
}

function buildComparisonPanel() {
  const container = $('#panel-compare');
  container.innerHTML = '';

  container.appendChild(h(`<div>
    <p>The other four tabs measure four unrelated things. This one puts them on a single axis by
    dividing every claim's distance from its result by that scenario's own standard error. The
    resulting quantity — headroom, in standard errors — is all that severity depends on.</p>
    <p>Whatever you have set on the other tabs is what is plotted here. Go and move a claim, then
    come back: its marker will have slid along the curve.</p>
  </div>`));

  const figure = h('<div class="plot-container"></div>');
  Cmp.canvas = mkCanvas(430, drawComparison);
  figure.appendChild(Cmp.canvas);
  container.appendChild(figure);

  container.appendChild(h('<h4>The four claims as currently set</h4>'));
  const tableEl = h('<div></div>'); container.appendChild(tableEl);

  container.appendChild(h('<h4>Interpretation</h4>'));
  const interpEl = h('<div></div>'); container.appendChild(interpEl);

  Object.assign(Cmp, { tableEl, interpEl });
  renderComparison();
}

registerScenario('compare', buildComparisonPanel);
</script>
