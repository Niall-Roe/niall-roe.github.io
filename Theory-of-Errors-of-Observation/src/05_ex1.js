<script>
/* ==========================================================================
   EXAMPLE 1 — An observation is the unknown quantity plus an error

   Peirce's sentence is the model itself: what is recorded depends partly on
   the quantity wanted and partly on circumstances that cannot be separately
   accounted for, so the record is the sum of the two. Written out that is
   O = T + e, and the rest of the paper is about the second term.

   The switch that matters here is "show the unknown quantity". With it on you
   can see each observation split into its parts. With it off you have what the
   observer actually has: a row of dots and nothing else. Nothing in the data
   changes when it is turned off, which is the point — T and e are never
   observed apart, only their sum.
   ========================================================================*/
registerExample("example-ex1", (box) => {
  box.appendChild(exHeader("Interactive Example: The Quantity Observed and the Quantity Wanted", "ex1-content"));
  const content = h(`<div id="ex1-content" class="example-content">
    <p>A star crosses the wire of a transit instrument at some definite moment. That moment is the
      <span class="k-T">unknown quantity</span>. What gets written down is the moment the observer
      pressed the key, which depends on when the star really crossed and also on the state of his
      nerves, the seeing, the instrument &mdash; the <span class="k-e">accidental circumstances</span>.
      The number written down is the <span class="k-O">quantity observed</span>.</p>
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
    <div id="ex1-ladder"></div>
    <div id="ex1-note"></div>
  </div>`);
  box.appendChild(content);

  const XLO = 4.4, XHI = 5.6;          // the fixed window, so the picture never jumps
  let obs = [];                         // every quantity observed, in order

  const ctl = $("#ex1-controls", content);
  ctl.appendChild(slider("ex1_T", "The unknown quantity, T (seconds):", 4.7, 5.3, 5.0, 0.005,
    (v) => v.toFixed(3), "k3"));
  ctl.appendChild(slider("ex1_s", "The reach of the accidental circumstances:", 0.005, 0.15, 0.06, 0.005,
    (v) => "±" + v.toFixed(3) + " s", "k2"));
  ctl.appendChild(checkbox("ex1_showT", "Show the unknown quantity", true));

  const T = () => num("ex1_T"), S = () => num("ex1_s"), showT = () => chk("ex1_showT");

  function observe(k) {
    for (let i = 0; i < k; i++) {
      const e = rnorm1(0, S());
      obs.push({ e, o: T() + e, T: T() });
    }
    if (obs.length > 400) obs = obs.slice(-400);
  }

  /* ---------------------------------------------------------- the line ---- */
  const line = mkCanvas(168, (pl) => {
    pl.setup({ xlim: [XLO, XHI], ylim: [0, 1.12], mar: [2.6, 1.2, 2.2, 1.2], ext: false });
    pl.abline({ h: 0, col: PAL.inkFaint });
    const xt = [4.4, 4.6, 4.8, 5.0, 5.2, 5.4, 5.6];
    xt.forEach((v) => pl.segments(v, 0, v, 0.045, { col: PAL.inkFaint }));
    pl.axisPlain(1, xt, xt.map((v) => v.toFixed(1)));
    pl.axisLabels("The quantity, in seconds", "");
    pl.clip(true);

    if (showT()) {
      pl.abline({ v: T(), col: PAL.accent3, lwd: 2 });
      pl.text(T(), 0.94, "T", { col: PAL.accent3, cex: 0.9, font: 2 });
    }

    // every observation, most recent last and largest
    const show = obs.slice(-160);
    show.forEach((r, i) => {
      const fresh = i === show.length - 1;
      pl.points([r.o], [0.42 + 0.16 * Math.sin(i * 2.399)], {
        col: fresh ? PAL.accent : "rgba(47,111,159,0.42)", cex: fresh ? 1.5 : 1.0
      });
    });

    // the newest one taken apart, if the truth is on show
    const last = obs[obs.length - 1];
    if (last && showT()) {
      pl.segments(last.T, 0.20, last.o, 0.20, { col: PAL.accent2, lwd: 2 });
      pl.segments(last.o, 0.16, last.o, 0.24, { col: PAL.accent2, lwd: 2 });
      pl.segments(last.T, 0.16, last.T, 0.24, { col: PAL.accent2, lwd: 2 });
      pl.text((last.T + last.o) / 2, 0.09, "ε = " + (last.e >= 0 ? "+" : "") + fmt(last.e, 3),
        { col: PAL.accent2, cex: 0.78 });
    }
    pl.clip(false);
    pl.title(showT() ? "Each observation is the unknown quantity, displaced"
                     : "What the observer has: the record, and nothing else", { cex: 0.95 });
  });
  $("#ex1-plot1", content).appendChild(line);

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
    pl.clip(false);
    pl.title("The series so far", { cex: 0.95 });
  });
  $("#ex1-plot2", content).appendChild(hist);

  /* ------------------------------------------------------- the ladder ---- */
  function ladder() {
    const last = obs[obs.length - 1];
    const seen = showT();
    const oN = last ? fmt(last.o, 3) : "&mdash;";
    const tN = last ? (seen ? fmt(last.T, 3) : "?") : "&mdash;";
    const eN = last ? (seen ? (last.e < 0 ? "−" : "") + fmt(Math.abs(last.e), 3) : "?") : "&mdash;";
    return `<div class="ex-ladder">
      <div class="lad-row lad-words">
        <span class="k-O">the quantity observed</span>
        <span class="lad-op">=</span>
        <span class="k-T">the unknown quantity</span>
        <span class="lad-op">+</span>
        <span class="k-e">the accidental circumstances</span>
      </div>
      <div class="lad-row lad-sym">
        <span class="k-O">O<sub>i</sub></span>
        <span class="lad-op">=</span>
        <span class="k-T">T</span>
        <span class="lad-op">+</span>
        <span class="k-e">&epsilon;<sub>i</sub></span>
      </div>
      <div class="lad-row lad-num">
        <span class="k-O">${oN}</span>
        <span class="lad-op">=</span>
        <span class="k-T">${tN}</span>
        <span class="lad-op">+</span>
        <span class="k-e">${eN}</span>
      </div>
    </div>`;
  }

  function update() {
    const n = obs.length;
    const mean = n ? obs.reduce((s, r) => s + r.o, 0) / n : null;

    $("#ex1-readout", content).innerHTML = n
      ? `<div class="key-insight" style="margin-top:0;">
           <p style="margin-bottom:6px;"><strong>${bigmark(n)}</strong>
             observation${n === 1 ? "" : "s"} taken.</p>
           <p style="margin-bottom:0;">The mean of the series is <strong>${fmt(mean, 4)}</strong>.
             ${showT() ? `The unknown quantity is ${fmt(T(), 3)}, so the mean is out by
               ${fmt(Math.abs(mean - T()), 4)}.`
              : `Whether that is close to the unknown quantity there is, at this point,
                 no way to say.`}</p></div>`
      : `<p class="help-text">Nothing observed yet.</p>`;

    $("#ex1-ladder", content).innerHTML = ladder();

    $("#ex1-note", content).innerHTML = showT()
      ? `<div class="note-block">
           <p>The sentence is the model. What is recorded depends partly on the quantity wanted and
           partly on circumstances that cannot be separately accounted for, so the record is the sum
           of the two, and everything that follows in the paper is about the second term: what
           distribution it has, when that distribution may be taken as the normal one, and what
           follows for the mean of a series.</p>
           <p>Take fifty observations and slide the reach of the accidental circumstances. The
           unknown quantity does not move; the pile spreads around it. That is the only thing the
           second term does.</p></div>`
      : `<div class="note-block">
           <p>Nothing about the data changed when the unknown quantity was hidden &mdash; the same
           dots, in the same places. This is the observer's actual position. T and &epsilon; are never
           observed apart, only added together, and no amount of staring at the dots separates them.</p>
           <p>So the pile has to be made to speak some other way, and the only thing that can make it
           speak is knowing what sort of errors this kind of observation produces. That is the law of
           the facility of errors, which is what Peirce turns to next.</p></div>`;

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
