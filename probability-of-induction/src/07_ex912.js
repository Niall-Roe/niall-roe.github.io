<script>
/* ==========================================================================
   EXAMPLE 9 — Balancing reasons
   "Take the sum of all the feelings of belief which would be produced
    separately by all the arguments pro, subtract from that the similar sum
    for arguments con, and the remainder is the feeling of belief which we
    ought to have on the whole."

   Belief intensity = log(chance). Chances multiply, so their logarithms add.
   ========================================================================*/

const LOG_BASES = { e: { div: 1, label: "ln", sym: "e" },
  "10": { div: Math.LN10, label: "log₁₀", sym: "10" },
  "2": { div: Math.LN2, label: "log₂", sym: "2" } };

registerExample("example-ex9", (box) => {
  box.appendChild(exHeader("Interactive Example: Balancing Reasons", "ex9-content"));
  const content = h(`<div id="ex9-content" class="example-content">
    <p>Peirce's thermometer of belief is the <strong>logarithm of the chance</strong>. Chances of independent
      concurrent arguments <em>multiply</em>; logarithms therefore <em>add</em>. So combining independent
      arguments becomes ordinary addition and subtraction &mdash; balancing reasons.</p>

    <div class="key-insight">
      <p style="margin-bottom:8px;"><strong>The quantities involved:</strong></p>
      <p style="margin-bottom:6px;">Probability = <span class="math">${frac("favorable", "all cases")}</span>
         &nbsp;&nbsp;&middot;&nbsp;&nbsp;
         Chance = <span class="math">${frac("favorable", "unfavorable")}</span>
         &nbsp;&nbsp;&middot;&nbsp;&nbsp;
         Intensity of belief = <span class="math">log(chance)</span></p>
      <p style="margin-bottom:0;">An even chance (1 : 1) has probability &frac12; and log-chance <strong>0</strong>:
         &ldquo;an argument having an even chance can do nothing toward re&euml;nforcing others.&rdquo;</p>
    </div>

    <div class="control-panel">
      <p style="margin-bottom:10px;"><strong>Arguments bearing on the conclusion.</strong> Enter each one's chance
        as a ratio of favorable to unfavorable cases, and say whether it tells for or against.</p>
      <div class="table-scroll"><table class="tbl" id="ex9-args"></table></div>
      <div style="margin-top:12px;">
        <button class="btn btn-primary btn-sm" data-act="add-pro">Add argument (pro)</button>
        <button class="btn btn-secondary btn-sm" data-act="add-con">Add argument (con)</button>
        <button class="btn btn-warning btn-sm" data-act="add-even">Add an even-chance argument (1 : 1)</button>
        <button class="btn btn-sm" data-act="reset">Reset to Peirce's two rules of inference</button>
      </div>
      <div id="ex9-base" style="margin-top:14px;max-width:260px;"></div>
    </div>

    <div class="plot-container" id="ex9-plot"></div>
    <div id="ex9-summary"></div>
    <div id="ex9-check"></div>
  </div>`);
  box.appendChild(content);

  const PEIRCE_DEFAULT = () => ([
    { label: "First rule of inference (81 right in 100)", num: 81, den: 19, side: "pro" },
    { label: "Second rule of inference (93 right in 100)", num: 93, den: 7, side: "pro" }
  ]);
  let args = PEIRCE_DEFAULT();

  $("#ex9-base", content).appendChild(select("ex9_base", "Logarithm base (units of belief):",
    [["e", "natural (base e)"], ["10", "base 10"], ["2", "base 2"]], "e"));

  /* contribution to the log-chance of the conclusion, in the chosen base */
  function contribution(a, base) {
    const c = a.num / a.den;
    if (!(c > 0) || !Number.isFinite(c)) return 0;
    return (a.side === "pro" ? 1 : -1) * Math.log(c) / LOG_BASES[base].div;
  }
  function totals() {
    const base = val("ex9_base") || "e";
    const contribs = args.map((a) => contribution(a, base));
    const sumPro = contribs.filter((v, i) => args[i].side === "pro").reduce((s, v) => s + v, 0);
    const sumCon = contribs.filter((v, i) => args[i].side === "con").reduce((s, v) => s + v, 0);
    const total = contribs.reduce((s, v) => s + v, 0);
    // combined chance: product of chances for, divided by chances against
    let C = 1;
    args.forEach((a) => { const c = a.num / a.den; C *= (a.side === "pro" ? c : 1 / c); });
    return { base, contribs, sumPro, sumCon, total, C, P: C / (1 + C) };
  }

  const canvas = mkCanvas(340, (pl) => {
    const t = totals();
    const rows = args.map((a, i) => ({ label: a.label, v: t.contribs[i], side: a.side }));
    const n = rows.length;
    const maxAbs = Math.max(0.4, ...rows.map((r) => Math.abs(r.v)), Math.abs(t.total)) * 1.15;
    // one lane per argument, a gap, then the total
    const lanes = n + 1.6;
    pl.setup({ xlim: [-maxAbs, maxAbs], ylim: [-0.4, lanes], mar: [4, 1, 3, 1] });
    pl.title(`Intensity of belief contributed by each argument (${LOG_BASES[t.base].label} of the chance)`, { cex: 0.95 });
    pl.axes({ ny: null, yat: [] });
    pl.abline({ v: 0, col: "#333", lwd: 1.5 });
    pl.axisLabels(`Belief intensity  (${LOG_BASES[t.base].label} chance)`, null);
    pl.clip(true);
    rows.forEach((r, i) => {
      const y = lanes - 1 - i;   // first argument at the top
      const col = r.side === "pro" ? "#4a9d5f" : "#c1523f";
      pl.rect(Math.min(0, r.v), y - 0.32, Math.max(0, r.v), y + 0.32, { col: col, border: "#333", lwd: 0.6 });
      const lab = `${r.side === "pro" ? "+" : ""}${fmt(r.v, 3)}`;
      pl.text(r.v + (r.v >= 0 ? 0.02 : -0.02) * maxAbs, y, lab,
        { cex: 0.75, adj: r.v >= 0 ? 0 : 1, font: 2 });
    });
    // the sum
    const yT = 0.15;
    pl.segments(-maxAbs, yT + 0.55, maxAbs, yT + 0.55, { col: "#999", lty: 2 });
    pl.rect(Math.min(0, t.total), yT - 0.32, Math.max(0, t.total), yT + 0.32,
      { col: t.total >= 0 ? "#1d6b34" : "#8c2f20", border: "black", lwd: 1.2 });
    pl.text(t.total + (t.total >= 0 ? 0.02 : -0.02) * maxAbs, yT,
      `total ${t.total >= 0 ? "+" : ""}${fmt(t.total, 3)}`,
      { cex: 0.8, adj: t.total >= 0 ? 0 : 1, font: 2 });
    pl.clip(false);
    pl.legend("topleft", {
      legend: ["pro", "con"], fill: ["#4a9d5f", "#c1523f"], cex: 0.8
    });
  });
  $("#ex9-plot", content).appendChild(canvas);

  function renderRows() {
    const t = totals();
    const bl = LOG_BASES[t.base].label;
    let html = `<thead><tr><th style="text-align:left;">Argument</th><th>Tells</th>
      <th>Chance (fav : unfav)</th><th>Probability</th><th>${bl} chance</th><th></th></tr></thead><tbody>`;
    args.forEach((a, i) => {
      const c = a.num / a.den;
      const p = c / (1 + c);
      html += `<tr>
        <td style="text-align:left;"><input type="text" data-i="${i}" data-f="label" value="${esc(a.label)}"
             style="width:100%;border:1px solid #ccc;border-radius:3px;padding:3px 5px;font-family:inherit;font-size:0.95em;"></td>
        <td><select data-i="${i}" data-f="side" style="padding:3px;">
              <option value="pro"${a.side === "pro" ? " selected" : ""}>for</option>
              <option value="con"${a.side === "con" ? " selected" : ""}>against</option></select></td>
        <td style="white-space:nowrap;">
          <input type="number" data-i="${i}" data-f="num" value="${a.num}" min="1" step="1" style="width:58px;padding:3px;">
          :
          <input type="number" data-i="${i}" data-f="den" value="${a.den}" min="1" step="1" style="width:58px;padding:3px;"></td>
        <td>${fmt(p, 4)}</td>
        <td style="font-weight:700;color:${t.contribs[i] >= 0 ? "#1d6b34" : "#8c2f20"};">
          ${t.contribs[i] >= 0 ? "+" : ""}${fmt(t.contribs[i], 4)}</td>
        <td><button class="btn btn-sm" data-act="del" data-i="${i}"
             ${args.length <= 1 ? "disabled" : ""}>&times;</button></td></tr>`;
    });
    html += `</tbody>`;
    $("#ex9-args", content).innerHTML = html;

    const Cbig = !Number.isFinite(t.C) || t.C > 1e6;
    $("#ex9-summary", content).innerHTML = `
      <div class="row">
        <div class="col col-6"><div class="key-insight">
          <h5 style="margin-top:0;">Balancing the reasons</h5>
          <p style="margin-bottom:6px;">Sum of arguments <strong>pro</strong>: ${fmt(t.sumPro, 4)}</p>
          <p style="margin-bottom:6px;">Sum of arguments <strong>con</strong>: ${fmt(t.sumCon, 4)}</p>
          <p style="margin-bottom:0;border-top:1px solid #d6b656;padding-top:6px;">
            Remainder &mdash; the belief we ought to have on the whole:
            <strong>${t.total >= 0 ? "+" : ""}${fmt(t.total, 4)}</strong></p>
        </div></div>
        <div class="col col-6"><div class="formula-box" style="text-align:left;font-size:1em;">
          <p style="margin-bottom:8px;">Combined chance
            <span class="math">C = ${LOG_BASES[t.base].sym}<sup>${fmt(t.total, 4)}</sup></span>
            = <strong>${Cbig ? t.C.toExponential(3) : fmt(t.C, 4)}</strong></p>
          <p style="margin-bottom:0;">Combined probability
            <span class="math">${frac("C", "1 + C")}</span> = <strong>${fmt(t.P, 6)}</strong></p>
        </div></div>
      </div>`;

    /* the cross-check: adding logs must agree with multiplying chances, and for
       Peirce's own two rules it must reproduce the formula quoted in the text */
    let prodNum = 1, prodDen = 1, allIntegerPro = true;
    args.forEach((a) => {
      if (a.side !== "pro" || !Number.isInteger(a.num) || !Number.isInteger(a.den)) allIntegerPro = false;
      if (a.side === "pro") { prodNum *= a.num; prodDen *= a.den; }
      else { prodNum *= a.den; prodDen *= a.num; }
    });
    const direct = prodNum / (prodNum + prodDen);
    let check = `<div class="note-block">
      <strong>Cross-check.</strong> Multiplying the chances directly gives
      ${prodNum} : ${prodDen}, i.e. a probability of ${frac(bigmark(prodNum), bigmark(prodNum) + " + " + bigmark(prodDen))}
      = <strong>${fmt(direct, 6)}</strong> &mdash; the same number the sum of logarithms produced above.
      Adding intensities of belief and multiplying chances are the same operation.`;
    if (allIntegerPro && args.length === 2 &&
        ((args[0].num === 81 && args[1].num === 93) || (args[0].num === 93 && args[1].num === 81))) {
      check += `<br><br>With Peirce's own two rules this is
        (93 &times; 81) / ((93 &times; 81) + (7 &times; 19)) = ${bigmark(7533)} / ${bigmark(7666)} =
        <strong>0.982650</strong> &mdash; the figure quoted earlier in the paper for two independent
        rules that agree.`;
    }
    check += `</div>`;
    $("#ex9-check", content).innerHTML = check;
    drawCanvas(canvas);
  }

  content.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el.dataset && el.dataset.f !== undefined) {
      const i = +el.dataset.i, f = el.dataset.f;
      if (f === "label") { args[i].label = el.value; drawCanvas(canvas); return; }
      const v = +el.value;
      if (f === "num" || f === "den") { if (!(v > 0)) return; args[i][f] = v; }
      renderRows();
      // keep focus where the user was typing
      const again = content.querySelector(`[data-i="${i}"][data-f="${f}"]`);
      if (again) { again.focus(); again.select && again.select(); }
    }
  });
  content.addEventListener("change", (ev) => {
    const el = ev.target;
    if (el.id === "ex9_base") return renderRows();
    if (el.dataset && el.dataset.f === "side") { args[+el.dataset.i].side = el.value; renderRows(); }
  });
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const act = b.getAttribute("data-act");
    if (act === "add-pro") args.push({ label: `Argument ${args.length + 1}`, num: 2, den: 1, side: "pro" });
    else if (act === "add-con") args.push({ label: `Argument ${args.length + 1}`, num: 2, den: 1, side: "con" });
    else if (act === "add-even") args.push({ label: "An even chance (adds nothing)", num: 1, den: 1, side: "pro" });
    else if (act === "reset") args = PEIRCE_DEFAULT();
    else if (act === "del" && args.length > 1) args.splice(+b.getAttribute("data-i"), 1);
    else return;
    renderRows();
  });

  renderRows();
});

/* ==========================================================================
   EXAMPLE 12 — Where balancing reasons breaks down
   "an excess of twenty black beans ought to produce the same degree of belief
    that the hidden bean was black, whatever the total number drawn."
   ========================================================================*/
registerExample("example-ex12", (box) => {
  box.appendChild(exHeader("Interactive Example: Twenty Black Beans, Whatever the Total", "ex12-content"));
  const content = h(`<div id="ex12-content" class="example-content">
    <p>Each black bean drawn is an independent argument that the hidden bean is black; each white one is an
      argument against. Balancing reasons adds up the black arguments and subtracts the white ones &mdash; so the
      net belief depends only on the <strong>excess</strong>, never on how many beans were drawn. The
      materialist reads the same drawings as an estimate of a proportion, and gets a different answer.</p>

    <div class="row">
      <div class="col col-4">
        <div id="ex12-controls"></div>
        <hr>
        <p style="font-size:0.9em;margin-bottom:6px;"><strong>Peirce's two cases:</strong></p>
        <button class="btn btn-primary btn-block btn-sm" data-act="first20">The first twenty beans, all black</button>
        <button class="btn btn-primary btn-block btn-sm" data-act="peirce">1,010 black and 990 white</button>
      </div>
      <div class="col col-8">
        <div id="ex12-verdicts"></div>
      </div>
    </div>

    <hr>
    <h5>Holding the excess fixed, drawing more and more beans</h5>
    <p style="font-size:0.95em;">The horizontal line is what balancing reasons says. The falling curve is what the
      proportion of the drawings says, with its probable error. They agree only at the very start.</p>
    <div class="plot-container" id="ex12-plot"></div>
    <div id="ex12-table"></div>
  </div>`);
  box.appendChild(content);

  const ctl = $("#ex12-controls", content);
  ctl.appendChild(slider("ex12_black", "Black beans drawn:", 0, 2000, 20, 1, (v) => bigmark(v)));
  ctl.appendChild(slider("ex12_white", "White beans drawn:", 0, 2000, 0, 1, (v) => bigmark(v)));
  ctl.appendChild(slider("ex12_chance", "Chance each single bean contributes:", 1.01, 3, 2, 0.01,
    (v) => `${v.toFixed(2)} : 1`));

  content.addEventListener("input", () => update());
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    if (b.getAttribute("data-act") === "first20") { setSlider("ex12_black", 20); setSlider("ex12_white", 0); }
    else if (b.getAttribute("data-act") === "peirce") { setSlider("ex12_black", 1010); setSlider("ex12_white", 990); }
    update();
  });

  /* balancing reasons: net log-chance = (b - w) * log c, so the probability is
     a logistic of the EXCESS alone. Computed in log space to survive c^2000. */
  const balancingP = (excess, c) => 1 / (1 + Math.exp(-excess * Math.log(c)));
  /* the materialist's reading: proportion observed, with Peirce's probable error */
  const probableError = (p, s) => (s > 0 ? 0.477 * Math.sqrt(2 * p * (1 - p) / s) : 0);

  const canvas = mkCanvas(400, (pl) => {
    const b = num("ex12_black"), w = num("ex12_white"), c = num("ex12_chance");
    const excess = b - w, s = b + w;
    const pBal = balancingP(excess, c);
    const sMin = Math.max(Math.abs(excess), 2), sMax = 100000;
    const u0 = Math.log10(sMin), u1 = Math.log10(sMax);
    pl.setup({ xlim: [u0, u1], ylim: [0, 1], mar: [4, 5, 3, 2] });
    const decades = [];
    for (let e = Math.floor(u0); e <= Math.ceil(u1); e++) {
      [1, 2, 5].forEach((m) => { const v = m * Math.pow(10, e); if (v >= sMin && v <= sMax) decades.push(v); });
    }
    pl.axes({ xat: decades.map((v) => Math.log10(v)), xlabels: decades.map((v) => bigmark(v)) });
    pl.box();
    pl.axisLabels("Total beans drawn (log scale), excess held fixed", "P(hidden bean is black)");
    pl.title("Same excess, more and more drawings", { cex: 1.05 });
    pl.clip(true);

    // materialist curve with its probable-error band
    const xs = [], mid = [], lo = [], hi = [];
    for (let i = 0; i < 400; i++) {
      const u = u0 + (u1 - u0) * i / 399;
      const sv = Math.pow(10, u);
      const p = 0.5 + excess / (2 * sv);
      const pe = probableError(Math.min(Math.max(p, 0), 1), sv);
      xs.push(u); mid.push(p); lo.push(Math.max(0, p - pe)); hi.push(Math.min(1, p + pe));
    }
    pl.polygon(xs.concat(xs.slice().reverse()), hi.concat(lo.slice().reverse()),
      { col: "rgba(44,127,184,0.18)" });
    pl.lines(xs, mid, { col: "#2c7fb8", lwd: 2.5 });
    pl.abline({ h: pBal, col: "#c1523f", lwd: 2.5, lty: 2 });
    pl.abline({ h: 0.5, col: "#999", lwd: 1, lty: 3 });
    if (s >= sMin) {
      const uNow = Math.log10(s);
      pl.abline({ v: uNow, col: "#666", lwd: 1, lty: 3 });
      pl.points([uNow], [s > 0 ? b / s : 0.5], { col: "#2c7fb8", cex: 1.6 });
      pl.points([uNow], [pBal], { col: "#c1523f", cex: 1.6 });
    }
    pl.clip(false);
    pl.legend("bottomright", {
      legend: ["Balancing reasons", "Proportion drawn (± probable error)", "Even chance"],
      col: ["#c1523f", "#2c7fb8", "#999"], lwd: [2.5, 2.5, 1], lty: [2, 1, 3], cex: 0.78
    });
  });
  $("#ex12-plot", content).appendChild(canvas);

  function update() {
    const b = num("ex12_black"), w = num("ex12_white"), c = num("ex12_chance");
    const s = b + w, excess = b - w;
    const pBal = balancingP(excess, c);
    const pFreq = s > 0 ? b / s : 0.5;
    const pe = probableError(pFreq, s);
    const net = excess * Math.log(c) / Math.LN10;   // reported in base 10

    const verdict = (title, colour, body) =>
      `<div style="padding:15px;border-radius:6px;border:2px solid ${colour};margin-bottom:14px;">
         <h5 style="margin-top:0;color:${colour};">${title}</h5>${body}</div>`;

    $("#ex12-verdicts", content).innerHTML =
      verdict("Balancing reasons says&hellip;", "#c1523f", `
        <p style="margin-bottom:6px;">${bigmark(b)} arguments for, ${bigmark(w)} against, each worth
          ${fmt(Math.log(c) / Math.LN10, 4)} of belief.</p>
        <p style="margin-bottom:6px;">Net belief = (${bigmark(b)} &minus; ${bigmark(w)}) &times;
          ${fmt(Math.log(c) / Math.LN10, 4)} = <strong>${fmt(net, 3)}</strong></p>
        <p style="margin-bottom:0;font-size:1.1em;">P(hidden bean is black) =
          <strong>${pBal > 0.999999 ? "&gt; 0.999999" : fmt(pBal, 6)}</strong>
          &nbsp;<em style="font-size:0.85em;">&mdash; depends only on the excess of ${bigmark(excess)}</em></p>`) +
      verdict("The proportion drawn says&hellip;", "#2c7fb8", `
        <p style="margin-bottom:6px;">${bigmark(b)} black out of ${bigmark(s)} drawings.</p>
        <p style="margin-bottom:6px;">Observed proportion black =
          ${frac(bigmark(b), bigmark(s))} = <strong>${s > 0 ? fmt(pFreq, 4) : "&mdash;"}</strong>,
          probable error &plusmn;${fmt(pe, 4)}</p>
        <p style="margin-bottom:0;font-size:1.1em;">P(hidden bean is black) =
          <strong>${s > 0 ? fmt(pFreq, 4) : "&mdash;"}</strong>
          &nbsp;<em style="font-size:0.85em;">&mdash; depends on the whole record</em></p>`);

    /* the two cases Peirce actually names, side by side */
    const rowFor = (bb, ww) => {
      const ex = bb - ww, ss = bb + ww;
      const pb = balancingP(ex, c), pf = ss > 0 ? bb / ss : 0.5;
      const cur = (bb === b && ww === w) ? ' style="background-color:#fff3cd;font-weight:700;"' : "";
      return `<tr${cur}><td>${bigmark(bb)}</td><td>${bigmark(ww)}</td><td>${bigmark(ss)}</td>
        <td>${bigmark(ex)}</td><td>${pb > 0.999999 ? "&gt;0.999999" : fmt(pb, 6)}</td><td>${fmt(pf, 4)}</td></tr>`;
    };
    $("#ex12-table", content).innerHTML = `
      <div class="table-scroll"><table class="tbl">
        <thead><tr><th>Black</th><th>White</th><th>Total drawn</th><th>Excess</th>
          <th>Balancing reasons</th><th>Proportion drawn</th></tr></thead>
        <tbody>${rowFor(20, 0)}${rowFor(1010, 990)}${(b !== 20 || w !== 0) && (b !== 1010 || w !== 990) ? rowFor(b, w) : ""}</tbody>
      </table></div>
      <div class="note-block"><strong>The absurdity.</strong> Both of Peirce's cases have an excess of twenty,
        so balancing reasons assigns them exactly the same belief. But twenty black beans out of twenty is a
        different piece of evidence from 1,010 out of 2,000 &mdash; the second is a near-certain report that the
        bag is half black, which is to say that the hidden bean is an even chance. A rule that cannot tell these
        two records apart is not measuring the evidence.</div>`;
    drawCanvas(canvas);
  }
  update();
});
</script>
