<script>
/* ==========================================================================
   EXAMPLE 10 — The bag of beans: a plain sampler.
   Draws and a proportion, and nothing said yet about how to judge from them.
   ========================================================================*/
registerExample("example-ex10", (box) => {
  box.appendChild(exHeader("Interactive Example: Sampling the Bag of Beans", "ex10-content"));
  const content = h(`<div id="ex10-content" class="example-content">
    <div class="ex-buttonbar">
      <button class="btn btn-primary" data-act="d1">Draw one bean</button>
      <button class="btn btn-primary" data-act="d10">Draw ten</button>
      <button class="btn btn-primary" data-act="d100">Draw a hundred</button>
      <button class="btn btn-primary" data-act="d1000">Draw a thousand</button>
      <button class="btn btn-warning btn-sm" data-act="newbag">New bag</button>
      <button class="btn btn-warning btn-sm" data-act="evenbag">Peirce&rsquo;s bag (even)</button>
      <button class="btn btn-sm" data-act="reveal">Look inside the bag</button>
    </div>
    <div class="row">
      <div class="col col-4"><div id="ex10-thimble"></div></div>
      <div class="col col-8">
        <div id="ex10-state"></div>
        <div id="ex10-chips"></div>
      </div>
    </div>
    <div class="plot-container" id="ex10-plot"></div>
    <div class="note-block">The drawings are a record of what came out of the bag. How can we determine the
      colour of the bean under the thimble?</div>
  </div>`);
  box.appendChild(content);

  let truth = 0.5, hidden = "white", white = 0, total = 0, revealed = false;
  let recent = [];            // last few draws, for the chips
  let path = [];              // {n, phat} history for the chart

  function newBag() {
    truth = 0.05 + Math.random() * 0.9;
    hidden = Math.random() < truth ? "white" : "black";
    white = 0; total = 0; revealed = false; recent = []; path = [];
  }
  newBag();

  function draw(k) {
    for (let i = 0; i < k; i++) {
      const w = Math.random() < truth;
      if (w) white++;
      total++;
      recent.push(w);
      if (recent.length > 120) recent.shift();
      if (total <= 40 || total % Math.max(1, Math.floor(total / 200)) === 0) {
        path.push({ n: total, phat: white / total });
      }
    }
    if (!path.length || path[path.length - 1].n !== total) path.push({ n: total, phat: white / total });
  }

  const canvas = mkCanvas(320, (pl) => {
    if (!total) { blankPlot(pl, "Draw some beans to begin"); return; }
    const sMax = Math.max(20, total * 1.05);
    pl.setup({ xlim: [Math.log10(1), Math.log10(sMax)], ylim: [0, 1], mar: [4, 5, 3, 2] });
    const decades = [];
    for (let e = 0; e <= Math.ceil(Math.log10(sMax)); e++) {
      [1, 2, 5].forEach((m) => { const v = m * Math.pow(10, e); if (v <= sMax) decades.push(v); });
    }
    pl.axes({ xat: decades.map(Math.log10), xlabels: decades.map((v) => bigmark(v)) });
    pl.box();
    pl.axisLabels("Beans drawn (log scale)", "Proportion white");
    pl.title("Proportion white as the drawings accumulate", { cex: 1.05 });
    pl.clip(true);
    pl.lines(path.map((d) => Math.log10(d.n)), path.map((d) => d.phat), { col: "#2f6f9f", lwd: 2.5 });
    pl.abline({ h: 0.5, col: "#a8adb4", lwd: 1, lty: 3 });
    if (revealed) {
      pl.abline({ h: truth, col: "#c79a45", lwd: 2.5 });
      pl.text(Math.log10(sMax) * 0.5, truth + 0.05, `true proportion ${fmt(truth, 3)}`,
        { cex: 0.8, col: "#9a7b3f", font: 2 });
    }
    pl.clip(false);
    pl.legend("bottomright", {
      legend: revealed ? ["Proportion drawn", "Even chance", "Truth"] : ["Proportion drawn", "Even chance"],
      col: revealed ? ["#2f6f9f", "#a8adb4", "orange"] : ["#2f6f9f", "#a8adb4"],
      lwd: [2.5, 1, 2.5], lty: [1, 3, 1], cex: 0.75
    });
  });
  $("#ex10-plot", content).appendChild(canvas);

  function update() {
    const phat = total ? white / total : 0.5;

    $("#ex10-thimble", content).innerHTML = `
      <p style="font-size:0.9em;margin-bottom:6px;"><strong>Under the thimble:</strong></p>
      <div style="width:90px;height:90px;border-radius:50%;margin:0 auto;border:4px solid #3a3f45;
        background:${revealed ? (hidden === "white" ? "#faf8f3" : "#2c3138") : "#8a8070"};
        color:${revealed && hidden === "white" ? "#3a3f45" : "#fff"};display:flex;align-items:center;
        justify-content:center;font-weight:bold;font-size:${revealed ? "0.95em" : "2em"};">
        ${revealed ? hidden : "?"}</div>`;

    $("#ex10-state", content).innerHTML = `<div class="key-insight" style="margin-top:0;">
      <p style="margin-bottom:6px;"><strong>${bigmark(white)}</strong> white and
        <strong>${bigmark(total - white)}</strong> black in
        <strong>${bigmark(total)}</strong> drawings.</p>
      <p style="margin-bottom:0;">Proportion white: <strong>${total ? fmt(phat, 4) : "&mdash;"}</strong></p></div>`;

    const chips = recent.map((w) =>
      `<span style="display:inline-block;width:13px;height:13px;margin:1px;border:1px solid #a8adb4;
        border-radius:2px;background:${w ? "#faf8f3" : "#2c3138"};"></span>`).join("");
    $("#ex10-chips", content).innerHTML = total
      ? `<p style="font-size:0.85em;margin-bottom:4px;color:#575d66;">
           ${total > recent.length ? `Last ${recent.length} drawings:` : "The drawings:"}</p><div>${chips}</div>`
      : "";

    drawCanvas(canvas);
  }

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "d1") draw(1);
    else if (a === "d10") draw(10);
    else if (a === "d100") draw(100);
    else if (a === "d1000") draw(1000);
    else if (a === "newbag") newBag();
    /* Peirce's own bag, so the drawings in the paragraph below can actually be
       run: "if 4, 5, or 6 are white ... if about half have been white". */
    else if (a === "evenbag") { newBag(); truth = 0.5; hidden = Math.random() < 0.5 ? "white" : "black"; }
    else if (a === "reveal") revealed = true;
    else return;
    update();
  });
  update();
});

/* ==========================================================================
   EXAMPLE 11 — "not one number but two are requisite"
   The same sampler, now reporting both numbers: the proportion drawn, and
   the probable error that says how much the proportion is worth.
   ========================================================================*/
registerExample("example-ex11", (box) => {
  box.appendChild(exHeader("Interactive Example: Two Numbers, Not One", "ex11-content"));
  const content = h(`<div id="ex11-content" class="example-content">
    <p>On these drawings we calculate two numbers. The first is the proportion white among the drawings. The
      second is the probable error: the amount by which the first is as likely as not to be wrong. Initially,
      drawing more beans moves the first number very little and the second a great deal.</p>
    <div class="ex-buttonbar">
      <button class="btn btn-primary" data-act="d1">Draw one bean</button>
      <button class="btn btn-primary" data-act="d10">Draw ten</button>
      <button class="btn btn-primary" data-act="d100">Draw a hundred</button>
      <button class="btn btn-primary" data-act="d1000">Draw a thousand</button>
      <button class="btn btn-warning btn-sm" data-act="newbag">New bag</button>
    </div>
    <div id="ex11-numbers"></div>
    <div class="mode-tabs">
      <button class="mode-tab active" data-view="path">The drawings</button>
      <button class="mode-tab" data-view="gauss">The distribution</button>
    </div>
    <div class="plot-container" id="ex11-plot"></div>
    <div id="ex11-table"></div>
  </div>`);
  box.appendChild(content);

  let view = "path";

  const probableError = (p, s) => (s > 0 ? 0.477 * Math.sqrt(2 * p * (1 - p) / s) : 0);

  let truth = 0.5, white = 0, total = 0, path = [];
  function newBag() { truth = 0.05 + Math.random() * 0.9; white = 0; total = 0; path = []; }
  newBag();

  /* Peirce names the two numbers without giving either. While this example is
     open they are given, as parentheticals, in the colours the chart uses:
     the proportion, then the probable error that qualifies it. */
  registerLive("example-ex11", {
    first:  () => (total ? ` <span class="math">(P(A&rarr;C) = ${fmt(white / total, 3)})</span>` : null),
    second: () => (total
      ? ` <span class="math">(&plusmn; ${fmt(probableError(white / total, total), 3)}, the probable error of that value, on ${bigmark(total)} drawings)</span>`
      : null)
  });

  function draw(k) {
    for (let i = 0; i < k; i++) {
      if (Math.random() < truth) white++;
      total++;
      if (total <= 40 || total % Math.max(1, Math.floor(total / 200)) === 0) {
        path.push({ n: total, phat: white / total });
      }
    }
    if (!path.length || path[path.length - 1].n !== total) path.push({ n: total, phat: white / total });
  }

  const canvas = mkCanvas(360, (pl) => {
    if (!total) { blankPlot(pl, "Draw some beans to begin"); return; }
    const sMax = Math.max(20, total * 1.05);
    pl.setup({ xlim: [Math.log10(1), Math.log10(sMax)], ylim: [0, 1], mar: [4, 5, 3, 2] });
    const decades = [];
    for (let e = 0; e <= Math.ceil(Math.log10(sMax)); e++) {
      [1, 2, 5].forEach((m) => { const v = m * Math.pow(10, e); if (v <= sMax) decades.push(v); });
    }
    pl.axes({ xat: decades.map(Math.log10), xlabels: decades.map((v) => bigmark(v)) });
    pl.box();
    pl.axisLabels("Beans drawn (log scale)", "Proportion white");
    pl.title("The proportion, and the band the probable error allows it", { cex: 1.05 });
    pl.clip(true);
    const xs = path.map((d) => Math.log10(d.n));
    const hi = path.map((d) => Math.min(1, d.phat + probableError(d.phat, d.n)));
    const lo = path.map((d) => Math.max(0, d.phat - probableError(d.phat, d.n)));
    // the band takes the second number's colour, as the parenthetical does
    pl.polygon(xs.concat(xs.slice().reverse()), hi.concat(lo.slice().reverse()),
      { col: "rgba(176,86,63,0.16)" });
    pl.lines(xs, path.map((d) => d.phat), { col: "#2f6f9f", lwd: 2.5 });
    pl.abline({ h: 0.5, col: "#a8adb4", lwd: 1, lty: 3 });
    pl.clip(false);
    pl.legend("bottomright", {
      legend: ["Proportion drawn (± probable error)", "Even chance"],
      col: ["#2f6f9f", "#a8adb4"], lwd: [2.5, 1], lty: [1, 3], cex: 0.75
    });
  });
  $("#ex11-plot", content).appendChild(canvas);

  /* --------------------------------------------------------------------------
     The same two numbers drawn as one curve: where the first number sits, and
     how far the second lets it wander. The band is the probable error, and it
     is the middle half of the area by construction — as likely as not, which
     is what "probable error" says. The x range is held at the whole interval
     rather than fitted to the curve, since the point is that the curve narrows
     as the drawings accumulate, and a fitted axis would hide exactly that.
     ------------------------------------------------------------------------*/
  const gauss = mkCanvas(360, (pl) => {
    if (!total) { blankPlot(pl, "Draw some beans to begin"); return; }
    const phat = white / total;
    const sd = Math.sqrt(phat * (1 - phat) / total);
    const pe = probableError(phat, total);
    if (!(sd > 0)) {
      blankPlot(pl, "Every bean so far has been the same colour,\nso the second number is nothing at all");
      return;
    }
    const xs = [], ys = [];
    for (let i = 0; i <= 600; i++) { const x = i / 600; xs.push(x); ys.push(dnorm(x, phat, sd)); }
    const maxY = Math.max(...ys);
    pl.setup({ xlim: [0, 1], ylim: [0, maxY * 1.3], mar: [4, 3, 3, 2] });
    pl.axes({ nx: 5, yat: [] });
    pl.box();
    pl.axisLabels("Proportion white in the bag", null);
    pl.title("The distribution of the estimate, with its probable error", { cex: 1.02 });
    pl.clip(true);
    const lo = Math.max(0, phat - pe), hi = Math.min(1, phat + pe);
    const inBand = [];
    xs.forEach((x, i) => { if (x >= lo && x <= hi) inBand.push(i); });
    if (inBand.length) {
      const bx = inBand.map((i) => xs[i]), by = inBand.map((i) => ys[i]);
      pl.polygon(bx.concat(bx.slice().reverse()), bx.map(() => 0).concat(by.slice().reverse()),
        { col: "rgba(176,86,63,0.22)" });
    }
    pl.lines(xs, ys, { col: "#2f6f9f", lwd: 2.5 });
    pl.abline({ v: phat, col: "#2f6f9f", lwd: 2, lty: 2 });
    /* The band closes to a hairline as the drawings accumulate, which is the
       thing being shown, so nothing is written inside it — the arrow marks it
       and the legend carries the figure. */
    const ya = maxY * 0.42;
    pl.arrows(lo, ya, hi, ya, { code: 3, angle: 20, length: 7, lwd: 1.6, col: "#8a4331" });
    pl.clip(false);
    pl.text(Math.min(0.88, Math.max(0.12, phat)), maxY * 1.19, `first number ${fmt(phat, 4)}`,
      { cex: 0.8, col: "#2f6f9f", font: 2 });
    /* the legend takes whichever top corner the curve has left free */
    pl.legend(phat < 0.5 ? "topright" : "topleft", {
      legend: [`The estimate, on ${bigmark(total)} drawings`,
        `Probable error ±${fmt(pe, 4)} — half the area`],
      col: ["#2f6f9f", "rgba(176,86,63,0.6)"], lwd: [2.5, 9], lty: [1, 1], cex: 0.72
    });
  });
  gauss.style.display = "none";
  $("#ex11-plot", content).appendChild(gauss);

  function update() {
    const phat = total ? white / total : 0.5;
    const pe = probableError(phat, total);

    /* One line, in the colours the two parentheticals wear in Peirce's sentence
       above: the first number the blue of the curve, the second the red of the
       band that qualifies it. */
    $("#ex11-numbers", content).innerHTML = `<p style="margin-top:0;">
      <span style="color:#2f6f9f;">First number &mdash; the proportion</span>
      <strong style="color:#2f6f9f;font-size:1.15em;">${total ? fmt(phat, 4) : "&mdash;"}</strong>
      &nbsp;&nbsp;&middot;&nbsp;&nbsp;
      <span style="color:#b0563f;">Second number &mdash; the probable error</span>
      <strong style="color:#b0563f;font-size:1.15em;">${total ? "&plusmn;" + fmt(pe, 4) : "&mdash;"}</strong>
      <br><span style="color:#575d66;">${bigmark(white)} white in ${bigmark(total)} drawings.
      ${total ? `On this record the bag could be anywhere from ${fmt(Math.max(0, phat - pe), 3)} to
      ${fmt(Math.min(1, phat + pe), 3)} white.` : "Nothing has been drawn, and neither number has a value."}
      </span></p>`;

    /* what the second number would be at the same proportion on other records */
    const rows = [2, 10, 100, 1000, 10000].map((s) => {
      const e = probableError(total ? phat : 0.5, s);
      const cur = total && s === Math.pow(10, Math.round(Math.log10(total))) ? ' style="background-color:#f5ead1;"' : "";
      return `<tr${cur}><td>${bigmark(s)}</td><td>${fmt(total ? phat : 0.5, 3)}</td>
        <td>&plusmn;${fmt(e, 4)}</td>
        <td>${fmt(Math.max(0, (total ? phat : 0.5) - e), 3)} to ${fmt(Math.min(1, (total ? phat : 0.5) + e), 3)}</td></tr>`;
    }).join("");
    $("#ex11-table", content).innerHTML = `<div class="table-scroll"><table class="tbl">
      <thead><tr><th>Drawings</th><th>First number</th><th>Second number</th><th>The bag could be</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
    drawCanvas(canvas);
    drawCanvas(gauss);
  }

  content.addEventListener("click", (ev) => {
    const tab = ev.target.closest(".mode-tab");
    if (tab) {
      view = tab.getAttribute("data-view");
      $$(".mode-tab", content).forEach((x) => x.classList.toggle("active", x === tab));
      canvas.style.display = view === "path" ? "" : "none";
      gauss.style.display = view === "gauss" ? "" : "none";
      requestAnimationFrame(redrawAll);
      return;
    }
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "d1") draw(1);
    else if (a === "d10") draw(10);
    else if (a === "d100") draw(100);
    else if (a === "d1000") draw(1000);
    else if (a === "newbag") newBag();
    else return;
    update();
  });
  update();
});

/* ==========================================================================
   NEW EXAMPLE (33) — when the second number overwhelms the first

   "when our knowledge is very precise ... the number which expresses the
    uncertainty ... may become insignificant, or utterly vanish. But, when our
    knowledge is very slight, this number may be even more important than the
    probability itself; and when we have no knowledge at all this completely
    overwhelms the other."

   Three regimes, and the same bag in all of them. What moves is how much has
   been drawn; the probable error is the number watched, not the number set,
   because that is the way round it is earned — a probable error is not
   something one chooses, it is what a given amount of drawing leaves you with.
   The sentence of Peirce's that fits the regime lights up as you pass through
   it, so the paragraph is read by moving the slider.

   The end of the range is the point of the example. At nothing drawn there is
   no curve to draw, because there is no fact: the flat line the conceptualist
   puts there is shown as his, and named as his, beside the answer Peirce says
   ought to be given instead.
   ========================================================================*/
registerExample("example-ex33", (box) => {
  box.appendChild(exHeader("Interactive Example: When the Second Number Overwhelms the First", "ex33-content"));
  const content = h(`<div id="ex33-content" class="example-content">
    <div class="mode-tabs">
      <button class="mode-tab active" data-view="pe">Set the probable error</button>
      <button class="mode-tab" data-view="beans">Set the drawings</button>
    </div>
    <div class="row">
      <div class="col col-7">
        <div id="ex33-ctl-pe"></div>
        <div id="ex33-ctl-beans" style="display:none;"></div>
      </div>
      <div class="col col-5"><div class="ex-buttonbar">
        <button class="btn btn-primary btn-sm" data-act="one"></button>
        <button class="btn btn-warning btn-sm" data-act="newbag">New bag</button>
      </div></div>
    </div>
    <div id="ex33-numbers"></div>
    <div class="plot-container" id="ex33-plot"></div>
    <div id="ex33-say"></div>
  </div>`);
  box.appendChild(content);

  /* --------------------------------------------------------------------------
     Two ways at the same passage.

     Setting the probable error is the argument as Peirce states it: the second
     number is the quantity under discussion, so it is the one in your hand, and
     what follows from it — how much drawing it would take to have earned it —
     is displayed. Take it to nothing and the bag is counted; take it far enough
     the other way and it stands for less than a single drawing, which is to say
     nothing has been drawn at all.

     Setting the drawings is the same claim on the bag of 10 and 11, where the
     probable error is not chosen but earned. The two disagree about nothing;
     they differ in which number is the handle.
     ------------------------------------------------------------------------*/
  let mode = "pe";

  const MAXN = 30000;
  const STOPS = [0, 1, 2, 3, 5, 8, 13, 20, 35, 60, 100, 175, 300, 500, 900,
    1500, 2600, 4500, 8000, 14000, 25000];

  /* At the worst case, as elsewhere in the paper, so that the two numbers are
     not each other's hostage: the error a given amount of drawing leaves you
     with, and the drawing a given error implies, are then one formula read
     both ways. */
  const peFromN = (n) => (n > 0 ? 0.477 / Math.sqrt(2 * n) : 0.5);
  const nFromPE = (pe) => (pe > 0 ? 0.5 * Math.pow(0.477 / pe, 2) : Infinity);
  const PE_AT_ONE = peFromN(1);          // above this, less than one drawing

  $("#ex33-ctl-pe", content).appendChild(
    slider("ex33_pe", "The probable error:", 0, 0.5, 0.06, 0.002,
      (v) => (v === 0 ? "nothing — the bag is counted"
        : v >= 0.5 ? "±0.500 — the whole interval" : `±${v.toFixed(3)}`), "k2"));
  $("#ex33-ctl-beans", content).appendChild(
    slider("ex33_i", "Beans drawn from the bag:", 0, STOPS.length - 1, 8, 1,
      (v) => (STOPS[v] === 0 ? "none at all" : bigmark(STOPS[v])), "k1"));

  let truth = 0.5, cum = new Int32Array(0), extra = 0;

  function newBag() {
    truth = 0.12 + Math.random() * 0.76;
    cum = new Int32Array(MAXN + 1);
    for (let k = 1; k <= MAXN; k++) cum[k] = cum[k - 1] + (Math.random() < truth ? 1 : 0);
    extra = 0;
  }
  newBag();

  /* The regime is decided on the unrounded count. An error of ±0.44 stands for
     six-tenths of a drawing, which is to say none; rounding first would have
     called that one drawing and never reached the case the passage is really
     about. */
  function state() {
    let raw, pe;
    if (mode === "pe") {
      pe = num("ex33_pe");
      raw = nFromPE(pe);
    } else {
      raw = STOPS[Math.round(num("ex33_i"))] + extra;
      pe = raw > 0 ? peFromN(raw) : 0.5;
    }
    const exact = !Number.isFinite(raw);
    const none = !exact && raw < 1;
    const drawn = exact ? MAXN : Math.min(MAXN, Math.max(1, Math.round(raw)));
    const p = exact ? truth : (none ? null : cum[drawn] / drawn);
    const regime = exact ? "precise" : none ? "none"
      : (pe <= 0.02 ? "precise" : (pe >= 0.12 ? "slight" : "middling"));
    /* One more drawing moves both numbers, and the first is the one the rule of
       succession is working on: white takes the proportion up by (1-p)/(n+1),
       black takes it down by p/(n+1). It is the larger movement of the two by a
       factor of about three root n, which is worth being able to see. */
    const up = (exact || none) ? 0 : (1 - p) / (drawn + 1);
    const down = (exact || none) ? 0 : p / (drawn + 1);
    return { raw: raw, exact: exact, none: none, drawn: drawn, p: p,
      pe: exact ? 0 : pe, regime: regime, up: up, down: down,
      moves: exact ? 0 : Math.abs(peFromN(Math.max(1, raw)) - peFromN(Math.max(1, raw) + 1)) };
  }

  const canvas = mkCanvas(340, (pl) => {
    const st = state();
    if (st.regime === "none") {
      /* no curve, because there is no fact. The flat line is drawn, but as the
         conceptualist's answer and labelled as his. */
      pl.setup({ xlim: [0, 1], ylim: [0, 1], mar: [4, 3, 3, 2] });
      pl.axes({ nx: 5, yat: [] });
      pl.box();
      pl.axisLabels("Proportion white in the bag", null);
      pl.title("Not so much as one drawing", { cex: 1.0 });
      pl.clip(true);
      pl.rect(0, 0, 1, 1, { col: "rgba(138,144,153,0.10)", border: null });
      pl.abline({ h: 0.5, col: "#a8adb4", lwd: 2, lty: 2 });
      pl.clip(false);
      pl.text(0.5, 0.58, "an even chance — what the conceptualist puts here",
        { cex: 0.8, col: "#8a9099" });
      pl.text(0.5, 0.28, "entirely indefinite", { cex: 1.15, col: "#8a4331", font: 2 });
      return;
    }
    if (st.exact) {
      pl.setup({ xlim: [0, 1], ylim: [0, 1], mar: [4, 3, 3, 2] });
      pl.axes({ nx: 5, yat: [] });
      pl.box();
      pl.axisLabels("Proportion white in the bag", null);
      pl.title("The contents absolutely known", { cex: 1.0 });
      pl.clip(true);
      pl.abline({ v: st.p, col: "#2f6f9f", lwd: 3 });
      pl.clip(false);
      pl.text(Math.min(0.86, Math.max(0.14, st.p)), 0.62, `exactly ${fmt(st.p, 4)}`,
        { cex: 0.9, col: "#2f6f9f", font: 2 });
      pl.text(0.5, 0.24, "no width at all — a drawing could teach nothing",
        { cex: 0.8, col: "#575d66" });
      return;
    }
    /* the spread that goes with the probable error being used — pe is 0.6745
       of it exactly — rather than one read off p-hat, which collapses to
       nothing the moment a short run comes out all one way and leaves no curve
       to draw at just the point where there is least to go on */
    const sd = 1 / (2 * Math.sqrt(st.drawn));
    const xs = [], ys = [];
    for (let j = 0; j <= 600; j++) { const x = j / 600; xs.push(x); ys.push(dnorm(x, st.p, sd)); }
    const maxY = Math.max(...ys);
    pl.setup({ xlim: [0, 1], ylim: [0, maxY * 1.3], mar: [4, 3, 3, 2] });
    pl.axes({ nx: 5, yat: [] });
    pl.box();
    pl.axisLabels("Proportion white in the bag", null);
    pl.title(`On ${bigmark(st.drawn)} drawing${st.drawn === 1 ? "" : "s"}`, { cex: 1.0 });
    pl.clip(true);
    const lo = Math.max(0, st.p - st.pe), hi = Math.min(1, st.p + st.pe);
    const band = [];
    xs.forEach((x, j) => { if (x >= lo && x <= hi) band.push(j); });
    if (band.length) {
      const bx = band.map((j) => xs[j]), by = band.map((j) => ys[j]);
      pl.polygon(bx.concat(bx.slice().reverse()), bx.map(() => 0).concat(by.slice().reverse()),
        { col: "rgba(176,86,63,0.22)" });
    }
    pl.lines(xs, ys, { col: "#2f6f9f", lwd: 2.5 });
    pl.abline({ v: st.p, col: "#2f6f9f", lwd: 2, lty: 2 });
    pl.arrows(lo, maxY * 0.42, hi, maxY * 0.42,
      { code: 3, angle: 20, length: 6, lwd: 1.5, col: "#8a4331" });
    pl.clip(false);
    pl.legend(st.p < 0.5 ? "topright" : "topleft", {
      legend: [`the proportion, ${fmt(st.p, 4)}`, `the probable error, ±${fmt(st.pe, 4)}`],
      col: ["#2f6f9f", "rgba(176,86,63,0.6)"], lwd: [2.5, 9], lty: [1, 1], cex: 0.7
    });
  });
  $("#ex33-plot", content).appendChild(canvas);

  /* Peirce's own sentences, lit by the regime the slider is standing in */
  function light(st) {
    [["ex33-cl-precise", "precise"], ["ex33-cl-slight", "slight"], ["ex33-cl-none", "none"]]
      .forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("hl-on", st.regime === key);
      });
  }

  function update() {
    const st = state();
    light(st);

    $("[data-act='one']", content).textContent =
      mode === "pe" ? "Take one more sample" : "Draw one more bean";

    const implied = st.exact ? "the whole bag counted"
      : st.none ? "fewer than one drawing — nothing has been drawn"
      : `${bigmark(st.drawn)} drawing${st.drawn === 1 ? "" : "s"}`;

    $("#ex33-numbers", content).innerHTML = `<p style="margin-top:0;">
      <span style="color:#2f6f9f;">First number &mdash; the proportion</span>
      <strong style="color:#2f6f9f;font-size:1.15em;">${st.p === null ? "&mdash;" : fmt(st.p, 4)}</strong>
      &nbsp;&nbsp;&middot;&nbsp;&nbsp;
      <span style="color:#b0563f;">Second number &mdash; the probable error</span>
      <strong style="color:#b0563f;font-size:1.15em;">${st.regime === "none" ? "&mdash;"
        : "&plusmn;" + fmt(st.pe, 4)}</strong>
      <br><span style="color:#575d66;">${mode === "pe"
        ? `An error of that size is what you have after <strong>${implied}</strong>.`
        : (st.none ? "Nothing has been drawn."
          : "That much drawing leaves you with an error of that size.")}
        ${st.none ? "" : `One more would move the first number by ${st.exact ? "nothing"
          : `+${fmt(st.up, 4)} if it came up white, &minus;${fmt(st.down, 4)} if black`}, and the second by
          ${fmt(st.moves, 6)}.`}</span></p>`;

    const say = {
      precise: `The bag is as good as counted. The second number has all but vanished, and one more drawing
        would move it by ${fmt(st.moves, 6)} &mdash; nothing anybody would trouble to write down. Here the
        conceptualist and the materialist agree, because here the second number can be dropped without
        anything being lost. This is the case the books are full of.`,
      middling: `The two numbers are of a size. The proportion says something and the probable error says how
        far to trust it, and neither can be dropped in favour of the other.`,
      slight: "",
      none: `The error is wider than a single drawing could ever leave it, so nothing has been drawn: there is
        no proportion and no error either. The conceptualist still answers &mdash; an even chance. But a half
        here is not a measurement that came out at a half. It is the absence of any measurement, written in
        the same notation, and the notation is what makes it look like a fact. What ought to be said is that
        the chance is entirely indefinite.`
    }[st.regime];
    $("#ex33-say", content).innerHTML = say ? `<div class="note-block">${say}</div>` : "";
    drawCanvas(canvas);
  }

  content.addEventListener("input", () => { if (mode === "beans") extra = 0; update(); });
  content.addEventListener("click", (ev) => {
    const tab = ev.target.closest(".mode-tab");
    if (tab) {
      mode = tab.getAttribute("data-view");
      $$(".mode-tab", content).forEach((x) => x.classList.toggle("active", x === tab));
      $("#ex33-ctl-pe", content).style.display = mode === "pe" ? "" : "none";
      $("#ex33-ctl-beans", content).style.display = mode === "beans" ? "" : "none";
      extra = 0;
      update();
      return;
    }
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "one") {
      if (mode === "beans") extra++;
      else {
        /* one more sample, expressed as what it does to the error one is
           holding: the slider steps down by exactly that much */
        const st = state();
        if (!st.exact) setSlider("ex33_pe",
          Math.max(0, Math.round(peFromN(Math.max(1, st.raw) + 1) / 0.002) * 0.002));
      }
    } else if (a === "newbag") { newBag(); extra = 0; }
    else return;
    update();
  });

  /* the highlighting belongs to the example, so it goes out with it */
  new MutationObserver(() => {
    const on = document.getElementById("example-ex33").classList.contains("open");
    if (on) update();
    else ["ex33-cl-precise", "ex33-cl-slight", "ex33-cl-none"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("hl-on");
    });
  }).observe(document.getElementById("example-ex33"), { attributes: true, attributeFilter: ["class"] });

  update();
});
</script>
