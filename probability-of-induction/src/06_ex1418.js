<script>
/* ==========================================================================
   EXAMPLE 14 — Binomial expansion (w + b)^n
   ========================================================================*/
const totalOutcomes = (w, b, n) => Math.pow(w + b, n);
const calcFrequency = (n, k, w, b) => choose(n, k) * Math.pow(w, k) * Math.pow(b, n - k);


/* --------------------------------------------------------------------------
   Peirce's table, in the body of the article, in two views.

   One white ball to r black in the granary, n balls drawn. A sequence with
   kb blacks occurs in r^kb of the urns, which is why the groups run
   1, 2, 4, 8, 16 when r = 2 and 1, 10, 100, 1000, 10000 when r = 10 — the
   two cases the paragraph after the table names.

   Both views are ordered by number of b's, so group i of the listing is bar i
   of the chart. The listing writes out the "sets just alike"; the binomial
   view is the same counts as terms of (w + b)^n. One pair of sliders drives
   both, so switching view never moves the figures.
   ------------------------------------------------------------------------*/
(function granaryTable() {
  const host = document.getElementById("peirce-table-block");
  if (!host) return;
  const CAP = 16;                     // Peirce's own table tops out at 16 alike

  const ctl = document.getElementById("peirce-table-controls");
  const sliderRow = h(`<div class="gt-sliders"></div>`);
  sliderRow.appendChild(slider("gt_ratio", "White to black in the granary:", 1, 10, 2, 1, (v) => `1 : ${v}`, "k1"));
  sliderRow.appendChild(slider("gt_n", "Balls drawn:", 2, 8, 4, 1, null, "k2"));
  ctl.appendChild(sliderRow);

  /* ------------------------------------------------------------------------
     This table is always on the page, so there is no opening and shutting to
     mark when its figures are Peirce's and when they are the reader's. The
     rule instead is the sliders themselves: at 1:2 and four balls they stand
     where he left them and the two paragraphs below read exactly as printed;
     move either and those paragraphs follow, with a way back offered.
     ----------------------------------------------------------------------*/
  const GT_R0 = 2, GT_N0 = 4;
  const gtR = () => Math.round(num("gt_ratio"));
  const gtN = () => Math.round(num("gt_n"));

  const ORDINALS = ["", "first", "second", "third", "fourth", "fifth", "sixth",
    "seventh", "eighth", "ninth", "tenth"];
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const asFrac = (n, d) => { const g = gcd(n, d) || 1; return `${n / g}&frasl;${d / g}`; };
  const listOut = (xs) => (xs.length < 2 ? xs.join("")
    : `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`);

  // sequences with exactly k whites out of n, weighted by the r blacks each
  const gtCount = (k, r, n) => choose(n, k) * Math.pow(r, n - k);
  function gtTopTwo() {
    const r = gtR(), n = gtN();
    return Array.from({ length: n + 1 }, (_, k) => ({ k: k, c: gtCount(k, r, n) }))
      .sort((a, b) => b.c - a.c)
      .slice(0, 2);
  }

  const restore = h(`<button class="restore-peirce">Reset to Peirce&rsquo;s figures</button>`);
  restore.addEventListener("click", () => {
    setSlider("gt_ratio", GT_R0);
    setSlider("gt_n", GT_N0);
  });


  registerLive("peirce-table-block", {
    oneIn: () => `one in ${spellNumber(1 + gtR())}`,
    white: () => fracWord(1, 1 + gtR()),
    black: () => fracWord(gtR(), 1 + gtR()),
    second: () => spellNumber(gtR()),
    /* Peirce writes "in the third there are 4, in the fourth 8, and in the
       fifth 16" — the verb elided after the first. Keep the elision. */
    groups: () => listOut(Array.from({ length: Math.max(0, gtN() - 1) }, (_, i) => {
      const g = i + 3;                                   // groups three upwards
      const ord = ORDINALS[g] || `${g}th`;
      return `in the ${ord}${i === 0 ? " there are" : ""} ${bigmark(Math.pow(gtR(), g - 1))}`;
    })),
    step:  () => (gtR() === 2 ? "doubling" : `multiplying by ${spellNumber(gtR())}`),
    times: () => (gtR() === 2 ? "twice" : `${spellNumber(gtR())} times`),
    /* No thousands separators in these two: they are comma-separated lists,
       and Peirce prints them bare ("1, 10, 100, 1000, 10000"). */
    series:   () => Array.from({ length: gtN() + 1 }, (_, i) => Math.pow(gtR(), i)).join(", "),
    series10: () => Array.from({ length: gtN() + 1 }, (_, i) => Math.pow(10, i)).join(", "),
    whole: () => spellNumber(1 + gtR()),
    drawn: () => spellNumber(gtN()),
    denom: () => bigmark(Math.pow(1 + gtR(), gtN())),
    top1n: () => bigmark(gtTopTwo()[0].c),
    top2n: () => bigmark(gtTopTwo()[1].c),
    top1p: () => asFrac(gtTopTwo()[0].k, gtN()),
    top2p: () => asFrac(gtTopTwo()[1].k, gtN()),
    truth: () => asFrac(1, 1 + gtR())
  }, {
    engaged: () => gtR() !== GT_R0 || gtN() !== GT_N0,
    onRefresh: (on) => restore.classList.toggle("on", on)
  });

  let view = "sets", clicked = null;
  const toggle = h(`<div class="mode-tabs">
    <button class="mode-tab active" data-view="sets">List of sets</button>
    <button class="mode-tab" data-view="binomial">The binomial expansion</button>
  </div>`);
  toggle.appendChild(restore);          // beside the view tabs, not above them
  ctl.appendChild(toggle);

  /* The binomial view owns a canvas, so it lives in its own container and is
     hidden rather than rebuilt — innerHTML would throw the canvas away. */
  const out = document.getElementById("peirce-table-out");
  const binom = h(`<div id="peirce-binomial" style="display:none;">
    <p class="gt-expansion" id="gt-expansion"></p>
    <div class="plot-container" id="gt-plot"></div>
    <div id="gt-click"></div>
    <div class="table-scroll" id="gt-freq"></div>
  </div>`);
  out.parentNode.appendChild(binom);
  const totalEl = h(`<p class="gt-total" id="gt-total"></p>`);
  out.parentNode.appendChild(totalEl);

  toggle.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-view]");
    if (!btn) return;
    view = btn.getAttribute("data-view");
    toggle.querySelectorAll(".mode-tab").forEach((x) => x.classList.toggle("active", x === btn));
    render();
  });
  host.addEventListener("input", () => { clicked = null; render(); });

  // every sequence of n letters with exactly kb b's, w before b, as Peirce lists them
  function arrangements(n, kb) {
    const acc = [];
    (function rec(prefix, blacksLeft, slotsLeft) {
      if (slotsLeft === 0) { acc.push(prefix); return; }
      if (slotsLeft > blacksLeft) rec(prefix + "w", blacksLeft, slotsLeft - 1);
      if (blacksLeft > 0) rec(prefix + "b", blacksLeft - 1, slotsLeft - 1);
    })("", kb, n);
    return acc;
  }

  function makeGroups(r, n) {
    const groups = [];
    for (let kb = 0; kb <= n; kb++) {
      const count = choose(n, kb);
      const weight = Math.pow(r, kb);          // sets alike in this group
      groups.push({ kb, count, weight, groupTotal: count * weight });
    }
    return groups;
  }

  const canvas = mkCanvas(360, (pl) => {
    const r = num("gt_ratio"), n = num("gt_n");
    const groups = makeGroups(r, n);
    const freqs = groups.map((g) => g.groupTotal);
    const maxF = Math.max(...freqs);
    pl.setup({ xlim: [-0.7, n + 0.7], ylim: [0, maxF * 1.18], mar: [4, 5.5, 3, 2] });
    /* No frame and no grid. Both are drawn in a warm grey, and together they
       read as a panel laid over the page rather than as a figure printed on
       it — which is the one thing this table is not supposed to look like. */
    pl.axes({ xat: groups.map((g) => g.kb), xlabels: groups.map((g) => String(g.kb)) });
    pl.axisLabels("Number of black balls drawn", "Sets");
    pl.title("Each group of the table, as a term of the expansion", { cex: 1.0 });
    pl.clip(true);
    groups.forEach((g) => {
      pl.rect(g.kb - 0.4, 0, g.kb + 0.4, g.groupTotal,
        { col: clicked === g.kb ? "purple" : "#2f6f9f", border: "white" });
    });
    pl.clip(false);
  }, {
    onclick: (x) => {
      const n = num("gt_n"), k = Math.round(x);
      if (k >= 0 && k <= n) { clicked = (clicked === k ? null : k); render(); }
    }
  });
  $("#gt-plot", binom).appendChild(canvas);

  /* Every sequence written out, each repeated as often as it occurs — set as
     Peirce sets it, plain, in the text face, with nothing over the groups. He
     names what the groups contain in the paragraph after the table, so a
     caption here would be saying it twice and the table would stop looking
     like a table in a book. */
  function setsView(groups, n) {
    return groups.map((g) => {
      const arr = arrangements(n, g.kb);
      let cells = "";
      arr.forEach((s) => {
        if (g.weight <= CAP) {
          for (let i = 0; i < g.weight; i++) cells += `<span class="sequence-box">${s}</span>`;
        } else {
          cells += `<span class="sequence-box">${s}</span><span class="gt-mult">&times;${bigmark(g.weight)}</span>`;
        }
      });
      return `<div class="gt-group"><div class="gt-cells">${cells}</div></div>`;
    }).join("");
  }

  function renderBinomial(groups, r, n, total) {
    $("#gt-expansion", binom).innerHTML =
      `(w + b)<sup>${n}</sup>, with w = 1 and b = ${r}`;

    const rows = groups.map((g) => {
      const style = clicked === g.kb ? ' style="background-color: rgba(128,0,128,0.12);"' : "";
      return `<tr${style}><td>${n - g.kb}</td><td>${g.kb}</td>
        <td>${bigmark(g.count)}</td><td>${bigmark(g.weight)}</td>
        <td><strong>${bigmark(g.groupTotal)}</strong></td>
        <td>${fmt(g.groupTotal / total, 4)}</td>
        <td class="gt-term">${bigmark(g.count)} &middot; 1<sup>${n - g.kb}</sup> &middot;
          ${r}<sup>${g.kb}</sup></td></tr>`;
    }).join("");
    $("#gt-freq", binom).innerHTML = `<table class="tbl">
      <thead><tr><th>w</th><th>b</th><th>Arrangements<br>C(${n}, b)</th>
        <th>Sets alike<br>${r}<sup>b</sup></th><th>Sets in all</th><th>Probability</th>
        <th>Term</th></tr></thead><tbody>${rows}</tbody></table>`;

    if (clicked === null) {
      $("#gt-click", binom).innerHTML =
        `<div class="click-info"><p><em>Click a bar for the working behind that term.</em></p></div>`;
    } else {
      const g = groups[clicked];
      $("#gt-click", binom).innerHTML = `<div class="click-info">
        <p><strong>${g.kb} black, ${n - g.kb} white.</strong></p>
        <p>Ways to arrange them: C(${n}, ${g.kb}) = <strong>${bigmark(g.count)}</strong>.</p>
        <p>Each occurs in 1<sup>${n - g.kb}</sup> &middot; ${r}<sup>${g.kb}</sup> =
          <strong>${bigmark(g.weight)}</strong> of the urns.</p>
        <p>So this group holds ${bigmark(g.count)} &times; ${bigmark(g.weight)} =
          <strong>${bigmark(g.groupTotal)}</strong> sets, a probability of
          ${bigmark(g.groupTotal)} / ${bigmark(total)} =
          <strong>${fmt(g.groupTotal / total, 4)}</strong>.</p>
        <p>Judging the urn by these ${n} balls puts the proportion of white at
          <strong>${fmt((n - g.kb) / n, 3)}</strong>.</p></div>`;
    }
    drawCanvas(canvas);
  }

  function render() {
    const r = num("gt_ratio"), n = num("gt_n");
    if (clicked !== null && clicked > n) clicked = null;
    const groups = makeGroups(r, n);
    const total = groups.reduce((s, g) => s + g.groupTotal, 0);

    const sets = view === "sets";
    out.style.display = sets ? "" : "none";
    binom.style.display = sets ? "none" : "";
    if (sets) out.innerHTML = setsView(groups, n);
    else renderBinomial(groups, r, n, total);

    document.getElementById("gt-total").innerHTML =
      `Sets in each group: ${groups.map((g) => bigmark(g.weight)).join(", ")}.
       Total <strong>${bigmark(total)}</strong> = ${r + 1}<sup>${n}</sup>.`;
  }
  /* ------------------------------------------------------------------------
     The paragraph after the table is about the table, and is three screens
     from the controls once the listing is long. A second pair of sliders sits
     under it and takes over when the first pair has gone off the top; only one
     of the two is ever on screen. They are the same sliders in effect — the
     echo writes straight through to the originals.
     ----------------------------------------------------------------------*/
  const secondPara = $$("p").find((el) =>
    el.textContent.indexOf("In the second group, where there is one b") === 0);
  let echo = null, echoRow = null;

  if (secondPara) {
    echo = h(`<div class="gt-echo" id="gt-echo"></div>`);
    echoRow = h(`<div class="gt-sliders"></div>`);
    echoRow.appendChild(slider("gt_ratio_b", "White to black in the granary:", 1, 10, 2, 1, (v) => `1 : ${v}`, "k1"));
    echoRow.appendChild(slider("gt_n_b", "Balls drawn:", 2, 8, 4, 1, null, "k2"));
    echo.appendChild(echoRow);
    secondPara.insertAdjacentElement("afterend", echo);

    /* Driving from down here changes the height of the listing above, which
       would otherwise slide the paragraph out from under the reader. Hold it
       still by scrolling back by however far it moved. */
    echo.addEventListener("input", (ev) => {
      const before = secondPara.getBoundingClientRect().top;
      if (ev.target.id === "gt_ratio_b") setSlider("gt_ratio", +ev.target.value);
      else if (ev.target.id === "gt_n_b") setSlider("gt_n", +ev.target.value);
      const after = secondPara.getBoundingClientRect().top;
      /* Instant, not smooth: the page has scroll-behavior: smooth, and an
         animated correction would let the paragraph visibly lurch away and
         glide back on every step of the drag. */
      if (after !== before) window.scrollBy({ top: after - before, behavior: "instant" });
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === ctl) ctlSeen = e.isIntersecting;
        if (e.target === secondPara) paraSeen = e.isIntersecting;
      });
      updateEcho();
    });
    obs.observe(ctl);
    obs.observe(secondPara);
  }

  /* Only one of the two pairs is ever on screen: the second takes over as the
     first leaves the top, and stands down again when it comes back. */
  let ctlSeen = true, paraSeen = false;
  function updateEcho() {
    if (echo) echo.classList.toggle("on", paraSeen && !ctlSeen);
  }

  function syncEcho() {
    if (!echo) return;
    [["gt_ratio_b", "gt_ratio"], ["gt_n_b", "gt_n"]].forEach(([b, a]) => {
      const eb = document.getElementById(b), ea = document.getElementById(a);
      if (!eb || !ea || eb.value === ea.value) return;
      eb.value = ea.value;
      eb.dispatchEvent(new Event("input"));   // not bubbling: only its own readout
    });
  }

  host.addEventListener("input", syncEcho);
  render();
})();

/* ==========================================================================
   Shared sampling-distribution plot used by examples 15 and 18
   ========================================================================*/
function samplingDistPlot(pl, opts) {
  const { p, s, rescale, useBalls, clicked, predCI } = opts;
  const ks = Array.from({ length: s + 1 }, (_, i) => i);
  const probs = ks.map((k) => dbinom(k, s, p));
  const maxP = Math.max(...probs);
  let xv, mu, sigma, xlim, xlab;
  if (useBalls) {
    xv = ks; mu = p * s; sigma = Math.sqrt(p * (1 - p) * s);
    xlim = rescale ? [Math.max(0, mu - 5 * sigma), Math.min(s, mu + 5 * sigma)] : [0, s];
    xlab = "Number of white balls";
  } else {
    xv = ks.map((k) => k / s); mu = p; sigma = Math.sqrt(p * (1 - p) / s);
    xlim = rescale ? [Math.max(0, mu - 5 * sigma), Math.min(1, mu + 5 * sigma)] : [0, 1];
    xlab = "p̂";
  }
  /* The probable error at every proportion, hung under the number line: a comb
     whose teeth are 0.477 root(2p(1-p)/s) to scale, tallest in the middle and
     shortest at the two ends. That is the whole of Peirce's remark about
     extreme values in one picture — the same formula, the same s, and a
     tolerance worth twice as much out here as it is at a half. Only on the
     proportion axis, where the teeth stand at the proportions they belong to. */
  /* Only on the whole number line. Zoomed to five standard errors round an
     extreme proportion the teeth are all of a length and say nothing, and the
     band they need would be a third of the plot given over to nothing. */
  const comb = !!opts.peComb && !useBalls && !rescale;
  const top = maxP * 1.3;
  const combH = comb ? top * 0.42 : 0;
  pl.setup({ xlim: xlim, ylim: [-combH, top], mar: [4, 5, 3, 2] });
  pl.axes(comb ? { yat: RPlot.ticks(0, top, 5).filter((v) => v >= 0) } : {});
  pl.box();
  if (comb) {
    const peAt = (q) => 0.477 * Math.sqrt(2 * q * (1 - q) / s);
    const peMax = peAt(0.5);                     // the worst case, so the scale means one thing
    pl.clip(true);
    pl.segments(xlim[0], 0, xlim[1], 0, { col: PAL.rule, lwd: 1 });
    const tooth = (q) => (peAt(q) / peMax) * combH * 0.62;
    for (let i = 0; i <= 100; i++) {
      const q = i / 100;
      if (q < xlim[0] || q > xlim[1]) continue;
      pl.segments(q, -combH * 0.06, q, -combH * 0.06 - tooth(q),
        { col: i % 10 === 0 ? "#b8bcc2" : "#dcdee2", lwd: i % 10 === 0 ? 1.6 : 1 });
    }
    pl.segments(p, -combH * 0.06, p, -combH * 0.06 - tooth(p), { col: PAL.accent2, lwd: 2.5 });
    pl.clip(false);
    /* under the teeth, not through them */
    const middling = Math.abs(p - 0.5) < 0.02;
    pl.text(xlim[0] + (xlim[1] - xlim[0]) * 0.5, -combH * 0.93,
      `the probable error at each proportion — ±${fmt(peAt(p), 4)} here`
      + (middling ? ", which is as wide as it ever gets" : `, ±${fmt(peMax, 4)} at a half`),
      { cex: 0.7, col: PAL.inkSoft });
  }
  pl.axisLabels(xlab, "Probability mass");
  pl.title("Sampling distribution", { cex: 1.1 });
  pl.clip(true);
  const delta = 1 / s;
  // sigma is already in the units of the x axis (balls or p-hat); the density
  // only needs rescaling to the binomial's bin width, which is 1 in balls and
  // 1/s in p-hat. app.R multiplied the balls-mode sd by s a second time, which
  // flattened the curve into a near-horizontal line.
  const sdCurve = sigma;
  const heightScale = useBalls ? 1 : delta;
  if (predCI) {
    const lo = Math.max(xlim[0], useBalls ? predCI[0] * s : predCI[0]);
    const hi = Math.min(xlim[1], useBalls ? predCI[1] * s : predCI[1]);
    const xs = [], ys = [];
    for (let i = 0; i < 500; i++) {
      const x = lo + (hi - lo) * i / 499;
      xs.push(x);
      ys.push(dnorm(x, mu, sdCurve) * heightScale);
    }
    pl.polygon(xs.concat(xs.slice().reverse()), ys.concat(xs.map(() => 0)), { col: "rgba(0,128,0,0.2)" });
    pl.abline({ v: useBalls ? predCI[0] * s : predCI[0], lty: 3, lwd: 2, col: PAL.accent3 });
    pl.abline({ v: useBalls ? predCI[1] * s : predCI[1], lty: 3, lwd: 2, col: PAL.accent3 });
  }
  ks.forEach((k, i) => { if (probs[i] > 0) pl.segments(xv[i], 0, xv[i], probs[i], { lwd: 3, col: opts.stemCol || PAL.ink }); });
  pl.points(xv, probs, { cex: 1.2, col: opts.stemCol || PAL.ink });
  const xs2 = [], ys2 = [];
  for (let i = 0; i < 1000; i++) {
    const x = xlim[0] + (xlim[1] - xlim[0]) * i / 999;
    xs2.push(x); ys2.push(dnorm(x, mu, sdCurve) * heightScale);
  }
  pl.lines(xs2, ys2, { col: PAL.accent3, lwd: 2, lty: 2 });
  pl.abline({ v: useBalls ? p * s : p, lty: 2, lwd: 2, col: PAL.accent2 });
  if (clicked !== null && clicked !== undefined) {
    const cx = useBalls ? clicked : clicked / s;
    const cp = dbinom(clicked, s, p);
    pl.segments(cx, 0, cx, cp, { lwd: 5, col: "#8a7aa8" });
    pl.points([cx], [cp], { cex: 1.5, col: "#8a7aa8" });
    /* The probable error that goes with the estimate, drawn where the estimate
       is: worked at the proportion the sample came out at, which is the only
       one an inquirer holding that sample would have. It is not the height of
       the bar — the height is how often that sample turns up, and the bar is a
       probability where the band is an error. */
    if (opts.clickedPE) {
      const ph = clicked / s;
      const e = 0.477 * Math.sqrt(2 * ph * (1 - ph) / s);
      const half = useBalls ? e * s : e;
      const y = cp + maxP * 0.09;
      pl.segments(cx - half, y, cx + half, y, { col: "#8a7aa8", lwd: 2 });
      [-half, half].forEach((d) => pl.segments(cx + d, y - maxP * 0.03, cx + d, y + maxP * 0.03,
        { col: "#8a7aa8", lwd: 2 }));
    }
  }
  pl.clip(false);
  pl.legend("topright", {
    legend: ["Exact binomial", "Normal approx", "True p"],
    col: [PAL.ink, PAL.accent3, PAL.accent2], lwd: [3, 2, 2], lty: [1, 2, 2], bty: "n", bg: "n", cex: 0.75
  });
}

function stickySnap(id) {
  const p = num(id);
  const sticky = [0.01, 0.2, 0.25, 1 / 3, 0.4, 0.5, 0.6, 2 / 3, 0.75, 0.8];
  for (const sv of sticky) {
    if (Math.abs(p - sv) < 0.015 && Math.abs(p - sv) > 0.0001) { setSlider(id, sv); return true; }
  }
  return false;
}

/* ==========================================================================
   EXAMPLE 15 — Sampling from an urn (Section IV)
   ========================================================================*/
registerExample("example-ex15", (box) => {
  box.appendChild(exHeader("Interactive Example: Judging the Urn by Four Balls", "ex15-content"));
  const content = h(`<div id="ex15-content" class="example-content">
    <p>Every way four balls can come out of the urn, and how often each way comes out. Judging the urn by
      what was drawn means reading the proportion off one of these.</p>
    <div class="row">
      <div class="col col-4">
        <div id="ex15-controls"></div>
        <hr>
        <button class="btn btn-primary" id="ex15_reset">Reset to Peirce's example</button>
      </div>
      <div class="col col-8">
        <div id="ex15-plot"></div>
        <div id="ex15_click_text"></div>
      </div>
    </div>
  </div>`);
  box.appendChild(content);

  let clicked = null;
  const ctl = $("#ex15-controls", content);
  ctl.appendChild(slider("ex15_p", "True proportion (p):", 0.001, 0.999, 0.333, 0.001, (v) => v.toFixed(3), "k1"));
  ctl.appendChild(slider("ex15_s", "Sample size (s):", 2, 500, 4, 1, null, "k2"));

  /* --------------------------------------------------------------------------
     The paragraph above is Peirce working this very case: one ball in three,
     four drawn, 32 times out of 81 and 24 times out of 81. Both sliders drive
     it. p is sticky at the simple fractions, so the counts stay exact and
     integral wherever it is likely to be left; past 1000 possible sequences
     the sentence falls back to "out of 1,000", which is how the example's own
     click-readout already reports the same quantity.
     ------------------------------------------------------------------------*/
  /* Seven of the live figures below are read off this, so a single drag of the
     proportion slider was rebuilding and sorting the same s+1 element table
     seven times over — at s = 500 that is what the stutter was. The inputs are
     only ever the two sliders, so the last answer is worth keeping. */
  let ex15Memo = null;
  const ex15Counts = () => {
    const p = num("ex15_p"), s = Math.round(num("ex15_s"));
    if (ex15Memo && ex15Memo.p === p && ex15Memo.s === s) return ex15Memo.v;
    const pf = decimalToFraction(p);
    const w = pf.num, b = pf.den - pf.num;
    const total = Math.pow(w + b, s);
    const exact = Number.isFinite(total) && total <= 1e12;
    const rank = Array.from({ length: s + 1 }, (_, k) => ({
      k: k,
      c: exact ? choose(s, k) * Math.pow(w, k) * Math.pow(b, s - k)
               : Math.round(dbinom(k, s, p) * 1000)
    })).sort((a, b2) => b2.c - a.c);
    const v = { pf: pf, s: s, exact: exact, total: exact ? total : 1000, rank: rank };
    ex15Memo = { p: p, s: s, v: v };
    return v;
  };
  const ex15Frac = (n, d) => { const g = (function gg(a, b2) { return b2 ? gg(b2, a % b2) : a; })(n, d) || 1;
    return `${n / g}&frasl;${d / g}`; };

  registerLive("example-ex15", {
    composition: () => {
      const { pf } = ex15Counts();
      return `${spellNumber(pf.num)} ${pluralBall(pf.num)} out of ${spellNumber(pf.den)}`;
    },
    drawn: () => spellNumber(num("ex15_s")),
    truth: () => `${ex15Counts().pf.num}&frasl;${ex15Counts().pf.den}`,
    denom: () => bigmark(ex15Counts().total),
    top1n: () => bigmark(ex15Counts().rank[0].c),
    top2n: () => bigmark(ex15Counts().rank[1].c),
    top1p: () => { const c = ex15Counts(); return ex15Frac(c.rank[0].k, c.s); },
    top2p: () => { const c = ex15Counts(); return ex15Frac(c.rank[1].k, c.s); }
  });
  ctl.appendChild(checkbox("ex15_rescale", "Rescale chart (zoom)", false));
  ctl.appendChild(checkbox("ex15_xaxis_balls", "X-axis: Number of balls", true));
  content.addEventListener("input", (ev) => { if (ev.target.id === "ex15_p") stickySnap("ex15_p"); update(); });
  content.addEventListener("change", () => update());
  $("#ex15_reset", content).addEventListener("click", () => {
    setSlider("ex15_p", 1 / 3); setSlider("ex15_s", 4);
    document.getElementById("ex15_rescale").checked = false;
    document.getElementById("ex15_xaxis_balls").checked = true;
    update();
  });

  const canvas = mkCanvas(450, (pl) => {
    samplingDistPlot(pl, {
      p: num("ex15_p"), s: num("ex15_s"), rescale: chk("ex15_rescale"),
      useBalls: chk("ex15_xaxis_balls"), clicked: clicked
    });
  }, {
    onclick: (x) => {
      const s = num("ex15_s");
      const ck = chk("ex15_xaxis_balls") ? Math.round(x) : Math.round(x * s);
      if (ck >= 0 && ck <= s) { clicked = ck; update(); }
    }
  });
  $("#ex15-plot", content).appendChild(canvas);

  function update() {
    const p = num("ex15_p"), s = num("ex15_s");
    if (clicked !== null && clicked > s) clicked = null;
    const pf = decimalToFraction(p);
    const w = pf.num, b = pf.den - pf.num;
    const total = Math.pow(w + b, s);
    const useApprox = total > 1000;
    if (clicked === null) {
      $("#ex15_click_text", content).innerHTML = `<div class="click-info">
        <p><span class="click-cue">Click on any bar of the chart to see the exact probability.</span></p>
        <p>Suppose <strong>${numberWord(pf.num)}</strong> ${pluralBall(pf.num)} out of <strong>${pf.den}</strong>
          is white and the rest black, and that <strong>${numberWord(s)}</strong> balls are drawn.</p></div>`;
    } else {
      const prob = dbinom(clicked, s, p);
      const freq = choose(s, clicked) * Math.pow(w, clicked) * Math.pow(b, s - clicked);
      const propText = `${clicked}/${s}`;
      if (useApprox) {
        const pn = Math.round(prob * 1000);
        $("#ex15_click_text", content).innerHTML = `<div class="click-info">
          <p><strong>Clicked outcome: </strong>${clicked} white balls out of ${s} drawings</p>
          <p>Probability: <strong>${pn}/1000</strong> = <strong>${fmt(prob, 3)}</strong></p>
          <p>If we judge by these <strong>${numberWord(s)}</strong> balls, approximately <strong>${pn}</strong>
            times out of 1000 we would find the proportion to be <strong>${propText}</strong> =
            <strong>${fmt(clicked / s, 3)}</strong>.</p></div>`;
      } else {
        $("#ex15_click_text", content).innerHTML = `<div class="click-info">
          <p><strong>Clicked outcome: </strong>${clicked} white balls out of ${s} drawings</p>
          <p>Probability: <strong>${freq}/${total}</strong> = <strong>${fmt(prob, 3)}</strong></p>
          <p>If we judge by these <strong>${numberWord(s)}</strong> balls, <strong>${freq}</strong> times out of
            <strong>${total}</strong> we would find the proportion to be <strong>${propText}</strong> =
            <strong>${fmt(clicked / s, 3)}</strong>.</p></div>`;
      }
    }
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 17 — Peirce's formula for probable error
   ========================================================================*/
registerExample("example-ex17", (box) => {
  box.appendChild(exHeader("Interactive Example: The Formula for the Probable Error", "ex17-content"));
  const content = h(`<div id="ex17-content" class="example-content">
    <div class="row">
      <div class="col col-4" id="ex17-ctl-p"></div>
      <div class="col col-4" id="ex17-ctl-s"></div>
      <div class="col col-4" id="ex17-ctl-c"></div>
    </div>
    <div class="row">
      <div class="col col-4">
        <div class="ex-buttonbar">
          <button class="btn btn-primary btn-sm" id="ex17_simulate_single">Draw a sample</button>
          <button class="btn btn-primary btn-sm" id="ex17_simulate_100">Draw a hundred</button>
          <button class="btn btn-warning btn-sm" id="ex17_reset">Clear</button>
        </div>
        <div class="ex-buttonbar">
          <button class="btn btn-sm" id="ex17_peirce">Peirce's example: one in three, four drawn</button>
        </div>
        <div id="ex17-rescale"></div>
        <div id="ex17_unreachable"></div>
        <div id="ex17_current_result"></div>
      </div>
      <div class="col col-8"><div class="plot-container" id="ex17-combined-plot"></div></div>
    </div>
  </div>`);
  box.appendChild(content);

  let history = [];
  let current = null;

  $("#ex17-ctl-p", content).appendChild(
    slider("ex17_p", "True proportion (p):", 0.001, 0.999, 0.5, 0.001, (v) => v.toFixed(3), "k1"));
  /* Down to four, and one ball at a time. Peirce's own case is four drawn, and
     it is the case the sentence beside the chart is about; a slider that began
     at ten in tens could not be put there. */
  $("#ex17-ctl-s", content).appendChild(
    slider("ex17_s", "Balls drawn (s):", 2, 1000, 100, 1, null, "k2"));
  /* A plain percentage from a half to 99. It ran in nines before — k of them
     meaning 100(1 - 10^-k) — so that every row of Peirce's printed table was a
     position on it, out to his ten-billionth. That put almost the whole travel
     of the thumb in country no reader has any use for, and made the levels
     anyone does want unhittable. The far rows are still printed above with
     their own bounds worked out; they are simply not places the slider goes. */
  $("#ex17-ctl-c", content).appendChild(
    slider("ex17_conf", "How often the bound is to hold:", 50, 99, 50, 1,
      (v) => (v <= 50 ? "50% — the probable error"
        : v === 95 ? "95% — standard today" : `${Math.round(v)}%`), "k3"));
  const CONF = () => num("ex17_conf");
  const CONF_MIN = 50, CONF_MAX = 99;
  $("#ex17-rescale", content).appendChild(checkbox("ex17_rescale", "Rescale charts", true));

  content.addEventListener("input", () => update());
  content.addEventListener("change", () => update());

  // the six rows of the table as printed in the paper; the last is the one
  // Peirce appeals to for the census example ("only once out of 10,000,000,000")
  const CONSTANTS = [0.477, 1.163, 1.821, 2.328, 2.751, 4.77];
  const CONF_IDS = ["50", "90", "99", "99.9", "99.99", "99.99999999"];
  const CONF_LABELS = ["50% (half the time)", "90% (9 times out of 10)", "99% (99 times out of 100)",
    "99.9% (999 times out of 1,000)", "99.99% (9,999 times out of 10,000)",
    "99.99999999% (9,999,999,999 times out of 10,000,000,000)"];

  function getConstant() { return qnorm((1 + CONF() / 100) / 2) / Math.SQRT2; }

  /* --------------------------------------------------------------------------
     Peirce's table is already printed in the article; rather than repeat it in
     a panel of its own, the printed rows carry the worked bound for the current
     p and s, and clicking a row selects that level. The seventh row is the
     custom one — it exists only while the example is open, so what is on the
     page when it is shut is the six rows he wrote.
     ------------------------------------------------------------------------*/
  const ex17Bound = (c) => {
    const p = num("ex17_p"), s = num("ex17_s");
    return ` = ${fmt(c * Math.sqrt(2 * p * (1 - p) / s), 4)}`;
  };
  const ex17Row = (i) => () => ex17Bound(CONSTANTS[i]);
  const ex17Table = document.getElementById("ex17-table");
  if (ex17Table) {
    /* clicking a printed row moves the slider to that row's level, for the rows
       the slider can reach. The three beyond 99 keep their own worked bound —
       that is what the row is for — but there is nowhere to put the thumb, and
       clamping it silently to 99 would be a lie about which level was being
       drawn. */
    ex17Table.addEventListener("click", (ev) => {
      const tr = ev.target.closest("tr[data-conf]");
      if (!tr || !document.getElementById("ex17_conf")) return;
      const c = parseFloat(tr.getAttribute("data-conf"));
      if (!Number.isFinite(c) || c < CONF_MIN || c > CONF_MAX) return;
      setSlider("ex17_conf", Math.round(c));
      refreshLive("example-ex17");
    });
  }

  registerLive("example-ex17", {
    pEq: () => ` = ${fmt(num("ex17_p"), 3)}`,
    sEq: () => ` = ${bigmark(num("ex17_s"))}`,
    e0: ex17Row(0), e1: ex17Row(1), e2: ex17Row(2),
    e3: ex17Row(3), e4: ex17Row(4), e5: ex17Row(5),
    /* the seventh row is wherever the slider is standing, so a level between
       two of Peirce's printed ones still has its bound written out */
    customLabel: () => `${Math.round(CONF())} times out of 100 within`,
    customConst: () => fmt(getConstant(), 3),
    eCustom: () => ex17Bound(getConstant())
  }, {
    onRefresh: (on) => {
      if (!ex17Table) return;
      ex17Table.classList.toggle("ex17-live", on);
      const c = on ? CONF() : null;
      $$("tr[data-conf]", ex17Table).forEach((tr) => {
        const v = parseFloat(tr.getAttribute("data-conf"));
        tr.classList.toggle("conf-active", c !== null && Number.isFinite(v)
          && Math.abs(v - c) < 0.005);
      });
    }
  });

  /* --------------------------------------------------------------------------
     One picture rather than two. The distribution of p-hat sits along the top
     on the same proportion axis as the record below it, and a new sample lands
     on the curve and then drops into the first row of the stack, pushing the
     rest down. That is the thing worth watching: not any one interval, but the
     rate at which intervals of this construction cover the truth.
     ------------------------------------------------------------------------*/
  const combinedCanvas = mkCanvas(460, (pl) => {
    const p = num("ex17_p"), s2 = num("ex17_s"), rescale = chk("ex17_rescale");
    const se = Math.sqrt(p * (1 - p) / s2), delta = 1 / s2;
    const xlim = rescale ? [Math.max(0, p - 5 * se), Math.min(1, p + 5 * se)] : [0, 1];

    const ROWS = 22;                       // rows of history under the curve
    const df = history.slice(-ROWS).reverse();   // newest first, just under the curve
    const nContain = history.filter((d) => d.containsP).length;

    /* How often each result has actually come up, counted on the lattice the
       chart already draws. The stems keep their theoretical heights and take
       the count as their colour, so the empirical distribution is shown on the
       exact same marks as the distribution it is meant to approach rather than
       in a second chart beside it. Only samples of the current size are
       counted: an old record's proportion does not sit on this lattice. */
    const heat = new Map();
    history.forEach((d) => { if (d.s === s2) heat.set(d.k, (heat.get(d.k) || 0) + 1); });
    const heatMax = Math.max(1, ...heat.values());
    const HEAT_COLD = [201, 204, 209], HEAT_LO = [206, 199, 226], HEAT_HI = [52, 38, 84];
    const heatCol = (k) => {
      const c = heat.get(k) || 0;
      if (!c) return `rgb(${HEAT_COLD.join(",")})`;
      /* A floor, so one draw among a thousand still registers, then a steep ramp
         above it. A square root did the opposite — it lifted the rare results
         towards the dark end, and by a couple of hundred draws every stem near
         the middle was much the same violet, which is the one thing the shading
         is there to distinguish. */
      const t = 0.14 + 0.86 * Math.pow(c / heatMax, 1.7);
      return `rgb(${HEAT_LO.map((v, i) => Math.round(v + (HEAT_HI[i] - v) * t)).join(",")})`;
    };

    /* one coordinate system: x is the proportion for both halves, y runs from
       the top of the curve down through the rows */
    pl.setup({ xlim: xlim, ylim: [-ROWS - 1.5, 10], mar: [4, 4, 3, 2] });
    pl.axes({ yat: [] });
    pl.box();
    pl.axisLabels("Proportion", null);
    pl.title(history.length
      ? `${bigmark(nContain)} of ${bigmark(history.length)} intervals cover the truth (${
          fmt(nContain / history.length, 3)})`
      : "Draw a sample to begin", { cex: 1.0 });
    pl.clip(true);

    // the curve, scaled into the top ten units
    const ks = Array.from({ length: s2 + 1 }, (_, i) => i);
    const probs = ks.map((k) => dbinom(k, s2, p));
    const maxP = Math.max(...probs) || 1;
    const H = 9;
    ks.forEach((k, i) => {
      if (probs[i] <= 0) return;
      pl.segments(k / s2, 0, k / s2, (probs[i] / maxP) * H,
        { lwd: s2 <= 40 ? 4 : 2, col: heatCol(k) });
    });
    const xs = [], ys = [];
    for (let i = 0; i < 500; i++) {
      const x = xlim[0] + (xlim[1] - xlim[0]) * i / 499;
      xs.push(x); ys.push((dnorm(x, p, se) * delta / maxP) * H);
    }
    pl.lines(xs, ys, { col: "#2f6f9f", lwd: 2, lty: 2 });
    pl.abline({ v: p, col: "#c79a45", lwd: 2.5 });

    // the rule the samples drop across
    pl.segments(xlim[0], -0.6, xlim[1], -0.6, { col: PAL.rule, lwd: 1 });

    // the record, newest just below the rule
    df.forEach((d, i) => {
      const y = -1.4 - i;
      const col = d.containsP ? "#4a7c59" : "#b0563f";
      pl.segments(d.ciLower, y, d.ciUpper, y, { col: col, lwd: i === 0 ? 2.4 : 1.4 });
      pl.points([d.pHat], [y], { cex: i === 0 ? 0.8 : 0.5, col: col });
    });
    if (current) {
      const obsProb = (dbinom(current.whiteBalls, s2, p) / maxP) * H;
      pl.segments(current.pHat, 0, current.pHat, obsProb, { lwd: 4, col: "#8a7aa8" });
      pl.points([current.pHat], [obsProb], { cex: 1.3, col: "#8a7aa8" });
    } else {
      pl.text((xlim[0] + xlim[1]) / 2, H * 0.55, "Draw a sample to see where it lands",
        { cex: 0.95, col: PAL.inkFaint });
    }
    pl.clip(false);
    pl.legend("topleft", {
      legend: history.length ? ["The truth", "Covers it", "Misses it", "Shade: how often drawn"]
        : ["The truth", "Covers it", "Misses it"],
      col: ["#c79a45", "#4a7c59", "#b0563f", `rgb(${HEAT_HI.join(",")})`],
      lwd: [2.5, 2, 2, 4], cex: 0.7
    });
  });
  $("#ex17-combined-plot", content).appendChild(combinedCanvas);

  function drawSample() {
    const p = num("ex17_p"), s = num("ex17_s");
    const constant = getConstant();
    const seFactor = Math.sqrt(2 * p * (1 - p) / s);
    const margin = constant * seFactor;
    const whiteBalls = rbinom(s, p);
    const pHat = whiteBalls / s;
    const rec = { pHat: pHat, ciLower: pHat - margin, ciUpper: pHat + margin,
      containsP: (p >= pHat - margin && p <= pHat + margin), p: p,
      k: whiteBalls, s: s };      // where on the lattice it landed, for the shading
    return { rec: rec, whiteBalls: whiteBalls, s: s };
  }
  function confLevel() { return CONF(); }

  /* Peirce's own case: one ball in three, four drawn. No sample of four can
     come out at a third, so the induction is wrong every single time — and the
     bound around it still does its work at the rate claimed. The exact figure
     is worth having rather than the counted one, since it is a claim about the
     construction and not about any particular run. */
  const exactCover = () => {
    const p = num("ex17_p"), s = Math.round(num("ex17_s"));
    const margin = getConstant() * Math.sqrt(2 * p * (1 - p) / s);
    let tot = 0;
    for (let k = 0; k <= s; k++) if (Math.abs(k / s - p) <= margin + 1e-12) tot += dbinom(k, s, p);
    return tot;
  };
  const unreachable = () => {
    const p = num("ex17_p"), s = Math.round(num("ex17_s"));
    return Math.abs(p * s - Math.round(p * s)) > 1e-9;
  };

  $("#ex17_simulate_single", content).addEventListener("click", () => {
    const d = drawSample();
    history.push(d.rec);
    current = { whiteBalls: d.whiteBalls, s: d.s, pHat: d.rec.pHat, p: d.rec.p,
      ciLower: d.rec.ciLower, ciUpper: d.rec.ciUpper, containsP: d.rec.containsP, confLevel: confLevel() };
    update();
  });
  $("#ex17_simulate_100", content).addEventListener("click", () => {
    let last = null;
    for (let i = 0; i < 100; i++) { const d = drawSample(); history.push(d.rec); last = d; }
    const s = num("ex17_s");
    current = { whiteBalls: Math.round(last.rec.pHat * s), s: s, pHat: last.rec.pHat, p: last.rec.p,
      ciLower: last.rec.ciLower, ciUpper: last.rec.ciUpper, containsP: last.rec.containsP, confLevel: confLevel() };
    update();
  });
  $("#ex17_reset", content).addEventListener("click", () => { history = []; current = null; update(); });
  $("#ex17_peirce", content).addEventListener("click", () => {
    history = []; current = null;
    setSlider("ex17_p", 1 / 3); setSlider("ex17_s", 4); setSlider("ex17_conf", 50);
    update();
  });

  function update() {
    /* The table of levels and bounds is Peirce's own, printed above; it fills
       in there rather than being repeated here. */

    /* Why the two rates can differ: the estimate has only s + 1 places to land,
       so the window round the truth catches one of them at some proportions and
       two at others. The claimed level is the smooth curve through that; at any
       one proportion the lattice puts the realised rate above or below it. Both
       figures are given rather than the claim alone, as in 20. */
    if (unreachable()) {
      const s17 = Math.round(num("ex17_s")), got = exactCover() * 100, want = CONF();
      const green = (t) => `<span style="color:#4a7c59;font-weight:700;">${t}</span>`;
      const close = Math.abs(got - want) < 1.5;
      $("#ex17_unreachable", content).innerHTML = `<div class="note-block" style="margin:10px 0 14px;">
        While we can never draw a sample that reflects the true proportion of
        <span style="color:#9a7b3f;font-weight:700;">${fmt(num("ex17_p"), 3)}</span> &mdash;
        <span style="color:#b0563f;font-weight:700;">${spellNumber(s17)}</span> drawings can come out at only
        ${spellNumber(s17 + 1)} values, and it is not among them &mdash; we can be confident that our error
        bounds will nevertheless contain it ${green(fmt(got, 1) + "%")} of the time${close ? "" :
          `, against the ${green(fmt(want, 0) + "%")} claimed: an induction from ${spellNumber(s17)} can land
           on only ${spellNumber(s17 + 1)} values, and the window round the truth catches one of them at this
           proportion and two at others`}.</div>`;
    } else $("#ex17_unreachable", content).innerHTML = "";

    if (current) {
      const col = current.containsP ? "#4a7c59" : "#b0563f";
      const txt = current.containsP ? "Contains p" : "Does not contain p";
      $("#ex17_current_result", content).innerHTML =
        `<div style="padding:15px;background-color:#eeece5;border-radius:5px;">
          <h5>Most Recent Sample:</h5>
          <p><b>White balls drawn: </b>${current.whiteBalls} out of ${current.s}</p>
          <p><b>Observed p-hat: </b>${fmt(current.pHat, 4)}</p>
          <p><b>${current.confLevel}% Confidence Interval: </b>[${fmt(current.ciLower, 4)}, ${fmt(current.ciUpper, 4)}]</p>
          <p><b>True p: </b>${fmt(current.p, 4)}</p>
          <div style="padding:10px;margin-top:10px;background-color:${col};color:white;border-radius:5px;text-align:center;font-weight:bold;">${txt}</div>
        </div>`;
    } else $("#ex17_current_result", content).innerHTML = "";
    drawCanvas(combinedCanvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 16 — Real difference or chance (1870 census)
   ========================================================================*/
registerExample("example-ex16", (box) => {
  box.appendChild(exHeader("Interactive Example: Real Difference, or Chance?", "ex16-content"));
  const content = h(`<div id="ex16-content" class="example-content">
    <div id="ex16-plot"></div>
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin:2px 0 10px;">
      <div id="ex16-rescale"></div><div id="ex16-show-errors"></div>
    </div>
    <div class="ex-buttonbar">
      <button class="btn btn-primary btn-sm" data-act="census">The 1870 census</button>
      <button class="btn btn-sm" data-act="same">Same sample size</button>
      <button class="btn btn-sm" data-act="chance">A difference due to chance</button>
    </div>
    <div class="row">
      <div class="col col-6"><div id="ex16-g1"></div></div>
      <div class="col col-6"><div id="ex16-g2"></div></div>
    </div>
    <div class="row">
      <div class="col col-6"><div id="ex16-p-slider"></div></div>
      <div class="col col-6"><div id="ex16-conf-slider"></div></div>
    </div>
  </div>`);
  box.appendChild(content);

  /* Counts run over three decades, so the slider carries the exponent and the
     count is rounded to three figures. That keeps the round numbers Peirce
     actually quotes reachable — a million, a hundred and fifty thousand — which
     a linear slider over ten million never would. */
  const sig3 = (x) => {
    const m = Math.pow(10, Math.floor(Math.log10(x)) - 2);
    return Math.round(x / m) * m;
  };
  const N1 = () => sig3(Math.pow(10, num("ex16_n1")));
  const N2 = () => sig3(Math.pow(10, num("ex16_n2")));
  const nFmt = (v) => bigmark(sig3(Math.pow(10, v)));

  $("#ex16-g1", content).appendChild(
    slider("ex16_p1", "Males among white children:", 0.40, 0.60, 0.5082, 0.0001, (v) => v.toFixed(4), "k1"));
  $("#ex16-g1", content).appendChild(
    slider("ex16_n1", "White children counted:", 3, 7, 6, 0.001, nFmt, "k1"));
  $("#ex16-g2", content).appendChild(
    slider("ex16_p2", "Males among colored children:", 0.40, 0.60, 0.4977, 0.0001, (v) => v.toFixed(4), "k2"));
  $("#ex16-g2", content).appendChild(
    slider("ex16_n2", "Colored children counted:", 3, 7, 5.176, 0.001, nFmt, "k2"));
  $("#ex16-p-slider", content).appendChild(
    slider("ex16_p_assumed", "p, assumed true proportion:", 0.01, 0.99, 0.5, 0.01, (v) => v.toFixed(2), "k3"));
  $("#ex16-rescale", content).appendChild(checkbox("ex16_rescale", "Rescale chart (zoom)", true));
  $("#ex16-show-errors", content).appendChild(checkbox("ex16_show_errors", "Show probable error bounds", true));
  const confSlider = slider("ex16_confidence", "Confidence level (%):", 50, 100, 50, 1);
  $("#ex16-conf-slider", content).appendChild(confSlider);

  /* Peirce works the census through in figures — the fraction, its root, the
     0.477 — so every one of them moves with the sliders. His own wordings are
     kept where they are words: "one in a 100", "ten times". */
  const worked = (n, e, col) => {
    const pa = num("ex16_p_assumed");
    return `0.477 &radic;<span class="rad"><span class="frac">
      <span class="num">2 &times; <span style="color:var(--accent-3);">${fmt(pa, 2)}</span> &times;
      <span style="color:var(--accent-3);">${fmt(1 - pa, 2)}</span></span>
      <span class="den" style="color:${col};">${bigmark(n)}</span></span></span>
      &nbsp;=&nbsp; <span style="color:${col};font-weight:700;">${fmt(e, 5)}</span>`;
  };
  const asOne = (d) => (d > 0 ? `one in a ${bigmark(Math.round(1 / d))}` : "no difference at all");
  registerLive("example-ex16", {
    p1:   () => fmt(num("ex16_p1"), 4),
    p2:   () => fmt(num("ex16_p2"), 4),
    n1:   () => bigmark(N1()),
    n2:   () => bigmark(N2()),
    p:    () => fmt(num("ex16_p_assumed"), 2),
    twop: () => fmt(2 * num("ex16_p_assumed") * (1 - num("ex16_p_assumed")), 2),
    diff: () => fmt(Math.abs(num("ex16_p1") - num("ex16_p2")), 4),
    diffAsOne: () => asOne(Math.abs(num("ex16_p1") - num("ex16_p2"))),
    frac1: () => {
      const pa = num("ex16_p_assumed");
      return `1/${bigmark(1 / (2 * pa * (1 - pa) / N1()))}`;
    },
    root1: () => {
      const pa = num("ex16_p_assumed");
      return `1/${bigmark(1 / Math.sqrt(2 * pa * (1 - pa) / N1()))}`;
    },
    pe1: () => {
      const pa = num("ex16_p_assumed");
      return fmt(0.477 * Math.sqrt(2 * pa * (1 - pa) / N1()), 5);
    },
    pe2: () => {
      const pa = num("ex16_p_assumed");
      return fmt(0.477 * Math.sqrt(2 * pa * (1 - pa) / N2()), 5);
    },
    times: () => {
      const c = calc();
      return c.sumErr > 0 ? fmt(c.ratio, 1) : "—";
    },
    /* His formula twice over, added to the printed table above the paragraph
       with s and p standing at the figures in use rather than as letters, each
       in the colour its group wears in the prose. */
    rowLab1: () => "probable error, white children",
    rowLab2: () => "probable error, colored children",
    rowVal1: () => worked(calc().n1, calc().q1, "var(--accent)"),
    rowVal2: () => worked(calc().n2, calc().q2, "var(--accent-2)"),
    verdict: () => {
      const c = calc();
      const said = c.ratio >= 4.77 ? "almost certainly real, and not readily attributable to chance"
        : c.ratio >= 2.5 ? "likely real, though not as certain"
        : "readily attributable to chance";
      return `<span class="ex-reading">Meaning the difference is ${said}.</span>`;
    },
    odds: () => {
      const c = calc();
      return Number.isFinite(c.odds) ? (c.odds > 1e7 ? c.odds.toExponential(1) : bigmark(c.odds))
        : "an unimaginable number of";
    }
  }, {
    onRefresh: (on) => {
      const t = document.getElementById("ex17-table");
      if (t) t.classList.toggle("ex16-live", on);
    }
  });

  content.addEventListener("input", () => update());
  content.addEventListener("change", () => update());
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "census") {
      setSlider("ex16_p1", 0.5082); setSlider("ex16_n1", 6);
      setSlider("ex16_p2", 0.4977); setSlider("ex16_n2", 5.176);
      setSlider("ex16_p_assumed", 0.5);
    } else if (a === "same") {
      setSlider("ex16_n2", num("ex16_n1"));
    } else if (a === "chance") {
      setSlider("ex16_p1", 0.505); setSlider("ex16_n1", 3.699);
      setSlider("ex16_p2", 0.495); setSlider("ex16_n2", 3.699);
      setSlider("ex16_p_assumed", 0.5);
    } else return;
    update();
  });

  function calc() {
    const p1 = num("ex16_p1"), n1 = N1(), p2 = num("ex16_p2"), n2 = N2();
    const pa = num("ex16_p_assumed");
    const confidence = num("ex16_confidence");
    const constant = qnorm(0.5 + confidence / 200) / Math.SQRT2;
    const pe1 = constant * Math.sqrt(2 * pa * (1 - pa) / n1);
    const pe2 = constant * Math.sqrt(2 * pa * (1 - pa) / n2);
    /* The bands follow whichever row is selected, but the discrepancy is
       always counted in probable errors, because that is the quantity Peirce
       counts it in: the table is then consulted for what such a multiple comes
       to. Measuring the multiple in the selected bound as well would count the
       level twice, and the verdict would flip as the row moved. */
    const q1 = 0.477 * Math.sqrt(2 * pa * (1 - pa) / n1);
    const q2 = 0.477 * Math.sqrt(2 * pa * (1 - pa) / n2);
    const diffObs = Math.abs(p1 - p2), sumErr = q1 + q2;
    const seD = Math.sqrt(pa * (1 - pa) / n1 + pa * (1 - pa) / n2);
    const z = diffObs / seD;
    const pv = 2 * pnorm(-Math.abs(z));
    return { p1, p2, n1, n2, pe1, pe2, diffObs, sumErr, ratio: diffObs / sumErr,
      se1: Math.sqrt(pa * (1 - pa) / n1), se2: Math.sqrt(pa * (1 - pa) / n2),
      z, pv, odds: pv > 0 ? 1 / pv : Infinity, pa, constant, confidence, q1: q1, q2: q2 };
  }

  const canvas = mkCanvas(350, (pl) => {
    const c = calc();
    const rescale = chk("ex16_rescale"), showErr = chk("ex16_show_errors");
    const lo = rescale ? Math.min(c.p1 - 3 * c.se1, c.p2 - 3 * c.se2) : 0;
    const hi = rescale ? Math.max(c.p1 + 3 * c.se1, c.p2 + 3 * c.se2) : 1;
    const xr = [], y1 = [], y2 = [];
    for (let i = 0; i < 500; i++) {
      const x = lo + (hi - lo) * i / 499;
      xr.push(x); y1.push(dnorm(x, c.p1, c.se1)); y2.push(dnorm(x, c.p2, c.se2));
    }
    const maxY = Math.max(...y1, ...y2);
    pl.setup({ xlim: [lo, hi], ylim: [0, maxY * 1.1], mar: [4, 5, 3, 2] });
    pl.axes({}); pl.box();
    pl.axisLabels("Proportion", "Density");
    pl.title("Comparison of Both Groups", { cex: 1.1 });
    pl.clip(true);
    if (showErr) {
      const band = (centre, pe, ys, col) => {
        const idx = xr.map((x, i) => (x >= centre - pe && x <= centre + pe ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) return;
        const px = idx.map((i) => xr[i]), py = idx.map((i) => ys[i]);
        pl.polygon(px.concat(px.slice().reverse()), px.map(() => 0).concat(py.slice().reverse()), { col: col });
      };
      band(c.p1, c.pe1, y1, "rgba(43,128,184,0.2)");
      band(c.p2, c.pe2, y2, "rgba(217,94,3,0.2)");
    }
    pl.lines(xr, y1, { col: "#2f6f9f", lwd: 2 });
    pl.lines(xr, y2, { col: "#b8703a", lwd: 2 });
    pl.abline({ v: c.p1, col: "#2f6f9f", lwd: 2, lty: 2 });
    pl.abline({ v: c.p2, col: "#b8703a", lwd: 2, lty: 2 });
    const ya = maxY * 0.5;
    pl.arrows(c.p2, ya, c.p1, ya, { code: 3, angle: 20, length: 8, lwd: 2, col: "#8a4331" });
    pl.text((c.p1 + c.p2) / 2, ya * 1.1, `Difference: ${fmt(c.diffObs, 4)}`, { col: "#8a4331", cex: 0.9, font: 2 });

    /* --------------------------------------------------------------------
       The difference measured in probable errors, laid along it.

       A second rule under the arrow, perforated into lengths of e1 + e2 — each
       perforation the two errors end to end, in the two groups' own colours,
       so what the multiple is a multiple OF is visible rather than stated. Ten
       and a bit of them span the census difference, which is Peirce's sentence
       drawn.

       They stay probable errors whatever the confidence slider says. That
       slider widens the shaded bands, which is what a level is for; the count
       in his sentence is in probable errors, and his table is then consulted
       for what such a multiple comes to. Perforating in the selected bound as
       well would count the level twice over, and the picture would stop
       agreeing with the sentence it illustrates.
       ------------------------------------------------------------------- */
    if (c.sumErr > 0 && c.diffObs > 0) {
      const yb = ya * 0.74;
      const lo = Math.min(c.p1, c.p2), unit = c.sumErr;
      const whole = Math.floor(c.ratio + 1e-9);
      const gap = unit * 0.06;               // the perforation, so the units count
      const drawUnit = (u0, frac) => {
        const b = Math.min(c.q1, unit * frac);            // group 1's share first
        if (b > 0) pl.segments(u0, yb, u0 + b, yb, { col: "#2f6f9f", lwd: 4 });
        const r = unit * frac - b;
        if (r > 0) pl.segments(u0 + b, yb, u0 + b + r, yb, { col: "#b8703a", lwd: 4 });
      };
      for (let i = 0; i < Math.min(whole, 60); i++) drawUnit(lo + i * unit, 1 - gap / unit);
      const rest = c.ratio - whole;
      if (rest > 0.01 && whole < 60) drawUnit(lo + whole * unit, Math.max(0, rest - gap / unit));
      pl.text((c.p1 + c.p2) / 2, yb * 0.72,
        `${fmt(c.ratio, 1)} × (e₁ + e₂) — every dash is the two probable errors end to end`,
        { col: "#575d66", cex: 0.78 });
      /* the question the confidence slider raises, answered where it arises */
      if (c.confidence > 50.5 && chk("ex16_show_errors")) {
        pl.text((c.p1 + c.p2) / 2, yb * 0.5,
          `the bands follow the ${fmt(c.confidence, 0)}% level; the dashes stay probable errors`,
          { col: PAL.inkFaint, cex: 0.7 });
      }
    }
    pl.clip(false);
    pl.legend("topright", { legend: ["Group 1", "Group 2"], col: ["#2f6f9f", "#b8703a"], lwd: [2, 2], cex: 0.9 });
  });
  $("#ex16-plot", content).appendChild(canvas);

  /* The analysis box is gone. Every figure that was in it — both probable
     errors, the difference, their sum and the multiple — is in Peirce's own
     paragraph above and in the perforated rule under the difference, so the box
     was the same arithmetic printed a third time. */
  function update() {
    confSlider.style.display = chk("ex16_show_errors") ? "" : "none";
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 18 — Extreme probabilities are more secure
   ========================================================================*/
registerExample("example-ex18", (box) => {
  box.appendChild(exHeader("Interactive Example: One White Ball in a Hundred", "ex18-content"));
  const content = h(`<div id="ex18-content" class="example-content">
    <div class="row">
      <div class="col col-4">
        <div id="ex18-controls"></div>
        <div id="ex18-pred"></div>
        <div class="ex-buttonbar">
          <button class="btn btn-primary btn-sm" id="ex18_reset">Reset to Peirce's example</button>
          <button class="btn btn-primary btn-sm" id="ex18_even">The same drawings with p at a half</button>
        </div>
        <div id="ex18_secure_note"></div>
      </div>
      <div class="col col-8">
        <div id="ex18-plot"></div>
        <div id="ex18_click_text"></div>
      </div>
    </div>
  </div>`);
  box.appendChild(content);

  let clicked = null;
  /* the proportion the "at a half" button came from, kept so the note can say
     what the same drawings were worth there */
  let compare = null;
  const ctl = $("#ex18-controls", content);
  ctl.appendChild(slider("ex18_p", "True proportion (p):", 0.001, 0.999, 0.01, 0.001, (v) => v.toFixed(3), "k1"));
  ctl.appendChild(slider("ex18_s", "Sample size (s):", 5, 500, 100, 1, null, "k2"));

  /* Peirce works this one out in the paragraph itself: one white ball in 100,
     100 drawings, and then 366, 370, 185, 61, 15, 3 per thousand. Those six
     are dbinom(k, s, p) x 1000 for k = 0..5, and at his own p and s they come
     out at exactly the numbers he printed. */
  /* Peirce counts from no white ball upwards, which is the interesting end only
     while the mean sits down there. Push p or s up and every one of his six
     terms rounds to nothing, so the window slides to six values straddling the
     mean instead — there is always something to read. At his own figures the
     window is his, and the sentence comes out word for word. */
  const ex18Window = () => {
    const p = num("ex18_p"), s = Math.round(num("ex18_s"));
    const mean = s * p;
    if (mean <= 3) return [0, 1, 2, 3, 4, 5].filter((k) => k <= s);
    const lo = Math.min(Math.max(0, Math.round(mean) - 2), Math.max(0, s - 5));
    return Array.from({ length: 6 }, (_, i) => lo + i).filter((k) => k <= s);
  };
  const ballWords = (k, spellOut) => {
    if (k === 0) return "no white ball";
    if (k === 1) return "one white ball";
    const n = k <= 99 ? spellNumber(k) : bigmark(k);
    return spellOut ? `${n} white balls` : n;
  };

  /* --------------------------------------------------------------------------
     What "tolerably certain" comes to.

     Peirce's sentence is a tolerance and a certainty together: an error of no
     more than one ball in a hundred, and being tolerably certain of it. Neither
     is chosen — both fall out of the probable error, which is the quantity the
     whole section has been about and the one example 17 gave the formula for.

     At his own figures 0.477 root(2p(1-p)/s) is 0.0067, which is two thirds of
     a ball in a hundred. You cannot be in error by two thirds of a ball, so the
     statement is made in whole balls and rounds up to one — his "more than one
     ball in 100". How often the drawings actually land inside that is then a
     fact to be counted, not a level to be picked: no white ball, one, or two,
     which is 366 + 370 + 185 in his own list, or 92.1 times in 100. That is
     what "tolerably certain" is worth here.

     An earlier pass had the certainty on a slider with the tolerance read off
     it. That put the choosing in the wrong place — the tolerance could only
     move in whole balls, so most of the slider's travel changed nothing, and it
     invited a level to be picked when Peirce is not picking one.
     ------------------------------------------------------------------------*/
  const probableError = () => {
    const p = num("ex18_p"), s = Math.round(num("ex18_s"));
    return 0.477 * Math.sqrt(2 * p * (1 - p) / s);
  };
  function tolerance() {
    const p = num("ex18_p"), s = Math.round(num("ex18_s"));
    const e = probableError();
    /* stated in whole balls in a hundred, so it rounds up: a tolerance of two
       thirds of a ball is a tolerance of one ball */
    const m = Math.max(1, Math.ceil(e * 100 - 1e-9));
    const d = m / 100;
    let cover = 0;
    for (let k = 0; k <= s; k++) if (Math.abs(k / s - p) <= d + 1e-12) cover += dbinom(k, s, p);
    return { m: m, delta: d, cover: cover, e: e };
  }
  const ballsPhrase = (m) => (m === 0 ? "not one ball"
    : m === 1 ? "one ball" : `${spellNumber(m)} balls`);

  registerLive("example-ex18", {
    rate: () => {
      const p = num("ex18_p");
      return p <= 0.5 ? `one white ball in ${bigmark(1 / p)}`
                      : `${bigmark(p * 100)} white balls in 100`;
    },
    s: () => bigmark(num("ex18_s")),
    /* his own two words, with the figure they come to */
    certainty: () => ` &mdash; ${fmt(tolerance().cover * 100, 1)} times in 100 &mdash;`,
    margin: () => ballsPhrase(tolerance().m),
    list: () => {
      const p = num("ex18_p"), s = Math.round(num("ex18_s"));
      const ks = ex18Window();
      const per = (k) => bigmark(dbinom(k, s, p) * 1000);
      /* His "would be only 3/1000" is the force of a list that has been falling
         all along. Once the window straddles the mean it no longer falls, and
         the word has to go. */
      const falling = dbinom(ks[ks.length - 1], s, p) < dbinom(ks[0], s, p);
      return ks.map((k, i) => {
        const last = i === ks.length - 1;
        if (i === 0) return `The probability of drawing ${ballWords(k, true)} would be ${per(k)}/1000`;
        return `that of drawing ${ballWords(k, false)} would be ${last && falling ? "only " : ""}${per(k)}/1000`;
      }).join("; ") + " etc.";
    }
  });
  ctl.appendChild(checkbox("ex18_rescale", "Rescale chart (zoom)", true));
  ctl.appendChild(checkbox("ex18_xaxis_balls", "X-axis: Number of balls", false));
  const pred = $("#ex18-pred", content);
  pred.appendChild(checkbox("ex18_show_prediction", "Show the probable error", true));

  content.addEventListener("input", (ev) => { if (ev.target.id === "ex18_p") stickySnap("ex18_p"); update(); });
  content.addEventListener("change", () => update());
  $("#ex18_reset", content).addEventListener("click", () => {
    setSlider("ex18_p", 0.01); setSlider("ex18_s", 100);
    document.getElementById("ex18_rescale").checked = true;
    document.getElementById("ex18_xaxis_balls").checked = false;
    document.getElementById("ex18_show_prediction").checked = true;
    clicked = null; compare = null;
    update();
  });
  /* The same drawings and the same certainty, moved to the middle of the range:
     the tolerance is the only thing that gives, and it is the sentence in the
     text that shows it. Unzoomed, so the comb underneath is on the whole number
     line where the two ends can be compared. */
  $("#ex18_even", content).addEventListener("click", () => {
    /* what the same drawings bought at the proportion we are leaving, so the
       note underneath can put the two side by side */
    compare = { p: num("ex18_p"), t: tolerance() };
    setSlider("ex18_p", 0.5);
    document.getElementById("ex18_rescale").checked = false;
    document.getElementById("ex18_xaxis_balls").checked = false;
    clicked = null;
    update();
  });

  /* The band is the probable error itself, at its own value — not rounded to
     the whole ball the sentence states, and not snapped to the lattice. At an
     extreme proportion it is narrower than the gap between two bars, and that
     is the fact worth seeing rather than one to be tidied away. */
  const predInterval = () => {
    if (!chk("ex18_show_prediction")) return null;
    const p = num("ex18_p"), e = probableError();
    return [Math.max(0, p - e), Math.min(1, p + e)];
  };

  const canvas = mkCanvas(450, (pl) => {
    samplingDistPlot(pl, {
      p: num("ex18_p"), s: num("ex18_s"), rescale: chk("ex18_rescale"),
      useBalls: chk("ex18_xaxis_balls"), clicked: clicked, predCI: predInterval(),
      peComb: true, clickedPE: true
    });
  }, {
    onclick: (x) => {
      const s = num("ex18_s");
      const ck = chk("ex18_xaxis_balls") ? Math.round(x) : Math.round(x * s);
      if (ck >= 0 && ck <= s) { clicked = ck; update(); }
    }
  });
  $("#ex18-plot", content).appendChild(canvas);

  function update() {
    const p = num("ex18_p"), s = num("ex18_s");
    if (clicked !== null && clicked > s) clicked = null;

    /* Peirce's remark at the head of the paragraph — that the reasoning is more
       secure at a very large or very small proportion — is a claim about the
       probable error, and the two settings the buttons offer are the two ends
       of it. Having been at both, the note says what the same drawings bought
       in each, and points at the comb where the whole range is drawn at once. */
    const secure = $("#ex18_secure_note", content);
    if (compare && Math.abs(compare.p - p) > 1e-9) {
      const now = tolerance();
      const ballsAt = (t) => `${fmt(t.e * 100, 2)} balls in 100`;
      secure.innerHTML = `<div class="note-block" style="margin:10px 0 0;">
        <p style="margin-bottom:0;">The same <strong>${bigmark(s)}</strong> drawings, moved from
        <strong>${fmt(compare.p, 3)}</strong> to <strong>${fmt(p, 3)}</strong>. The probable error was
        <strong>${ballsAt(compare.t)}</strong> there and is <strong>${ballsAt(now)}</strong> here, so the
        statement they will support has gone from <strong>${ballsPhrase(compare.t.m)} in 100</strong> to
        <strong>${ballsPhrase(now.m)} in 100</strong> &mdash; ${now.m > compare.t.m ? "a looser" : "a tighter"}
        claim off the same evidence. That is Peirce's remark at the head of the paragraph: the reasoning is
        more secure where the proportion is very large or very small. The comb under the chart is the same
        fact for every proportion at once &mdash; longest teeth in the middle, shortest at the two ends.</p>
      </div>`;
    } else secure.innerHTML = "";
    /* Peirce's sentence in the text above is the readout now — the enumerated
       list, the certainty and the tolerance are all in it — so the panel says
       only what the text cannot: which bar has been clicked. */
    if (clicked === null) {
      /* the comb only exists on the whole number line, so say where it is */
      const combNote = (chk("ex18_rescale") && !chk("ex18_xaxis_balls"))
        ? `<p class="help-text" style="margin-bottom:0;">Untick <em>Rescale</em> to see the probable error at
           every proportion, drawn under the chart.</p>` : "";
      $("#ex18_click_text", content).innerHTML = `<div class="click-info">
        <p><span class="click-cue">Click on any bar of the chart to see the exact probability.</span></p>
        ${combNote}</div>`;
    } else {
      const prob = dbinom(clicked, s, p);
      const probNum = Math.round(prob * 1000);
      const numText = clicked === 1 ? `${numberWord(clicked)} ${pluralBall(clicked)}` : `${clicked} ${pluralBall(clicked)}`;
      const ph = clicked / s;
      const e = 0.477 * Math.sqrt(2 * ph * (1 - ph) / s);
      const covers = Math.abs(ph - p) <= e + 1e-12;
      $("#ex18_click_text", content).innerHTML = `<div class="click-info">
        <p><strong>Clicked outcome: </strong>${clicked} white balls out of ${s} drawings</p>
        <p>The probability of drawing <strong>${numText}</strong> would be
          <strong>${probNum}/1000</strong> = <strong>${fmt(prob, 3)}</strong>.</p>
        <p style="margin-bottom:0;">An induction from that sample gives
          <strong style="color:#6b5c86;">${fmt(ph, 3)} &plusmn; ${fmt(e, 4)}</strong>, drawn as the bar across
          the top of the stem &mdash; ${covers ? "which covers" : "which does not cover"} the real proportion of
          ${fmt(p, 3)}. That is the probable error worked at the proportion the sample came out at, which is
          the only one an inquirer holding it would have. It belongs to the estimate, not to the height of the
          bar: the height says how often that sample turns up.</p></div>`;
    }
    drawCanvas(canvas);
  }
  update();
});
</script>
