<script>
/* ==========================================================================
   EXAMPLE 7 — The proportion correct among the answers that agree
   (93 x 81) / ((93 x 81) + (7 x 19))
   ========================================================================*/
registerExample("example-ex7", (box) => {
  box.appendChild(exHeader("Interactive Example: When Both Rules Give the Same Answer", "ex7-content"));
  const content = h(`<div id="ex7-content" class="example-content">
    <p>Two independent rules, applied to the same question, either agree or disagree. They agree in just two
      circumstances: both are right, or both are wrong. Peirce's formula asks what proportion of the agreements
      are the first kind.</p>
    <div class="row">
      <div class="col col-5"><div class="control-panel" id="ex7-controls"></div></div>
      <div class="col col-7"><div id="ex7-plot"></div></div>
    </div>
    <div id="ex7-work"></div>
    <div class="note-block">The same quantity is built up cell by cell, out of a hundred squares, in the
      demonstration attached to the previous passage &mdash; open &ldquo;Suppose that we have two rules of
      inference&rdquo; above and switch to <em>Unknown Metal</em>. This panel is just the arithmetic.</div>
  </div>`);
  box.appendChild(content);

  const ctl = $("#ex7-controls", content);
  ctl.appendChild(slider("ex7_r", "First rule &mdash; correct in:", 0.5, 0.99, 0.81, 0.01, (v) => `${Math.round(v * 100)} of 100`));
  ctl.appendChild(slider("ex7_s", "Second rule &mdash; correct in:", 0.5, 0.99, 0.93, 0.01, (v) => `${Math.round(v * 100)} of 100`));
  ctl.appendChild(h(`<button class="btn btn-primary btn-sm" data-act="ex7reset">Reset to Peirce's 81 and 93</button>`));
  content.addEventListener("input", () => update());
  content.addEventListener("click", (ev) => {
    if (ev.target.closest('[data-act="ex7reset"]')) { setSlider("ex7_r", 0.81); setSlider("ex7_s", 0.93); update(); }
  });

  const canvas = mkCanvas(300, (pl) => {
    const r = num("ex7_r"), s = num("ex7_s");
    const both = r * s, neither = (1 - r) * (1 - s);
    const agree = both + neither;
    pl.setup({ xlim: [0, 1], ylim: [0, 3.2], mar: [3, 1, 3, 1] });
    pl.title("All questions, then only those where the rules agree", { cex: 1 });
    // bar 1: the whole population of questions
    const seg = (y0, y1, parts) => {
      let x = 0;
      parts.forEach((p) => {
        if (p.w <= 0) return;
        pl.rect(x, y0, x + p.w, y1, { col: p.col, border: "#333", lwd: 0.7 });
        if (p.w > 0.07) pl.text(x + p.w / 2, (y0 + y1) / 2, p.lab, { cex: 0.72, font: 2 });
        x += p.w;
      });
    };
    pl.text(0, 2.95, "Every question:", { adj: 0, cex: 0.85, font: 2 });
    seg(2.35, 2.85, [
      { w: both, col: "#90EE90", lab: `both right ${fmt(both * 100, 0)}` },
      { w: r * (1 - s), col: "#FFE4B5", lab: "1✓2✗" },
      { w: (1 - r) * s, col: "#FFD700", lab: "1✗2✓" },
      { w: neither, col: "#FFB6C1", lab: `both wrong ${fmt(neither * 100, 0)}` }]);
    pl.text(0, 1.75, "Discard the disagreements, and rescale:", { adj: 0, cex: 0.85, font: 2 });
    seg(1.15, 1.65, [
      { w: both / agree, col: "#90EE90", lab: `both right ${fmt(both / agree * 100, 1)}%` },
      { w: neither / agree, col: "#FFB6C1", lab: `both wrong ${fmt(neither / agree * 100, 1)}%` }]);
    pl.text(0.5, 0.55, `P(the shared answer is correct) = ${fmt(both / agree, 4)}`, { cex: 1.05, font: 2 });
    pl.text(0.5, 0.15, `The rules agree on ${fmt(agree * 100, 1)}% of questions.`, { cex: 0.85, col: "#555" });
  });
  $("#ex7-plot", content).appendChild(canvas);

  function update() {
    const r = num("ex7_r"), s = num("ex7_s");
    const R = Math.round(r * 100), S = Math.round(s * 100);
    const bothN = S * R, neitherN = (100 - S) * (100 - R);
    $("#ex7-work", content).innerHTML = `<div class="formula-box" style="text-align:left;font-size:1em;">
      <p style="margin-bottom:10px;">Both right: ${S} &times; ${R} = <strong>${bigmark(bothN)}</strong>
         &nbsp;&nbsp;&middot;&nbsp;&nbsp;
         Both wrong: ${100 - S} &times; ${100 - R} = <strong>${bigmark(neitherN)}</strong></p>
      <p style="margin-bottom:0;" class="math">
        ${frac(`${S} &times; ${R}`, `(${S} &times; ${R}) + (${100 - S} &times; ${100 - R})`)} =
        ${frac(bigmark(bothN), bigmark(bothN + neitherN))} = <strong>${fmt(bothN / (bothN + neitherN), 6)}</strong></p>
    </div>`;
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 8 — Chance: the ratio of favorable to unfavorable cases
   "a chance is a quantity which may have any magnitude, however great"
   ========================================================================*/
registerExample("example-ex8", (box) => {
  box.appendChild(exHeader("Interactive Example: Probability, Chance, and the Logarithm of the Chance", "ex8-content"));
  const content = h(`<div id="ex8-content" class="example-content">
    <p>Probability divides the favorable cases by <em>all</em> the cases, so it is trapped between 0 and 1.
      Chance divides them by the <em>unfavorable</em> cases instead, and so has no ceiling. The two rulers below
      carry the same events; drag the slider and watch how differently they are spaced.</p>
    <div class="control-panel" id="ex8-controls"></div>
    <div class="plot-container" id="ex8-plot"></div>
    <div id="ex8-readout"></div>
    <div class="table-scroll" id="ex8-table"></div>
    <div class="note-block">Three things are visible on the second ruler. Certainty is off the end of it &mdash;
      &ldquo;absolute certainty, or an infinite chance, can never be attained by mortals.&rdquo; An even chance
      sits at its origin, where the logarithm is 0, which is why such an argument &ldquo;can do nothing toward
      re&euml;nforcing others.&rdquo; And equal steps along it are equal <em>multiplications</em> of the chance,
      which is what makes belief add when chances multiply.</div>
  </div>`);
  box.appendChild(content);

  $("#ex8-controls", content).appendChild(
    slider("ex8_p", "Probability of the event:", 0.001, 0.999, 0.5, 0.001, (v) => v.toFixed(3)));
  const presets = h(`<div style="margin-top:6px;">
    <button class="btn btn-sm" data-p="0.5">even chance</button>
    <button class="btn btn-sm" data-p="0.667">2 to 1</button>
    <button class="btn btn-sm" data-p="0.9">9 to 1</button>
    <button class="btn btn-sm" data-p="0.99">99 to 1</button>
    <button class="btn btn-sm" data-p="0.999">999 to 1</button>
    <button class="btn btn-sm" data-p="0.1">1 to 9 against</button></div>`);
  $("#ex8-controls", content).appendChild(presets);
  content.addEventListener("input", () => update());
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-p]");
    if (b) { setSlider("ex8_p", +b.getAttribute("data-p")); update(); }
  });

  const LOGMAX = 3;   // rulers run from a chance of 1/1000 to 1000

  const canvas = mkCanvas(260, (pl) => {
    const p = num("ex8_p");
    const chance = p / (1 - p);
    const L = Math.log10(chance);
    pl.setup({ xlim: [0, 1], ylim: [0, 1], mar: [3, 1, 2, 1] });

    const rulerA = 0.74, rulerB = 0.30;
    const xa = (prob) => 0.06 + prob * 0.88;                       // probability ruler
    const xb = (l) => 0.06 + (l + LOGMAX) / (2 * LOGMAX) * 0.88;   // chance ruler (log spaced)

    // --- ruler A: probability, evenly divided
    pl.text(0.06, rulerA + 0.20, "Probability — favorable ÷ all cases", { adj: 0, cex: 0.85, font: 2 });
    pl.segments(xa(0), rulerA, xa(1), rulerA, { col: "#333", lwd: 2 });
    for (let i = 0; i <= 10; i++) {
      const v = i / 10;
      pl.segments(xa(v), rulerA, xa(v), rulerA - 0.035, { col: "#333" });
      if (i % 2 === 0 || i === 5) pl.text(xa(v), rulerA - 0.075, v === 0.5 ? "½" : String(v), { cex: 0.72 });
    }
    pl.text(xa(0), rulerA + 0.075, "impossible", { cex: 0.7, col: "#777" });
    pl.text(xa(1), rulerA + 0.075, "certain", { cex: 0.7, col: "#777" });

    // --- ruler B: chance, logarithmically spaced
    pl.text(0.06, rulerB + 0.20, "Chance — favorable ÷ unfavorable (equal steps are equal multiplications)",
      { adj: 0, cex: 0.85, font: 2 });
    pl.segments(xb(-LOGMAX), rulerB, xb(LOGMAX), rulerB, { col: "#333", lwd: 2 });
    for (let e = -LOGMAX; e <= LOGMAX; e++) {
      [1, 2, 5].forEach((m) => {
        const c = m * Math.pow(10, e);
        const l = Math.log10(c);
        if (l < -LOGMAX || l > LOGMAX) return;
        const major = (m === 1);
        pl.segments(xb(l), rulerB, xb(l), rulerB - (major ? 0.035 : 0.02), { col: "#333" });
        if (major) {
          const lab = c >= 1 ? `${bigmark(c)} : 1` : `1 : ${bigmark(1 / c)}`;
          pl.text(xb(l), rulerB - 0.075, lab, { cex: 0.66 });
          pl.text(xb(l), rulerB + 0.055, `log ${e}`, { cex: 0.62, col: "#777" });
        }
      });
    }
    pl.text(xb(-LOGMAX) - 0.005, rulerB, "←", { cex: 0.9, col: "#777", adj: 1 });
    pl.text(xb(LOGMAX) + 0.005, rulerB, "→ without limit", { cex: 0.7, col: "#777", adj: 0 });

    // --- the marker, linking the same event on both rulers
    const Lc = Math.max(-LOGMAX, Math.min(LOGMAX, L));
    const offScale = Math.abs(L) > LOGMAX;
    pl.segments(xa(p), rulerA, xb(Lc), rulerB, { col: "#2c7fb8", lwd: 1.5, lty: 2 });
    pl.points([xa(p)], [rulerA], { col: "#2c7fb8", cex: 1.8 });
    pl.points([xb(Lc)], [rulerB], { col: offScale ? "#c1523f" : "#2c7fb8", cex: 1.8 });
    if (offScale) pl.text(xb(Lc), rulerB - 0.14, "off the ruler", { cex: 0.7, col: "#c1523f", font: 2 });
  });
  $("#ex8-plot", content).appendChild(canvas);

  function oddsText(p) {
    const f = decimalToFraction(p);
    const u = f.den - f.num;
    if (u > 0 && f.num > 0) {
      const g = (a, b) => (b ? g(b, a % b) : a);
      const d = g(f.num, u);
      return `${bigmark(f.num / d)} : ${bigmark(u / d)}`;
    }
    return `${fmt(p / (1 - p), 3)} : 1`;
  }

  function update() {
    const p = num("ex8_p");
    const chance = p / (1 - p);
    $("#ex8-readout", content).innerHTML = `<div class="row">
      <div class="col col-4"><div class="formula-box" style="font-size:1em;">Probability<br>
        <strong style="font-size:1.3em;">${fmt(p, 4)}</strong></div></div>
      <div class="col col-4"><div class="formula-box" style="font-size:1em;">Chance<br>
        <strong style="font-size:1.3em;">${oddsText(p)}</strong><br>
        <span style="font-weight:400;font-size:0.85em;">= ${fmt(chance, 4)}</span></div></div>
      <div class="col col-4"><div class="formula-box" style="font-size:1em;">log&#8321;&#8320; chance<br>
        <strong style="font-size:1.3em;">${chance > 0 ? fmt(Math.log10(chance), 4) : "&minus;&infin;"}</strong></div></div>
    </div>`;

    const rows = [0.5, 2 / 3, 0.75, 0.9, 0.99, 0.999, 0.9999].map((v) => {
      const c = v / (1 - v);
      return `<tr><td>${fmt(v, 4)}</td><td>${fmt(c, 2)} : 1</td><td>${fmt(Math.log10(c), 3)}</td></tr>`;
    }).join("");
    $("#ex8-table", content).innerHTML = `<table class="tbl">
      <thead><tr><th>Probability</th><th>Chance</th><th>log₁₀ chance</th></tr></thead>
      <tbody>${rows}
      <tr style="background:#f1f3f5;"><td>1 (certainty)</td><td>&infin;</td><td>&infin;</td></tr></tbody></table>`;
    drawCanvas(canvas);
  }
  update();
});
</script>
