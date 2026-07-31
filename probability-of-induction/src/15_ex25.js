<script>
/* ==========================================================================
   EXAMPLE 25 — The conclusion, or the proceeding

   Analytic: the class is fixed by the FORM of the premises. Every argument of
   that form carries truth at the same rate, and the rate belongs to the
   conclusion.

   Synthetic: the class is fixed by HOW THE PREMISES WERE GOT. The inquiries
   have nothing in common — different subjects, different proportions — but
   the procedure is one procedure, and its rate is calculable. Concluding that
   the truth lies within the probable error of what was drawn comes off about
   half the time whatever is being inquired into, which is a fact about the
   proceeding and about no conclusion in particular.
   ========================================================================*/
registerExample("example-ex25", (box) => {
  box.appendChild(exHeader("Interactive Example: The Conclusion, or the Proceeding", "ex25-content"));
  const content = h(`<div id="ex25-content" class="example-content">
    <div class="row">
      <div class="col col-6">
        <h5>Analytic &mdash; the rate belongs to the conclusion</h5>
        <p style="font-size:0.92em;">Premises of one form: so many in a hundred are liars, this is
          one of them, therefore this is a liar. Every argument of that form is alike, so the rate at
          which the form carries truth is the rate for any conclusion drawn by it.</p>
        <div id="ex25-controls-a"></div>
        <button class="btn btn-primary btn-sm" data-act="runA">Run a thousand</button>
        <button class="btn btn-warning btn-sm" data-act="resetA">Reset</button>
        <div id="ex25-out-a"></div>
      </div>
      <div class="col col-6">
        <h5>Synthetic &mdash; the rate belongs to the proceeding</h5>
        <p style="font-size:0.92em;">Five inquiries with nothing in common but the way the premises
          were got: draw a sample, and conclude that the truth lies within the probable error of what
          was drawn. The subjects differ, the proportions differ, the procedure does not.</p>
        <div id="ex25-controls-b"></div>
        <button class="btn btn-primary btn-sm" data-act="runB">Run a thousand each</button>
        <button class="btn btn-warning btn-sm" data-act="resetB">Reset</button>
        <div class="plot-container" id="ex25-plot-b"></div>
      </div>
    </div>
    <div id="ex25-table"></div>
    <div id="ex25-verdict"></div>
  </div>`);
  box.appendChild(content);

  $("#ex25-controls-a", content).appendChild(
    slider("ex25_q", "Liars in a hundred:", 1, 99, 99, 1, (v) => `${v} in 100`));
  $("#ex25-controls-b", content).appendChild(
    slider("ex25_s", "Instances drawn in each inquiry:", 10, 400, 100, 10));

  let aHit = 0, aTry = 0;

  /* Five inquiries out of the paper, with proportions that have nothing to do
     with one another. Only the manner of obtaining the premises is shared. */
  const INQUIRIES = [
    { name: "The tide at Biscay", p: 0.93 },
    { name: "White beans in the bag", p: 0.50 },
    { name: "Cretans who are liars", p: 0.62 },
    { name: "Males among births", p: 0.508 },
    { name: "Days a tornado follows the sign", p: 0.28 }
  ];
  let bHit = INQUIRIES.map(() => 0), bTry = INQUIRIES.map(() => 0);

  const probableError = (p, s) => (s > 0 ? 0.477 * Math.sqrt(2 * p * (1 - p) / s) : 0);

  function runA(n) {
    const q = num("ex25_q") / 100;
    for (let i = 0; i < n; i++) { if (Math.random() < q) aHit++; aTry++; }
  }

  function runB(n) {
    const s = num("ex25_s");
    INQUIRIES.forEach((inq, i) => {
      for (let t = 0; t < n; t++) {
        let k = 0;
        for (let j = 0; j < s; j++) if (Math.random() < inq.p) k++;
        const phat = k / s;
        // the conclusion: the truth lies within the probable error of what was drawn
        if (Math.abs(phat - inq.p) <= probableError(inq.p, s) + 1e-12) bHit[i]++;
        bTry[i]++;
      }
    });
  }

  const canvasB = mkCanvas(240, (pl) => {
    const n = INQUIRIES.length;
    pl.setup({ xlim: [0.4, n + 0.6], ylim: [0, 1], mar: [4, 5, 2.5, 1.5] });
    pl.axes({ xat: INQUIRIES.map((_, i) => i + 1), xlabels: INQUIRIES.map((_, i) => String(i + 1)) });
    pl.box();
    pl.axisLabels("Inquiry", "Conclusion true");
    pl.clip(true);
    INQUIRIES.forEach((inq, i) => {
      // what is being concluded about differs wildly...
      pl.rect(i + 0.62, 0, i + 0.96, inq.p, { col: "rgba(150,150,150,0.35)", border: "#b0b5bb" });
      // ...while the rate at which the proceeding succeeds does not
      if (bTry[i]) {
        pl.rect(i + 1.04, 0, i + 1.38, bHit[i] / bTry[i],
          { col: "rgba(44,127,184,0.7)", border: "#24587d" });
      }
    });
    pl.abline({ h: 0.5, col: "#b0563f", lwd: 2, lty: 2 });
    pl.clip(false);
    pl.legend("topright", {
      legend: ["The truth inquired into", "How often the proceeding was right", "A half"],
      fill: ["rgba(150,150,150,0.35)", "rgba(44,127,184,0.7)", "#b0563f"], cex: 0.65
    });
  });
  $("#ex25-plot-b", content).appendChild(canvasB);

  function update() {
    const q = num("ex25_q") / 100, s = num("ex25_s");

    $("#ex25-out-a", content).innerHTML = `<div class="key-insight" style="margin-top:0;">
      <p style="margin-bottom:6px;">${aTry ? `True in <strong>${bigmark(aHit)}</strong> of
        <strong>${bigmark(aTry)}</strong> (${fmt(aHit / aTry, 4)}).` : "Nothing run yet."}</p>
      <p style="margin-bottom:0;">The form carries truth <strong>${fmt(q, 2)}</strong> of the time,
        and that is the probability of any conclusion it yields.</p></div>`;

    const rows = INQUIRIES.map((inq, i) => `<tr>
      <td class="lbl">${i + 1}. ${inq.name}</td>
      <td>${fmt(inq.p, 3)}</td>
      <td>&plusmn;${fmt(probableError(inq.p, s), 4)}</td>
      <td><strong>${bTry[i] ? fmt(bHit[i] / bTry[i], 4) : "&mdash;"}</strong></td></tr>`).join("");
    const totH = bHit.reduce((a, b) => a + b, 0), totT = bTry.reduce((a, b) => a + b, 0);
    $("#ex25-table", content).innerHTML = `<div class="table-scroll"><table class="tbl">
      <thead><tr><th style="text-align:left;">Inquiry</th><th>The truth</th>
        <th>Probable error at ${s}</th><th>Proceeding right</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
      <p class="help-text">${totT ? `Over all five, the proceeding was right
        ${fmt(totH / totT, 4)} of the time.` : "Run the inquiries to fill the last column."}</p>`;

    $("#ex25-verdict", content).innerHTML = `<div class="note-block">
      <p>On the left, every argument shares a form, so the rate at which the form carries truth is
      the rate for the conclusion. Say ${num("ex25_q")} in a hundred and the conclusion drawn about
      any particular Cretan is right ${fmt(q, 2)} of the time. The number is the probability of the
      conclusion.</p>
      <p>On the right, the second column shows how little the five have to do with each other, and
      the last shows how little that matters. The tide, the beans and the tornado sign are not alike,
      and no probability has been assigned to any of them. What is calculable is how often this way
      of getting at a proportion comes off, and it comes off at about a half whichever inquiry it is
      turned on &mdash; because a half is what the probable error was defined to deliver.</p>
      <p>So the synthetic case yields no probability for its conclusion. It yields the degree of
      trustworthiness of the proceeding, and that is a different thing, got by classing the
      inferences not by what they say but by how they were come by.</p></div>`;

    drawCanvas(canvasB);
  }

  content.addEventListener("input", () => {
    aHit = 0; aTry = 0; bHit = INQUIRIES.map(() => 0); bTry = INQUIRIES.map(() => 0); update();
  });
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "runA") runA(1000);
    else if (a === "resetA") { aHit = 0; aTry = 0; }
    else if (a === "runB") runB(1000);
    else if (a === "resetB") { bHit = INQUIRIES.map(() => 0); bTry = INQUIRIES.map(() => 0); }
    else return;
    update();
  });
  update();
});
</script>
