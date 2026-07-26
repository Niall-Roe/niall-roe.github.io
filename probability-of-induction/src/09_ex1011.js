<script>
/* ==========================================================================
   EXAMPLE 10 — The bag of beans: forming a belief by drawing
   ========================================================================*/
registerExample("example-ex10", (box) => {
  box.appendChild(exHeader("Interactive Example: Sampling the Bag of Beans", "ex10-content"));
  const content = h(`<div id="ex10-content" class="example-content">
    <p>One bean has been taken at random and hidden under the thimble. The proportion of white beans in the bag
      is not shown to you. Draw beans singly, each thrown back and the bag mixed after every drawing, and watch
      the judgment form.</p>
    <div class="row">
      <div class="col col-4">
        <div style="margin-bottom:12px;">
          <button class="btn btn-primary btn-block" data-act="d1">Draw one bean</button>
          <button class="btn btn-primary btn-block" data-act="d10">Draw ten</button>
          <button class="btn btn-primary btn-block" data-act="d100">Draw a hundred</button>
          <button class="btn btn-primary btn-block" data-act="d1000">Draw a thousand</button>
        </div>
        <button class="btn btn-warning btn-block btn-sm" data-act="newbag">New bag (unknown proportion)</button>
        <button class="btn btn-block btn-sm" data-act="reveal">Look inside the bag</button>
        <hr>
        <div id="ex10-thimble"></div>
      </div>
      <div class="col col-8">
        <div id="ex10-state"></div>
        <div id="ex10-chips"></div>
      </div>
    </div>
    <div class="plot-container" id="ex10-plot"></div>
    <div id="ex10-verdict"></div>
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

  const probableError = (p, s) => (s > 0 ? 0.477 * Math.sqrt(2 * p * (1 - p) / s) : 0);

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
    pl.title("The judgment forming as the drawings accumulate", { cex: 1.05 });
    pl.clip(true);
    const xs = path.map((d) => Math.log10(d.n));
    const hi = path.map((d) => Math.min(1, d.phat + probableError(d.phat, d.n)));
    const lo = path.map((d) => Math.max(0, d.phat - probableError(d.phat, d.n)));
    pl.polygon(xs.concat(xs.slice().reverse()), hi.concat(lo.slice().reverse()),
      { col: "rgba(44,127,184,0.18)" });
    pl.lines(xs, path.map((d) => d.phat), { col: "#2c7fb8", lwd: 2.5 });
    pl.abline({ h: 0.5, col: "#999", lwd: 1, lty: 3 });
    if (revealed) {
      pl.abline({ h: truth, col: "orange", lwd: 2.5 });
      pl.text(Math.log10(sMax) * 0.5, truth + 0.05, `true proportion ${fmt(truth, 3)}`,
        { cex: 0.8, col: "#b8860b", font: 2 });
    }
    pl.clip(false);
    pl.legend("bottomright", {
      legend: revealed ? ["Proportion drawn (± probable error)", "Even chance", "Truth"] : ["Proportion drawn (± probable error)", "Even chance"],
      col: revealed ? ["#2c7fb8", "#999", "orange"] : ["#2c7fb8", "#999"],
      lwd: [2.5, 1, 2.5], lty: [1, 3, 1], cex: 0.75
    });
  });
  $("#ex10-plot", content).appendChild(canvas);

  function update() {
    const phat = total ? white / total : 0.5;
    const pe = probableError(phat, total);

    $("#ex10-thimble", content).innerHTML = `
      <p style="font-size:0.9em;margin-bottom:6px;"><strong>Under the thimble:</strong></p>
      <div style="width:90px;height:90px;border-radius:50%;margin:0 auto;border:4px solid #333;
        background:${revealed ? (hidden === "white" ? "#f5f5f0" : "#2b2b2b") : "#8a7f6d"};
        color:${revealed && hidden === "white" ? "#333" : "#fff"};display:flex;align-items:center;
        justify-content:center;font-weight:bold;font-size:${revealed ? "0.95em" : "2em"};">
        ${revealed ? hidden : "?"}</div>`;

    $("#ex10-state", content).innerHTML = `<div class="key-insight" style="margin-top:0;">
      <p style="margin-bottom:6px;"><strong>${bigmark(white)}</strong> white in
        <strong>${bigmark(total)}</strong> drawings.</p>
      <p style="margin-bottom:6px;">Proportion white so far: <strong>${total ? fmt(phat, 4) : "&mdash;"}</strong>
        ${total ? `&nbsp;&plusmn;&nbsp;${fmt(pe, 4)} (probable error)` : ""}</p>
      <p style="margin-bottom:0;">So the chance that the hidden bean is white stands at
        <strong>${total ? fmt(phat, 3) : "&mdash;"}</strong>, and that estimate is
        ${total ? `good to about &plusmn;${fmt(pe, 3)}` : "not yet founded on anything"}.</p></div>`;

    const chips = recent.map((w) =>
      `<span style="display:inline-block;width:13px;height:13px;margin:1px;border:1px solid #999;
        border-radius:2px;background:${w ? "#f5f5f0" : "#2b2b2b"};"></span>`).join("");
    $("#ex10-chips", content).innerHTML = total
      ? `<p style="font-size:0.85em;margin-bottom:4px;color:#555;">
           ${total > recent.length ? `Last ${recent.length} drawings:` : "The drawings:"}</p><div>${chips}</div>`
      : "";

    let verdict;
    if (total === 0) verdict = "Nothing has been drawn. There is no fact yet for a probability to express.";
    else if (total < 3) verdict = "&ldquo;We conclude that there is not an immense preponderance of either color&rdquo; &mdash; but on two drawings that is almost all we may say.";
    else if (total < 30) verdict = "A handful of drawings. The proportion is beginning to show, but the probable error is still wide enough to cover a great many bags.";
    else if (total < 500) verdict = "The estimate is settling. Notice that it is the second number, the probable error, that has been doing most of the moving.";
    else verdict = "&ldquo;When we have drawn a thousand times&hellip; we have great confidence in this result.&rdquo; The probable error is now small enough that we could insure ourselves in the long run by betting on it.";
    $("#ex10-verdict", content).innerHTML = `<div class="note-block">${verdict}</div>`;
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
    else if (a === "reveal") revealed = true;
    else return;
    update();
  });
  update();
});

/* ==========================================================================
   EXAMPLE 11 — "not one number but two are requisite"
   ========================================================================*/
registerExample("example-ex11", (box) => {
  box.appendChild(exHeader("Interactive Example: Two Numbers, Not One", "ex11-content"));
  const content = h(`<div id="ex11-content" class="example-content">
    <p>Three records of drawings from three bags. Every one of them reports the same proportion &mdash; an even
      chance &mdash; and no single number can tell them apart. Yet nobody would bet on them alike.</p>
    <div class="row">
      <div class="col col-4"><div class="control-panel" id="ex11-controls"></div></div>
      <div class="col col-8"><div class="table-scroll" id="ex11-table"></div></div>
    </div>
    <div class="plot-container" id="ex11-plot"></div>
    <div class="note-block">Read the plane downward and the three records separate cleanly. Read it along the
      bottom axis alone &mdash; which is all a single number of belief can do &mdash; and they collapse onto the
      same point. That is the whole of Peirce's objection: &ldquo;the second on the amount of knowledge on which
      that probability is based.&rdquo; The next passage shows a rule that keeps only the first number.</div>
  </div>`);
  box.appendChild(content);

  const ctl = $("#ex11-controls", content);
  ctl.appendChild(slider("ex11_s", "Your own record &mdash; beans drawn:", 2, 5000, 40, 1, (v) => bigmark(v)));
  ctl.appendChild(slider("ex11_p", "Your own record &mdash; proportion white:", 0.02, 0.98, 0.5, 0.01, (v) => v.toFixed(2)));
  content.addEventListener("input", () => update());

  const probableError = (p, s) => (s > 0 ? 0.477 * Math.sqrt(2 * p * (1 - p) / s) : 0);
  const cases = () => ([
    { label: "Two drawings", s: 2, p: 0.5, col: "#c1523f" },
    { label: "Ten drawings", s: 10, p: 0.5, col: "#d99a2b" },
    { label: "A thousand drawings", s: 1000, p: 0.5, col: "#2c7fb8" },
    { label: "Your record", s: num("ex11_s"), p: num("ex11_p"), col: "#5a3f8f" }
  ]);

  const canvas = mkCanvas(420, (pl) => {
    const cs = cases();
    const sMax = Math.max(5000, ...cs.map((c) => c.s)) * 1.6;
    pl.setup({ xlim: [0, 1], ylim: [Math.log10(1.2), Math.log10(sMax)], mar: [4, 6, 3, 2] });
    const decades = [];
    for (let e = 0; e <= Math.ceil(Math.log10(sMax)); e++) {
      [1, 2, 5].forEach((m) => { const v = m * Math.pow(10, e); if (v >= 1.2 && v <= sMax) decades.push(v); });
    }
    pl.axes({ yat: decades.map(Math.log10), ylabels: decades.map((v) => bigmark(v)), nx: 5 });
    pl.box();
    pl.axisLabels("First number — the inferred probability", "Second number — drawings it rests on");
    pl.title("The state of belief is a point in a plane, not on a line", { cex: 1.05 });
    pl.clip(true);
    cs.forEach((c) => {
      const y = Math.log10(c.s);
      const pe = probableError(c.p, c.s);
      pl.segments(Math.max(0, c.p - pe), y, Math.min(1, c.p + pe), y, { col: c.col, lwd: 6 });
      pl.segments(c.p, y, c.p, Math.log10(1.2), { col: c.col, lwd: 1, lty: 3 });
      pl.points([c.p], [y], { col: c.col, cex: 1.7 });
      pl.text(c.p, y + 0.13, `${c.label} (±${fmt(pe, 3)})`, { cex: 0.75, font: 2, col: c.col });
    });
    pl.clip(false);
    // the collapse onto one number
    pl.text(0.5, Math.log10(1.35), "projected onto one number, all four coincide", { cex: 0.75, col: "#777", font: 3 });
  });
  $("#ex11-plot", content).appendChild(canvas);

  function update() {
    const rows = cases().map((c) => {
      const pe = probableError(c.p, c.s);
      return `<tr><td style="text-align:left;color:${c.col};font-weight:700;">${c.label}</td>
        <td>${bigmark(c.s)}</td><td>${fmt(c.p, 3)}</td><td>&plusmn;${fmt(pe, 4)}</td>
        <td>${fmt(Math.max(0, c.p - pe), 3)} to ${fmt(Math.min(1, c.p + pe), 3)}</td></tr>`;
    }).join("");
    $("#ex11-table", content).innerHTML = `<table class="tbl">
      <thead><tr><th style="text-align:left;">Record</th><th>Drawings</th>
        <th>First number<br>(probability)</th><th>Second number<br>(probable error)</th>
        <th>The bag could be</th></tr></thead><tbody>${rows}</tbody></table>`;
    drawCanvas(canvas);
  }
  update();
});
</script>
