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
      standard &mdash; something he later recalled as a proud achievement.) Here is the dictionary
      entry he wrote on the pound. In it he draws on his own manuscript list of some three hundred
      local pounds, the list he says is kept at the Astor Library. Before the metric system, the
      pound was not unlike the ket: the pound of Amsterdam, of Cologne, of Toulouse, of Vienna were
      all different weights.</p>
    <p class="click-info">The article, in facsimile:
      <a href="../century-pound/">The Century Dictionary &mdash; &ldquo;pound&rdquo;</a>
      (pages 4657&ndash;4658, with the tables of local pounds).</p>
  </div>`));
});

registerExample("example-ex11", (box) => {
  box.appendChild(exHeader("Five towns, five standards", "ex11-content"));
  const content = h(`<div id="ex11-content" class="example-content">
    <p>Naucratis was the licensed port of trade where Greek merchants met the Egyptian interior.
      Weights travel with trade: if each trading partner kept its own civic ket, as every European
      city kept its own pound, the heaps in Naucratis' soil are the standards of its correspondents,
      shuffled together. Above, the heaps; below, the towns wearing them &mdash; each circle sized by
      how many of the 142 kets its standard claims, and greyed by how deeply its class merges into
      its neighbours'.</p>
    <div class="plot-container" id="ex11-mix"></div>
    <div class="plot-container" id="ex11-map"></div>
    <p class="note-block">The towns are real; the assignment of standards to towns is illustrative
      only &mdash; Peirce says <em>probable</em>, and neither he nor Petrie names the five.</p>
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
      c.fillStyle = mixCol([KCOL[i], "#8a9099"], [1 - amb[i] * 1.6, amb[i] * 1.6], 0.35);
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
  const A = 144.7, B = 146.95, CA = KCOL[1], CB = KCOL[2];
  const content = h(`<div id="ex13-content" class="example-content">
    <p>Peirce is assuming that the process of copying kets results in normally distributed errors.
      Later on, he discusses the legitimacy of this assumption; here he uses it at least in part for
      mathematical convenience. But notice that he has to make <em>some</em> assumption about the law
      of errors &mdash; without one, there is nothing to say about the origin of a given ket.</p>
    <div class="mode-tabs" id="ex13-laws">
      <button class="mode-tab active" data-l="gauss">probability curve</button>
      <button class="mode-tab" data-l="uniform">flat within a tolerance</button>
      <button class="mode-tab" data-l="cutR">smooth left, sharp cutoff right</button>
      <button class="mode-tab" data-l="none">assume nothing</button>
    </div>
    <div class="row"><div class="col col-6"></div>
      <div class="col col-6" style="align-self:center;">
        <button class="btn btn-warning" id="ex13-demo">nearer, yet less likely</button>
        <button class="btn btn-success" id="ex13-ask">ask the data which law</button></div></div>
    <div class="plot-container"></div>
    <div class="result-box" id="ex13-read"></div>
    <div class="note-block" id="ex13-ans" style="display:none"></div>
  </div>`);
  box.appendChild(content);
  let law = "gauss", q = 145.8;
  const peCtl = ctlSlider("probable error (grains)", "k4", 0.2, 1.2, 0.025, PEIRCE_PE, (v) => v.toFixed(3));
  $$(".col", content)[0].appendChild(peCtl.row);

  const LAWNAME = { gauss: "Gaussian", uniform: "flat-tolerance", cutR: "sharp-cutoff" };
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
      /* the colour climbs the curves: each sliver under the taller curve is
         filled with the blend of who would own a ket found there */
      for (let x = 141.8; x < 149.8; x += 0.05) {
        const dA = 26 * dens(law, x + 0.025, A, pe), dB = 23 * dens(law, x + 0.025, B, pe);
        const hgt = Math.max(dA, dB);
        if (dA + dB <= 0 || hgt < ymax * 0.004) continue;
        pl.rect(x, 0, x + 0.05, hgt, { col: mixCol([CA, CB], [dA, dB], 0.30), border: null });
      }
      pl.lines(xs, fA, { col: CA, lwd: 1.8 });
      pl.lines(xs, fB, { col: CB, lwd: 1.8 });
      /* the column the found ket activates: one probable error wide, saturated,
         clipped to the curves, and coloured throughout by the wager at the ket
         itself — a 0% wager shows no trace of that standard's colour */
      const qA = 26 * dens(law, q, A, pe), qB = 23 * dens(law, q, B, pe);
      if (qA + qB > 0) {
        const colQ = mixCol([CA, CB], [qA, qB], 0.85);
        for (let x = q - pe / 2; x < q + pe / 2; x += 0.03) {
          const hgt = Math.max(26 * dens(law, x + 0.015, A, pe), 23 * dens(law, x + 0.015, B, pe));
          if (hgt <= 0) continue;
          pl.rect(x, 0, x + 0.03, hgt, { col: colQ, border: null });
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
      read.innerHTML = `<p>With nothing assumed: the standards sit there, the ket sits there, and
        there is <strong>no proportion to report</strong> &mdash; not an unknown number, no number.
        Definiteness has to be bought, and some law of error is the coin.</p>`;
    } else {
      const dA = 26 * dens(law, q, A, peCtl.get()), dB = 23 * dens(law, q, B, peCtl.get());
      const pA = dA + dB > 0 ? dA / (dA + dB) : null;
      read.innerHTML = pA === null
        ? `<p>Under this law neither standard could have thrown a copy so far &mdash; a genuinely
           foreign ket.</p>`
        : `<p>Assuming a <strong>${LAWNAME[law]}</strong> law of error, and two standard kets (at
           <span style="color:${CA}">144.7</span> and <span style="color:${CB}">146.95</span> grains),
           we would wager that a newly found ket of ${q.toFixed(1)} grains came from the
           <span style="color:${CA}">144.7 standard ${Math.round(pA * 100)}%</span> of the time, and
           from the <span style="color:${CB}">146.95 standard ${Math.round(100 - pA * 100)}%</span>.
           ${law === "cutR" && q > A + 0.5 * peCtl.get() && pA < 0.5
             ? "This ket sits nearer the 144.7 standard, yet under a law that cuts off sharply just above each standard, 144.7 cannot have thrown it."
             : "Drag the black ket, change the law, and watch the wager move."}</p>`;
    }
  });
  $(".plot-container", content).appendChild(cv);
  attachDrag(cv, () => 0, (i, x) => { q = Math.max(142.0, Math.min(149.5, x)); drawCanvas(cv); });
  peCtl.input.addEventListener("input", () => drawCanvas(cv));
  $$("#ex13-laws .mode-tab", content).forEach((b) => b.addEventListener("click", () => {
    $$("#ex13-laws .mode-tab", content).forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); law = b.dataset.l; drawCanvas(cv);
  }));
  $("#ex13-ask", content).addEventListener("click", () => {
    /* the second half of Peirce's remark, made quantitative: score each law on
       the real 142 kets about his five standards, by log-likelihood */
    const stds = PEIRCE_STANDARDS, wts = nearestCounts(KETS142, stds);
    const tot = wts.reduce((a, b) => a + b, 0);
    const score = (lw) => {
      let ll = 0;
      KETS142.forEach((v) => {
        let d = 0;
        stds.forEach((m, i) => { d += (wts[i] / tot) * lawDens(lw, v, m, peCtl.get()); });
        ll += Math.log(Math.max(d, 1e-12));
      });
      return ll;
    };
    const rows = [["gauss", "probability curve"], ["uniform", "flat tolerance"], ["cutR", "sharp cutoff right"]]
      .map(([k, lab]) => [lab, score(k)]);
    const best = Math.max(...rows.map((r) => r[1]));
    const el = $("#ex13-ans", content);
    el.style.display = "";
    el.innerHTML = `Log-likelihood of the 142 kets about Peirce's five standards, per law:
      ${rows.map(([lab, ll]) => `<br>&nbsp;&nbsp;${lab}: <span style="font-variant-numeric:tabular-nums">${ll.toFixed(1)}</span>${ll === best ? " (best)" : ""}`).join("")}
      <br>The margins are a handful of log-units on 142 weights &mdash; the sort of difference a
      different cut of the data could reverse. This is Peirce's &ldquo;insufficient,
      apparently&rdquo; made quantitative: the data lean, but they do not decide.`;
  });
  $("#ex13-demo", content).addEventListener("click", () => {
    law = "cutR"; q = A + 0.9 * peCtl.get();
    $$("#ex13-laws .mode-tab", content).forEach((x) => x.classList.toggle("active", x.dataset.l === "cutR"));
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
