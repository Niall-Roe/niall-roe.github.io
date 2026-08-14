<script>
/* ==========================================================================
   Example 4: standards and their copies — both directions through the picture.
   Example 6: Peirce's own diagram, drawn to his restored description.
   ==========================================================================*/

registerExample("example-ex4", (box) => {
  box.appendChild(exHeader("Interactive Example: Copies of a standard", "ex4-content"));
  const content = h(`<div id="ex4-content" class="example-content">
    <p>If you knew the standards and you knew how well standards would be copied, you could predict
      how many weights would cluster around each standard. However, if you just had the data, you
      would have to instead try to select the values of standard and probable error that would, if
      correct, be most likely to have produced the data. Use the below to explore both
      circumstances. In the first mode, set the standards and generate kets. In the second, pretend
      you do not know the standards, and try to fit them.</p>
    <div class="mode-tabs">
      <button class="mode-tab active" id="ex4-know">assuming known standards</button>
      <button class="mode-tab" id="ex4-blind">figuring out the standards</button>
    </div>
    <div class="row"><div class="col col-6"></div><div class="col col-6"></div></div>
    <div class="ex-buttonbar" id="ex4-bar-know">
      <button class="btn btn-sm" id="ex4-two">two standards</button>
      <button class="btn btn-sm" id="ex4-clusters">two clusters (3 low + 2 high)</button>
      <button class="btn btn-sm btn-warning" id="ex4-petrie">Petrie's data, as Peirce cleaned it</button>
      <button class="btn btn-sm" id="ex4-randk">randomize</button>
      <span style="margin-left:auto"></span>
      <button class="btn btn-sm btn-primary" id="ex4-copy25">cast 25 of each</button>
      <button class="btn btn-sm" id="ex4-clear">clear the copies</button>
    </div>
    <div class="ex-buttonbar" id="ex4-bar-blind" style="display:none">
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex4-fixpe" checked> hold the probable error</label></label>
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex4-samesd" checked> same spread each</label></label>
      <span style="margin-left:auto"></span>
      <button class="btn btn-sm btn-warning" id="ex4-rand">randomize</button>
      <button class="btn btn-sm btn-success" id="ex4-snap">snap to best fit</button>
      <button class="btn btn-sm" id="ex4-reveal">reveal the actual</button>
    </div>
    <div class="row" id="ex4-sdrow" style="display:none"></div>
    <div class="plot-container"></div>
    <div class="note-block" id="ex4-read"></div>
  </div>`);
  box.appendChild(content);

  let stds = [143.8, 145.6];
  let copies = stds.map(() => []);
  let castPE = 0.625;                 /* the PE the copies were actually cast with */
  let dataMode = false, blind = false;
  let fixPE = true, sameSd = true;
  let fit = null;                     /* {mu, w, sds} once snapped */
  let reveal = false;
  let guesses = [140, 148];
  let gSds = [];                      /* hand-set spreads when each has its own */
  function rebuildSdRow() {
    const row = $("#ex4-sdrow", content);
    row.innerHTML = "";
    row.style.display = (blind && !sameSd) ? "" : "none";
    if (!(blind && !sameSd)) return;
    while (gSds.length < guesses.length) gSds.push(PEIRCE_PE * PE_TO_SD);
    gSds.length = guesses.length;
    guesses.forEach((m, i) => {
      const col = h(`<div class="col col-4"></div>`);
      const c = ctlSlider(`spread of <span style="color:${KCOL[i % KCOL.length]}">standard ${i + 1}</span> (grains, as s.d.)`,
                          "k1", 0.3, 2.5, 0.05, +gSds[i].toFixed(2), (v) => v.toFixed(2));
      /* the slider wears its own standard's colour, matching the curve it moves */
      c.input.style.accentColor = KCOL[i % KCOL.length];
      c.val.style.color = KCOL[i % KCOL.length];
      c.input.addEventListener("input", () => { gSds[i] = c.get(); fit = null; drawCanvas(cv); });
      col.appendChild(c.row); row.appendChild(col);
    });
  }
  const kCtl = ctlSlider("number of standards / guesses", "k1", 1, 6, 1, 2);
  const peCtl = ctlSlider("probable error of a single copy (grains)", "k4", 0.2, 1.5, 0.025, 0.625,
                          (v) => v.toFixed(3));
  $$(".col", content)[0].appendChild(kCtl.row);
  $$(".col", content)[1].appendChild(peCtl.row);

  const allCopies = () => (dataMode ? KETS142 : [].concat(...copies));
  const spreadGuesses = (k) => Array.from({ length: k }, (_, i) => +(138 + (i + 0.5) * 13 / k).toFixed(1));

  function preset(newStds, asData) {
    dataMode = !!asData; fit = null; reveal = false;
    stds = newStds.slice();
    copies = stds.map(() => []);
    kCtl.input.value = stds.length; kCtl.input.dispatchEvent(new Event("input"));
    if (asData) { peCtl.input.value = PEIRCE_PE; peCtl.input.dispatchEvent(new Event("input")); castPE = PEIRCE_PE; }
    guesses = spreadGuesses(stds.length);
    poke();
  }

  const cv = mkCanvas(330, (pl, W, H) => {
    const pe = peCtl.get();
    if (!blind) {
      drawMixture(pl, W, H, dataMode
        ? { stds, data: KETS142, pe, blocks: true, weights: nearestCounts(KETS142, stds), bigStd: true }
        : { stds, copies, pe, blocks: true, bigStd: true });
      return;
    }
    /* figuring out: the data's own curve is the fixed target; guesses and their
       implied sum move against it */
    const vals = allCopies();
    const xlim = [136, 153.5];
    const dc = dataCurve(vals, xlim, 1);
    const counts = histCounts(vals, BIN_0, xlim[1], BIN_W);
    const ymax = Math.max(4, ...dc.ys, ...counts) * 1.3;
    pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
    pl.axes({ xat: seqBy(138, 153, 2), yat: pretty0(ymax) });
    pl.axisLabels("grains", "weights per half-grain");
    const mu = fit ? fit.mu : guesses;
    const w = fit ? fit.w.map((x) => x * vals.length) : guesses.map(() => vals.length / guesses.length);
    const sds = fit ? fit.sds : (sameSd ? null : gSds);
    const dOf = (x, m, i) => dnorm(x, m, (sds && sds[i]) || pe * PE_TO_SD);
    /* the bars themselves shade smoothly across the axis, bin to bin, in the
       guesses' colours — the house gradient */
    counts.forEach((n, i) => {
      if (!n) return;
      const x0 = BIN_0 + i * BIN_W;
      const r = mu.map((m, j) => w[j] * dOf(x0 + BIN_W / 2, m, j));
      for (let u = 0; u < n; u++)
        pl.rect(x0, u, x0 + BIN_W, u + 1, { col: mixCol(KCOL, r, 0.55), border: PAL.paper });
    });
    pl.lines(dc.xs, dc.ys, { col: PAL.ink, lwd: 2 });
    const xs = seqBy(xlim[0], xlim[1], 0.05);
    mu.forEach((m, i) => {
      pl.lines(xs, xs.map((x) => w[i] * BIN_W * dOf(x, m, i)), { col: KCOL[i % KCOL.length], lwd: 1.3 });
      drawKetGlyph(pl, m, 0, KCOL[i % KCOL.length], 9);
    });
    pl.lines(xs, xs.map((x) => mu.reduce((a, m, i) => a + w[i] * BIN_W * dOf(x, m, i), 0)),
             { col: PAL.accent2, lwd: 1.7, lty: 2 });
    /* the actual, revealed: the distributions of the assuming-known page */
    if (reveal) {
      const tStds = stds, tW = dataMode ? nearestCounts(KETS142, stds) : copies.map((c) => c.length);
      const tSd = castPE * PE_TO_SD;
      tStds.forEach((m, i) => {
        pl.lines(xs, xs.map((x) => tW[i] * BIN_W * dnorm(x, m, tSd)),
                 { col: KCOL[i % KCOL.length], lwd: 1.8, lty: 3 });
        pl.segments(m, 0, m, ymax * 0.9, { col: KCOL[i % KCOL.length], lwd: 1, lty: 3 });
        drawKetGlyph(pl, m, 0, KCOL[i % KCOL.length], 6);
      });
    }
    let miss = 0, n = 0;
    dc.xs.forEach((x, i) => {
      if (dc.ys[i] < 0.3) return;
      miss += Math.abs(mu.reduce((a, m, k) => a + w[k] * BIN_W * dOf(x, m, k), 0) - dc.ys[i]); n++;
    });
    const read = $("#ex4-read");
    if (read) read.innerHTML = !vals.length
      ? `No data yet: cast copies in the first mode, or press <em>randomize</em> for a heap
         whose standards you were not shown.`
      : `The solid black curve is a smoothed out summary of the histogram (more on how Peirce
      smoothed his data below). The red dashed curve is the sum of your
      <strong>${mu.length}</strong> candidate standards. Average miss:
      <strong>${(miss / (n || 1)).toFixed(2)}</strong> weights per class.
      ${fit ? "Snapped to the best fit under your settings &mdash; drag any dome to take over from it."
            : '<span class="click-cue">Drag the standards to bring the dashed curve onto the black one.</span>'}
      ${reveal ? " The dotted curves are the actual distributions the data were generated from." : ""}`;
  });
  $(".plot-container", content).appendChild(cv);

  attachDrag(cv,
    (x) => {
      const set = blind ? (fit ? fit.mu : guesses) : stds;
      let bi = null, bd = 0.7;
      set.forEach((m, i) => { const d = Math.abs(x - m); if (d < bd) { bd = d; bi = i; } });
      return bi;
    },
    (i, x) => {
      const v = Math.max(136.2, Math.min(153.2, +x.toFixed(1)));
      if (blind) { if (fit) { guesses = fit.mu.slice(); fit = null; } guesses[i] = v; }
      else stds[i] = v;
      drawCanvas(cv);
    });

  function know() {
    const read = $("#ex4-read");
    if (!read || blind) return;
    const t = copies.reduce((a, c) => a + c.length, 0);
    read.innerHTML = dataMode
      ? `The 142 real kets, stacked as blocks and coloured by their likeliest standard under the
         current placement. The second mode hands you this same heap without the standards.`
      : `The copies you cast here are the data the second mode will ask you to fit. Each
         standard's thin curve is what its copies would print with endlessly many castings.${
         t ? ` <strong>${t}</strong> copies cast so far.` : ""}`;
  }
  function poke() { drawCanvas(cv); if (!blind) know(); }
  $("#ex4-copy25", content).addEventListener("click", () => {
    if (dataMode) return;
    stds.forEach((m, i) => { for (let j = 0; j < 25; j++) copies[i].push(PROCESSES.skillful.draw(m, peCtl.get())); });
    castPE = peCtl.get();
    fit = null; poke();
  });
  $("#ex4-clear", content).addEventListener("click", () => {
    if (!dataMode) copies = stds.map(() => []);
    fit = null; reveal = false; poke();
  });
  $("#ex4-two", content).addEventListener("click", () => preset([143.8, 145.6]));
  $("#ex4-clusters", content).addEventListener("click", () => preset([139.4, 140.6, 141.8, 147.6, 149.4]));
  $("#ex4-petrie", content).addEventListener("click", () => preset(PEIRCE_STANDARDS, true));
  function randomize(showPE) {
    /* some standards at some spread, 100 copies of each — a hidden truth when
       done from the figuring page, in plain sight from the known one */
    const k = 2 + Math.floor(Math.random() * 4);
    let tries = 0, next;
    do {
      next = Array.from({ length: k }, () => +(138 + Math.random() * 13).toFixed(1)).sort((a, b) => a - b);
      tries++;
    } while (tries < 200 && next.some((m, i) => i && m - next[i - 1] < 1.6));
    stds = next;
    dataMode = false;
    castPE = +(0.35 + Math.random() * 0.65).toFixed(3);
    copies = stds.map((m) => Array.from({ length: 100 }, () => PROCESSES.skillful.draw(m, castPE)));
    fit = null; reveal = false;
    kCtl.input.value = k; kCtl.val.textContent = String(k);
    if (showPE) { peCtl.input.value = castPE; peCtl.val.textContent = castPE.toFixed(3); }
    poke();
  }
  $("#ex4-rand", content).addEventListener("click", () => randomize(false));
  $("#ex4-randk", content).addEventListener("click", () => randomize(true));
  $("#ex4-reveal", content).addEventListener("click", (e) => {
    reveal = !reveal;
    e.target.classList.toggle("is-active", reveal);
    drawCanvas(cv);
  });
  kCtl.input.addEventListener("input", () => {
    const k = kCtl.get();
    if (blind) { guesses = spreadGuesses(k); fit = null; rebuildSdRow(); }
    else if (!dataMode && k !== stds.length) { stds = spreadGuesses(k); copies = stds.map(() => []); }
    poke();
  });
  peCtl.input.addEventListener("input", () => { fit = null; drawCanvas(cv); });
  $("#ex4-know", content).addEventListener("click", (e) => {
    blind = false;
    e.target.classList.add("active"); $("#ex4-blind", content).classList.remove("active");
    $("#ex4-bar-know", content).style.display = "";
    $("#ex4-bar-blind", content).style.display = "none";
    rebuildSdRow(); poke();
  });
  $("#ex4-blind", content).addEventListener("click", (e) => {
    blind = true;
    e.target.classList.add("active"); $("#ex4-know", content).classList.remove("active");
    $("#ex4-bar-know", content).style.display = "none";
    $("#ex4-bar-blind", content).style.display = "";
    rebuildSdRow(); drawCanvas(cv);
  });
  $("#ex4-fixpe", content).addEventListener("input", (e) => { fixPE = e.target.checked; fit = null; drawCanvas(cv); });
  $("#ex4-samesd", content).addEventListener("input", (e) => {
    sameSd = e.target.checked; fit = null; rebuildSdRow(); drawCanvas(cv);
  });
  $("#ex4-snap", content).addEventListener("click", () => {
    const vals = allCopies();
    if (!vals.length) return;
    if (!sameSd) {
      fit = lawFit(vals, guesses.length, "gauss", peCtl.get(), { init: guesses, perSd: true });
    } else {
      const f = emFit(vals, guesses.length, { init: guesses,
        sd: fixPE ? peCtl.get() * PE_TO_SD : null });
      fit = { mu: f.mu, w: f.w, sds: f.mu.map(() => f.sd) };
      if (!fixPE) { peCtl.input.value = Math.max(0.2, Math.min(1.5, +(f.sd * 0.6745).toFixed(3))); peCtl.val.textContent = peCtl.get().toFixed(3); }
    }
    drawCanvas(cv);
  });
  poke();
});

/* ---- ex6: Peirce's diagram, against the data ------------------------------ */
registerExample("example-ex6", (box) => {
  box.appendChild(exHeader("Interactive Example: Peirce's diagram", "ex6-content"));
  const NUMW = ["one", "two", "three", "four", "five", "six"];
  const FIRST_ATTEMPT = [139.7, 142.5, 145, 149];
  const content = h(`<div id="ex6-content" class="example-content">
    <p>The diagram of the restored paragraph, drawn to his description &mdash; and alive:
      <span class="click-cue">drag the domes</span> and the table in the article follows. The aim
      of the game, here and throughout: place the standards so the sum of the class curves matches
      the smoothed curve of the data.</p>
    <div class="row"><div class="col col-6"></div><div class="col col-6"></div></div>
    <div class="mode-tabs">
      <button class="mode-tab active" data-m="main">data &amp; curves</button>
      <button class="mode-tab" data-m="blocks">blocks</button>
      <button class="mode-tab" data-m="peirce">Peirce's chart</button>
      <button class="restore-peirce on" id="ex6-restore">restore Peirce's figures</button>
    </div>
    <div class="ex-buttonbar" id="ex6-toggles">
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex6-showdata" checked> the data</label></label>
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex6-showsmooth" checked> smoothed curve of the data</label></label>
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex6-showcomp" checked> the class curves</label></label>
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex6-showsum" checked> their sum</label></label>
    </div>
    <div class="ex-buttonbar">
      <button class="btn" id="ex6-first">his first attempt (four standards)</button>
      <button class="btn" id="ex6-second">his second attempt (five standards)</button>
      <button class="btn btn-success" id="ex6-fit">best fit for this many standards</button>
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex6-fixsd" checked> hold the spread at &#8541; grain</label></label>
    </div>
    <div class="plot-container"></div>
    <div class="note-block">Peirce worked through this twice. In his first attempt he tabulated
      the weights in half-grain classes, smoothed the counts by hand, and read the clusterings off
      the chart, concluding standards at about 140, 145 and 149 grains, with another not unlikely
      at about 142&frac12; (see the above example). The second attempt apparently begins from that
      working but confidently asserts that there are five standards, providing the counts in the
      table above. Assigning each ket to its nearest standard under his own five gives
      <span style="font-variant-numeric:tabular-nums">36&thinsp;/&thinsp;30&thinsp;/&thinsp;30&thinsp;/&thinsp;22&thinsp;/&thinsp;24</span>,
      not his <span style="font-variant-numeric:tabular-nums">36&thinsp;/&thinsp;25&thinsp;/&thinsp;26&thinsp;/&thinsp;23&thinsp;/&thinsp;34</span>.
      <span id="ex6-now"></span></div>
  </div>`);
  box.appendChild(content);

  let stds = PEIRCE_STANDARDS.slice();
  let mode = "main";
  const show6 = { data: true, smooth: true, comp: true, sum: true };
  const kCtl = ctlSlider("number of standards", "k1", 1, 6, 1, 5);
  const peCtl = ctlSlider("probable error (grains)", "k4", 0.2, 1.5, 0.025, PEIRCE_PE,
                          (v) => v.toFixed(3));
  $$(".col", content)[0].appendChild(kCtl.row);
  $$(".col", content)[1].appendChild(peCtl.row);

  function reseed(k) {
    if (k === 5) { stds = PEIRCE_STANDARDS.slice(); return; }
    if (k === 4) { stds = FIRST_ATTEMPT.slice(); return; }
    stds = [];
    for (let i = 0; i < k; i++) stds.push(+(138 + (i + 0.5) * 13 / k).toFixed(1));
  }
  const counts = () => nearestCounts(KETS142, stds);

  const cv = mkCanvas(340, (pl, W, H) => {
    const xlim = [136, 153.5], sd = peCtl.get() * PE_TO_SD, wts = counts();
    const xs = seqBy(xlim[0], xlim[1], 0.05);
    if (mode === "peirce") {
      /* red circled points, blue class curves, brown sum — his own colours */
      const obs = histCounts(KETS142, BIN_0, xlim[1], BIN_W);
      const ymax = Math.max(...obs, 4) * 1.25;
      pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
      pl.axes({ xat: seqBy(136, 153.5, 2), yat: pretty0(ymax) });
      pl.axisLabels("grains (value of one ket)", "weights per half-grain");
      stds.forEach((m, i) => pl.lines(xs, xs.map((x) => wts[i] * BIN_W * dnorm(x, m, sd)),
                                      { col: "#2f5f9f", lwd: 1.5 }));
      pl.lines(xs, xs.map((x) => stds.reduce((a, m, i) => a + wts[i] * BIN_W * dnorm(x, m, sd), 0)),
               { col: "#7a5230", lwd: 2 });
      obs.forEach((n, i) => {
        if (!n) return;
        const x = BIN_0 + (i + 0.5) * BIN_W;
        pl.points([x], [n], { col: "#b03a2e", cex: 0.9 });
        pl.points([x], [n], { col: "#b03a2e", cex: 1.7, pch: 21 });
      });
      if (show6.smooth) {
        const dc = dataCurve(KETS142, xlim, 2);   /* the smoother window */
        pl.lines(dc.xs, dc.ys, { col: PAL.ink, lwd: 1.6, lty: 3 });
      }
      stds.forEach((m) => drawKetGlyph(pl, m, 0, "#2f5f9f", 8));
    } else if (mode === "blocks") {
      /* individually coloured blocks, each in its likeliest standard's own
         tint — no gradient here — with the smoothed curve still on call */
      drawMixture(pl, W, H, { stds, data: KETS142, pe: peCtl.get(), blocks: true,
                              solidBlocks: true, weights: wts, bigStd: true, xlim });
      if (show6.smooth) {
        const dc = dataCurve(KETS142, xlim, 1);
        pl.lines(dc.xs, dc.ys, { col: PAL.ink, lwd: 2 });
      }
    } else {
      /* the mixture look: blocks in the bars, gradient under the curves */
      if (show6.data) {
        drawMixture(pl, W, H, { stds, data: KETS142, pe: peCtl.get(), blocks: true,
          gradientSum: show6.comp, weights: wts, bigStd: true, xlim,
          showCurves: false, hideStds: true });
      } else {
        const obs0 = histCounts(KETS142, BIN_0, xlim[1], BIN_W);
        pl.setup({ xlim, ylim: [0, Math.max(...obs0, 4) * 1.25], mar: [3, 3, 0.8, 0.8] });
        pl.axes({ xat: seqBy(136, 153.5, 2), yat: pretty0(Math.max(...obs0, 4) * 1.25) });
        pl.axisLabels("grains (value of one ket)", "weights per half-grain");
      }
      if (show6.smooth) {
        const dc = dataCurve(KETS142, xlim, 1);
        pl.lines(dc.xs, dc.ys, { col: PAL.ink, lwd: 2 });
      }
      if (show6.comp) stds.forEach((m, i) => pl.lines(xs, xs.map((x) => wts[i] * BIN_W * dnorm(x, m, sd)),
                                                      { col: KCOL[i % KCOL.length], lwd: 1.6 }));
      if (show6.sum) pl.lines(xs, xs.map((x) => stds.reduce((a, m, i) => a + wts[i] * BIN_W * dnorm(x, m, sd), 0)),
                              { col: PAL.accent2, lwd: 1.4, lty: 2 });
      stds.forEach((m, i) => drawKetGlyph(pl, m, 0, KCOL[i % KCOL.length], 8));
    }
  });
  $(".plot-container", content).appendChild(cv);
  [["showdata", "data"], ["showsmooth", "smooth"], ["showcomp", "comp"], ["showsum", "sum"]].forEach(([id, k]) => {
    $("#ex6-" + id, content).addEventListener("input", (e) => { show6[k] = e.target.checked; drawCanvas(cv); });
  });

  attachDrag(cv,
    (x) => { let bi = null, bd = 0.7; stds.forEach((m, i) => { const d = Math.abs(x - m); if (d < bd) { bd = d; bi = i; } }); return bi; },
    (i, x) => { stds[i] = Math.max(136.2, Math.min(153.2, +x.toFixed(2))); drawCanvas(cv); refreshLive("example-ex6"); });

  const peirceExact = () =>
    stds.length === 5 && Math.abs(peCtl.get() - PEIRCE_PE) < 1e-9 &&
    stds.every((m, i) => Math.abs(m - PEIRCE_STANDARDS[i]) < 1e-9);
  const fracWord = (v) => Math.abs(v - 0.625) < 1e-9 ? "five-eighths"
    : Math.abs(v - 0.5) < 1e-9 ? "one-half" : Math.abs(v - 0.75) < 1e-9 ? "three-quarters"
    : v.toFixed(3);

  const bindings = { k: () => NUMW[stds.length - 1], pe: () => fracWord(peCtl.get()) };
  for (let i = 1; i <= 5; i++) {
    bindings["c" + i] = () => (i <= stds.length ? String(counts()[i - 1]) : "&mdash;");
    bindings["s" + i] = () => (i <= stds.length ? String(+stds[i - 1].toFixed(2)) : "&mdash;");
  }
  /* the live restatement of the table's sentences, in the standards' colours */
  function updateNow() {
    const el = $("#ex6-now", content);
    if (!el) return;
    const cts = counts();
    const at = stds.map((m, i) =>
      `<span style="color:${KCOL[i % KCOL.length]}">${+m.toFixed(2)}</span>`).join(" / ");
    const each = stds.map((_, i) =>
      `<span style="color:${KCOL[i % KCOL.length]}">${cts[i]}</span>`).join(" / ");
    el.innerHTML = `As you have it now, your ${NUMW[stds.length - 1]} standards at
      <span style="font-variant-numeric:tabular-nums">${at}</span> grains contain
      <span style="font-variant-numeric:tabular-nums">${each}</span> weights each.`;
  }
  registerLive("example-ex6", bindings, {
    onRefresh: (on) => {
      updateNow();
      for (let i = 1; i <= 5; i++) {
        const tr = $("#std-row-" + i);
        if (tr) tr.style.color = on && i <= stds.length ? KCOL[i - 1] : "";
      }
      /* the restored paragraph: each sentence wears its curve's colour while open */
      const words = { red: "#b03a2e", blue: "#2f5f9f", brown: "#7a5230" };
      const tints = { red: "rgba(176,58,46,.13)", blue: "rgba(47,95,159,.13)", brown: "rgba(122,82,48,.15)" };
      const lit = on && mode === "peirce";
      Object.keys(words).forEach((w) => {
        const el = $("#ex6-word-" + w), sent = $("#ex6-sent-" + w);
        if (el) { el.style.color = lit ? words[w] : ""; el.style.fontWeight = lit ? "700" : ""; }
        if (sent) sent.style.backgroundColor = lit ? tints[w] : "";
      });
      const r = $("#ex6-restore");
      if (r) r.classList.toggle("on", on && !peirceExact());
    },
  });

  const poke = () => { drawCanvas(cv); refreshLive("example-ex6"); };
  kCtl.input.addEventListener("input", () => { reseed(kCtl.get()); poke(); });
  peCtl.input.addEventListener("input", poke);
  $("#ex6-restore", content).addEventListener("click", () => {
    stds = PEIRCE_STANDARDS.slice();
    peCtl.input.value = PEIRCE_PE; peCtl.input.dispatchEvent(new Event("input"));
    kCtl.input.value = 5; kCtl.input.dispatchEvent(new Event("input"));
    reseed(5); poke();
  });
  $("#ex6-first", content).addEventListener("click", () => {
    kCtl.input.value = 4; kCtl.input.dispatchEvent(new Event("input"));
    stds = FIRST_ATTEMPT.slice(); poke();
  });
  $("#ex6-second", content).addEventListener("click", () => {
    kCtl.input.value = 5; kCtl.input.dispatchEvent(new Event("input"));
    stds = PEIRCE_STANDARDS.slice();
    peCtl.input.value = PEIRCE_PE; peCtl.input.dispatchEvent(new Event("input"));
    poke();
  });
  $("#ex6-fit", content).addEventListener("click", () => {
    const fixed = $("#ex6-fixsd", content).checked;
    const fit = emFit(KETS142, stds.length, { init: stds,
      sd: fixed ? peCtl.get() * PE_TO_SD : null });
    stds = fit.mu.slice();
    if (!fixed) { peCtl.input.value = (fit.sd * 0.6745).toFixed(3); peCtl.input.dispatchEvent(new Event("input")); }
    poke();
  });
  $$(".mode-tab", content).forEach((b) => b.addEventListener("click", () => {
    $$(".mode-tab", content).forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); mode = b.dataset.m; poke();
  }));
});
</script>
