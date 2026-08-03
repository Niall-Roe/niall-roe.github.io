<script>
/* ==========================================================================
   Example scaffolding: click a highlighted passage to open its demonstration.
   Content is built lazily the first time a container is opened.
   ========================================================================*/

const BUILDERS = {};
const BUILT = {};

function registerExample(id, builder) { BUILDERS[id] = builder; }

/* --------------------------------------------------------------------------
   Live numbers in Peirce's own text.

   A figure in the prose carries data-live="<driver>:<key>", where <driver> is
   the id of the example whose controls move it. While that example is shut the
   span shows exactly what Peirce printed; while it is open the span shows what
   the sliders say, in the colour of the slider saying it. Closing the example
   restores his text — the document is his unless you are actively driving it.

   Nothing here knows about any particular example: each one registers its own
   set of getters, and any input/change/click inside its container re-reads
   them. #peirce-table-block is always on the page, so it passes an engaged()
   of its own (its sliders being off Peirce's figures) instead of open/shut.
   ------------------------------------------------------------------------*/
const LIVE = {};
const LIVE_OPEN = new Set();

function registerLive(driverId, bindings, opts) {
  LIVE[driverId] = { get: bindings, opts: opts || {} };
  refreshLive(driverId);
}

function liveEngaged(driverId) {
  const rec = LIVE[driverId];
  if (!rec) return false;
  return rec.opts.engaged ? !!rec.opts.engaged() : LIVE_OPEN.has(driverId);
}

/* `also` lets one driver pull another along, for the case where two adjacent
   demonstrations are working the same pair of numbers and either may be the
   one being driven. The guard is because those relations are mutual. */
const REFRESHING = new Set();

function refreshLive(driverId) {
  const rec = LIVE[driverId];
  if (!rec || REFRESHING.has(driverId)) return;
  REFRESHING.add(driverId);
  try { refreshLiveInner(driverId, rec); (rec.opts.also || []).forEach(refreshLive); }
  finally { REFRESHING.delete(driverId); }
}

function refreshLiveInner(driverId, rec) {
  const on = liveEngaged(driverId);
  const prefix = driverId + ":";
  $$(`[data-live^="${prefix}"]`).forEach((el) => {
    if (el.dataset.peirce === undefined) el.dataset.peirce = el.innerHTML;
    const key = el.getAttribute("data-live").slice(prefix.length);
    let out = null;
    if (on && rec.get[key]) {
      try { out = rec.get[key](); } catch (e) { out = null; }
    }
    if (out === null || out === undefined) {
      if (el.innerHTML !== el.dataset.peirce) el.innerHTML = el.dataset.peirce;
      el.classList.remove("is-live");
      return;
    }
    const s = String(out);
    if (el.innerHTML !== s) el.innerHTML = s;
    el.classList.add("is-live");
  });
  if (rec.opts.onRefresh) rec.opts.onRefresh(on);
}

/* Any control touched inside a driver's container re-reads that driver's
   getters. Bubble phase, so the example's own handlers have already run. */
["input", "change", "click"].forEach((type) => {
  document.addEventListener(type, (ev) => {
    const t = ev.target;
    if (!t || !t.closest) return;
    const host = t.closest(".example-container[id], #peirce-table-block");
    if (host && LIVE[host.id]) refreshLive(host.id);
  });
});

/* --------------------------------------------------------------------------
   Opening an example. The container is a one-row grid whose row goes 0fr ->
   1fr, which animates to the content's own height without measuring anything;
   .ex-inner does the clipping. The prose below is pushed down by the growth
   rather than being covered over, so the example takes its place in the column
   instead of arriving on top of it.
   ------------------------------------------------------------------------*/
function exInner(box) {
  let inner = box.querySelector(":scope > .ex-inner");
  if (!inner) {
    inner = document.createElement("div");
    inner.className = "ex-inner";
    box.appendChild(inner);
  }
  return inner;
}

document.addEventListener("click", (ev) => {
  const trg = ev.target.closest("[data-toggle]");
  if (!trg) return;
  const id = trg.getAttribute("data-toggle");
  const box = document.getElementById(id);
  if (!box) return;

  const inner = exInner(box);
  if (!BUILT[id] && BUILDERS[id]) { BUILDERS[id](inner); BUILT[id] = true; }

  const opening = !box.classList.contains("open");
  box.classList.toggle("open", opening);
  if (opening) box.removeAttribute("inert"); else box.setAttribute("inert", "");
  $$(`[data-toggle="${id}"]`).forEach((t) => t.classList.toggle("is-open", opening));

  $$(`[data-hl-for="${id}"]`).forEach((el) => el.classList.toggle("hl-on", opening));

  if (opening) { LIVE_OPEN.add(id); requestAnimationFrame(redrawAll); }
  else LIVE_OPEN.delete(id);
  refreshLive(id);
});

/* Plots are sized from clientWidth, so they want a redraw once the row has
   finished growing; and the example is nudged into view only if the growth
   left it hanging off the bottom. */
document.addEventListener("transitionend", (ev) => {
  if (ev.propertyName !== "grid-template-rows") return;
  const box = ev.target;
  if (!box.classList || !box.classList.contains("example-container")) return;
  if (!box.classList.contains("open")) return;
  redrawAll();
  const r = box.getBoundingClientRect();
  if (r.top < 0 || r.top > window.innerHeight * 0.75) {
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

$$(".example-container").forEach((box) => box.setAttribute("inert", ""));

/* Each example's number in the gutter beside the passage that opens it, taken
   from its own id so it matches the part files in src/. The granary table has
   no trigger — it is always on the page — so it is labelled directly. */
$$("[data-toggle]").forEach((trg) => {
  const m = /(\d+)$/.exec(trg.getAttribute("data-toggle") || "");
  if (!m || $(".ex-num", trg)) return;
  trg.insertBefore(h(`<span class="ex-num" aria-hidden="true">${m[1]}</span>`), trg.firstChild);
});
(function numberGranary() {
  const host = document.getElementById("peirce-table-block");
  if (host && !$(".ex-num", host)) {
    host.insertBefore(h(`<span class="ex-num" aria-hidden="true">14</span>`), host.firstChild);
  }
})();

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
    if (scheme === "single") { if (matched[i]) col = "#dde9dc"; }
    else if (scheme === "double" && matched2) {
      if (matched[i] && matched2[i]) col = "#bdb0cf";
      else if (matched[i]) col = "#f5e2d8";
      else if (matched2[i]) col = "#dfe8f1";
    }
    pl.rect(cell.x - 0.4, cell.y - 0.4, cell.x + 0.4, cell.y + 0.4, { col: col, border: PAL.inkFaint, lwd: 0.5 });
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
/* --------------------------------------------------------------------------
   A word in an argument that can be changed. It is set in bold with a dotted
   rule under it so it reads as clickable, and clicking opens a short list under
   it rather than cycling — with five suits to choose from, cycling is four
   clicks to get back to where you were.
   ------------------------------------------------------------------------*/
function argChip(key, label) {
  return `<button class="arg-pick" data-pick="${key}">${label}</button>`;
}

function argMenu(chip, options, current, onPick) {
  $$(".arg-menu").forEach((m) => m.remove());
  const menu = h(`<div class="arg-menu">${options.map(([v, lab]) =>
    `<button class="arg-opt${v === current ? " on" : ""}" data-val="${esc(v)}">${lab}</button>`
  ).join("")}</div>`);
  chip.parentNode.insertBefore(menu, chip.nextSibling);
  menu.style.left = `${chip.offsetLeft}px`;
  menu.style.top = `${chip.offsetTop + chip.offsetHeight + 2}px`;
  menu.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-val]");
    if (!b) return;
    menu.remove();
    onPick(b.getAttribute("data-val"));
  });
  setTimeout(() => document.addEventListener("click", function away(e) {
    if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", away); }
  }), 0);
}

registerExample("example-ex1", (box) => {
  box.appendChild(exHeader("Interactive Example: Antecedent, Consequent, Consequence", "ex1-content"));
  const content = h(`<div id="ex1-content" class="example-content">
    <p class="arg-line" id="ex1-arg"></p>
    <div class="row">
      <div class="col col-6"><div id="ex1-rank-slider"></div></div>
      <div class="col col-6"><div id="ex1_formula_display"></div></div>
    </div>
    <div class="plot-container" id="ex1-plot"></div>
    <div class="note-block">Probabilities do not apply to events. There is no probability of
      <span class="math">C</span>. They apply to arguments, and so always depend on how some set of
      antecedent facts relate to the consequent fact.</div>
    <div class="calc-output" id="ex1_calc"></div>
  </div>`);
  box.appendChild(content);

  /* Every choice is a word in the sentence rather than a control beside it, so
     what is being set is read in place: click a word to change it. */
  const OPTS = {
    pos:   [["top", "top"], ["middle", "middle"], ["bottom", "bottom"]],
    state: [["shuffled", "well shuffled"], ["new", "brand new"]],
    deck:  [["standard", "deck of standard playing cards"], ["piquet", "piquet pack"],
            ["trick", "trick pack, in which every card is the ace of spades"]],
    op:    [["exactly", "exactly"], ["higher_than", "higher than"], ["lower_than", "lower than"]],
    suit:  [["any", "any suit"], ["H", "hearts"], ["D", "diamonds"], ["C", "clubs"], ["S", "spades"]]
  };
  const pick = { pos: "top", state: "shuffled", deck: "standard", op: "exactly", suit: "any" };
  let rank = "A";

  const labelOf = (k) => (OPTS[k].find((o) => o[0] === pick[k]) || OPTS[k][0])[1];
  const ranksNow = () => (pick.deck === "piquet"
    ? ["7", "8", "9", "10", "J", "Q", "K", "A"]
    : ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);

  $("#ex1-rank-slider", content).appendChild(
    slider("ex1_rank_i", "Rank:", 0, 12, 0, 1, () => rank, "k1"));

  /* The layout of the pack is the shared one; what changes is which of its
     cards can come up. A brand-new pack settles the question before the draw —
     one card is certain and the rest impossible — and a trick pack settles it
     the other way, every card being the same card. */
  const NEW_ORDER = (ranks) => {
    const out = [];
    ["S", "D"].forEach((su) => ranks.forEach((r) => out.push(r + su)));
    ["C", "H"].forEach((su) => ranks.slice().reverse().forEach((r) => out.push(r + su)));
    return out;
  };

  function grid() {
    const g = createGrid(pick.deck === "piquet" ? "shuffled_piquet" : "shuffled_standard");
    if (pick.deck === "trick") {
      g.cells.forEach((c) => { c.rank = "A"; c.suit = "S"; c.label = "AS"; });
      return g;
    }
    if (pick.state === "new") {
      const order = NEW_ORDER(ranksNow());
      const idx = pick.pos === "top" ? 0
        : pick.pos === "middle" ? Math.floor(order.length / 2) : order.length - 1;
      const only = order[idx];
      g.cells.forEach((c) => { c.prob = (c.label === only) ? 1 : 0; });
    }
    return g;
  }

  const rule = () => ({ operator: pick.op, rank: rank, suit: pick.suit });

  const canvas = mkCanvas(400, (pl) => {
    const g = grid();
    renderGridPlot(pl, g, evaluateConsequent(g, rule()), "single",
      "Every card that could come up");
    /* A brand-new pack settles which card it is before the draw, so the rest
       are still shown — they are cards in the pack — but faded, because none
       of them can come up. The whole space is there; only one of it is live. */
    g.cells.forEach((c) => {
      if (c.prob > 0) return;
      pl.rect(c.x - 0.4, c.y - 0.4, c.x + 0.4, c.y + 0.4,
        { col: "rgba(255,255,255,0.80)", border: PAL.ruleSoft, lwd: 0.5 });
    });
  });
  $("#ex1-plot", content).appendChild(canvas);

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-pick]");
    if (!b) return;
    const k = b.getAttribute("data-pick");
    argMenu(b, OPTS[k], pick[k], (v) => {
      pick[k] = v;
      if (k === "deck") {                    // the piquet pack has no low cards
        const rs = ranksNow();
        if (!rs.includes(rank)) rank = rs[0];
        setSlider("ex1_rank_i", rs.indexOf(rank));
      }
      update();
    });
  });
  content.addEventListener("input", (ev) => {
    if (ev.target.id !== "ex1_rank_i") return;
    const rs = ranksNow();
    rank = rs[Math.min(rs.length - 1, Math.round(num("ex1_rank_i")))];
    update();
  });

  function update() {
    const rs = ranksNow();
    const sl = document.getElementById("ex1_rank_i");
    if (sl) { sl.max = rs.length - 1; if (+sl.value > rs.length - 1) sl.value = rs.length - 1; }
    rank = rs[Math.min(rs.length - 1, Math.round(num("ex1_rank_i")))];
    const lab = document.getElementById("ex1_rank_i_val");
    if (lab) lab.textContent = rank;

    const chip = (k) => argChip(k, labelOf(k));
    $("#ex1-arg", content).innerHTML =
      `<span class="math">P</span>(` +
      `<span class="hl-text a hl-on">If I were to draw the ${chip("pos")} card ` +
      `from a ${chip("state")} ${chip("deck")}</span>, ` +
      `<span class="hl-then">then</span> ` +
      `<span class="hl-text c hl-on">that card would be ${chip("op")} ` +
      `<strong>${rank}</strong> of ${chip("suit")}</span>)`;

    const g = grid();
    const matched = evaluateConsequent(g, rule());
    const { successes, total, prob } = possibleSummary(g, matched);
    $("#ex1_formula_display", content).innerHTML =
      `<div class="formula-box" style="margin:0;">P(<span class="hl-text a hl-on">A</span>
         <span class="hl-then">&rarr;</span> <span class="hl-text c hl-on">C</span>) =
         ${frac(String(successes), String(total))} = <strong>${rround(prob, 4)}</strong></div>`;

    $("#ex1_calc", content).textContent =
      `ANTECEDENT   drawing the ${labelOf("pos")} card from a ${labelOf("state")} ${labelOf("deck")}\n` +
      `CONSEQUENT   the card is ${labelOf("op")} ${rank} of ${labelOf("suit")}\n` +
      `CONSEQUENCE  if the first, then the second\n\n` +
      `P(A -> C) = ${successes} / ${total} = ${rround(prob, 4)}\n\n` +
      `The number is a property of the consequence — of arguments of this form —\n` +
      `and not of any card. There is no P(this card is an ace).`;
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
  box.appendChild(exHeader("Interactive Example: The Rule for the Addition of Probabilities", "ex2-content"));
  const content = h(`<div id="ex2-content" class="example-content">
    <p class="arg-line" id="ex2-a1"></p>
    <p class="arg-line" id="ex2-a2"></p>
    <div class="arg-rule" id="ex2-rule"></div>
    <div class="plot-container" id="ex2-plot"></div>
    <div id="ex2-verdict"></div>
    <div class="note-block">Two consequences from the same antecedent. The rule adds them, and adding
      them is right only while they cannot both come true &mdash; while nothing counts towards both.
      Set them so that something does, and the sum counts it twice.</div>
  </div>`);
  box.appendChild(content);

  const A_OPTS = {
    pos:   [["top", "top"], ["middle", "middle"], ["bottom", "bottom"]],
    state: [["shuffled", "well shuffled"], ["new", "brand new"]],
    deck:  [["standard", "deck of standard playing cards"], ["piquet", "piquet pack"]]
  };
  const C_OPTS = {
    op:   [["exactly", "exactly"], ["higher_than", "higher than"], ["lower_than", "lower than"]],
    suit: [["any", "any suit"], ["H", "hearts"], ["D", "diamonds"], ["C", "clubs"], ["S", "spades"]]
  };
  const ante = { pos: "top", state: "shuffled", deck: "standard" };
  const cons = [{ op: "exactly", rank: "A", suit: "H" }, { op: "exactly", rank: "A", suit: "S" }];

  // evaluateConsequent names the field `operator`, not `op`
  const ruleOf = (c) => ({ operator: c.op, rank: c.rank, suit: c.suit });

  const lab = (opts, k, v) => (opts[k].find((o) => o[0] === v) || opts[k][0])[1];
  const ranks = () => (ante.deck === "piquet"
    ? ["7", "8", "9", "10", "J", "Q", "K", "A"]
    : ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);

  const NEW_ORDER = (rs) => {
    const out = [];
    ["S", "D"].forEach((su) => rs.forEach((r) => out.push(r + su)));
    ["C", "H"].forEach((su) => rs.slice().reverse().forEach((r) => out.push(r + su)));
    return out;
  };

  function grid() {
    const g = createGrid(ante.deck === "piquet" ? "shuffled_piquet" : "shuffled_standard");
    if (ante.state === "new") {
      const order = NEW_ORDER(ranks());
      const idx = ante.pos === "top" ? 0
        : ante.pos === "middle" ? Math.floor(order.length / 2) : order.length - 1;
      g.cells.forEach((c) => { c.prob = (c.label === order[idx]) ? 1 : 0; });
    }
    return g;
  }

  const anteText = () =>
    `If I were to draw the ${argChip("a:pos", lab(A_OPTS, "pos", ante.pos))} card from a ` +
    `${argChip("a:state", lab(A_OPTS, "state", ante.state))} ` +
    `${argChip("a:deck", lab(A_OPTS, "deck", ante.deck))}`;

  const consText = (n) =>
    `that card would be ${argChip(`c${n}:op`, lab(C_OPTS, "op", cons[n].op))} ` +
    `${argChip(`c${n}:rank`, cons[n].rank)} of ${argChip(`c${n}:suit`, lab(C_OPTS, "suit", cons[n].suit))}`;

  const canvas = mkCanvas(400, (pl) => {
    const g = grid();
    const m1 = evaluateConsequent(g, ruleOf(cons[0])), m2 = evaluateConsequent(g, ruleOf(cons[1]));
    renderGridPlot(pl, g, m1.map((v, i) => v || m2[i]), "single", "Every card that could come up");
    g.cells.forEach((c, i) => {
      if (!(c.prob > 0)) {
        pl.rect(c.x - 0.4, c.y - 0.4, c.x + 0.4, c.y + 0.4,
          { col: "rgba(255,255,255,0.80)", border: PAL.ruleSoft, lwd: 0.5 });
      } else if (m1[i] && m2[i]) {
        // counted by both consequents, and so counted twice by the sum
        pl.rect(c.x - 0.4, c.y - 0.4, c.x + 0.4, c.y + 0.4,
          { col: "rgba(176,86,63,0.45)", border: "#8a4331", lwd: 1.4 });
      }
    });
  });
  $("#ex2-plot", content).appendChild(canvas);

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-pick]");
    if (!b) return;
    const [who, k] = b.getAttribute("data-pick").split(":");
    const opts = who === "a" ? A_OPTS[k]
      : k === "rank" ? ranks().map((r) => [r, r]) : C_OPTS[k];
    const cur = who === "a" ? ante[k] : cons[+who[1]][k];
    argMenu(b, opts, cur, (v) => {
      if (who === "a") {
        ante[k] = v;
        if (k === "deck") cons.forEach((c) => { if (!ranks().includes(c.rank)) c.rank = ranks()[0]; });
      } else cons[+who[1]][k] = v;
      update();
    });
  });

  function update() {
    $("#ex2-a1", content).innerHTML =
      `<span class="math">P</span>(<span class="hl-text a hl-on">${anteText()}</span>, ` +
      `<span class="hl-then">then</span> <span class="hl-text c hl-on">${consText(0)}</span>)`;
    $("#ex2-a2", content).innerHTML =
      `<span class="math">P</span>(<span class="hl-text a hl-on">the same</span>, ` +
      `<span class="hl-then">then</span> <span class="hl-text c hl-on">${consText(1)}</span>)`;

    const g = grid();
    const m1 = evaluateConsequent(g, ruleOf(cons[0])), m2 = evaluateConsequent(g, ruleOf(cons[1]));
    const live = g.cells.filter((c) => c.prob > 0);
    const total = live.length;
    const n = (m) => g.cells.filter((c, i) => c.prob > 0 && m[i]).length;
    const n1 = n(m1), n2 = n(m2);
    const both = g.cells.filter((c, i) => c.prob > 0 && m1[i] && m2[i]).length;
    const either = n1 + n2 - both;
    const ok = both === 0;

    $("#ex2-rule", content).innerHTML =
      `<span class="math">P(<span class="hl-text a hl-on">A</span>
         <span class="hl-then">&rarr;</span> <span class="hl-text c hl-on">C<sub>1</sub></span>)</span>
       ${frac(String(n1), String(total))}
       &nbsp;+&nbsp;
       <span class="math">P(<span class="hl-text a hl-on">A</span>
         <span class="hl-then">&rarr;</span> <span class="hl-text c hl-on">C<sub>2</sub></span>)</span>
       ${frac(String(n2), String(total))}
       &nbsp;=&nbsp;
       <span class="math">P(<span class="hl-text a hl-on">A</span>
         <span class="hl-then">&rarr;</span>
         <span class="hl-text c hl-on">C<sub>1</sub> or C<sub>2</sub></span>)</span>
       ${frac(String(n1 + n2), String(total))}`;

    $("#ex2-verdict", content).innerHTML = ok
      ? `<div class="key-insight"><p style="margin-bottom:0;">Nothing answers to both consequents, so
           the sum is the answer: <strong>${fmt(either / total, 4)}</strong>. That is the rule.</p></div>`
      : `<div class="key-insight"><p style="margin-bottom:0;"><strong>${bigmark(both)}</strong>
           ${both === 1 ? "card answers" : "cards answer"} to both consequents &mdash; ringed above &mdash;
           so the sum counts ${both === 1 ? "it" : "them"} twice. It gives
           ${frac(String(n1 + n2), String(total))} = ${fmt((n1 + n2) / total, 4)} where the truth is
           ${frac(String(either), String(total))} = <strong>${fmt(either / total, 4)}</strong>. The rule
           holds only for consequents that cannot both come true.</p></div>`;
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
      <span class="hl-antecedent">A</span> <span style="color:#4a7c59;font-weight:bold;">&rarr;</span> <span class="hl-consequent">B</span> (prob P&#8321;)<br>
      <span class="hl-antecedent">A &and; B</span> <span style="color:#4a7c59;font-weight:bold;">&rarr;</span> <span class="hl-consequent">C</span> (prob P&#8322;)<br>
      <span style="color:#6b7178;">Therefore:</span> <span class="hl-antecedent">A</span> <span style="color:#4a7c59;font-weight:bold;">&rarr;</span> <span class="hl-combined">B &and; C</span> (prob P&#8321; &times; P&#8322;)
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
    pl.rect(0.2, 3.8, 1, 4.1, { col: "white", border: PAL.inkFaint, lwd: 1.5 });
    pl.rect(0.2, 3.8, 0.2 + r.pB * 0.8, 4.1, { col: "#f5e2d8", border: null });
    pl.text(0.6, 3.95, rround(r.pB, 4), { cex: 1, font: 2 });
    pl.text(0, 3.3, "P(A∧B → C):", { cex: 0.9, adj: 0 });
    pl.rect(0.2, 3.1, 1, 3.4, { col: "white", border: PAL.inkFaint, lwd: 1.5 });
    pl.rect(0.2, 3.1, 0.2 + r.pCgivenB * 0.8, 3.4, { col: "#dfe8f1", border: null });
    pl.text(0.6, 3.25, rround(r.pCgivenB, 4), { cex: 1, font: 2 });
    pl.text(0.5, 2.7, `Product: ${rround(r.pB * r.pCgivenB, 4)}`, { cex: 1, col: "#6b7178" });
    pl.text(0, 2.2, "P(A → [B∧C]):", { cex: 0.9, adj: 0 });
    pl.rect(0.2, 2.0, 1, 2.3, { col: "white", border: PAL.inkFaint, lwd: 1.5 });
    pl.rect(0.2, 2.0, 0.2 + r.pBoth * 0.8, 2.3, { col: "#dfe6d4", border: null });
    pl.text(0.6, 2.15, rround(r.pBoth, 4), { cex: 1, font: 2 });
    pl.text(0.5, 1.2, `Chaining: ${r.countB} times B holds, of those ${r.countBoth} also have C`,
      { cex: 0.85, col: "#6b7178", font: 3 });
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
        const col = (hasB && hasC) ? "#8a7aa8" : hasB ? "#f5e2d8" : "white";
        pl.rect(j - 0.4, i - 0.4, j + 0.4, i + 0.4, { col: col, border: PAL.inkFaint, lwd: 0.5 });
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
      `The antecedent is ${ad}.\n\n` +
      `First consequence — if A, then B, where B is ${TARGET_DESC[b]}.\n` +
      `  B occurred ${r.countB} times in ${r.n}.\n` +
      `  P(A → B) = ${rround(r.pB, 4)}\n\n` +
      `Second consequence — if A and B, then C, where C is ${TARGET_DESC[c]}.\n` +
      `  Among the ${r.countB} cases where B held, C held ${r.countBoth} times.\n` +
      `  P(A∧B → C) = ${r.countBoth} / ${r.countB} = ${rround(r.pCgivenB, 4)}\n\n` +
      `The two together — if A, then both B and C.\n` +
      `  Both held ${r.countBoth} times in ${r.n}.\n` +
      `  P(A → [B∧C]) = ${rround(r.pBoth, 4)}\n\n` +
      `And that is the rule:\n` +
      `  P(A → B) × P(A∧B → C) = ${rround(r.pB, 4)} × ${rround(r.pCgivenB, 4)} = ${rround(r.pB * r.pCgivenB, 4)}\n` +
      `  P(A → [B∧C]) = ${rround(r.pBoth, 4)}\n\n` +
      `The consequences chain. A leads to B, and then among the cases where\n` +
      `both A and B hold, we ask whether C follows.`;
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
      `The antecedent is ${ad}.\n\n` +
      `First consequence — if A, then B, where B is ${ruleDesc(ruleB)}.\n` +
      `  P(A → B) = ${countB}/${size} = ${rround(pB, 4)}\n\n` +
      `Second consequence — if A, then C, where C is ${ruleDesc(ruleC)}.\n` +
      `  P(A → C) = ${countC}/${size} = ${rround(pC, 4)}\n\n` +
      `Are they independent? Knowing B would have to leave C where it was.\n` +
      `  P(A → C) = ${rround(pC, 4)}\n` +
      `  P(A∧B → C) = ${countBoth}/${countB} = ${rround(pCgivenB, 4)}\n` +
      `  ${indep ? "The same, so B and C are independent."
        : "Not the same, so B and C are not independent."}\n\n` +
      `The special rule, which holds only in that case:\n` +
      `  P(A → B) × P(A → C) = ${rround(pB, 4)} × ${rround(pC, 4)} = ${rround(pB * pC, 4)}\n` +
      `  P(A → [B∧C]) = ${countBoth}/${size} = ${rround(pBoth, 4)}\n\n` +
      (indep
        ? `The two agree, because knowing B does not change the probability of C.`
        : `The two do not agree, because knowing B changes the probability of C.\n` +
          `They are out by ${rround(Math.abs(pB * pC - pBoth), 4)}.`);
    drawCanvas(canvas);
  }
  update();
});
</script>
