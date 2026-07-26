<script>
/* ==========================================================================
   Example scaffolding: click a highlighted passage to open its demonstration.
   Content is built lazily the first time a container is opened.
   ========================================================================*/

const BUILDERS = {};
const BUILT = {};

function registerExample(id, builder) { BUILDERS[id] = builder; }

document.addEventListener("click", (ev) => {
  const trg = ev.target.closest("[data-toggle]");
  if (!trg) return;
  const id = trg.getAttribute("data-toggle");
  const box = document.getElementById(id);
  if (!box) return;
  if (!BUILT[id] && BUILDERS[id]) { BUILDERS[id](box); BUILT[id] = true; }
  const open = box.style.display !== "none";
  box.style.display = open ? "none" : "block";
  if (!open) { redrawAll(); box.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
});

/* collapsible inner header, as in the Shiny version */
function exHeader(title, contentId) {
  const el = h(`<div class="example-header">${esc(title)}</div>`);
  el.addEventListener("click", () => {
    el.classList.toggle("collapsed");
    const c = document.getElementById(contentId);
    c.style.display = c.style.display === "none" ? "block" : "none";
    redrawAll();
  });
  return el;
}

/* ==========================================================================
   Shared card-deck framework (create_grid / evaluate_consequent /
   build_consequent_ui / get_consequent_rule / render_grid_plot in app.R)
   ========================================================================*/

const SUITS = ["H", "D", "C", "S"];
const SUIT_NAMES = ["Hearts", "Diamonds", "Clubs", "Spades"];
const RANK_ORDER = { A: 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13 };

const DECK_CHOICES = [
  ["shuffled_standard", "Well-shuffled standard deck"],
  ["new_standard", "New standard deck (Ace♠ on top)"],
  ["shuffled_piquet", "Well-shuffled Piquet pack (7-A)"],
  ["shuffled_face", "Well-shuffled face cards (J,Q,K)"]
];

function deckRanks(deckType) {
  if (deckType === "shuffled_face") return ["J", "Q", "K"];
  if (deckType === "shuffled_piquet") return ["7", "8", "9", "10", "J", "Q", "K", "A"];
  return ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
}

function createGrid(deckType) {
  const ranks = deckRanks(deckType);
  const cells = [];
  ranks.forEach((rank, ri) => {
    SUITS.forEach((suit, si) => {
      const prob = deckType === "new_standard"
        ? ((suit === "S" && rank === "A") ? 1 : 0)
        : 1 / (ranks.length * 4);
      cells.push({ label: rank + suit, x: ri + 1, y: si + 1, suit: suit, rank: rank, prob: prob });
    });
  });
  return { cells: cells, dims: { x: ranks.length, y: 4 }, xLabels: ranks, yLabels: SUIT_NAMES };
}

function evaluateConsequent(grid, rule) {
  return grid.cells.map((cell) => {
    const suit = cell.suit, rank = cell.rank;
    if (rule.operator) {
      const sv = rule.suit === undefined ? "any" : rule.suit;
      const suitMatch = sv === "any" ? true
        : sv === "red" ? (suit === "H" || suit === "D")
        : sv === "black" ? (suit === "C" || suit === "S")
        : suit === sv;
      if (!suitMatch) return false;
      const p = rule.property;
      switch (rule.operator) {
        case "any":
          if (p === "even") return ["2", "4", "6", "8", "10"].includes(rank);
          if (p === "odd") return ["A", "3", "5", "7", "9"].includes(rank);
          if (p === "face") return ["J", "Q", "K"].includes(rank);
          if (p === "non_face") return !["J", "Q", "K"].includes(rank);
          if (p === "red") return suit === "H" || suit === "D";
          if (p === "black") return suit === "C" || suit === "S";
          if (p === "any_card") return true;
          return false;
        case "exactly": return rank === rule.rank;
        case "higher_than": return RANK_ORDER[rank] > RANK_ORDER[rule.rank];
        case "lower_than": return RANK_ORDER[rank] < RANK_ORDER[rule.rank];
        case "anything_other_than":
          if (p !== undefined && p !== null) {
            if (p === "even") return !["2", "4", "6", "8", "10"].includes(rank);
            if (p === "odd") return !["A", "3", "5", "7", "9"].includes(rank);
            if (p === "face") return !["J", "Q", "K"].includes(rank);
            if (p === "red") return !(suit === "H" || suit === "D");
            if (p === "black") return !(suit === "C" || suit === "S");
            return false;
          }
          return rank !== rule.rank;
        default: return false;
      }
    }
    return false;
  });
}

/* Property options differ by operator. Under "Anything other than" the first
   entry hands control back to the Rank selector; app.R showed this dropdown for
   that operator but never read it, leaving the negated-property branch of
   evaluateConsequent unreachable. */
const PROP_ANY = [["any_card", "Any card"], ["even", "Even"], ["odd", "Odd"], ["face", "Face"],
  ["non_face", "Non-face"], ["red", "Red"], ["black", "Black"]];
const PROP_NOT = [["", "— the rank below —"], ["even", "Even"], ["odd", "Odd"], ["face", "Face"],
  ["red", "Red"], ["black", "Black"]];

function buildConsequentUI(prefix, label, cssClass, onChange) {
  const wrap = document.createElement("div");
  wrap.appendChild(select(prefix + "_operator",
    `<span class="${cssClass}">${label} - Operator:</span>`,
    [["exactly", "Exactly"], ["higher_than", "Higher than"], ["lower_than", "Lower than"],
     ["any", "Any"], ["anything_other_than", "Anything other than"]], "exactly"));
  const rankBox = select(prefix + "_rank", "Rank:",
    ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map((r) => [r, r]), "A");
  const propBox = select(prefix + "_property", "Property:", PROP_ANY, "any_card");
  wrap.appendChild(rankBox);
  wrap.appendChild(propBox);
  wrap.appendChild(select(prefix + "_suit", "Suit:",
    [["any", "Any suit"], ["red", "Red (Hearts or Diamonds)"], ["black", "Black (Clubs or Spades)"],
     ["H", "Hearts"], ["D", "Diamonds"], ["C", "Clubs"], ["S", "Spades"]], "any"));
  const sel = $("select", propBox);
  let lastOp = null;
  const sync = () => {
    const op = val(prefix + "_operator");
    if (op !== lastOp) {
      const wanted = op === "anything_other_than" ? PROP_NOT : PROP_ANY;
      const keep = sel.value;
      sel.innerHTML = wanted.map(([v, t]) =>
        `<option value="${esc(v)}">${esc(t)}</option>`).join("");
      sel.value = wanted.some(([v]) => v === keep) ? keep : wanted[0][0];
      lastOp = op;
    }
    const usesRank = ["exactly", "higher_than", "lower_than"].includes(op) ||
      (op === "anything_other_than" && sel.value === "");
    rankBox.style.display = usesRank ? "" : "none";
    propBox.style.display = ["any", "anything_other_than"].includes(op) ? "" : "none";
  };
  wrap.addEventListener("change", () => { sync(); if (onChange) onChange(); });
  setTimeout(sync, 0);
  return wrap;
}

function getConsequentRule(prefix) {
  const operator = val(prefix + "_operator");
  const rule = { operator: operator, suit: val(prefix + "_suit") };
  if (["exactly", "higher_than", "lower_than"].includes(operator)) {
    rule.rank = val(prefix + "_rank");
  } else if (operator === "anything_other_than") {
    const prop = val(prefix + "_property");
    if (prop) rule.property = prop; else rule.rank = val(prefix + "_rank");
  } else {
    rule.property = val(prefix + "_property");
  }
  return rule;
}

/* Counts restricted to the cells the antecedent can actually produce. For a
   well-shuffled deck that is every card; for the new deck (Ace of Spades on
   top) it is one card, so the count and the probability agree instead of the
   count reporting 4/52 while the grid legend reports 1. */
function possibleSummary(grid, matched) {
  let successes = 0, total = 0;
  grid.cells.forEach((c, i) => {
    if (c.prob > 0) { total++; if (matched[i]) successes++; }
  });
  const prob = grid.cells.reduce((s, c, i) => s + (matched[i] ? c.prob : 0), 0);
  return { successes: successes, total: total, prob: prob };
}

function renderGridPlot(pl, grid, matched, scheme, title, matched2) {
  const dims = grid.dims, cells = grid.cells;
  pl.setup({ xlim: [0.5, dims.x + 0.5], ylim: [0.5, dims.y + 0.5], mar: [4, 4, 3, 2], asp: 1 });
  if (title) pl.title(title, { cex: 1.1 });

  const bbox = (flags, col) => {
    const sel = cells.filter((c, i) => flags[i]);
    if (!sel.length) return;
    const xr = [Math.min(...sel.map((c) => c.x)), Math.max(...sel.map((c) => c.x))];
    const yr = [Math.min(...sel.map((c) => c.y)), Math.max(...sel.map((c) => c.y))];
    pl.rect(xr[0] - 0.45, yr[0] - 0.45, xr[1] + 0.45, yr[1] + 0.45, { col: col, border: null });
  };

  pl.rect(0.5, 0.5, dims.x + 0.5, dims.y + 0.5, { col: "rgba(255,242,204,0.3)", border: null });
  if (scheme === "single") {
    bbox(matched, "rgba(209,237,245,0.4)");
  } else if (scheme === "double" && matched2) {
    bbox(matched, "rgba(255,230,222,0.5)");
    bbox(matched2, "rgba(222,235,247,0.5)");
  }

  const countMatch = matched.filter(Boolean).length;
  const countMatch2 = matched2 ? matched2.filter(Boolean).length : 0;
  const countBoth = matched2 ? matched.filter((m, i) => m && matched2[i]).length : 0;

  cells.forEach((cell, i) => {
    let col = "white";
    if (scheme === "single") { if (matched[i]) col = "#d4edda"; }
    else if (scheme === "double" && matched2) {
      if (matched[i] && matched2[i]) col = "#c8b2d8";
      else if (matched[i]) col = "#fee5d9";
      else if (matched2[i]) col = "#deebf7";
    }
    pl.rect(cell.x - 0.4, cell.y - 0.4, cell.x + 0.4, cell.y + 0.4, { col: col, border: "black", lwd: 0.5 });
    pl.text(cell.x, cell.y, cell.label, { cex: 0.6 });
  });

  // rank labels sit just above the grid (R draws them with axis(3, line = -1))
  grid.xLabels.forEach((lab, i) => pl.text(i + 1, dims.y + 0.7, lab, { cex: 0.85 }));
  pl.axisPlain(2, [1, 2, 3, 4], grid.yLabels, { cex: 0.8 });

  if (scheme === "single") {
    const t = possibleSummary(grid, matched);
    pl.text(dims.x / 2, -0.3,
      `Green cells match consequent: ${t.successes}/${t.total} = P(A → C) = ${rround(t.prob, 4)}`, { cex: 0.9 });
  } else if (scheme === "double" && matched2) {
    const tB = possibleSummary(grid, matched);
    const tC = possibleSummary(grid, matched2);
    const tBoth = possibleSummary(grid, matched.map((m, i) => m && matched2[i]));
    pl.text(dims.x / 2, -0.5,
      `B: ${tB.successes} | C: ${tC.successes} | B∧C: ${tBoth.successes} | P(A→B)×P(A→C) = ${rround(tB.prob * tC.prob, 3)} vs P(A→[B∧C]) = ${rround(tBoth.prob, 3)}`,
      { cex: 0.85 });
  }
  void countMatch; void countMatch2; void countBoth;
}

function antecedentDesc(deckType, short) {
  if (short) {
    if (deckType === "new_standard") return "Draw from NEW STANDARD deck (Ace♠ on top)";
    if (deckType === "shuffled_face") return "Draw from SHUFFLED FACE CARD deck (J,Q,K)";
    if (deckType === "shuffled_piquet") return "Draw from SHUFFLED PIQUET PACK (7-A)";
    return "Draw from SHUFFLED STANDARD deck";
  }
  if (deckType === "new_standard") return "Draw top card from NEW STANDARD deck (Ace♠ on top)";
  if (deckType === "shuffled_face") return "Draw top card from WELL-SHUFFLED FACE CARD deck (J,Q,K)";
  if (deckType === "shuffled_piquet") return "Draw top card from WELL-SHUFFLED PIQUET PACK (7-A)";
  return "Draw top card from WELL-SHUFFLED STANDARD deck";
}

/* ==========================================================================
   EXAMPLE 1 — Antecedent, Consequent, Consequence
   ========================================================================*/
registerExample("example-ex1", (box) => {
  box.appendChild(exHeader("Interactive Example: Antecedent, Consequent, Consequence", "ex1-content"));
  const content = h(`<div id="ex1-content" class="example-content">
    <p><strong>Peirce's Framework:</strong></p>
    <ul>
      <li><span class="hl-antecedent">ANTECEDENT</span> = Experimental conditions ("draw top card from well-shuffled deck")</li>
      <li><span class="hl-consequent">CONSEQUENT</span> = Target outcome ("the card is red")</li>
      <li><span class="hl-consequence">CONSEQUENCE</span> = The inference rule relating them</li>
    </ul>
    <div class="arrow-diagram">
      <span class="hl-antecedent">ANTECEDENT</span> <span style="color:#28a745;font-weight:bold;">&rarr;</span>
      <span class="hl-consequent">CONSEQUENT</span><br>
      <span style="font-size:0.9em;">The arrow (<span class="hl-consequence">CONSEQUENCE</span>) has the probability!</span>
    </div>
    <p><strong>Formula:</strong> P(A &rarr; C) = (# times A and C both occur) / (# times A occurs)</p>
    <div class="row">
      <div class="col col-6"><div class="control-panel" id="ex1-controls"></div></div>
      <div class="col col-6"><div style="margin-top:20px;">
        <h5 style="text-align:center;">Formula with values:</h5>
        <div id="ex1_formula_display"></div>
      </div></div>
    </div>
    <div class="plot-container" id="ex1-plot"></div>
    <div class="calc-output" id="ex1_calc"></div>
  </div>`);
  box.appendChild(content);

  const controls = $("#ex1-controls", content);
  controls.appendChild(select("ex1_deck_type",
    '<span class="hl-antecedent">Antecedent - Draw top card from:</span>', DECK_CHOICES, "shuffled_standard"));
  controls.appendChild(buildConsequentUI("ex1", "Consequent - The card is", "hl-consequent", () => update()));
  controls.addEventListener("change", () => update());

  const canvas = mkCanvas(400, (pl) => {
    const grid = createGrid(val("ex1_deck_type"));
    renderGridPlot(pl, grid, evaluateConsequent(grid, getConsequentRule("ex1")), "single",
      "Possibility Space: Each Card in the Deck");
  });
  $("#ex1-plot", content).appendChild(canvas);

  function update() {
    const deckType = val("ex1_deck_type");
    const grid = createGrid(deckType);
    const matched = evaluateConsequent(grid, getConsequentRule("ex1"));
    const { successes, total, prob } = possibleSummary(grid, matched);

    $("#ex1_formula_display", content).innerHTML =
      `<div style="text-align:center;font-size:18px;margin-top:20px;">
         <div style="margin-bottom:10px;font-weight:bold;">P(A &rarr; C) = ${successes}/${total} = ${rround(prob, 4)}</div>
       </div>`;

    const ad = antecedentDesc(deckType, false);
    $("#ex1_calc", content).textContent =
      `ANTECEDENT: ${ad}\n` +
      `CONSEQUENT: [See selections above]\n\n` +
      `CONSEQUENCE: "IF ${ad}, THEN [consequent]"\n\n` +
      `THEORETICAL PROBABILITY:\n` +
      `  P(A → C) = ${successes} / ${total} = ${rround(prob, 4)}\n\n` +
      `NOTE: Probability belongs to the CONSEQUENCE (the arrow),\n` +
      `not to individual facts. There is no P(E), only P(A → C).`;
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 2 — Addition Rule
   ========================================================================*/
const TARGET_CHOICES = [
  ["ace_spades", "Ace of Spades"],
  ["red", "Red (hearts or diamonds)"],
  ["face", "Face card (J,Q,K)"],
  ["even", "Even (2,4,6,8,10)"],
  ["less_10", "Less than 10 (2-9)"],
  ["higher_8", "Higher than 8 (9,10,J,Q,K,A)"]
];
const TARGET_DESC = {
  red: "Card is RED", ace_spades: "Card is ACE OF SPADES",
  even: "Card is EVEN (2,4,6,8,10)", face: "Card is FACE CARD (J,Q,K)",
  less_10: "Card is LESS THAN 10 (2-9)", higher_8: "Card is HIGHER THAN 8 (9,10,J,Q,K,A)"
};

/* One predicate for the grids and the simulations alike. app.R had two: its
   grids excluded the ace from "less than 10" while ex3's simulation included
   it. The ace is treated as high throughout (as "Higher than 8" and the
   rank ordering used by ex1/ex4 both already do), so it is excluded here and
   the menu label now says 2-9 rather than A-9. */
function cardMatchesGrid(suit, rank, target) {
  if (target === "red") return suit === "H" || suit === "D";
  if (target === "ace_spades") return suit === "S" && rank === "A";
  if (target === "even") return ["2", "4", "6", "8", "10"].includes(rank);
  if (target === "face") return ["J", "Q", "K"].includes(rank);
  if (target === "less_10") return ["2", "3", "4", "5", "6", "7", "8", "9"].includes(rank);
  if (target === "higher_8") return ["9", "10", "J", "Q", "K", "A"].includes(rank);
  return false;
}
function deckSize(deckType) {
  return deckType === "shuffled_face" ? 12 : deckType === "shuffled_piquet" ? 32 : 52;
}
function flatDeck(deckType) {
  const ranks = deckRanks(deckType);
  const out = [];
  SUITS.forEach((s) => ranks.forEach((r) => out.push({ suit: s, rank: r })));
  return out;
}

registerExample("example-ex2", (box) => {
  box.appendChild(exHeader("Interactive Example: Addition Rule for Consequences", "ex2-content"));
  const content = h(`<div id="ex2-content" class="example-content">
    <p><strong>The Rule:</strong> Given two consequences with the <em>same antecedent</em> but
       <em>incompatible consequents</em>, we add their probabilities:</p>
    <p>P(A &rarr; C&#8321;) + P(A &rarr; C&#8322;) = P(A &rarr; [C&#8321; or C&#8322;])</p>
    <div class="control-panel" id="ex2-controls"></div>
    <div class="plot-container" id="ex2-plot"></div>
    <div class="calc-output" id="ex2_calc"></div>
  </div>`);
  box.appendChild(content);

  const controls = $("#ex2-controls", content);
  controls.appendChild(select("ex2_deck_type",
    '<span class="hl-antecedent">Antecedent - Draw top card from:</span>', DECK_CHOICES, "shuffled_standard"));
  controls.appendChild(select("ex2_target1",
    '<span class="hl-event-a">CONSEQUENT A - Card is:</span>', TARGET_CHOICES, "ace_spades"));
  controls.appendChild(select("ex2_target2",
    '<span class="hl-event-b">CONSEQUENT B - Card is:</span>', TARGET_CHOICES, "even"));
  controls.appendChild(slider("ex2_n_trials", "Number of trials (n):", 10, 10000, 520, 10));
  controls.addEventListener("input", () => update());
  controls.addEventListener("change", () => update());

  const canvas = mkCanvas(400, (pl) => {
    const deckType = val("ex2_deck_type"), t1 = val("ex2_target1"), t2 = val("ex2_target2");
    const ranks = deckRanks(deckType), nR = ranks.length, nS = 4;
    pl.setup({ xlim: [0.5, nR + 0.5], ylim: [0.5, nS + 0.5], mar: [4, 4, 3, 2], asp: 1 });
    pl.title("Possibility Space: Each Card in the Deck", { cex: 1.1 });
    let c1 = 0, c2 = 0, cOv = 0, cEither = 0;
    for (let i = 1; i <= nS; i++) {
      for (let j = 1; j <= nR; j++) {
        const suit = SUITS[i - 1], rank = ranks[j - 1];
        const m1 = cardMatchesGrid(suit, rank, t1), m2 = cardMatchesGrid(suit, rank, t2);
        if (m1 && m2) cOv++;
        if (m1) c1++;
        if (m2) c2++;
        if (m1 || m2) cEither++;
        const col = (m1 && m2) ? "#9370DB" : m1 ? "#fee5d9" : m2 ? "#deebf7" : "white";
        pl.rect(j - 0.4, i - 0.4, j + 0.4, i + 0.4, { col: col, border: "black", lwd: 0.5 });
        pl.text(j, i, rank + suit, { cex: 0.6 });
      }
    }
    ranks.forEach((lab, i) => pl.text(i + 1, 0.15, lab, { cex: 0.85 }));
    pl.axisPlain(2, [1, 2, 3, 4], SUIT_NAMES, { cex: 0.8 });
    const total = nS * nR, p1 = c1 / total, p2 = c2 / total, pComb = cEither / total;
    const ly = nS + 0.8;
    pl.text(nR / 2, ly + 0.6,
      `P(C₁) = ${c1}/${total} = ${rround(p1, 3)}   P(C₂) = ${c2}/${total} = ${rround(p2, 3)}`, { cex: 0.9 });
    if (cOv > 0) {
      pl.text(nR / 2, ly + 0.2,
        `OVERLAP: ${cOv} cards → P(C₁) + P(C₂) = ${rround(p1 + p2, 3)} ≠ P(C₁ or C₂) = ${rround(pComb, 3)}`,
        { cex: 0.85, col: "red" });
    } else {
      pl.text(nR / 2, ly + 0.2,
        `NO OVERLAP → P(C₁) + P(C₂) = ${rround(p1 + p2, 3)} = P(C₁ or C₂) = ${rround(pComb, 3)}`,
        { cex: 0.85, col: "#28a745" });
    }
    pl.rect(1, -0.5, 2, -0.2, { col: "#fee5d9", border: "black" });
    pl.text(2.5, -0.35, "C₁ only", { adj: 0, cex: 0.8 });
    pl.rect(4, -0.5, 5, -0.2, { col: "#deebf7", border: "black" });
    pl.text(5.5, -0.35, "C₂ only", { adj: 0, cex: 0.8 });
    if (cOv > 0) {
      pl.rect(7, -0.5, 8, -0.2, { col: "#9370DB", border: "black" });
      pl.text(8.5, -0.35, "Both (overlap)", { adj: 0, cex: 0.8 });
    }
  });
  $("#ex2-plot", content).appendChild(canvas);

  function update() {
    const deckType = val("ex2_deck_type"), t1 = val("ex2_target1"), t2 = val("ex2_target2");
    const n = num("ex2_n_trials");
    const ad = antecedentDesc(deckType, false);
    const deck = flatDeck(deckType), size = deckSize(deckType);
    const rng = mulberry32(42);             // stands in for set.seed(42)
    let c1 = 0, c2 = 0, cEither = 0;
    if (deckType === "new_standard") {
      c1 = cardMatchesGrid("S", "A", t1) ? n : 0;
      c2 = cardMatchesGrid("S", "A", t2) ? n : 0;
      cEither = (cardMatchesGrid("S", "A", t1) || cardMatchesGrid("S", "A", t2)) ? n : 0;
    } else {
      for (let i = 0; i < n; i++) { const c = deck[Math.floor(rng() * size)]; if (cardMatchesGrid(c.suit, c.rank, t1)) c1++; }
      for (let i = 0; i < n; i++) { const c = deck[Math.floor(rng() * size)]; if (cardMatchesGrid(c.suit, c.rank, t2)) c2++; }
      for (let i = 0; i < n; i++) {
        const c = deck[Math.floor(rng() * size)];
        if (cardMatchesGrid(c.suit, c.rank, t1) || cardMatchesGrid(c.suit, c.rank, t2)) cEither++;
      }
    }
    const p1 = c1 / n, p2 = c2 / n, pComb = cEither / n;
    $("#ex2_calc", content).textContent =
      `SAME ANTECEDENT: ${ad}\n\n` +
      `CONSEQUENCE A: "IF ${ad}, THEN ${TARGET_DESC[t1]}"\n` +
      `  - C₁ occurs: ${c1} / ${n} times\n` +
      `  - P(A → C₁) = ${rround(p1, 4)}\n\n` +
      `CONSEQUENCE B: "IF ${ad}, THEN ${TARGET_DESC[t2]}"\n` +
      `  - C₂ occurs: ${c2} / ${n} times\n` +
      `  - P(A → C₂) = ${rround(p2, 4)}\n\n` +
      `COMBINED CONSEQUENCE: "IF A, THEN (C₁ OR C₂)"\n` +
      `  - Either consequent: ${cEither} / ${n} times\n` +
      `  - P(A → [C₁ or C₂]) = ${rround(pComb, 4)}\n\n` +
      `ADDITION RULE:\n` +
      `  P(A → C₁) + P(A → C₂) = ${rround(p1, 4)} + ${rround(p2, 4)} = ${rround(p1 + p2, 4)}\n` +
      `  P(A → [C₁ or C₂]) = ${rround(pComb, 4)}\n\n` +
      `This works when C₁ and C₂ are INCOMPATIBLE (no card matches both).`;
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 3 — Multiplication Rule
   ========================================================================*/
registerExample("example-ex3", (box) => {
  box.appendChild(exHeader("Interactive Example: Multiplication Rule for Consequences", "ex3-content"));
  const content = h(`<div id="ex3-content" class="example-content">
    <p><strong>The Rule:</strong> Given two consequences where the antecedent of the second includes the consequent of the first:</p>
    <p>P(A &rarr; B) &times; P(A&and;B &rarr; C) = P(A &rarr; [B &and; C])</p>
    <div class="arrow-diagram">
      <span class="hl-antecedent">A</span> <span style="color:#28a745;font-weight:bold;">&rarr;</span> <span class="hl-consequent">B</span> (prob P&#8321;)<br>
      <span class="hl-antecedent">A &and; B</span> <span style="color:#28a745;font-weight:bold;">&rarr;</span> <span class="hl-consequent">C</span> (prob P&#8322;)<br>
      <span style="color:#666;">Therefore:</span> <span class="hl-antecedent">A</span> <span style="color:#28a745;font-weight:bold;">&rarr;</span> <span class="hl-combined">B &and; C</span> (prob P&#8321; &times; P&#8322;)
    </div>
    <div class="control-panel" id="ex3-controls"></div>
    <div class="plot-container" id="ex3-plot1"></div>
    <div class="plot-container" id="ex3-plot2"></div>
    <div class="calc-output" id="ex3_calc"></div>
  </div>`);
  box.appendChild(content);

  const controls = $("#ex3-controls", content);
  controls.appendChild(select("ex3_deck_type",
    '<span class="hl-antecedent">Antecedent A - Draw top card from:</span>', DECK_CHOICES, "shuffled_standard"));
  controls.appendChild(select("ex3_b",
    '<span class="hl-event-a">Consequent B - First condition:</span>', TARGET_CHOICES, "red"));
  controls.appendChild(select("ex3_c",
    '<span class="hl-event-b">Consequent C - Second condition (given B):</span>', TARGET_CHOICES, "face"));
  controls.appendChild(slider("ex3_n_trials", "Number of trials (n):", 10, 10000, 520, 10));
  controls.addEventListener("input", () => update());
  controls.addEventListener("change", () => update());

  function simulate() {
    const deckType = val("ex3_deck_type"), b = val("ex3_b"), c = val("ex3_c");
    const n = num("ex3_n_trials");
    const deck = flatDeck(deckType), size = deckSize(deckType);
    const rng = mulberry32(42);
    let countB = 0, countBoth = 0;
    for (let i = 0; i < n; i++) {
      const card = deckType === "new_standard" ? { suit: "S", rank: "A" } : deck[Math.floor(rng() * size)];
      const mb = cardMatchesGrid(card.suit, card.rank, b);
      if (mb) { countB++; if (cardMatchesGrid(card.suit, card.rank, c)) countBoth++; }
    }
    const pB = countB / n;
    const pCgivenB = countB > 0 ? countBoth / countB : 0;
    return { n: n, countB: countB, countBoth: countBoth, pB: pB, pCgivenB: pCgivenB, pBoth: countBoth / n };
  }

  const barCanvas = mkCanvas(300, (pl) => {
    const r = simulate();
    pl.setup({ xlim: [0, 1], ylim: [0, 4.5], mar: [3, 1, 3, 1] });
    pl.title(`Multiplication Rule: n = ${r.n} trials`, { cex: 1.2 });
    pl.text(0, 4.0, "P(A → B):", { cex: 0.9, adj: 0 });
    pl.rect(0.2, 3.8, 1, 4.1, { col: "white", border: "black", lwd: 1.5 });
    pl.rect(0.2, 3.8, 0.2 + r.pB * 0.8, 4.1, { col: "#fee5d9", border: null });
    pl.text(0.6, 3.95, rround(r.pB, 4), { cex: 1, font: 2 });
    pl.text(0, 3.3, "P(A∧B → C):", { cex: 0.9, adj: 0 });
    pl.rect(0.2, 3.1, 1, 3.4, { col: "white", border: "black", lwd: 1.5 });
    pl.rect(0.2, 3.1, 0.2 + r.pCgivenB * 0.8, 3.4, { col: "#deebf7", border: null });
    pl.text(0.6, 3.25, rround(r.pCgivenB, 4), { cex: 1, font: 2 });
    pl.text(0.5, 2.7, `Product: ${rround(r.pB * r.pCgivenB, 4)}`, { cex: 1, col: "#666666" });
    pl.text(0, 2.2, "P(A → [B∧C]):", { cex: 0.9, adj: 0 });
    pl.rect(0.2, 2.0, 1, 2.3, { col: "white", border: "black", lwd: 1.5 });
    pl.rect(0.2, 2.0, 0.2 + r.pBoth * 0.8, 2.3, { col: "#d4e4c4", border: null });
    pl.text(0.6, 2.15, rround(r.pBoth, 4), { cex: 1, font: 2 });
    pl.text(0.5, 1.2, `Chaining: ${r.countB} times B holds, of those ${r.countBoth} also have C`,
      { cex: 0.85, col: "#666666", font: 3 });
  });
  $("#ex3-plot1", content).appendChild(barCanvas);

  const gridCanvas = mkCanvas(400, (pl) => {
    const deckType = val("ex3_deck_type"), bCond = val("ex3_b"), cCond = val("ex3_c");
    const ranks = deckRanks(deckType), nR = ranks.length, nS = 4;
    pl.setup({ xlim: [0.5, nR + 0.5], ylim: [0.5, nS + 0.5], mar: [4, 4, 3, 2], asp: 1 });
    pl.title("Possibility Space: Chaining B and C", { cex: 1.1 });
    let countB = 0, countBoth = 0;
    for (let i = 1; i <= nS; i++) {
      for (let j = 1; j <= nR; j++) {
        const suit = SUITS[i - 1], rank = ranks[j - 1];
        const hasB = cardMatchesGrid(suit, rank, bCond), hasC = cardMatchesGrid(suit, rank, cCond);
        if (hasB) countB++;
        if (hasB && hasC) countBoth++;
        const col = (hasB && hasC) ? "#9370DB" : hasB ? "#fee5d9" : "white";
        pl.rect(j - 0.4, i - 0.4, j + 0.4, i + 0.4, { col: col, border: "black", lwd: 0.5 });
        pl.text(j, i, rank + suit, { cex: 0.6 });
      }
    }
    ranks.forEach((lab, i) => pl.text(i + 1, nS + 0.7, lab, { cex: 0.85 }));
    pl.axisPlain(2, [1, 2, 3, 4], SUIT_NAMES, { cex: 0.8 });
    const total = nS * nR, pB = countB / total, pCgivenB = countB > 0 ? countBoth / countB : 0;
    pl.text(nR / 2, -0.5,
      `Orange (B only): ${countB - countBoth} | Green (B∧C): ${countBoth} | P(A→B)×P(A∧B→C) = ${rround(pB, 3)}×${rround(pCgivenB, 3)} = ${rround(pB * pCgivenB, 3)}`,
      { cex: 0.85 });
  });
  $("#ex3-plot2", content).appendChild(gridCanvas);

  function update() {
    const deckType = val("ex3_deck_type"), b = val("ex3_b"), c = val("ex3_c");
    const r = simulate();
    const ad = antecedentDesc(deckType, true);
    $("#ex3_calc", content).textContent =
      `ANTECEDENT A: ${ad}\n\n` +
      `CONSEQUENCE 1: "IF A, THEN B" where B = ${TARGET_DESC[b]}\n` +
      `  - B occurs: ${r.countB} / ${r.n} times\n` +
      `  - P(A → B) = ${rround(r.pB, 4)}\n\n` +
      `CONSEQUENCE 2: "IF (A AND B), THEN C" where C = ${TARGET_DESC[c]}\n` +
      `  - Among ${r.countB} cases where B holds,\n` +
      `    C also holds: ${r.countBoth} times\n` +
      `  - P(A∧B → C) = ${r.countBoth} / ${r.countB} = ${rround(r.pCgivenB, 4)}\n\n` +
      `COMBINED CONSEQUENCE: "IF A, THEN (B AND C)"\n` +
      `  - Both B and C: ${r.countBoth} / ${r.n} times\n` +
      `  - P(A → [B∧C]) = ${rround(r.pBoth, 4)}\n\n` +
      `MULTIPLICATION RULE:\n` +
      `  P(A → B) × P(A∧B → C) = ${rround(r.pB, 4)} × ${rround(r.pCgivenB, 4)} = ${rround(r.pB * r.pCgivenB, 4)}\n` +
      `  P(A → [B∧C]) = ${rround(r.pBoth, 4)}\n\n` +
      `The consequences CHAIN: first A leads to B, then among cases\n` +
      `where we have both A and B, we check if C follows.`;
    drawCanvas(barCanvas); drawCanvas(gridCanvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 4 — Special Rule for Independent Probabilities
   ========================================================================*/
registerExample("example-ex4", (box) => {
  box.appendChild(exHeader("Interactive Example: Independent Probabilities", "ex4-content"));
  const content = h(`<div id="ex4-content" class="example-content">
    <p><strong>The Special Rule:</strong> When B and C are <em>independent</em> (meaning P(A&rarr;C) = P(A&and;B&rarr;C)), we can multiply:</p>
    <p>P(A &rarr; B) &times; P(A &rarr; C) = P(A &rarr; [B &and; C])</p>
    <p><strong>Independence means:</strong> Knowing B doesn't change the probability of C</p>
    <div class="control-panel" id="ex4-controls"></div>
    <div class="plot-container" id="ex4-plot"></div>
    <div class="calc-output" id="ex4_calc"></div>
  </div>`);
  box.appendChild(content);

  const controls = $("#ex4-controls", content);
  controls.appendChild(select("ex4_deck_type",
    '<span class="hl-antecedent">Antecedent A - Draw top card from:</span>', DECK_CHOICES, "shuffled_standard"));
  controls.appendChild(buildConsequentUI("ex4_b", "Consequent B", "hl-event-a", () => update()));
  controls.appendChild(buildConsequentUI("ex4_c", "Consequent C", "hl-event-b", () => update()));
  controls.addEventListener("change", () => update());

  const canvas = mkCanvas(400, (pl) => {
    const grid = createGrid(val("ex4_deck_type"));
    renderGridPlot(pl, grid, evaluateConsequent(grid, getConsequentRule("ex4_b")), "double",
      "Possibility Space: Independent B and C", evaluateConsequent(grid, getConsequentRule("ex4_c")));
  });
  $("#ex4-plot", content).appendChild(canvas);

  function ruleDesc(rule) {
    const suitDesc = rule.suit === "any" ? "" : " of " +
      ({ H: "Hearts", D: "Diamonds", C: "Clubs", S: "Spades", red: "red", black: "black" }[rule.suit] || rule.suit);
    const propName = { any_card: "Any card", even: "Even", odd: "Odd", face: "Face card",
      non_face: "Non-face", red: "Red", black: "Black" };
    switch (rule.operator) {
      case "exactly": return `Card is exactly ${rule.rank}${suitDesc}`;
      case "higher_than": return `Card is higher than ${rule.rank}${suitDesc}`;
      case "lower_than": return `Card is lower than ${rule.rank}${suitDesc}`;
      case "any": return `Card is ${propName[rule.property]}${suitDesc}`;
      case "anything_other_than": return rule.property
        ? `Card is anything other than ${propName[rule.property]}${suitDesc}`
        : `Card is anything other than ${rule.rank}${suitDesc}`;
      default: return "";
    }
  }

  function update() {
    const deckType = val("ex4_deck_type");
    const grid = createGrid(deckType);
    const ruleB = getConsequentRule("ex4_b"), ruleC = getConsequentRule("ex4_c");
    const mB = evaluateConsequent(grid, ruleB), mC = evaluateConsequent(grid, ruleC);
    const tB = possibleSummary(grid, mB);
    const tC = possibleSummary(grid, mC);
    const tBoth = possibleSummary(grid, mB.map((m, i) => m && mC[i]));
    const countB = tB.successes, countC = tC.successes, countBoth = tBoth.successes;
    const size = tB.total;
    const pB = tB.prob, pC = tC.prob, pBoth = tBoth.prob;
    const pCgivenB = countB > 0 ? countBoth / countB : 0;
    const indep = Math.abs(pC - pCgivenB) < 0.001;
    const ad = antecedentDesc(deckType, true);
    $("#ex4_calc", content).textContent =
      `ANTECEDENT A: ${ad}\n\n` +
      `CONSEQUENCE 1: "IF A, THEN B" where B = ${ruleDesc(ruleB)}\n` +
      `  - P(A → B) = ${countB}/${size} = ${rround(pB, 4)}\n\n` +
      `CONSEQUENCE 2: "IF A, THEN C" where C = ${ruleDesc(ruleC)}\n` +
      `  - P(A → C) = ${countC}/${size} = ${rround(pC, 4)}\n\n` +
      `INDEPENDENCE TEST:\n` +
      `  - P(A → C) = ${rround(pC, 4)}\n` +
      `  - P(A∧B → C) = ${countBoth}/${countB} = ${rround(pCgivenB, 4)}\n` +
      `  - ${indep ? "✓ INDEPENDENT" : "✗ NOT INDEPENDENT"}\n\n` +
      `SPECIAL RULE (only works if independent):\n` +
      `  P(A → B) × P(A → C) = ${rround(pB, 4)} × ${rround(pC, 4)} = ${rround(pB * pC, 4)}\n` +
      `  P(A → [B∧C]) = ${countBoth}/${size} = ${rround(pBoth, 4)}\n\n` +
      (indep
        ? `✓ Rule works! Products match exactly.\nThis is because knowing B doesn't change the probability of C.`
        : `✗ Rule doesn't work here. B and C are NOT independent.\nKnowing B changes the probability of C.\nDifference: |${rround(pB * pC, 4)} - ${rround(pBoth, 4)}| = ${rround(Math.abs(pB * pC - pBoth), 4)}`);
    drawCanvas(canvas);
  }
  update();
});
</script>
