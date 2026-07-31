<script>
/* ==========================================================================
   EXAMPLE 5 — Peirce's dice problems
   ========================================================================*/
const EX5_PRESETS = {
  single_six: { name: "Single die shows 6", rule: "Basic Probability",
    ruleFormula: "P(A → B) = (# times A and B occur) / (# times A occurs)",
    nDice: 1, type: "single", target: 6, formula: "P(die = 6) = 1/6",
    explanation: "One outcome (6) out of six equally likely outcomes." },
  double_sixes: { name: "Both dice show 6", rule: "Multiplication Rule (Independent Events)",
    ruleFormula: "P(A → B∧C) = P(A → B) × P(A → C)  [when B and C are independent]",
    nDice: 2, type: "both_match", target: 6, formula: "P(both = 6) = 1/6 × 1/6 = 1/36",
    explanation: "The events are independent. The probability that both occur is the product of individual probabilities." },
  deuce_ace: { name: "Deuce-Ace (one shows 2, other shows 1)", rule: "Addition Rule (Incompatible Events)",
    ruleFormula: "P(A → B or C) = P(A → B) + P(A → C)  [when B and C are incompatible]",
    nDice: 2, type: "deuce_ace", formula: "P(2,1 or 1,2) = 1/36 + 1/36 = 1/18",
    explanation: "Two incompatible ways: (first=1, second=2) OR (first=2, second=1). We add their probabilities." },
  sum_seven: { name: "Dice sum to 7", rule: "Addition Rule (Multiple Incompatible Ways)",
    ruleFormula: "P(A → B₁ or ... or Bₙ) = P(A → B₁) + ... + P(A → Bₙ)",
    nDice: 2, type: "sum", target: 7, formula: "P(sum = 7) = 6/36 = 1/6",
    explanation: "Six ways to sum to 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). Each has probability 1/36." },
  at_least_one_six: { name: "At least one die shows 6", rule: "Complement Rule",
    ruleFormula: "P(A → B) = 1 - P(A → not B)",
    nDice: 2, type: "at_least_one", target: 6, formula: "P(at least one 6) = 1 - (5/6)² = 11/36",
    explanation: "Easier to calculate the complement: probability neither shows 6 is (5/6)²." },
  both_even: { name: "Both dice show even numbers", rule: "Multiplication Rule (Independent Events)",
    ruleFormula: "P(A → B∧C) = P(A → B) × P(A → C)  [when B and C are independent]",
    nDice: 2, type: "both_even", formula: "P(both even) = 1/2 × 1/2 = 1/4",
    explanation: "Each die has probability 1/2 of being even (2, 4, or 6). Independent events." },
  doubles: { name: "Any doubles (both dice match)", rule: "Addition Rule (Multiple Incompatible Ways)",
    ruleFormula: "P(A → B₁ or ... or Bₙ) = P(A → B₁) + ... + P(A → Bₙ)",
    nDice: 2, type: "any_doubles", formula: "P(doubles) = 6/36 = 1/6",
    explanation: "Six ways to get doubles: (1,1)-(6,6). Each has probability 1/36." }
};

function ex5Match(type, target, d1, d2) {
  switch (type) {
    case "single": return d1 === target;
    case "both_match": return d1 === target && d2 === target;
    case "deuce_ace": return (d1 === 1 && d2 === 2) || (d1 === 2 && d2 === 1);
    case "sum": return d1 + d2 === target;
    case "at_least_one": return d1 === target || d2 === target;
    case "both_even": return d1 % 2 === 0 && d2 % 2 === 0;
    case "any_doubles": return d1 === d2;
    default: return false;
  }
}
function ex5Favorable(preset) {
  switch (preset.type) {
    case "single": return { fav: 1, tot: 6 };
    case "both_match": return { fav: 1, tot: 36 };
    case "deuce_ace": return { fav: 2, tot: 36 };
    case "sum": {
      let c = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === preset.target) c++;
      return { fav: c, tot: 36 };
    }
    case "at_least_one": return { fav: 11, tot: 36 };
    case "both_even": return { fav: 9, tot: 36 };
    case "any_doubles": return { fav: 6, tot: 36 };
    default: return { fav: NaN, tot: 36 };
  }
}

registerExample("example-ex5", (box) => {
  box.appendChild(exHeader("Interactive Example: Peirce's Dice Problems", "ex5-content"));
  const content = h(`<div id="ex5-content" class="example-content">
    <p>Explore classic dice probability problems using the rules we've learned. Select a preset or run a simulation.</p>
    <div class="key-insight"><strong>Important Note: </strong>These are theoretical problems. The answers give
      expectations about empirical long-run frequencies&mdash;but we solve them with mathematics, not by rolling
      10,000 times, just as we solve geometry with trigonometry rather than a protractor.</div>
    <div class="ex-buttonbar">
      <span class="ex27-lead">Peirce&rsquo;s:</span>
      <button class="btn btn-sm" data-preset="single_six">a six</button>
      <button class="btn btn-sm" data-preset="double_sixes">both sixes</button>
      <button class="btn btn-sm" data-preset="deuce_ace">deuce-ace</button>
      <span class="ex27-lead">others:</span>
      <button class="btn btn-sm" data-preset="sum_seven">sum of 7</button>
      <button class="btn btn-sm" data-preset="at_least_one_six">at least one 6</button>
      <button class="btn btn-sm" data-preset="both_even">both even</button>
      <button class="btn btn-sm" data-preset="doubles">any doubles</button>
    </div>
    <div class="mode-tabs">
      <div class="mode-tab active" id="ex5_tab_theoretical">Theoretical Space</div>
      <div class="mode-tab" id="ex5_tab_empirical">Long-Run Frequency</div>
    </div>
    <div id="ex5_content"></div>
  </div>`);
  box.appendChild(content);

  let mode = "theoretical";
  let preset = EX5_PRESETS.single_six;
  let sim = null;

  $$("[data-preset]", content).forEach((b) => b.addEventListener("click", () => {
    preset = EX5_PRESETS[b.getAttribute("data-preset")];
    sim = null;
    render();
  }));
  $("#ex5_tab_theoretical", content).addEventListener("click", () => { mode = "theoretical"; render(); });
  $("#ex5_tab_empirical", content).addEventListener("click", () => { mode = "empirical"; render(); });

  function theoreticalPlot(pl) {
    if (preset.nDice === 1) {
      pl.setup({ xlim: [0.5, 6.5], ylim: [0.5, 1.5], mar: [4, 4, 3, 2], asp: 1 });
      pl.title("Antecedent Space: Single Die", { cex: 1.2 });
      pl.rect(0.5, 0.5, 6.5, 1.5, { col: "rgba(255,242,204,0.5)", border: null });
      for (let i = 1; i <= 6; i++) {
        const col = i === preset.target ? "rgba(143,237,143,0.7)" : "white";
        pl.rect(i - 0.4, 0.6, i + 0.4, 1.4, { col: col, border: PAL.inkFaint, lwd: 2 });
        pl.text(i, 1, String(i), { cex: 1.5, font: 2 });
      }
      pl.text(3.5, 0.2, "Green cell is the favorable outcome: 1/6", { cex: 1.1, font: 2 });
    } else {
      pl.setup({ xlim: [0.5, 6.5], ylim: [0.5, 6.5], mar: [5, 5, 4, 2], asp: 1 });
      pl.title("Antecedent Space: Two Dice (36 outcomes)", { cex: 1.2 });
      pl.rect(0.5, 0.5, 6.5, 6.5, { col: "rgba(255,242,204,0.4)", border: null });
      for (let d1 = 1; d1 <= 6; d1++) {
        for (let d2 = 1; d2 <= 6; d2++) {
          const col = ex5Match(preset.type, preset.target, d1, d2) ? "rgba(143,237,143,0.7)" : "white";
          pl.rect(d1 - 0.45, d2 - 0.45, d1 + 0.45, d2 + 0.45, { col: col, border: PAL.inkFaint, lwd: 0.5 });
          pl.text(d1, d2, `(${d1},${d2})`, { cex: 0.6 });
        }
      }
      for (let i = 1; i <= 6; i++) {
        pl.text(i, 0.2, String(i), { cex: 0.9 });
        pl.text(0.2, i, String(i), { cex: 0.9 });
      }
      pl.axisLabels("First Die", "Second Die");
    }
  }

  function empiricalPlot(pl) {
    if (!sim) { blankPlot(pl, "Awaiting simulation..."); pl.title("Click 'Run Simulation' to begin", { cex: 1.1 }); return; }
    pl.setup({ xlim: [1, sim.n], ylim: [0, Math.max(1, Math.max(...sim.freq))], mar: [5, 5, 4, 2] });
    pl.grid({});
    pl.axes({});
    pl.box();
    pl.axisLabels("Number of Trials", "Observed Frequency");
    pl.title("Long-Run Frequency Converging to Theoretical Probability", { cex: 1.1 });
    pl.clip(true);
    pl.lines(sim.freq.map((_, i) => i + 1), sim.freq, { col: "#2f6f9f", lwd: 2 });
    pl.abline({ h: sim.pTheory, col: PAL.accent2, lwd: 2, lty: 2 });
    pl.clip(false);
    pl.legend("topright", {
      legend: ["Observed Frequency", `Theoretical P = ${fmt(sim.pTheory, 4)}`],
      col: ["#2f6f9f", PAL.accent2], lwd: [2, 2], lty: [1, 2], bg: "white"
    });
  }

  function render() {
    $("#ex5_tab_theoretical", content).classList.toggle("active", mode === "theoretical");
    $("#ex5_tab_empirical", content).classList.toggle("active", mode === "empirical");
    const host = $("#ex5_content", content);
    host.innerHTML = "";
    if (mode === "theoretical") {
      const res = ex5Favorable(preset);
      const row = h(`<div class="row">
        <div class="col col-5">
          <div class="key-insight">
            <h5><strong>${esc(preset.name)}</strong></h5>
            <p><strong>Rule: </strong>${esc(preset.rule)}</p>
            <p>${esc(preset.explanation)}</p>
            <hr>
            <div style="background-color:#ece8df;padding:10px;border-radius:4px;">
              <p style="margin-bottom:8px;"><strong>General Formula:</strong></p>
              <p style="font-family:monospace;font-size:0.95em;">${esc(preset.ruleFormula)}</p>
            </div>
            <hr>
            <div>
              <h5>Calculation:</h5>
              <p>Favorable outcomes: <strong>${res.fav}</strong></p>
              <p>Total outcomes: <strong>${res.tot}</strong></p>
              <p>Probability: <strong>${res.fav}/${res.tot} = ${fmt(res.fav / res.tot, 4)}</strong></p>
            </div>
          </div>
          <div class="formula-box" style="margin-top:15px;">${esc(preset.formula)}</div>
        </div>
        <div class="col col-7"><div id="ex5-theo-plot"></div></div>
      </div>`);
      host.appendChild(row);
      $("#ex5-theo-plot", row).appendChild(mkCanvas(550, theoreticalPlot));
    } else {
      const row = h(`<div class="row">
        <div class="col col-4">
          <p class="key-insight"><strong>Empirical View: </strong>Run trials to see the long-run frequency converge
            to the theoretical probability. Our calculations predict real-world outcomes.</p>
          <hr>
          <div id="ex5-sim-controls"></div>
          <button class="btn btn-primary btn-lg" id="ex5_run_sim" style="width:100%;">Run Simulation</button>
          <hr>
          <div id="ex5_empirical_summary"></div>
        </div>
        <div class="col col-8"><div id="ex5-emp-plot"></div></div>
      </div>`);
      host.appendChild(row);
      $("#ex5-sim-controls", row).appendChild(slider("ex5_n_trials", "Number of trials:", 10, 10000, 100, 10));
      const canvas = mkCanvas(550, empiricalPlot);
      $("#ex5-emp-plot", row).appendChild(canvas);
      const summary = $("#ex5_empirical_summary", row);
      const showSummary = () => {
        if (!sim) { summary.innerHTML = "<p>Run a simulation to see results.</p>"; return; }
        const finalFreq = sim.freq[sim.n - 1];
        summary.innerHTML = `<h5>Results:</h5>
          <p>Trials run: <strong>${sim.n}</strong></p>
          <p>Successes: <strong>${sim.nSuccesses}</strong></p>
          <p>Observed frequency: <strong>${fmt(finalFreq, 4)}</strong></p>
          <p>Theoretical probability: <strong>${fmt(sim.pTheory, 4)}</strong></p>
          <p>Difference: <strong>${fmt(Math.abs(finalFreq - sim.pTheory), 4)}</strong></p>`;
      };
      showSummary();
      $("#ex5_run_sim", row).addEventListener("click", () => {
        const n = num("ex5_n_trials");
        const freq = []; let cum = 0;
        for (let i = 0; i < n; i++) {
          const d1 = 1 + sampleInt(6), d2 = 1 + sampleInt(6);
          if (ex5Match(preset.type, preset.target, d1, d2)) cum++;
          freq.push(cum / (i + 1));
        }
        const res = ex5Favorable(preset);
        sim = { freq: freq, pTheory: res.fav / (preset.nDice === 1 ? 6 : 36), n: n, nSuccesses: cum };
        showSummary(); drawCanvas(canvas);
      });
    }
    redrawAll();
  }
  render();
});

/* ==========================================================================
   EXAMPLE 6 — Two independent arguments bearing on one conclusion
   ========================================================================*/
/* --------------------------------------------------------------------------
   Examples 6, 7 and 8 work the same pair of arguments — Peirce's 81 and 93 —
   and no two of them fit on a screen together. So there is one pair of values
   here, and each panel's sliders are a view onto it: move one and the others
   physically move with it. A panel built later adopts the pair as it stands,
   which is the part that was missing before — scrolling to a panel that had
   never been opened found it back at the defaults.
   ------------------------------------------------------------------------*/
const EX678 = { r: 0.81, s: 0.93, syncing: false };
const EX678_GROUPS = [["ex6_r", "ex7_r", "ex8_p1"], ["ex6_s", "ex7_s", "ex8_p2"]];

function ex678Mirror(id) {
  if (EX678.syncing) return;
  const gi = EX678_GROUPS.findIndex((g) => g.includes(id));
  if (gi < 0) return;
  const src = document.getElementById(id);
  if (!src) return;
  EX678.syncing = true;
  if (gi === 0) EX678.r = +src.value; else EX678.s = +src.value;
  EX678_GROUPS[gi].filter((x) => x !== id).forEach((other) => {
    const el = document.getElementById(other);
    if (el && el.value !== src.value) {
      el.value = src.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  EX678.syncing = false;
}

/* called by each panel once its own sliders exist */
function ex678Adopt() {
  EX678.syncing = true;
  EX678_GROUPS.forEach((g, gi) => {
    const v = String(gi === 0 ? EX678.r : EX678.s);
    g.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.value !== v) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }
    });
  });
  EX678.syncing = false;
}

document.addEventListener("input", (ev) => {
  if (ev.target && ev.target.id) ex678Mirror(ev.target.id);
}, true);

registerExample("example-ex6", (box) => {
  const content = h(`<div id="ex6-content" class="example-content">
    <div class="row">
      <div class="col col-6"><h5><span class="math">A</span><sub>1</sub> &rarr; <span class="math">C</span></h5>
        <div id="ex6-r-slider"></div></div>
      <div class="col col-6"><h5><span class="math">A</span><sub>2</sub> &rarr; <span class="math">C</span></h5>
        <div id="ex6-s-slider"></div></div>
    </div>

    <div class="mode-tabs">
      <button class="mode-tab active" data-mode="expected">The hundred as expected</button>
      <button class="mode-tab" data-mode="trial">A hundred actual cases</button>
    </div>

    <div class="ex-buttonbar" id="ex6-actions"></div>

    <div class="row" id="ex6-grids">
      <div class="col col-4"><div class="plot-container" id="ex6-g1"></div></div>
      <div class="col col-4"><div class="plot-container" id="ex6-gc"></div></div>
      <div class="col col-4"><div class="plot-container" id="ex6-g2"></div></div>
    </div>

    <div id="ex6-hover"></div>
    <div class="plot-container" id="ex6-chart" style="display:none;"></div>
    <div id="ex6-tally"></div>
  </div>`);
  box.appendChild(content);

  const RIGHT = "#9cbf9f", WRONG = "#ddaba2", MIXED = "#e6c07a";

  let mode = "expected";
  let sorted = false;
  let cases = [];                       // the current hundred, as {a1, a2}
  let order = shuffle(Array.from({ length: 100 }, (_, i) => i));   // a stable scatter
  let totalN = 0, totalA1 = 0, totalA2 = 0, totBoth = 0, totAgree = 0;
  let hist = [];                        // running proportions, one point per case
  let hover = null;                     // the cell under the pointer, 0..99
  let anim = null;

  $("#ex6-r-slider", content).appendChild(
    slider("ex6_r", "Right in this proportion of cases:", 0.02, 0.98, 0.81, 0.01, (v) => v.toFixed(2), "k1"));
  $("#ex6-s-slider", content).appendChild(
    slider("ex6_s", "Right in this proportion of cases:", 0.02, 0.98, 0.93, 0.01, (v) => v.toFixed(2), "k2"));

  const R = () => num("ex6_r");
  const S = () => num("ex6_s");

  /* The paragraph above states this case in Peirce's own figures, and the table
     of the four combinations under it breaks them down; both follow the sliders
     while this panel is open, and revert when it is shut. */
  registerLive("example-ex6", {
    r:  () => Math.round(R() * 100),
    rc: () => 100 - Math.round(R() * 100),
    s:  () => Math.round(S() * 100),
    sc: () => 100 - Math.round(S() * 100),
    /* Each of the four combinations, worked out. Peirce leaves them as products
       of fractions; the value appears only while this panel is open. */
    v11: () => ` = ${fmt(R() * S(), 4)}`,
    v10: () => ` = ${fmt((1 - R()) * S(), 4)}`,
    v01: () => ` = ${fmt(R() * (1 - S()), 4)}`,
    v00: () => ` = ${fmt((1 - R()) * (1 - S()), 4)}`
  });

  const atPeirce = () => Math.round(R() * 100) === 81 && Math.round(S() * 100) === 93;
  ex678Adopt();

  /* ------------------------------------------------------------------------
     One hundred cases, and everything drawn from them. The expected hundred is
     built from the four combinations rather than from two independent columns:
     take r*s of them to be right on both, r*(1-s) right on the first only, and
     so on. Built that way the margins and the joints cannot disagree — which
     they did before, the composed grid counting its own cells while the
     decomposed one drew the theoretical figures beside them.
     ----------------------------------------------------------------------*/
  function expectedCases() {
    const r = R(), s = S();
    const nBoth = Math.round(r * s * 100);
    const nA1 = Math.round(r * (1 - s) * 100);
    const nA2 = Math.round((1 - r) * s * 100);
    const nNone = Math.max(0, 100 - nBoth - nA1 - nA2);
    const out = [];
    for (let i = 0; i < nBoth; i++) out.push({ a1: true, a2: true });
    for (let i = 0; i < nA1; i++) out.push({ a1: true, a2: false });
    for (let i = 0; i < nA2; i++) out.push({ a1: false, a2: true });
    for (let i = 0; i < nNone; i++) out.push({ a1: false, a2: false });
    return out.slice(0, 100);
  }

  // what the grids are showing at this moment
  const shown = () => (mode === "expected" ? expectedCases() : cases);

  /* Sorted, the four kinds are laid out in blocks; scattered, they are dealt
     into a fixed shuffle, so toggling back and forth does not reshuffle. */
  function laidOut() {
    const c = shown();
    if (mode === "trial") return c;     // actual cases fall where they fall
    if (sorted) return c;
    const out = new Array(c.length);
    order.filter((i) => i < c.length).forEach((slot, k) => { out[slot] = c[k]; });
    return out;
  }

  function grid(pl, cells, colourOf, title, caption) {
    pl.setup({ xlim: [0, 10], ylim: [0, 10], mar: [2.4, 0.6, 2.4, 0.6], asp: 1 });
    pl.title(title, { cex: 0.95 });
    for (let k = 0; k < 100; k++) {
      const row = Math.floor(k / 10), col = k % 10;
      const c = cells[k];
      pl.rect(col, row, col + 1, row + 1, {
        col: c ? colourOf(c) : PAL.paper,
        border: c ? "#4f555c" : PAL.ruleSoft, lwd: 0.5
      });
    }
    /* The same case occupies the same square in all three grids, so ringing it
       in each of them is what shows that the middle grid is made of the two
       beside it rather than being a third thing. */
    if (hover !== null && cells[hover]) {
      const row = Math.floor(hover / 10), col = hover % 10;
      pl.rect(col, row, col + 1, row + 1, { col: "transparent", border: PAL.ink, lwd: 2.5 });
    }
    pl.text(5, -0.9, caption, { cex: 0.95, font: 2 });
  }

  const count = (fn) => shown().filter(fn).length;

  const g1 = mkCanvas(240, (pl) => grid(pl, laidOut(), (c) => (c.a1 ? RIGHT : WRONG),
    "A₁ → C", `${count((c) => c.a1)} right, ${count((c) => !c.a1)} wrong`));
  const g2 = mkCanvas(240, (pl) => grid(pl, laidOut(), (c) => (c.a2 ? RIGHT : WRONG),
    "A₂ → C", `${count((c) => c.a2)} right, ${count((c) => !c.a2)} wrong`));
  const gc = mkCanvas(240, (pl) => grid(pl, laidOut(),
    (c) => (c.a1 && c.a2 ? RIGHT : (c.a1 || c.a2) ? MIXED : WRONG),
    "Both together", `${count((c) => c.a1 && c.a2)} both right, ${count((c) => !c.a1 && !c.a2)} both wrong`));
  $("#ex6-g1", content).appendChild(g1);
  $("#ex6-gc", content).appendChild(gc);
  $("#ex6-g2", content).appendChild(g2);

  [g1, gc, g2].forEach((el) => {
    el.style.cursor = "crosshair";
    el.addEventListener("mousemove", (ev) => {
      const pl = el._pl;
      if (!pl) return;
      const b = el.getBoundingClientRect();
      const col = Math.floor(pl.invX(ev.clientX - b.left));
      const row = Math.floor(pl.invY(ev.clientY - b.top));
      const k = (col >= 0 && col < 10 && row >= 0 && row < 10) ? row * 10 + col : null;
      if (k !== hover) { hover = k; paintGrids(); }
    });
    el.addEventListener("mouseleave", () => { if (hover !== null) { hover = null; paintGrids(); } });
  });

  function paintGrids() {
    drawCanvas(g1); drawCanvas(gc); drawCanvas(g2);
    const c = laidOut()[hover];
    $("#ex6-hover", content).innerHTML = (hover === null || !c) ? "" :
      `<p class="help-text" style="text-align:center;">This case: <span class="math">A<sub>1</sub></span>
        was <strong>${c.a1 ? "right" : "wrong"}</strong>,
        <span class="math">A<sub>2</sub></span> was <strong>${c.a2 ? "right" : "wrong"}</strong>
        &mdash; ${c.a1 === c.a2 ? "they agree" : "they disagree"}.</p>`;
  }

  /* --------------------------------------------------------------- actions */
  function actionsHTML() {
    const peirce = `<button class="restore-peirce${atPeirce() ? "" : " on"}" data-act="peirce">Reset to Peirce&rsquo;s 81 and 93</button>`;
    if (mode === "expected") {
      return `<button class="btn btn-sm" data-act="sort">${sorted ? "Scatter the cells" : "Sort the cells"}</button>${peirce}`;
    }
    const bulk = cases.length === 0 ? "Run a hundred cases"
      : cases.length < 100 ? `Run the remaining ${100 - cases.length}`
      : "Start another hundred";
    return `<button class="btn btn-primary btn-sm" data-act="one">Run one case</button>
      <button class="btn btn-primary btn-sm" data-act="bulk">${bulk}</button>
      <button class="btn btn-warning btn-sm" data-act="reset">Reset</button>${peirce}`;
  }

  function drawCase() {
    const c = { a1: runif() < R(), a2: runif() < S() };
    cases.push(c);
    totalN++;
    if (c.a1) totalA1++;
    if (c.a2) totalA2++;
    if (c.a1 === c.a2) { totAgree++; if (c.a1) totBoth++; }
    hist.push({ n: totalN, p1: totalA1 / totalN, p2: totalA2 / totalN,
      pa: totAgree ? totBoth / totAgree : null });
  }

  function stopRun() { if (anim) { clearTimeout(anim); anim = null; } }

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act],[data-mode]");
    if (!b) return;
    if (b.hasAttribute("data-mode")) {
      stopRun();
      mode = b.getAttribute("data-mode");
      $$("[data-mode]", content).forEach((x) => x.classList.toggle("active", x === b));
      return render();
    }
    const act = b.getAttribute("data-act");
    if (act === "sort") sorted = !sorted;
    else if (act === "peirce") { setSlider("ex6_r", 0.81); setSlider("ex6_s", 0.93); }
    else if (act === "reset") {
      stopRun(); cases = []; hist = [];
      totalN = 0; totalA1 = 0; totalA2 = 0; totBoth = 0; totAgree = 0;
    }
    else if (act === "one") { stopRun(); if (cases.length >= 100) cases = []; drawCase(); }
    else if (act === "bulk") {
      stopRun();
      if (cases.length >= 100) cases = [];
      const step = () => {
        for (let i = 0; i < 4 && cases.length < 100; i++) drawCase();
        render();
        anim = cases.length < 100 ? setTimeout(step, 45) : null;
      };
      return step();
    }
    render();
  });

  content.addEventListener("input", () => { stopRun(); render(); });

  /* How the two rates, and the rate among the agreements, settle as the cases
     pile up. The three dashed lines are what each is set to be. */
  const chart = mkCanvas(230, (pl) => {
    const r = R(), s = S();
    const target = r * s / (r * s + (1 - r) * (1 - s));
    if (!hist.length) { blankPlot(pl, "Run some cases to begin"); return; }
    const nMax = Math.max(20, totalN * 1.05);
    pl.setup({ xlim: [0, Math.log10(nMax)], ylim: [0.4, 1.02], mar: [4, 5, 2.5, 8] });
    const decades = [];
    for (let e = 0; e <= Math.ceil(Math.log10(nMax)); e++) {
      [1, 2, 5].forEach((m) => { const v = m * Math.pow(10, e); if (v <= nMax) decades.push(v); });
    }
    pl.axes({ xat: decades.map(Math.log10), xlabels: decades.map((v) => bigmark(v)) });
    pl.axisLabels("Cases run (log scale)", "Proportion right");
    pl.clip(true);
    pl.abline({ h: r, col: PAL.accent, lwd: 1, lty: 3 });
    pl.abline({ h: s, col: PAL.accent2, lwd: 1, lty: 3 });
    pl.abline({ h: target, col: PAL.accent3, lwd: 1, lty: 3 });
    const xs = hist.map((d) => Math.log10(d.n));
    pl.lines(xs, hist.map((d) => d.p1), { col: PAL.accent, lwd: 1.8 });
    pl.lines(xs, hist.map((d) => d.p2), { col: PAL.accent2, lwd: 1.8 });
    pl.lines(xs, hist.map((d) => d.pa), { col: PAL.accent3, lwd: 2.4 });
    pl.clip(false);
    pl.legend("bottomright", {
      legend: ["A\u2081 right", "A\u2082 right", "right when they agree"],
      col: [PAL.accent, PAL.accent2, PAL.accent3], lwd: [1.8, 1.8, 2.4], lty: [1, 1, 1], cex: 0.72
    });
  });
  $("#ex6-chart", content).appendChild(chart);

  function render() {
    $("#ex6-actions", content).innerHTML = actionsHTML();
    $("#ex6-chart", content).style.display = mode === "trial" ? "" : "none";
    const r = R(), s = S();
    const c = shown();
    const n = c.length;
    const both = c.filter((x) => x.a1 && x.a2).length;
    const neither = c.filter((x) => !x.a1 && !x.a2).length;
    const mixed = n - both - neither;
    const agree = both + neither;

    $("#ex6-tally", content).innerHTML = `
      <div class="row">
        <div class="col col-6"><div class="key-insight">
          <p style="margin-bottom:6px;">Both right <strong>${both}</strong>
            &middot; one right, one wrong <strong>${mixed}</strong>
            &middot; both wrong <strong>${neither}</strong>${n < 100 ? ` &mdash; of ${n} so far` : ""}</p>
          <p style="margin-bottom:0;">They agree in <strong>${agree}</strong>
            ${agree === 1 ? "case" : "cases"}, and of those <strong>${both}</strong>
            ${both === 1 ? "is" : "are"} right:
            ${agree ? `<strong>${fmt(both / agree, 4)}</strong>` : "&mdash;"}</p>
        </div></div>
        <div class="col col-6"><div class="formula-box" style="text-align:left;font-size:1em;">
          <p style="margin-bottom:6px;" class="math">P(A<sub>1</sub>&rarr;C) &times; P(A<sub>2</sub>&rarr;C)
            = ${fmt(r, 2)} &times; ${fmt(s, 2)} = <strong>${fmt(r * s, 4)}</strong></p>
          <p style="margin-bottom:0;">Expected in the long run:
            ${frac(`${fmt(r * s, 4)}`, `${fmt(r * s, 4)} + ${fmt((1 - r) * (1 - s), 4)}`)}
            = <strong>${fmt(r * s / (r * s + (1 - r) * (1 - s)), 4)}</strong></p>
        </div></div>
      </div>
      ${mode === "trial" && totalN ? `<div class="note-block">Over
        <strong>${bigmark(totalN)}</strong> cases in all,
        <span class="math">A<sub>1</sub></span> has been right
        <strong>${fmt(totalA1 / totalN * 100, 1)}%</strong> of the time (set at ${fmt(r * 100, 0)}%) and
        <span class="math">A<sub>2</sub></span> <strong>${fmt(totalA2 / totalN * 100, 1)}%</strong>
        (set at ${fmt(s * 100, 0)}%).</div>` : ""}`;

    paintGrids();
    if (mode === "trial") drawCanvas(chart);
  }

  render();
});
</script>
