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
  pl.setup({ xlim: xlim, ylim: [0, maxP * 1.3], mar: [4, 5, 3, 2] });
  pl.axes({});
  pl.box();
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
  const content = h(`<div>
    <h4>Interactive Demonstration: Sampling from an Urn</h4>
    <p>Explore the binomial distribution for sampling with replacement.</p>
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
  const ex15Counts = () => {
    const p = num("ex15_p"), s = Math.round(num("ex15_s"));
    const pf = decimalToFraction(p);
    const w = pf.num, b = pf.den - pf.num;
    const total = Math.pow(w + b, s);
    const exact = Number.isFinite(total) && total <= 1e12;
    const rank = Array.from({ length: s + 1 }, (_, k) => ({
      k: k,
      c: exact ? choose(s, k) * Math.pow(w, k) * Math.pow(b, s - k)
               : Math.round(dbinom(k, s, p) * 1000)
    })).sort((a, b2) => b2.c - a.c);
    return { pf: pf, s: s, exact: exact, total: exact ? total : 1000, rank: rank };
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
        <p><em>Click on any bar to see the exact probability.</em></p>
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
  const content = h(`<div>
    <div class="row">
      <div class="col col-12"><div id="ex17-controls"></div></div>
    </div>
    <hr>
    <p><strong>Test with Simulation:</strong></p>
    <div class="row">
      <div class="col col-4">
        <button class="btn btn-primary btn-block" id="ex17_simulate_single">Draw Single Sample</button>
        <button class="btn btn-success btn-block" id="ex17_simulate_100">Draw 100 Samples</button>
        <button class="btn btn-danger btn-block" id="ex17_reset">Reset History</button>
      </div>
      <div class="col col-8"><div id="ex17_current_result"></div></div>
    </div>
    <br>
    <div id="ex17-combined-plot"></div>
    <hr>
    <p><strong>History of Last 100 Samples:</strong></p>
    <div id="ex17-history-plot"></div>
  </div>`);
  box.appendChild(content);

  let history = [];
  let current = null;

  const ctl = $("#ex17-controls", content);
  ctl.appendChild(slider("ex17_p", "True proportion (p):", 0.001, 0.999, 0.5, 0.001, (v) => v.toFixed(3), "k1"));
  ctl.appendChild(slider("ex17_s", "Number of balls drawn (s):", 10, 1000, 100, 10, null, "k2"));
  ctl.appendChild(checkbox("ex17_rescale", "Rescale charts", false));
  ctl.appendChild(h("<hr>"));
  ctl.appendChild(select("ex17_confidence", "Select confidence level:",
    [["custom", "Custom"], ["50", "50% (half the time)"], ["90", "90% (9 times out of 10)"],
     ["99", "99% (99 times out of 100)"], ["99.9", "99.9% (999 times out of 1,000)"],
     ["99.99", "99.99% (9,999 times out of 10,000)"],
     ["99.99999999", "9,999,999,999 out of 10,000,000,000"]], "90"));
  const customBox = slider("ex17_custom_conf", "Custom confidence level (%):", 50, 100, 95, 1);
  ctl.appendChild(customBox);

  content.addEventListener("input", () => update());
  content.addEventListener("change", () => update());

  // the six rows of the table as printed in the paper; the last is the one
  // Peirce appeals to for the census example ("only once out of 10,000,000,000")
  const CONSTANTS = [0.477, 1.163, 1.821, 2.328, 2.751, 4.77];
  const CONF_IDS = ["50", "90", "99", "99.9", "99.99", "99.99999999"];
  const CONF_LABELS = ["50% (half the time)", "90% (9 times out of 10)", "99% (99 times out of 100)",
    "99.9% (999 times out of 1,000)", "99.99% (9,999 times out of 10,000)",
    "99.99999999% (9,999,999,999 times out of 10,000,000,000)"];

  function getConstant() {
    const sel = val("ex17_confidence");
    if (sel === "custom") return qnorm((1 + num("ex17_custom_conf") / 100) / 2) / Math.SQRT2;
    return CONSTANTS[CONF_IDS.indexOf(sel)];
  }

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
    ex17Table.addEventListener("click", (ev) => {
      const tr = ev.target.closest("tr[data-conf]");
      if (!tr || !document.getElementById("ex17_confidence")) return;
      const sel = document.getElementById("ex17_confidence");
      sel.value = tr.getAttribute("data-conf");
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      refreshLive("example-ex17");
    });
  }

  registerLive("example-ex17", {
    pEq: () => ` = ${fmt(num("ex17_p"), 3)}`,
    sEq: () => ` = ${bigmark(num("ex17_s"))}`,
    e0: ex17Row(0), e1: ex17Row(1), e2: ex17Row(2),
    e3: ex17Row(3), e4: ex17Row(4), e5: ex17Row(5),
    customLabel: () => {
      const c = num("ex17_custom_conf");
      return `${fmt(c, 0)} times out of 100 within`;
    },
    customConst: () => fmt(qnorm((1 + num("ex17_custom_conf") / 100) / 2) / Math.SQRT2, 3),
    eCustom: () => ex17Bound(qnorm((1 + num("ex17_custom_conf") / 100) / 2) / Math.SQRT2)
  }, {
    onRefresh: (on) => {
      if (!ex17Table) return;
      ex17Table.classList.toggle("ex17-live", on);
      const sel = on ? val("ex17_confidence") : null;
      $$("tr[data-conf]", ex17Table).forEach((tr) =>
        tr.classList.toggle("conf-active", tr.getAttribute("data-conf") === sel));
    }
  });

  const combinedCanvas = mkCanvas(400, (pl) => {
    const p = num("ex17_p"), s = num("ex17_s"), rescale = chk("ex17_rescale");
    const ks = Array.from({ length: s + 1 }, (_, i) => i);
    const phat = ks.map((k) => k / s);
    const probs = ks.map((k) => dbinom(k, s, p));
    const maxP = Math.max(...probs);
    const se = Math.sqrt(p * (1 - p) / s), delta = 1 / s;
    const xlim = rescale ? [Math.max(0, p - 5 * se), Math.min(1, p + 5 * se)] : [0, 1];
    pl.setup({ xlim: xlim, ylim: [0, maxP * 1.3], mar: [4, 5, 3, 2] });
    pl.axes({}); pl.box();
    pl.axisLabels("p̂", "Probability mass");
    pl.title("Sampling Distribution of p-hat", { cex: 1.1 });
    pl.clip(true);
    ks.forEach((k, i) => { if (probs[i] > 0) pl.segments(phat[i], 0, phat[i], probs[i], { lwd: 3, col: "#a8adb4" }); });
    pl.points(phat, probs, { cex: 1.2, col: "#a8adb4" });
    const xs = [], ys = [];
    for (let i = 0; i < 500; i++) { const x = i / 499; xs.push(x); ys.push(dnorm(x, p, se) * delta); }
    pl.lines(xs, ys, { col: "#2f6f9f", lwd: 2, lty: 2 });
    pl.abline({ v: p, col: "#c79a45", lwd: 3 });
    if (current) {
      const obsProb = dbinom(current.whiteBalls, s, p);
      pl.segments(current.pHat, 0, current.pHat, obsProb, { lwd: 5, col: "#8a7aa8" });
      pl.points([current.pHat], [obsProb], { cex: 1.5, col: "#8a7aa8" });
      const ciCol = current.containsP ? "#4a7c59" : "#b0563f";
      pl.segments(current.ciLower, 0, current.ciUpper, 0, { col: ciCol, lwd: 5 });
      pl.points([current.pHat], [0], { col: PAL.accent, cex: 2 });
    } else {
      pl.text((xlim[0] + xlim[1]) / 2, maxP * 0.9, "Draw a sample to see\nthe observed outcome", { cex: 1.1, col: "#9a9a9a" });
    }
    pl.clip(false);
  });
  $("#ex17-combined-plot", content).appendChild(combinedCanvas);

  const historyCanvas = mkCanvas(400, (pl) => {
    if (!history.length) { blankPlot(pl, "Draw samples to see\nhistory accumulate here"); return; }
    const df = history.slice(-100);
    const rescale = chk("ex17_rescale");
    let ylim = [0, 1];
    if (rescale) {
      const vals = df.flatMap((d) => [d.ciLower, d.ciUpper, d.p]);
      const lo = Math.min(...vals), hi = Math.max(...vals), d = hi - lo;
      ylim = [lo - 0.1 * d, hi + 0.1 * d];
    }
    const nContain = df.filter((d) => d.containsP).length;
    pl.setup({ xlim: [0.5, df.length + 0.5], ylim: ylim, mar: [4, 5, 3, 2] });
    pl.axes({}); pl.box();
    pl.axisLabels("Sample Number", "Proportion");
    pl.title(`History of Confidence Intervals (${nContain} out of ${df.length} contain true p)`, { cex: 1.05 });
    pl.clip(true);
    pl.abline({ h: df[0].p, col: "#c79a45", lwd: 2 });
    df.forEach((d, i) => {
      pl.segments(i + 1, d.ciLower, i + 1, d.ciUpper, { col: d.containsP ? "#4a7c59" : "#b0563f", lwd: 1.5 });
      pl.points([i + 1], [d.pHat], { cex: 0.5, col: PAL.accent });
    });
    pl.clip(false);
  });
  $("#ex17-history-plot", content).appendChild(historyCanvas);

  function drawSample() {
    const p = num("ex17_p"), s = num("ex17_s");
    const constant = getConstant();
    const seFactor = Math.sqrt(2 * p * (1 - p) / s);
    const margin = constant * seFactor;
    const whiteBalls = rbinom(s, p);
    const pHat = whiteBalls / s;
    const rec = { pHat: pHat, ciLower: pHat - margin, ciUpper: pHat + margin,
      containsP: (p >= pHat - margin && p <= pHat + margin), p: p };
    return { rec: rec, whiteBalls: whiteBalls, s: s };
  }
  function confLevel() {
    const sel = val("ex17_confidence");
    return sel === "custom" ? num("ex17_custom_conf") : parseFloat(sel);
  }

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

  function update() {
    const sel = val("ex17_confidence");
    customBox.style.display = sel === "custom" ? "" : "none";
    /* The table of levels and bounds is Peirce's own, printed above; it fills
       in there rather than being repeated here. */

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
    drawCanvas(combinedCanvas); drawCanvas(historyCanvas);
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
    <div id="ex16_results"></div>
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
    pl.clip(false);
    pl.legend("topright", { legend: ["Group 1", "Group 2"], col: ["#2f6f9f", "#b8703a"], lwd: [2, 2], cex: 0.9 });
  });
  $("#ex16-plot", content).appendChild(canvas);

  function update() {
    confSlider.style.display = chk("ex16_show_errors") ? "" : "none";
    const c = calc();
    $("#ex16_results", content).innerHTML = `<div class="result-box">
      <h4>Analysis Results</h4>
      <h5>Step 1: Calculate Probable Errors</h5>
      <p>For Group 1 (n = ${bigmark(c.n1)}): e1 = ${fmt(c.q1, 5)}</p>
      <p>For Group 2 (n = ${bigmark(c.n2)}): e2 = ${fmt(c.q2, 5)}</p>
      <hr>
      <h5>Step 2: Test Against Error Intervals</h5>
      <p><strong>Observed difference: </strong>${fmt(c.diffObs, 4)}</p>
      <p><strong>Sum of probable errors: </strong>${fmt(c.sumErr, 4)}</p>
      <p><strong>Multiple of error: </strong>${fmt(c.ratio, 1)} x (e1 + e2)</p>
      </div>`;
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 18 — Extreme probabilities are more secure
   ========================================================================*/
registerExample("example-ex18", (box) => {
  const content = h(`<div>
    <div class="row">
      <div class="col col-4">
        <div id="ex18-controls"></div>
        <div id="ex18-pred"></div>
        <button class="btn btn-primary btn-sm" id="ex18_reset">Reset to Peirce's example</button>
      </div>
      <div class="col col-8">
        <div id="ex18-plot"></div>
        <div id="ex18_click_text"></div>
      </div>
    </div>
    <div id="ex18_peirce"></div>
  </div>`);
  box.appendChild(content);

  let clicked = null;
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

  registerLive("example-ex18", {
    rate: () => {
      const p = num("ex18_p");
      return p <= 0.5 ? `one white ball in ${bigmark(1 / p)}`
                      : `${bigmark(p * 100)} white balls in 100`;
    },
    s: () => bigmark(num("ex18_s")),
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
  pred.appendChild(checkbox("ex18_show_prediction", "Show prediction interval", true));
  const predSlider = slider("ex18_pred_cl", "Prediction confidence level:", 0.50, 0.99, 0.50, 0.01, (v) => v.toFixed(2));
  pred.appendChild(predSlider);

  content.addEventListener("input", (ev) => { if (ev.target.id === "ex18_p") stickySnap("ex18_p"); update(); });
  content.addEventListener("change", () => update());
  $("#ex18_reset", content).addEventListener("click", () => {
    setSlider("ex18_p", 0.01); setSlider("ex18_s", 100);
    document.getElementById("ex18_rescale").checked = true;
    document.getElementById("ex18_xaxis_balls").checked = false;
    document.getElementById("ex18_show_prediction").checked = true;
    setSlider("ex18_pred_cl", 0.50);
    update();
  });

  const predInterval = () => {
    if (!chk("ex18_show_prediction")) return null;
    const p = num("ex18_p"), s = num("ex18_s");
    return binomTestCI(Math.round(p * s), s, num("ex18_pred_cl"));
  };

  const canvas = mkCanvas(450, (pl) => {
    samplingDistPlot(pl, {
      p: num("ex18_p"), s: num("ex18_s"), rescale: chk("ex18_rescale"),
      useBalls: chk("ex18_xaxis_balls"), clicked: clicked, predCI: predInterval()
    });
  }, {
    onclick: (x) => {
      const s = num("ex18_s");
      const ck = chk("ex18_xaxis_balls") ? Math.round(x) : Math.round(x * s);
      if (ck >= 0 && ck <= s) { clicked = ck; update(); }
    }
  });
  $("#ex18-plot", content).appendChild(canvas);

  /* Peirce's own paragraph with the figures filled in from the sliders.
     "Not in error by more than one ball in den" is a tolerance on the
     proportion, |k/s - p| <= 1/den, which at his own settings (p = 1/100,
     s = 100) is |k - 1| <= 1, so k of 0, 1 or 2 — the three probabilities he
     lists that carry most of the weight. */
  function peirceParagraph(p, s) {
    const pf = decimalToFraction(p);
    // Peirce names the ball for the first two and then only the number
    const balls = (k) => (k === 0 ? "no white ball" : k === 1 ? "one white ball" : numberWord(k));
    /* He enumerates from none upward because his proportion is tiny. Follow the
       likely counts instead, which lands on his 0 to 5 at his own settings and
       stays informative when the proportion is not extreme. */
    const start = Math.max(0, Math.round(p * s) - 2);
    const terms = [];
    for (let k = start; k < start + 6 && k <= s; k++) {
      terms.push(`that of drawing ${balls(k)} would be ${Math.round(dbinom(k, s, p) * 1000)}/1000`);
    }
    const first = terms.shift().replace("that of drawing", "The probability of drawing");

    /* The tolerance is Peirce's own concrete claim, one ball in a hundred, so
       it stays fixed at 0.01 of the proportion however p is set. That is what
       makes the figure worth watching: at his 1 in 100 it comes to 0.921, and
       at an even proportion it collapses, which is the security he is pointing
       to in extreme values. */
    const tol = 0.01 * s;
    let certain = 0;
    for (let k = Math.max(0, Math.ceil(p * s - tol)); k <= Math.min(s, Math.floor(p * s + tol)); k++) {
      certain += dbinom(k, s, p);
    }
    const subject = pf.num === 1 ? "one white ball" : `${pf.num} white balls`;
    return `<div class="note-block">
      Thus, suppose there were in reality ${subject} in <strong>${bigmark(pf.den)}</strong> in a certain urn,
      and we were to judge of the number by <strong>${bigmark(s)}</strong> drawings.
      ${first}; ${terms.join("; ")}, etc.
      Thus we should be tolerably certain of not being in error by more than one ball in 100
      (<strong>${fmt(certain, 3)}</strong>).</div>`;
  }

  function update() {
    predSlider.style.display = chk("ex18_show_prediction") ? "" : "none";
    const p = num("ex18_p"), s = num("ex18_s");
    if (clicked !== null && clicked > s) clicked = null;
    const pf = decimalToFraction(p);
    $("#ex18_peirce", content).innerHTML = peirceParagraph(p, s);
    if (clicked === null) {
      let predText = "";
      const ci = predInterval();
      if (ci) {
        const margin = Math.max(Math.abs(p - ci[0]), Math.abs(ci[1] - p)) * s;
        predText = `<p>We should be tolerably certain of not being in error by more than
          <strong>${fmt(margin, 1)}</strong> ${pluralBall(Math.round(margin))} in <strong>${pf.den}</strong>.</p>`;
      }
      $("#ex18_click_text", content).innerHTML =
        `<div class="click-info"><p><em>Click on any bar to see the exact probability.</em></p>${predText}</div>`;
    } else {
      const prob = dbinom(clicked, s, p);
      const probNum = Math.round(prob * 1000);
      const numText = clicked === 1 ? `${numberWord(clicked)} ${pluralBall(clicked)}` : `${clicked} ${pluralBall(clicked)}`;
      $("#ex18_click_text", content).innerHTML = `<div class="click-info">
        <p><strong>Clicked outcome: </strong>${clicked} white balls out of ${s} drawings</p>
        <p>The probability of drawing <strong>${numText}</strong> would be
          <strong>${probNum}/1000</strong> = <strong>${fmt(prob, 3)}</strong>.</p></div>`;
    }
    drawCanvas(canvas);
  }
  update();
});
</script>
