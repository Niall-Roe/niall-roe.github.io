<script>
/* ==========================================================================
   EXAMPLE 14 — Binomial expansion (w + b)^n
   ========================================================================*/
const totalOutcomes = (w, b, n) => Math.pow(w + b, n);
const calcFrequency = (n, k, w, b) => choose(n, k) * Math.pow(w, k) * Math.pow(b, n - k);

registerExample("example-ex14", (box) => {
  const content = h(`<div>
    <h4>Interactive Demonstration: Binomial Expansion</h4>
    <p>Explore how the binomial expansion determines the relative frequencies of different outcomes when drawing
      balls from an urn. The expansion <span class="math">(w + b)<sup>n</sup></span> gives us all possible outcomes
      and their frequencies.</p>
    <div class="row">
      <div class="col col-4">
        <div id="ex14-controls"></div>
        <hr>
        <div id="ex14-check"></div>
        <hr>
        <button class="btn btn-primary" id="ex14_reset">Reset to Peirce's example</button>
      </div>
      <div class="col col-8">
        <div id="ex14_summary"></div>
        <div id="ex14-plot"></div>
        <div id="ex14_click_text"></div>
      </div>
    </div>
    <hr>
    <div id="ex14_table"></div>
  </div>`);
  box.appendChild(content);

  let clickedK = null;

  const ctl = $("#ex14-controls", content);
  ctl.appendChild(slider("ex14_white_weight", "White balls ratio (w):", 1, 10, 1, 1));
  ctl.appendChild(slider("ex14_black_weight", "Black balls ratio (b):", 1, 10, 2, 1));
  ctl.appendChild(slider("ex14_n_draws", "Number of draws (n):", 2, 8, 4, 1));
  $("#ex14-check", content).appendChild(checkbox("ex14_show_sequences", "Show individual sequences", false));
  content.addEventListener("input", () => update());
  content.addEventListener("change", () => update());
  $("#ex14_reset", content).addEventListener("click", () => {
    setSlider("ex14_white_weight", 1); setSlider("ex14_black_weight", 2); setSlider("ex14_n_draws", 4);
    document.getElementById("ex14_show_sequences").checked = false;
    update();
  });

  const canvas = mkCanvas(400, (pl) => {
    const w = num("ex14_white_weight"), b = num("ex14_black_weight"), n = num("ex14_n_draws");
    const ks = Array.from({ length: n + 1 }, (_, i) => i);
    const freqs = ks.map((k) => calcFrequency(n, k, w, b));
    const maxF = Math.max(...freqs);
    pl.setup({ xlim: [0.5, n + 1.5], ylim: [0, maxF * 1.2], mar: [4, 5, 3, 2] });
    pl.grid({ nx: null });
    pl.axes({ xat: ks.map((k) => k + 1), xlabels: ks.map(String) });
    pl.box();
    pl.axisLabels("Number of white balls", "Frequency (number of sets)");
    pl.title("Binomial Expansion: Frequency Distribution", { cex: 1.1 });
    ks.forEach((k) => {
      const col = clickedK === k ? "purple" : "#2c7fb8";
      pl.rect(k + 1 - 0.42, 0, k + 1 + 0.42, freqs[k], { col: col, border: "white" });
    });
  }, {
    onclick: (x) => {
      const n = num("ex14_n_draws");
      const k = Math.round(x) - 1;
      if (k >= 0 && k <= n) { clickedK = k; update(); }
    }
  });
  $("#ex14-plot", content).appendChild(canvas);

  function update() {
    const w = num("ex14_white_weight"), b = num("ex14_black_weight"), n = num("ex14_n_draws");
    if (clickedK !== null && clickedK > n) clickedK = null;
    const total = totalOutcomes(w, b, n);

    $("#ex14_summary", content).innerHTML =
      `<p><strong>Setup: </strong>The granary has <strong>${w}:${b}</strong> ratio of white to black balls.
        Drawing <strong>${n}</strong> balls with replacement yields <strong>${bigmark(total)}</strong>
        total possible outcomes (weighted by frequency).</p>`;

    if (clickedK === null) {
      $("#ex14_click_text", content).innerHTML = `<div class="click-info">
        <p><em>Click on any bar to see the detailed calculation for that outcome.</em></p>
        <p>Suppose <strong>${numberWord(w)}</strong> ${pluralBall(w)} out of <strong>${w + b}</strong> is white
          and the rest black, and that <strong>${numberWord(n)}</strong> balls are drawn.</p></div>`;
    } else {
      const k = clickedK;
      const combinations = choose(n, k);
      const weight = Math.pow(w, k) * Math.pow(b, n - k);
      const frequency = calcFrequency(n, k, w, b);
      const probability = frequency / total;
      $("#ex14_click_text", content).innerHTML = `<div class="click-info">
        <p><strong>Clicked outcome: </strong>${k} white balls out of ${n} draws</p>
        <p><strong>Number of ways to arrange: </strong>${combinations} (combinations of ${k} white in ${n} positions)</p>
        <p><strong>Weight per sequence: </strong>${w}^${k} x ${b}^${n - k} = ${weight}</p>
        <p><strong>Total frequency (number of sets): </strong>${combinations} x ${weight} = <strong>${frequency}</strong></p>
        <p><strong>Probability: </strong>${frequency} / ${total} = <strong>${fmt(probability, 4)}</strong></p>
        <p>This means that if we judge by these <strong>${n}</strong> balls, <strong>${frequency}</strong> times out of
          <strong>${total}</strong> we would find the proportion to be <strong>${fmt(k / n, 3)}</strong> (${k}/${n}).</p>
      </div>`;
    }

    let html = `<div class="table-scroll"><table class="tbl"><thead><tr>
      <th>White Balls (k)</th><th>Combinations C(n,k)</th><th>Weight (w^k x b^(n-k))</th>
      <th>Frequency (Sets)</th><th>Probability</th><th>Proportion (k/n)</th></tr></thead><tbody>`;
    for (let k = 0; k <= n; k++) {
      const combinations = choose(n, k);
      const weight = Math.pow(w, k) * Math.pow(b, n - k);
      const frequency = combinations * weight;
      const style = clickedK === k ? ' style="background-color: rgba(128,0,128,0.15);"' : "";
      html += `<tr${style}><td>${k}</td><td>${combinations}</td><td>${weight}</td>` +
        `<td><strong>${frequency}</strong></td><td>${fmt(frequency / total, 4)}</td>` +
        `<td>${fmt(k / n, 3)} (${k}/${n})</td></tr>`;
    }
    html += `<tr style="font-weight:bold;background-color:#e9ecef;"><td colspan="3">Total</td>
      <td>${total}</td><td>1.0000</td><td>-</td></tr></tbody></table></div>`;

    let seqHtml = "";
    const showSeq = chk("ex14_show_sequences");
    if (showSeq && n <= 5) {
      seqHtml = "<h5 style='margin-top:30px;'>Individual Sequences (like Peirce's table):</h5>";
      for (let k = n; k >= 0; k--) {
        const frequency = calcFrequency(n, k, w, b);
        const combinations = choose(n, k);
        const weight = Math.pow(w, k) * Math.pow(b, n - k);
        seqHtml += `<p><strong>${k} white, ${n - k} black</strong> - ${combinations} arrangement(s) x ${weight} sets each = ${frequency} total sets:</p>`;
        if (combinations <= 20) {
          seqHtml += "<div style='margin-left:20px;margin-bottom:15px;'>";
          combinationsOf(n, k).forEach((positions) => {
            const seq = Array(n).fill("b");
            positions.forEach((pos) => { seq[pos - 1] = "w"; });
            for (let r = 1; r <= Math.min(weight, 10); r++) {
              seqHtml += `<span class="sequence-box">${seq.join("")}</span> `;
            }
            if (weight > 10) seqHtml += ` ... (${weight - 10} more)`;
            seqHtml += "<br/>";
          });
          seqHtml += "</div>";
        } else {
          seqHtml += "<div style='margin-left:20px;margin-bottom:15px;'><em>(Too many combinations to display individually)</em></div>";
        }
      }
    } else if (showSeq && n > 5) {
      seqHtml = "<p style='margin-top:20px;'><em>Individual sequences are only shown for 5 or fewer draws.</em></p>";
    }
    $("#ex14_table", content).innerHTML = html + seqHtml;
    drawCanvas(canvas);
  }

  // R's combn(n, k, simplify = FALSE): all k-subsets of 1..n, in the same order
  function combinationsOf(n, k) {
    const out = [];
    if (k === 0) return [[]];
    const rec = (start, acc) => {
      if (acc.length === k) { out.push(acc.slice()); return; }
      for (let i = start; i <= n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
    };
    rec(1, []);
    return out;
  }

  update();
});

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
    pl.abline({ v: useBalls ? predCI[0] * s : predCI[0], lty: 3, lwd: 2, col: "darkgreen" });
    pl.abline({ v: useBalls ? predCI[1] * s : predCI[1], lty: 3, lwd: 2, col: "darkgreen" });
  }
  ks.forEach((k, i) => { if (probs[i] > 0) pl.segments(xv[i], 0, xv[i], probs[i], { lwd: 3, col: opts.stemCol || "black" }); });
  pl.points(xv, probs, { cex: 1.2, col: opts.stemCol || "black" });
  const xs2 = [], ys2 = [];
  for (let i = 0; i < 1000; i++) {
    const x = xlim[0] + (xlim[1] - xlim[0]) * i / 999;
    xs2.push(x); ys2.push(dnorm(x, mu, sdCurve) * heightScale);
  }
  pl.lines(xs2, ys2, { col: "darkgreen", lwd: 2, lty: 2 });
  pl.abline({ v: useBalls ? p * s : p, lty: 2, lwd: 2, col: "red" });
  if (clicked !== null && clicked !== undefined) {
    const cx = useBalls ? clicked : clicked / s;
    const cp = dbinom(clicked, s, p);
    pl.segments(cx, 0, cx, cp, { lwd: 5, col: "purple" });
    pl.points([cx], [cp], { cex: 1.5, col: "purple" });
  }
  pl.clip(false);
  pl.legend("topright", {
    legend: ["Exact binomial", "Normal approx", "True p"],
    col: ["black", "darkgreen", "red"], lwd: [3, 2, 2], lty: [1, 2, 2], bty: "n", bg: "n", cex: 0.75
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
  ctl.appendChild(slider("ex15_p", "True proportion (p):", 0.001, 0.999, 0.333, 0.001, (v) => v.toFixed(3)));
  ctl.appendChild(slider("ex15_s", "Sample size (s):", 2, 500, 4, 1));
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
    <h4>Interactive Demonstration: Peirce's Formula for Probable Error</h4>
    <p>If the true proportion of white balls is <strong>p</strong> and we draw <strong>s</strong> balls, the error
      will be within certain bounds with known frequencies.</p>
    <p>The error bound is: <span class="math">e = constant &times; &radic;<span style="border-top:1px solid;padding-top:1px;">${frac("2p(1-p)", "s")}</span></span></p>
    <p><em>Try changing <strong>s</strong> to see how the distribution changes.</em></p>
    <div class="row">
      <div class="col col-4"><div id="ex17-controls"></div></div>
      <div class="col col-8"><div id="ex17_table"></div></div>
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
  ctl.appendChild(slider("ex17_p", "True proportion (p):", 0.001, 0.999, 0.5, 0.001, (v) => v.toFixed(3)));
  ctl.appendChild(slider("ex17_s", "Number of balls drawn (s):", 10, 1000, 100, 10));
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
    ks.forEach((k, i) => { if (probs[i] > 0) pl.segments(phat[i], 0, phat[i], probs[i], { lwd: 3, col: "#999999" }); });
    pl.points(phat, probs, { cex: 1.2, col: "#999999" });
    const xs = [], ys = [];
    for (let i = 0; i < 500; i++) { const x = i / 499; xs.push(x); ys.push(dnorm(x, p, se) * delta); }
    pl.lines(xs, ys, { col: "#2c7fb8", lwd: 2, lty: 2 });
    pl.abline({ v: p, col: "orange", lwd: 3 });
    if (current) {
      const obsProb = dbinom(current.whiteBalls, s, p);
      pl.segments(current.pHat, 0, current.pHat, obsProb, { lwd: 5, col: "purple" });
      pl.points([current.pHat], [obsProb], { cex: 1.5, col: "purple" });
      const ciCol = current.containsP ? "#27ae60" : "#e74c3c";
      pl.segments(current.ciLower, 0, current.ciUpper, 0, { col: ciCol, lwd: 5 });
      pl.points([current.pHat], [0], { col: "blue", cex: 2 });
    } else {
      pl.text((xlim[0] + xlim[1]) / 2, maxP * 0.9, "Draw a sample to see\nthe observed outcome", { cex: 1.1, col: "#808080" });
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
    pl.abline({ h: df[0].p, col: "orange", lwd: 2 });
    df.forEach((d, i) => {
      pl.segments(i + 1, d.ciLower, i + 1, d.ciUpper, { col: d.containsP ? "#27ae60" : "#e74c3c", lwd: 1.5 });
      pl.points([i + 1], [d.pHat], { cex: 0.5, col: "blue" });
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
    const p = num("ex17_p"), s = num("ex17_s");
    const seFactor = Math.sqrt(2 * p * (1 - p) / s);
    let html = `<div class="table-scroll"><table class="tbl"><thead><tr>
      <th>Confidence Level</th><th>Constant</th><th>Error Bound</th></tr></thead><tbody>`;
    CONSTANTS.forEach((c, i) => {
      const hl = sel === CONF_IDS[i] ? ' class="highlighted-row-90"' : "";
      html += `<tr${hl}><td>${CONF_LABELS[i]}</td><td>${fmt(c, 3)}</td><td>+/-${fmt(c * seFactor, 4)}</td></tr>`;
    });
    if (sel === "custom") {
      const cc = qnorm((1 + num("ex17_custom_conf") / 100) / 2) / Math.SQRT2;
      html += `<tr class="highlighted-row-90"><td>${num("ex17_custom_conf")}% (custom)</td>
        <td>${fmt(cc, 3)}</td><td>+/-${fmt(cc * seFactor, 4)}</td></tr>`;
    }
    html += "</tbody></table></div>";
    $("#ex17_table", content).innerHTML = html;

    if (current) {
      const col = current.containsP ? "#27ae60" : "#e74c3c";
      const txt = current.containsP ? "Contains p" : "Does not contain p";
      $("#ex17_current_result", content).innerHTML =
        `<div style="padding:15px;background-color:#ecf0f1;border-radius:5px;">
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
  const content = h(`<div>
    <h4>Interactive Demonstration: Testing if a Difference is Real or Due to Chance</h4>
    <p>Using the formula <span class="math">e = c &times; &radic;<span style="border-top:1px solid;padding-top:1px;">${frac("2p(1-p)", "s")}</span></span>
      we calculate the probable error, then compare the observed difference against multiples of this error.</p>
    <div class="row"><div class="col col-12">
      <div id="ex16-p-slider"></div>
      <p><em>Peirce assumes p = 1/2 for this calculation.</em></p>
    </div></div>
    <hr>
    <div class="row">
      <div class="col col-6"><div class="group-box"><h5><strong>Group 1</strong></h5><div id="ex16-g1"></div></div></div>
      <div class="col col-6"><div class="group-box"><h5><strong>Group 2</strong></h5><div id="ex16-g2"></div></div></div>
    </div>
    <hr>
    <div class="row">
      <div class="col col-4"><button class="btn btn-primary btn-block" id="ex16_reset">Reset to 1870 Census</button></div>
      <div class="col col-4"><button class="btn btn-warning btn-block" id="ex16_chance">Example: Due to Chance</button></div>
      <div class="col col-4"><div id="ex16-rescale"></div></div>
    </div>
    <hr>
    <h5>Combined Comparison</h5>
    <div id="ex16-show-errors"></div>
    <div id="ex16-conf-slider"></div>
    <div id="ex16-plot"></div>
    <div id="ex16_odds_display"></div>
    <hr>
    <div id="ex16_results"></div>
  </div>`);
  box.appendChild(content);

  $("#ex16-p-slider", content).appendChild(
    // range shifted to 0.01–0.99 so that Peirce's p = 1/2 is exactly reachable
    // with the 0.01 step (0.001 + k*0.01 never lands on 0.5)
    slider("ex16_p_assumed", "Assumed true proportion (p):", 0.01, 0.99, 0.5, 0.01, (v) => v.toFixed(3)));
  $("#ex16-g1", content).appendChild(numberInput("ex16_p1", "Observed proportion:", 0.5082, 0.001, 0.999, 0.0001));
  $("#ex16-g1", content).appendChild(numberInput("ex16_n1", "Sample size:", 1000000, 1, 10000000, 1));
  $("#ex16-g2", content).appendChild(numberInput("ex16_p2", "Observed proportion:", 0.4977, 0.001, 0.999, 0.0001));
  $("#ex16-g2", content).appendChild(numberInput("ex16_n2", "Sample size:", 150000, 1, 10000000, 1));
  $("#ex16-rescale", content).appendChild(checkbox("ex16_rescale", "Rescale chart (zoom)", true));
  $("#ex16-show-errors", content).appendChild(checkbox("ex16_show_errors", "Show probable error bounds", true));
  const confSlider = slider("ex16_confidence", "Confidence level (%):", 50, 100, 50, 1);
  $("#ex16-conf-slider", content).appendChild(confSlider);

  content.addEventListener("input", () => update());
  content.addEventListener("change", () => update());
  $("#ex16_reset", content).addEventListener("click", () => {
    document.getElementById("ex16_p1").value = 0.5082;
    document.getElementById("ex16_n1").value = 1000000;
    document.getElementById("ex16_p2").value = 0.4977;
    document.getElementById("ex16_n2").value = 150000;
    setSlider("ex16_p_assumed", 0.5);
    update();
  });
  $("#ex16_chance", content).addEventListener("click", () => {
    document.getElementById("ex16_p1").value = 0.505;
    document.getElementById("ex16_n1").value = 5000;
    document.getElementById("ex16_p2").value = 0.495;
    document.getElementById("ex16_n2").value = 5000;
    setSlider("ex16_p_assumed", 0.5);
    update();
  });

  function calc() {
    const p1 = num("ex16_p1"), n1 = num("ex16_n1"), p2 = num("ex16_p2"), n2 = num("ex16_n2");
    const pa = num("ex16_p_assumed");
    const confidence = num("ex16_confidence");
    const constant = qnorm(0.5 + confidence / 200) / Math.SQRT2;
    const pe1 = constant * Math.sqrt(2 * pa * (1 - pa) / n1);
    const pe2 = constant * Math.sqrt(2 * pa * (1 - pa) / n2);
    const diffObs = Math.abs(p1 - p2), sumErr = pe1 + pe2;
    const seD = Math.sqrt(pa * (1 - pa) / n1 + pa * (1 - pa) / n2);
    const z = diffObs / seD;
    const pv = 2 * pnorm(-Math.abs(z));
    return { p1, p2, n1, n2, pe1, pe2, diffObs, sumErr, ratio: diffObs / sumErr,
      se1: Math.sqrt(pa * (1 - pa) / n1), se2: Math.sqrt(pa * (1 - pa) / n2),
      z, pv, odds: pv > 0 ? 1 / pv : Infinity, pa, constant, confidence };
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
    pl.lines(xr, y1, { col: "#2c7fb8", lwd: 2 });
    pl.lines(xr, y2, { col: "#d95f02", lwd: 2 });
    pl.abline({ v: c.p1, col: "#2c7fb8", lwd: 2, lty: 2 });
    pl.abline({ v: c.p2, col: "#d95f02", lwd: 2, lty: 2 });
    const ya = maxY * 0.5;
    pl.arrows(c.p2, ya, c.p1, ya, { code: 3, angle: 20, length: 8, lwd: 2, col: "darkred" });
    pl.text((c.p1 + c.p2) / 2, ya * 1.1, `Difference: ${fmt(c.diffObs, 4)}`, { col: "darkred", cex: 0.9, font: 2 });
    pl.clip(false);
    pl.legend("topright", { legend: ["Group 1", "Group 2"], col: ["#2c7fb8", "#d95f02"], lwd: [2, 2], cex: 0.9 });
  });
  $("#ex16-plot", content).appendChild(canvas);

  function update() {
    confSlider.style.display = chk("ex16_show_errors") ? "" : "none";
    const c = calc();
    const oddsText = Number.isFinite(c.odds)
      ? (c.odds > 1e9
        ? `Such a result would happen only once out of ${c.odds.toExponential(1)} censuses.`
        : `Such a result would happen only once out of ${bigmark(c.odds)} censuses.`)
      : "Such a result would essentially never happen by chance alone.";
    $("#ex16_odds_display", content).innerHTML =
      `<div style="padding:15px;background-color:#fff3cd;border:1px solid #ffc107;border-radius:5px;margin-top:15px;">
        <p><strong>Long-run frequency: </strong>${oddsText}</p></div>`;

    const conclusion = c.ratio >= 4.77
      ? `<div style="padding:15px;background-color:#d4edda;border:1px solid #c3e6cb;border-radius:5px;">
           <p><strong>The difference is REAL (systematic), not due to chance.</strong></p></div>`
      : c.ratio >= 2.5
      ? `<div style="padding:15px;background-color:#fff3cd;border:1px solid #ffc107;border-radius:5px;">
           <p><strong>The difference is likely REAL, though not as certain.</strong></p></div>`
      : `<div style="padding:15px;background-color:#f8d7da;border:1px solid #f5c6cb;border-radius:5px;">
           <p><strong>The difference may be attributed to CHANCE.</strong></p></div>`;

    $("#ex16_results", content).innerHTML = `<div class="result-box">
      <h4>Analysis Results</h4>
      <h5>Step 1: Calculate Probable Errors</h5>
      <p>For Group 1 (n = ${bigmark(c.n1)}): e1 = ${fmt(c.pe1, 4)}</p>
      <p>For Group 2 (n = ${bigmark(c.n2)}): e2 = ${fmt(c.pe2, 4)}</p>
      <hr>
      <h5>Step 2: Test Against Error Intervals</h5>
      <p><strong>Observed difference: </strong>${fmt(c.diffObs, 4)}</p>
      <p><strong>Sum of probable errors: </strong>${fmt(c.sumErr, 4)}</p>
      <p><strong>Multiple of error: </strong>${fmt(c.ratio, 1)} x (e1 + e2)</p>
      <hr>
      <h5>Conclusion</h5>${conclusion}</div>`;
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   EXAMPLE 18 — Extreme probabilities are more secure
   ========================================================================*/
registerExample("example-ex18", (box) => {
  const content = h(`<div>
    <h4>Interactive Demonstration: Extreme Probabilities Are More Secure</h4>
    <p>Explore how the sampling distribution changes when the true proportion is very small or very large.
      Click on any bar to see the exact probability.</p>
    <div class="row">
      <div class="col col-4">
        <div id="ex18-controls"></div>
        <hr>
        <div id="ex18-pred"></div>
        <hr>
        <button class="btn btn-primary" id="ex18_reset">Reset to Peirce's example</button>
      </div>
      <div class="col col-8">
        <div id="ex18-plot"></div>
        <div id="ex18_click_text"></div>
      </div>
    </div>
  </div>`);
  box.appendChild(content);

  let clicked = null;
  const ctl = $("#ex18-controls", content);
  ctl.appendChild(slider("ex18_p", "True proportion (p):", 0.001, 0.999, 0.01, 0.001, (v) => v.toFixed(3)));
  ctl.appendChild(slider("ex18_s", "Sample size (s):", 5, 500, 100, 1));
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

  function update() {
    predSlider.style.display = chk("ex18_show_prediction") ? "" : "none";
    const p = num("ex18_p"), s = num("ex18_s");
    if (clicked !== null && clicked > s) clicked = null;
    const pf = decimalToFraction(p);
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
