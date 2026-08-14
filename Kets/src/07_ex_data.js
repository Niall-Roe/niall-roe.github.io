<script>
/* ==========================================================================
   Example 7: Peirce's no-gap check, walked through on the data.
   Example 8: how near the true theory? — and what the 1926 register says.
   ==========================================================================*/

registerExample("example-ex7", (box) => {
  box.appendChild(exHeader("Interactive Example: Walking Peirce's check", "ex7-content"));
  const vals = Array.from(new Set(KETS142.filter((v) => v <= 151.3))).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < vals.length; i++)
    if (vals[i] - vals[i - 1] > 1 / 3 + 1e-9) gaps.push([vals[i - 1], vals[i]]);
  const content = h(`<div id="ex7-content" class="example-content">
    <p>His arithmetic first: the interval runs from 136.8 to 151.3 grains, and
      <span class="math">151.3 &minus; 136.8 = 14.5</span> &mdash; <em>fourteen and one-half grains</em>,
      exactly as he says. Then the check itself: lay every distinct ket value on the axis and measure
      the spaces between neighbours. If a stretch wider than a third of a grain held no weight at all,
      the values would be clumping &mdash; evidence of separate standards with empty country between
      them. <span class="click-cue">Drag the ruler</span> to measure any neighbourhood yourself.</p>
    <div class="plot-container"></div>
    <p class="ex7-work-line" id="ex7-read"></p>
    <p class="help-text" style="margin:8px 0 2px 0">The page where this arithmetic was first worked
      (MS 427, First Attempt): the interval subtractions in the margin, and the tally running down
      the sheet &mdash; the first-attempt example below walks the whole page.</p>
    <p style="text-align:center"><img src="${IMG_FA_PE}" alt="MS 427 First Attempt: the interval and probable-error working"
      style="max-width:88%;border:1px solid var(--rule);"></p>
    <div class="note-block">Against the printed table the claim does not quite hold:
      <strong>${gaps.length} intervals wider than a third of a grain</strong> are unrepresented
      &mdash; ${gaps.map((g) => `${g[0]}&rarr;${g[1]}`).join(", ")} &mdash; each 0.4 or 0.5 grains.
      They are marked in red. Peirce read his intervals off a hand-drawn diagram; a third of a grain
      against four-tenths is not a distinction that survives a pen drawing. The lesson of the check
      is untouched: the values carpet the interval far too evenly for one standard.</div>
  </div>`);
  box.appendChild(content);

  let ruler = 143.0;
  const cv = mkCanvas(210, (pl, W, H) => {
    pl.setup({ xlim: [136.3, 152], ylim: [0, 3], mar: [3, 0.6, 0.6, 0.6] });
    pl.axes({ xat: seqBy(137, 152, 1), yat: [] });
    pl.axisLabels("grains", "");
    pl.abline({ h: 1, col: PAL.inkFaint, lwd: 1 });
    gaps.forEach((g) => pl.rect(g[0], 0.86, g[1], 1.14, { col: "rgba(176,86,63,.25)", border: PAL.accent2 }));
    vals.forEach((v) => pl.segments(v, 0.72, v, 1.28, { col: PAL.accent, lwd: 1.2 }));
    /* the third-of-a-grain ruler */
    pl.rect(ruler, 1.7, ruler + 1 / 3, 2.05, { col: "rgba(154,123,63,.30)", border: PAL.accent4 });
    pl.text(ruler + 1 / 6, 2.35, "⅓ grain", { col: PAL.accent4, cex: 0.85 });
    const inside = vals.filter((v) => v > ruler + 1e-9 && v < ruler + 1 / 3 - 1e-9).length;
    const read = $("#ex7-read");
    if (read) read.innerHTML = `Ruler at <strong>${ruler.toFixed(2)}&ndash;${(ruler + 1 / 3).toFixed(2)}</strong> grains:
      <strong style="color:${inside ? PAL.accent3 : PAL.accent2}">${inside || "no"}</strong>
      weight${inside === 1 ? "" : "s"} strictly inside.`;
  });
  $(".plot-container", content).appendChild(cv);
  attachDrag(cv, (x) => (Math.abs(x - (ruler + 1 / 6)) < 1.2 ? 0 : 0),
    (i, x) => { ruler = Math.max(136.4, Math.min(151.6, x - 1 / 6)); drawCanvas(cv); });
});

registerExample("example-ex8", (box) => {
  box.appendChild(exHeader("Interactive Example: Asking a bigger dataset", "ex8-content"));
  const content = h(`<div id="ex8-content" class="example-content">
    <p>Peirce suspected the data were insufficient to decide how near his theory came to the truth.
      Forty years after Naucratis, Petrie catalogued the qedet again &mdash; <em>Ancient Weights and
      Measures</em> (1926) registers <strong>821 stone qedets</strong> from all over Egypt against
      the 142 Naucratis weights Peirce had.</p>
    <div class="mode-tabs">
      <button class="mode-tab active" data-set="naucratis">Naucratis, 1885 (n = 142)</button>
      <button class="mode-tab" data-set="register">all Egypt, 1926 (n = 821)</button>
      <button class="mode-tab" data-set="both">both, summed (n = 963)</button>
    </div>
    <div class="row"><div class="col col-6"></div><div class="col col-6"></div></div>
    <div class="ex-buttonbar">
      <button class="btn btn-success" id="ex8-fit">best fit for this many standards</button>
      <button class="btn btn-success" id="ex8-best">best fit over all</button>
      <button class="btn" id="ex8-peirce">Peirce's five</button>
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex8-fixsd" checked> hold the spread at &#8541; grain</label></label>
    </div>
    <div class="plot-container"></div>
    <div class="result-box" id="ex8-read"></div>
  </div>`);
  box.appendChild(content);

  let mode = "naucratis";
  let stds = PEIRCE_STANDARDS.slice();
  const kCtl = ctlSlider("number of standards", "k1", 1, 6, 1, 5);
  const peCtl = ctlSlider("probable error (grains)", "k4", 0.2, 1.5, 0.025, PEIRCE_PE,
                          (v) => v.toFixed(3));
  $$(".col", content)[0].appendChild(kCtl.row);
  $$(".col", content)[1].appendChild(peCtl.row);
  const COMBINED = KETS142.concat(QEDET1926);
  const dataOf = () => (mode === "register" ? QEDET1926 : mode === "both" ? COMBINED : KETS142);

  const cv = mkCanvas(340, (pl, W, H) => {
    const xlim = [135, 154];
    if (mode === "both") {
      /* one summed heap: the 1885 counts added onto the 1926 counts bin by
         bin, the bars wearing the gradient, the 1885 portion a shade darker
         at the base of each bar */
      const c142 = histCounts(KETS142, BIN_0, xlim[1], BIN_W);
      const c1926 = histCounts(QEDET1926, BIN_0, xlim[1], BIN_W);
      const counts = c142.map((n, i) => n + c1926[i]);
      const sd8 = peCtl.get() * PE_TO_SD;
      const wts = nearestCounts(COMBINED, stds);
      const ymax = Math.max(...counts, 4) * 1.2;
      pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
      pl.axes({ xat: seqBy(136, 154, 2), yat: pretty0(ymax) });
      pl.axisLabels("grains (value of one qedet)", "weights per half-grain");
      counts.forEach((n, i) => {
        if (!n) return;
        const x0 = BIN_0 + i * BIN_W;
        const r = responsibilities(x0 + BIN_W / 2, stds, wts, sd8);
        if (c142[i]) pl.rect(x0, 0, x0 + BIN_W, c142[i], { col: mixCol(KCOL, r, 0.75), border: PAL.paper });
        if (c1926[i]) pl.rect(x0, c142[i], x0 + BIN_W, n, { col: mixCol(KCOL, r, 0.4), border: PAL.paper });
      });
      const dc = dataCurve(COMBINED, xlim, 1);
      pl.lines(dc.xs, dc.ys, { col: PAL.ink, lwd: 2.2 });
      const xs8 = seqBy(xlim[0], xlim[1], 0.05);
      stds.forEach((m, i) => pl.lines(xs8, xs8.map((x) => wts[i] * BIN_W * dnorm(x, m, sd8)),
               { col: KCOL[i % KCOL.length], lwd: 1.6 }));
      pl.lines(xs8, xs8.map((x) => stds.reduce((a, m, i) => a + wts[i] * BIN_W * dnorm(x, m, sd8), 0)),
               { col: PAL.accent2, lwd: 1.8, lty: 2 });
      stds.forEach((m, i) => { pl.segments(m, 0, m, ymax * 0.9, { col: KCOL[i % KCOL.length], lwd: 1.3, lty: 3 }); drawKetGlyph(pl, m, 0, KCOL[i % KCOL.length], 8); });
    } else {
      drawMixture(pl, W, H, { stds, data: dataOf(), pe: peCtl.get(), mixture: true,
        weights: nearestCounts(dataOf(), stds), bigStd: true, xlim });
      /* the data's own curve, to hold the model's sum against */
      const dc = dataCurve(dataOf(), xlim, 1);
      pl.lines(dc.xs, dc.ys, { col: PAL.ink, lwd: 1.8 });
    }
    const read = $("#ex8-read");
    if (read) read.style.display = mode === "both" ? "none" : "";
    if (read) read.innerHTML = mode === "register"
      ? `<p>There do appear to be five peaks, and fitting five standards to the register finds them
         at <span style="font-variant-numeric:tabular-nums">139.1 / 141.9 / 144.6 / 147.1 / 150.4</span>
         grains &mdash; within a fraction of a grain of Peirce's five, only the heaviest drifting
         upward. The classes are looser here (the fitted probable error is near 0.73 grains against
         his &#8541;), which is what piling many towns and centuries together does. What the extra
         data still cannot settle is the <em>number</em>: by the information criterion four broad
         standards cover the heap slightly better than five, the margin two or three units, and
         seven follow the bin noise and are charged for it. Press <em>best fit over all</em> to
         watch the criterion choose.</p>`
      : mode === "naucratis"
      ? `<p>The one-town hoard: clumping visible, and five standards fit it comfortably. Drag the
         domes or press best-fit and compare with Peirce's five.</p>`
      : "";
  });
  $(".plot-container", content).appendChild(cv);

  attachDrag(cv,
    (x) => { let bi = null, bd = 0.7; stds.forEach((m, i) => { const d = Math.abs(x - m); if (d < bd) { bd = d; bi = i; } }); return bi; },
    (i, x) => { stds[i] = Math.max(135.2, Math.min(153.8, +x.toFixed(2))); drawCanvas(cv); });

  function reseed(k) {
    stds = (k === 5) ? PEIRCE_STANDARDS.slice()
      : Array.from({ length: k }, (_, i) => +(138 + (i + 0.5) * 13 / k).toFixed(1));
  }
  kCtl.input.addEventListener("input", () => { reseed(kCtl.get()); drawCanvas(cv); });
  peCtl.input.addEventListener("input", () => drawCanvas(cv));
  $("#ex8-fit", content).addEventListener("click", () => {
    const fixed = $("#ex8-fixsd", content).checked;
    const fit = emFit(dataOf(), stds.length, { init: stds, sd: fixed ? peCtl.get() * PE_TO_SD : null });
    stds = fit.mu.slice();
    if (!fixed) { peCtl.input.value = (fit.sd * 0.6745).toFixed(3); peCtl.input.dispatchEvent(new Event("input")); }
    drawCanvas(cv);
  });
  $("#ex8-best", content).addEventListener("click", () => {
    /* the real best fit under the current assumptions: every number of
       standards from one to six is fitted and scored by BIC (as in the
       elaborate-calculations example), and the winner is installed */
    const vals = dataOf();
    const fixed = $("#ex8-fixsd", content).checked;
    let best = null;
    for (let k = 1; k <= 6; k++) {
      const f = emFit(vals, k, { sd: fixed ? peCtl.get() * PE_TO_SD : null });
      let ll = 0;
      vals.forEach((v) => {
        let d = 0;
        f.mu.forEach((m, i) => { d += f.w[i] * dnorm(v, m, f.sd); });
        ll += Math.log(Math.max(d, 1e-12));
      });
      const bic = -2 * ll + 2 * k * Math.log(vals.length);
      if (!best || bic < best.bic) best = { k, f, bic };
    }
    stds = best.f.mu.slice();
    kCtl.input.value = best.k; kCtl.input.dispatchEvent(new Event("input"));
    stds = best.f.mu.slice();
    if (!fixed) { peCtl.input.value = Math.max(0.2, Math.min(1.5, +(best.f.sd * 0.6745).toFixed(3))); peCtl.input.dispatchEvent(new Event("input")); }
    drawCanvas(cv);
  });
  $("#ex8-peirce", content).addEventListener("click", () => {
    stds = PEIRCE_STANDARDS.slice();
    kCtl.input.value = 5; kCtl.input.dispatchEvent(new Event("input"));
    stds = PEIRCE_STANDARDS.slice(); drawCanvas(cv);
  });
  $$(".mode-tab", content).forEach((b) => b.addEventListener("click", () => {
    $$(".mode-tab", content).forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); mode = b.dataset.set; drawCanvas(cv);
  }));
});
</script>
