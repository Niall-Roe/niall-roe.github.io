<script>
/* ==========================================================================
   EXAMPLE 24 — The two directions

   One inequality, |p̂ - p| <= e, conditioned two ways.

   Fix the urn and range over the samples our procedure might have drawn, and
   the answer is the rate at which the procedure gets it right in this world.
   It is settled by p, s and e, and nothing else.

   Fix the sample and range over the urns the world might have been, and the
   answer needs a distribution over urns. Supply three defensible ones and get
   three numbers, with nothing to choose between them — least of all when the
   sample is small, which is when the question is asked.
   ========================================================================*/
registerExample("example-ex24", (box) => {
  box.appendChild(exHeader("Interactive Example: Which Way Round?", "ex24-content"));
  const content = h(`<div id="ex24-content" class="example-content">
    <p>An urn holds some proportion of white balls. We draw a sample, observe the proportion in it,
      and conclude that the urn's proportion lies within a tolerance of what we saw. Whether that
      conclusion is any good can be asked in two directions, and they are not the same question.</p>
    <div id="ex24-controls" class="control-panel"></div>
    <div class="row">
      <div class="col col-6">
        <h5>The probability that our conclusion will accord with the fact</h5>
        <p style="font-size:0.92em;">The urn is what it is. Range over the samples we might have
          drawn from it, and count how often the procedure's conclusion is true.</p>
        <button class="btn btn-primary btn-sm" data-act="run">Draw a thousand samples</button>
        <button class="btn btn-warning btn-sm" data-act="reset">Reset</button>
        <div class="plot-container" id="ex24-plot-a"></div>
        <div id="ex24-out-a"></div>
      </div>
      <div class="col col-6">
        <h5>The probability that the fact will accord with our conclusion</h5>
        <p style="font-size:0.92em;">Our one sample is what it is. Range over the urns the world
          might have been, and ask what proportion of them our conclusion fits.</p>
        <button class="btn btn-primary btn-sm" data-act="newsample">Draw a fresh sample</button>
        <div class="plot-container" id="ex24-plot-b"></div>
        <div id="ex24-out-b"></div>
      </div>
    </div>
    <div id="ex24-verdict"></div>
  </div>`);
  box.appendChild(content);

  const ctl = $("#ex24-controls", content);
  ctl.appendChild(slider("ex24_p", "The urn's true proportion:", 0.05, 0.95, 0.4, 0.01, (v) => v.toFixed(2)));
  ctl.appendChild(slider("ex24_s", "Balls in a sample:", 4, 200, 5, 1));
  ctl.appendChild(slider("ex24_e", "Tolerance of the conclusion (±):", 0.02, 0.3, 0.1, 0.01, (v) => v.toFixed(2)));

  let hits = 0, tries = 0, path = [], kObs = null;

  /* the urns the world might have been, weighted three defensible ways */
  const GRID = 201;
  const ps = Array.from({ length: GRID }, (_, i) => i / (GRID - 1));
  const PRIORS = [
    { name: "Every urn alike", col: "#2f6f9f", w: () => 1 },
    { name: "Favouring the extremes", col: "#b0563f", w: (p) => Math.pow(p * (1 - p) + 1e-9, -0.85) },
    { name: "Favouring the middle", col: "#6b9c78", w: (p) => Math.pow(p * (1 - p), 4) }
  ];

  function drawSample() {
    const p = num("ex24_p"), s = num("ex24_s");
    let k = 0;
    for (let i = 0; i < s; i++) if (Math.random() < p) k++;
    return k;
  }
  function ensureSample() { if (kObs === null) kObs = drawSample(); return kObs; }

  function runTrials(n) {
    const p = num("ex24_p"), s = num("ex24_s"), e = num("ex24_e");
    for (let i = 0; i < n; i++) {
      const k = drawSample();
      if (Math.abs(k / s - p) <= e + 1e-12) hits++;
      tries++;
      if (tries <= 50 || tries % Math.max(1, Math.floor(tries / 200)) === 0) {
        path.push({ n: tries, v: hits / tries });
      }
    }
    if (!path.length || path[path.length - 1].n !== tries) path.push({ n: tries, v: hits / tries });
  }

  // what the procedure's rate actually is, by the binomial
  function trueCoverage() {
    const p = num("ex24_p"), s = num("ex24_s"), e = num("ex24_e");
    let t = 0;
    for (let k = 0; k <= s; k++) if (Math.abs(k / s - p) <= e + 1e-12) t += dbinom(k, s, p);
    return t;
  }

  // posterior over urns under one prior, and the weight it puts on the conclusion
  function accordUnder(prior) {
    const s = num("ex24_s"), e = num("ex24_e"), k = ensureSample(), phat = k / s;
    const w = ps.map((p) => {
      const like = (p === 0 ? (k === 0 ? 1 : 0) : p === 1 ? (k === s ? 1 : 0)
        : Math.exp(k * Math.log(p) + (s - k) * Math.log(1 - p)));
      return prior.w(p) * like;
    });
    const tot = w.reduce((a, b) => a + b, 0) || 1;
    const dens = w.map((v) => v / tot);
    let acc = 0;
    ps.forEach((p, i) => { if (Math.abs(p - phat) <= e + 1e-12) acc += dens[i]; });
    return { dens, accord: acc };
  }

  const canvasA = mkCanvas(230, (pl) => {
    const cov = trueCoverage();
    if (!tries) { blankPlot(pl, "Draw some samples to begin"); return; }
    const xMax = Math.max(50, tries);
    pl.setup({ xlim: [Math.log10(1), Math.log10(xMax * 1.05)], ylim: [0, 1], mar: [4, 5, 2.5, 1.5] });
    const dec = [];
    for (let ex = 0; ex <= Math.ceil(Math.log10(xMax)); ex++) {
      [1, 2, 5].forEach((m) => { const v = m * Math.pow(10, ex); if (v <= xMax) dec.push(v); });
    }
    pl.axes({ xat: dec.map(Math.log10), xlabels: dec.map((v) => bigmark(v)) });
    pl.box();
    pl.axisLabels("Samples drawn (log scale)", "Conclusion true so far");
    pl.clip(true);
    pl.lines(path.map((d) => Math.log10(d.n)), path.map((d) => d.v), { col: "#2f6f9f", lwd: 2.5 });
    pl.abline({ h: cov, col: "#4a7c59", lwd: 2 });
    pl.clip(false);
    pl.text(Math.log10(xMax) * 0.55, Math.min(0.96, cov + 0.07),
      `the procedure's rate ${fmt(cov, 3)}`, { col: "#4a7c59", font: 2, cex: 0.7 });
  });
  $("#ex24-plot-a", content).appendChild(canvasA);

  const canvasB = mkCanvas(230, (pl) => {
    const s = num("ex24_s"), e = num("ex24_e"), phat = ensureSample() / s;
    const curves = PRIORS.map((pr) => accordUnder(pr));
    const yMax = Math.max(...curves.map((c) => Math.max(...c.dens))) * 1.2 || 1;
    pl.setup({ xlim: [0, 1], ylim: [0, yMax], mar: [4, 5, 2.5, 1.5] });
    pl.axes({ nx: 5, yat: [] });
    pl.box();
    pl.axisLabels("The urn the world might have been", "Weight");
    pl.clip(true);
    pl.rect(Math.max(0, phat - e), 0, Math.min(1, phat + e), yMax,
      { col: "rgba(255,193,7,0.22)", border: null });
    curves.forEach((c, i) => pl.lines(ps, c.dens, { col: PRIORS[i].col, lwd: 2.2 }));
    pl.abline({ v: phat, col: "#3a3f45", lwd: 1.5, lty: 2 });
    pl.clip(false);
    pl.legend("topright", {
      legend: PRIORS.map((p) => p.name), col: PRIORS.map((p) => p.col),
      lwd: [2.2, 2.2, 2.2], lty: [1, 1, 1], cex: 0.65
    });
  });
  $("#ex24-plot-b", content).appendChild(canvasB);

  function update() {
    const s = num("ex24_s"), e = num("ex24_e"), p = num("ex24_p");
    const k = ensureSample(), phat = k / s;
    const cov = trueCoverage();

    $("#ex24-out-a", content).innerHTML = `<div class="key-insight" style="margin-top:0;">
      <p style="margin-bottom:6px;">${tries ? `True in <strong>${bigmark(hits)}</strong> of
        <strong>${bigmark(tries)}</strong> samples (${fmt(hits / tries, 4)}).` : "No samples drawn yet."}</p>
      <p style="margin-bottom:0;">The rate is <strong>${fmt(cov, 4)}</strong>, fixed by the urn, the
        sample size and the tolerance. Nothing was assumed to get it.</p></div>`;

    const rows = PRIORS.map((pr) => {
      const a = accordUnder(pr).accord;
      return `<tr><td class="lbl" style="color:${pr.col};font-weight:700;">${pr.name}</td>
        <td><strong>${fmt(a, 4)}</strong></td></tr>`;
    }).join("");
    const vals = PRIORS.map((pr) => accordUnder(pr).accord);
    const spread = Math.max(...vals) - Math.min(...vals);
    $("#ex24-out-b", content).innerHTML = `
      <p style="font-size:0.92em;margin-bottom:6px;">Our sample: <strong>${k}</strong> white in
        <strong>${s}</strong>, so the conclusion is that the urn lies within
        ${fmt(Math.max(0, phat - e), 2)} to ${fmt(Math.min(1, phat + e), 2)}.</p>
      <table class="tbl"><thead><tr><th style="text-align:left;">Weighting the urns</th>
        <th>Answer</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="help-text">Three answers, spread ${fmt(spread, 3)}. Each is as defensible as the others.</p>`;

    $("#ex24-verdict", content).innerHTML = `<div class="note-block">
      <p>The same inequality stands behind both columns: the urn's proportion within
      ${fmt(e, 2)} of the sample's. On the left it is conditioned on the urn and counted over
      samples; on the right it is conditioned on the sample and counted over urns.</p>
      <p>The left number is a fact about our procedure in the world we are in. Draw more samples and
      it settles on ${fmt(cov, 4)}, and it would settle there whatever anyone believed. The right
      number cannot be had without saying how the urns are distributed, and the three weightings give
      ${vals.map((v) => fmt(v, 3)).join(", ")}. There is no further fact to appeal to, because we
      have not got a population of urns to count &mdash; only the one in front of us.</p>
      <p>Raise the sample size and the three answers close on each other, which is the whole of their
      credibility: they agree only when the data is doing the work and the weighting has stopped
      mattering. It is the small-sample case that the question was asked about.</p></div>`;

    drawCanvas(canvasA); drawCanvas(canvasB);
  }

  content.addEventListener("input", () => {
    hits = 0; tries = 0; path = []; kObs = null; update();
  });
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "run") runTrials(1000);
    else if (a === "reset") { hits = 0; tries = 0; path = []; }
    else if (a === "newsample") kObs = drawSample();
    else return;
    update();
  });
  update();
});
</script>
