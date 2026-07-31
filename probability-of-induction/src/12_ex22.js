<script>
/* ==========================================================================
   EXAMPLE 22 — Which bag did this coin come from?

   Enumerate the possibilities so as to make them equally probable, and the
   calculation that follows is a perfectly good one — about the DRAW. Flipping
   the coin tells us which bag it is likely to have come from. It tells us
   nothing further about the coin, whose bias never changes throughout.

   That is legitimate where there really is a population and a draw from it.
   Switch to universes and the same arithmetic runs unchanged, but there is no
   granary of universes and nobody drew this one, so the number it produces is
   a frequency of nothing.
   ========================================================================*/
registerExample("example-ex22", (box) => {
  box.appendChild(exHeader("Interactive Example: Which Bag Did This Coin Come From?", "ex22-content"));
  const content = h(`<div id="ex22-content" class="example-content">
    <div class="mode-tabs" id="ex22-modes">
      <button class="mode-tab active" data-mode="coins">A coin from a bag</button>
      <button class="mode-tab" data-mode="worlds">A law of this world</button>
    </div>
    <div id="ex22-setup"></div>
    <div class="row">
      <div class="col col-4">
        <div id="ex22-buttons"></div>
        <hr>
        <div id="ex22-readout"></div>
      </div>
      <div class="col col-8"><div class="plot-container" id="ex22-plot"></div></div>
    </div>
    <div id="ex22-verdict"></div>
  </div>`);
  box.appendChild(content);

  const N = 100;                       // bags 0..100, the nth holding p = n/100
  let mode = "coins", trueBag = 0, k = 0, m = 0, revealed = false;

  const L = () => (mode === "coins" ? {
    population: "bags", item: "coin", verb: "flip",
    count: (k, m) => `<strong>${bigmark(k)}</strong> heads in <strong>${bigmark(m)}</strong> flips`,
    axis: "Bag, by the proportion of heads its coins give",
    title: "Which bag the coin was drawn from"
  } : {
    population: "universes", item: "world", verb: "watch",
    count: (k, m) => `the tide rose on <strong>${bigmark(k)}</strong> of <strong>${bigmark(m)}</strong> days`,
    axis: "Universe, by the proportion of days its tide rises",
    title: "Which universe we were drawn into"
  });

  function newDraw() {
    trueBag = sampleInt(N + 1);
    k = 0; m = 0; revealed = false;
  }
  newDraw();

  function observe(t) {
    const p = trueBag / N;
    for (let i = 0; i < t; i++) { if (Math.random() < p) k++; m++; }
  }

  /* posterior over the bags under a uniform prior — the indifference
     assumption, computed in logs so long runs do not underflow */
  function posterior() {
    const lg = [];
    for (let n = 0; n <= N; n++) {
      const p = n / N;
      let v;
      if (p === 0) v = (k === 0 ? 0 : -Infinity);
      else if (p === 1) v = (k === m ? 0 : -Infinity);
      else v = k * Math.log(p) + (m - k) * Math.log(1 - p);
      lg.push(v);
    }
    const mx = Math.max(...lg.filter(Number.isFinite));
    const w = lg.map((v) => (Number.isFinite(v) ? Math.exp(v - mx) : 0));
    const tot = w.reduce((s, v) => s + v, 0) || 1;
    return w.map((v) => v / tot);
  }

  const canvas = mkCanvas(320, (pl) => {
    const post = posterior();
    const lab = L();
    const yMax = Math.max(...post) * 1.25 || 1;
    pl.setup({ xlim: [0, 1], ylim: [0, yMax], mar: [4, 5, 3, 1.5] });
    pl.axes({ nx: 5, yat: [] });
    pl.box();
    pl.axisLabels(lab.axis, "Probability it was this one");
    pl.title(lab.title, { cex: 1.0 });
    pl.clip(true);
    const xs = post.map((_, n) => n / N);
    pl.polygon(xs.concat(xs.slice().reverse()),
      post.concat(post.map(() => 0)), { col: "rgba(44,127,184,0.35)" });
    pl.lines(xs, post, { col: "#2f6f9f", lwd: 2.5 });
    if (revealed) pl.abline({ v: trueBag / N, col: "#4a7c59", lwd: 2.5 });
    pl.clip(false);
    if (revealed) {
      pl.text(trueBag / N, yMax * 0.95, `the one drawn: ${fmt(trueBag / N, 2)}`,
        { col: "#4a7c59", font: 2, cex: 0.75 });
    }
  });
  $("#ex22-plot", content).appendChild(canvas);

  function render() {
    const lab = L();

    $("#ex22-setup", content).innerHTML = mode === "coins"
      ? `<p>A hundred and one bags. The nth holds coins that come up heads n times in a hundred. One
         coin has been drawn from a bag chosen at random, and the bag not recorded. Flip the coin.</p>`
      : `<p>The same calculation, with universes for bags. The nth universe is one in which the tide
         rises n days in a hundred. We are supposed to have been drawn into one of them at random, and
         which one is not recorded. Watch the tide.</p>`;

    $("#ex22-buttons", content).innerHTML = `
      <button class="btn btn-primary btn-block" data-act="o1">${lab.verb === "flip" ? "Flip once" : "Watch one day"}</button>
      <button class="btn btn-primary btn-block" data-act="o10">${lab.verb === "flip" ? "Flip ten times" : "Watch ten days"}</button>
      <button class="btn btn-primary btn-block" data-act="o100">${lab.verb === "flip" ? "Flip a hundred times" : "Watch a hundred days"}</button>
      <button class="btn btn-warning btn-block btn-sm" data-act="new">Draw a new ${lab.item}</button>
      <button class="btn btn-block btn-sm" data-act="reveal">Reveal which one</button>`;

    const post = posterior();
    let best = 0;
    post.forEach((v, i) => { if (v > post[best]) best = i; });
    const mean = post.reduce((s, v, i) => s + v * (i / N), 0);

    $("#ex22-readout", content).innerHTML = m
      ? `<div class="key-insight" style="margin-top:0;">
           <p style="margin-bottom:6px;">${lab.count(k, m)}.</p>
           <p style="margin-bottom:6px;">Most likely ${mode === "coins" ? "bag" : "universe"}:
             <strong>${fmt(best / N, 2)}</strong></p>
           <p style="margin-bottom:0;">Average over the ${lab.population}: <strong>${fmt(mean, 3)}</strong></p></div>`
      : `<p class="help-text">Nothing observed yet, so every one of the ${lab.population} stands equal.</p>`;

    $("#ex22-verdict", content).innerHTML = mode === "coins"
      ? `<div class="note-block">
           <p>The curve is a fact about <strong>the draw</strong>. There really are bags, one really was
           chosen, and the flips narrow down which. Nothing here is objectionable.</p>
           <p>But notice what it is not. The coin's bias never changed: it was fixed the moment it was
           drawn, and no amount of flipping alters it. What the calculation reports is the frequency
           with which coins like this one come out of each bag &mdash; a fact about the manner of
           selection, not about the coin on the table.</p></div>`
      : `<div class="note-block">
           <p>The arithmetic is unchanged, and that is the trouble. To read this curve as a
           probability, there would have to be universes to draw from and a draw that was made. There
           are not, and there was none. We have no statistics of possible worlds.</p>
           <p>&ldquo;The relative probability of this or that arrangement of Nature is something which
           we should have a right to talk about if universes were as plenty as blackberries, if we
           could put a quantity of them in a bag, shake them well up, draw out a sample, and examine
           them.&rdquo; They are not, and we cannot. So the number the calculation returns is a
           frequency of nothing, and a law of nature has no probability in this sense at all.</p>
           <p>Probabilities attach to procedures &mdash; to ways of drawing, of sampling, of inferring.
           This world was not drawn, so there is no procedure here for a probability to be about.</p></div>`;

    drawCanvas(canvas);
  }

  $("#ex22-modes", content).addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-mode]");
    if (!b) return;
    mode = b.getAttribute("data-mode");
    $("#ex22-modes", content).querySelectorAll(".mode-tab")
      .forEach((x) => x.classList.toggle("active", x === b));
    render();
  });
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "o1") observe(1);
    else if (a === "o10") observe(10);
    else if (a === "o100") observe(100);
    else if (a === "new") newDraw();
    else if (a === "reveal") revealed = true;
    else return;
    render();
  });
  render();
});
</script>
