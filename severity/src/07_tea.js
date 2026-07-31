<script>
/* ============================================================================
   Fisher's lady tasting tea (1935), and what a small discrete experiment can
   and cannot establish.

   The design: eight cups, four poured milk-first and four tea-first, the lady
   told there are four of each and asked to name the four milk-first ones. Her
   four choices settle everything — if j of them are right, then exactly j of
   her tea-first choices are right too, so 2j of the eight cups end up
   correctly classified. There are only five possible outcomes.

   Under guessing, J ~ Hypergeometric(4 milk-first, 4 tea-first, 4 drawn), and
   the one-sided p-value is Pr(J ≥ j). Only a perfect score clears 0.05: that
   is Fisher's point about the design, not an accident of these numbers.

   Severity needs something the null alone cannot give — a model of ability.
   Take θ as the probability she classifies any one cup correctly, so that
   J ~ Binomial(4, θ). Then, for a result that rejected guessing,
       SEV(θ > θ₁) = Pr(J < j_obs ; θ = θ₁)
   and for one that did not,
       SEV(θ ≤ θ₁) = Pr(J > j_obs ; θ = θ₁).

   Two deliberate departures from the R original are worth stating. It counted
   correct cups out of eight and modelled them as eight independent trials;
   because the design fixes four of each, the eight judgements carry only four
   judgements' worth of information, so the binomial is taken over 4 here. And
   its severity used the upper tail, Pr(J ≥ j_obs), which is the direction that
   makes a perfect score look like weak evidence for high ability rather than
   strong. The lower tail is what matches the continuous case on the other
   tabs, and it is used here.
   ==========================================================================*/

const TEA_M = 4;   // milk-first cups
const TEA_N = 4;   // tea-first cups

function teaCompute() {
  const j = State.teaCorrect;
  // Fisher's exact one-sided p-value under random guessing
  let p = 0;
  for (let i = j; i <= TEA_M; i++) p += dhyper(i, TEA_M, TEA_N, TEA_M);
  const reject = p < 0.05;

  const sevAt = (theta) => reject
    ? pbinom(j - 1, TEA_M, theta)          // Pr(J < j_obs) — less impressive than observed
    : 1 - pbinom(j, TEA_M, theta);         // Pr(J > j_obs) — more impressive than observed

  /* Bayes factor inside the capability model, so the two hypotheses are
     stated in the same terms: θ = 1/2 against θ ~ Beta(1,1). The binomial
     coefficient cancels, leaving B(j+1, 5−j) / (1/2)⁴. */
  const bf10 = beta(j + 1, TEA_M - j + 1) / Math.pow(0.5, TEA_M);

  /* A standardized scale, for the cross-scenario comparison only. A perfect
     score puts θ̂ on the boundary where the binomial SE vanishes, so the
     centre and spread come from the Bayes–Laplace estimate (j+1)/(n+2), which
     stays inside the interval. This is an approximation and is used nowhere
     that the exact severities above are available. */
  const thetaTilde = (j + 1) / (TEA_M + 2);
  const seTilde = Math.sqrt(thetaTilde * (1 - thetaTilde) / TEA_M);
  const hOf = (theta) => (reject ? thetaTilde - theta : theta - thetaTilde) / seTilde;

  return { j, cups: 2 * j, pValue: p, reject, sevAt, hOf, thetaTilde, seTilde,
    severity: sevAt(State.teaClaim), bf10 };
}

/* ------------------------------------------------- PANEL 1: THE ANSWER --- */

function drawTeaSeverity(pl) {
  const S = State;
  const { sevAt, reject, severity } = teaCompute();
  const thetas = grid(0.5, 1, 300);
  const sevs = thetas.map(sevAt);

  pl.setup({ xlim: [0.5, 1], ylim: [0, 1], mar: [4, 4.4, 5, 1.5] });
  severityBenchmarks(pl, { at: reject ? 1 : 0.5, adj: reject ? 1 : 0 });

  pl.lines(thetas, sevs, { col: COL.claim, lwd: 2.8 });
  pl.handle(S.teaClaim, { col: COL.observed, lwd: 2, lty: 2 });
  pl.points([S.teaClaim], [severity], { col: COL.observed, cex: 2 });
  pl.text(S.teaClaim + 0.008, severityLabelY(severity), rround(severity, 3),
    { col: COL.observed, adj: 0, font: 2, cex: 0.86 });

  pl.axes(); pl.box();
  pl.axisLabels('Claimed ability θ₁', 'Severity');
  pl.title(reject ? 'Severity of the claim θ > θ₁' : 'Severity of the claim θ ≤ θ₁', { cex: 0.95 });
  pl.subtitle('how much ability this result actually establishes', { cex: 0.78 });
}

/* ------------------------------------------- PANEL 2: WHERE IT COMES FROM --- */

function drawTeaNull(pl) {
  const { j, pValue } = teaCompute();
  const xs = [0, 1, 2, 3, 4];
  const ps = xs.map((x) => dhyper(x, TEA_M, TEA_N, TEA_M));
  const yMax = Math.max(...ps) * 1.28;

  pl.setup({ xlim: [-0.6, 4.6], ylim: [0, yMax], mar: [4, 4.4, 5, 1.5], ext: false });

  xs.forEach((x, i) => {
    const inTail = x >= j;
    const fill = x === j ? COL.observed : (inTail ? rgba(COL.observed, 0.3) : '#cfd8dc');
    pl.rect(x - 0.38, 0, x + 0.38, ps[i], { col: fill, border: '#607d8b', lwd: 1 });
    pl.text(x, ps[i] + yMax * 0.055, rround(ps[i], 4), { cex: 0.7, col: '#333' });
  });

  pl.axes({ xat: xs, nx: 5 }); pl.box();
  pl.axisLabels('Milk-first cups correctly named (of 4)', 'Probability under guessing');
  pl.title('The null distribution has five outcomes', { cex: 0.95 });
  pl.subtitle(`shaded: Pr(J ≥ ${j}) = ${rround(pValue, 4)}`, { cex: 0.78 });
}

/* -------------------------------------------------------------- PANELS --- */

function teaDecisionHtml() {
  const { j, cups, pValue, reject } = teaCompute();
  return `<div class="result-box ${reject ? 'reject-h0' : 'fail-reject'}">
    <strong>Test verdict: ${reject ? 'reject guessing' : 'do not reject guessing'}</strong><br>
    ${j} of 4 milk-first cups named correctly (${cups} of 8 cups classified correctly)<br>
    One-sided exact p-value: ${rround(pValue, 4)}</div>`;
}

function teaSeverityHtml() {
  const { reject, severity, hOf } = teaCompute();
  const claim = `<strong>θ ${reject ? '&gt;' : '&le;'} ${rround(State.teaClaim, 2)}</strong>`;
  return severityReadout(claim, severity,
    `<span class="help-text" style="margin:0;">θ is the probability of classifying any one cup
     correctly; θ = 0.5 is guessing.</span>`);
}

function teaBayesHtml() {
  const { bf10 } = teaCompute();
  return `<div class="result-box neutral-box">
    <strong>BF₁₀:</strong> ${rround(bf10, 3)}<br>
    <strong>BF₀₁:</strong> ${rround(1 / bf10, 3)}<br>
    ${bfInterpretation(bf10)}
    <div class="help-text" style="margin:6px 0 0 0;">θ = 1/2 against θ ~ Beta(1,1), both inside
    the binomial capability model. Even a perfect score buys only a modest factor: four
    judgements is four judgements.</div></div>`;
}

function teaTableHtml() {
  const { sevAt, reject } = teaCompute();
  const rows = seqBy(0.55, 0.95, 0.05).map((t) => {
    const sev = sevAt(t);
    const [assess, cls] = assessLabel(sev);
    const near = Math.abs(t - State.teaClaim) < 0.025;
    return `<tr class="${near ? 'claim-current' : ''}">
      <td class="lbl">θ ${reject ? '&gt;' : '&le;'} ${rround(t, 2)}</td>
      <td>${rround(sev, 3)}</td>
      <td class="assess ${cls}">${assess}</td></tr>`;
  }).join('');
  return `<div class="table-scroll"><table class="tbl">
    <thead><tr><th>Claim</th><th>Severity</th><th>Assessment</th></tr></thead>
    <tbody>${rows}</tbody></table></div>${SEV_KEY}`;
}

function teaInterpretationHtml() {
  const S = State;
  const { j, cups, pValue, reject, severity, bf10 } = teaCompute();
  const head = reject
    ? `<p><strong>Guessing is rejected.</strong> A perfect score has probability
       ${rround(pValue, 4)} under random guessing, which clears 0.05 — and it is the only outcome
       that does. Fisher designed it that way: with eight cups split four and four, nothing short
       of perfection is significant at the conventional level.</p>`
    : `<p><strong>Guessing is not rejected.</strong> Pr(J ≥ ${j}) = ${rround(pValue, 4)} under
       guessing, which does not clear 0.05. With only five possible outcomes, the test has very
       little room to manoeuvre — only a perfect score would have rejected.</p>`;
  return head + `<p><strong>What the result establishes.</strong> Rejecting guessing says the
    lady is doing something. It does not say how much. Severity for the claim
    θ ${reject ? '&gt;' : '&le;'} ${rround(S.teaClaim, 2)} is
    <strong>${rround(severity, 3)}</strong> — the probability that this experiment would have
    produced a result agreeing less well with that claim, if the true ability were exactly
    ${rround(S.teaClaim, 2)}. Drag the claim line across the curve and the shape of the problem
    appears: modest claims about her ability pass comfortably, ambitious ones do not, and the
    experiment as designed simply lacks the resolution to separate a good taster from a perfect
    one.</p>
    <p>This is the discrete counterpart of the point the water plant scenario makes with a
    slider for n. ${cups} of 8 cups correct is a striking result and a small one at the same
    time. The Bayes factor agrees: ${rround(bf10, 2)} to one is real evidence and is nowhere
    near decisive.</p>
    <p class="note-block">The p-value comes from the design's own null, the hypergeometric
    distribution over the lady's four choices. The severity and the Bayes factor come from a
    binomial model of ability laid over the same four judgements — a model of what she might be
    doing, which the null on its own does not supply. Different questions need different
    machinery, and it is worth being explicit about which is doing what.</p>`;
}

/* --------------------------------------------------------------- BUILD --- */

const Tea = {};

function renderTea() {
  if (!Tea.sevCanvas) return;
  drawCanvas(Tea.sevCanvas);
  drawCanvas(Tea.nullCanvas);
  Tea.decisionEl.innerHTML = teaDecisionHtml();
  Tea.severityEl.innerHTML = teaSeverityHtml();
  Tea.tableEl.innerHTML = teaTableHtml();
  Tea.bfEl.innerHTML = teaBayesHtml();
  Tea.interpEl.innerHTML = teaInterpretationHtml();
}

function teaSetFromDrag(_which, x) {
  State.teaClaim = clamp(snap(x, 0.05), 0.5, 1);
  setSliderValue('tea_claim', State.teaClaim, (v) => v.toFixed(2));
  renderTea();
}

function buildTeaPanel() {
  const container = $('#panel-tea'), S = State;
  container.innerHTML = '';

  container.appendChild(h(`<div>
    <p>A lady claims she can tell whether the milk went into the cup before or after the tea.
    Fisher's design: eight cups, four of each, she is told the split and asked to name the four
    milk-first ones. Her four choices decide the whole table, so the experiment has five possible
    outcomes and no more.</p>
    <p>The test asks whether guessing can be ruled out. Severity asks the question that survives
    the answer: supposing she is not guessing, how good has this experiment shown her to be?</p>
  </div>`));

  const row = h('<div class="row"></div>');
  const sideCol = h('<div class="col col-4"><div class="sidebar"></div></div>');
  const mainCol = h('<div class="col col-8"></div>');
  const side = sideCol.querySelector('.sidebar');

  side.appendChild(h('<h4>Severity of the claim</h4>'));
  const severityEl = h('<div></div>'); side.appendChild(severityEl);

  side.appendChild(h('<hr>'));
  side.appendChild(h('<h4>The claim, and the result</h4>'));
  side.appendChild(helpText('The claim can be dragged directly on the curve.'));
  const claimSl = slider('tea_claim', 'Claimed ability θ₁ (per cup):', 0.5, 1, S.teaClaim, 0.05,
    (v) => v.toFixed(2));
  claimSl.querySelector('input').addEventListener('input', (e) => {
    S.teaClaim = +e.target.value; renderTea();
  });
  side.appendChild(claimSl);

  const correctSl = slider('tea_correct', 'Milk-first cups named correctly (of 4):', 0, 4,
    S.teaCorrect, 1, (v) => `${v} → ${2 * v} of 8 cups`);
  correctSl.querySelector('input').addEventListener('input', (e) => {
    S.teaCorrect = +e.target.value; renderTea();
  });
  side.appendChild(correctSl);

  side.appendChild(h('<hr>'));
  const decisionEl = h('<div></div>'); side.appendChild(decisionEl);

  const bfFold = h('<details class="fold"><summary>Bayes factor</summary><div class="fold-body"></div></details>');
  side.appendChild(bfFold);

  const figure = h('<div class="plot-container"></div>');
  Tea.sevCanvas = mkCanvas(340, drawTeaSeverity, {
    drag: { handles: () => [{ x: State.teaClaim, key: 'claim' }], onDrag: teaSetFromDrag },
  });
  figure.appendChild(Tea.sevCanvas);
  figure.appendChild(h('<p class="plot-hint">Drag the claim line to move it.</p>'));
  mainCol.appendChild(figure);

  const nullWrap = h('<div class="plot-container"></div>');
  Tea.nullCanvas = mkCanvas(340, drawTeaNull);
  nullWrap.appendChild(Tea.nullCanvas);
  mainCol.appendChild(nullWrap);

  const tableFold = foldedNumbers('Show the numbers');
  mainCol.appendChild(tableFold);

  mainCol.appendChild(h('<h4>Interpretation</h4>'));
  const interpEl = h('<div></div>'); mainCol.appendChild(interpEl);

  row.appendChild(sideCol); row.appendChild(mainCol);
  container.appendChild(row);

  Object.assign(Tea, {
    decisionEl, severityEl, interpEl,
    tableEl: tableFold.querySelector('.fold-body'),
    bfEl: bfFold.querySelector('.fold-body'),
  });
  renderTea();
}

registerScenario('tea', buildTeaPanel);
</script>
