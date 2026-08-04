<script>
/* ============================================================================
   The water plant: a one-sided z test of H₀: μ ≤ 150 with σ known.

   The accident-inspection example Mayo and Spanos use. An ecological standard
   says water discharged from the plant must not exceed a mean temperature of
   150°F. A sample is taken, a mean comes back, and the test returns a verdict.
   The question this page is about begins after that verdict: what does this
   particular result license you to say about the true mean?

   For a result that rejected H₀ and so indicates μ > μ₁:
       SEV(μ > μ₁) = Pr(X̄ ≤ x̄_obs ; μ = μ₁)
   and for a result that did not:
       SEV(μ ≤ μ₁) = Pr(X̄ ≥ x̄_obs ; μ = μ₁).

   Both collapse to Φ(h), where h is the claim's HEADROOM: how far inside the
   observed result the claim sits, measured in standard errors. That is why
   the severity plot carries a second scale along its top — a claim can be
   read either in degrees Fahrenheit or in the units that actually govern it.
   ==========================================================================*/

const RANGE = {
  observed: { min: 148, max: 156, step: 0.1 },
  claim:    { min: 149, max: 155, step: 0.1 },
};

function compute() {
  const S = State;
  const se = S.sigma / Math.sqrt(S.n);
  const critical = MU0 + qnorm(1 - S.alpha) * se;
  const reject = S.observedMean >= critical;
  // headroom, in SEs, of a claim at mu1 — positive means the result has room
  // to spare, negative means the claim outruns what was seen
  const hOf = (mu1) => (reject ? S.observedMean - mu1 : mu1 - S.observedMean) / se;
  const xOfH = (hv) => reject ? S.observedMean - hv * se : S.observedMean + hv * se;
  const sevAt = (mu1) => pnorm(hOf(mu1));
  return { S, se, critical, reject, hOf, xOfH, sevAt,
    severity: sevAt(S.claimMu), h: hOf(S.claimMu) };
}

/* Both panels share this x-range, which is what lets them be read as one
   figure. Held still, it is sized for the widest distribution the sample-size
   sample size can reach, so that raising n narrows the curve inside a frame
   that does not move. Rescaling, it tracks the current SE — which keeps the picture
   legible but hides the very effect you were looking for, because a curve that
   halves in width inside a frame that also halves looks exactly the same. */
function xRange() {
  const { S, se } = compute();
  if (!State.rescale) {
    const seWide = S.sigma / Math.sqrt(N_MIN);
    return [MU0 - 4 * seWide, MU0 + 5 * seWide];
  }
  return [
    Math.min(MU0 - 4 * se, S.claimMu - 4 * se, S.observedMean - 2 * se),
    Math.max(MU0 + 7 * se, S.claimMu + 4 * se, S.observedMean + 2 * se),
  ];
}

// the same bargain vertically: the tallest peak n can reach, or the current one
function yCeiling(peak) {
  if (State.rescale) return peak * 1.3;
  const seTight = State.sigma / Math.sqrt(N_MAX);
  return 1.15 / (seTight * Math.sqrt(2 * Math.PI));
}

/* ----------------------------------------------- PANEL 1: THE PICTURE --- */

function drawDensities(pl) {
  const { S, se, critical, reject } = compute();
  const [xMin, xMax] = xRange();
  const xs = grid(xMin, xMax, 500);
  const h0 = xs.map((x) => dnorm(x, MU0, se));
  const claim = xs.map((x) => dnorm(x, S.claimMu, se));
  const yMax = yCeiling(Math.max(...h0));

  pl.setup({ xlim: [xMin, xMax], ylim: [0, yMax], mar: [1.6, 4.4, 5, 1.5] });

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

  const xt = RPlot.ticks(xMin, xMax, 5);
  pl.axes({ xat: xt, xlabels: xt.map(() => '') });
  pl.box();
  pl.axisLabels(null, 'Density');
  pl.legend('topright', {
    legend: [`H₀: μ = ${MU0}`, `claim: μ = ${rround(S.claimMu, 2)}`],
    col: [COL.null, COL.claim], lty: [1, 2], lwd: [2.2, 2.2],
  });
  pl.title('Sampling distributions', { cex: 0.95 });
  pl.subtitle(`n = ${S.n}, σ = ${S.sigma}, SE = ${rround(se, 3)}`
    + (State.rescale ? '' : ' — axes held still'), { cex: 0.75 });
}

/* ------------------------------------------------ PANEL 2: THE ANSWER --- */
/* Severity as a function of the claim. This is the object the page is about:
   not one number but a curve, whose crossings of 0.84 and 0.5 are the claims
   this result can and cannot bear. */

function drawCurve(pl) {
  const { S, reject, hOf, xOfH, severity } = compute();
  const [xMin, xMax] = xRange();
  const xs = grid(xMin, xMax, 400);

  pl.setup({ xlim: [xMin, xMax], ylim: [0, 1], mar: [4, 4.4, 2.6, 1.5] });
  severityBenchmarks(pl, { at: reject ? xMax : xMin, adj: reject ? 1 : 0 });

  pl.lines(xs, xs.map((x) => pnorm(hOf(x))), { col: COL.claim, lwd: 2.8 });
  pl.handle(S.claimMu, { col: COL.observed, lwd: 2, lty: 2 });
  pl.points([S.claimMu], [severity], { col: COL.observed, cex: 2 });
  pl.text(S.claimMu + (xMax - xMin) * 0.012, severityLabelY(severity),
    rround(severity, 3), { col: COL.observed, adj: 0, font: 2, cex: 0.86 });

  /* The standardized scale: the same axis in units of standard error. With the
     axes held still and n large, a standard error is only a few pixels wide, so
     thin the ticks to those that can be read apart. */
  const hs = [];
  let lastPx = -Infinity;
  [3, 2, 1, 0, -1, -2].forEach((hv) => {
    const x = xOfH(hv);
    if (x < xMin || x > xMax) return;
    if (Math.abs(pl.X(x) - lastPx) < 26) return;
    lastPx = pl.X(x);
    hs.push(hv);
  });
  pl.axisTop({ at: hs.map(xOfH), labels: hs.map((hv) => (hv > 0 ? '+' : '') + hv) });
  pl.text(reject ? xMin : xMax, 0.885, 'headroom, in SE',
    { col: '#888', adj: reject ? 0 : 1, cex: 0.64 });

  pl.axes(); pl.box();
  pl.axisLabels('Mean temperature (°F)', 'Severity');
  /* No title: the panel above carries the figure's, and the gap between the
     two is already spoken for by the headroom scale. The caption goes inside,
     in whichever top corner the curve has left empty. */
  pl.text(reject ? xMax : xMin, 0.96,
    `severity of the claim μ ${reject ? '>' : '≤'} μ₁, for every μ₁`,
    { col: '#555', adj: reject ? 1 : 0, font: 2, cex: 0.72 });
}

/* -------------------------------------------------------------- PANELS --- */

function decisionHtml() {
  const { S, critical, reject } = compute();
  if (reject) {
    return `<div class="result-box reject-h0">
      <strong>Test verdict: reject H₀</strong><br>
      observed ${rround(S.observedMean, 2)} &ge; critical ${rround(critical, 2)}</div>`;
  }
  return `<div class="result-box fail-reject">
    <strong>Test verdict: do not reject H₀</strong><br>
    observed ${rround(S.observedMean, 2)} &lt; critical ${rround(critical, 2)}</div>`;
}

function severityHtml() {
  const { S, se, reject, severity, h } = compute();
  return severityReadout(
    `<strong>μ ${reject ? '&gt;' : '&le;'} ${rround(S.claimMu, 2)}</strong>`, severity,
    `<span class="help-text" style="margin:0;">headroom ${(h >= 0 ? '+' : '')}${rround(h, 2)} SE
     &nbsp;·&nbsp; SE ${rround(se, 3)}</span>`);
}

function tableHtml() {
  const { S, reject, sevAt, hOf } = compute();
  const mus = seqBy(MU0 - 1, MU0 + 5, 0.5);
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

function interpretationHtml() {
  const { S, se, critical, reject, severity } = compute();
  if (reject) {
    return `<p><strong>Rejection case.</strong> The observed mean
      (${rround(S.observedMean, 2)}) reached the critical value
      (${rround(critical, 2)}), so H₀: μ &le; ${MU0} is rejected. Mayo's advice is to read that as
      evidence <em>against</em> H₀ and nothing more; what the result licenses positively is a
      separate question, and the lower panel is the answer to it.</p>
      <p>Severity for the claim μ &gt; ${rround(S.claimMu, 2)} is
      <strong>${rround(severity, 3)}</strong>. Drag the claim to the right and the curve falls
      away, because a result of this size would be unsurprising even from a smaller discrepancy.
      One rejection therefore supports modest claims well and ambitious ones badly.</p>
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
    <strong>${rround(severity, 3)}</strong>. High severity means a discrepancy that size would
    very probably have shown up, so its absence counts against it. Low severity means the test
    was too imprecise to tell the two apart, and the negative result establishes nothing.</p>
    <p class="note-block">SE = ${rround(se, 3)}. Narrowing it — a larger sample — is what
    converts a null result from uninformative into informative.</p>`;
}

/* --------------------------------------------------------------- BUILD --- */

const Refs = {};

function render() {
  drawCanvas(Refs.densityCanvas);
  drawCanvas(Refs.curveCanvas);
  Refs.decisionEl.innerHTML = decisionHtml();
  Refs.severityEl.innerHTML = severityHtml();
  Refs.tableEl.innerHTML = tableHtml();
  Refs.interpEl.innerHTML = interpretationHtml();
  Refs.seEl.textContent = rround(compute().se, 3);
}

/* Draw a fresh result instead of placing one by hand.

   x̄ over n observations from N(μ, σ) is itself N(μ, σ/√n) exactly, so one draw
   at the standard error is the same thing as n draws averaged, and cheaper.

   Which μ to draw from is a real choice, so it is asked rather than assumed.
   Sampling from H₀ is the more instructive of the two: a plant sitting exactly
   on the limit still trips the test about α of the time, and pressing the
   button until it does shows what such a rejection is worth — the severity of
   any interesting claim collapses. Sampling from the claim shows the mirror
   image: a claim can be exactly true and still be tested badly. Across the
   draws that reject, the severity of that very claim spreads uniformly over
   the range it is able to take, so one result on its own settles very little. */
function takeSample() {
  const { se } = compute();
  const mu = State.sampleFrom === 'claim' ? State.claimMu : MU0;
  /* The draw is NOT clamped to the observed slider's span. At small n that span
     is narrower than the sampling distribution — at n = 10 and σ = 10 nearly a
     third of draws fall outside it — so clamping would pile results up against
     the ends and show a distribution the test does not have. Nothing downstream
     needs the bound: the plots take their x-range from the values themselves.
     The slider is the only thing that cannot follow, and it pins at its end. */
  State.observedMean = snap(rnorm(1, mu, se)[0], RANGE.observed.step);
  setSliderValue('observed', State.observedMean, (v) => v.toFixed(1));
  render();
}

// dragging and the sliders are two views of one value, so each updates the other
function setFromDrag(which, x) {
  const r = RANGE[which];
  const v = clamp(snap(x, r.step), r.min, r.max);
  if (which === 'observed') State.observedMean = v; else State.claimMu = v;
  setSliderValue(which, v, (n) => n.toFixed(1));
  render();
}

function build() {
  const side = $('#controls'), main = $('#figure');

  side.appendChild(h('<h4>Severity of the claim</h4>'));
  Refs.severityEl = h('<div></div>'); side.appendChild(Refs.severityEl);

  side.appendChild(h('<hr>'));
  side.appendChild(h('<h4>The claim, and the result</h4>'));
  side.appendChild(helpText('Both of these can be dragged directly on the plots.'));

  [['claim', 'Claim μ₁:'], ['observed', 'Observed mean:']].forEach(([which, label]) => {
    const r = RANGE[which];
    const el = slider(which, label, r.min, r.max,
      which === 'observed' ? State.observedMean : State.claimMu, r.step, (v) => v.toFixed(1));
    el.querySelector('input').addEventListener('input', (e) => {
      if (which === 'observed') State.observedMean = +e.target.value;
      else State.claimMu = +e.target.value;
      render();
    });
    side.appendChild(el);
  });

  const sampleBtn = h('<button class="btn" id="take-sample">Take a random sample</button>');
  sampleBtn.addEventListener('click', takeSample);
  side.appendChild(sampleBtn);

  const fromSel = select('sample-from', 'Drawn from:', [
    ['null', `H₀ — the true mean is exactly ${MU0}`],
    ['claim', 'The claim — the true mean is μ₁'],
  ], State.sampleFrom);
  fromSel.querySelector('select').addEventListener('change', (e) => {
    State.sampleFrom = e.target.value;
  });
  side.appendChild(fromSel);
  side.appendChild(helpText(`Replaces the observed mean with the average of n fresh
    observations. Press it repeatedly to see how much of the verdict is luck. A draw can
    land outside the slider's span, which leaves the slider pinned at its end.`));

  side.appendChild(h('<hr>'));
  side.appendChild(h('<h4>The test</h4>'));
  side.appendChild(h(`<div class="ctl"><label>Null hypothesis μ₀</label>
    <div class="readonly-val">${MU0}°F <span class="ro-note">the standard</span></div></div>`));

  /* One precision control. n and σ enter only through SE, and n is the knob an
     experimenter actually has, so σ goes behind a disclosure and SE is shown
     as a readout rather than being set twice over. */
  const nSl = slider('n', 'Sample size (n):', N_MIN, N_MAX, State.n, 10, (v) => v.toFixed(0));
  nSl.querySelector('input').addEventListener('input', (e) => {
    State.n = +e.target.value; render();
  });
  side.appendChild(nSl);

  const seRow = h(`<div class="ctl"><label>Standard error</label>
    <div class="readonly-val"><span class="se-val"></span>
    <span class="ro-note">σ ⁄ √n — the unit severity is measured in</span></div></div>`);
  side.appendChild(seRow);
  Refs.seEl = seRow.querySelector('.se-val');

  const rescaleBox = checkbox('rescale', 'Rescale the axes to fit', State.rescale);
  rescaleBox.querySelector('input').addEventListener('change', (e) => {
    State.rescale = e.target.checked; render();
  });
  side.appendChild(rescaleBox);
  side.appendChild(helpText(`Off, the axes hold still while n changes, so the distributions
    visibly narrow and rise. On, they follow the distribution — legible at any n, but the
    effect of n becomes invisible.`));

  const sigmaFold = h('<details class="fold"><summary>Population SD</summary></details>');
  const sigSl = slider('sigma', 'σ:', 1, 20, State.sigma, 1, (v) => v.toFixed(0));
  sigSl.querySelector('input').addEventListener('input', (e) => {
    State.sigma = +e.target.value; render();
  });
  sigmaFold.appendChild(sigSl);
  side.appendChild(sigmaFold);

  const alphaSl = slider('alpha', 'Significance level α:', 0.01, 0.10, State.alpha, 0.005,
    (v) => v.toFixed(3));
  alphaSl.querySelector('input').addEventListener('input', (e) => {
    State.alpha = +e.target.value; render();
  });
  side.appendChild(alphaSl);

  side.appendChild(h('<hr>'));
  Refs.decisionEl = h('<div></div>'); side.appendChild(Refs.decisionEl);

  // both canvases share an x-range and their left and right margins, so the
  // two panels line up column for column and read as a single figure
  const figure = h('<div class="plot-container"></div>');
  Refs.densityCanvas = mkCanvas(320, drawDensities, {
    drag: {
      handles: () => [
        { x: State.observedMean, key: 'observed' },
        { x: State.claimMu, key: 'claim' },
      ],
      onDrag: setFromDrag,
    },
  });
  Refs.curveCanvas = mkCanvas(250, drawCurve, {
    drag: {
      handles: () => [{ x: State.claimMu, key: 'claim' }],
      onDrag: setFromDrag,
    },
  });
  figure.appendChild(Refs.densityCanvas);
  figure.appendChild(Refs.curveCanvas);
  figure.appendChild(h(`<p class="plot-hint">Drag the marked lines to move the claim or the
    observed result.</p>`));
  main.appendChild(figure);

  /* The table is the least readable form of the answer and the plots the most,
     so the numbers live behind a click. The inner div is what gets re-rendered,
     so the open/closed state survives every redraw. */
  const fold = h(`<details class="fold"><summary>Show the numbers</summary>
    <div class="fold-body"></div></details>`);
  main.appendChild(fold);
  Refs.tableEl = fold.querySelector('.fold-body');

  main.appendChild(h('<h4>Interpretation</h4>'));
  Refs.interpEl = h('<div></div>'); main.appendChild(Refs.interpEl);

  render();
}
</script>
