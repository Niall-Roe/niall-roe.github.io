<script>
/* ==========================================================================
   EXAMPLE 23 — Insisting on the shuffle

   Assume Nature a chance combination of independent elements and you have
   stipulated that the record carries nothing about what comes next. The deck
   is dealt as a chain: each card repeats the last with probability
   0.5 + 0.5r. At r = 0 the deck is perfectly shuffled and the continuation
   rate sits at a half however long the run — there is by construction no
   order to find. Above zero there is real order, and the same tallies pick
   it up. Induction needs the second deck; indifference stipulates the first.
   ========================================================================*/
registerExample("example-ex23", (box) => {
  box.appendChild(exHeader("Interactive Example: Insisting on the Shuffle", "ex23-content"));
  const content = h(`<div id="ex23-content" class="example-content">
    <p>Deal a deck of red and black cards, half of each in the long run either way. The question is
      whether a run of reds tells you anything about the card that follows it.</p>
    <div class="row">
      <div class="col col-4">
        <div id="ex23-controls"></div>
        <button class="btn btn-sm" data-act="shuffled">Perfectly shuffled</button>
        <button class="btn btn-sm" data-act="ordered">Strongly ordered</button>
        <hr>
        <button class="btn btn-primary btn-block" data-act="d100">Deal a hundred</button>
        <button class="btn btn-primary btn-block" data-act="d10000">Deal ten thousand</button>
        <button class="btn btn-warning btn-block btn-sm" data-act="reset">Reset</button>
        <div id="ex23-readout" style="margin-top:12px;"></div>
      </div>
      <div class="col col-8">
        <div id="ex23-strip"></div>
        <div class="plot-container" id="ex23-plot"></div>
      </div>
    </div>
    <div id="ex23-verdict"></div>
  </div>`);
  box.appendChild(content);

  const MAXRUN = 6;
  let cont = new Array(MAXRUN + 1).fill(0);   // runs of length L that continued
  let seen = new Array(MAXRUN + 1).fill(0);   // runs of length L observed at all
  let recent = [], last = null, run = 0, dealt = 0;

  $("#ex23-controls", content).appendChild(
    slider("ex23_r", "Order in the deck:", 0, 1, 0, 0.01,
      (v) => (v < 0.005 ? "0 — perfectly shuffled" : v.toFixed(2))));

  function reset() {
    cont = new Array(MAXRUN + 1).fill(0);
    seen = new Array(MAXRUN + 1).fill(0);
    recent = []; last = null; run = 0; dealt = 0;
  }

  function deal(k) {
    const stay = 0.5 + 0.5 * num("ex23_r");
    for (let i = 0; i < k; i++) {
      let card;
      if (last === null) card = Math.random() < 0.5;
      else card = (Math.random() < stay) ? last : !last;
      // tally against the run standing before this card was turned
      if (run >= 1) {
        const L = Math.min(run, MAXRUN);
        seen[L]++;
        if (card === last) cont[L]++;
      }
      run = (card === last) ? run + 1 : 1;
      last = card;
      dealt++;
      recent.push(card);
      if (recent.length > 120) recent.shift();
    }
  }

  const canvas = mkCanvas(300, (pl) => {
    const stay = 0.5 + 0.5 * num("ex23_r");
    pl.setup({ xlim: [0.4, MAXRUN + 0.6], ylim: [0, 1], mar: [4, 5, 3, 1.5] });
    pl.axes({ xat: Array.from({ length: MAXRUN }, (_, i) => i + 1) });
    pl.box();
    pl.axisLabels("Length of the run so far", "How often the run continued");
    pl.title("Does the record say what comes next?", { cex: 1.0 });
    pl.clip(true);
    for (let L = 1; L <= MAXRUN; L++) {
      if (!seen[L]) continue;
      const v = cont[L] / seen[L];
      pl.rect(L - 0.34, 0, L + 0.34, v, { col: "rgba(44,127,184,0.65)", border: "#24587d" });
    }
    pl.abline({ h: 0.5, col: "#b0563f", lwd: 2, lty: 2 });
    if (stay > 0.505) pl.abline({ h: stay, col: "#4a7c59", lwd: 2 });
    pl.clip(false);
    pl.text(MAXRUN + 0.1, 0.53, "a half", { col: "#b0563f", cex: 0.72, adj: 1 });
    pl.legend("bottomright", {
      legend: stay > 0.505 ? ["Observed", "A half", "The deck's real rate"] : ["Observed", "A half"],
      fill: stay > 0.505 ? ["rgba(44,127,184,0.65)", "#b0563f", "#4a7c59"]
        : ["rgba(44,127,184,0.65)", "#b0563f"],
      cex: 0.7
    });
  });
  $("#ex23-plot", content).appendChild(canvas);

  function update() {
    const r = num("ex23_r"), stay = 0.5 + 0.5 * r;

    $("#ex23-strip", content).innerHTML = recent.length
      ? `<p style="font-size:0.85em;margin-bottom:4px;color:#575d66;">The last ${recent.length} cards:</p>
         <div style="line-height:1;">${recent.map((c) =>
           `<span style="display:inline-block;width:12px;height:16px;margin:1px;border-radius:2px;
             border:1px solid #a8adb4;background:${c ? "#b0563f" : "#2c3138"};"></span>`).join("")}</div>`
      : "";

    const overall = seen.reduce((s, v) => s + v, 0);
    const contAll = cont.reduce((s, v) => s + v, 0);
    $("#ex23-readout", content).innerHTML = dealt
      ? `<div class="key-insight" style="margin-top:0;">
           <p style="margin-bottom:6px;"><strong>${bigmark(dealt)}</strong> cards dealt.</p>
           <p style="margin-bottom:0;">A run continued <strong>${overall ? fmt(contAll / overall, 4) : "&mdash;"}</strong>
             of the time. The deck's rate is ${fmt(stay, 3)}.</p></div>`
      : `<p class="help-text">Nothing dealt yet.</p>`;

    $("#ex23-verdict", content).innerHTML = r < 0.02
      ? `<div class="note-block">
           <p>The bars sit on the half whatever the run. Twenty reds in a row leave the next card
           exactly as it was before: an even chance. That is not a discovery about this deck, it is
           what was stipulated when the deck was called shuffled &mdash; independent elements, no
           order anywhere in it.</p>
           <p>So the assumption cannot be held and reasoned from at once. To take a run as a sign of
           order in the deck is to look for what one has already declared is not there. Assume Nature
           a chance combination of independent elements and every record becomes as mute as this one,
           which is to suppose all human cognition illusory and no real knowledge possible.</p></div>`
      : `<div class="note-block">
           <p>Now the bars stand clear of the half, at about ${fmt(stay, 2)}, and they got there by
           counting. The order is a fact about the deck, and dealing from it finds that fact: a run of
           reds really does make another red more likely, and how much more is measurable.</p>
           <p>This is the deck induction requires. Nothing was assumed about what the cards must do;
           the rate was read off the record. Slide the order back to nothing and watch the bars fall
           onto the half &mdash; that is the difference between a world that can be learned about and
           one that has been declared unlearnable.</p></div>`;

    drawCanvas(canvas);
  }

  content.addEventListener("input", () => { reset(); update(); });
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "d100") deal(100);
    else if (a === "d10000") deal(10000);
    else if (a === "reset") reset();
    else if (a === "shuffled") { setSlider("ex23_r", 0); reset(); }
    else if (a === "ordered") { setSlider("ex23_r", 0.7); reset(); }
    else return;
    update();
  });
  update();
});
</script>
