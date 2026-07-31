<script>
/* ============================================================================
   The continuous case: a one-sided z test of H₀: μ ≤ μ₀ with σ known.

   Water plant. The accident-inspection example Mayo and Spanos use: an
   ecological standard says water discharged from the plant must not exceed
   150°F on average. A sample is taken, a mean comes back, and the question is
   what that mean licenses you to say about the true mean — not merely whether
   it crossed a line.

   Custom test. The same machinery with μ₀ unpinned, so the scenario can be
   pointed at anything on a similar scale.

   Severity, for a result that rejected H₀ and so indicates μ > μ₁:
       SEV(μ > μ₁) = Pr(X̄ ≤ x̄_obs ; μ = μ₁)
   and for a result that did not:
       SEV(μ ≤ μ₁) = Pr(X̄ ≥ x̄_obs ; μ = μ₁).

   Both collapse to Φ(h), where h is the claim's HEADROOM: how far inside the
   observed result the claim sits, measured in standard errors. That single
   quantity is what the standardized comparison panel is built on, and it is
   why the top scale on the severity plot is worth having — a claim can be
   read either in degrees Fahrenheit or in the units that actually govern it.
   ==========================================================================*/

const CONT_RANGE = {
  observed: { min: 148, max: 156, step: 0.1 },
  claim:    { min: 149, max: 155, step: 0.1 },
};

function contCompute(key) {
  const S = State.cont[key];
  const se = S.sigma / Math.sqrt(S.n);
  const critical = S.mu0 + qnorm(1 - S.alpha) * se;
  const reject = S.observedMean >= critical;
  // headroom, in SEs, of a claim at mu1 — positive means the result has room
  // to spare, negative means the claim outruns what was seen
  const hOf = (mu1) => (reject ? S.observedMean - mu1 : mu1 - S.observedMean) / se;
  const xOfH = (h) => reject ? S.observedMean - h * se : S.observedMean + h * se;
  const sevAt = (mu1) => pnorm(hOf(mu1));
  return { S, se, critical, reject, hOf, xOfH, sevAt,
    severity: sevAt(S.claimMu), h: hOf(S.claimMu) };
}

/* The R original's BF₀₁: a closed form of the unit-information style
   comparison for a known-σ z test. It is an approximation and is labelled as
   one — it is here to show that the Bayesian summary and the severity summary
   answer different questions, not to be a reference implementation. */
function contBayesFactor(key) {
  const S = State.cont[key];
  const se = S.sigma / Math.sqrt(S.n);
  const z = (S.observedMean - S.mu0) / se;
  if (!(S.n > 0)) return NaN;
  return Math.sqrt(S.n / (S.n + 1)) * Math.exp((z * z) / (2 * (S.n + 1)) - (z * z) / 2);
}

// both panels share this x-range, which is what lets them be read as one figure
function contXRange(key) {
  const { S, se } = contCompute(key);
  return [
    Math.min(S.mu0 - 4 * se, S.claimMu - 4 * se, S.observedMean - 2 * se),
    Math.max(S.mu0 + 7 * se, S.claimMu + 4 * se, S.observedMean + 2 * se),
  ];
}

/* ------------------------------------------------- PANEL 1: THE ANSWER --- */
/* Severity as a function of the claim. This is the object the whole page is
   about: not one number but a curve, whose crossings of 0.84 and 0.5 are the
   claims this result can and cannot bear. */

function drawContCurve(pl, key) {
  const { S, se, reject, hOf, xOfH, severity } = contCompute(key);
  const [xMin, xMax] = contXRange(key);
  const xs = grid(xMin, xMax, 400);
  const ys = xs.map((x) => pnorm(hOf(x)));

  pl.setup({ xlim: [xMin, xMax], ylim: [0, 1], mar: [1.6, 4.4, 5, 1.5] });

  severityBenchmarks(pl, { at: reject ? xMax : xMin, adj: reject ? 1 : 0 });

  pl.lines(xs, ys, { col: COL.claim, lwd: 2.8 });
  pl.handle(S.claimMu, { col: COL.observed, lwd: 2, lty: 2 });
  pl.points([S.claimMu], [severity], { col: COL.observed, cex: 2 });
  pl.text(S.claimMu + (xMax - xMin) * 0.012,
    severityLabelY(severity), rround(severity, 3),
    { col: COL.observed, adj: 0, font: 2, cex: 0.86 });

  // the standardized scale: the same axis in units of standard error
  const hs = [-2, -1, 0, 1, 2, 3];
  const at = hs.map(xOfH).filter((x) => x >= xMin && x <= xMax);
  const labs = hs.filter((hv) => { const x = xOfH(hv); return x >= xMin && x <= xMax; })
    .map((hv) => (hv > 0 ? '+' : '') + hv);
  pl.axisTop({ at, labels: labs });
  pl.text(reject ? xMax : xMin, 0.06, 'headroom, in SE',
    { col: '#888', adj: reject ? 1 : 0, cex: 0.64 });

  const xt = RPlot.ticks(xMin, xMax, 5);
  pl.axes({ xat: xt, xlabels: xt.map(() => '') });
  pl.box();
  pl.axisLabels(null, 'Severity');
  pl.title(`Severity of the claim μ ${reject ? '>' : '≤'} μ₁, for every μ₁`, { cex: 0.95 });
}

/* ------------------------------------------- PANEL 2: WHERE IT COMES FROM --- */

function drawContDensities(pl, key) {
  const { S, se, critical, reject } = contCompute(key);
  const [xMin, xMax] = contXRange(key);
  const xs = grid(xMin, xMax, 500);
  const h0 = xs.map((x) => dnorm(x, S.mu0, se));
  const claim = xs.map((x) => dnorm(x, S.claimMu, se));
  const peak = Math.max(...h0);
  const yMax = peak * 1.3;

  pl.setup({ xlim: [xMin, xMax], ylim: [0, yMax], mar: [4, 4.4, 2.6, 1.5] });

  // the rejection region belongs to the test's verdict, not to severity, and
  // is coloured accordingly — present, but not competing for attention
  fillRegion(pl, xs, h0, cutAt(xs, critical), xs.length, 0, rgba(COL.reject, 0.22));

  // the severity region: under the CLAIM's distribution, the outcomes that
  // would have agreed less well with the claim than the one obtained
  const iObs = cutAt(xs, S.observedMean);
  if (reject) fillRegion(pl, xs, claim, 0, iObs, 0, rgba(COL.severity, 0.26));
  else fillRegion(pl, xs, claim, iObs, xs.length, 0, rgba(COL.severity, 0.26));

  pl.lines(xs, h0, { col: COL.null, lwd: 2.2 });
  pl.lines(xs, claim, { col: COL.claim, lwd: 2.2, lty: 2 });
  pl.abline({ v: critical, col: COL.critical, lwd: 1.6, lty: 3 });
  pl.handle(S.observedMean, { col: COL.observed, lwd: 2.4 });
  pl.handle(S.claimMu, { col: COL.claim, lwd: 1.8, lty: 2 });

  const dx = (xMax - xMin) * 0.015;
  pl.text(critical - dx, yMax * 0.94, `critical ${rround(critical, 2)}`,
    { col: COL.critical, adj: 1, cex: 0.68 });
  pl.text(S.observedMean + dx, yMax * 0.84, `observed ${rround(S.observedMean, 2)}`,
    { col: COL.observed, adj: 0, font: 2, cex: 0.72 });

  pl.axes(); pl.box();
  pl.axisLabels(key === 'water' ? 'Mean temperature (°F)' : 'Observed mean', 'Density');
  pl.legend('topright', {
    legend: [`H₀: μ = ${rround(S.mu0, 2)}`, `claim: μ = ${rround(S.claimMu, 2)}`],
    col: [COL.null, COL.claim], lty: [1, 2], lwd: [2.2, 2.2],
  });
  pl.subtitle(`n = ${S.n}, σ = ${S.sigma}, SE = ${rround(se, 3)}`, { cex: 0.75 });
}

/* -------------------------------------------------------------- PANELS --- */

function contDecisionHtml(key) {
  const { S, critical, reject } = contCompute(key);
  if (reject) {
    return `<div class="result-box reject-h0">
      <strong>Test verdict: reject H₀</strong><br>
      observed ${rround(S.observedMean, 2)} &ge; critical ${rround(critical, 2)}</div>`;
  }
  return `<div class="result-box fail-reject">
    <strong>Test verdict: do not reject H₀</strong><br>
    observed ${rround(S.observedMean, 2)} &lt; critical ${rround(critical, 2)}</div>`;
}

function contSeverityHtml(key) {
  const { S, se, reject, severity, h } = contCompute(key);
  const claim = `<strong>μ ${reject ? '&gt;' : '&le;'} ${rround(S.claimMu, 2)}</strong>`;
  return severityReadout(claim, severity,
    `<span class="help-text" style="margin:0;">headroom ${(h >= 0 ? '+' : '')}${rround(h, 2)} SE
     &nbsp;·&nbsp; SE ${rround(se, 3)}</span>`);
}

function contBayesHtml(key) {
  const bf01 = contBayesFactor(key);
  if (!Number.isFinite(bf01) || bf01 <= 0) return `<div class="result-box neutral-box">—</div>`;
  return `<div class="result-box neutral-box">
    <strong>BF₀₁ (approx):</strong> ${rround(bf01, 3)}<br>
    <strong>BF₁₀ (approx):</strong> ${rround(1 / bf01, 3)}<br>
    ${bfInterpretation(1 / bf01)}
    <div class="help-text" style="margin:6px 0 0 0;">A comparison of two hypotheses against each
    other. Severity instead asks how well one claim withstood the test it was actually put to.</div>
  </div>`;
}

function contTableHtml(key) {
  const { S, reject, sevAt, hOf } = contCompute(key);
  const mus = seqBy(S.mu0 - 1, S.mu0 + 5, 0.5);
  const nearest = mus.reduce((a, b) =>
    Math.abs(b - S.claimMu) < Math.abs(a - S.claimMu) ? b : a);
  const rows = mus.map((mu1) => {
    const sev = sevAt(mu1), hv = hOf(mu1);
    const [assess, cls] = assessLabel(sev);
    const isNear = mu1 === nearest && Math.abs(mu1 - S.claimMu) <= 0.25;
    return `<tr class="${isNear ? 'claim-current' : ''}">
      <td class="lbl">μ ${reject ? '&gt;' : '&le;'} ${rround(mu1, 2)}</td>
      <td>${(hv >= 0 ? '+' : '')}${rround(hv, 2)}</td>
      <td>${rround(sev, 3)}</td>
      <td class="assess ${cls}">${assess}</td>
    </tr>`;
  }).join('');
  return `<div class="table-scroll"><table class="tbl">
    <thead><tr><th>Claim</th><th>Headroom (SE)</th><th>Severity</th><th>Assessment</th></tr></thead>
    <tbody>${rows}</tbody></table></div>${SEV_KEY}`;
}

function contInterpretationHtml(key) {
  const { S, se, critical, reject, severity } = contCompute(key);
  if (reject) {
    return `<p><strong>Rejection case.</strong> The observed mean
      (${rround(S.observedMean, 2)}) reached the critical value
      (${rround(critical, 2)}), so H₀: μ &le; ${rround(S.mu0, 2)} is rejected. Mayo's advice is to
      read that as evidence <em>against</em> H₀ and nothing more; what the result licenses
      positively is a separate question, and the curve above is the answer to it.</p>
      <p>Severity for the claim μ &gt; ${rround(S.claimMu, 2)} is
      <strong>${rround(severity, 3)}</strong>: the probability of having seen a mean no larger
      than ${rround(S.observedMean, 2)} if the true mean were exactly ${rround(S.claimMu, 2)}.
      Drag the claim to the right and the curve falls away, because a result of this size would
      be unsurprising even from a smaller discrepancy. One rejection therefore supports modest
      claims well and ambitious ones badly.</p>
      <p class="note-block">At the critical value itself severity equals 1 − p. Observed
      = ${rround(S.observedMean, 2)}, critical = ${rround(critical, 2)}, SE = ${rround(se, 3)}.
      Raising n shrinks SE, which slides the whole curve towards the observed value and sharpens
      every claim at once.</p>`;
  }
  return `<p><strong>Non-rejection case.</strong> The observed mean
    (${rround(S.observedMean, 2)}) fell short of the critical value
    (${rround(critical, 2)}), so H₀ is not rejected. On its own that is not evidence that μ is
    small — it depends entirely on whether this test was capable of detecting it if it were
    not.</p>
    <p>Severity for the claim μ &le; ${rround(S.claimMu, 2)} is
    <strong>${rround(severity, 3)}</strong>: the probability of having seen a mean at least as
    large as ${rround(S.observedMean, 2)} if the true mean were ${rround(S.claimMu, 2)}. High
    severity means a discrepancy that size would very probably have shown up, so its absence
    counts against it. Low severity means the test was too imprecise to tell the two apart, and
    the negative result establishes nothing.</p>
    <p class="note-block">SE = ${rround(se, 3)}. Increasing n is what converts a null result from
    uninformative into informative.</p>`;
}

/* --------------------------------------------------------------- BUILD --- */

const ContRefs = {};

function renderCont(key) {
  const R = ContRefs[key];
  if (!R) return;
  drawCanvas(R.curveCanvas);
  drawCanvas(R.densityCanvas);
  R.decisionEl.innerHTML = contDecisionHtml(key);
  R.severityEl.innerHTML = contSeverityHtml(key);
  R.tableEl.innerHTML = contTableHtml(key);
  R.bfEl.innerHTML = contBayesHtml(key);
  R.interpEl.innerHTML = contInterpretationHtml(key);
  R.seEl.textContent = rround(contCompute(key).se, 3);
}

// dragging and the sliders are two views of one value, so each updates the other
function contSetFromDrag(key, which, x) {
  const S = State.cont[key];
  const r = CONT_RANGE[which];
  const v = clamp(snap(x, r.step), r.min, r.max);
  if (which === 'observed') S.observedMean = v; else S.claimMu = v;
  setSliderValue(`${key}_${which}`, v, (n) => n.toFixed(1));
  renderCont(key);
}

function buildContPanel(key) {
  const container = $('#panel-' + key);
  const S = State.cont[key];
  const id = (s) => `${key}_${s}`;
  container.innerHTML = '';

  container.appendChild(h(key === 'water'
    ? `<div>
      <p>A plant discharges water into a river. The standard it is held to is a mean outflow
      temperature of no more than 150°F, so the hypothesis under test is H₀: μ &le; 150, and the
      test rejects when the sample mean runs high enough that a null this size would rarely
      produce it.</p>
      <p>A verdict comes back either way. The interesting question begins after it, and the top
      panel answers it for every claim at once: drag the claim line and read its severity off the
      curve.</p>
    </div>`
    : `<div>
      <p>The same one-sided z test with σ known, but with the null value unpinned. Set μ₀, the
      sample size and the significance level to whatever test you are trying to think about, then
      read off which claims that test's result would license.</p>
      <p>The two settings worth moving together are n and the claim. Severity depends on the gap
      between the observed mean and the claimed mean measured <em>in standard errors</em>, so
      shrinking SE by raising n makes the same nominal claim far more sharply tested.</p>
    </div>`));

  const row = h('<div class="row"></div>');
  const sideCol = h('<div class="col col-4"><div class="sidebar"></div></div>');
  const mainCol = h('<div class="col col-8"></div>');
  const side = sideCol.querySelector('.sidebar');

  side.appendChild(h('<h4>Severity of the claim</h4>'));
  const severityEl = h('<div></div>'); side.appendChild(severityEl);

  side.appendChild(h('<hr>'));
  side.appendChild(h('<h4>The claim, and the result</h4>'));
  side.appendChild(helpText('Both of these can be dragged directly on the plots.'));

  const addSlider = (which, label) => {
    const r = CONT_RANGE[which];
    const el = slider(id(which), label, r.min, r.max,
      which === 'observed' ? S.observedMean : S.claimMu, r.step, (v) => v.toFixed(1));
    el.querySelector('input').addEventListener('input', (e) => {
      if (which === 'observed') S.observedMean = +e.target.value;
      else S.claimMu = +e.target.value;
      renderCont(key);
    });
    side.appendChild(el);
  };
  addSlider('claim', 'Claim μ₁:');
  addSlider('observed', 'Observed mean:');

  side.appendChild(h('<hr>'));
  side.appendChild(h('<h4>The test</h4>'));
  if (key === 'custom') {
    const el = slider(id('mu0'), 'Null hypothesis μ₀:', 145, 155, S.mu0, 1, (v) => v.toFixed(0));
    el.querySelector('input').addEventListener('input', (e) => {
      S.mu0 = +e.target.value; renderCont(key);
    });
    side.appendChild(el);
  } else {
    side.appendChild(h(`<div class="ctl"><label>Null hypothesis μ₀</label>
      <div class="readonly-val">150°F <span class="ro-note">the standard</span></div></div>`));
  }

  /* One precision control. n and σ enter only through SE, and n is the knob an
     experimenter actually has, so σ goes behind a disclosure and SE is shown
     as a readout rather than being set twice over. */
  const nSl = slider(id('n'), 'Sample size (n):', 10, 500, S.n, 10, (v) => v.toFixed(0));
  nSl.querySelector('input').addEventListener('input', (e) => {
    S.n = +e.target.value; renderCont(key);
  });
  side.appendChild(nSl);
  const seRow = h(`<div class="ctl"><label>Standard error</label>
    <div class="readonly-val"><span class="se-val"></span>
    <span class="ro-note">σ ⁄ √n — the unit severity is measured in</span></div></div>`);
  side.appendChild(seRow);

  const sigmaFold = h('<details class="fold"><summary>Population SD</summary></details>');
  const sigSl = slider(id('sigma'), 'σ:', 1, 20, S.sigma, 1, (v) => v.toFixed(0));
  sigSl.querySelector('input').addEventListener('input', (e) => {
    S.sigma = +e.target.value; renderCont(key);
  });
  sigmaFold.appendChild(sigSl);
  side.appendChild(sigmaFold);

  const alphaSl = slider(id('alpha'), 'Significance level α:', 0.01, 0.10, S.alpha, 0.005,
    (v) => v.toFixed(3));
  alphaSl.querySelector('input').addEventListener('input', (e) => {
    S.alpha = +e.target.value; renderCont(key);
  });
  side.appendChild(alphaSl);

  side.appendChild(h('<hr>'));
  const decisionEl = h('<div></div>'); side.appendChild(decisionEl);

  const bfFold = h('<details class="fold"><summary>Bayes factor</summary><div class="fold-body"></div></details>');
  side.appendChild(bfFold);

  // both canvases share an x-range and their left and right margins, so the
  // two panels line up column for column and read as a single figure
  const figure = h('<div class="plot-container"></div>');
  const curveCanvas = mkCanvas(250, (pl) => drawContCurve(pl, key), {
    drag: {
      handles: () => [{ x: State.cont[key].claimMu, key: 'claim' }],
      onDrag: (which, x) => contSetFromDrag(key, which, x),
    },
  });
  const densityCanvas = mkCanvas(320, (pl) => drawContDensities(pl, key), {
    drag: {
      handles: () => [
        { x: State.cont[key].observedMean, key: 'observed' },
        { x: State.cont[key].claimMu, key: 'claim' },
      ],
      onDrag: (which, x) => contSetFromDrag(key, which, x),
    },
  });
  figure.appendChild(curveCanvas);
  figure.appendChild(densityCanvas);
  figure.appendChild(h('<p class="plot-hint">Drag the marked lines to move the claim or the observed result.</p>'));
  mainCol.appendChild(figure);

  const tableFold = foldedNumbers('Show the numbers');
  mainCol.appendChild(tableFold);

  mainCol.appendChild(h('<h4>Interpretation</h4>'));
  const interpEl = h('<div></div>'); mainCol.appendChild(interpEl);

  row.appendChild(sideCol); row.appendChild(mainCol);
  container.appendChild(row);

  ContRefs[key] = {
    curveCanvas, densityCanvas, decisionEl, severityEl, interpEl,
    tableEl: tableFold.querySelector('.fold-body'),
    bfEl: bfFold.querySelector('.fold-body'),
    seEl: seRow.querySelector('.se-val'),
  };
  renderCont(key);
}

registerScenario('water', () => buildContPanel('water'));
registerScenario('custom', () => buildContPanel('custom'));
</script>
