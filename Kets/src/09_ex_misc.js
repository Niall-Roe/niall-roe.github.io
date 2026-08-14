<script>
/* ==========================================================================
   Example 10: the Century Dictionary's "pound".
   Example 11: five towns, five standards (schematic).
   Example 13: what assuming a law of error buys — and which law matters.
   Example 15: forward to the theory of errors.
   ==========================================================================*/

registerExample("example-ex10", (box) => {
  box.appendChild(exHeader("The Century Dictionary's “pound”", "ex10-content"));
  box.appendChild(h(`<div id="ex10-content" class="example-content">
    <p>Peirce wrote over 5,000 entries for the <em>Century Dictionary</em>, and in 1884&ndash;85 was
      in charge of the Office of Weights and Measures of the United States. (Testifying to Congress
      in that capacity in 1885, he dissuaded the United States from adopting the meter as its
      standard, which he later recalled as a proud achievement.)
      <a href="../century-pound/">Here is the dictionary entry he wrote on the pound.</a>
      In it he draws on his own manuscript list of some three hundred
      local pounds, a list he says is kept at the Astor Library. Before the metric system, the
      pound was not unlike the ket: the pound of Amsterdam, of Cologne, of Toulouse, of Vienna were
      all different weights.</p>
  </div>`));
});

registerExample("example-ex11", (box) => {
  box.appendChild(exHeader("Five towns, five standards", "ex11-content"));
  const content = h(`<div id="ex11-content" class="example-content">
    <p>Here, Peirce is putting forth hypotheses that would explain the number of standards. He
      suggests they could reflect standard weights from five different towns. If each of five
      trading partners kept its own ket, as every European city kept its own pound, the heap of
      kets found in Naucratis' soil could have come from its trade partners (or perhaps four
      trade partners and a home standard). Here, the size of the circles reflects the number of kets
      supposed to come from that town, while its colour reflects the standard they were supposedly
      following. Standards that are so close as to be substantially merged reflect this with a
      mixed colour.</p>
    <div class="plot-container" id="ex11-mix"></div>
    <div class="plot-container" id="ex11-map"></div>
    <p class="note-block">Peirce does not consider the hypothesis Petrie later puts forward in
      <em>Ancient Weights and Measures</em> (1926, ch. vi &sect;32, pp. 14&ndash;15), that the
      standard itself changed over time: there Petrie reads the qedet's spread historically &mdash;
      Old Kingdom weights falling into two families near 144 and 149 grains, the families merged
      past tracing by the xviii<sup>th</sup> dynasty, and a late fixed standard of 140 at
      Heliopolis.</p>
  </div>`);
  box.appendChild(content);

  let stds = PEIRCE_STANDARDS.slice();
  const sd = PEIRCE_PE * PE_TO_SD;
  let wts = nearestCounts(KETS142, stds);
  /* how confusable each class is: one minus the average top responsibility of
     the kets it claims — 0 means cleanly separated, high means merged */
  const ambOf = () => stds.map((m, i) => {
    const mine = KETS142.filter((v) => {
      const r = responsibilities(v, stds, wts, sd);
      return r.indexOf(Math.max(...r)) === i;
    });
    if (!mine.length) return 0.5;
    return 1 - mine.reduce((a, v) => a + Math.max(...responsibilities(v, stds, wts, sd)), 0) / mine.length;
  });
  let amb = ambOf();

  const cvMix = mkCanvas(220, (pl, W, H) => {
    drawMixture(pl, W, H, { stds: stds.slice(), data: KETS142, pe: PEIRCE_PE, mixture: true,
      weights: wts, bigStd: true, xlim: [136, 153.5] });
  });
  $("#ex11-mix", content).appendChild(cvMix);
  attachDrag(cvMix,
    (x) => { let bi = null, bd = 0.7; stds.forEach((m, i) => { const d = Math.abs(x - m); if (d < bd) { bd = d; bi = i; } }); return bi; },
    (i, x) => {
      stds[i] = Math.max(136.2, Math.min(153.2, +x.toFixed(2)));
      wts = nearestCounts(KETS142, stds); amb = ambOf();
      drawCanvas(cvMix); drawCanvas(cvMap);
    });
  const cvMap = mkCanvas(300, (pl, W, H) => {
    const o = { towns: true, note: "schematic — the town-to-standard pairing is illustrative" };
    drawDeltaMap(pl, W, H, o);
    const TOWNS = ["Sais", "Memphis", "Tanis", "Bubastis", "Heliopolis"];
    TOWNS.forEach((t, i) => {
      const [x, y] = o.townDots[t];
      const r = 0.28 * Math.sqrt(wts[i] / 10);
      const c = pl.ctx, X = pl.X(x), Y = pl.Y(y);
      const pxr = Math.abs(pl.X(x + r) - X);
      c.save();
      /* the circle wears the blended colour under the curves at its own
         standard — merged standards show visibly mixed circles */
      c.fillStyle = mixCol(KCOL, responsibilities(stds[i], stds, wts, sd), 0.45);
      c.beginPath(); c.arc(X, Y, pxr, 0, 2 * Math.PI); c.fill();
      c.restore();
      pl.text(x, y + 0.55, wts[i] + " kets", { col: KCOL[i], cex: 0.75 });
    });
    stds.forEach((s, i) => {
      pl.text(0.55, 5.6 - i * 0.62, s.toFixed(2).replace(/\.?0+$/, "") + " grs.",
              { col: KCOL[i], cex: 0.85, adj: 0 });
    });
  });
  $("#ex11-map", content).appendChild(cvMap);
});

registerExample("example-ex13", (box) => {
  box.appendChild(exHeader("Interactive Example: The law of error", "ex13-content"));
  const CA = KCOL[1], CB = KCOL[2];
  const content = h(`<div id="ex13-content" class="example-content">
    <p>Peirce is assuming that the process of copying kets results in normally distributed errors.
      Later on, he discusses the legitimacy of this assumption; here he uses it at least in part for
      mathematical convenience. But notice that he has to make <em>some</em> assumption about the law
      of errors &mdash; without one, there is nothing to say about the origin of a given ket.</p>
    <div class="mode-tabs" id="ex13-laws">
      <button class="mode-tab active" data-l="gauss">probability curve</button>
      <button class="mode-tab" data-l="uniform">flat within a tolerance</button>
      <button class="mode-tab" data-l="cutR">smooth left, sharp cutoff right</button>
      <button class="mode-tab" data-l="beta">a beta law</button>
      <button class="mode-tab" data-l="none">assume nothing</button>
    </div>
    <div class="row"><div class="col col-4"></div>
      <div class="col col-3" id="ex13-arow" style="display:none"></div>
      <div class="col col-3" id="ex13-brow" style="display:none"></div>
      <div class="col col-2" style="align-self:center;">
        <button class="btn btn-sm btn-warning" id="ex13-demo">nearer, yet less likely</button></div></div>
    <div class="plot-container"></div>
    <div class="note-block" id="ex13-read"></div>
  </div>`);
  box.appendChild(content);
  let law = "gauss", q = 145.8;
  let A = 144.7, B = 146.95;
  const peCtl = ctlSlider("probable error (grains)", "k4", 0.2, 1.2, 0.025, PEIRCE_PE, (v) => v.toFixed(3));
  const aCtl = ctlSlider("beta &alpha;", "k2", 0.6, 8, 0.2, 2, (v) => v.toFixed(1));
  const bCtl = ctlSlider("beta &beta;", "k3", 0.6, 8, 0.2, 5, (v) => v.toFixed(1));
  $$(".col", content)[0].appendChild(peCtl.row);
  $("#ex13-arow", content).appendChild(aCtl.row);
  $("#ex13-brow", content).appendChild(bCtl.row);

  const LAWNAME = { gauss: "Gaussian", uniform: "flat-tolerance", cutR: "sharp-cutoff", beta: "Beta" };
  function dens(law, x, m, pe) {
    const sd = pe * PE_TO_SD;
    if (law === "gauss") return dnorm(x, m, sd);
    if (law === "uniform") { const a = 1.9 * pe; return Math.abs(x - m) <= a ? 1 / (2 * a) : 0; }
    if (law === "cutR") {
      const tau = 1.6 * pe, c = 0.5 * pe;
      if (x > m + c) return 0;
      const Z = tau; /* normalizer of exp((x-m-c)/tau) integrated to m+c */
      return Math.exp((x - m - c) / tau) / Z;
    }
    if (law === "beta") return lawDens("beta", x, m, pe, { a: aCtl.get(), b: bCtl.get() });
    return 0;
  }
  const cv = mkCanvas(280, (pl, W, H) => {
    const pe = peCtl.get();
    const xs = seqBy(141.8, 149.8, 0.02);
    const fA = xs.map((x) => 26 * dens(law === "none" ? "gauss" : law, x, A, pe));
    const fB = xs.map((x) => 23 * dens(law === "none" ? "gauss" : law, x, B, pe));
    const ymax = Math.max(...fA, ...fB, 1) * (law === "none" ? 1.6 : 1.18);
    pl.setup({ xlim: [141.8, 149.8], ylim: [0, ymax], mar: [3, 1.2, 0.8, 0.8] });
    pl.axes({ xat: seqBy(142, 149.5, 1), yat: [] });
    pl.axisLabels("grains", "");
    if (law !== "none") {
      /* gradient fills that keep to their own curves: the blend runs up to the
         lower curve; above it only the taller curve's own colour continues */
      for (let x = 141.8; x < 149.8; x += 0.05) {
        const dA = 26 * dens(law, x + 0.025, A, pe), dB = 23 * dens(law, x + 0.025, B, pe);
        if (dA + dB <= 0) continue;
        const lo = Math.min(dA, dB), hi = Math.max(dA, dB);
        if (lo > ymax * 0.003) pl.rect(x, 0, x + 0.05, lo, { col: mixCol([CA, CB], [dA, dB], 0.30), border: null });
        if (hi > lo) pl.rect(x, lo, x + 0.05, hi,
          { col: dA > dB ? "rgba(74,124,89,.22)" : "rgba(154,123,63,.24)", border: null });
      }
      pl.lines(xs, fA, { col: CA, lwd: 1.8 });
      pl.lines(xs, fB, { col: CB, lwd: 1.8 });
      /* the column the found ket activates: one probable error wide, saturated,
         and lit ONLY under curves of standards that could actually have thrown
         this ket — a standard with a zero wager keeps its whole curve unlit,
         however tall it stands over the column */
      const qA = 26 * dens(law, q, A, pe), qB = 23 * dens(law, q, B, pe);
      if (qA + qB > 0) {
        for (let x = q - pe / 2; x < q + pe / 2; x += 0.03) {
          const hA = qA > 0 ? 26 * dens(law, x + 0.015, A, pe) : 0;
          const hB = qB > 0 ? 23 * dens(law, x + 0.015, B, pe) : 0;
          if (hA <= 0 && hB <= 0) continue;
          const lo = Math.min(hA, hB), hi = Math.max(hA, hB);
          if (lo > 0) pl.rect(x, 0, x + 0.03, lo, { col: mixCol([CA, CB], [qA, qB], 0.85), border: null });
          if (hi > lo) pl.rect(x, lo, x + 0.03, hi,
            { col: hA > hB ? "rgba(74,124,89,.8)" : "rgba(154,123,63,.8)", border: null });
        }
      }
    }
    [[A, CA], [B, CB]].forEach(([m, c]) => {
      pl.segments(m, 0, m, ymax * 0.55, { col: c, lwd: 1, lty: 3 });
      drawKetGlyph(pl, m, 0, c, 8);
    });
    pl.segments(q, 0, q, ymax * 0.8, { col: PAL.ink, lwd: 1.5 });
    drawKetGlyph(pl, q, 0, PAL.ink, 8);
    pl.text(q, ymax * 0.86, q.toFixed(1) + " grs.", { col: PAL.ink, cex: 0.85 });
    const read = $("#ex13-read");
    if (!read) return;
    if (law === "none") {
      read.innerHTML = `With nothing assumed: the standards sit there, the ket sits there, and
        there is <strong>no proportion to report</strong> &mdash; not an unknown number, no number.
        Definiteness has to be bought, and some law of error is the coin.`;
    } else {
      const dA = 26 * dens(law, q, A, pe), dB = 23 * dens(law, q, B, pe);
      const pA = dA + dB > 0 ? dA / (dA + dB) : null;
      /* nearer, yet impossible: the ket sits closer to a standard whose law
         cannot have thrown it — recomputed as the ket and standards move */
      const nearA = Math.abs(q - A) < Math.abs(q - B);
      const nearVal = (nearA ? A : B).toFixed(1), nearCol = nearA ? CA : CB;
      const impossible = pA !== null && ((nearA && dA <= 0) || (!nearA && dB <= 0));
      read.innerHTML = pA === null
        ? `Under this law neither standard could have thrown a copy so far &mdash; a genuinely
           foreign ket.`
        : `Assuming a <strong>${LAWNAME[law]}${law === "beta" ? `(${aCtl.get().toFixed(1)}, ${bCtl.get().toFixed(1)})` : ""}</strong>
           law of error, and two standard kets (at
           <span style="color:${CA}">${A.toFixed(2)}</span> and <span style="color:${CB}">${B.toFixed(2)}</span> grains),
           we would wager that a newly found ket of ${q.toFixed(1)} grains came from the
           <span style="color:${CA}">${A.toFixed(2)} standard ${Math.round(pA * 100)}%</span> of the time, and
           from the <span style="color:${CB}">${B.toFixed(2)} standard ${Math.round(100 - pA * 100)}%</span>.${
           impossible
             ? ` This ket sits nearer the <span style="color:${nearCol}">${nearVal}</span> standard,
                yet under this law ${nearVal} cannot have thrown it.`
             : ""}`;
    }
  });
  $(".plot-container", content).appendChild(cv);
  /* the ket and both standards are draggable */
  attachDrag(cv,
    (x) => {
      const marks = [q, A, B];
      let bi = 0, bd = Math.abs(x - q);
      marks.forEach((m, i) => { const d = Math.abs(x - m); if (d < bd) { bd = d; bi = i; } });
      return bd < 0.9 ? bi : null;
    },
    (i, x) => {
      const v = Math.max(142.0, Math.min(149.5, x));
      if (i === 0) q = v;
      else if (i === 1) A = +v.toFixed(2);
      else B = +v.toFixed(2);
      drawCanvas(cv);
    });
  [peCtl, aCtl, bCtl].forEach((c) => c.input.addEventListener("input", () => drawCanvas(cv)));
  $$("#ex13-laws .mode-tab", content).forEach((b) => b.addEventListener("click", () => {
    $$("#ex13-laws .mode-tab", content).forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); law = b.dataset.l;
    $("#ex13-arow", content).style.display = $("#ex13-brow", content).style.display =
      law === "beta" ? "" : "none";
    drawCanvas(cv);
  }));
  $("#ex13-demo", content).addEventListener("click", () => {
    law = "cutR"; q = Math.min(A, B) + 0.9 * peCtl.get();
    $$("#ex13-laws .mode-tab", content).forEach((x) => x.classList.toggle("active", x.dataset.l === "cutR"));
    $("#ex13-arow", content).style.display = $("#ex13-brow", content).style.display = "none";
    drawCanvas(cv);
  });
});

registerExample("example-ex15", (box) => {
  box.appendChild(exHeader("Forward: the theory of errors", "ex15-content"));
  box.appendChild(h(`<div id="ex15-content" class="example-content">
    <p>&ldquo;The theory of errors is a part of mathematical statistics and deals with the
      following facts. Given the results of measurements carried out in a laboratory, we require
      statements about the &lsquo;true&rsquo; value of the measured quantity and a prediction of
      the accuracy of the measurements.&rdquo;
      (<a href="https://link.springer.com/chapter/10.1007/978-3-662-66068-3_22" target="_blank"
      rel="noopener">Weltner et al. 2023</a>)</p>
    <p class="click-info">Peirce wrote a paper on exactly this thirty years before this passage, and
      an interactive edition of it is on this site:
      <a href="../Theory-of-Errors-of-Observation/">On the Theory of Errors of Observation
      (1873)</a>.</p>
  </div>`));
});
</script>
