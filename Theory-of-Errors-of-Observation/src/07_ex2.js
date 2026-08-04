<script>
/* ==========================================================================
   EXAMPLE 2 — The law of the facility of the errors

   φ is a function, and the special form it takes is a fact about the kind of
   observation, not about any one observation. So the example is built around
   choosing a kind: transit observations, the chronograph key on an
   occultation, a coarse instrument, two observers whose series have been run
   together. The marks on the target and the curve beside them are the same
   fact drawn twice.

   The strip is what makes φ mean anything: the height of the curve at ε times
   the width of the strip is the proportion of shots that should land in it,
   and the tally says how many did.
   ========================================================================*/
registerExample("example-ex2", (box) => {
  box.appendChild(exHeader("Interactive Example: The Law of the Facility of Errors", "ex2-content"));
  const content = h(`<div id="ex2-content" class="example-content">
    <p>Take a marksman firing at a target. He is aiming at the middle every time, so the middle is the
      <span class="k-T">unknown quantity</span> and each shot is an <span class="k-O">observation</span>
      of it; how far the shot fell from the middle is the <span class="k-e">error</span>. Fire enough
      shots and the scatter settles into a shape. That shape is the law.</p>
    <div id="ex2-kind"></div>
    <div class="row">
      <div class="col col-5">
        <div class="plot-container" id="ex2-target"></div>
      </div>
      <div class="col col-7">
        <div class="plot-container" id="ex2-curve"></div>
      </div>
    </div>
    <div class="row">
      <div class="col col-5">
        <div id="ex2-controls"></div>
        <div class="ex-buttonbar">
          <button class="btn btn-primary" data-act="one">Fire once</button>
          <button class="btn btn-primary" data-act="many">Fire two hundred</button>
          <button class="btn btn-warning btn-sm" data-act="clear">Clear</button>
        </div>
      </div>
      <div class="col col-7">
        <div id="ex2-readout"></div>
      </div>
    </div>
    <div id="ex2-ladder"></div>
    <div id="ex2-note"></div>
  </div>`);
  box.appendChild(content);

  const DE = 0.10;                  // the width of the strip, standing for dε
  const XLO = -1.5, XHI = 1.5;
  let shots = [];                   // {e, y} — the error, and where it fell vertically

  $("#ex2-kind", content).appendChild(radios("ex2_kind", "The kind of observation:",
    Object.entries(ERROR_LAWS).map(([k, v]) => [k, v.name]), "transit", true));

  const ctl = $("#ex2-controls", content);
  ctl.appendChild(slider("ex2_s", "How wide the errors run:", 0.12, 0.6, 0.3, 0.01,
    (v) => v.toFixed(2), "k2"));
  ctl.appendChild(slider("ex2_e", "Read the law at ε =", -1.4, 1.4, 0.3, 0.05,
    (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2), "k1"));

  const law = () => ERROR_LAWS[radioVal("ex2_kind") || "transit"];
  const S = () => num("ex2_s");
  const E = () => num("ex2_e");

  function fire(k) {
    const L = law(), s = S();
    for (let i = 0; i < k; i++) shots.push({ e: L.draw(s), y: rnorm1(0, s) });
    if (shots.length > 2000) shots = shots.slice(-2000);
  }

  /* --------------------------------------------------------- the target --- */
  const target = mkCanvas(280, (pl) => {
    const R = 1.5;
    pl.setup({ xlim: [-R, R], ylim: [-R, R], mar: [1.4, 1.4, 2.0, 1.4], asp: 1, ext: false });
    const cx = 0, cy = 0;
    // the rings
    for (let i = 4; i >= 1; i--) {
      const r = R * i / 4.6, n = 64, xs = [], ys = [];
      for (let a = 0; a <= n; a++) {
        xs.push(cx + r * Math.cos(2 * Math.PI * a / n));
        ys.push(cy + r * Math.sin(2 * Math.PI * a / n));
      }
      pl.polygon(xs, ys, { col: i % 2 ? "#faf8f3" : "#ffffff", border: PAL.rule });
    }
    pl.points([0], [0], { col: PAL.accent3, cex: 1.1 });
    pl.clip(true);
    const show = shots.slice(-500);
    show.forEach((s, i) => {
      const fresh = i === show.length - 1;
      pl.points([s.e], [s.y], {
        col: fresh ? PAL.accent2 : "rgba(47,111,159,0.45)", cex: fresh ? 1.6 : 0.95
      });
    });
    // the strip, drawn across the target so the two panels read as one picture
    const e = E();
    pl.rect(e - DE / 2, -R, e + DE / 2, R, { col: "rgba(154,123,63,0.16)", border: null });
    pl.clip(false);
    pl.title("Where the shots fell", { cex: 0.95 });
  });
  $("#ex2-target", content).appendChild(target);

  /* ---------------------------------------------------------- the curve --- */
  const curve = mkCanvas(280, (pl) => {
    const L = law(), s = S(), e = E();
    const xs = [], ys = [];
    for (let i = 0; i <= 300; i++) {
      const x = XLO + (XHI - XLO) * i / 300;
      xs.push(x); ys.push(L.dens(x, s));
    }
    const top = Math.max(0.6, niceMax(Math.max(...ys) * 1.15, 0.6));

    // the shots' own errors, as a histogram under the curve
    const NB = 45, w = (XHI - XLO) / NB, bins = new Array(NB).fill(0);
    shots.forEach((r) => {
      const b = Math.floor((r.e - XLO) / w);
      if (b >= 0 && b < NB) bins[b]++;
    });
    const n = shots.length;

    pl.setup({ xlim: [XLO, XHI], ylim: [0, top], mar: [3.2, 3.6, 2.0, 1.2] });
    pl.axes({ nx: 7 });
    pl.box();
    pl.axisLabels("The error, ε", "φ(ε, x)");
    pl.clip(true);

    if (n) {
      for (let b = 0; b < NB; b++) {
        if (!bins[b]) continue;
        pl.rect(XLO + b * w, 0, XLO + (b + 1) * w, bins[b] / (n * w),
          { col: "rgba(47,111,159,0.30)", border: "rgba(36,88,125,0.45)" });
      }
    }
    // the strip: φ(ε, x) · dε
    pl.rect(e - DE / 2, 0, e + DE / 2, L.dens(e, s), { col: "rgba(154,123,63,0.35)", border: PAL.accent4 });
    pl.lines(xs, ys, { col: PAL.accent2, lwd: 2.4 });
    pl.abline({ v: 0, col: PAL.accent3, lwd: 1.6, lty: 2 });
    pl.points([e], [L.dens(e, s)], { col: PAL.accent4, cex: 1.3 });
    pl.clip(false);
    pl.title("The law of the facility of the errors", { cex: 0.95 });
    pl.legend("topright", {
      legend: n ? ["The law, φ", "The shots so far", "No error"] : ["The law, φ", "No error"],
      fill: n ? [PAL.accent2, "rgba(47,111,159,0.30)", PAL.accent3]
              : [PAL.accent2, PAL.accent3],
      cex: 0.7
    });
  });
  $("#ex2-curve", content).appendChild(curve);

  /* --------------------------------------------------------- the ladder ---
     Peirce reaches phi as a relative number: of all the cases in the limited
     universe where the unknown quantity is x, the proportion in which the
     quantity observed comes out about xi. The strip is that count, so the two
     sides of this statement are a tally on the left and a law on the right. */
  function ladder() {
    const L = law(), s = S(), e = E();
    const phi = L.dens(e, s), p = phi * DE;
    const n = shots.length;
    const inStrip = shots.filter((r) => Math.abs(r.e - e) <= DE / 2).length;
    const seen = n ? fmt(inStrip / n, 4) : "&mdash;";

    const relNum = `<span class="frac"><span class="num">[&xi;<sub>&Xi;</sub><span class="inv-comma">,</span> x<sub>x</sub>]</span><span class="den">[x<sub>x</sub>]</span></span> d&xi;`;
    const relCount = n
      ? `<span class="frac"><span class="num">${bigmark(inStrip)}</span><span class="den">${bigmark(n)}</span></span> = ${seen}`
      : "&mdash;";

    return `<div class="ex-ladder cols-3">
      <div class="lad-row lad-words">
        <span>the shots that fell in the strip, out of every shot fired</span>
        <span class="lad-op">=</span>
        <span>the height of the law there, times the width of the strip</span>
      </div>
      <div class="lad-row lad-sym">
        <span>${relNum}</span>
        <span class="lad-op"></span>
        <span><span class="k-e">φ(ε, x)</span> · dε</span>
      </div>
      <div class="lad-row lad-num">
        <span>${relCount}</span>
        <span class="lad-op"></span>
        <span><span class="k-e">${fmt(phi, 3)}</span> × ${fmt(DE, 2)} = ${fmt(p, 4)}</span>
      </div>
    </div>
    <div class="lad-note">The left side is a tally and nothing else: cases counted
        out of the cases in the limited universe, which here is every shot fired by this
        marksman. The right side is the law. Since ε = ξ &minus; x, dξ and dε are the same
        width; in modern notation the line reads <i>p</i>(ε) d<i>ε</i>, or
        <i>p</i>(ξ | x) d<i>ξ</i>.</div>`;
  }

  function update() {
    const L = law(), s = S(), e = E();
    const phi = L.dens(e, s), p = phi * DE;
    const n = shots.length;
    const inStrip = shots.filter((r) => Math.abs(r.e - e) <= DE / 2).length;

    $("#ex2-readout", content).innerHTML = `<div class="key-insight" style="margin-top:0;">
      <p style="margin-bottom:6px;"><em>${esc(L.name)}</em> &mdash; ${esc(L.gloss)}.</p>
      ${n ? `<p style="margin-bottom:0;">On ${bigmark(n)} shots the tally comes to
              <strong>${fmt(inStrip / n, 4)}</strong> against the law's
              <strong>${fmt(p, 4)}</strong>. Fire more and the two close on each other;
              that closing is the whole of what the law claims.</p>`
          : `<p style="margin-bottom:0;">The law says ${fmt(p, 4)} of the shots should fall in the
              shaded strip. Fire some and see whether they do.</p>`}
    </div>`;

    $("#ex2-ladder", content).innerHTML = ladder();

    const kind = radioVal("ex2_kind");
    $("#ex2-note", content).innerHTML = `<div class="note-block">
      <p>φ is a function, and the special form it takes is a fact about <em>the kind of observation</em>,
      not about any one observation. Change the kind and the target and the curve change together;
      they are the same fact drawn twice.</p>
      ${kind === "transit"
        ? `<p>This is the case Peirce says the transit observations actually show: the error is
           compounded of a great many small independent ones, and the curve that results is the one
           the method of least squares assumes. He reaches it by argument later in the paper, and
           checks it against Bradley's observations of Sirius and Procyon.</p>`
        : kind === "occultation"
        ? `<p>Here the law is lopsided, and Peirce says why: it is impossible to strike the key too
           early, while it may be struck indefinitely too late. Least squares assumes a law
           symmetrical about zero, so on the face of it it should not apply. He made the experiment,
           and reports at the end of the paper that the divergence proved insignificant.</p>`
        : kind === "coarse"
        ? `<p>Every error inside the range is exactly as likely as every other, and outside it none
           is possible &mdash; the reading was carried to the nearest division and no further. Peirce
           puts the chemist's balance and the computer's dropped decimal places in this class, and
           sends the reader to Bremiker for how to handle them.</p>`
        : `<p>Two humps, because two sets of circumstances have been run together as one series. Peirce
           returns to exactly this at the end of the paper: if the series can be divided on some
           principle, and the two parts turn out to have different laws, it is an advantage to divide
           it. Nothing here is a defect in the observations &mdash; only in calling them one universe.</p>`}
    </div>`;

    drawCanvas(target);
    drawCanvas(curve);
  }

  content.addEventListener("input", (ev) => {
    // a new kind of observation means a new series; the old shots were not fired under this law
    if (ev.target && ev.target.name === "ex2_kind") shots = [];
    update();
  });
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "one") fire(1);
    else if (a === "many") fire(200);
    else if (a === "clear") shots = [];
    else return;
    update();
  });

  fire(200);
  update();
});
</script>
