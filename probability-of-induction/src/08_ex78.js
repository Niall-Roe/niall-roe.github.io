<script>
/* ==========================================================================
   EXAMPLE 7 — The proportion correct among the answers that agree
   (93 x 81) / ((93 x 81) + (7 x 19))
   ========================================================================*/
registerExample("example-ex7", (box) => {
  box.appendChild(exHeader("Interactive Example: When Both Rules Give the Same Answer", "ex7-content"));
  const content = h(`<div id="ex7-content" class="example-content">
    <p>Two independent rules, applied to the same question, either agree or disagree. They agree in just two
      circumstances: both are right, or both are wrong. Peirce's formula asks what proportion of the agreements
      are the first kind.</p>
    <div class="row">
      <div class="col col-6"><h5><span class="math">A</span><sub>1</sub> &rarr; <span class="math">C</span></h5>
        <div id="ex7-r-slider"></div></div>
      <div class="col col-6"><h5><span class="math">A</span><sub>2</sub> &rarr; <span class="math">C</span></h5>
        <div id="ex7-s-slider"></div></div>
    </div>
    <div class="ex-buttonbar" id="ex7-actions"></div>
    <div class="plot-container" id="ex7-plot"></div>
    <div id="ex7-work"></div>
  </div>`);
  box.appendChild(content);

  /* Same range and step as ex8's pair, so the two panels can mirror each other
     value for value. */
  $("#ex7-r-slider", content).appendChild(
    slider("ex7_r", "Right in this proportion of cases:", 0.02, 0.98, 0.81, 0.01, (v) => v.toFixed(2), "k1"));
  $("#ex7-s-slider", content).appendChild(
    slider("ex7_s", "Right in this proportion of cases:", 0.02, 0.98, 0.93, 0.01, (v) => v.toFixed(2), "k2"));
  $("#ex7-actions", content).appendChild(
    h(`<button class="restore-peirce" data-act="ex7reset">Reset to Peirce&rsquo;s 81 and 93</button>`));
  ex678Adopt();

  content.addEventListener("input", () => update());
  content.addEventListener("click", (ev) => {
    if (ev.target.closest('[data-act="ex7reset"]')) { setSlider("ex7_r", 0.81); setSlider("ex7_s", 0.93); update(); }
  });

  const canvas = mkCanvas(340, (pl) => {
    const r = num("ex7_r"), s = num("ex7_s");
    const both = r * s, neither = (1 - r) * (1 - s);
    const agree = both + neither;
    // barely any bottom margin: the last line of the figure is its own caption
    pl.setup({ xlim: [0, 1], ylim: [0, 3.2], mar: [0.6, 1, 3, 1] });
    pl.title("All questions, then only those where the rules agree", { cex: 1 });
    // bar 1: the whole population of questions
    const seg = (y0, y1, parts) => {
      let x = 0;
      parts.forEach((p) => {
        if (p.w <= 0) return;
        pl.rect(x, y0, x + p.w, y1, { col: p.col, border: "#3a3f45", lwd: 0.7 });
        if (p.w > 0.07) pl.text(x + p.w / 2, (y0 + y1) / 2, p.lab, { cex: 0.72, font: 2 });
        x += p.w;
      });
    };
    pl.text(0, 2.95, "Every question:", { adj: 0, cex: 0.85, font: 2 });
    seg(2.35, 2.85, [
      { w: both, col: "#9cbf9f", lab: `both right ${fmt(both * 100, 0)}` },
      { w: r * (1 - s), col: "#e0cfa3", lab: "1✓2✗" },
      { w: (1 - r) * s, col: "#cbab5e", lab: "1✗2✓" },
      { w: neither, col: "#ddaba2", lab: `both wrong ${fmt(neither * 100, 0)}` }]);
    pl.text(0, 1.75, "Discard the disagreements, and rescale:", { adj: 0, cex: 0.85, font: 2 });
    seg(1.15, 1.65, [
      { w: both / agree, col: "#9cbf9f", lab: `both right ${fmt(both / agree * 100, 1)}%` },
      { w: neither / agree, col: "#ddaba2", lab: `both wrong ${fmt(neither / agree * 100, 1)}%` }]);
    pl.text(0.5, 0.55, `P(the shared answer is correct) = ${fmt(both / agree, 4)}`, { cex: 1.05, font: 2 });
    pl.text(0.5, 0.15, `The rules agree on ${fmt(agree * 100, 1)}% of questions.`, { cex: 0.85, col: "#575d66" });
  });
  $("#ex7-plot", content).appendChild(canvas);

  function update() {
    const r = num("ex7_r"), s = num("ex7_s");
    const R = Math.round(r * 100), S = Math.round(s * 100);
    $("[data-act=\"ex7reset\"]", content).classList.toggle("on", !(R === 81 && S === 93));
    const bothN = S * R, neitherN = (100 - S) * (100 - R);
    /* One line, close under the bars: the working is worth having but it is not
       what the panel is for, and it was taking three times the room it needed. */
    $("#ex7-work", content).innerHTML = `<p class="ex7-work-line math">
      ${frac(`${S} &times; ${R}`, `(${S} &times; ${R}) + (${100 - S} &times; ${100 - R})`)} =
      ${frac(bigmark(bothN), bigmark(bothN + neitherN))} =
      <strong>${fmt(bothN / (bothN + neitherN), 6)}</strong></p>`;
    drawCanvas(canvas);
  }
  update();
});

/* --------------------------------------------------------------------------
   The 81 and 93 are worked twice over, once in ex7 and once in ex8, and the
   displayed quotient sitting between the two belongs to both. So the pair is
   registered once, here, for both containers: whichever demonstration is open
   supplies the figures, and if both are, the one last touched wins. Registering
   at load rather than inside a builder means opening either one is enough.
   ------------------------------------------------------------------------*/
let ex78Last = null;

document.addEventListener("input", (ev) => {
  const host = ev.target.closest && ev.target.closest(".example-container[id]");
  if (host && (host.id === "example-ex7" || host.id === "example-ex8")) ex78Last = host.id;
}, true);

function ex78Pair() {
  const live = {
    "example-ex7": () => (LIVE_OPEN.has("example-ex7") && document.getElementById("ex7_r"))
      ? [num("ex7_r"), num("ex7_s")] : null,
    "example-ex8": () => (LIVE_OPEN.has("example-ex8") && document.getElementById("ex8_p1"))
      ? [num("ex8_p1"), num("ex8_p2")] : null
  };
  if (ex78Last && live[ex78Last]) { const v = live[ex78Last](); if (v) return v; }
  return live["example-ex7"]() || live["example-ex8"]();
}

const EX78_LIVE = {
  r:  () => { const p = ex78Pair(); return p ? Math.round(p[0] * 100) : null; },
  rc: () => { const p = ex78Pair(); return p ? 100 - Math.round(p[0] * 100) : null; },
  s:  () => { const p = ex78Pair(); return p ? Math.round(p[1] * 100) : null; },
  sc: () => { const p = ex78Pair(); return p ? 100 - Math.round(p[1] * 100) : null; },
  eq: () => {
    const p = ex78Pair();
    if (!p) return null;
    const both = p[0] * p[1];
    return ` = ${fmt(both / (both + (1 - p[0]) * (1 - p[1])), 4)}`;
  },
  chanceEq: () => {
    const p = ex78Pair();
    if (!p) return null;
    return ` = ${fmt((p[0] / (1 - p[0])) * (p[1] / (1 - p[1])), 1)}`;
  }
};
const ex78Engaged = () => !!ex78Pair();
registerLive("example-ex7", EX78_LIVE, { engaged: ex78Engaged, also: ["example-ex8"] });
registerLive("example-ex8", EX78_LIVE, { engaged: ex78Engaged, also: ["example-ex7"] });

/* ==========================================================================
   EXAMPLE 8 — Chance: the same combination on two scales

   Neither equation is reproduced here. Peirce's chance equation is printed
   just below this panel, and the probability version is printed just above it;
   both of those vary with these sliders, so the demonstration is the pair of
   controls and the reading of the answer, not a copy of the algebra. The two
   number lines then show the point: one combination, a probability on one
   scale and a chance on the other, and the chance line having to rescale
   itself as the probability climbs.
   ========================================================================*/
registerExample("example-ex8", (box) => {
  box.appendChild(exHeader("Interactive Example: The Same Combination, as a Probability and as a Chance", "ex8-content"));
  const content = h(`<div id="ex8-content" class="example-content">
    <div class="ex-buttonbar" id="ex8-presets">
      <button class="btn btn-sm" data-act="peirce">Peirce&rsquo;s 81 and 93</button>
      <button class="btn btn-sm" data-p1="0.5" data-p2="0.5">both even chances</button>
      <button class="btn btn-sm" data-p1="0.6" data-p2="0.6">both 3 to 2</button>
      <button class="btn btn-sm" data-p1="0.98" data-p2="0.98">both very strong</button>
    </div>

    <div class="conv-grid">
      <div></div>
      <div class="conv-head">probability &mdash; <span class="math">P(A&rarr;C)</span></div>
      <div class="conv-head">chance &mdash; <span class="math">Ch(A&rarr;C)</span></div>

      <div class="conv-lbl"><span class="math">A</span><sub>1</sub> &rarr; <span class="math">C</span></div>
      <div class="conv-cell" id="ex8-slider-1"></div>
      <div class="conv-cell conv-val k1" id="ex8-ch-1"></div>

      <div class="conv-lbl"><span class="math">A</span><sub>2</sub> &rarr; <span class="math">C</span></div>
      <div class="conv-cell" id="ex8-slider-2"></div>
      <div class="conv-cell conv-val k2" id="ex8-ch-2"></div>
    </div>

    <div class="nl-grid">
      <div class="nl-label">both, when they agree<br>
        <span class="nl-sub">as a probability</span></div>
      <div class="nl-track k3"><div class="nl-line" id="ex8-line-p"></div></div>
      <div class="nl-value k3" id="ex8-val-p"></div>

      <div class="nl-label">the same<br>
        <span class="nl-sub">as a chance</span></div>
      <div class="nl-track k3"><div class="nl-line" id="ex8-line-c"></div></div>
      <div class="nl-value k3" id="ex8-val-c"></div>
    </div>

    <div class="note-block">Peirce&rsquo;s <em>chance</em> is what we now call the <strong>odds</strong>.
      A chance of 81/19 is odds of 81 to 19 on; an even chance, 1/1, is evens.</div>
  </div>`);
  box.appendChild(content);

  $("#ex8-slider-1", content).appendChild(
    slider("ex8_p1", "", 0.02, 0.98, 0.81, 0.01, (v) => fmt(v, 2), "k1"));
  $("#ex8-slider-2", content).appendChild(
    slider("ex8_p2", "", 0.02, 0.98, 0.93, 0.01, (v) => fmt(v, 2), "k2"));

  ex678Adopt();
  content.addEventListener("input", () => update());
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act],[data-p1]");
    if (!b) return;
    if (b.getAttribute("data-act") === "peirce") { setSlider("ex8_p1", 0.81); setSlider("ex8_p2", 0.93); }
    else { setSlider("ex8_p1", +b.getAttribute("data-p1")); setSlider("ex8_p2", +b.getAttribute("data-p2")); }
    update();
  });

  function oddsText(p) {
    const f = decimalToFraction(p);
    const u = f.den - f.num;
    if (u > 0 && f.num > 0) {
      const g = (a, b) => (b ? g(b, a % b) : a);
      const d = g(f.num, u);
      return `${bigmark(f.num / d)} : ${bigmark(u / d)}`;
    }
    return `${fmt(p / (1 - p), 3)} : 1`;
  }

  const drawLine = (id, ticks) => nlDraw($(id, content), ticks, true);

  // probability is always 0 to 1, so its line is drawn once and never redrawn
  drawLine("#ex8-line-p", Array.from({ length: 11 }, (_, i) => ({
    pos: i / 10, major: i === 0 || i === 5 || i === 10,
    label: i === 0 ? "0" : i === 5 ? "&frac12;" : i === 10 ? "1" : null
  })));

  /* The chance has no ceiling, so its line has no fixed one either: the scale
     steps up through 1, 2, 5 and their decades to keep the marker on it. That
     rescaling is the thing to watch — it is Peirce's "any magnitude, however
     great" happening to the ruler. */
  let lastMax = null;
  function drawChanceLine(max) {
    if (max === lastMax) return;
    lastMax = max;
    const tickLab = (v) => (Number.isInteger(v) ? bigmark(v) : fmt(v, 1));
    const ticks = Array.from({ length: 11 }, (_, i) => {
      const v = i / 10 * max;
      const major = i === 0 || i === 5 || i === 10;
      return { pos: i / 10, major: major, label: major ? tickLab(v) : null, value: v };
    });
    /* Mark evens only while it is far enough from the origin to be legible —
       past a scale of about 1 : 16 it sits on top of the zero. Where it falls
       on a tick already labelled, relabel that one rather than doubling it. */
    if (1 / max >= 0.06) {
      const evens = '1<br><span class="nl-sub">evens</span>';
      const at = ticks.find((t) => Math.abs(t.value - 1) < 1e-9);
      if (at) at.label = evens;
      else ticks.push({ pos: 1 / max, major: true, label: evens });
    }
    drawLine("#ex8-line-c", ticks);
  }

  function update() {
    const p1 = num("ex8_p1"), p2 = num("ex8_p2");
    const c1 = p1 / (1 - p1), c2 = p2 / (1 - p2);
    const cBoth = c1 * c2;
    const pBoth = cBoth / (1 + cBoth);

    const ch = (p, c) => `<strong>${oddsText(p)}</strong> <span class="nl-sub">= ${fmt(c, 3)}</span>`;
    $("#ex8-ch-1", content).innerHTML = ch(p1, c1);
    $("#ex8-ch-2", content).innerHTML = ch(p2, c2);

    // fixed at 25 until the chance outgrows it, then by decades as before
    const cMax = niceMax(cBoth, 25);
    drawChanceLine(cMax);
    $("#ex8-line-p .nl-dot", content).style.left = `${pBoth * 100}%`;
    $("#ex8-line-c .nl-dot", content).style.left = `${Math.min(1, cBoth / cMax) * 100}%`;

    $("#ex8-val-p", content).innerHTML = `<strong>${fmt(pBoth, 4)}</strong>`;
    $("#ex8-val-c", content).innerHTML = `<strong>${fmt(cBoth, 3)} : 1</strong>`;
  }
  update();
});

/* ==========================================================================
   NEW EXAMPLE (26) — the logarithm of the chance, on three number lines
   "Now, there is one quantity which, more simply than any other, fulfills
    these conditions; it is the logarithm of the chance."
   ========================================================================*/
registerExample("example-ex26", (box) => {
  box.appendChild(exHeader("Interactive Example: The Logarithm of the Chance", "ex26-content"));
  const content = h(`<div id="ex26-content" class="example-content">
    <div class="nl-grid">
      <div class="nl-label">probability
        <span class="nl-sub">(<span class="math">p</span>/<span class="math">n</span>)</span></div>
      <div class="nl-track k1">
        <input type="range" id="ex26_p" min="0.001" max="0.999" step="0.001" value="0.5">
        <div class="nl-line nl-under" id="ex26-line-p"></div>
      </div>
      <div class="nl-value k1" id="ex26-val-p"></div>

      <div class="nl-label">chance
        <span class="nl-sub">(<span class="math">p</span>/(<span class="math">n</span>&minus;<span class="math">p</span>))</span></div>
      <div class="nl-track k2"><div class="nl-line" id="ex26-line-c"></div></div>
      <div class="nl-value k2" id="ex26-val-c"></div>

      <div class="nl-label">log(chance)</div>
      <div class="nl-track k3"><div class="nl-line" id="ex26-line-l"></div></div>
      <div class="nl-value k3" id="ex26-val-l"></div>
    </div>
    <div class="ex-buttonbar">
      <button class="btn btn-sm" data-p="0.5">even chance</button>
      <button class="btn btn-sm" data-p="0.667">2 to 1</button>
      <button class="btn btn-sm" data-p="0.9">9 to 1</button>
      <button class="btn btn-sm" data-p="0.99">99 to 1</button>
      <button class="btn btn-sm" data-p="0.999">999 to 1</button>
      <button class="btn btn-sm" data-p="0.1">1 to 9 against</button>
    </div>
  </div>`);
  box.appendChild(content);

  content.addEventListener("input", () => update());
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-p]");
    if (b) { setSlider("ex26_p", +b.getAttribute("data-p")); update(); }
  });

  /* ------------------------------------------------------------------------
     Three lines of the same length carrying the same quantity on three
     scales. Probability is linear and ends at 1; chance is linear too and does
     not end at all, so certainty runs off the right; the logarithm puts an
     even chance at the middle, sends certainty off to infinity in one
     direction and impossibility in the other, and makes equal steps equal
     multiplications — which is what lets beliefs add where chances multiply.
     The three tracks are one grid, so the lines are the same length by
     construction, and each marker sits under the slider's own thumb travel.
     ----------------------------------------------------------------------*/
  const CMAX = 100;   // the chance line runs to 100 : 1, then off the end
  const LMAX = 3;     // the log line runs from a chance of 1/1000 to 1000

  const drawLine = (id, ticks, rule) => nlDraw($(id, content), ticks, rule);

  drawLine("#ex26-line-p", Array.from({ length: 11 }, (_, i) => ({
    pos: i / 10, major: i === 0 || i === 5 || i === 10,
    label: i === 0 ? "0" : i === 5 ? "&frac12;" : i === 10 ? "1" : null
  })), false);

  /* Ten divisions rather than one per unit: at this scale a tick per unit
     would be a smear. Evens is not marked here — at 1 in 100 it sits on the
     origin — but it is marked at the centre of the log line below, which is
     rather the point of that line. */
  drawLine("#ex26-line-c", Array.from({ length: 11 }, (_, i) => {
    const major = i === 0 || i === 5 || i === 10;
    return { pos: i / 10, major: major, label: major ? bigmark(i * (CMAX / 10)) : null };
  }), true);
  $("#ex26-line-c", content).appendChild(h('<div class="nl-arrow">&rarr;</div>'));

  const logTicks = [];
  for (let v = -LMAX; v <= LMAX + 1e-9; v += 0.5) {
    const major = Math.abs(v - Math.round(v)) < 1e-9;
    logTicks.push({
      pos: (v + LMAX) / (2 * LMAX), major: major,
      label: major ? (Math.round(v) === 0 ? "0<br><span class=\"nl-sub\">evens</span>" : String(Math.round(v))) : null
    });
  }
  drawLine("#ex26-line-l", logTicks, true);

  function oddsText(p) {
    const f = decimalToFraction(p);
    const u = f.den - f.num;
    if (u > 0 && f.num > 0) {
      const g = (a, b) => (b ? g(b, a % b) : a);
      const d = g(f.num, u);
      return `${bigmark(f.num / d)} : ${bigmark(u / d)}`;
    }
    return `${fmt(p / (1 - p), 3)} : 1`;
  }

  /* --------------------------------------------------------------------------
     Peirce walks the whole scale in the paragraph above — very great chance,
     absolute certainty, the diminishing, the even chance where belief vanishes,
     the contrary belief springing up, and its tending to infinity as the chance
     almost vanishes. Each of those clauses owns a stretch of the slider, so
     dragging it lights up the sentence that describes where you are. The bands
     are declared in the markup, not here, so the prose and its range stay
     together and neither can drift from the other.
     ------------------------------------------------------------------------*/
  const bands = $$('[data-band-for="example-ex26"]');
  function lightBand(p) {
    bands.forEach((el) => {
      const [lo, hi] = el.getAttribute("data-band").split(",").map(Number);
      el.classList.toggle("band-on", p !== null && p >= lo && p < hi);
    });
  }

  /* Shutting the example puts the paragraph back to plain text. Registering
     with no bindings borrows the open/shut and on-input plumbing for that. */
  registerLive("example-ex26", {}, {
    onRefresh: (on) => lightBand(on ? num("ex26_p") : null)
  });

  function update() {
    const p = num("ex26_p");
    const chance = p / (1 - p);
    const L = Math.log10(chance);

    const place = (id, frac01, off) => {
      const dot = $(id + " .nl-dot", content);
      if (!dot) return;
      dot.style.left = `${Math.max(0, Math.min(1, frac01)) * 100}%`;
      dot.classList.toggle("off", !!off);
    };
    place("#ex26-line-c", chance / CMAX, chance > CMAX);
    place("#ex26-line-l", (L + LMAX) / (2 * LMAX), Math.abs(L) > LMAX);

    $("#ex26-val-p", content).innerHTML = `<strong>${fmt(p, 3)}</strong>`;
    $("#ex26-val-c", content).innerHTML = `<strong>${oddsText(p)}</strong>
      <span class="nl-sub">= ${fmt(chance, 3)}${chance > CMAX ? " &mdash; off the line" : ""}</span>`;
    $("#ex26-val-l", content).innerHTML = `<strong>${fmt(L, 3)}</strong>`;
    lightBand(p);

  }
  update();
});

</script>
