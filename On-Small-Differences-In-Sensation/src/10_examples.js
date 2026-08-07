<script>
/* ==========================================================================
   ON SMALL DIFFERENCES OF SENSATION — the examples.

   The article this sits under is generated (tools/render.py), so no trigger or
   container is typed into it. Each example's trigger comes from the `anchor:`
   in its notes entry and is re-inserted on every build by tools/examples.py;
   the `container:` there is the id registered below. Adding an example means
   writing it here and putting both fields in its notes entry — nothing in
   src/02_article.html is ever touched by hand.
   ========================================================================*/

/* Peirce's own palette for this pair, so the two lamps keep their colours in
   the diagram, the readout and the text alike. */
const OSD_L1 = "#c08a2e";        // the fixed lamp
const OSD_L2 = "#2f6f9f";        // the one that shifts
const OSD_UMBRA = "#3a3f46";     // lit by neither
const OSD_PEN = "#9aa0a8";       // lit by one only

/* ==========================================================================
   EXAMPLE 1 — Fechner's two dim lights, the opaque body, and the shadows.

   Fechner's claim is that two dim lights nearly in line with the edge of an
   opaque body show but one shadow, and he takes that as evidence of a least
   perceptible difference: the second shadow's edge is there, but too faint a
   step to be seen. Peirce's answer is in the sentence the trigger sits on —
   the phenomenon is not clearly marked unless the lights are nearly in range,
   and shifting one of them sideways shows why.

   So the demonstration is geometry first: two point sources, a straight edge,
   and the bands they cast on a screen. Move the second lamp sideways and the
   single dark band separates into a dark core with a half-lit step beside it.
   Nothing here is about sensation yet — the point is that how visible that step
   is depends on how far apart the lamps are, which is a fact about the lights
   and not about the eye. That is Peirce's objection drawn.
   ========================================================================*/
registerExample("example-ex1", (box) => {
  box.appendChild(exHeader("Interactive Example: Fechner's Two Lights", "ex1-content"));
  const content = h(`<div id="ex1-content" class="example-content">
    <div class="row">
      <div class="col col-4">
        <div id="ex1-controls"></div>
        <div class="ex-buttonbar">
          <button class="btn btn-primary btn-sm" id="ex1_inline">Nearly in line</button>
          <button class="btn btn-primary btn-sm" id="ex1_shifted">Shifted sideways</button>
        </div>
      </div>
      <div class="col col-8">
        <div class="plot-container" id="ex1-plot"></div>
      </div>
    </div>
    <div id="ex1-reading"></div>
  </div>`);
  box.appendChild(content);

  const ctl = $("#ex1-controls", content);
  ctl.appendChild(slider("ex1_sep", "How far lamp 2 is shifted sideways:", 0, 60, 2, 1,
    (v) => `${v} cm`, "k2"));
  ctl.appendChild(slider("ex1_bright", "How bright the lamps are:", 5, 100, 22, 1,
    (v) => `${v}%`, "k1"));

  /* The geometry, in centimetres on a plan view looking down: both lamps on a
     line 100 back from the edge, the screen 100 in front of it. A lamp at x
     throws the edge's boundary to -x (similar triangles, the two distances
     being equal), so the boundary separation is exactly the lamp separation and
     the reading can quote a number straight off the picture.

     Lamp 1 stays put and only lamp 2 moves, because that is what the sentence
     says — "lateral shifting of ONE of the lights". It is not a detail: with
     one lamp fixed its boundary is fixed too, so the shifted lamp's boundary
     walks away from a mark that stays still, and the separation is read against
     something. Moving both symmetrically kept the figure tidy and lost that. */
  const LAMP_BACK = 100, SCREEN = 100;
  const edgeX = 0;
  const boundaryOf = (lampX) => edgeX - (lampX - edgeX) * (SCREEN / LAMP_BACK);

  /* Two point sources would throw edges with no width at all, and then whether
     two shadows read as one would be a question about the eye that this picture
     could not answer. Real lamps have size, and a dim lamp is judged by
     dark-adapted vision, which resolves less: so the edges are drawn soft, and
     softer the dimmer the lamps. That is what lets the two boundaries actually
     merge at close range rather than merely sit close together. */
  const blurOf = (bright) => 0.8 + 5.2 * (1 - bright);

  function state() {
    const sep = num("ex1_sep"), bright = num("ex1_bright") / 100;
    const l1x = 0, l2x = sep;                  // lamp 1 fixed, lamp 2 shifted
    const b1 = boundaryOf(l1x), b2 = boundaryOf(l2x);
    const lo = Math.min(b1, b2), hi = Math.max(b1, b2);
    const blur = blurOf(bright);

    /* Light at a point, each lamp contributing half, its edge smoothed over the
       blur width. 2.2 makes `blur` about the 10-to-90 per cent distance. */
    const S = (t2) => 1 / (1 + Math.exp(-2.2 * t2 / blur));
    const I = (x) => 0.5 * S(b1 - x) + 0.5 * S(b2 - x);

    /* One shadow or two, decided the way an eye decides it: are there two
       separate edges, or one? Take the steepness at each boundary and at the
       middle of the strip. Two resolved edges leave a flat landing between
       them; once they merge the middle is the steepest place of all. */
    const g = (x) => Math.abs(I(x + 0.5) - I(x - 0.5));
    const mid = (lo + hi) / 2;
    const gEdge = Math.min(g(lo), g(hi)), gMid = g(mid);
    const twoEdges = (hi - lo) > 0.5 && gMid < 0.6 * gEdge;

    const contrast = bright * 0.5;
    return { sep, bright, l1x, l2x, b1, b2, lo, hi, blur, I, stepWidth: hi - lo,
             twoEdges, contrast };
  }

  const canvas = mkCanvas(330, (pl) => {
    const st = state();
    const X = 90;
    pl.setup({ xlim: [-X, X], ylim: [-15, 215], mar: [1, 1, 2, 1] });
    pl.clip(true);

    const y0 = SCREEN + LAMP_BACK - 10, y1 = y0 + 16;
    /* The band, drawn as a run of thin strips at the light level actually
       falling on each: the soft edges are the picture, not a decoration on it. */
    const N = 240;
    for (let i = 0; i < N; i++) {
      const xa = -X + (2 * X) * i / N, xb = -X + (2 * X) * (i + 1) / N;
      const lvl = st.I((xa + xb) / 2);
      const v = Math.round(255 - 255 * (1 - lvl) * (0.25 + 0.75 * st.bright));
      pl.rect(xa, y0, xb + 0.2, y1, { col: `rgb(${v},${v},${v})`, border: null });
    }
    pl.rect(-X, y0, X, y1, { col: null, border: PAL.inkFaint, lwd: 1 });

    // the opaque body: a straight edge standing at the origin
    pl.rect(edgeX, LAMP_BACK - 4, X, LAMP_BACK + 4, { col: OSD_UMBRA, border: null });

    // the two lamps, and the ray that fixes each boundary
    [[st.l1x, st.b1, OSD_L1], [st.l2x, st.b2, OSD_L2]].forEach(([lx, bx, col]) => {
      pl.segments(lx, 0, edgeX, LAMP_BACK, { col: col, lwd: 1, lty: 2 });
      pl.segments(edgeX, LAMP_BACK, bx, y0, { col: col, lwd: 1.6 });
      pl.points([lx], [0], { cex: 1.1 + 1.6 * st.bright, col: col });
    });

    const mid = (a, b) => (a + b) / 2;
    pl.text(mid(-X, st.lo), y1 + 12, "lit by both", { cex: 0.7, col: PAL.inkSoft });
    if (st.twoEdges) {
      pl.text(mid(st.lo, st.hi), y1 + 12, "one lamp only", { cex: 0.7, col: PAL.inkSoft });
    }
    pl.text(mid(st.hi, X), y1 + 12, "neither", { cex: 0.7, col: PAL.inkSoft });
    pl.text(0, LAMP_BACK - 16, "the edge", { cex: 0.7, col: PAL.inkSoft });
    pl.text(st.l1x, -10, "lamp 1 (fixed)", { cex: 0.7, col: OSD_L1 });
    pl.text(st.l2x, -10, "lamp 2", { cex: 0.7, col: OSD_L2 });

    pl.clip(false);
    pl.title(st.twoEdges ? "Two edges, and a half-lit step between them"
      : "One shadow, as Fechner reports", { cex: 0.95 });
  });
  $("#ex1-plot", content).appendChild(canvas);

  content.addEventListener("input", update);
  content.addEventListener("change", update);
  $("#ex1_inline", content).addEventListener("click", () => {
    setSlider("ex1_sep", 1); setSlider("ex1_bright", 22); update();
  });
  $("#ex1_shifted", content).addEventListener("click", () => {
    setSlider("ex1_sep", 40); setSlider("ex1_bright", 22); update();
  });

  function update() {
    const st = state();
    const say = st.twoEdges
      ? `The two edges are <strong>${fmt(st.stepWidth, 1)} cm</strong> apart and the strip between
         them is wide enough to survive the blur, so there are plainly two shadows &mdash; and no
         least perceptible difference had to be crossed to see it.`
      : `The two edges are <strong>${fmt(st.stepWidth, 1)} cm</strong> apart, against a blur of
         <strong>${fmt(st.blur, 1)} cm</strong> at this brightness. They wash into one another, so
         it reads as a single shadow. This is Fechner's setting, the lamps nearly in range.`;
    $("#ex1-reading", content).innerHTML = `<div class="note-block">
      <p>${say}</p>
      <p style="margin-bottom:0;">Peirce's objection is the sentence above: the phenomenon is
      not clearly marked <em>unless the lights are nearly in range</em>. Shift lamp 2 sideways and
      the single shadow separates &mdash; so what the experiment shows depends on where the lamps
      are put, and it can be made to come out either way. Brightness moves it too: the step to be
      caught is between half the light and none, which at
      <strong>${Math.round(st.bright * 100)}%</strong> is
      <strong>${fmt(st.contrast * 100, 1)}%</strong> of full light, and the dimmer the lamps the
      softer the edges, so the two settings work against each other.</p></div>`;
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 2 — The doctrine, and the bench it is tested on.

   The passage states the psychologists' own position: sensation rises
   continuously with excitation, so the least increase of the one must produce
   some increase of the other. That is the claim this whole memoir is built to
   test, and the three classical ways of testing it already exist on this site
   as Fechner's Lab. Rather than build a fourth copy of them here, this says
   what the doctrine commits you to and hands the reader across.

   The links are ordinary relative hrefs, so they work over file:// and offline
   like the rest of the page; nothing is fetched to draw this.
   ========================================================================*/
registerExample("example-ex2", (box) => {
  box.appendChild(exHeader("The three methods, on this site", "ex2-content"));
  const content = h(`<div id="ex2-content" class="example-content">
    <div class="ex-buttonbar" id="ex2-links"></div>
    <p class="help-text" style="margin-bottom:0;">This memoir uses the third. It is the only one of
      the three that does not ask the observer to report a sensation.</p>
  </div>`);
  box.appendChild(content);

  const LINKS = [
    ["../fechners-lab/just-noticeable-differences.html", "Just noticeable differences"],
    ["../fechners-lab/average-error.html", "Average error"],
    ["../fechners-lab/right-and-wrong-cases.html", "Right and wrong cases"],
    ["../fechners-lab/try-it-yourself.html", "Try them on yourself"],
    ["../fechners-lab/results.html", "The three together"]
  ];
  const bar = $("#ex2-links", content);
  LINKS.forEach(([href, label], i) => {
    const a = document.createElement("a");
    a.className = "btn btn-sm" + (i === 2 ? " btn-primary" : "");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label + " \u2197";
    bar.appendChild(a);
  });
});

/* ==========================================================================
   EXAMPLE 3 — What the two theories predict, and where they part.

   The passage sets the two against each other: errors follow the probability
   curve, which admits no Unterschiedsschwelle, and leads instead to least
   squares — so that of two excitations, one ever so little the more intense
   would in the long run be judged the more intense the majority of times.

   Both theories are drawn as one thing: the proportion of correct judgments
   against the difference in weight. Above the claimed threshold they agree
   exactly and there is nothing to choose between them. Below it they part —
   least squares still predicts a majority, however slight; the threshold
   predicts an even chance and nothing better. That is the whole disagreement,
   and it is also why the memoir is a counting exercise: the only place the two
   differ is where the effect is small, and a small effect needs many trials to
   show at all. So the trials-needed figure is not a footnote to the example,
   it is the reason the experiment had to be done the way it was.
   ========================================================================*/
registerExample("example-ex3", (box) => {
  box.appendChild(exHeader("Interactive Example: Threshold, or Least Squares", "ex3-content"));
  const content = h(`<div id="ex3-content" class="example-content">
    <div class="row">
      <div class="col col-4"><div id="ex3-controls"></div></div>
      <div class="col col-8"><div class="plot-container" id="ex3-plot"></div></div>
    </div>
    <div id="ex3-reading"></div>
    <div class="plot-container" id="ex3-dist"></div>
  </div>`);
  box.appendChild(content);

  /* Weights in parts per thousand, the units Jastrow's differences are quoted
     in later in the memoir — 60, 30 and 15 on the thousand. */
  const ctl = $("#ex3-controls", content);
  ctl.appendChild(slider("ex3_d", "Difference in weight:", 0, 60, 8, 0.5,
    (v) => `${fmt(v, 1)} in 1000`, "k1"));
  ctl.appendChild(slider("ex3_thr", "Threshold claimed:", 0, 60, 15, 1,
    (v) => `${v} in 1000`, "k2"));
  ctl.appendChild(slider("ex3_sd", "The observer's error:", 5, 60, 25, 1,
    (v) => `${v} in 1000`, "k3"));

  const K_D = "#7a6a94", K_THR = "#b0563f", K_LS = "#2f6f9f";

  function state() {
    const d = num("ex3_d"), thr = num("ex3_thr"), sd = num("ex3_sd");
    /* Two weights are compared; the judgment is the sign of the true difference
       plus the observer's error. So the chance of being right is the chance the
       error does not swamp the difference. */
    const pLS = pnorm(d / sd);
    /* The threshold theory says a difference under the Schwelle produces no
       difference of sensation at all, so the observer can only guess. Above it
       the two theories say the same thing, which is why the argument cannot be
       settled with large differences. */
    const pThr = d < thr ? 0.5 : pLS;
    /* Trials to show the observer is better than chance, 19 times in 20: the
       excess over a half has to clear about two standard errors of a
       proportion, and under chance that error is root(1/4n). */
    const trials = (p) => (p <= 0.5 + 1e-9 ? Infinity
      : Math.ceil(Math.pow(1.96, 2) * 0.25 / Math.pow(p - 0.5, 2)));
    return { d, thr, sd, pLS, pThr, below: d < thr,
             nLS: trials(pLS), nThr: trials(pThr) };
  }

  const canvas = mkCanvas(320, (pl) => {
    const st = state();
    pl.setup({ xlim: [0, 60], ylim: [0.45, 1.02], mar: [4, 5, 3, 2] });
    pl.axes();
    pl.box();
    pl.axisLabels("Difference in weight (in 1000)", "Judged right");
    pl.title("What each theory predicts", { cex: 1.0 });
    pl.clip(true);

    // least squares: the ogive, rising from an even chance at no difference
    const xs = [], ys = [];
    for (let i = 0; i <= 240; i++) { const x = 60 * i / 240; xs.push(x); ys.push(pnorm(x / st.sd)); }
    pl.lines(xs, ys, { col: K_LS, lwd: 2.5 });

    // the threshold theory: flat at chance up to the Schwelle, then the same curve
    const tx = [], ty = [];
    for (let i = 0; i <= 240; i++) {
      const x = 60 * i / 240;
      tx.push(x); ty.push(x < st.thr ? 0.5 : pnorm(x / st.sd));
    }
    pl.lines(tx, ty, { col: K_THR, lwd: 2.5, lty: 2 });

    pl.abline({ h: 0.5, col: PAL.rule, lwd: 1, lty: 3 });
    pl.abline({ v: st.thr, col: K_THR, lwd: 1.5, lty: 3 });
    pl.abline({ v: st.d, col: K_D, lwd: 2 });
    pl.points([st.d], [st.pLS], { cex: 1.2, col: K_LS });
    pl.points([st.d], [st.pThr], { cex: 1.2, col: K_THR });
    pl.text(st.thr, 1.005, "the Schwelle", { cex: 0.7, col: K_THR });
    pl.clip(false);
    pl.legend("bottomright", {
      legend: ["Least squares", "A threshold"],
      col: [K_LS, K_THR], lwd: [2.5, 2.5], lty: [1, 2], cex: 0.75, bty: "n", bg: "n"
    });
  });
  $("#ex3-plot", content).appendChild(canvas);

  /* The same disagreement seen the other way round: the observer's error laid
     over the difference. What "judged heavier" means is the part of that curve
     falling the right side of nothing, and the threshold's claim is the band
     round nothing in which it says no judgment is possible at all. */
  const dist = mkCanvas(240, (pl) => {
    const st = state();
    const X = Math.max(60, st.sd * 3);
    pl.setup({ xlim: [-X, X], ylim: [0, dnorm(0, 0, st.sd) * 1.25], mar: [4, 2, 3, 2] });
    pl.axes({ yat: [] });
    pl.box();
    pl.axisLabels("Sensation of the difference (in 1000)", null);
    pl.title("The observer's error, laid over the difference", { cex: 0.95 });
    pl.clip(true);

    const xs = [], ys = [];
    for (let i = 0; i <= 400; i++) {
      const x = -X + 2 * X * i / 400;
      xs.push(x); ys.push(dnorm(x, st.d, st.sd));
    }
    // the part judged the right way round
    const rx = xs.filter((x) => x >= 0), ry = rx.map((x) => dnorm(x, st.d, st.sd));
    pl.polygon(rx.concat(rx.slice().reverse()), ry.concat(rx.map(() => 0)),
      { col: "rgba(47,111,159,0.20)" });
    pl.lines(xs, ys, { col: PAL.ink, lwd: 2 });

    // the band the threshold theory says nothing can be felt in
    if (st.thr > 0) {
      pl.rect(-st.thr, 0, st.thr, dnorm(0, 0, st.sd) * 1.25,
        { col: "rgba(176,86,63,0.10)", border: null });
      [-st.thr, st.thr].forEach((v) => pl.abline({ v: v, col: K_THR, lwd: 1.2, lty: 3 }));
    }
    pl.abline({ v: 0, col: PAL.rule, lwd: 1 });
    pl.abline({ v: st.d, col: K_D, lwd: 2 });
    pl.clip(false);
    pl.text(0, dnorm(0, 0, st.sd) * 1.18, st.thr > 0 ? "nothing felt inside this band" : "",
      { cex: 0.7, col: K_THR });
  });
  $("#ex3-dist", content).appendChild(dist);

  content.addEventListener("input", update);
  content.addEventListener("change", update);

  function update() {
    const st = state();
    const pct = (p) => fmt(p * 100, 1);
    const many = (n) => (Number.isFinite(n) ? `${bigmark(n)} trials` : "no number of trials");
    /* At no difference at all there is nothing to disagree about: least squares
       predicts an even chance too, and the "majority however slight" it claims
       is a claim about differences that exist. Saying the two part company here
       would be false, and it is the one setting a reader is most likely to try
       first. */
    const say = st.d <= 0
      ? `<p style="margin-bottom:0;">At no difference at all both theories say the same thing:
         an even chance, <strong>50.0%</strong>. Least squares claims a majority for any
         difference that exists, however slight &mdash; but nothing is not a difference. Move the
         slider off nothing to see the two separate.</p>`
      : st.below
      ? `<p>At <strong>${fmt(st.d, 1)} in 1000</strong> the difference is under the claimed
         threshold, and the two part company. Least squares says the observer is right
         <strong style="color:${K_LS};">${pct(st.pLS)}%</strong> of the time &mdash; a majority,
         however slight. The threshold says <strong style="color:${K_THR};">50.0%</strong>: no
         difference is felt, so there is nothing to do but guess.</p>
         <p style="margin-bottom:0;">Which is right is a question of counting, and the cost of
         answering it is the last figure here. To show that
         <strong style="color:${K_LS};">${pct(st.pLS)}%</strong> is really better than chance,
         nineteen times in twenty, takes <strong>${many(st.nLS)}</strong>. The threshold's
         prediction cannot be shown better than chance by ${many(st.nThr)}, because it is chance.
         That is why the memoir counts right and wrong cases in the thousands.</p>`
      : `<p>At <strong>${fmt(st.d, 1)} in 1000</strong> the difference is at or above the claimed
         threshold, and the two theories predict exactly the same thing:
         <strong>${pct(st.pLS)}%</strong> right. Nothing here can tell them apart.</p>
         <p style="margin-bottom:0;">Slide the difference below
         <strong style="color:${K_THR};">${st.thr} in 1000</strong> to separate them. That is
         Peirce's point about where the question actually lives: the theories differ only where
         the effect is small, which is the hardest place to measure.</p>`;
    $("#ex3-reading", content).innerHTML = `<div class="note-block">${say}</div>`;
    drawCanvas(canvas); drawCanvas(dist);
  }
  update();
});
</script>
