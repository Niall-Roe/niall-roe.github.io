<script>
/* ==========================================================================
   Example 17: the first attempt — how Peirce cleaned, tallied, smoothed and
   separated the data by hand (MS 427, First Attempt, pp. II 17-19,
   dated 22 February 1902 — "Washington's birthday" in the margin).
   ==========================================================================*/

/* His half-grain buckets from 136.7, with: his count, the verified table's
   count, his Smoothed value (from II 18; null where the page gives none), and
   his Separated split between neighbouring standards. */
const FA = [
  /* rows 136.7-141.6: counts and Smoothed from the earlier draft's ruled table
     (the page whose heading states the 0.7 + 0.3 rule); it separates only the
     last of them, 4.6 = 4.2 + 0.4 */
  [136.7, 1, 1, 0.7, [0.7]], [137.2, 2, 2, 1.7, [1.7]], [137.7, 4, 4, 3.4, [3.4]],
  [138.2, 4, 4, 4.0, [4.0]], [138.7, 7, 7, 6.1, [6.1]], [139.2, 6, 6, 6.3, [6.3]],
  [139.7, 11, 11, 9.5, [9.5]], [140.2, 4, 4, 6.1, [6.1]], [140.7, 6, 6, 5.4, [5.4]],
  [141.2, 4, 4, 4.6, [4.2, 0.4]],
  [141.7, 6, 6, 5.4, [2.7, 2.7]], [142.2, 6, 5, 6.0, [2.0, 4.0]],
  [142.7, 9, 9, 8.1, [0.7, 7.4]], [143.2, 3, 3, 4.8, [3.7, 1.1]],
  [143.7, 7, 7, 5.8, [3.0, 2.8]], [144.2, 4, 4, 4.9, [0.4, 4.5]],
  [144.7, 12, 12, 9.6, [9.6]], [145.2, 7, 7, 8.5, [8.5]],
  [145.7, 5, 5, 5.6, [1.0, 4.6]], [146.2, 5, 5, 5.0, [2.4, 2.6]],
  [146.7, 4, 4, 4.3, null],
  [147.2, 5, 5, 4.7, [4.7]], [147.7, 7, 7, 6.4, [6.4]], [148.2, 5, 5, 5.6, [5.6]],
  [148.7, 8, 8, 7.1, [7.1]], [149.2, 2, 2, 3.8, [3.8]], [149.7, 6, 6, 4.8, [4.8]],
  [150.2, 4, 4, 4.6, [4.6]], [150.7, 2, 2, 2.6, [2.6]], [151.2, 3, 1, 2.7, null],
];
const FA_STDS = [140, 142.5, 145, 149];   /* "aiming respectively at standards of
  140, 145, and 149 grains; and it is not unlikely there is another at about 142½" */

registerExample("example-ex17", (box) => {
  box.appendChild(exHeader("Interactive Example: The first attempt, by hand", "ex17-content"));
  const content = h(`<div id="ex17-content" class="example-content">
    <p>The text of this page is from the pages Peirce numbered 15 onward of MS 427, and is the
      version published in the <em>Collected Papers</em> (1931) and <em>The Essential Peirce</em>.
      However, the published version is actually Peirce's <em>second</em> attempt at this example.
      Where he says above that there were five standards, it is because he had previously worked it
      out &mdash; though in the first attempt he concluded three, &ldquo;and it is not unlikely
      there is another.&rdquo;</p>
    <p>His method was to tally all 158 weights into half-grain &ldquo;bins.&rdquo; He did this in
      order, and as he proceeded he noted where there were apparent peaks or changes: after finding
      only 6 weights in the 139.2&ndash;139.6 bin, he writes, <em>&ldquo;The numbers begin to fall
      off. But not so fast as they should, for now we are probably approaching another
      standard.&rdquo;</em> He recorded these numbers in a table with headings <em>App[arent].
      standard &middot; No. weights &middot; Smoothed &middot; Separated</em>.</p>
    <p>The Smoothed column follows an exact rule, and he wrote it down: an earlier draft heads
      the column <em>&ldquo;The same smoothed by 0.7 each + 0.3 previous.&rdquo;</em> That is,
      <span class="math">smoothed = 0.7 &times; this bin + 0.3 &times; the bin before</span> &mdash;
      and it reproduces every one of the thirty smoothed values in both drafts exactly (try the
      slider below). The Separated column then divides each smoothed value between the standards
      on either side, and the rough pages show how: not freehand, but little algebra problems in
      the mixing shares &mdash; <span class="math">11x + 6(1&minus;x) = 6x + 7(1&minus;x)</span>,
      so <span class="math">x = &#8537;</span> &mdash; with concentric-circle constructions
      apparently testing symmetric fall-off about candidate standards. The same rough pages hold
      his probable-error working (the bisections giving 1.1 and 0.9 grains) and a slip tabulating
      <span class="math">e<sup>x</sup></span> beside sketches of the cut-off curves his published
      text describes. So: the smoothing is a formula; the separation is a judgement, computed. We
      would now call the whole mixture decomposition; Peirce is working it by hand years before it
      had a name. The page is dated 22 February 1902, with &ldquo;Washington's birthday&rdquo;
      noted in the margin.</p>
    <div class="mode-tabs">
      <button class="mode-tab active" data-v="walk">work through it</button>
      <button class="mode-tab" data-v="chart">his working, drawn</button>
      <button class="mode-tab" data-v="table">his table</button>
      <button class="mode-tab" data-v="ms">the manuscript</button>
    </div>
    <div id="ex17-walkview">
      <div class="ex-buttonbar">
        <button class="btn btn-primary" id="ex17-wplay">play</button>
        <button class="btn" id="ex17-wstep">next bin</button>
        <button class="btn btn-warning" id="ex17-wflag">flag a standard here</button>
        <button class="btn" id="ex17-wreset">start over</button>
      </div>
      <div class="plot-container"></div>
      <p class="ex7-work-line" id="ex17-aside"></p>
    </div>
    <div id="ex17-chartview" style="display:none">
      <div class="ex-buttonbar">
        <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
          <input type="checkbox" id="ex17-smooth" checked> his smoothed values</label></label>
        <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
          <input type="checkbox" id="ex17-sep" checked> his separated shares, stacked</label></label>
        <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
          <input type="checkbox" id="ex17-rule" checked> the rule: &alpha;&thinsp;&times;&thinsp;this + (1&minus;&alpha;)&thinsp;&times;&thinsp;previous</label></label>
      </div>
      <div class="row"><div class="col col-6" id="ex17-arow"></div></div>
      <div class="plot-container"></div>
      <p class="ex7-work-line" id="ex17-verdict"></p>
    </div>
    <div id="ex17-tableview" style="display:none">
      <div class="table-scroll" style="max-height:360px;overflow-y:auto;">
        <table class="tbl"><thead style="position:sticky;top:0;background:var(--paper);"><tr>
          <th>app. standard</th><th>his count</th><th>table says</th><th>smoothed</th><th>separated</th>
        </tr></thead><tbody id="ex17-tbody"></tbody></table>
      </div>
    </div>
    <div id="ex17-msview" style="display:none">
      <p class="help-text" style="margin:4px 0">The rewritten table, with the smoothing rule written into its own heading:</p>
      <p style="text-align:center"><img src="${IMG_FA_RULE}" alt="MS 427 First Attempt: the table headed smoothed by 0.7 each + 0.3 previous"
        style="max-width:100%;border:1px solid var(--rule);"></p>
      <p class="help-text" style="margin:4px 0">The rough working: the share equations, the simultaneous systems, and the concentric-circle constructions:</p>
      <p style="text-align:center"><img src="${IMG_FA_WORK}" alt="MS 427 First Attempt: rough working with share equations and circles"
        style="max-width:100%;border:1px solid var(--rule);"></p>
      <p class="help-text" style="margin:4px 0">The probable-error bisections, and the slip of exponentials with the cut-off-curve sketches:</p>
      <p style="text-align:center"><img src="${IMG_FA_PE}" alt="MS 427 First Attempt: probable error working"
        style="max-width:70%;border:1px solid var(--rule);">
        <img src="${IMG_FA_EXP}" alt="MS 427 First Attempt: slip of exponential values"
        style="max-width:27%;border:1px solid var(--rule);vertical-align:top;"></p>
      <p class="help-text" style="margin:4px 0">The running tally, and the finished Smoothed/Separated table:</p>
      <p style="text-align:center"><img src="${IMG_FA17}" alt="MS 427 First Attempt: the running tally"
        style="max-width:100%;border:1px solid var(--rule);"></p>
      <p style="text-align:center"><img src="${IMG_FA18}" alt="MS 427 First Attempt: the Smoothed and Separated table"
        style="max-width:100%;border:1px solid var(--rule);"></p>
    </div>
    <div class="note-block">His tally sums to <strong>159</strong>, one more than Petrie's 158,
      and the comparison localizes it: the class 142.2&ndash;142.6 holds six in his count and five
      in the table &mdash; a single double-counted weight, in the very class whose standard he was
      least sure of. His last class quietly sweeps in the two heaviest weights (152.5 and 153
      grains). The rough pages also hold the probable-error working &mdash; bisecting between the
      lightest weight and the lightest inferred standard, and the heaviest and the heaviest, giving
      1.1 and 0.9 grains &mdash; the origin of the published five-eighths. His conclusion:
      <em>&ldquo;at least three natural and real classes of weights, aiming respectively at
      standards of 140, 145, and 149 grains&rdquo;</em>, with the intermediate weights
      <em>&ldquo;utterly impossible to say, without additional information.&rdquo;</em> Open for
      the transcription: what exactly the concentric-circle constructions are doing, and which
      neighbouring standard owns which Separated share.</div>
  </div>`);
  box.appendChild(content);

  /* his asides, at the rows where he broke off */
  const ASIDES = {
    5: "\u201cThe numbers begin to fall off. But not so fast as they should, for now we are probably approaching another standard.\u201d",
    7: "\u201cWe have, at any rate, passed one standard. But now we approach another.\u201d",
    20: "\u201cThere must have been a standard at about 145 grains. But now we come to another\u201d \u2014 and, in the margin, \u201cvery likely another at about 142\u00bd grains.\u201d",
    29: "His conclusion, on the next page: \u201cat least three natural and real classes of weights, aiming respectively at standards of 140, 145, and 149 grains.\u201d",
  };
  const show = { smooth: true, sep: true, rule: true };
  const aCtl = ctlSlider("&alpha; (his heading says 0.7)", "k2", 0, 1, 0.05, 0.7, (v) => v.toFixed(2));
  const cv = mkCanvas(330, (pl, W, H) => {
    const xlim = [136.4, 152.2];
    const ymax = 13.5;
    pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
    pl.axes({ xat: seqBy(137, 152, 2), yat: pretty0(ymax) });
    pl.axisLabels("grains", "weights per half-grain class");
    FA.forEach(([lo, c, t]) => {
      pl.rect(lo, 0, lo + 0.5, c, { col: c === t ? "rgba(87,93,102,.30)" : "rgba(154,123,63,.5)", border: PAL.paper });
    });
    FA_STDS.forEach((m) => {
      pl.segments(m, 0, m, ymax * 0.94, { col: PAL.inkFaint, lwd: 1, lty: 3 });
      pl.text(m, ymax * 0.97, m === 142.5 ? "142\u00bd?" : String(m), { col: PAL.inkSoft, cex: 0.8 });
    });
    if (show.sep) FA.forEach(([lo, , , , sep]) => {
      if (!sep) return;
      /* the shares as printed, stacked; two shades because the manuscript does
         not say which neighbouring standard owns which share */
      let y = 0;
      sep.forEach((v, k) => {
        pl.rect(lo + 0.06, y, lo + 0.44, y + v,
                { col: k % 2 ? "rgba(176,58,46,.28)" : "rgba(176,58,46,.5)", border: null });
        y += v;
      });
    });
    let hits = 0, tries = 0;
    if (show.rule) {
      const a = aCtl.get();
      const rule = FA.map(([, c], i) => a * c + (1 - a) * (i ? FA[i - 1][1] : 0));
      pl.lines(FA.map(([lo]) => lo + 0.25), rule, { col: PAL.accent3, lwd: 1.6, lty: 2 });
      FA.forEach(([, , , sm], i) => {
        if (sm === null) return;
        tries++; if (Math.abs(rule[i] - sm) < 0.051) hits++;
      });
    }
    if (show.smooth) FA.forEach(([lo, , , sm]) => {
      if (sm === null) return;
      pl.points([lo + 0.25], [sm], { col: "#b03a2e", cex: 0.9 });
      pl.points([lo + 0.25], [sm], { col: "#b03a2e", cex: 1.6, pch: 21 });
    });
    const v = $("#ex17-verdict");
    if (v) v.innerHTML = show.rule
      ? `At &alpha; = ${aCtl.get().toFixed(2)}, the rule lands exactly on
         <strong>${hits} of ${tries}</strong> of his smoothed values${hits === tries
           ? " \u2014 every one. The heading of his own draft says why: \u201csmoothed by 0.7 each + 0.3 previous.\u201d"
           : ". Slide to 0.70 and watch it click onto all of them."}
         Each red dot also sits exactly on its Separated stack: the shares divide the smoothed
         value, sum-preserving.`
      : `Each red dot sits exactly on top of its stack: Smoothed = the sum of the Separated
         shares, row by row.`;
  });

  /* ---- the walk: bins revealed in order, his asides arriving on cue ---- */
  let upTo = 0, myFlags = [], wTimer = null;
  const wcv = mkCanvas(330, (pl, W, H) => {
    const xlim = [136.4, 152.2];
    const ymax = 13.5;
    pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
    pl.axes({ xat: seqBy(137, 152, 2), yat: pretty0(ymax) });
    pl.axisLabels("grains", "weights per half-grain class");
    for (let i = 0; i < upTo; i++) {
      const [lo, c] = FA[i];
      pl.rect(lo, 0, lo + 0.5, c, { col: "rgba(87,93,102,.30)", border: PAL.paper });
    }
    myFlags.forEach((x) => {
      pl.segments(x, 0, x, ymax * 0.6, { col: PAL.accent, lwd: 1.4, lty: 3 });
      drawKetGlyph(pl, x, 0, PAL.accent, 8);
    });
    if (upTo >= FA.length) FA_STDS.forEach((m) => {
      pl.segments(m, 0, m, ymax * 0.94, { col: PAL.accent4, lwd: 1.2, lty: 3 });
      pl.text(m, ymax * 0.97, m === 142.5 ? "142\u00bd?" : String(m), { col: PAL.accent4, cex: 0.8 });
    });
    const aside = $("#ex17-aside");
    if (aside) {
      const hit = ASIDES[upTo - 1];
      aside.innerHTML = upTo === 0
        ? "The cleaned weights wait in order of value. Step through the bins as he did; flag a standard whenever the counts persuade you one is near."
        : upTo >= FA.length
        ? "All 158 tallied (159 by his count). His standards appear in gold" + (myFlags.length ? " \u2014 yours in blue, for comparison." : ".")
        : (hit || `bins tallied: ${upTo} of ${FA.length}`);
    }
  });
  function wstep() {
    if (upTo < FA.length) { upTo++; drawCanvas(wcv); }
    else if (wTimer) { clearInterval(wTimer); wTimer = null; $("#ex17-wplay", content).textContent = "play"; }
    if (ASIDES[upTo - 1] && wTimer) { clearInterval(wTimer); wTimer = null; $("#ex17-wplay", content).textContent = "play"; }
  }
  $("#ex17-wstep", content).addEventListener("click", wstep);
  $("#ex17-wplay", content).addEventListener("click", (e) => {
    if (wTimer) { clearInterval(wTimer); wTimer = null; e.target.textContent = "play"; return; }
    e.target.textContent = "pause";
    wTimer = setInterval(wstep, 380);
  });
  $("#ex17-wflag", content).addEventListener("click", () => {
    if (upTo > 0 && upTo <= FA.length) { myFlags.push(FA[upTo - 1][0] + 0.25); drawCanvas(wcv); }
  });
  $("#ex17-wreset", content).addEventListener("click", () => {
    if (wTimer) { clearInterval(wTimer); wTimer = null; $("#ex17-wplay", content).textContent = "play"; }
    upTo = 0; myFlags = []; drawCanvas(wcv);
  });
  $("#ex17-walkview .plot-container", content).appendChild(wcv);

  const tb = $("#ex17-tbody", content);
  FA.forEach(([lo, c, t, sm, sep]) => {
    tb.appendChild(h(`<tr${c === t ? "" : ' style="background:rgba(154,123,63,.18)"'}>
      <td>${lo.toFixed(1)}&ndash;${(lo + 0.4).toFixed(1)}</td>
      <td>${c}</td><td>${c === t ? t : `<strong>${t}</strong>`}</td>
      <td>${sm === null ? "" : sm.toFixed(1)}</td>
      <td style="text-align:left">${sep ? sep.map((x) => x.toFixed(1)).join(" + ") : ""}</td></tr>`));
  });

  $$(".mode-tab", content).forEach((b) => b.addEventListener("click", () => {
    $$(".mode-tab", content).forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $("#ex17-walkview", content).style.display = b.dataset.v === "walk" ? "" : "none";
    $("#ex17-chartview", content).style.display = b.dataset.v === "chart" ? "" : "none";
    $("#ex17-tableview", content).style.display = b.dataset.v === "table" ? "" : "none";
    $("#ex17-msview", content).style.display = b.dataset.v === "ms" ? "" : "none";
    if (b.dataset.v === "chart") drawCanvas(cv);
    if (b.dataset.v === "walk") drawCanvas(wcv);
  }));
  $("#ex17-arow", content).appendChild(aCtl.row);
  aCtl.input.addEventListener("input", () => drawCanvas(cv));
  ["smooth", "sep", "rule"].forEach((k) => {
    $("#ex17-" + k, content).addEventListener("input", (e) => { show[k] = e.target.checked; drawCanvas(cv); });
  });
});
</script>
<script>
/* ==========================================================================
   Example 18: figuring out the probable error.
   ==========================================================================*/
registerExample("example-ex18", (box) => {
  box.appendChild(exHeader("Interactive Example: Figuring out the probable error", "ex18-content"));
  const content = h(`<div id="ex18-content" class="example-content">
    <p>The probable error is defined by the halving in Peirce's sentence: it is the distance from
      the standard within which half the copies fall, and beyond which the other half stray. So it
      can be figured out from the data directly, with no curve assumed:
      <span class="click-cue">slide the allowance</span> until the two halves balance.</p>
    <div class="row"><div class="col col-6"></div><div class="col col-6" style="align-self:center">
      <span id="ex18-read" class="ex7-work-line"></span></div></div>
    <div class="plot-container"></div>
    <div class="note-block">The manuscript shows his own route to it: on the rough pages he bisects
      the counts between the lightest weight and the lightest inferred standard, and between the
      heaviest weight and the heaviest, getting <span class="math">1.1</span> and
      <span class="math">0.9</span> grains &mdash; &ldquo;of 0.7 of one per cent, which should be
      the probable error of a simple weight&rdquo; &mdash; and the published text rounds the story
      to &ldquo;four or five tenths of one per cent &hellip; from half to two-thirds of a
      grain,&rdquo; settling on <span class="math">&#8541;</span>. Against his five standards, the halving allowance of the data
      is 0.700 grains exactly (the median departure) &mdash; the first attempt's own figure &mdash;
      while the published &#8541; is a shade tighter, holding 59 of the 142. The band below each
      standard shows the allowance; each ket wears its colour when it is within the allowance of
      its standard, and fades when it strays beyond.</div>
  </div>`);
  box.appendChild(content);

  const peCtl = ctlSlider("the allowance either side of a standard (grains)", "k4",
                          0.1, 2.0, 0.025, 1.0, (v) => v.toFixed(3));
  $$(".col", content)[0].appendChild(peCtl.row);

  /* each ket's distance to its nearest of Peirce's standards */
  const dist = KETS142.map((v) => {
    let d = Infinity;
    PEIRCE_STANDARDS.forEach((m) => { d = Math.min(d, Math.abs(v - m)); });
    return d;
  });

  const cv = mkCanvas(300, (pl, W, H) => {
    const pe = peCtl.get();
    const xlim = [136, 153.5];
    const counts = histCounts(KETS142, BIN_0, xlim[1], BIN_W);
    const ymax = Math.max(...counts, 4) * 1.25;
    pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
    pl.axes({ xat: seqBy(136, 153.5, 2), yat: pretty0(ymax) });
    pl.axisLabels("grains (value of one ket)", "weights per half-grain");
    /* the allowance bands */
    PEIRCE_STANDARDS.forEach((m, i) => {
      pl.rect(m - pe, 0, m + pe, ymax * 0.06, { col: KTINT[i % KTINT.length], border: null });
      pl.segments(m, 0, m, ymax * 0.9, { col: KCOL[i % KCOL.length], lwd: 1, lty: 3 });
      drawKetGlyph(pl, m, 0, KCOL[i % KCOL.length], 7);
    });
    /* the kets, blocks coloured by whether they fall within the allowance */
    const nb = counts.length;
    const depth = new Array(nb).fill(0);
    KETS142.forEach((v, k) => {
      const b = Math.floor((v - BIN_0) / BIN_W);
      if (b < 0 || b >= nb) return;
      const x0 = BIN_0 + b * BIN_W, y = depth[b]++;
      let si = 0, bd = Infinity;
      PEIRCE_STANDARDS.forEach((m, i) => { const d = Math.abs(v - m); if (d < bd) { bd = d; si = i; } });
      const inside = dist[k] <= pe + 1e-9;
      pl.rect(x0, y, x0 + BIN_W, y + 1,
              { col: inside ? KTINT[si % KTINT.length] : "rgba(87,93,102,.14)", border: PAL.paper });
    });
    const within = dist.filter((d) => d <= pe + 1e-9).length;
    const read = $("#ex18-read");
    if (read) {
      const half = Math.abs(pe - 0.7) < 0.0126;
      read.innerHTML = `<strong style="color:${half ? PAL.accent3 : PAL.inkSoft}">${within}</strong>
        of ${KETS142.length} within the allowance, ${KETS142.length - within} beyond` +
        (half ? " &mdash; the median departure: this allowance is the probable error. (Fifteen kets sit exactly 0.7 from a standard, so the halves balance as nearly as the data allow.)" : ".");
    }
  });
  $(".plot-container", content).appendChild(cv);
  peCtl.input.addEventListener("input", () => drawCanvas(cv));
});
</script>
<script>
/* ==========================================================================
   Example 5: the elaborate calculations, done — the modern reading of the
   problem Peirce declined to compute (entry 04's computable half; the
   historical alternative approach still awaits Niall's details).
   ==========================================================================*/
registerExample("example-ex5", (box) => {
  box.appendChild(exHeader("Interactive Example: The elaborate calculations, done", "ex5-content"));
  const content = h(`<div id="ex5-content" class="example-content">
    <p>Peirce judged the elaborate calculations a waste of time in 1902, when every fit was a week
      of arithmetic. A machine does them in a moment, so here they are. For each number of
      standards, the best-fitting mixture is computed (expectation&ndash;maximization, the spread
      shared); the fits are then compared by the Bayesian information criterion, which charges each
      extra standard for its parameters; and resampling the 142 kets shows how firmly the data pin
      the standards down.</p>
    <div class="ex-buttonbar">
      <button class="btn btn-success" id="ex5-run">run the calculations</button>
      <span class="ex27-lead" id="ex5-status"></span>
    </div>
    <div class="plot-container" id="ex5-bic"></div>
    <div class="plot-container" id="ex5-boot" style="display:none"></div>
    <div class="result-box" id="ex5-read"></div>
  </div>`);
  box.appendChild(content);

  let fits = null, boot = null;
  const loglik = (fit) => {
    let ll = 0;
    KETS142.forEach((v) => {
      let d = 0;
      fit.mu.forEach((m, i) => { d += fit.w[i] * dnorm(v, m, fit.sd); });
      ll += Math.log(Math.max(d, 1e-12));
    });
    return ll;
  };
  const cvB = mkCanvas(240, (pl, W, H) => {
    if (!fits) { blankPlot(pl, "press run"); return; }
    const bics = fits.map((f, i) => -2 * f.ll + 2 * (i + 1) * Math.log(KETS142.length));
    const bmin = Math.min(...bics), bmax = Math.max(...bics);
    pl.setup({ xlim: [0.4, 6.6], ylim: [bmin - (bmax - bmin) * 0.15, bmax + (bmax - bmin) * 0.1],
               mar: [3, 3.4, 0.8, 0.8] });
    pl.axes({ xat: [1, 2, 3, 4, 5, 6], yat: RPlot.ticks(bmin, bmax, 4) });
    pl.axisLabels("number of standards", "BIC (lower is better)");
    bics.forEach((b, i) => {
      const best = b === bmin;
      pl.rect(i + 0.7, bmin - (bmax - bmin) * 0.15, i + 1.3, b,
              { col: best ? "rgba(74,124,89,.4)" : "rgba(87,93,102,.25)", border: PAL.paper });
      pl.text(i + 1, b + (bmax - bmin) * 0.045, b.toFixed(0), { col: best ? PAL.accent3 : PAL.inkSoft, cex: 0.8 });
    });
  });
  $("#ex5-bic", content).appendChild(cvB);
  const cvBoot = mkCanvas(220, (pl, W, H) => {
    if (!boot) return;
    const xlim = [136, 153.5];
    pl.setup({ xlim, ylim: [0, 1], mar: [3, 0.8, 0.8, 0.8] });
    pl.axes({ xat: seqBy(136, 153.5, 2), yat: [] });
    pl.axisLabels("grains — where the five standards land, across 150 resamplings", "");
    boot.forEach((sample) => sample.forEach((m, i) =>
      pl.points([m], [0.18 + 0.15 * i], { col: KCOL[i % KCOL.length], cex: 0.45 })));
    PEIRCE_STANDARDS.forEach((m, i) => {
      pl.segments(m, 0.05, m, 0.95, { col: PAL.ink, lwd: 1, lty: 3 });
      pl.text(m, 0.98, String(m), { col: PAL.inkSoft, cex: 0.75 });
    });
  });
  $("#ex5-boot", content).appendChild(cvBoot);

  $("#ex5-run", content).addEventListener("click", () => {
    const status = $("#ex5-status", content);
    status.textContent = "computing…";
    setTimeout(() => {
      fits = [];
      for (let k = 1; k <= 6; k++) {
        const f = emFit(KETS142, k, {});
        f.ll = loglik(f);
        fits.push(f);
      }
      boot = [];
      for (let b = 0; b < 150; b++) {
        const sample = Array.from({ length: KETS142.length },
          () => KETS142[Math.floor(Math.random() * KETS142.length)]);
        boot.push(emFit(sample, 5, { init: PEIRCE_STANDARDS, iters: 30 }).mu);
      }
      const bics = fits.map((f, i) => -2 * f.ll + 2 * (i + 1) * Math.log(KETS142.length));
      const bmin = Math.min(...bics);
      const bestK = bics.indexOf(bmin) + 1;
      status.textContent = "";
      $("#ex5-boot", content).style.display = "";
      drawCanvas(cvB); drawCanvas(cvBoot);
      const f5 = fits[4], fB = fits[bestK - 1];
      $("#ex5-read", content).innerHTML = `<p>The criterion prefers <strong>${bestK}</strong>
        standard${bestK > 1 ? "s" : ""} (at
        <span style="font-variant-numeric:tabular-nums">${fB.mu.map((m) => m.toFixed(1)).join(" / ")}</span>,
        probable error ${(fB.sd * 0.6745).toFixed(2)} grains); five standards trail it by
        ${(bics[4] - bmin).toFixed(1)} BIC units, four by ${(bics[3] - bmin).toFixed(1)}. That is
        worth sitting with: judged by parsimony on the 142 weights alone, a few broad classes cover
        the heap as well as five tight ones &mdash; the five are not demanded by the numbers. What
        makes five reasonable is everything else Peirce brings: the practice of weighing, which fixes
        the probable error of a single weight near half a grain and so forbids classes as loose as
        the two-standard fit's ${(fits[1].sd * 0.6745).toFixed(1)} grains. With the spread pinned at
        &#8541;, five standards land at
        <span style="font-variant-numeric:tabular-nums">${f5.mu.map((m) => m.toFixed(1)).join(" / ")}</span>,
        close to his <span style="font-variant-numeric:tabular-nums">139.2 / 142.2 / 144.7 / 146.95 /
        149.7</span>. The resampling shows the outer standards held firmly, the middle ones sliding.
        His verdict, computed: some such theory must be true, and the data alone are insufficient to
        fix it &mdash; the hypothesis rests on what else you know.</p>`;
    }, 30);
  });
});
</script>
