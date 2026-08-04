<script>
/* ==========================================================================
   EXAMPLE 1 — An observation is the unknown quantity plus an error

   Peirce's sentence is the model itself: what is recorded depends partly on
   the quantity wanted and partly on circumstances that cannot be separately
   accounted for, so the record is the sum of the two. Written out that is
   O = T + e, and the rest of the paper is about the second term. That
   statement sits at the top of the example and is filled in as observations
   arrive.

   Two switches do the arguing. Hide the unknown quantity and nothing in the
   data changes — same dots, same places — which is the observer's actual
   position: T and e are never observed apart, only their sum. Show the mean
   instead and the third term becomes the residual, O - xbar, which is what is
   actually available in place of the error nobody can see.
   ========================================================================*/
registerExample("example-ex1", (box) => {
  box.appendChild(exHeader("Interactive Example: The Quantity Observed and the Quantity Wanted", "ex1-content"));
  const content = h(`<div id="ex1-content" class="example-content">
    <!-- TO EDIT (Niall): this opening paragraph is a placeholder of mine, not
         settled text. It carries the colour key — unknown quantity green,
         accidental circumstances red, quantity observed blue — so a rewrite
         should keep those three spans, but the wording and the choice of the
         transit instrument as the running example are both open. -->
    <p>A star crosses the wire of a transit instrument at some definite moment. That moment is the
      <span class="k-T">unknown quantity</span>. What gets written down is the moment the observer
      pressed the key, which depends on when the star really crossed and also on the state of his
      nerves, the seeing, the instrument &mdash; the <span class="k-e">accidental circumstances</span>.
      The number written down is the <span class="k-O">quantity observed</span>.</p>
    <div id="ex1-ladder"></div>
    <div class="row">
      <div class="col col-4">
        <div id="ex1-controls"></div>
        <div class="ex-buttonbar">
          <button class="btn btn-primary" data-act="one">Observe once</button>
          <button class="btn btn-primary" data-act="fifty">Observe fifty</button>
          <button class="btn btn-warning btn-sm" data-act="clear">Clear</button>
        </div>
        <div id="ex1-readout"></div>
      </div>
      <div class="col col-8">
        <div class="plot-container" id="ex1-plot1"></div>
        <div class="plot-container" id="ex1-plot2"></div>
      </div>
    </div>
  </div>`);
  box.appendChild(content);

  const XLO = 4.4, XHI = 5.6;          // the fixed window, so the picture never jumps
  let obs = [];                        // every quantity observed, in order

  const ctl = $("#ex1-controls", content);
  ctl.appendChild(slider("ex1_T", "The unknown quantity, T (seconds):", 4.7, 5.3, 5.0, 0.005,
    (v) => v.toFixed(3), "k3"));
  ctl.appendChild(slider("ex1_s", "The reach of the accidental circumstances:", 0.005, 0.15, 0.06, 0.005,
    (v) => "±" + v.toFixed(3) + " s", "k2"));
  ctl.appendChild(checkbox("ex1_showT", "Show the unknown quantity", true));
  ctl.appendChild(checkbox("ex1_showM", "Show the estimate: the mean of the series", false));

  const T = () => num("ex1_T"), S = () => num("ex1_s");
  const showT = () => chk("ex1_showT"), showM = () => chk("ex1_showM");
  const meanOf = () => (obs.length ? obs.reduce((s, r) => s + r.o, 0) / obs.length : null);

  function observe(k) {
    for (let i = 0; i < k; i++) {
      const e = rnorm1(0, S());
      // y is kept with the observation so the cloud is cumulative: a point
      // stays where it was put, and the pile darkens where they overlap
      obs.push({ e, o: T() + e, T: T(), y: 0.28 + 0.34 * Math.random() });
    }
    if (obs.length > 4000) obs = obs.slice(-4000);
  }

  /* ---------------------------------------------------------- the line ---- */
  const line = mkCanvas(180, (pl) => {
    const m = meanOf();
    pl.setup({ xlim: [XLO, XHI], ylim: [0, 1.12], mar: [2.6, 1.2, 2.2, 1.2], ext: false });
    pl.abline({ h: 0, col: PAL.inkFaint });
    const xt = [4.4, 4.6, 4.8, 5.0, 5.2, 5.4, 5.6];
    xt.forEach((v) => pl.segments(v, 0, v, 0.045, { col: PAL.inkFaint }));
    pl.axisPlain(1, xt, xt.map((v) => v.toFixed(1)));
    pl.axisLabels("The quantity, in seconds", "");
    pl.clip(true);

    if (showT()) {
      pl.abline({ v: T(), col: PAL.accent3, lwd: 2 });
      pl.text(T(), 1.03, "T", { col: PAL.accent3, cex: 0.9, font: 2 });
    }
    if (showM() && m !== null) {
      pl.abline({ v: m, col: PAL.accent4, lwd: 2, lty: 2 });
      pl.text(m, 0.90, "x̄", { col: PAL.accent4, cex: 0.9, font: 2 });
    }

    // the cloud: every observation kept, drawn faint, so it darkens where the
    // observations pile up rather than being redrawn from the last few
    obs.forEach((r) => {
      pl.points([r.o], [r.y], { col: "rgba(47,111,159,0.20)", cex: 1.0 });
    });
    const last = obs[obs.length - 1];
    if (last) pl.points([last.o], [last.y], { col: PAL.accent, cex: 1.5 });

    // the newest observation taken apart, against whichever line is on show
    if (last && showT()) {
      bracket(pl, last.T, last.o, 0.18, 0.09, PAL.accent2,
        "ε = " + (last.e < 0 ? "−" : "+") + fmt(Math.abs(last.e), 3));
    }
    if (last && showM() && m !== null) {
      const r = last.o - m;
      bracket(pl, m, last.o, 0.76, 0.87, PAL.accent4,
        "r = " + (r < 0 ? "−" : "+") + fmt(Math.abs(r), 3));
    }
    pl.clip(false);
    pl.title(showT() ? "Each observation is the unknown quantity, displaced"
                     : "What the observer has: the record, and nothing else", { cex: 0.95 });
  });
  $("#ex1-plot1", content).appendChild(line);

  function bracket(pl, x0, x1, yBar, yLab, col, label) {
    pl.segments(x0, yBar, x1, yBar, { col, lwd: 2 });
    pl.segments(x0, yBar - 0.04, x0, yBar + 0.04, { col, lwd: 2 });
    pl.segments(x1, yBar - 0.04, x1, yBar + 0.04, { col, lwd: 2 });
    pl.text((x0 + x1) / 2, yLab, label, { col, cex: 0.78 });
  }

  /* ------------------------------------------------------ they pile up ---- */
  const hist = mkCanvas(210, (pl) => {
    const NB = 40, w = (XHI - XLO) / NB;
    const bins = new Array(NB).fill(0);
    obs.forEach((r) => {
      const b = Math.floor((r.o - XLO) / w);
      if (b >= 0 && b < NB) bins[b]++;
    });
    const top = Math.max(4, niceMax(Math.max(...bins), 4));
    pl.setup({ xlim: [XLO, XHI], ylim: [0, top], mar: [3, 3.4, 1.8, 1.2] });
    pl.axes({ nx: 7 });
    pl.box();
    pl.axisLabels("The quantity observed", "How many");
    pl.clip(true);
    for (let b = 0; b < NB; b++) {
      if (!bins[b]) continue;
      pl.rect(XLO + b * w, 0, XLO + (b + 1) * w, bins[b],
        { col: "rgba(47,111,159,0.55)", border: "#24587d" });
    }
    if (showT()) pl.abline({ v: T(), col: PAL.accent3, lwd: 2 });
    const m = meanOf();
    if (showM() && m !== null) pl.abline({ v: m, col: PAL.accent4, lwd: 2, lty: 2 });
    pl.clip(false);
    pl.title("The series so far", { cex: 0.95 });
  });
  $("#ex1-plot2", content).appendChild(hist);

  /* ------------------------------------------------------- the ladder ----
     The operators belong to the statement, not to each way of writing it, so
     they are set once in the top row and the rows beneath line up under them. */
  function ladder() {
    const last = obs[obs.length - 1], m = meanOf();
    const residual = last && m !== null ? last.o - m : null;
    // with the unknown quantity hidden, what stands in for it is the estimate,
    // and what stands in for the error is the residual
    const asResidual = !showT() && showM() && residual !== null;

    const words = asResidual
      ? [`<span class="k-O">the quantity observed</span>`,
         `<span class="k-est">the estimate</span>`,
         `<span class="k-est">the residual</span>`]
      : [`<span class="k-O">the quantity observed</span>`,
         `<span class="k-T">the unknown quantity</span>`,
         `<span class="k-e">the accidental circumstances</span>`];
    const syms = asResidual
      ? [`<span class="k-O">O<sub>i</sub></span>`, `<span class="k-est">x̄</span>`,
         `<span class="k-est">r<sub>i</sub></span>`]
      : [`<span class="k-O">O<sub>i</sub></span>`, `<span class="k-T">T</span>`,
         `<span class="k-e">&epsilon;<sub>i</sub></span>`];

    let nums;
    if (!last) nums = ["&mdash;", "&mdash;", "&mdash;"];
    else if (asResidual)
      nums = [fmt(last.o, 3), fmt(m, 3), (residual < 0 ? "−" : "") + fmt(Math.abs(residual), 3)];
    else if (showT())
      nums = [fmt(last.o, 3), fmt(last.T, 3), (last.e < 0 ? "−" : "") + fmt(Math.abs(last.e), 3)];
    else nums = [fmt(last.o, 3), "?", "?"];

    const kind = asResidual ? ["k-O", "k-est", "k-est"] : ["k-O", "k-T", "k-e"];
    const numRow = nums.map((v, i) => `<span class="${kind[i]}">${v}</span>`);

    return `<div class="ex-ladder">
      <div class="lad-row lad-words">
        ${words[0]}<span class="lad-op">=</span>${words[1]}<span class="lad-op">+</span>${words[2]}
      </div>
      <div class="lad-row lad-sym">
        ${syms[0]}<span class="lad-op"></span>${syms[1]}<span class="lad-op"></span>${syms[2]}
      </div>
      <div class="lad-row lad-num">
        ${numRow[0]}<span class="lad-op"></span>${numRow[1]}<span class="lad-op"></span>${numRow[2]}
      </div>
    </div>`;
  }

  function update() {
    const n = obs.length, m = meanOf();

    $("#ex1-readout", content).innerHTML = n
      ? `<div class="key-insight" style="margin-top:0;">
           <p style="margin-bottom:6px;"><strong>${bigmark(n)}</strong>
             observation${n === 1 ? "" : "s"} taken.</p>
           <p style="margin-bottom:0;">The mean of the series is <strong>${fmt(m, 4)}</strong>.
             ${showT() ? `The unknown quantity is ${fmt(T(), 3)}, so the mean is out by
               ${fmt(Math.abs(m - T()), 4)}.`
              : `Whether that is close to the unknown quantity there is, at this point,
                 no way to say.`}</p></div>`
      : `<p class="help-text">Nothing observed yet.</p>`;

    $("#ex1-ladder", content).innerHTML = ladder();

    drawCanvas(line);
    drawCanvas(hist);
  }

  content.addEventListener("input", update);
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "one") observe(1);
    else if (a === "fifty") observe(50);
    else if (a === "clear") obs = [];
    else return;
    update();
  });

  observe(1);
  update();
});
</script>
