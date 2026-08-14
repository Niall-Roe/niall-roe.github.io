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
    /* gradient fills that stay under their own curves: up to the lower curve
       the two blend by their shares; from there to the taller curve only the
       taller one's colour continues */
    for (let k = 0; k < xs.length - 1; k++) {
      const x = xs[k], a = fA[k], b = fB[k];
      if (a <= 0 && b <= 0) continue;
      const lo = Math.min(a, b), hi = Math.max(a, b);
      if (lo > 0) pl.rect(x, 0, xs[k + 1], lo, { col: mixCol([KCOL[1], KCOL[2]], [a, b], 0.30), border: null });
      if (hi > lo) pl.rect(x, lo, xs[k + 1], hi,
        { col: a > b ? "rgba(74,124,89,.22)" : "rgba(154,123,63,.24)", border: null });
    }
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
      distributed given different processes of manufacture. Each button below generates the curve
      described above. Different manufacturing processes would tend to produce different kinds of
      errors, and different distributions. When a button is selected, the corresponding account is
      highlighted above. See if you can fit the data with these different distributions.</p>
    <div style="display:flex;align-items:flex-start;gap:14px;">
      <div class="ex-buttonbar" id="ex14-btns" style="flex:1;"></div>
      <img id="ex14-sketch" alt="Peirce's manuscript sketch of this curve" style="display:none;max-height:52px;margin-top:2px;border:1px solid var(--rule-soft);">
    </div>
    <div class="ex-buttonbar">
      <button class="btn btn-sm" id="ex14-add">add a standard</button>
      <button class="btn btn-sm" id="ex14-one">back to one</button>
      <button class="btn btn-sm" id="ex14-scatter">scatter everything</button>
      <button class="btn btn-sm btn-warning" id="ex14-peirceset">set to Peirce's data</button>
      <label class="ctl checkbox" style="margin:0;display:inline-flex;"><label>
        <input type="checkbox" id="ex14-per"> each standard its own method</label></label>
      <span style="margin-left:auto"></span>
      <button class="btn btn-sm btn-warning" id="ex14-data">against the real kets</button>
      <button class="btn btn-sm btn-success" id="ex14-snap" style="display:none">snap to best fit</button>
    </div>
    <div class="ex-buttonbar" id="ex14-perrow" style="display:none"></div>
    <div class="row"><div class="col col-4" id="ex14-nrow"></div>
      <div class="col col-4" id="ex14-arow" style="display:none"></div>
      <div class="col col-4" id="ex14-brow" style="display:none"></div></div>
    <div class="plot-container"></div>
  </div>`);
  box.appendChild(content);
  let stds = [144.7];
  let proc = "skillful", copies = [], curves = [], vsData = false;
  let perMode = false, perProc = ["skillful"];
  let perN = null;      /* per-standard copy counts; null = the slider for all */
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
  const sCtl = ctlSlider("spread (probable error, grains)", "k4", 0.2, 1.5, 0.025, PEIRCE_PE,
                         (v) => v.toFixed(3));
  const aCtl = ctlSlider("beta &alpha;", "k2", 0.6, 8, 0.2, 2, (v) => v.toFixed(1));
  const bCtl = ctlSlider("beta &beta;", "k3", 0.6, 8, 0.2, 2, (v) => v.toFixed(1));
  $("#ex14-nrow", content).appendChild(nCtl.row);
  $("#ex14-nrow", content).appendChild(sCtl.row);
  sCtl.input.addEventListener("input", () => { recast(); drawCanvas(cv); });
  $("#ex14-arow", content).appendChild(aCtl.row);
  $("#ex14-brow", content).appendChild(bCtl.row);
  const NC = () => Math.round(Math.pow(10, nCtl.get()));
  const drawOne = (m) => proc === "beta"
    ? (() => { /* rejection-sample the reshaped beta */
        const half = 2.5 * sCtl.get(), cap = 4 / (2 * half);
        for (let i = 0; i < 400; i++) {
          const x = m - half + 2 * half * Math.random();
          if (Math.random() * cap < lawDens("beta", x, m, sCtl.get(), { a: aCtl.get(), b: bCtl.get() })) return x;
        }
        return m;
      })()
    : PROCESSES[proc].draw(m, sCtl.get());
  const curveOf = (m, n) => proc === "beta"
    ? (() => { const xs = seqBy(m - 4, m + 4, 0.05);
        return { xs, ys: xs.map((x) => n * BIN_W * lawDens("beta", x, m, sCtl.get(), { a: aCtl.get(), b: bCtl.get() })) }; })()
    : processCurve(proc, m, sCtl.get(), n);
  const drawOneAs = (m, pk) => PROCESSES[pk].draw(m, sCtl.get());
  const recast = () => {
    copies = []; curves = [];
    stds.forEach((m, si) => {
      const pk = perMode ? (perProc[si] || "skillful") : null;
      const n = perN ? perN[si] : NC();
      const c = [];
      for (let i = 0; i < n; i++) c.push(pk ? drawOneAs(m, pk) : drawOne(m));
      copies.push(c);
      curves.push(pk ? processCurve(pk, m, sCtl.get(), n) : curveOf(m, n));
    });
  };
  recast();
  const PCOl = (k) => (k === "beta" ? "#5f7d8c" : KCOL[PKEYS.indexOf(k) % KCOL.length]);
  const SK = { topheavy: "IMG_SK_RECT", topheavyVar: "IMG_SK_FLEX" };
  const showSketch = () => {
    const el = $("#ex14-sketch", content);
    if (!el) return;
    if (SK[proc]) { el.src = window[SK[proc]] || (SK[proc] === "IMG_SK_RECT" ? IMG_SK_RECT : IMG_SK_FLEX); el.style.display = ""; }
    else el.style.display = "none";
  };
  const hl = () => {
    showSketch();
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
  nCtl.input.addEventListener("input", () => { perN = null; recast(); drawCanvas(cv); });
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
    const fit = emFit(KETS142, stds.length, { init: stds });   /* free spread */
    stds = fit.mu.slice();
    sCtl.input.value = Math.max(0.2, Math.min(1.5, +(fit.sd * 0.6745).toFixed(3)));
    sCtl.input.dispatchEvent(new Event("input"));
    recast(); drawCanvas(cv);
  });
  $("#ex14-add", content).addEventListener("click", () => {
    if (stds.length >= 4) return;
    stds.push(+(139 + Math.random() * 11).toFixed(1));
    rebuildPerRow(); recast(); drawCanvas(cv);
  });
  $("#ex14-one", content).addEventListener("click", () => { stds = [144.7]; perN = null; rebuildPerRow(); recast(); drawCanvas(cv); });
  $("#ex14-peirceset", content).addEventListener("click", () => {
    /* his supposal exactly: five standards at his positions, each with its own
       method to choose, and the copies in his printed proportions 36/25/26/23/34
       (144 in all — his count of the weights) */
    stds = PEIRCE_STANDARDS.slice();
    perMode = true; $("#ex14-per", content).checked = true;
    perProc = stds.map((_, i) => perProc[i] || "skillful");
    perN = [36, 25, 26, 23, 34];
    sCtl.input.value = PEIRCE_PE; sCtl.input.dispatchEvent(new Event("input"));
    if (!vsData) { vsData = true; $("#ex14-data", content).classList.add("is-active"); $("#ex14-snap", content).style.display = ""; }
    rebuildPerRow(); recast(); drawCanvas(cv);
  });
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
  box.appendChild(exHeader("Interactive Example: Directions and destinations", "ex16-content"));
  /* the directions example: efficient causation follows the instructions
     wherever they lead; final causation reaches the address however it can */
  const GRID = 11, CELL = 1;
  const content = h(`<div id="ex16-content" class="example-content">
    <p>Here we contrast efficient and final causation. Efficient causation works by brute
      compulsion regardless of where the compulsions lead you. Final causation works by leading to
      an end, regardless of the brute compulsions that got you there. Here you can see this with an
      analogy to giving directions. Efficient causation is like brute force directions &mdash;
      &ldquo;go one block north, one block east, &hellip; etc.&rdquo; One can successfully follow
      those directions regardless of where they lead. Final causation is like &ldquo;arrive at
      12th and main.&rdquo; We do not care which route you take, only that you satisfy a general
      outcome.</p>
    <div class="mode-tabs">
      <button class="mode-tab active" data-m="eff">efficient causation</button>
      <button class="mode-tab" data-m="fin">final causation</button>
    </div>
    <div class="ex-buttonbar">
      <button class="btn btn-primary" id="ex16-play">play</button>
      <button class="btn" id="ex16-scatter">scatter the starting points</button>
      <button class="btn" id="ex16-reset">reset</button>
      <label class="ctl" id="ex16-dirlab" style="margin:0 0 0 auto;display:inline-flex;align-items:center;gap:6px;">
        the directions <input id="ex16-dirs" type="text" value="2N, 1E, 1S, 1E" size="14"
        style="font:inherit;padding:2px 6px;">
        <span id="ex16-compass" style="display:inline-flex;gap:3px;">
          <button class="btn btn-sm" data-d="N">N&uarr;</button>
          <button class="btn btn-sm" data-d="E">E&rarr;</button>
          <button class="btn btn-sm" data-d="S">S&darr;</button>
          <button class="btn btn-sm" data-d="W">W&larr;</button>
          <button class="btn btn-sm" data-d="">clear</button>
        </span></label>
    </div>
    <div class="plot-container"></div>
    <div class="note-block" id="ex16-read"></div>
  </div>`);
  box.appendChild(content);

  let DIRS = [[0, 1], [0, 1], [1, 0], [0, -1], [1, 0]];   /* 2 N, 1 E, 1 S, 1 E */
  let DIRWORDS = "two blocks north, one east, one south, one east";
  let mode = "eff";
  let target = [8, 7];
  let starts = [[1, 1], [2, 6], [5, 2], [8, 1]];
  let walkers = [], step = 0, timer = null;
  const STYLES = ["avenue", "wander", "corner", "bird"];

  function parseDirs(s) {
    const out = [], words = [];
    const re = /(\d*)\s*([NSEW])/gi;
    const D = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0] };
    let m;
    while ((m = re.exec(s))) {
      const n = Math.max(1, Math.min(9, parseInt(m[1] || "1", 10)));
      for (let i = 0; i < n; i++) out.push(D[m[2].toUpperCase()]);
      words.push(n + m[2].toUpperCase());
    }
    return out.length ? { dirs: out, words: words.join(", ") } : null;
  }
  /* how far the instructed route strays from its start, so starting points can
     be kept where the whole walk stays on the map */
  function routeBounds() {
    let x = 0, y = 0, minx = 0, maxx = 0, miny = 0, maxy = 0;
    DIRS.forEach(([dx, dy]) => {
      x += dx; y += dy;
      minx = Math.min(minx, x); maxx = Math.max(maxx, x);
      miny = Math.min(miny, y); maxy = Math.max(maxy, y);
    });
    return { x0: Math.max(0, -minx), x1: Math.min(GRID - 1, GRID - 1 - maxx),
             y0: Math.max(0, -miny), y1: Math.min(GRID - 1, GRID - 1 - maxy) };
  }
  function clampStarts() {
    const b = routeBounds();
    starts = starts.map(([x, y]) => [Math.max(b.x0, Math.min(b.x1, x)),
                                     Math.max(b.y0, Math.min(b.y1, y))]);
  }
  function reset() {
    step = 0;
    walkers = starts.map((s, i) => ({ pos: s.slice(), trail: [s.slice()], style: STYLES[i % 4], done: false }));
    drawCanvas(cv); read();
  }
  function scatter() {
    const b = routeBounds();
    starts = starts.map(() => [b.x0 + Math.floor(Math.random() * Math.max(1, b.x1 - b.x0 + 1)),
                               b.y0 + Math.floor(Math.random() * Math.max(1, b.y1 - b.y0 + 1))]);
    reset();
  }
  function advance() {
    step++;
    walkers.forEach((wk, i) => {
      if (mode === "eff") {
        if (step > DIRS.length) { wk.done = true; return; }
        if (wk.style === "bird") {
          /* the bird does not obey: it flies straight to where the directions
             would have brought it, arriving with the rest */
          const net = DIRS.reduce((a, d) => [a[0] + d[0], a[1] + d[1]], [0, 0]);
          const s0 = wk.trail[0], t = step / DIRS.length;
          wk.pos = [s0[0] + net[0] * t, s0[1] + net[1] * t];
        } else {
          wk.pos = [wk.pos[0] + DIRS[step - 1][0], wk.pos[1] + DIRS[step - 1][1]];
        }
        wk.trail.push(wk.pos.slice());
        if (step >= DIRS.length) wk.done = true;
        return;
      }
      if (wk.done) return;
      const [tx, ty] = target, [x, y] = wk.pos;
      if (x === tx && y === ty) { wk.done = true; return; }
      let nx = x, ny = y;
      if (wk.style === "bird") {
        /* straight over the rooftops, a fraction of the diagonal per step */
        const dx = tx - x, dy = ty - y, L = Math.hypot(dx, dy);
        const stepLen = Math.min(1.4, L);
        nx = x + dx / L * stepLen; ny = y + dy / L * stepLen;
        if (Math.hypot(tx - nx, ty - ny) < 0.4) { nx = tx; ny = ty; }
      } else if (wk.style === "avenue") {
        /* all the easting first, then the northing */
        if (x !== tx) nx = x + Math.sign(tx - x);
        else ny = y + Math.sign(ty - y);
      } else if (wk.style === "corner") {
        /* alternate: a staircase toward the address */
        if ((step % 2 === 0 && x !== tx) || y === ty) nx = x + Math.sign(tx - x);
        else ny = y + Math.sign(ty - y);
      } else {
        /* wander: usually toward, sometimes astray */
        if (Math.random() < 0.3) {
          if (Math.random() < 0.5 && x > 0 && x < GRID - 1) nx = x + (Math.random() < 0.5 ? 1 : -1);
          else if (y > 0 && y < GRID - 1) ny = y + (Math.random() < 0.5 ? 1 : -1);
        } else if (Math.abs(tx - x) > Math.abs(ty - y)) nx = x + Math.sign(tx - x);
        else if (y !== ty) ny = y + Math.sign(ty - y);
        else nx = x + Math.sign(tx - x);
      }
      wk.pos = [nx, ny];
      wk.trail.push(wk.pos.slice());
      if (Math.abs(nx - target[0]) < 0.01 && Math.abs(ny - target[1]) < 0.01) wk.done = true;
    });
    drawCanvas(cv); read();
    if (walkers.every((wk) => wk.done) && timer) {
      clearInterval(timer); timer = null;
      $("#ex16-play", content).textContent = "play";
    }
  }
  const cv = mkCanvas(340, (pl, W, H) => {
    pl.setup({ xlim: [-0.7, GRID - 0.3], ylim: [-0.7, GRID - 0.3], mar: [0.5, 0.5, 0.5, 0.5], ext: false });
    /* the streets */
    for (let i = 0; i < GRID; i++) {
      pl.segments(i, 0, i, GRID - 1, { col: PAL.ruleSoft, lwd: 1 });
      pl.segments(0, i, GRID - 1, i, { col: PAL.ruleSoft, lwd: 1 });
    }
    if (mode === "fin") {
      /* the address: a gold ring on its block */
      const c = pl.ctx, TX = pl.X(target[0]), TY = pl.Y(target[1]);
      c.save(); c.strokeStyle = PAL.accent4; c.lineWidth = 3;
      c.beginPath(); c.arc(TX, TY, 11, 0, 2 * Math.PI); c.stroke(); c.restore();
      pl.text(target[0], target[1] + 0.55, "the address", { col: PAL.accent4, cex: 0.85 });
    }
    walkers.forEach((wk, i) => {
      const col = KCOL[i % KCOL.length];
      pl.lines(wk.trail.map((p) => p[0]), wk.trail.map((p) => p[1]),
               { col, lwd: 1.7, lty: wk.style === "bird" ? 2 : 1 });
      pl.points([wk.trail[0][0]], [wk.trail[0][1]], { col, cex: 1, pch: 21 });
      pl.points([wk.pos[0]], [wk.pos[1]], { col, cex: 1.6 });
      if (wk.style === "bird") pl.text(wk.pos[0], wk.pos[1] + 0.45, "the bird", { col, cex: 0.72 });
    });
  });
  $(".plot-container", content).appendChild(cv);
  /* in final mode a click anywhere on the map sets the address */
  cv.addEventListener("pointerdown", (ev) => {
    if (mode !== "fin") return;
    const r = cv.getBoundingClientRect(), pl = cv._pl;
    if (!pl) return;
    const gx = Math.round(pl.invX(ev.clientX - r.left)), gy = Math.round(pl.invY(ev.clientY - r.top));
    if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) { target = [gx, gy]; walkers.forEach((wk) => { wk.done = false; }); drawCanvas(cv); }
  });
  function read() {
    const done = walkers.filter((wk) => wk.done).length;
    const el = $("#ex16-read", content);
    if (!el) return;
    if (mode === "eff") {
      el.innerHTML = step === 0
        ? `When you press play each walker will follow the directions &mdash; ${DIRWORDS} &mdash;
           from its own starting point.`
        : step >= DIRS.length
        ? `The walkers obeyed the directions. Having started in different places they have ended up
           in different places. The bird ended up in the same place they would have gone had they
           followed the directions&hellip; but they did not.`
        : `Step ${step} of ${DIRS.length}: each is following the instructions.`;
    } else {
      el.innerHTML = step === 0
        ? `When you press play, each agent makes their way to the indicated address. Click
           anywhere on the map to move the address.`
        : done === walkers.length
        ? `All four have arrived at the address. Some of their routes may have merged, but the
           routes themselves not really important.`
        : `${done} of ${walkers.length} arrived; the routes converge only as they close in.`;
    }
  }
  $("#ex16-play", content).addEventListener("click", (e) => {
    if (timer) { clearInterval(timer); timer = null; e.target.textContent = "play"; return; }
    /* pressing play once the walk is over sends them out again from their starts */
    if (walkers.length && walkers.every((wk) => wk.done)) reset();
    e.target.textContent = "pause";
    timer = setInterval(advance, 340);
  });
  $("#ex16-scatter", content).addEventListener("click", scatter);
  $("#ex16-reset", content).addEventListener("click", () => {
    if (timer) { clearInterval(timer); timer = null; $("#ex16-play", content).textContent = "play"; }
    reset();
  });
  function applyDirs() {
    const input = $("#ex16-dirs", content);
    const p = parseDirs(input.value);
    if (!p) { input.value = "2N, 1E, 1S, 1E"; return applyDirs(); }
    input.value = p.words;
    DIRS = p.dirs; DIRWORDS = p.words;
    if (timer) { clearInterval(timer); timer = null; $("#ex16-play", content).textContent = "play"; }
    clampStarts(); reset();
  }
  $("#ex16-dirs", content).addEventListener("change", applyDirs);
  $$("#ex16-compass button", content).forEach((b) => b.addEventListener("click", () => {
    const input = $("#ex16-dirs", content);
    /* clear empties the box; the walk keeps its last route until a new leg is added */
    if (!b.dataset.d) { input.value = ""; return; }
    input.value = (input.value.trim() ? input.value.trim().replace(/,?\s*$/, ", ") : "") + "1" + b.dataset.d;
    applyDirs();
  }));
  $$(".mode-tab", content).forEach((b) => b.addEventListener("click", () => {
    $$(".mode-tab", content).forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); mode = b.dataset.m;
    $("#ex16-dirlab", content).style.display = mode === "eff" ? "" : "none";
    if (timer) { clearInterval(timer); timer = null; $("#ex16-play", content).textContent = "play"; }
    reset();
  }));
  reset();
});
</script>
