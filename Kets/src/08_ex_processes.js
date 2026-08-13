<script>
/* ==========================================================================
   Example 9:  two classes merged — which standard did this ket serve?
   Example 12: buyers, sellers, and the crystallization of two norms.
   Example 14: the method of manufacture writes the error curve.
   Example 16: development — many ways converging on one result.
   ==========================================================================*/

registerExample("example-ex9", (box) => {
  box.appendChild(exHeader("Interactive Example: Which standard did this ket serve?", "ex9-content"));
  const A = 144.7, B = 146.95, WA = 26, WB = 23;
  const content = h(`<div id="ex9-content" class="example-content">
    <p>Take Peirce's two middle standards &mdash; <strong style="color:${KCOL[1]}">144.7 grs.</strong>
      with its 26 weights and <strong style="color:${KCOL[2]}">146.95 grs.</strong> with its 23 &mdash;
      and the probability curve either class prints. The black ket below has been dug up between them.
      <span class="click-cue">Drag it along the axis.</span></p>
    <div class="plot-container"></div>
    <div class="result-box" id="ex9-read"></div>
  </div>`);
  box.appendChild(content);
  let q = 145.8;
  const sd = PEIRCE_PE * PE_TO_SD;
  const cv = mkCanvas(280, (pl, W, H) => {
    const xs = seqBy(142.5, 149.2, 0.03);
    const fA = xs.map((x) => WA * dnorm(x, A, sd)), fB = xs.map((x) => WB * dnorm(x, B, sd));
    const ymax = Math.max(...fA, ...fB) * 1.15;
    pl.setup({ xlim: [142.5, 149.2], ylim: [0, ymax], mar: [3, 1.2, 0.8, 0.8] });
    pl.axes({ xat: seqBy(143, 149, 1), yat: [] });
    pl.axisLabels("grains", "");
    pl.polygon(xs.concat(xs.slice().reverse()), fA.concat(xs.map(() => 0)), { col: "rgba(74,124,89,.14)" });
    pl.polygon(xs.concat(xs.slice().reverse()), fB.concat(xs.map(() => 0)), { col: "rgba(154,123,63,.16)" });
    pl.lines(xs, fA, { col: KCOL[1], lwd: 1.8 });
    pl.lines(xs, fB, { col: KCOL[2], lwd: 1.8 });
    [[A, KCOL[1]], [B, KCOL[2]]].forEach(([m, c]) => drawKetGlyph(pl, m, 0, c, 8));
    /* a column one probable error wide over the found ket, built of ten
       blocks split by each standard's share */
    const r = responsibilities(q, [A, B], [WA, WB], sd);
    const cw = PEIRCE_PE, top9 = ymax * 0.78, nb9 = 10, gA = Math.round(r[0] * nb9);
    for (let u = 0; u < nb9; u++) {
      pl.rect(q - cw / 2, top9 * u / nb9, q + cw / 2, top9 * (u + 1) / nb9,
              { col: u < gA ? "rgba(74,124,89,.55)" : "rgba(154,123,63,.55)", border: PAL.paper });
    }
    drawKetGlyph(pl, q, 0, PAL.ink, 8);
    pl.text(q, ymax * 0.88, q.toFixed(1) + " grs.", { col: PAL.ink, cex: 0.85 });
    const read = $("#ex9-read");
    if (read) read.innerHTML = `<p>Of kets weighing ${q.toFixed(1)} grains,
      <strong style="color:${KCOL[1]}">${Math.round(r[0] * 100)}%</strong> served the 144.7 standard and
      <strong style="color:${KCOL[2]}">${Math.round(r[1] * 100)}%</strong> the 146.95.
      ${Math.min(r[0], r[1]) > 0.25
        ? "The proportions are known exactly, and there is no telling which individual kets served which standard. Both classes are real, and they are merged."
        : "Out here the answer is nearly certain — the classes only merge in the middle country between the standards."}</p>`;
  });
  $(".plot-container", content).appendChild(cv);
  attachDrag(cv, () => 0, (i, x) => { q = Math.max(142.7, Math.min(149.0, x)); drawCanvas(cv); });
});

registerExample("example-ex12", (box) => {
  box.appendChild(exHeader("Interactive Example: Buyers, sellers, and two norms", "ex12-content"));
  const content = h(`<div id="ex12-content" class="example-content">
    <p>Here we see how a single standard might develop into many. Buyers benefit from a slightly
      heavier standard (they would get more, e.g., grain per ket if the ket is heavier), and the
      reverse for the seller. Here, you can simulate the same standard being copied over time by
      buyers and by sellers.</p>
    <div class="row"><div class="col col-4"></div><div class="col col-4"></div><div class="col col-4"></div></div>
    <div class="ex-buttonbar">
      <button class="btn btn-primary" id="ex12-play">play</button>
      <button class="btn" id="ex12-reset">reset</button>
      <span class="ex27-lead" id="ex12-gen"></span>
    </div>
    <div class="plot-container"></div>
    <div class="result-box" id="ex12-read"></div>
  </div>`);
  box.appendChild(content);
  const STD = 144.7, N = 220;
  const gCtl = ctlSlider("generations of copying", "k1", 0, 40, 1, 0);
  const bCtl = ctlSlider("bias per generation (grains)", "k2", 0, 0.4, 0.02, 0.12, (v) => v.toFixed(2));
  const dCtl = ctlSlider("largest tolerated discrepancy (grains)", "k3", 1, 8, 0.5, 2, (v) => v.toFixed(1));
  $$(".col", content)[0].appendChild(gCtl.row);
  $$(".col", content)[1].appendChild(bCtl.row);
  $$(".col", content)[2].appendChild(dCtl.row);
  const z = [];
  for (let i = 0; i < N * 2; i++) z.push(randn());

  /* the two norms drift apart but stabilize once the discrepancy reaches the
     largest the market will tolerate: past that, a weight too far out is simply
     refused, and the norms hover at the boundary */
  const offset = (g, b, D) => (D / 2) * (1 - Math.exp(-2 * b * g / D));

  const cv = mkCanvas(320, (pl, W, H) => {
    const g = gCtl.get(), b = bCtl.get(), D = dCtl.get(), sd = PEIRCE_PE * PE_TO_SD;
    const off = offset(g, b, D);
    const spread = sd;   /* the probable error of copying stays what it is —
                            the norms move, the workmanship does not loosen */
    const muB = STD + off, muS = STD - off;
    const buyers = [], sellers = [];
    for (let i = 0; i < N; i++) {
      buyers.push(muB + spread * z[i]);
      sellers.push(muS + spread * z[N + i]);
    }
    const xlim = [STD - 8, STD + 8];
    const cb = histCounts(buyers, xlim[0], xlim[1], BIN_W), cs = histCounts(sellers, xlim[0], xlim[1], BIN_W);
    const ymax = Math.max(...cb, ...cs) * 1.3;
    pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
    pl.axes({ xat: seqBy(Math.ceil(xlim[0] / 2) * 2, xlim[1], 2), yat: pretty0(ymax) });
    pl.axisLabels("grains", "weights per half-grain");
    cs.forEach((n, i) => { if (n) pl.rect(xlim[0] + i * BIN_W, 0, xlim[0] + (i + 1) * BIN_W, n, { col: "rgba(176,86,63,.30)", border: PAL.paper }); });
    cb.forEach((n, i) => { if (n) pl.rect(xlim[0] + i * BIN_W, 0, xlim[0] + (i + 1) * BIN_W, n, { col: "rgba(47,111,159,.30)", border: PAL.paper }); });
    /* the two class curves, superimposed */
    const xs = seqBy(xlim[0], xlim[1], 0.05);
    pl.lines(xs, xs.map((x) => N * BIN_W * dnorm(x, muB, spread)), { col: PAL.accent, lwd: 1.7 });
    pl.lines(xs, xs.map((x) => N * BIN_W * dnorm(x, muS, spread)), { col: PAL.accent2, lwd: 1.7 });
    /* the original standard: at generation 0 one black ket; afterwards its red and
       blue selves ride out with the means, a grey ghost holding the middle */
    pl.segments(STD, 0, STD, ymax * 0.92, { col: PAL.inkFaint, lwd: 1, lty: 3 });
    if (g === 0) {
      drawKetGlyph(pl, STD, 0, PAL.ink, 9);
      pl.text(STD, ymax * 0.96, "the standard", { col: PAL.inkSoft, cex: 0.85 });
    } else {
      drawKetGlyph(pl, muB, 0, PAL.accent, 8);
      drawKetGlyph(pl, muS, 0, PAL.accent2, 8);
      drawKetGlyph(pl, (muB + muS) / 2, 0, "rgba(87,93,102,.45)", 8);
      pl.text(STD, ymax * 0.96, "where the one standard stood", { col: PAL.inkFaint, cex: 0.8 });
    }
    $("#ex12-gen", content).textContent = "generation " + g;
    const read = $("#ex12-read");
    if (read) read.innerHTML = g === 0
      ? "<p>Generation 0: a single class about a single standard.</p>"
      : `<p>Generation ${g}: the black ket was always a <span style="color:${PAL.accent}">buyers'
         ket</span> and a <span style="color:${PAL.accent2}">sellers' ket</span> lying on top of one
         another; they ride out with their classes to
         <strong style="color:${PAL.accent}">${muB.toFixed(1)}</strong> and
         <strong style="color:${PAL.accent2}">${muS.toFixed(1)}</strong> grains, the grey ghost
         holding the weighted middle. ${2 * off > D * 0.85
           ? "The norms have stabilized: a weight further out would be refused in the market, so they hover at the largest tolerated discrepancy."
           : "Nobody decreed either norm; the purposes of the copyists are doing it."}</p>`;
  });
  $(".plot-container", content).appendChild(cv);
  [gCtl, bCtl, dCtl].forEach((c) => c.input.addEventListener("input", () => drawCanvas(cv)));
  let timer = null;
  const playBtn = $("#ex12-play", content);
  playBtn.addEventListener("click", () => {
    if (timer) { clearInterval(timer); timer = null; playBtn.textContent = "play"; return; }
    playBtn.textContent = "pause";
    timer = setInterval(() => {
      let g = gCtl.get() + 1;
      if (g > 40) { clearInterval(timer); timer = null; playBtn.textContent = "play"; return; }
      gCtl.input.value = g; gCtl.input.dispatchEvent(new Event("input"));
      drawCanvas(cv);
    }, 220);
  });
  $("#ex12-reset", content).addEventListener("click", () => {
    if (timer) { clearInterval(timer); timer = null; playBtn.textContent = "play"; }
    gCtl.input.value = 0; gCtl.input.dispatchEvent(new Event("input"));
    drawCanvas(cv);
  });
});

/* smoothed density of a process, by Monte Carlo, scaled to a copy count */
function processCurve(proc, std, pe, nCopies) {
  const M = 20000, w = 0.1, x0 = std - 5, x1 = std + 5;
  const c = new Array(Math.ceil((x1 - x0) / w)).fill(0);
  for (let i = 0; i < M; i++) {
    const v = PROCESSES[proc].draw(std, pe);
    const b = Math.floor((v - x0) / w);
    if (b >= 0 && b < c.length) c[b]++;
  }
  const sm = c.map((_, i) => {
    let s = 0, n = 0;
    for (let j = -2; j <= 2; j++) { const k = i + j; if (k >= 0 && k < c.length) { s += c[k]; n++; } }
    return s / n;
  });
  const xs = sm.map((_, i) => x0 + (i + 0.5) * w);
  const scale = nCopies * BIN_W / (M * w);
  return { xs, ys: sm.map((v) => v * scale) };
}

registerExample("example-ex14", (box) => {
  box.appendChild(exHeader("Interactive Example: The method writes the curve", "ex14-content"));
  const PKEYS = Object.keys(PROCESSES);
  const content = h(`<div id="ex14-content" class="example-content">
    <p>The law of error is not a description of the empirical distribution, but an account of the
      spread of errors we would expect given the process that produced them. The Gaussian law is the
      standard because it is known that when errors are due to many small independent influences,
      their overall distribution will be normal. Here Peirce is describing how the kets would be
      distributed given different processes of manufacture. Each button is one of his stories, in
      its own colour &mdash; and his description of that curve lights up in the paragraph above.</p>
    <div class="ex-buttonbar" id="ex14-btns"></div>
    <div class="ex-buttonbar">
      <button class="btn btn-sm" id="ex14-add">add a standard</button>
      <button class="btn btn-sm" id="ex14-one">back to one</button>
      <button class="btn btn-sm" id="ex14-scatter">scatter everything</button>
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex14-per"> each standard its own method</label></label>
    </div>
    <div class="ex-buttonbar" id="ex14-perrow" style="display:none">
      <button class="btn btn-sm btn-warning" id="ex14-data">against the real kets</button>
      <button class="btn btn-sm btn-success" id="ex14-snap" style="display:none">snap to best fit</button>
    </div>
    <div class="row"><div class="col col-4" id="ex14-nrow"></div>
      <div class="col col-4" id="ex14-arow" style="display:none"></div>
      <div class="col col-4" id="ex14-brow" style="display:none"></div></div>
    <div class="plot-container"></div>
  </div>`);
  box.appendChild(content);
  let stds = [144.7];
  let proc = "skillful", copies = [], curves = [], vsData = false;
  let perMode = false, perProc = ["skillful"];
  function rebuildPerRow() {
    const row = $("#ex14-perrow", content);
    row.style.display = perMode ? "" : "none";
    row.innerHTML = "";
    if (!perMode) return;
    while (perProc.length < stds.length) perProc.push("skillful");
    perProc.length = stds.length;
    stds.forEach((m, i) => {
      const sel = h(`<label class="ctl" style="margin:0;display:inline-flex;align-items:center;gap:6px;">
        <span style="color:${KCOL[i % KCOL.length]};font-variant:small-caps;">std ${i + 1}</span>
        <select>${PKEYS.map((k) => `<option value="${k}"${k === perProc[i] ? " selected" : ""}>${PROCESSES[k].label}</option>`).join("")}</select></label>`);
      $("select", sel).addEventListener("input", (e) => { perProc[i] = e.target.value; recast(); drawCanvas(cv); });
      row.appendChild(sel);
    });
  }
  const nCtl = ctlSlider("copies of each standard", "k1", 2, 4.9, 0.05, 2.48,
                         (v) => String(Math.round(Math.pow(10, v))));
  const aCtl = ctlSlider("beta &alpha;", "k2", 0.6, 8, 0.2, 2, (v) => v.toFixed(1));
  const bCtl = ctlSlider("beta &beta;", "k3", 0.6, 8, 0.2, 2, (v) => v.toFixed(1));
  $("#ex14-nrow", content).appendChild(nCtl.row);
  $("#ex14-arow", content).appendChild(aCtl.row);
  $("#ex14-brow", content).appendChild(bCtl.row);
  const NC = () => Math.round(Math.pow(10, nCtl.get()));
  const drawOne = (m) => proc === "beta"
    ? (() => { /* rejection-sample the reshaped beta */
        const half = 2.5 * PEIRCE_PE, cap = 4 / (2 * half);
        for (let i = 0; i < 400; i++) {
          const x = m - half + 2 * half * Math.random();
          if (Math.random() * cap < lawDens("beta", x, m, PEIRCE_PE, { a: aCtl.get(), b: bCtl.get() })) return x;
        }
        return m;
      })()
    : PROCESSES[proc].draw(m, PEIRCE_PE);
  const curveOf = (m, n) => proc === "beta"
    ? (() => { const xs = seqBy(m - 4, m + 4, 0.05);
        return { xs, ys: xs.map((x) => n * BIN_W * lawDens("beta", x, m, PEIRCE_PE, { a: aCtl.get(), b: bCtl.get() })) }; })()
    : processCurve(proc, m, PEIRCE_PE, n);
  const drawOneAs = (m, pk) => PROCESSES[pk].draw(m, PEIRCE_PE);
  const recast = () => {
    copies = []; curves = [];
    stds.forEach((m, si) => {
      const pk = perMode ? (perProc[si] || "skillful") : null;
      const c = [];
      for (let i = 0; i < NC(); i++) c.push(pk ? drawOneAs(m, pk) : drawOne(m));
      copies.push(c);
      curves.push(pk ? processCurve(pk, m, PEIRCE_PE, NC()) : curveOf(m, NC()));
    });
  };
  recast();
  const PCOl = (k) => (k === "beta" ? "#5f7d8c" : KCOL[PKEYS.indexOf(k) % KCOL.length]);
  const hl = () => {
    PKEYS.forEach((k) => {
      const el = $("#ex14-hl-" + k);
      if (el) el.style.backgroundColor = (k === proc && box.closest(".example-container").classList.contains("open"))
        ? KTINT[PKEYS.indexOf(k) % KTINT.length] : "";
    });
  };
  new MutationObserver(hl).observe(box.closest(".example-container"), { attributes: true, attributeFilter: ["class"] });
  const bar = $("#ex14-btns", content);
  PKEYS.forEach((k, i) => {
    const b = h(`<button class="btn btn-sm${k === proc ? " is-active" : ""}" data-p="${k}"
      style="color:${KCOL[i]};border-color:${KCOL[i]}">${PROCESSES[k].label}</button>`);
    b.addEventListener("click", () => {
      proc = k; recast();
      $$("button", bar).forEach((x) => x.classList.toggle("is-active", x.dataset.p === k));
      $("#ex14-arow", content).style.display = $("#ex14-brow", content).style.display = "none";
      hl(); drawCanvas(cv);
    });
    bar.appendChild(b);
  });
  const betaBtn = h(`<button class="btn btn-sm" data-p="beta" style="color:#5f7d8c;border-color:#5f7d8c">custom (a beta law)</button>`);
  betaBtn.addEventListener("click", () => {
    proc = "beta"; recast();
    $$("button", bar).forEach((x) => x.classList.toggle("is-active", x.dataset.p === "beta"));
    $("#ex14-arow", content).style.display = $("#ex14-brow", content).style.display = "";
    hl(); drawCanvas(cv);
  });
  bar.appendChild(betaBtn);
  [aCtl, bCtl].forEach((c) => c.input.addEventListener("input", () => { if (proc === "beta") { recast(); drawCanvas(cv); } }));
  nCtl.input.addEventListener("input", () => { recast(); drawCanvas(cv); });
  const cv = mkCanvas(310, (pl, W, H) => {
    const xlim = vsData ? [136, 153.5] : [Math.min(...stds) - 4, Math.max(...stds) + 4];
    const all = [].concat(...copies);
    const scale = vsData ? KETS142.length / Math.max(all.length, 1) : 1;
    /* the bins tighten as the copies multiply, so the shape stays visible */
    const bw = all.length > 20000 ? 0.1 : all.length > 3000 ? 0.25 : BIN_W;
    const nb = Math.ceil((xlim[1] - xlim[0]) / bw);
    /* per-bin, per-standard block composition — the columns carry the mixture */
    const per = stds.map(() => new Array(nb).fill(0));
    copies.forEach((c, si) => c.forEach((v) => {
      const b = Math.floor((v - xlim[0]) / bw);
      if (b >= 0 && b < nb) per[si][b]++;
    }));
    const tot = new Array(nb).fill(0);
    per.forEach((row) => row.forEach((n, b) => { tot[b] += n; }));
    const kctsRaw = vsData ? histCounts(KETS142, xlim[0], xlim[1], BIN_W) : [];
    const binScale = scale * (vsData ? BIN_W / bw : 1);
    const ymax = Math.max(...tot.map((c) => c * binScale), ...kctsRaw, 4,
                          ...curves.map((c) => Math.max(...c.ys) * scale * (vsData ? 1 : BIN_W / bw) / (vsData ? 1 : 1))) * 1.15;
    pl.setup({ xlim, ylim: [0, ymax], mar: [3, 3, 0.8, 0.8] });
    pl.axes({ xat: seqBy(Math.ceil(xlim[0]), xlim[1], 2), yat: pretty0(ymax) });
    pl.axisLabels("grains", vsData ? "weights per half-grain (copies rescaled)" : "copies per bin");
    if (vsData) kctsRaw.forEach((n, i) => { if (n) pl.rect(136 + 0.7 + (i * BIN_W) - 0.0, 0, 136.7 + (i + 1) * BIN_W, n, { col: "rgba(87,93,102,.25)", border: PAL.paper }); });
    /* stacked per-standard columns, each segment in its standard's tint */
    for (let b = 0; b < nb; b++) {
      let y = 0;
      const x0 = xlim[0] + b * bw;
      for (let si = 0; si < stds.length; si++) {
        const n = per[si][b] * binScale;
        if (!n) continue;
        pl.rect(x0, y, x0 + bw, y + n, { col: KTINT[si % KTINT.length], border: null });
        y += n;
      }
    }
    const cscale = scale * (BIN_W / bw) * (vsData ? bw / BIN_W : 1);
    curves.forEach((c, i) => pl.lines(c.xs, c.ys.map((y) => y * scale),
      { col: KCOL[i % KCOL.length], lwd: 1.6 }));
    if (stds.length > 1 || vsData) {
      /* the sum curve, so the fit can be judged */
      const xs14 = curves[0] ? curves[0].xs : [];
      const sum = (x) => curves.reduce((a, c) => {
        const j = Math.round((x - c.xs[0]) / (c.xs[1] - c.xs[0]));
        return a + (c.ys[j] || 0);
      }, 0);
      if (xs14.length) pl.lines(xs14, xs14.map((x) => sum(x) * scale), { col: PAL.ink, lwd: 1.3, lty: 2 });
    }
    if (vsData) {
      const dc = dataCurve(KETS142, xlim, 1);
      pl.lines(dc.xs, dc.ys, { col: PAL.ink, lwd: 1.8 });
    }
    stds.forEach((m, i) => {
      const col = KCOL[i % KCOL.length];
      pl.segments(m, 0, m, ymax * 0.9, { col, lwd: 1.2, lty: 3 });
      drawKetGlyph(pl, m, 0, col, 8);
    });
  });
  $(".plot-container", content).appendChild(cv);
  attachDrag(cv,
    (x) => { let bi = null, bd = 0.7; stds.forEach((m, i) => { const d = Math.abs(x - m); if (d < bd) { bd = d; bi = i; } }); return bi; },
    (i, x) => { stds[i] = Math.max(136.5, Math.min(153, +x.toFixed(1))); recast(); drawCanvas(cv); });
  $("#ex14-data", content).addEventListener("click", (e) => {
    vsData = !vsData;
    e.target.classList.toggle("is-active", vsData);
    $("#ex14-snap", content).style.display = vsData ? "" : "none";
    if (vsData && stds.length === 1) { stds = PEIRCE_STANDARDS.slice(); recast(); }
    drawCanvas(cv);
  });
  $("#ex14-snap", content).addEventListener("click", () => {
    const fit = lawFit(KETS142, stds.length, "gauss", PEIRCE_PE, { init: stds });
    stds = fit.mu.slice(); recast(); drawCanvas(cv);
  });
  $("#ex14-add", content).addEventListener("click", () => {
    if (stds.length >= 4) return;
    stds.push(+(139 + Math.random() * 11).toFixed(1));
    rebuildPerRow(); recast(); drawCanvas(cv);
  });
  $("#ex14-one", content).addEventListener("click", () => { stds = [144.7]; rebuildPerRow(); recast(); drawCanvas(cv); });
  $("#ex14-per", content).addEventListener("input", (e) => {
    perMode = e.target.checked; rebuildPerRow(); recast(); drawCanvas(cv);
  });
  $("#ex14-scatter", content).addEventListener("click", () => {
    stds = stds.map(() => +(138 + Math.random() * 13).toFixed(1));
    if (proc === "beta") {
      aCtl.input.value = (0.8 + Math.random() * 6).toFixed(1); aCtl.input.dispatchEvent(new Event("input"));
      bCtl.input.value = (0.8 + Math.random() * 6).toFixed(1); bCtl.input.dispatchEvent(new Event("input"));
    }
    recast(); drawCanvas(cv);
  });
  hl();
});

registerExample("example-ex16", (box) => {
  box.appendChild(exHeader("Interactive Example: Converging on a gauge", "ex16-content"));
  /* a historical convergence in the O-and-0 spirit: early railways each built
     to their own track gauge; interchange pressure pulled new construction
     toward one standard. Schematic, with the famous gauges labelled. */
  const REGIONS = [
    { name: "Great Western (Brunel)", start: 84.25, rate: 0.10 },   /* 7'0¼" */
    { name: "colliery lines (Stephenson)", start: 56.5, rate: 0.5 },/* 4'8½" */
    { name: "southern US roads", start: 60, rate: 0.16 },           /* 5'0" */
    { name: "Scotch gauge", start: 54, rate: 0.22 },                /* 4'6" */
  ];
  const content = h(`<div id="ex16-content" class="example-content">
    <p>The early railways each built to their own track gauge &mdash; Brunel's Great Western at
      7&thinsp;ft&thinsp;0&frac14;&thinsp;in, the colliery lines at 4&thinsp;ft&thinsp;8&frac12;,
      the Scotch lines at 4&thinsp;ft&thinsp;6, the American South at 5&thinsp;ft. Wagons cannot
      cross a break of gauge, so every junction rewarded whichever gauge the neighbours already
      had. The gold ring marks the gauge the network settled on: not decreed first and obeyed
      after (Parliament's Gauge Act of 1846 followed the traffic), but the <em>general description
      of result</em> that interchange kept selecting, by different routes in different regions.
      Press play; then <span class="click-cue">drag the ring</span> to see the same mechanisms
      find a different settlement &mdash; the mechanisms do not care which gauge wins, only that
      one does.</p>
    <div class="ex-buttonbar">
      <button class="btn btn-primary" id="ex16-play">play</button>
      <button class="btn" id="ex16-step">step</button>
      <button class="btn" id="ex16-reset">reset</button>
      <span class="ex27-lead" id="ex16-gen"></span>
    </div>
    <div class="plot-container"></div>
    <div class="result-box" id="ex16-read"></div>
  </div>`);
  box.appendChild(content);

  let target = 56.5, gen = 0;
  const N = 90;
  const z = [];
  for (let i = 0; i < REGIONS.length * N; i++) z.push(randn());
  let means = REGIONS.map((r) => r.start);
  let trails = means.map((m) => [m]);
  const reset = () => { gen = 0; means = REGIONS.map((r) => r.start); trails = means.map((m) => [m]); };
  const step = () => {
    gen++;
    means = means.map((m, i) => {
      const nm = m + REGIONS[i].rate * (target - m) + 0.35 * randn();
      trails[i].push(nm);
      return nm;
    });
  };
  const inchLab = (v) => {
    const ft = Math.floor(v / 12), inch = v - ft * 12;
    return ft + "\u2032" + (Math.abs(inch) < 0.05 ? "" : Math.round(inch * 2) / 2 + "\u2033");
  };
  const cv = mkCanvas(330, (pl, W, H) => {
    const xlim = [50, 90];
    const sd = 1.1;
    /* each region's spread of lines as they stand this decade — messy, like the
       market example: histogram of frozen draws about the moving mean */
    const binw = 1;
    const counts = REGIONS.map((r, i) => {
      const vals = [];
      for (let j = 0; j < N; j++) vals.push(means[i] + sd * z[i * N + j]);
      return histCounts(vals, xlim[0], xlim[1], binw);
    });
    const ymax = Math.max(...counts.flat()) * 1.35;
    pl.setup({ xlim, ylim: [0, ymax], mar: [3, 1, 0.8, 0.8] });
    pl.axes({ xat: [54, 56.5, 60, 63, 66, 72, 78, 84], xlabels: ["4\u20326", "4\u20328\u00bd", "5\u2032", "5\u20323", "5\u20326", "6\u2032", "6\u20326", "7\u2032"], yat: [] });
    pl.axisLabels("track gauge", "");
    counts.forEach((c, i) => {
      c.forEach((n, b) => {
        if (n) pl.rect(xlim[0] + b * binw, 0, xlim[0] + (b + 1) * binw, n,
                       { col: KTINT[i % KTINT.length], border: null });
      });
      const xs = seqBy(xlim[0], xlim[1], 0.2);
      pl.lines(xs, xs.map((x) => N * binw * dnorm(x, means[i], sd)), { col: KCOL[i % KCOL.length], lwd: 1.5 });
      drawKetGlyph(pl, means[i], 0, KCOL[i % KCOL.length], 7);
      trails[i].forEach((m, t) => pl.points([m], [ymax * (0.82 + 0.035 * i)],
        { col: KCOL[i % KCOL.length], cex: 0.3 + 0.4 * t / Math.max(trails[i].length, 1) }));
    });
    const c = pl.ctx, TX = pl.X(target), TY = pl.Y(0);
    c.save(); c.strokeStyle = PAL.accent4; c.lineWidth = 3;
    c.beginPath(); c.arc(TX, TY - 6, 11, 0, 2 * Math.PI); c.stroke(); c.restore();
    pl.segments(target, 0, target, ymax * 0.78, { col: PAL.accent4, lwd: 1, lty: 3 });
    pl.text(target, ymax * 0.97, "the settlement: " + inchLab(target), { col: PAL.accent4, cex: 0.85 });
    pl.legend("topright", { legend: REGIONS.map((r) => r.name),
      col: REGIONS.map((_, i) => KCOL[i % KCOL.length]),
      lwd: REGIONS.map(() => 2), cex: 0.72 });
    $("#ex16-gen", content).textContent = "year " + (1830 + gen * 4);
    const near = means.every((m) => Math.abs(m - target) < 1.6);
    const read = $("#ex16-read");
    if (read) read.innerHTML = gen === 0
      ? `<p>Four practices, four gauges, four mechanisms of correction &mdash; conversion costs,
         through-traffic, rolling-stock markets, statute.</p>`
      : near
      ? `<p>All four now cluster about the ring. The particular ways differed &mdash; the Great
         Western fought for decades, the collieries never had to move &mdash; and the general
         character of the result is the same. Drag the ring and play again: the same mechanisms
         settle on whatever gauge the network happens to reward, which is what makes the cause
         final rather than efficient.</p>`
      : `<p>${1830 + gen * 4}: conversion under way, each region on its own path.</p>`;
  });
  $(".plot-container", content).appendChild(cv);
  /* dragging the ring changes the settlement only — the regions keep their
     histories and start converging toward the new target from where they are */
  attachDrag(cv, () => 0, (i, x) => { target = Math.max(51, Math.min(88, +x.toFixed(1))); drawCanvas(cv); });
  let timer = null;
  const playBtn = $("#ex16-play", content);
  playBtn.addEventListener("click", () => {
    if (timer) { clearInterval(timer); timer = null; playBtn.textContent = "play"; return; }
    playBtn.textContent = "pause";
    timer = setInterval(() => {
      if (gen > 24) { clearInterval(timer); timer = null; playBtn.textContent = "play"; return; }
      step(); drawCanvas(cv);
    }, 240);
  });
  $("#ex16-step", content).addEventListener("click", () => { step(); drawCanvas(cv); });
  $("#ex16-reset", content).addEventListener("click", () => {
    if (timer) { clearInterval(timer); timer = null; playBtn.textContent = "play"; }
    reset(); drawCanvas(cv);
  });
});
</script>
