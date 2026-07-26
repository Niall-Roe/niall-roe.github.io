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
    <div style="margin:20px 0;padding:15px;background-color:#f8f9fa;border-radius:5px;">
      <h5>Peirce's Examples:</h5>
      <div>
        <button class="btn btn-sm" data-preset="single_six">Single die shows 6</button>
        <button class="btn btn-sm" data-preset="double_sixes">Both dice show 6</button>
        <button class="btn btn-sm" data-preset="deuce_ace">Deuce-Ace (2 &amp; 1)</button>
      </div>
      <h5 style="margin-top:15px;">Additional Examples:</h5>
      <div>
        <button class="btn btn-sm" data-preset="sum_seven">Dice sum to 7</button>
        <button class="btn btn-sm" data-preset="at_least_one_six">At least one 6</button>
        <button class="btn btn-sm" data-preset="both_even">Both dice even</button>
        <button class="btn btn-sm" data-preset="doubles">Any doubles</button>
      </div>
    </div>
    <hr>
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
        pl.rect(i - 0.4, 0.6, i + 0.4, 1.4, { col: col, border: "black", lwd: 2 });
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
          pl.rect(d1 - 0.45, d2 - 0.45, d1 + 0.45, d2 + 0.45, { col: col, border: "black", lwd: 0.5 });
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
    pl.lines(sim.freq.map((_, i) => i + 1), sim.freq, { col: "#2c7fb8", lwd: 2 });
    pl.abline({ h: sim.pTheory, col: "red", lwd: 2, lty: 2 });
    pl.clip(false);
    pl.legend("topright", {
      legend: ["Observed Frequency", `Theoretical P = ${fmt(sim.pTheory, 4)}`],
      col: ["#2c7fb8", "red"], lwd: [2, 2], lty: [1, 2], bg: "white"
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
            <div style="background-color:#e9ecef;padding:10px;border-radius:4px;">
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
   EXAMPLE 6 — Combining independent inference rules (two friends, one box)
   ========================================================================*/
registerExample("example-ex6", (box) => {
  const content = h(`<div>
    <h4>Interactive Demonstration: Combining Independent Inference Rules</h4>
    <p class="key-insight"><strong>Scenario: </strong>There is a piece of metal in a box. It is either
      <strong>gold</strong> (yellow &amp; heavy) or <strong>lead</strong> (grey &amp; light). You have two friends
      who can make observations. Friend 1 judges by <strong>color</strong>; Friend 2 judges by <strong>weight</strong>.
      Each friend is an independent inference rule with known accuracy.</p>
    <hr>
    <div class="row">
      <div class="col col-6"><h5>Friend 1: Judges by Color</h5><div id="ex6-r-slider"></div>
        <p>Friend 1 is correct <strong id="ex6_r_display"></strong> of the time.</p></div>
      <div class="col col-6"><h5>Friend 2: Judges by Weight</h5><div id="ex6-s-slider"></div>
        <p>Friend 2 is correct <strong id="ex6_s_display"></strong> of the time.</p></div>
    </div>
    <hr>
    <div class="mode-tabs">
      <button class="mode-tab active" id="ex6-mode-tab-known">Known Metal</button>
      <button class="mode-tab" id="ex6-mode-tab-unknown">Unknown Metal</button>
    </div>

    <div id="ex6-mode-known">
      <h4>Mode 1: You Know What&rsquo;s In The Box</h4>
      <p>Select what metal is in the box, then see how often each friend gives the correct answer:</p>
      <div class="row">
        <div class="col col-6" id="ex6-metal-radio"></div>
        <div class="col col-6" id="ex6_metal_box"></div>
      </div>
      <hr>
      <div class="mode-tabs">
        <button class="mode-tab active" id="ex6-submode-tab-expectation">Expectation</button>
        <button class="mode-tab" id="ex6-submode-tab-trial">Trial</button>
      </div>
      <div id="ex6-submode-expectation">
        <p class="key-insight">This shows the <strong>expected</strong> distribution: exactly the proportion you&rsquo;d expect in the long run.</p>
        <button class="btn btn-secondary" id="ex6_simplify_exp" style="margin-bottom:15px;">Simplify (Order Cells)</button>
        <div class="row">
          <div class="col col-6"><h5 style="text-align:center;">Friend 1&rsquo;s Judgments</h5>
            <div id="ex6-f1-exp"></div><div id="ex6_known_friend1_desc_exp"></div></div>
          <div class="col col-6"><h5 style="text-align:center;">Friend 2&rsquo;s Judgments</h5>
            <div id="ex6-f2-exp"></div><div id="ex6_known_friend2_desc_exp"></div></div>
        </div>
        <hr>
        <h5>Combined Performance: All Possible Outcomes</h5>
        <p>When both friends judge the same piece of metal, there are four possible combinations of their answers:</p>
        <button class="btn btn-info" id="ex6_toggle_decompose_exp" style="margin-bottom:15px;">Decompose Grid</button>
        <div id="ex6-combined-exp"></div>
        <div id="ex6_known_combined_desc_exp"></div>
      </div>
      <div id="ex6-submode-trial" style="display:none;">
        <p class="key-insight">This shows <strong>actual samples</strong>: asking each friend multiple times. Trials are cumulative.</p>
        <button class="btn btn-primary" id="ex6_run_100" style="margin-right:10px;">Ask Friends 100 More Times</button>
        <button class="btn btn-warning" id="ex6_reset_trials" style="margin-right:10px;">Reset Trials</button>
        <span id="ex6_trial_count"></span>
        <div id="ex6_trial_note"></div>
        <div id="ex6-convergence"></div>
        <div class="row">
          <div class="col col-6"><h5 style="text-align:center;">Friend 1&rsquo;s Judgments</h5>
            <div id="ex6-f1-trial"></div><div id="ex6_known_friend1_desc_trial"></div></div>
          <div class="col col-6"><h5 style="text-align:center;">Friend 2&rsquo;s Judgments</h5>
            <div id="ex6-f2-trial"></div><div id="ex6_known_friend2_desc_trial"></div></div>
        </div>
        <hr>
        <h5>Combined Performance: All Possible Outcomes</h5>
        <button class="btn btn-info" id="ex6_toggle_decompose_trial" style="margin-bottom:15px;">Decompose Grid</button>
        <div id="ex6-combined-trial"></div>
        <div id="ex6_known_combined_desc_trial"></div>
      </div>
    </div>

    <div id="ex6-mode-unknown" style="display:none;">
      <h4>Mode 2: You Don&rsquo;t Know What&rsquo;s In The Box</h4>
      <p>You can&rsquo;t see the metal, but you can ask your friends. What do they say?</p>
      <div class="row">
        <div class="col col-3" id="ex6_metal_box_opaque"></div>
        <div class="col col-5"><div id="ex6-answer-radio"></div>
          <button class="btn btn-primary" id="ex6_generate">Generate New Answers</button></div>
        <div class="col col-4" id="ex6_agreement_formula"></div>
      </div>
      <hr>
      <h5>What Your Friends Say:</h5>
      <div id="ex6_friend_answers"></div>
      <hr>
      <button class="btn btn-warning" id="ex6_reveal">Reveal What&rsquo;s In The Box</button>
      <div id="ex6_revelation"></div>
      <hr>
      <h5>How Does This Answer Relate To The Possible Outcomes?</h5>
      <p>Based on what the friends said, we can reason about how likely different scenarios are:</p>
      <div id="ex6-unknown-analysis"></div>
      <div id="ex6_unknown_explanation"></div>
    </div>
  </div>`);
  box.appendChild(content);

  /* ---- state ---- */
  let randomState = { metal: "gold", f1: "gold", f2: "gold" };
  let revealed = false;
  let trialResults = null;
  let trialHistory = [];
  let decompExp = false, decompTrial = false, simplified = false;
  let expGrids = null, expKey = "";

  $("#ex6-r-slider", content).appendChild(
    slider("ex6_r", "Accuracy of Friend 1 (correct answers):", 0.5, 1, 0.81, 0.01, (v) => v.toFixed(2)));
  $("#ex6-s-slider", content).appendChild(
    slider("ex6_s", "Accuracy of Friend 2 (correct answers):", 0.5, 1, 0.93, 0.01, (v) => v.toFixed(2)));
  $("#ex6-metal-radio", content).appendChild(
    radios("ex6_true_metal", "What is actually in the box?", [["gold", "Gold"], ["lead", "Lead"]], "gold"));
  $("#ex6-answer-radio", content).appendChild(
    radios("ex6_answer_mode", "What do the friends say?",
      [["random", "Random (generate independently)"], ["both_gold", "Both say 'Gold'"],
       ["both_lead", "Both say 'Lead'"], ["disagree", "They disagree"]], "random", true));

  const R = () => num("ex6_r");
  const S = () => num("ex6_s");

  function getExpGrids() {
    const key = `${R()}|${S()}|${simplified}`;
    if (expGrids && expKey === key) return expGrids;
    const nR = Math.round(R() * 100), nS = Math.round(S() * 100);
    let f1 = Array.from({ length: 100 }, (_, i) => i < nR);
    let f2 = Array.from({ length: 100 }, (_, i) => i < nS);
    if (!simplified) { f1 = shuffle(f1); f2 = shuffle(f2); }
    expGrids = { f1: f1, f2: f2 }; expKey = key;
    return expGrids;
  }

  /* ---- 100-cell grid drawing (ex6_draw_grid_cells) ---- */
  function drawCells(pl, cells, correctColor, incorrectColor, title) {
    pl.setup({ xlim: [0, 10], ylim: [0, 10], mar: [1, 1, 2, 1], asp: 1 });
    pl.title(title, { cex: 1 });
    let k = 0;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        pl.rect(col, row, col + 1, row + 1,
          { col: cells[k] ? correctColor : incorrectColor, border: "#4d4d4d", lwd: 0.5 });
        k++;
      }
    }
    const nCorrect = cells.filter(Boolean).length;
    pl.text(5, -0.8, `${nCorrect} correct, ${100 - nCorrect} incorrect`, { cex: 1.1, font: 2 });
  }

  const COMBO_COLS = { bc: "#90EE90", f1w: "#FFE4B5", f2w: "#FFD700", bw: "#FFB6C1" };

  function combinedPlot(pl, f1, f2) {
    pl.setup({ xlim: [0, 10], ylim: [0, 10], mar: [3, 1, 3, 1], asp: 1 });
    pl.title("All Possible Outcomes Combined", { cex: 1.1 });
    let k = 0;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const color = f1[k] && f2[k] ? COMBO_COLS.bc : f1[k] && !f2[k] ? COMBO_COLS.f1w
          : !f1[k] && f2[k] ? COMBO_COLS.f2w : COMBO_COLS.bw;
        pl.rect(col, row, col + 1, row + 1, { col: color, border: "#4d4d4d", lwd: 0.5 });
        k++;
      }
    }
    const n1 = f1.filter((v, i) => v && f2[i]).length;
    const n2 = f1.filter((v, i) => v && !f2[i]).length;
    const n3 = f1.filter((v, i) => !v && f2[i]).length;
    const n4 = f1.filter((v, i) => !v && !f2[i]).length;
    pl.legend("bottom", {
      horiz: true, inset: 6,
      legend: [`Both Correct (${n1})`, `F1✓ F2✗ (${n2})`, `F1✗ F2✓ (${n3})`, `Both Wrong (${n4})`],
      fill: [COMBO_COLS.bc, COMBO_COLS.f1w, COMBO_COLS.f2w, COMBO_COLS.bw], cex: 0.85
    });
  }

  function decomposedPlot(pl, W, nBc, nF1w, nF2w, nBw) {
    const cfgs = [[nBc, COMBO_COLS.bc, "darkgreen", "Both Correct"],
      [nF1w, COMBO_COLS.f1w, "orange", "F1✓ F2✗"],
      [nF2w, COMBO_COLS.f2w, "goldenrod", "F1✗ F2✓"],
      [nBw, COMBO_COLS.bw, "darkred", "Both Wrong"]];
    const panelW = W / 4;   // R's par(mfrow = c(1, 4))
    cfgs.forEach((cfg, idx) => {
      const sub = new RPlot(pl.ctx, panelW, pl.H);
      sub.setup({ xlim: [0, 10], ylim: [0, 10], mar: [3, 1, 3, 1], asp: 1 });
      const dx = idx * panelW;
      sub.px0 += dx; sub.px1 += dx;
      sub.title(cfg[3], { cex: 0.95 });
      let k = 1;
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          sub.rect(col, row, col + 1, row + 1, {
            col: k <= cfg[0] ? cfg[1] : "white",
            border: k <= cfg[0] ? cfg[2] : "#cccccc",
            lwd: k <= cfg[0] ? 1 : 0.5
          });
          k++;
        }
      }
      sub.text(5, -1, `${cfg[0]}/100`, { cex: 1.05, font: 2 });
    });
  }

  /* ---- description table (ex6_desc_ui) ---- */
  function descHTML(r, s, f1, f2, totalN) {
    const bc = r * s, f1w = r * (1 - s), f2w = (1 - r) * s, bw = (1 - r) * (1 - s);
    const ta = bc + bw, pa = bc / ta;
    const actBc = f1.filter((v, i) => v && f2[i]).length;
    const actF1w = f1.filter((v, i) => v && !f2[i]).length;
    const actF2w = f1.filter((v, i) => !v && f2[i]).length;
    const actBw = f1.filter((v, i) => !v && !f2[i]).length;
    const hdr = totalN === undefined ? "Expected vs. Actual Outcomes:" : `After ${totalN} Trials - Expected vs. Actual:`;
    const row = (bg, name, formula, actual) =>
      `<tr style="background-color:${bg};"><td style="text-align:left;padding:8px;">${name}</td>
        <td style="padding:8px;" class="math">${formula}</td>
        <td style="padding:8px;font-size:1.2em;"><strong>${actual}</strong></td></tr>`;
    return `<h5>${hdr}</h5>
      <div class="table-scroll"><table class="tbl">
        <thead><tr><th style="text-align:left;">Scenario</th><th>Formula</th><th>Actual</th></tr></thead>
        <tbody>
        ${row(COMBO_COLS.bc, "Both Correct", `r &times; s = ${fmt(r, 2)} &times; ${fmt(s, 2)} &asymp; ${fmt(bc * 100, 0)}`, actBc)}
        ${row(COMBO_COLS.f1w, "F1✓ F2✗", `r(1-s) = ${fmt(r, 2)} &times; ${fmt(1 - s, 2)} &asymp; ${fmt(f1w * 100, 0)}`, actF1w)}
        ${row(COMBO_COLS.f2w, "F1✗ F2✓", `(1-r)s = ${fmt(1 - r, 2)} &times; ${fmt(s, 2)} &asymp; ${fmt(f2w * 100, 0)}`, actF2w)}
        ${row(COMBO_COLS.bw, "Both Wrong", `(1-r)(1-s) = ${fmt(1 - r, 2)} &times; ${fmt(1 - s, 2)} &asymp; ${fmt(bw * 100, 0)}`, actBw)}
        </tbody></table></div>
      <div class="formula-box">
        <p><strong>Probability both correct when they agree:</strong></p>
        <p class="math">${frac("r &times; s", "r &times; s + (1-r)(1-s)")} =
           ${frac(fmt(bc * 100, 2), fmt(ta * 100, 2))} = ${fmt(pa, 4)} &asymp; ${fmt(pa * 100, 2)}%</p>
      </div>`;
  }

  /* ---- canvases ---- */
  const f1ExpCanvas = mkCanvas(250, (pl) => {
    const m = radioVal("ex6_true_metal"), g = getExpGrids();
    if (m === "gold") drawCells(pl, g.f1, "#d4af37", "#808080", "Friend 1 says 'Gold' vs 'Lead'");
    else drawCells(pl, g.f1, "#808080", "#d4af37", "Friend 1 says 'Lead' vs 'Gold'");
  });
  const f2ExpCanvas = mkCanvas(250, (pl) => {
    const m = radioVal("ex6_true_metal"), g = getExpGrids();
    if (m === "gold") drawCells(pl, g.f2, "#d4af37", "#808080", "Friend 2 says 'Gold' vs 'Lead'");
    else drawCells(pl, g.f2, "#808080", "#d4af37", "Friend 2 says 'Lead' vs 'Gold'");
  });
  $("#ex6-f1-exp", content).appendChild(f1ExpCanvas);
  $("#ex6-f2-exp", content).appendChild(f2ExpCanvas);

  const combinedExpCanvas = mkCanvas(350, (pl, W) => {
    const g = getExpGrids();
    if (decompExp) {
      const r = R(), s = S();
      decomposedPlot(pl, W, Math.round(r * s * 100), Math.round(r * (1 - s) * 100),
        Math.round((1 - r) * s * 100), Math.round((1 - r) * (1 - s) * 100));
    } else combinedPlot(pl, g.f1, g.f2);
  });
  $("#ex6-combined-exp", content).appendChild(combinedExpCanvas);

  const f1TrialCanvas = mkCanvas(250, (pl) => {
    if (!trialResults) return blankPlot(pl, "Click 'Ask Friends' to run trials");
    const m = radioVal("ex6_true_metal");
    if (m === "gold") drawCells(pl, trialResults.f1Cells, "#d4af37", "#808080", "Friend 1 says 'Gold' vs 'Lead'");
    else drawCells(pl, trialResults.f1Cells, "#808080", "#d4af37", "Friend 1 says 'Lead' vs 'Gold'");
  });
  const f2TrialCanvas = mkCanvas(250, (pl) => {
    if (!trialResults) return blankPlot(pl, "Click 'Ask Friends' to run trials");
    const m = radioVal("ex6_true_metal");
    if (m === "gold") drawCells(pl, trialResults.f2Cells, "#d4af37", "#808080", "Friend 2 says 'Gold' vs 'Lead'");
    else drawCells(pl, trialResults.f2Cells, "#808080", "#d4af37", "Friend 2 says 'Lead' vs 'Gold'");
  });
  $("#ex6-f1-trial", content).appendChild(f1TrialCanvas);
  $("#ex6-f2-trial", content).appendChild(f2TrialCanvas);

  const convergenceCanvas = mkCanvas(200, (pl) => {
    if (!trialHistory.length) { pl.setup({ xlim: [0, 1], ylim: [0, 1] }); return; }
    const r = R(), s = S();
    const ns = trialHistory.map((x) => x.n);
    pl.setup({ xlim: [0, Math.max(10000, Math.max(...ns))], ylim: [0, 100], mar: [3, 4, 2, 1] });
    pl.axes({});
    pl.box();
    pl.axisLabels("Number of Trials", "Count (per 100)");
    pl.title("Convergence to Expected Values", { cex: 1 });
    pl.clip(true);
    pl.abline({ h: r * s * 100, col: "#90EE90", lwd: 2, lty: 2 });
    pl.abline({ h: r * (1 - s) * 100, col: "#FFE4B5", lwd: 2, lty: 2 });
    pl.abline({ h: (1 - r) * s * 100, col: "#FFD700", lwd: 2, lty: 2 });
    pl.abline({ h: (1 - r) * (1 - s) * 100, col: "#FFB6C1", lwd: 2, lty: 2 });
    const series = [["bothCorrect", "#008000"], ["f1cF2w", "#FF8C00"], ["f1wF2c", "#DAA520"], ["bothWrong", "#FF1493"]];
    series.forEach(([key, col]) => {
      const ys = trialHistory.map((x) => x[key]);
      pl.lines(ns, ys, { col: col, lwd: 2 });
      pl.points(ns, ys, { col: col, cex: 0.9 });
    });
    pl.clip(false);
    pl.legend("right", {
      legend: ["Both Correct", "F1✓ F2✗", "F1✗ F2✓", "Both Wrong"],
      col: ["#008000", "#FF8C00", "#DAA520", "#FF1493"], lwd: [2, 2, 2, 2], pch: 19, cex: 0.75
    });
  });
  $("#ex6-convergence", content).appendChild(convergenceCanvas);

  const combinedTrialCanvas = mkCanvas(350, (pl, W) => {
    if (!trialResults) return blankPlot(pl, "Click 'Ask Friends' to run trials");
    if (decompTrial) {
      const ra = trialResults.f1 / 100, sa = trialResults.f2 / 100;
      decomposedPlot(pl, W, Math.round(ra * sa * 100), Math.round(ra * (1 - sa) * 100),
        Math.round((1 - ra) * sa * 100), Math.round((1 - ra) * (1 - sa) * 100));
    } else combinedPlot(pl, trialResults.f1Cells, trialResults.f2Cells);
  });
  $("#ex6-combined-trial", content).appendChild(combinedTrialCanvas);

  function getAnswers() {
    const mode = radioVal("ex6_answer_mode");
    if (mode === "random") return { f1: randomState.f1, f2: randomState.f2 };
    if (mode === "both_gold") return { f1: "gold", f2: "gold" };
    if (mode === "both_lead") return { f1: "lead", f2: "lead" };
    return { f1: "gold", f2: "lead" };
  }

  const unknownCanvas = mkCanvas(400, (pl) => {
    const ans = getAnswers(), g = getExpGrids();
    pl.setup({ xlim: [0, 10], ylim: [0, 10], mar: [3, 1, 3, 1], asp: 1 });
    pl.title("All Possible Outcomes Combined", { cex: 1.1 });
    const agree = ans.f1 === ans.f2;
    let k = 0;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const f1ok = g.f1[k], f2ok = g.f2[k];
        const base = f1ok && f2ok ? COMBO_COLS.bc : f1ok && !f2ok ? COMBO_COLS.f1w
          : !f1ok && f2ok ? COMBO_COLS.f2w : COMBO_COLS.bw;
        const matches = agree ? ((f1ok && f2ok) || (!f1ok && !f2ok)) : ((f1ok && !f2ok) || (!f1ok && f2ok));
        pl.rect(col, row, col + 1, row + 1, {
          col: matches ? base : "white",
          border: matches ? "#4d4d4d" : "#e5e5e5",
          lwd: matches ? 0.8 : 0.3
        });
        k++;
      }
    }
    pl.legend("bottom", {
      horiz: true, inset: 6,
      legend: ["Both Correct", "F1✓ F2✗", "F1✗ F2✓", "Both Wrong"],
      fill: [COMBO_COLS.bc, COMBO_COLS.f1w, COMBO_COLS.f2w, COMBO_COLS.bw], cex: 0.85
    });
  });
  $("#ex6-unknown-analysis", content).appendChild(unknownCanvas);

  let revelationCanvas = null;

  /* ---- rendering ---- */
  function renderAll() {
    const r = R(), s = S();
    $("#ex6_r_display", content).textContent = `${Math.round(r * 100)}%`;
    $("#ex6_s_display", content).textContent = `${Math.round(s * 100)}%`;

    const metal = radioVal("ex6_true_metal");
    $("#ex6_metal_box", content).innerHTML = `<div class="metal-box ${metal}">${metal.toUpperCase()}</div>`;

    const g = getExpGrids();
    const nR = Math.round(r * 100), nS = Math.round(s * 100);
    $("#ex6_known_friend1_desc_exp", content).innerHTML = metal === "gold"
      ? `<p>Expected: Friend 1 correctly says 'gold' ${nR} times (yellow) and incorrectly says 'lead' ${100 - nR} times (grey).</p>`
      : `<p>Expected: Friend 1 correctly says 'lead' ${nR} times (grey) and incorrectly says 'gold' ${100 - nR} times (yellow).</p>`;
    $("#ex6_known_friend2_desc_exp", content).innerHTML = metal === "gold"
      ? `<p>Expected: Friend 2 correctly says 'gold' ${nS} times (yellow) and incorrectly says 'lead' ${100 - nS} times (grey).</p>`
      : `<p>Expected: Friend 2 correctly says 'lead' ${nS} times (grey) and incorrectly says 'gold' ${100 - nS} times (yellow).</p>`;
    $("#ex6_known_combined_desc_exp", content).innerHTML = descHTML(r, s, g.f1, g.f2);

    $("#ex6_trial_count", content).textContent = trialResults
      ? `Total trials: ${trialResults.totalN} / 10,000`
      : "Total trials: 0 (Click 'Ask Friends 100 More Times' to begin)";
    if (trialResults) {
      $("#ex6_trial_note", content).innerHTML =
        `<p class="key-insight">After ${trialResults.totalN} trials, Friend 1 is ${fmt(trialResults.f1, 0)}% accurate
         (expected ${fmt(r * 100, 0)}%) and Friend 2 is ${fmt(trialResults.f2, 0)}% accurate (expected ${fmt(s * 100, 0)}%).</p>`;
      $("#ex6_known_friend1_desc_trial", content).innerHTML =
        `<p>After ${trialResults.totalN} trials: Friend 1 correctly said '${metal}' ${trialResults.f1}% of the time.</p>`;
      $("#ex6_known_friend2_desc_trial", content).innerHTML =
        `<p>After ${trialResults.totalN} trials: Friend 2 correctly said '${metal}' ${trialResults.f2}% of the time.</p>`;
      $("#ex6_known_combined_desc_trial", content).innerHTML =
        descHTML(trialResults.f1 / 100, trialResults.f2 / 100, trialResults.f1Cells, trialResults.f2Cells, trialResults.totalN);
    } else {
      $("#ex6_trial_note", content).innerHTML = "";
      $("#ex6_known_friend1_desc_trial", content).innerHTML = "";
      $("#ex6_known_friend2_desc_trial", content).innerHTML = "";
      $("#ex6_known_combined_desc_trial", content).innerHTML = "";
    }

    /* --- unknown mode --- */
    const answerMode = radioVal("ex6_answer_mode");
    $("#ex6_generate", content).style.display = answerMode === "random" ? "" : "none";
    $("#ex6_metal_box_opaque", content).innerHTML =
      (revealed && answerMode === "random")
        ? `<div class="metal-box ${randomState.metal}">${randomState.metal.toUpperCase()}</div>`
        : `<div class="metal-box opaque">?</div>`;

    const ans = getAnswers();
    const agree = ans.f1 === ans.f2;
    if (agree) {
      const bc = r * s, bw = (1 - r) * (1 - s), pa = bc / (bc + bw);
      $("#ex6_agreement_formula", content).innerHTML =
        `<div class="formula-box"><p><strong>P(both correct | both say '${ans.f1}'):</strong></p>
         <p class="math">${frac(`${fmt(r, 2)} &times; ${fmt(s, 2)}`,
           `${fmt(r, 2)} &times; ${fmt(s, 2)} + ${fmt(1 - r, 2)} &times; ${fmt(1 - s, 2)}`)} = ${fmt(pa, 4)}</p></div>`;
    } else {
      const f1w = r * (1 - s), f2w = (1 - r) * s, p1 = f1w / (f1w + f2w);
      $("#ex6_agreement_formula", content).innerHTML =
        `<div class="formula-box"><p><strong>When friends disagree:</strong></p>
         <p class="math">P(F1 correct) = ${frac(`${fmt(r, 2)}(1-${fmt(s, 2)})`,
           `${fmt(r, 2)}(1-${fmt(s, 2)})+(1-${fmt(r, 2)})${fmt(s, 2)}`)} = ${fmt(p1, 4)}</p>
         <p class="math">P(F2 correct) = ${fmt(1 - p1, 4)}</p></div>`;
    }

    const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
    $("#ex6_friend_answers", content).innerHTML = `<div class="row">
      <div class="col col-6"><div style="background-color:${ans.f1 === "gold" ? "#d4af37" : "#808080"};padding:20px;border-radius:8px;text-align:center;border:3px solid #333;">
        <h4>Friend 1 says:</h4><h3 style="margin:0;">${cap(ans.f1)}</h3></div></div>
      <div class="col col-6"><div style="background-color:${ans.f2 === "gold" ? "#d4af37" : "#808080"};padding:20px;border-radius:8px;text-align:center;border:3px solid #333;">
        <h4>Friend 2 says:</h4><h3 style="margin:0;">${cap(ans.f2)}</h3></div></div></div>`;

    /* revelation */
    const revBox = $("#ex6_revelation", content);
    if (!revealed) revBox.innerHTML = "";
    else if (answerMode !== "random") revBox.innerHTML = `<p class="key-insight">Revelation only works in random mode.</p>`;
    else {
      const m = randomState.metal, a1 = randomState.f1, a2 = randomState.f2;
      const scenario = (a1 === m && a2 === m) ? "Both Correct" : a1 === m ? "F1✓ F2✗" : a2 === m ? "F1✗ F2✓" : "Both Wrong";
      revBox.innerHTML = `<hr><h5>Revelation: What&rsquo;s Actually In The Box</h5>
        <p class="key-insight">The metal was ${m.toUpperCase()}! You landed in the &lsquo;${scenario}&rsquo; scenario.</p>
        <div id="ex6-revelation-plot"></div>`;
      const sc = (a1 === m && a2 === m) ? "bc" : a1 === m ? "f1w" : a2 === m ? "f2w" : "bw";
      revelationCanvas = mkCanvas(350, (pl) => {
        const ns = [Math.round(r * s * 100), Math.round(r * (1 - s) * 100),
          Math.round((1 - r) * s * 100), Math.round((1 - r) * (1 - s) * 100)];
        let types = [];
        ["bc", "f1w", "f2w", "bw"].forEach((t, i) => { for (let j = 0; j < ns[i]; j++) types.push(t); });
        while (types.length < 100) types.push("bw");
        types = shuffle(types).slice(0, 100);
        const bright = { bc: "#00FF00", f1w: "#FFA500", f2w: "#DAA520", bw: "#FF1493" };
        const idxs = types.map((t, i) => (t === sc ? i : -1)).filter((i) => i >= 0);
        const hl = idxs.length ? idxs[sampleInt(idxs.length)] : -1;
        pl.setup({ xlim: [0, 10], ylim: [0, 10], mar: [3, 1, 3, 1], asp: 1 });
        pl.title("All Possible Outcomes (Your Scenario Highlighted)", { cex: 1.05 });
        let k = 0;
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            pl.rect(col, row, col + 1, row + 1, {
              col: k === hl ? bright[types[k]] : COMBO_COLS[types[k]],
              border: k === hl ? "black" : "#4d4d4d",
              lwd: k === hl ? 3 : 0.5
            });
            k++;
          }
        }
        pl.legend("bottom", {
          horiz: true, inset: 6,
          legend: ["Both Correct", "F1✓ F2✗", "F1✗ F2✓", "Both Wrong"],
          fill: [COMBO_COLS.bc, COMBO_COLS.f1w, COMBO_COLS.f2w, COMBO_COLS.bw], cex: 0.85
        });
      });
      $("#ex6-revelation-plot", revBox).appendChild(revelationCanvas);
    }

    /* Unknown-mode explanation. Box counts are whole squares because they
       describe the picture; the probability is computed from the exact
       products, so the fraction shown is the exact one rather than the
       rounded counts (which gave a visibly different answer in app.R). */
    const bc = Math.round(r * s * 100), bw = Math.round((1 - r) * (1 - s) * 100);
    const f1w = Math.round(r * (1 - s) * 100), f2w = Math.round((1 - r) * s * 100);
    const bcE = r * s * 100, bwE = (1 - r) * (1 - s) * 100;
    const f1wE = r * (1 - s) * 100, f2wE = (1 - r) * s * 100;
    if (agree) {
      const taE = bcE + bwE, pa = bcE / taE;
      $("#ex6_unknown_explanation", content).innerHTML =
        `<p class="key-insight">Friends agree ('${ans.f1}'). Scenario must be green or pink. Only two possibilities:</p>
         <ul><li>Both correct: ${bc} green boxes</li><li>Both wrong: ${bw} pink boxes</li></ul>
         <div class="formula-box"><p><strong>P(both correct | agree):</strong></p>
           <p class="math">${frac(fmt(bcE, 2), `${fmt(bcE, 2)} + ${fmt(bwE, 2)}`)} = ${fmt(pa, 4)} &asymp; ${fmt(pa * 100, 2)}%</p></div>
         <p>This is Peirce&rsquo;s key insight: when two independent inference rules agree, the probability they&rsquo;re
            both correct is much higher than either one alone!</p>`;
    } else {
      const tdE = f1wE + f2wE, p1 = f1wE / tdE;
      $("#ex6_unknown_explanation", content).innerHTML =
        `<p class="key-insight">Friends disagree (F1 says '${ans.f1}', F2 says '${ans.f2}'). Scenario must be orange or gold:</p>
         <ul><li>F1 correct, F2 wrong: ${f1w} orange boxes</li><li>F1 wrong, F2 correct: ${f2w} gold boxes</li></ul>
         <p>P(F1 correct | disagree) = ${fmt(f1wE, 2)}/${fmt(tdE, 2)} = ${fmt(p1 * 100, 2)}%</p>`;
    }
    redrawAll();
  }

  /* ---- wiring ---- */
  content.addEventListener("input", (ev) => { if (ev.target.id === "ex6_r" || ev.target.id === "ex6_s") renderAll(); });
  content.addEventListener("change", (ev) => {
    if (ev.target.name === "ex6_true_metal" || ev.target.name === "ex6_answer_mode") { revealed = false; renderAll(); }
  });
  $("#ex6_simplify_exp", content).addEventListener("click", (e) => {
    simplified = !simplified;
    e.target.textContent = simplified ? "Scatter Cells" : "Simplify (Order Cells)";
    renderAll();
  });
  $("#ex6_toggle_decompose_exp", content).addEventListener("click", () => { decompExp = !decompExp; renderAll(); });
  $("#ex6_toggle_decompose_trial", content).addEventListener("click", () => { decompTrial = !decompTrial; renderAll(); });
  $("#ex6_generate", content).addEventListener("click", () => {
    const r = R(), s = S();
    const m = Math.random() < 0.5 ? "gold" : "lead";
    const other = m === "gold" ? "lead" : "gold";
    randomState = { metal: m, f1: runif() < r ? m : other, f2: runif() < s ? m : other };
    revealed = false;
    renderAll();
  });
  $("#ex6_reveal", content).addEventListener("click", () => { revealed = true; renderAll(); });
  $("#ex6_reset_trials", content).addEventListener("click", () => { trialResults = null; trialHistory = []; renderAll(); });
  $("#ex6_run_100", content).addEventListener("click", () => {
    const r = R(), s = S();
    let tn = 0, tf1 = 0, tf2 = 0;
    if (trialResults) { tn = trialResults.totalN; tf1 = trialResults.totalF1Correct; tf2 = trialResults.totalF2Correct; }
    if (tn >= 10000) return;
    let nf1 = 0, nf2 = 0;
    for (let i = 0; i < 100; i++) { if (runif() < r) nf1++; if (runif() < s) nf2++; }
    tn += 100; tf1 += nf1; tf2 += nf2;
    const f1p = tf1 / tn, f2p = tf2 / tn;
    const f1c = Array.from({ length: 100 }, () => runif() < f1p);
    const f2c = Array.from({ length: 100 }, () => runif() < f2p);
    trialHistory.push({
      n: tn, f1Prop: f1p, f2Prop: f2p,
      bothCorrect: f1c.filter((v, i) => v && f2c[i]).length,
      f1cF2w: f1c.filter((v, i) => v && !f2c[i]).length,
      f1wF2c: f1c.filter((v, i) => !v && f2c[i]).length,
      bothWrong: f1c.filter((v, i) => !v && !f2c[i]).length
    });
    trialResults = {
      f1: Math.round(f1p * 100), f2: Math.round(f2p * 100),
      totalN: tn, totalF1Correct: tf1, totalF2Correct: tf2, f1Cells: f1c, f2Cells: f2c
    };
    renderAll();
  });

  /* mode / submode tabs */
  $("#ex6-mode-tab-known", content).addEventListener("click", () => {
    $("#ex6-mode-known", content).style.display = "";
    $("#ex6-mode-unknown", content).style.display = "none";
    $("#ex6-mode-tab-known", content).classList.add("active");
    $("#ex6-mode-tab-unknown", content).classList.remove("active");
    redrawAll();
  });
  $("#ex6-mode-tab-unknown", content).addEventListener("click", () => {
    $("#ex6-mode-known", content).style.display = "none";
    $("#ex6-mode-unknown", content).style.display = "";
    $("#ex6-mode-tab-unknown", content).classList.add("active");
    $("#ex6-mode-tab-known", content).classList.remove("active");
    revealed = false;
    renderAll();
  });
  $("#ex6-submode-tab-expectation", content).addEventListener("click", () => {
    $("#ex6-submode-expectation", content).style.display = "";
    $("#ex6-submode-trial", content).style.display = "none";
    $("#ex6-submode-tab-expectation", content).classList.add("active");
    $("#ex6-submode-tab-trial", content).classList.remove("active");
    redrawAll();
  });
  $("#ex6-submode-tab-trial", content).addEventListener("click", () => {
    $("#ex6-submode-expectation", content).style.display = "none";
    $("#ex6-submode-trial", content).style.display = "";
    $("#ex6-submode-tab-trial", content).classList.add("active");
    $("#ex6-submode-tab-expectation", content).classList.remove("active");
    trialResults = null;
    renderAll();
  });

  renderAll();
});
</script>
