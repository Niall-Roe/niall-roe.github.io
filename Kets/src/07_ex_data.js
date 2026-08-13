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
      the 142 Naucratis weights Peirce had. The same machinery runs on either: set the number of
      standards, fit them, and see whether the extra data sharpens or dissolves the five.</p>
    <div class="mode-tabs">
      <button class="mode-tab active" data-set="naucratis">Naucratis, 1885 (n = 142)</button>
      <button class="mode-tab" data-set="register">all Egypt, 1926 (n = 821)</button>
      <button class="mode-tab" data-set="both">both, rescaled</button>
      <button class="mode-tab" data-set="all">every standard at Naucratis</button>
    </div>
    <div class="row"><div class="col col-6"></div><div class="col col-6"></div></div>
    <div class="ex-buttonbar">
      <button class="btn btn-success" id="ex8-fit">best fit for this many standards</button>
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
  const dataOf = () => (mode === "register" ? QEDET1926 : KETS142);

  const cv = mkCanvas(340, (pl, W, H) => {
    const xlim = [135, 154];
    if (mode === "all") {
      /* the widest view: all 514 Naukratis units, every standard, on one axis.
         The ket is one clump in a landscape of clumps — each standard another
         natural class, merging at its own edges. (Non-ket rows are from the
         rough transcription and are unverified; two standards lie off this
         axis, the Phoenician shekel near 220 grains and the Roman uncia near
         410.) */
      const alim = [40, 160];
      const bins = {};
      ALLUNITS.forEach(([u, si]) => {
        if (u < alim[0] || u > alim[1]) return;
        const b = Math.floor((u - alim[0]) / BIN_W);
        (bins[b] = bins[b] || []).push(si);
      });
      let ymax = 4;
      Object.values(bins).forEach((arr) => { ymax = Math.max(ymax, arr.length); });
      ymax *= 1.25;
      pl.setup({ xlim: alim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
      pl.axes({ xat: seqBy(40, 160, 20), yat: pretty0(ymax) });
      pl.axisLabels("grains (value of one unit)", "weights per half-grain");
      Object.entries(bins).forEach(([b, arr]) => {
        const x0 = alim[0] + (+b) * BIN_W;
        arr.sort();
        arr.forEach((si, y) => pl.rect(x0, y, x0 + BIN_W, y + 1,
          { col: KTINT[si % KTINT.length], border: PAL.paper }));
      });
      const seen = Array.from(new Set(ALLUNITS.filter(([u]) => u >= alim[0] && u <= alim[1]).map(([, si]) => si))).sort();
      pl.legend("topleft", { legend: seen.map((si) => ALLNAMES[si]),
        fill: seen.map((si) => KTINT[si % KTINT.length]), cex: 0.72 });
      const read = $("#ex8-read");
      if (read) read.innerHTML = `<p>The rest of Petrie's table: every standard at Naucratis on one
        axis (the Phoenician shekel near 220 grains and the Roman uncia near 410 lie beyond it).
        The ket is one clump among many &mdash; each standard its own natural class, with its own
        middling form, and each merging into its neighbours exactly as Peirce says such classes do.
        The non-ket rows are from the earlier rough transcription and have not had the ket rows'
        verification.</p>`;
      return;
    }
    if (mode === "both") {
      const c142 = histCounts(KETS142, BIN_0, xlim[1], BIN_W);
      const c1926 = histCounts(QEDET1926, BIN_0, xlim[1], BIN_W);
      const scale = Math.max(...c142) / Math.max(...c1926);
      const ymax = Math.max(...c142) * 1.25;
      pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
      pl.axes({ xat: seqBy(136, 154, 2), yat: pretty0(ymax) });
      pl.axisLabels("grains (value of one qedet)", "weights per half-grain (1926 rescaled)");
      c1926.forEach((n, i) => { if (n) pl.rect(BIN_0 + i * BIN_W, 0, BIN_0 + (i + 1) * BIN_W, n * scale, { col: "rgba(154,123,63,.30)", border: PAL.paper }); });
      c142.forEach((n, i) => { if (n) pl.rect(BIN_0 + i * BIN_W, 0, BIN_0 + (i + 1) * BIN_W, n, { col: "rgba(47,111,159,.38)", border: PAL.paper }); });
      /* each dataset's own smoothed curve, and the model sum against either */
      const dcA = dataCurve(KETS142, xlim, 1), dcB = dataCurve(QEDET1926, xlim, 1);
      pl.lines(dcA.xs, dcA.ys, { col: PAL.accent, lwd: 1.8 });
      pl.lines(dcB.xs, dcB.ys.map((y) => y * scale), { col: PAL.accent4, lwd: 1.8 });
      const sd8 = peCtl.get() * PE_TO_SD, wA = nearestCounts(KETS142, stds);
      const xs8 = seqBy(xlim[0], xlim[1], 0.05);
      stds.forEach((m, i) => pl.lines(xs8, xs8.map((x) => wA[i] * BIN_W * dnorm(x, m, sd8)),
               { col: KCOL[i % KCOL.length], lwd: 1.4 }));
      pl.lines(xs8, xs8.map((x) => stds.reduce((a, m, i) => a + wA[i] * BIN_W * dnorm(x, m, sd8), 0)),
               { col: PAL.ink, lwd: 1.2, lty: 2 });
      stds.forEach((m, i) => { pl.segments(m, 0, m, ymax * 0.9, { col: KCOL[i % KCOL.length], lwd: 1.3, lty: 3 }); drawKetGlyph(pl, m, 0, KCOL[i % KCOL.length], 7); });
      pl.legend("topright", { legend: ["Naucratis 1885", "all Egypt 1926"],
        fill: ["rgba(47,111,159,.5)", "rgba(154,123,63,.45)"] });
    } else {
      drawMixture(pl, W, H, { stds, data: dataOf(), pe: peCtl.get(), mixture: true,
        weights: nearestCounts(dataOf(), stds), bigStd: true, xlim });
      /* the data's own curve, to hold the model's sum against */
      const dc = dataCurve(dataOf(), xlim, 1);
      pl.lines(dc.xs, dc.ys, { col: PAL.ink, lwd: 1.8 });
    }
    const read = $("#ex8-read");
    if (read) read.innerHTML = mode === "register"
      ? `<p>The all-Egypt register is a broad single mound near 140&ndash;141 grains: weights from
         many towns and centuries piled together until the classes merge past recovery. Fit five
         standards to it and they crowd the middle instead of finding Peirce's five &mdash; his
         caution about what more data would show was well placed, though this register is a wider
         population, not a re-survey of Naucratis.</p>`
      : mode === "naucratis"
      ? `<p>The one-town hoard: clumping visible, and five standards fit it comfortably. Drag the
         domes or press best-fit and compare with Peirce's five.</p>`
      : `<p>Both at once, the 1926 register rescaled to comparable height.</p>`;
  });
  $(".plot-container", content).appendChild(cv);

  attachDrag(cv,
    (x) => { if (mode === "both") return null; let bi = null, bd = 0.7; stds.forEach((m, i) => { const d = Math.abs(x - m); if (d < bd) { bd = d; bi = i; } }); return bi; },
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
