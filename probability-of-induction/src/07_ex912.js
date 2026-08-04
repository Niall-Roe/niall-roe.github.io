<script>
/* ==========================================================================
   EXAMPLE 9 — Balancing reasons
   "Take the sum of all the feelings of belief which would be produced
    separately by all the arguments pro, subtract from that the similar sum
    for arguments con, and the remainder is the feeling of belief which we
    ought to have on the whole."

   Belief intensity = log(chance). Chances multiply, so their logarithms add.
   ========================================================================*/

/* which way an argument tells, in colour — shared by 9 and 12 */
const PRO_COL = "#6b9c78", CON_COL = "#b0563f";

const LOG_BASES = { e: { div: 1, label: "ln", sym: "e" },
  "10": { div: Math.LN10, label: "log₁₀", sym: "10" },
  "2": { div: Math.LN2, label: "log₂", sym: "2" } };

registerExample("example-ex9", (box) => {
  box.appendChild(exHeader("Interactive Example: Balancing Reasons", "ex9-content"));
  const content = h(`<div id="ex9-content" class="example-content">
    <div class="ex-buttonbar">
      <button class="btn btn-success btn-sm" data-act="add-pro">Add an argument for</button>
      <button class="btn btn-danger btn-sm" data-act="add-con">Add an argument against</button>
      <button class="btn btn-warning btn-sm" data-act="add-even">Add an even chance</button>
      <button class="btn btn-sm" data-act="reset">Peirce&rsquo;s two rules</button>
    </div>
    <div id="ex9-base" style="max-width:250px;margin-bottom:12px;"></div>
    <div id="ex9-stage"></div>
    <div id="ex9-even"></div>
    <div class="plot-container" id="ex9-plot"></div>
    <div id="ex9-summary"></div>
    <div id="ex9-check"></div>
  </div>`);
  box.appendChild(content);

  /* An argument has one number and no side. Which way it tells is not a
     separate fact about it: it is the sign of the logarithm of its chance, and
     an argument right less than half the time is an argument for ~C. Keeping a
     side alongside p meant the two could disagree, which is what made the
     slider flip and jump when it crossed the middle. */
  const PEIRCE_DEFAULT = () => ([{ p: 0.81 }, { p: 0.93 }]);
  let args = PEIRCE_DEFAULT();

  /* Peirce states each rule as so many right in a hundred, so that is what the
     slider moves; the chance is read off it as favorable : unfavorable. */
  const favOf = (a) => Math.round(a.p * 100);
  const unfavOf = (a) => 100 - Math.round(a.p * 100);
  const chanceOf = (a) => favOf(a) / unfavOf(a);

  /* An argument is named for what it tells, in the notation the rest of the
     page uses: for the conclusion, A_n -> C; against it, A_n -> ~C. */
  const tellsFor = (a) => favOf(a) >= 50;
  const argName = (i) =>
    `<span class="math">A</span><sub>${i + 1}</sub> &rarr; ` +
    `<span class="math">${tellsFor(args[i]) ? "C" : "~C"}</span>`;
  /* the chance stated in the direction the argument actually tells */
  const chanceText = (a) => (tellsFor(a)
    ? `${favOf(a)} : ${unfavOf(a)}` : `${unfavOf(a)} : ${favOf(a)}`);

  $("#ex9-base", content).appendChild(select("ex9_base", "Units of belief:",
    [["e", "natural logarithm (base e)"], ["10", "base 10"], ["2", "base 2"]], "e"));

  function contribution(a, base) {
    const c = chanceOf(a);
    if (!(c > 0) || !Number.isFinite(c)) return 0;
    return Math.log(c) / LOG_BASES[base].div;   // negative below a half, of itself
  }
  function totals() {
    const base = val("ex9_base") || "e";
    const contribs = args.map((a) => contribution(a, base));
    const sumPro = contribs.filter((v) => v > 0).reduce((s, v) => s + v, 0);
    const sumCon = contribs.filter((v) => v < 0).reduce((s, v) => s + v, 0);
    const total = contribs.reduce((s, v) => s + v, 0);
    let C = 1;
    args.forEach((a) => { C *= chanceOf(a); });
    return { base, contribs, sumPro, sumCon, total, C, P: C / (1 + C) };
  }

  /* Both columns share one chance scale and one belief scale, so that the two
     arguments can be read against each other rather than each against itself. */
  function scales() {
    const base = val("ex9_base") || "e";
    let c = 2, l = 0.5;
    args.forEach((a) => {
      const ch = chanceOf(a);
      if (Number.isFinite(ch)) c = Math.max(c, ch);
      const lg = Math.abs(Math.log(ch) / LOG_BASES[base].div);
      if (Number.isFinite(lg)) l = Math.max(l, lg);
    });
    /* The chance ruler climbs by decades because chances do. The belief ruler
       is a logarithm already, so a half-unit step keeps it snug instead of
       jumping to the next decade and leaving the markers huddled at the middle. */
    return { cMax: niceMax(c), lMax: Math.max(1, Math.ceil(l * 2) / 2) };
  }


  /* ==========================================================================
     Stage one: two arguments, each set out the way the logarithm of the chance
     was set out earlier — a probability slider, the chance it comes to, and the
     belief that is its logarithm — with the two side by side so that the pair
     can be compared before they are added. The belief line is the axis the bar
     chart below is drawn on, so the third row of each column is literally the
     bar that argument contributes.
     ========================================================================*/
  function renderPair(host) {
    host.innerHTML = `<div class="row">${args.map((a, i) => `
      <div class="col col-6">
        <div class="ex9-arg-head">
          <span class="ex9-arg-name" id="ex9-name-${i}"></span>
          <span class="ex9-side" id="ex9-side-${i}"></span>
          ${args.length > 1 ? `<button class="btn btn-sm" data-act="del" data-i="${i}">&times;</button>` : ""}
        </div>
        <div class="nl-grid nl-compact">
          <div class="nl-label"><span class="math">P</span></div>
          <div class="nl-track">
            <input type="range" data-i="${i}" data-f="p" min="0.01" max="0.99" step="0.01" value="${a.p}">
            <div class="nl-line nl-under" id="ex9-linep-${i}"></div>
          </div>
          <div class="nl-value" id="ex9-vp-${i}"></div>

          <div class="nl-label"><span class="math">Ch</span></div>
          <div class="nl-track"><div class="nl-line" id="ex9-linec-${i}"></div></div>
          <div class="nl-value" id="ex9-vc-${i}"></div>

          <div class="nl-label"><span class="math">log Ch</span></div>
          <div class="nl-track"><div class="nl-line" id="ex9-linel-${i}"></div></div>
          <div class="nl-value" id="ex9-vl-${i}"></div>
        </div>
      </div>`).join("")}</div>`;

    args.forEach((a, i) => {
      nlDraw($(`#ex9-linep-${i}`, content), Array.from({ length: 11 }, (_, k) => ({
        pos: k / 10, major: k === 0 || k === 5 || k === 10,
        label: k === 5 ? "&frac12;" : null
      })), false);
    });
    lastScale = null;
  }

  /* ==========================================================================
     Stage two: three arguments or more. The columns will not fit side by side,
     so the same quantities go into a row apiece — which is also the form in
     which a list of reasons is actually balanced.
     ========================================================================*/
  function renderTable(host) {
    const bl = LOG_BASES[totals().base].label;
    let html = `<div class="table-scroll"><table class="tbl" id="ex9-args">
      <thead><tr>
        <th style="text-align:left;">Argument</th><th>Tells</th>
        <th>Right about <span class="math">C</span> in 100</th>
        <th><span class="math">P(A&rarr;C)</span></th>
        <th><span class="math">Ch(A&rarr;C)</span></th>
        <th style="white-space:nowrap;"><span class="math">${bl} Ch(A&rarr;C)</span></th><th></th></tr></thead><tbody>`;
    args.forEach((a, i) => {
      html += `<tr>
        <td style="text-align:left;white-space:nowrap;" id="ex9-name-${i}"></td>
        <td id="ex9-side-${i}"></td>
        <td style="min-width:140px;">
          <input type="range" data-i="${i}" data-f="p" min="0.01" max="0.99" step="0.01" value="${a.p}">
          <div class="nl-line nl-under nl-rowticks" id="ex9-linep-${i}"></div>
          <div class="ex9-fav" id="ex9-fav-${i}"></div></td>
        <td id="ex9-vp-${i}"></td>
        <td id="ex9-vc-${i}"></td>
        <td id="ex9-vl-${i}"></td>
        <td><button class="btn btn-sm" data-act="del" data-i="${i}"
             ${args.length <= 1 ? "disabled" : ""}>&times;</button></td></tr>`;
    });
    html += `</tbody></table></div>`;
    host.innerHTML = html;
    args.forEach((a, i) => {
      nlDraw($(`#ex9-linep-${i}`, content), [{ pos: 0.5, major: true, label: "&frac12;" }], false);
    });
    lastScale = null;
  }

  const stageIsPair = () => args.length <= 2;
  function renderStage() {
    const host = $("#ex9-stage", content);
    if (stageIsPair()) renderPair(host); else renderTable(host);
    refreshDerived();
  }

  /* ---- the derived cells, moved rather than rebuilt while a slider drags -- */
  let lastScale = null;

  function drawScaleLines(sc) {
    const key = `${sc.cMax}|${sc.lMax}|${args.length}`;
    if (key === lastScale) return;
    lastScale = key;
    args.forEach((a, i) => {
      const cl = $(`#ex9-linec-${i}`, content);
      if (cl) {
        const ticks = Array.from({ length: 11 }, (_, k) => ({
          pos: k / 10, major: k === 0 || k === 5 || k === 10,
          label: (k === 0 || k === 5 || k === 10)
            ? (Number.isInteger(k / 10 * sc.cMax) ? bigmark(k / 10 * sc.cMax) : fmt(k / 10 * sc.cMax, 1))
            : null
        }));
        if (1 / sc.cMax >= 0.06) {
          const at = ticks.find((t) => Math.abs(t.pos * sc.cMax - 1) < 1e-9);
          const evens = '1<br><span class="nl-sub">evens</span>';
          if (at) at.label = evens; else ticks.push({ pos: 1 / sc.cMax, major: true, label: evens });
        }
        nlDraw(cl, ticks, true);
      }
      const ll = $(`#ex9-linel-${i}`, content);
      if (ll) {
        nlDraw(ll, Array.from({ length: 9 }, (_, k) => {
          const v = -sc.lMax + k * (sc.lMax / 4);
          const major = k === 0 || k === 4 || k === 8;
          return { pos: k / 8, major: major,
            label: k === 4 ? '0<br><span class="nl-sub">adds nothing</span>'
                 : major ? (v > 0 ? "+" : "") + fmt(v, 1) : null };
        }), true);
      }
    });
  }

  function refreshDerived() {
    const t = totals();
    const sc = scales();
    drawScaleLines(sc);

    args.forEach((a, i) => {
      const fav = favOf(a), unfav = unfavOf(a), c = fav / unfav;
      const v = t.contribs[i];
      const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

      set(`ex9-name-${i}`, argName(i));
      set(`ex9-side-${i}`, `<span style="color:${v >= 0 ? PRO_COL : CON_COL};">${
        tellsFor(a) ? "tells for" : "tells against"}</span>`);
      set(`ex9-vp-${i}`, `<strong>${fmt(c / (1 + c), 3)}</strong>`);
      set(`ex9-vc-${i}`, `<strong>${chanceText(a)}</strong>`);
      set(`ex9-vl-${i}`, `<strong style="color:${v >= 0 ? PRO_COL : CON_COL};">${v >= 0 ? "+" : ""}${fmt(v, 3)}</strong>`);
      set(`ex9-fav-${i}`, `${fav} right in 100`);

      /* The slider takes the colour of the way its argument tells, and crosses
         over at the midpoint: that is the cue that something happens there. */
      const sl = $(`input[data-i="${i}"][data-f="p"]`, content);
      if (sl) sl.style.accentColor = v >= 0 ? PRO_COL : CON_COL;

      const cd = $(`#ex9-linec-${i} .nl-dot`, content);
      if (cd) { cd.style.left = `${Math.min(1, c / sc.cMax) * 100}%`; cd.style.backgroundColor = PAL.accent; }
      const ld = $(`#ex9-linel-${i} .nl-dot`, content);
      if (ld) {
        ld.style.left = `${Math.max(0, Math.min(1, (v + sc.lMax) / (2 * sc.lMax))) * 100}%`;
        ld.style.backgroundColor = v >= 0 ? PRO_COL : CON_COL;
      }
    });

    const even = args.some((a) => favOf(a) === 50);
    $("#ex9-even", content).innerHTML = even
      ? `<div class="note-block">An even chance is 1 : 1, and the logarithm of 1 is
         <strong>0</strong>: &ldquo;an argument having an even chance can do nothing toward
         re&euml;nforcing others.&rdquo;</div>`
      : "";

    renderSummary(t);
    drawCanvas(canvas);
  }

  const canvas = mkCanvas(300, (pl) => {
    const t = totals();
    const rows = args.map((a, i) => ({ v: t.contribs[i], i: i }));
    const n = rows.length;
    const maxAbs = Math.max(0.4, ...rows.map((r) => Math.abs(r.v)), Math.abs(t.total)) * 1.15;
    const lanes = n + 1.6;
    pl.setup({ xlim: [-maxAbs, maxAbs], ylim: [-0.4, lanes], mar: [4, 1, 3, 1] });
    pl.title(`Balancing the reasons (${LOG_BASES[t.base].label} of the chance)`, { cex: 0.95 });
    pl.axes({ ny: null, yat: [] });
    pl.abline({ v: 0, col: "#3a3f45", lwd: 1.5 });
    pl.axisLabels(`Belief intensity  (${LOG_BASES[t.base].label} chance)`, null);
    pl.clip(true);
    rows.forEach((r, i) => {
      const y = lanes - 1 - i;
      const col = r.v >= 0 ? PRO_COL : CON_COL;
      pl.rect(Math.min(0, r.v), y - 0.32, Math.max(0, r.v), y + 0.32, { col: col, border: "#3a3f45", lwd: 0.6 });
      pl.text(-maxAbs * 0.97, y, `A${r.i + 1}`, { cex: 0.75, adj: 0, col: "#575d66" });
      pl.text(r.v + (r.v >= 0 ? 0.02 : -0.02) * maxAbs, y,
        `${r.v >= 0 ? "+" : ""}${fmt(r.v, 3)}`, { cex: 0.75, adj: r.v >= 0 ? 0 : 1, font: 2 });
    });
    const yT = 0.15;
    pl.segments(-maxAbs, yT + 0.55, maxAbs, yT + 0.55, { col: "#a8adb4", lty: 2 });
    pl.rect(Math.min(0, t.total), yT - 0.32, Math.max(0, t.total), yT + 0.32,
      { col: t.total >= 0 ? "#4a7c59" : "#8a4331", border: PAL.inkFaint, lwd: 1.2 });
    pl.text(t.total + (t.total >= 0 ? 0.02 : -0.02) * maxAbs, yT,
      `total ${t.total >= 0 ? "+" : ""}${fmt(t.total, 3)}`,
      { cex: 0.8, adj: t.total >= 0 ? 0 : 1, font: 2 });
    pl.clip(false);
  });
  $("#ex9-plot", content).appendChild(canvas);

  function renderSummary(t) {
    const Cbig = !Number.isFinite(t.C) || t.C > 1e6;
    $("#ex9-summary", content).innerHTML = `
      <div class="row">
        <div class="col col-6"><div class="key-insight">
          <p style="margin-bottom:6px;">Sum of the arguments <strong>for</strong>: ${fmt(t.sumPro, 4)}</p>
          <p style="margin-bottom:6px;">Sum of the arguments <strong>against</strong>: ${fmt(Math.abs(t.sumCon), 4)}
            &nbsp;<span style="font-size:0.85em;">(subtracted)</span></p>
          <p style="margin-bottom:0;border-top:1px solid #c9a961;padding-top:6px;">
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

    let prodNum = 1, prodDen = 1, allPro = true;
    args.forEach((a) => {
      const fav = favOf(a), unfav = unfavOf(a);
      if (a.side !== "pro") allPro = false;
      if (a.side === "pro") { prodNum *= fav; prodDen *= unfav; }
      else { prodNum *= unfav; prodDen *= fav; }
    });
    const direct = prodNum / (prodNum + prodDen);
    let check = `<div class="note-block">
      <strong>Cross-check.</strong> Multiplying the chances directly gives
      ${bigmark(prodNum)} : ${bigmark(prodDen)}, i.e. a probability of ${frac(bigmark(prodNum), bigmark(prodNum) + " + " + bigmark(prodDen))}
      = <strong>${fmt(direct, 6)}</strong> &mdash; the same number the sum of logarithms produced above.`;
    const favs = args.map(favOf);
    if (allPro && args.length === 2 && favs.includes(81) && favs.includes(93)) {
      check += `<br><br>With Peirce's own two rules this is
        (93 &times; 81) / ((93 &times; 81) + (7 &times; 19)) = ${bigmark(7533)} / ${bigmark(7666)} =
        <strong>0.982650</strong> &mdash; the figure quoted earlier in the paper for two independent
        rules that agree.`;
    }
    check += `</div>`;
    $("#ex9-check", content).innerHTML = check;
  }

  content.addEventListener("input", (ev) => {
    const el = ev.target;
    if (!el.dataset || el.dataset.f !== "p") return;
    args[+el.dataset.i].p = +el.value;
    refreshDerived();
  });
  content.addEventListener("change", (ev) => {
    if (ev.target.id === "ex9_base") renderStage();
  });
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const act = b.getAttribute("data-act");
    if (act === "add-pro") args.push({ p: 0.67 });
    else if (act === "add-con") args.push({ p: 0.33 });
    else if (act === "add-even") args.push({ p: 0.5 });
    else if (act === "reset") args = PEIRCE_DEFAULT();
    else if (act === "del" && args.length > 1) args.splice(+b.getAttribute("data-i"), 1);
    else return;
    renderStage();
  });

  renderStage();
});

/* ==========================================================================
   NEW EXAMPLE (27) — the direction of the intimate connection

   Peirce's kernel sentence says the conjoint probability of the arguments must
   be intimately connected with the just degree of belief. It does not say the
   connection runs both ways, and the whole of the following section turns on
   its not doing so. The panel is built to be tried in the wrong direction: the
   reader is given a belief of their own to move, and nothing moves with it.
   ========================================================================*/
registerExample("example-ex27", (box) => {
  box.appendChild(exHeader("Interactive Example: Which Way the Connection Runs", "ex27-content"));
  const content = h(`<div id="ex27-content" class="example-content">
    <p class="ed-note">But note the nature of this intimate connection. When the probabilities of several
      independent arguments pertaining to <span class="math">C</span> are known, they can be
      combined to produce the proper (though unit-less) intensity of belief one ought to have in
      <span class="math">C</span>. However, one&rsquo;s current degree of belief never acts as an
      input to this method, and <span class="example-trigger" data-toggle="example-ex34">cannot be used to determine any
      probability</span>. Further, someone who
      is stubborn, sceptical, over enthusiastic, or otherwise biased, may not adjust their belief
      to that &ldquo;proper&rdquo; level.</p>
    <p class="help-text">Move the probability sliders to see how they impact the proper intensity of belief.
      Move the Your Belief slider to see how much it impacts any worldly probability.</p>

    <div class="nl-grid nl-compact" id="ex27-args"></div>

    <hr>

    <div class="nl-grid nl-compact">
      <div class="nl-label">Proper Intensity of Belief</div>
      <div class="nl-track k3"><div class="nl-line" id="ex27-line-proper"></div></div>
      <div class="nl-value k3" id="ex27-val-proper"></div>

      <div class="nl-label">Your Intensity of Belief</div>
      <div class="nl-track k4">
        <input type="range" id="ex27_belief" min="-6" max="6" step="0.01" value="0">
        <div class="nl-line nl-under" id="ex27-line-yours"></div>
      </div>
      <div class="nl-value k4" id="ex27-val-yours"></div>
    </div>

    <div class="ex-buttonbar">
      <span class="ex27-lead">Update your belief</span>
      <button class="btn btn-sm" data-mode="proper">to its proper state</button>
      <button class="btn btn-sm" data-mode="stubborn">stubbornly</button>
      <button class="btn btn-sm" data-mode="keen">enthusiastically</button>
    </div>

    <div id="ex27-readout"></div>
  </div>`);
  box.appendChild(content);

  const LMAX = 6;                       // both belief lines run -6 to +6, in nats
  let args = [{ p: 0.81 }, { p: 0.93 }];
  let mode = "proper";                  // something moves from the first drag
  let lastProper = 0;                   // the evidence as it stood a moment ago
  let belief = 0;                       // held here, not read back off the slider
  let applying = false;                 // guards the programmatic slider write

  const favOf = (a) => Math.round(a.p * 100);
  const chanceOf = (a) => favOf(a) / (100 - favOf(a));
  const properBelief = () => args.reduce((t, a) => t + Math.log(chanceOf(a)), 0);

  const beliefTicks = () => Array.from({ length: 9 }, (_, k) => {
    const v = -LMAX + k * (LMAX / 4);
    const major = k === 0 || k === 4 || k === 8;
    return { pos: k / 8, major: major,
      label: k === 4 ? '0<br><span class="nl-sub">even chance</span>'
           : major ? (v > 0 ? "+" : "") + fmt(v, 0) : null };
  });

  /* the arguments, in the same form as the balancing-reasons panel */
  $("#ex27-args", content).innerHTML = args.map((a, i) => `
    <div class="nl-label"><span class="math">A</span><sub>${i + 1}</sub> &rarr; <span class="math">C</span></div>
    <div class="nl-track k1">
      <input type="range" data-i="${i}" min="0.05" max="0.95" step="0.01" value="${a.p}">
      <div class="nl-line nl-under" id="ex27-argticks-${i}"></div>
    </div>
    <div class="nl-value k1" id="ex27-argval-${i}"></div>`).join("");
  args.forEach((a, i) => nlDraw($(`#ex27-argticks-${i}`, content),
    [{ pos: 0.5, major: true, label: "&frac12;" }], false));

  nlDraw($("#ex27-line-proper", content), beliefTicks(), true);
  /* The lower line carries plain ticks: the scale is already named on the line
     directly above it, and repeating "even chance" here only crowds it. */
  nlDraw($("#ex27-line-yours", content), beliefTicks().map((t) =>
    ({ ...t, label: t.pos === 0.5 ? "0" : t.label })), false);

  /* The rate is applied to how far the evidence has just moved, not to the gap
     that is standing open. Applied to the gap it would close on the proper
     value however slow the rate, because a drag fires a hundred times and a
     hundred quarter-steps arrive in the same place as one whole one; all three
     dispositions then look alike. Applied to the change, a stubborn belief
     moves two thirds as far as the evidence does and falls further behind the
     more the evidence moves, which is the thing worth seeing. */
  const RATE = { proper: 1, stubborn: 0.66, keen: 1.33 };

  /* The belief is kept here as a real number and only written to the slider,
     never read back from it. A drag fires a hundred times, and rounding each
     step to the slider's own resolution would bias the accumulation badly —
     enough, at a stubborn two thirds, to move it further than the evidence. */
  function applyStep() {
    const proper = properBelief();
    belief = mode === "proper" ? proper : belief + RATE[mode] * (proper - lastProper);
    belief = Math.max(-LMAX, Math.min(LMAX, belief));
    lastProper = proper;
    applying = true;
    setSlider("ex27_belief", belief);
    applying = false;
  }

  content.addEventListener("input", (ev) => {
    if (ev.target.id === "ex27_belief") {
      if (applying) return;             // our own write, already accounted for
      belief = +ev.target.value;        // the reader has taken hold of it
    } else if (ev.target.dataset && ev.target.dataset.i !== undefined) {
      args[+ev.target.dataset.i].p = +ev.target.value;
      applyStep();                      // the evidence moved; the belief follows
    }
    update();
  });

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-mode]");
    if (!b) return;
    mode = b.getAttribute("data-mode");
    lastProper = properBelief();        // a change of disposition is not evidence
    markMode();
    if (mode === "proper") applyStep();
    update();
  });

  function markMode() {
    $$("[data-mode]", content).forEach((x) =>
      x.classList.toggle("is-active", x.getAttribute("data-mode") === mode));
  }

  function update() {
    const proper = properBelief();
    const yours = belief;

    args.forEach((a, i) => {
      const el = document.getElementById(`ex27-argval-${i}`);
      if (el) el.innerHTML = `<strong>${fmt(a.p, 2)}</strong>
        <span class="nl-sub">${favOf(a)} : ${100 - favOf(a)}</span>`;
    });

    const dot = $("#ex27-line-proper .nl-dot", content);
    if (dot) dot.style.left = `${Math.max(0, Math.min(1, (proper + LMAX) / (2 * LMAX))) * 100}%`;

    /* Neither reading carries a probability. Both are intensities of belief,
       which is a unit-less quantity, and printing a probability against one was
       quietly suggesting it could be read back out. */
    $("#ex27-val-proper", content).innerHTML =
      `<strong>${proper >= 0 ? "+" : ""}${fmt(proper, 3)}</strong>`;
    /* No probability is shown beside this one. The number cannot be turned back
       into one: the arguments it was built from do not share a probability
       space, so there is nothing for it to be a proportion of. */
    $("#ex27-val-yours", content).innerHTML =
      `<strong>${yours >= 0 ? "+" : ""}${fmt(yours, 2)}</strong>`;

    const gap = yours - proper;
    const settled = Math.abs(gap) < 0.03;
    $("#ex27-readout", content).innerHTML = `<div class="key-insight">
      <p style="margin-bottom:8px;">The arguments give a proper intensity of
        <strong>${proper >= 0 ? "+" : ""}${fmt(proper, 3)}</strong>. Yours stands at
        <strong>${yours >= 0 ? "+" : ""}${fmt(yours, 2)}</strong>${settled
          ? ", which is just what you ought to believe."
          : `, ${fmt(Math.abs(gap), 2)} ${gap > 0 ? "above" : "below"} it.`}</p>
    </div>`;
  }
  markMode();
  lastProper = properBelief();
  applyStep();                          // start where the arguments put it
  update();
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

    <div class="ex-buttonbar">
      <button class="btn btn-primary btn-sm" data-act="first20">The first twenty beans, all black</button>
      <button class="btn btn-primary btn-sm" data-act="peirce">1,010 black and 990 white</button>
    </div>
    <div class="row">
      <div class="col col-6" id="ex12-ctl-n"></div>
      <div class="col col-6" id="ex12-ctl-q"></div>
    </div>

    <div class="row">
      <div class="col col-6">
        <div id="ex12-verdict-mbr"></div>
        <div class="plot-container" id="ex12-units"></div>
      </div>
      <div class="col col-6">
        <div id="ex12-verdict-prop"></div>
        <div class="mode-tabs" style="margin-bottom:12px;">
          <button class="mode-tab active" data-view="path">The drawings</button>
          <button class="mode-tab" data-view="gauss">The distribution</button>
        </div>
        <div class="plot-container" id="ex12-band"></div>
      </div>
    </div>

    <div id="ex12-force"></div>
    <div id="ex12-table"></div>
  </div>`);
  box.appendChild(content);

  /* The draw is what the reader sets: how many beans, and what proportion of
     them came up black. Black and white counts follow from those two, which is
     the way the drawing is actually described in the paragraph. */
  $("#ex12-ctl-n", content).appendChild(
    slider("ex12_n", "Beans drawn:", 2, 2000, 20, 1, (v) => bigmark(v), "k1"));
  $("#ex12-ctl-q", content).appendChild(
    slider("ex12_q", "Proportion of them black:", 0, 1, 1, 0.001, (v) => v.toFixed(3), "k2"));

  const NB = () => Math.round(num("ex12_n") * num("ex12_q"));
  const NW = () => Math.round(num("ex12_n")) - NB();

  let forceSaid = false;
  const chanceSlider = slider("ex12_chance", "Chance each single bean contributes:",
    1.01, 3, 2, 0.01, (v) => `${v.toFixed(2)} : 1`, "k4");
  /* The slider is not in the document until update() has built the block that
     holds it, and the first update() reads it before that. Missing, num() gives
     nothing, log(0) is -Infinity, and the panel opened saying every bean was
     worth minus infinity of belief until something was touched. */
  const CH = () => { const v = num("ex12_chance"); return v > 1 ? v : 2; };

  content.addEventListener("input", () => update());
  content.addEventListener("click", (ev) => {
    const tab = ev.target.closest(".mode-tab");
    if (tab) {
      $$(".mode-tab", content).forEach((x) => x.classList.toggle("active", x === tab));
      const wantPath = tab.getAttribute("data-view") === "path";
      pathCanvas.style.display = wantPath ? "" : "none";
      gaussCanvas.style.display = wantPath ? "none" : "";
      requestAnimationFrame(redrawAll);
      return;
    }
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "first20") { setSlider("ex12_n", 20); setSlider("ex12_q", 1); }
    else if (a === "peirce") { setSlider("ex12_n", 2000); setSlider("ex12_q", 0.505); }
    else if (a === "fromdraw") {
      forceSaid = true;
      /* the best candidate for the force of a single drawing, and the point is
         that taking it makes the force a fact about the whole record */
      const bb = NB(), ww = NW();
      setSlider("ex12_chance", ww > 0 && bb > 0 ? Math.min(3, Math.max(1.01, bb / ww)) : 3);
    }
    update();
  });

  /* balancing reasons: net log-chance = (b - w) * log c, so the probability is
     a logistic of the EXCESS alone. Computed in log space to survive c^2000. */
  const balancingP = (excess, c) => 1 / (1 + Math.exp(-excess * Math.log(c)));
  /* the materialist's reading: proportion observed, with Peirce's probable error */
  const probableError = (p, s) => (s > 0 ? 0.477 * Math.sqrt(2 * p * (1 - p) / s) : 0);


  /* --------------------------------------------------------------------------
     Balancing reasons on these beans, laid out as it is in 9: one lane per
     argument, black to the right and white to the left, the sum ruled off
     underneath. Two thousand lanes will not fit on a page, and would say
     nothing if they did, since every bean is worth exactly the same — so a run
     is drawn as a few lanes, a vertical ellipsis carrying the count, and a few
     more. The sum is in beans left over rather than in log-chance, because the
     lanes are a tally and the two have to be read against each other.
     ------------------------------------------------------------------------*/
  const LANE_LEN = 0.62;                 // one argument, in half-widths
  const SHOW_END = 3;                    // lanes drawn at each end of a run

  /* the lanes a run of n identical arguments occupies: either all of them, or
     the ends with a gap standing for the rest */
  function laneRun(n) {
    if (n <= SHOW_END * 2 + 1) return { rows: n, gap: 0 };
    return { rows: SHOW_END * 2, gap: n - SHOW_END * 2 };
  }

  const unitsCanvas = mkCanvas(330, (pl) => {
    const b = NB(), w = NW(), excess = b - w;
    const rb = laneRun(b), rw = laneRun(w);
    // lanes drawn, plus one row for each ellipsis, plus the summed row
    const drawn = rb.rows + (rb.gap ? 1 : 0) + rw.rows + (rw.gap ? 1 : 0);
    const lanes = Math.max(drawn, 1);
    pl.setup({ xlim: [-1.08, 1.08], ylim: [-2.6, lanes + 0.5], mar: [0.6, 0.6, 2.4, 0.6] });
    pl.title("Every bean an argument", { cex: 0.9 });
    pl.clip(true);

    let y = lanes - 0.5;
    const lane = (dir, col) => {
      pl.rect(Math.min(0, dir * LANE_LEN), y - 0.3, Math.max(0, dir * LANE_LEN), y + 0.3,
        { col: col, border: "#3a3f45", lwd: 0.6 });
      y -= 1;
    };
    const ellipsis = (n, dir, col) => {
      pl.text(dir * LANE_LEN * 0.5, y, "⋮", { cex: 1.1, col: col });
      pl.text(dir * (LANE_LEN + 0.06), y, `× ${bigmark(n)}`,
        { adj: dir > 0 ? 0 : 1, cex: 0.78, col: col, font: 2 });
      y -= 1;
    };
    const side = (n, run, dir, col) => {
      if (!n) return;
      const half = run.gap ? SHOW_END : run.rows;
      for (let k = 0; k < half; k++) lane(dir, col);
      if (run.gap) {
        ellipsis(run.gap, dir, col);
        for (let k = 0; k < SHOW_END; k++) lane(dir, col);
      }
    };
    side(b, rb, 1, PRO_COL);
    side(w, rw, -1, CON_COL);
    if (!b && !w) pl.text(0, lanes / 2, "no beans drawn", { cex: 0.85, col: PAL.inkFaint });

    pl.segments(0, -0.1, 0, lanes + 0.2, { col: "#3a3f45", lwd: 1.2 });
    pl.clip(false);

    /* The sum, ruled off below, on a scale that does not move with the draw:
       forty beans across, whatever was drawn. That is the whole absurdity —
       twenty black out of twenty and 1,010 out of 2,000 leave the same twenty
       over, so this bar has to come out the same length in both, however
       different the lanes above it look. An excess past the scale is clipped
       and marked, the figure being printed underneath in any case. */
    pl.segments(-1.08, -0.5, 1.08, -0.5, { col: PAL.rule, lwd: 1 });
    const SUM_SPAN = 40;
    const over = Math.abs(excess) > SUM_SPAN;
    const len = Math.max(-1, Math.min(1, excess / SUM_SPAN)) * 0.9;
    pl.rect(Math.min(0, len), -1.55, Math.max(0, len), -0.95,
      { col: excess >= 0 ? "#4a7c59" : "#8a4331", border: PAL.inkFaint, lwd: 1.2 });
    if (over) {
      const d = Math.sign(excess);
      pl.text(d * 0.96, -1.25, d > 0 ? "»" : "«", { cex: 1.1, col: PAL.inkSoft, font: 2 });
    }
    pl.segments(0, -1.75, 0, -0.75, { col: "#3a3f45", lwd: 1.2 });
    pl.text(0, -2.12, Math.min(b, w)
      ? `${bigmark(Math.min(b, w))} against ${bigmark(Math.min(b, w))} cancel — ` +
        `${bigmark(Math.abs(excess))} left over`
      : `${bigmark(Math.abs(excess))} arguments, none cancelled`, { cex: 0.82, font: 2 });
    pl.text(0, -2.48, `${bigmark(b)} for, ${bigmark(w)} against` + (over ? "  (bar runs off the scale)" : ""),
      { cex: 0.75, col: PAL.inkSoft });
  });
  $("#ex12-units", content).appendChild(unitsCanvas);

  /* --------------------------------------------------------------------------
     The other reading, in the two pictures of 11 and no others: the estimate
     walking in as the beans accumulate, or the same two numbers as a curve.
     Where balancing reasons puts the belief is marked on both, so the quarrel
     is visible without leaving either picture.

     The path is a real order of drawing rather than a formula \u2014 the b blacks
     and w whites of the current setting, shuffled and dealt \u2014 so it ends
     exactly on the observed proportion however it wandered getting there.
     ------------------------------------------------------------------------*/
  let path = [], pathKey = "";

  function buildPath() {
    const b = NB(), w = NW();
    const key = `${b}|${w}`;
    if (key === pathKey) return;
    pathKey = key;
    const bag = shuffle(new Array(b).fill(true).concat(new Array(w).fill(false)));
    path = [];
    let seen = 0;
    bag.forEach((isB, i) => {
      if (isB) seen++;
      const n = i + 1;
      if (n <= 40 || n % Math.max(1, Math.floor(bag.length / 300)) === 0 || n === bag.length) {
        path.push({ n: n, p: seen / n });
      }
    });
  }

  const pathCanvas = mkCanvas(330, (pl) => {
    buildPath();
    if (!path.length) { blankPlot(pl, "Draw some beans to begin"); return; }
    const c = CH(), pBal = balancingP(NB() - NW(), c);
    const sMax = Math.max(20, path[path.length - 1].n * 1.05);
    pl.setup({ xlim: [0, Math.log10(sMax)], ylim: [0, 1], mar: [4, 4, 2.6, 1.5] });
    const decades = [];
    for (let e = 0; e <= Math.ceil(Math.log10(sMax)); e++) {
      [1, 2, 5].forEach((m) => { const v = m * Math.pow(10, e); if (v <= sMax) decades.push(v); });
    }
    pl.axes({ xat: decades.map(Math.log10), xlabels: decades.map((v) => bigmark(v)) });
    pl.box();
    pl.axisLabels("Beans drawn (log scale)", "Proportion black");
    pl.title("The estimate as the beans accumulate", { cex: 0.9 });
    pl.clip(true);
    const xs = path.map((d) => Math.log10(d.n));
    const hi = path.map((d) => Math.min(1, d.p + probableError(d.p, d.n)));
    const lo = path.map((d) => Math.max(0, d.p - probableError(d.p, d.n)));
    pl.polygon(xs.concat(xs.slice().reverse()), hi.concat(lo.slice().reverse()),
      { col: "rgba(47,111,159,0.16)" });
    pl.lines(xs, path.map((d) => d.p), { col: PAL.accent, lwd: 2.5 });
    pl.abline({ h: 0.5, col: "#a8adb4", lwd: 1, lty: 3 });
    pl.abline({ h: pBal, col: CON_COL, lwd: 2, lty: 2 });
    pl.clip(false);
    pl.legend("bottomright", {
      legend: ["Proportion drawn (\u00b1 probable error)", "Balancing reasons", "Even chance"],
      col: [PAL.accent, CON_COL, "#a8adb4"], lwd: [2.5, 2, 1], lty: [1, 2, 3], cex: 0.68
    });
  });
  $("#ex12-band", content).appendChild(pathCanvas);

  const gaussCanvas = mkCanvas(330, (pl) => {
    const b = NB(), w = NW(), s2 = b + w, c = CH();
    const p = s2 > 0 ? b / s2 : 0.5;
    const sd = Math.sqrt(p * (1 - p) / Math.max(1, s2));
    const pe = probableError(p, s2);
    const pBal = balancingP(b - w, c);
    if (!(sd > 0)) {
      blankPlot(pl, "Every bean so far has been the same colour,\nso the second number is nothing at all");
      return;
    }
    const xs = [], ys = [];
    for (let i = 0; i <= 600; i++) { const x = i / 600; xs.push(x); ys.push(dnorm(x, p, sd)); }
    const maxY = Math.max(...ys);
    pl.setup({ xlim: [0, 1], ylim: [0, maxY * 1.3], mar: [4, 2.4, 2.6, 1.5] });
    pl.axes({ nx: 5, yat: [] });
    pl.box();
    /* the axis is the bag's proportion, which is what the drawings estimate —
       not a belief about the one bean, for the reason given below */
    pl.axisLabels("Proportion black in the bag", null);
    pl.title("The distribution of the estimate", { cex: 0.9 });
    pl.clip(true);
    const lo = Math.max(0, p - pe), hi = Math.min(1, p + pe);
    const inBand = [];
    xs.forEach((x, i) => { if (x >= lo && x <= hi) inBand.push(i); });
    if (inBand.length) {
      const bx = inBand.map((i) => xs[i]), by = inBand.map((i) => ys[i]);
      pl.polygon(bx.concat(bx.slice().reverse()), bx.map(() => 0).concat(by.slice().reverse()),
        { col: "rgba(47,111,159,0.20)" });
    }
    pl.lines(xs, ys, { col: PAL.accent, lwd: 2.5 });
    pl.abline({ v: p, col: PAL.accent, lwd: 2, lty: 2 });
    pl.arrows(lo, maxY * 0.42, hi, maxY * 0.42,
      { code: 3, angle: 20, length: 6, lwd: 1.5, col: "#8a4331" });
    pl.clip(false);
    /* Balancing reasons has no place on this axis. What is drawn here is how
       the estimate of a proportion is spread, and the rule's figure is not an
       estimate of that proportion \u2014 it is an intensity of belief about the one
       bean. Putting it on the same scale would make the two look like rival
       readings of one quantity, which is the confusion the example is against. */
    pl.legend(p < 0.5 ? "topright" : "topleft", {
      legend: [`${fmt(p, 4)} \u00b1 ${fmt(pe, 4)}, on ${bigmark(s2)} drawings`],
      col: [PAL.accent], lwd: [2.5], lty: [1], cex: 0.66
    });
  });
  gaussCanvas.style.display = "none";
  $("#ex12-band", content).appendChild(gaussCanvas);

  function update() {
    const b = NB(), w = NW(), c = CH();
    const s = b + w, excess = b - w;
    const pBal = balancingP(excess, c);
    const pFreq = s > 0 ? b / s : 0.5;
    const pe = probableError(pFreq, s);
    const net = excess * Math.log(c) / Math.LN10;   // reported in base 10

    const verdict = (title, colour, body) =>
      `<div style="padding:15px;border-radius:6px;border:2px solid ${colour};margin-bottom:14px;">
         <h5 style="margin-top:0;color:${colour};">${title}</h5>${body}</div>`;

    $("#ex12-verdict-mbr", content).innerHTML =
      verdict("Balancing reasons says&hellip;", "#b0563f", `
        <p style="margin-bottom:6px;">${bigmark(b)} arguments for, ${bigmark(w)} against, each worth
          ${fmt(Math.log(c) / Math.LN10, 4)} of belief.</p>
        <p style="margin-bottom:6px;">Net belief = (${bigmark(b)} &minus; ${bigmark(w)}) &times;
          ${fmt(Math.log(c) / Math.LN10, 4)} = <strong>${fmt(net, 3)}</strong></p>
        <p style="margin-bottom:0;font-size:1.1em;">P(hidden bean is black) =
          <strong>${pBal > 0.999999 ? "&gt; 0.999999" : fmt(pBal, 6)}</strong>
          &nbsp;<em style="font-size:0.85em;">&mdash; depends only on the excess of ${bigmark(excess)}</em></p>`);
    $("#ex12-verdict-prop", content).innerHTML =
      verdict("The proportion drawn says&hellip;", "#2f6f9f", `
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
      const cur = (bb === b && ww === w) ? ' style="background-color:#f5ead1;font-weight:700;"' : "";
      return `<tr${cur}><td>${bigmark(bb)}</td><td>${bigmark(ww)}</td><td>${bigmark(ss)}</td>
        <td>${bigmark(ex)}</td><td>${pb > 0.999999 ? "&gt;0.999999" : fmt(pb, 6)}</td><td>${fmt(pf, 4)}</td></tr>`;
    };
    $("#ex12-table", content).innerHTML = `
      <div class="table-scroll"><table class="tbl">
        <thead><tr><th>Black</th><th>White</th><th>Total drawn</th><th>Excess</th>
          <th>Balancing reasons</th><th>Proportion drawn</th></tr></thead>
        <tbody>${rowFor(20, 0)}${rowFor(1010, 990)}${(b !== 20 || w !== 0) && (b !== 1010 || w !== 990) ? rowFor(b, w) : ""}</tbody>
      </table></div>
      <div class="note-block">In both cases, the black beans exceed the white beans by twenty. The method of
        balancing reasons is blind to the weight of the evidence, and so assigns each case the same intensity
        of belief. The method Peirce endorses recognizes that the second case provides a near-certain report
        that the bag is half black. The second number, the probable error, recognizes the weight of the
        evidence reflecting this near-certainty. (In one sense of weight of evidence, see
        <a href="https://philpapers.org/rec/KASTCO-6" target="_blank" rel="noopener">Kasser (2016)</a>.)</div>`;
    $("#ex12-force", content).innerHTML = `
      <div class="row">
        <div class="col col-6">
          <div id="ex12-ctl-c"></div>
          <button class="btn btn-sm" data-act="fromdraw">Take the chance from the drawings</button>
          <div id="ex12-force-said"></div>
        </div>
        <div class="col col-6"></div>
      </div>`;
    $("#ex12-ctl-c", content).appendChild(chanceSlider);
    if (forceSaid) {
      $("#ex12-force-said", content).innerHTML = `<div class="note-block">Taken from the record, as
        ${bigmark(b)} : ${bigmark(w)}, the force of a single bean turns out to be a fact about all
        the other beans. The arguments are then not independent, and the adding up they were being
        added up by is not licensed. Nothing in the bag or the drawings fixes this figure, which is
        why it is a slider.</div>`;
    }

    drawCanvas(unitsCanvas);
    drawCanvas(pathCanvas);
    drawCanvas(gaussCanvas);
  }
  update();
});

/* ==========================================================================
   NEW EXAMPLE (32) — which arguments are worth balancing

   12 showed that balancing reasons cannot tell a strong record from a weak one
   of the same excess. This is the constructive half: every argument admitted to
   the balance has been established by some finite amount of testing, so every
   one of them arrives with a probable error as well as a probability, and the
   rule has no place to put the second number. An argument is in the sum or it
   is not; nothing in the rule weighs how well its own chance is known.

   So the line has to be drawn by hand — a level of tolerable certainty below
   which a determination is too vague to use. Moving that line moves the answer,
   which is the point: the figure the rule produces depends on a judgment the
   rule cannot make.
   ========================================================================*/
registerExample("example-ex32", (box) => {
  box.appendChild(exHeader("Interactive Example: Which Arguments Are Worth Balancing?", "ex32-content"));
  const content = h(`<div id="ex32-content" class="example-content">
    <div class="ex-buttonbar">
      <button class="btn btn-primary" data-act="run">Run the tests</button>
      <button class="btn btn-warning btn-sm" data-act="fresh">New arguments</button>
    </div>
    <!-- The weighted view is held back for now. Everything behind it is intact:
         put the two lines below back inside the markup and it returns, tab,
         shrinkage, table column and all. -->
    <!--
    <div class="mode-tabs">
      <button class="mode-tab active" data-view="rule">The rule as stated</button>
      <button class="mode-tab" data-view="weighted">Weighted by how well each is known</button>
    </div>
    -->
    <div class="row">
      <div class="col col-4" id="ex32-ctl-n"></div>
      <div class="col col-4" id="ex32-ctl-effort"></div>
      <div class="col col-4" id="ex32-ctl-tol"></div>
    </div>
    <div class="row">
      <div class="col col-6"><div class="plot-container" id="ex32-args"></div></div>
      <div class="col col-6"><div class="plot-container" id="ex32-balance"></div></div>
    </div>
    <div id="ex32-verdict"></div>
    <div id="ex32-table"></div>
  </div>`);
  box.appendChild(content);

  $("#ex32-ctl-n", content).appendChild(
    slider("ex32_n", "Arguments:", 2, 8, 5, 1, null, "k1"));
  /* One slider for the whole run, but each argument carries its own share of
     it, because the case worth seeing is a few well-tested rules beside a crowd
     of barely-tested ones. */
  $("#ex32-ctl-effort", content).appendChild(
    slider("ex32_effort", "Testing effort:", -1, 1.4, 0, 0.05,
      (v) => `× ${Math.pow(10, v) < 1 ? Math.pow(10, v).toFixed(2) : fmt(Math.pow(10, v), 1)}`, "k2"));
  $("#ex32-ctl-tol", content).appendChild(
    slider("ex32_tol", "Tolerable certainty — largest probable error admitted:",
      0.005, 0.4, 0.08, 0.005, (v) => `± ${v.toFixed(3)}`, "k3"));

  /* Peirce's bound at the worst case, p = 1/2, which is the only one available
     when the proportion is exactly what the testing is trying to find out —
     the same move he makes for the Cretans. Taken at the observed p instead it
     misbehaves badly here: three tests that all came out the same way give
     p-hat = 0 and so an error of nothing at all, which would put the worst
     established argument on the page down as the best known. Depending on the
     number of tests alone, it cannot do that. */
  const probableError = (s) => (s > 0 ? 0.477 / Math.sqrt(2 * s) : 0.5);
  /* The standard error of the log-chance itself, which is what the balance
     actually adds up: var(log odds) is about 1/(n p (1-p)), taken at the worst
     case and put into base ten. */
  const sigOf = (s) => 0.8686 / Math.sqrt(Math.max(1, s));
  let mode = "rule";
  const spreadOf = (s) => (s > 0 ? 1 / (2 * Math.sqrt(s)) : 0.5);
  const LOG10 = (x) => Math.log(x) / Math.LN10;

  let args = [];
  let anim = null, shown = 0;      // 0..1, how much of each test run is in

  /* How well an argument is established is laid out as a ladder rather than
     sampled — a few trials at one end, some thousands at the other — because a
     random spread will now and then hand out a set that all clears the line at
     once, and then there is nothing to see. Which rung an argument sits on is
     shuffled against how strongly it tells, so that being well established and
     telling strongly stay independent: that is what stops the threshold from
     working as a proxy for strength. The probabilities themselves are not laid
     out at all; they come out of the testing. */
  function fresh() {
    const n = Math.round(num("ex32_n"));
    const rungs = shuffle(Array.from({ length: n }, (_, k) =>
      Math.round(Math.pow(10, 0.5 + 2.5 * (n === 1 ? 1 : k / (n - 1))))));   // ~3 to ~1000
    args = Array.from({ length: n }, (_, i) => ({
      truth: 0.06 + Math.random() * 0.88,
      base: rungs[i], seq: null, i: i
    }));
    shown = 0;
  }

  const trialsOf = (a) => Math.max(2, Math.round(a.base * Math.pow(10, num("ex32_effort"))));

  /* The record of an argument's testing, generated once per (argument, count)
     so that moving the tolerance slider does not silently re-roll the evidence. */
  function record(a) {
    const t = trialsOf(a);
    if (!a.seq || a.seq.length !== t) {
      a.seq = [];
      let hits = 0;
      for (let k = 0; k < t; k++) { if (Math.random() < a.truth) hits++; a.seq.push(hits); }
    }
    const upto = Math.max(1, Math.round(t * (anim ? shown : 1)));
    const hits = a.seq[upto - 1];
    /* half a trial's worth of room at each end, so a run that came out all one
       way has a chance rather than an infinite one. It is a continuity
       correction and not a prior: how extreme a chance the record is allowed to
       claim grows with the number of tests behind it. */
    const edge = 0.5 / (upto + 1);
    const p = Math.min(1 - edge, Math.max(edge, hits / upto));
    return { n: upto, total: t, p: p, raw: hits / upto,
      pe: probableError(upto), sd: spreadOf(upto),
      ch: p / (1 - p), lg: LOG10(p / (1 - p)) };
  }

  function state() {
    const tol = num("ex32_tol");
    const rows = args.map((a) => {
      const r = record(a);
      return Object.assign({ i: a.i, truth: a.truth, inSum: r.pe <= tol, sig: sigOf(r.n) }, r);
    });
    const sum = (f) => rows.filter(f).reduce((s, r) => s + r.lg, 0);
    const totalAdmitted = sum((r) => r.inSum), totalAll = sum(() => true);
    const prob = (t) => Math.pow(10, t) / (1 + Math.pow(10, t));

    /* Shrinkage rather than a cliff. Each log-chance is pulled towards zero by
       tau^2 / (tau^2 + sigma^2): the share of the spread among the arguments
       that is real rather than noise. Well established arguments keep almost
       all of their weight; barely tested ones are pulled towards zero, which
       here is an even chance — the thing Peirce says can do nothing towards
       reenforcing others. If the whole spread is explicable as noise, tau^2 is
       nothing, every weight is nothing, and the balance says so.

       tau^2 is the second moment about ZERO, not the variance about the mean,
       because zero is where the shrinking goes. Taken about the mean it gets
       five strong arguments that agree with each other badly wrong: they have
       almost no variance between them, so tau^2 would come out at nothing and
       five well-established rules would be weighted away to an even chance. */
    const lgs = rows.map((r) => r.lg);
    const second = lgs.reduce((a, v) => a + v * v, 0) / (lgs.length || 1);
    const noise = rows.reduce((a, r) => a + r.sig * r.sig, 0) / (rows.length || 1);
    const tau2 = Math.max(0, second - noise);
    rows.forEach((r) => { r.w = tau2 > 0 ? tau2 / (tau2 + r.sig * r.sig) : 0; });
    const totalWeighted = rows.reduce((a, r) => a + r.w * r.lg, 0);

    return { rows: rows, tol: tol, mode: mode, tau2: tau2,
      admitted: rows.filter((r) => r.inSum).length,
      totalAdmitted: totalAdmitted, totalAll: totalAll, totalWeighted: totalWeighted,
      pAdmitted: prob(totalAdmitted), pAll: prob(totalAll), pWeighted: prob(totalWeighted) };
  }

  /* ---- each argument as what the testing left us: a centre and a spread ---- */
  const argCanvas = mkCanvas(330, (pl) => {
    const st = state();
    const n = st.rows.length;
    pl.setup({ xlim: [0, 1], ylim: [0, n], mar: [4, 3.6, 2.8, 1] });
    pl.axes({ nx: 5, yat: [] });
    pl.box();
    pl.axisLabels("P(A → C), as the testing found it", null);
    pl.title("What each argument is worth and how well we know it", { cex: 0.9 });
    pl.clip(true);
    pl.abline({ v: 0.5, col: PAL.inkFaint, lwd: 1, lty: 3 });
    st.rows.forEach((r, k) => {
      const y0 = n - 1 - k;
      const sd = r.sd;
      const live = st.mode === "weighted" ? r.w > 0.15 : r.inSum;
      const col = live ? (r.lg >= 0 ? PRO_COL : CON_COL) : "#b8bcc2";
      const xs = [], ys = [];
      for (let j = 0; j <= 200; j++) { const x = j / 200; xs.push(x); ys.push(dnorm(x, r.p, sd)); }
      const mx = Math.max(...ys) || 1;
      const H = 0.78;
      pl.polygon(xs.concat([1, 0]), ys.map((v) => y0 + 0.08 + (v / mx) * H).concat([y0 + 0.08, y0 + 0.08]),
        { col: live ? "rgba(47,111,159,0.13)" : "rgba(150,155,162,0.13)" });
      pl.lines(xs, ys.map((v) => y0 + 0.08 + (v / mx) * H), { col: col, lwd: 1.6 });
      pl.segments(Math.max(0, r.p - r.pe), y0 + 0.08, Math.min(1, r.p + r.pe), y0 + 0.08,
        { col: col, lwd: 3 });
      pl.points([r.p], [y0 + 0.08], { col: col, cex: 1.1 });
      pl.text(0.012, y0 + 0.62, `A${r.i + 1}`, { adj: 0, cex: 0.72, col: live ? PAL.inkSoft : "#a8adb4" });
      if (st.mode === "weighted") {
        pl.text(0.988, y0 + 0.62, `× ${fmt(r.w, 2)}`, { adj: 1, cex: 0.7, col: live ? PAL.inkSoft : "#a8adb4" });
      } else if (!r.inSum) {
        pl.text(0.988, y0 + 0.62, "left out", { adj: 1, cex: 0.7, col: "#a8adb4", font: 3 });
      }
    });
    pl.clip(false);
  });
  $("#ex32-args", content).appendChild(argCanvas);

  /* ---- and the balance itself, drawn as 9 draws it ---------------------- */
  const balCanvas = mkCanvas(330, (pl) => {
    const st = state();
    const weighted = st.mode === "weighted";
    const rows = weighted ? st.rows : st.rows.filter((r) => r.inSum);
    const maxAbs = Math.max(0.4, ...st.rows.map((r) => Math.abs(r.lg)),
      Math.abs(weighted ? st.totalWeighted : st.totalAdmitted)) * 1.15;
    const lanes = st.rows.length + 1.6;
    pl.setup({ xlim: [-maxAbs, maxAbs], ylim: [-0.4, lanes], mar: [4, 1, 2.8, 1] });
    pl.title(weighted ? "The balance, each argument shaved to what it is worth"
      : "The balance, on what was admitted", { cex: 0.9 });
    pl.axes({ ny: null, yat: [] });
    pl.abline({ v: 0, col: "#3a3f45", lwd: 1.5 });
    pl.axisLabels("Belief intensity  (log₁₀ chance)", null);
    pl.clip(true);
    st.rows.forEach((r, k) => {
      const y = lanes - 1 - k;
      if (!weighted && !r.inSum) {
        pl.text(0, y, `A${r.i + 1} left out`, { cex: 0.72, col: "#b8bcc2", font: 3 });
        return;
      }
      const col = r.lg >= 0 ? PRO_COL : CON_COL;
      const v = weighted ? r.w * r.lg : r.lg;
      /* the full bar behind the shaved one, so what the weighting took is the
         gap between them rather than a number to be trusted */
      if (weighted) {
        pl.rect(Math.min(0, r.lg), y - 0.3, Math.max(0, r.lg), y + 0.3,
          { col: null, border: "#c9ccd1", lwd: 1 });
      }
      pl.rect(Math.min(0, v), y - 0.3, Math.max(0, v), y + 0.3,
        { col: col, border: "#3a3f45", lwd: 0.6 });
      pl.text(-maxAbs * 0.97, y, `A${r.i + 1}`, { cex: 0.72, adj: 0, col: PAL.inkSoft });
      pl.text(v + (v >= 0 ? 0.02 : -0.02) * maxAbs, y,
        `${v >= 0 ? "+" : ""}${fmt(v, 2)}`, { cex: 0.7, adj: v >= 0 ? 0 : 1, font: 2 });
    });
    const yT = 0.15;
    pl.segments(-maxAbs, yT + 0.55, maxAbs, yT + 0.55, { col: "#a8adb4", lty: 2 });
    const T = weighted ? st.totalWeighted : st.totalAdmitted;
    pl.rect(Math.min(0, T), yT - 0.3, Math.max(0, T), yT + 0.3,
      { col: T >= 0 ? "#4a7c59" : "#8a4331", border: PAL.inkFaint, lwd: 1.2 });
    pl.text(T + (T >= 0 ? 0.02 : -0.02) * maxAbs, yT,
      `total ${T >= 0 ? "+" : ""}${fmt(T, 3)}`, { cex: 0.76, adj: T >= 0 ? 0 : 1, font: 2 });
    pl.clip(false);
    if (!rows.length) {
      pl.text(0, lanes / 2, "nothing is certain enough to admit", { cex: 0.9, col: PAL.inkFaint });
    } else if (weighted && st.tau2 === 0) {
      pl.text(0, lanes / 2, "the whole spread is explicable as noise", { cex: 0.85, col: PAL.inkFaint });
    }
  });
  $("#ex32-balance", content).appendChild(balCanvas);

  function update() {
    const st = state();

    $("#ex32-verdict", content).innerHTML = `<div class="note-block">${st.mode === "weighted"
      ? `<p>This mode is just for fun. Here, no arguments are disqualified, but each is weighted such that it
          contributes only the share of its own log-chance that is real rather than noise. On this method,
          the balance comes to <strong>${fmt(st.pWeighted, 4)}</strong> against the
          <strong>${fmt(st.pAll, 4)}</strong> the rule would give if it took them all at face value.
          Well-established arguments keep nearly all of their length; badly tested ones have their influence
          diminished.${st.tau2 === 0
            ? " On this run there is nothing left to weight: the spread among the arguments is no more than"
              + " their own noise, so every weight falls to nothing."
            : ""}</p>
         <p style="margin-bottom:0;">Here is why this is just for fun. The method of balancing reasons adds
          independent arguments; you cannot shrink a term in a sum and still claim to be summing the
          evidence. What is being done here is the other thing &mdash; treating the arguments as noisy
          readings to be pooled &mdash; and it requires assuming that they are readings of a common quantity
          with a single spread. <span style="color:#8a9099;">(To see an argument that the MBR does not
          satisfy this assumption, see here &mdash; example to come.)</span></p>`
      : `<p>${st.admitted} of ${st.rows.length} arguments are known well enough to admit at
          &plusmn;${fmt(st.tol, 3)}, and the balance of those puts the conclusion at
          <strong>${fmt(st.pAdmitted, 4)}</strong>. Admit all ${st.rows.length}, however badly established,
          and it is <strong>${fmt(st.pAll, 4)}</strong>.</p>
         <p style="margin-bottom:0;">As we have seen, each argument is determined by two numbers, a
          determination of its probability and its probable error. The method of balancing reasons only
          considers the determination of probability. We have let you set a threshold for how good an
          argument must be for you to consider its value, and moving that threshold moves the answer.
          The rule did not leave anything out; the line you drew did.</p>`}</div>`;
    /* The last sentence used to send the reader to the weighted tab. That tab is
       held back at the moment, so the pointer would be a door with nothing
       behind it; restore it along with the tab. */

    const rows = st.rows.map((r) => `<tr${(st.mode === "weighted" ? r.w > 0.15 : r.inSum)
      ? "" : ' style="color:#a8adb4;"'}>
      <td style="text-align:left;">A<sub>${r.i + 1}</sub> &rarr; C</td>
      <td>${bigmark(r.n)}</td>
      <td>${fmt(r.p, 3)}</td>
      <td>&plusmn;${fmt(r.pe, 4)}</td>
      <td>${fmt(r.ch, 2)} : 1</td>
      <td>${r.lg >= 0 ? "+" : ""}${fmt(r.lg, 3)}</td>
      <td>${st.mode === "weighted" ? `&times; ${fmt(r.w, 2)}`
        : (r.inSum ? "admitted" : "too vague")}</td></tr>`).join("");
    $("#ex32-table", content).innerHTML = `<div class="table-scroll"><table class="tbl">
      <thead><tr><th style="text-align:left;">Argument</th><th>Tests</th>
        <th>P(A&rarr;C)</th><th>Probable error</th><th>Chance</th>
        <th>log<sub>10</sub> chance</th>
        <th>${st.mode === "weighted" ? "Weight" : `At &plusmn;${fmt(st.tol, 3)}`}</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;

    drawCanvas(argCanvas);
    drawCanvas(balCanvas);
  }

  /* the testing run in front of you, so the spread is seen to be earned */
  function runTests() {
    if (anim) cancelAnimationFrame(anim.id);
    args.forEach((a) => { a.seq = null; });
    const t0 = performance.now(), DUR = 1200;
    anim = { id: 0 };
    const step = () => {
      const u = Math.min(1, (performance.now() - t0) / DUR);
      shown = u * u * (3 - 2 * u);             // ease, so the tail is readable
      update();
      if (u < 1) anim.id = requestAnimationFrame(step);
      else { anim = null; shown = 1; update(); }
    };
    anim.id = requestAnimationFrame(step);
  }

  content.addEventListener("input", (ev) => {
    if (ev.target && ev.target.id === "ex32_n") fresh();
    update();
  });
  content.addEventListener("click", (ev) => {
    const tab = ev.target.closest(".mode-tab");
    if (tab) {
      mode = tab.getAttribute("data-view");
      $$(".mode-tab", content).forEach((x) => x.classList.toggle("active", x === tab));
      /* the threshold has no work to do once nothing is being thrown out */
      $("#ex32-ctl-tol", content).style.opacity = mode === "weighted" ? 0.35 : 1;
      update();
      return;
    }
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "fresh") { fresh(); runTests(); }
    else if (a === "run") runTests();
    else return;
  });

  fresh();
  update();
});

/* ==========================================================================
   NEW EXAMPLE (34) — what would the belief number be a proportion of?

   The sequel to 27. There the conversion simply is not offered; here is why it
   cannot be. A probability in this paper is a count over a count: the times
   antecedent and consequent both occur, over the times the antecedent occurs.
   Each argument has one, in its own antecedent's cases. The combined belief has
   none, because the cases it would have to be counted over are a third
   population that nobody has looked at — and when you do look at it, the two
   arguments barely constrain what you find.
   ========================================================================*/
registerExample("example-ex34", (box) => {
  box.appendChild(exHeader("Interactive Example: A Proportion of What?", "ex34-content"));
  const content = h(`<div id="ex34-content" class="example-content">
    <p class="help-text" style="margin-bottom:6px;">Note: Work in Progress</p>
    <p>Peirce's two rules, as counts. Each probability is the shaded part of its own grid.</p>
    <div class="ex-buttonbar" id="ex34-cases"></div>
    <div id="ex34-gloss"></div>
    <div id="ex34-grids"></div>
    <div id="ex34-ask"></div>
    <div class="row">
      <div class="col col-7" id="ex34-ctl"></div>
      <div class="col col-5"><div class="ex-buttonbar">
        <button class="btn btn-primary btn-sm" data-act="count">Go and count them</button>
        <button class="btn btn-warning btn-sm" data-act="reset">Leave them uncounted</button>
      </div></div>
    </div>
    <div class="plot-container" id="ex34-line"></div>
    <div id="ex34-say"></div>
  </div>`);
  box.appendChild(content);

  const N1 = 100, C1 = 81, N2 = 100, C2 = 93;
  const NOT1 = N1 - C1, NOT2 = N2 - C2;
  /* the largest overlap the two counts allow: past this, the cases they share
     would have to hold more consequents than one of them contains */
  const KMAX = C1 + NOT2;                       // 88
  const P1 = C1 / N1, P2 = C2 / N2;
  const MBR = (() => { const c = (C1 / NOT1) * (C2 / NOT2); return c / (1 + c); })();
  const POOL = (C1 + C2) / (N1 + N2);

  const jMin = (k) => Math.max(0, k - Math.min(NOT1, NOT2));
  const jMax = (k) => Math.min(k, C1, C2);

  /* The same arithmetic under three real pairs, because which of the three
     situations you are in is a fact about the arguments and not about how hard
     you have looked. Each sets the overlap where its own case puts it. */
  const CASES = [
    { key: "rules", name: "Peirce's two rules" },
    { key: "measles", name: "Fever and rash", k: 30,
      a1: "the patient has a fever", a2: "the patient has a rash", c: "the patient has measles",
      gloss: "Both can hold of one patient, and the patients with both can be counted. Nothing stands in " +
        "the way here except the work of going and counting." },
    { key: "bridge", name: "Steel and engineer", k: 30,
      a1: "the steel passed its test", a2: "the engineer has a good record", c: "the bridge stands",
      gloss: "Bridges are the common space, so the question is a real one. But the first rule was counted " +
        "over steel samples and the second over engineers, and a steel sample is not an engineer. Neither " +
        "was ever counted over bridges." },
    { key: "drugs", name: "Two drug trials", k: 0, lock: true,
      a1: "the patient was given drug X", a2: "the patient was given drug Y", c: "the patient recovers",
      gloss: "The first comes from a trial of X, the second from a trial of Y, and no patient was given " +
        "both. There are no cases where both antecedents hold. The overlap is not unmeasured. It is empty, " +
        "and no amount of counting will make it otherwise." }
  ];
  let picked = CASES[0];
  let counted = false;

  $("#ex34-cases", content).innerHTML = CASES.map((c, i) =>
    `<button class="btn btn-sm${i === 0 ? " btn-primary" : ""}" data-case="${c.key}">${c.name}</button>`
  ).join("");

  $("#ex34-ctl", content).appendChild(
    slider("ex34_k", "Cases where both antecedents hold:", 0, KMAX, 20, 1,
      (v) => (v === 0 ? "none — they never occur together" : bigmark(v)), "k1"));
  const jSlider = slider("ex34_j", "Of those, how many have C:", 0, KMAX, 16, 1, (v) => bigmark(v), "k3");
  $("#ex34-ctl", content).appendChild(jSlider);

  const SHARED = "#7a6a94";

  /* The shared cases are laid first in both grids and ringed, and within the
     block the ones with C come first, so the two leading blocks are drawn
     identically: cell for cell they are the same cases, and C either held in
     one of them or it did not. What follows the block is each argument's own
     cases, carrying whatever is left of its count. */
  const grid = (total, shared, sharedC, ownC, col, unknownShared) => {
    let out = "";
    for (let i = 0; i < total; i++) {
      const isShared = i < shared;
      const hasC = isShared ? i < sharedC : (i - shared) < ownC;
      const bg = (isShared && unknownShared) ? "#e2e0d9" : (hasC ? col : "#e5e1d8");
      const ring = isShared ? `box-shadow:0 0 0 1.5px ${SHARED};` : "";
      out += `<span style="display:inline-block;width:15px;height:15px;margin:2.5px;border-radius:2px;
        border:1px solid #a8adb4;${ring}background:${bg};color:#8a9099;font-size:0.62em;line-height:15px;
        text-align:center;vertical-align:top;">${(isShared && unknownShared) ? "?" : ""}</span>`;
    }
    return `<div style="line-height:0;">${out}</div>`;
  };

  const lineCanvas = mkCanvas(150, (pl) => {
    const k = Math.round(num("ex34_k"));
    pl.setup({ xlim: [0, 1], ylim: [0, 1], mar: [3.4, 1, 2.6, 1] });
    pl.axes({ nx: 5, yat: [] });
    pl.box();
    pl.axisLabels("P(C) among the cases where both antecedents hold", null);
    pl.title(k ? "What the two arguments allow the third grid to be"
      : "There are no such cases to count", { cex: 0.92 });
    pl.clip(true);
    if (k) {
      const lo = jMin(k) / k, hi = jMax(k) / k;
      pl.rect(lo, 0.42, hi, 0.72, { col: "rgba(47,111,159,0.20)", border: "#2f6f9f", lwd: 1 });
      pl.text((lo + hi) / 2, 0.86, lo === hi ? `pinned at ${fmt(lo, 4)}`
        : `anywhere from ${fmt(lo, 3)} to ${fmt(hi, 3)}`, { cex: 0.76, col: "#24587d" });
      if (counted) {
        const j = Math.round(num("ex34_j"));
        pl.segments(j / k, 0.34, j / k, 0.80, { col: "#7a6a94", lwd: 3 });
        pl.text(j / k, 0.24, `counted ${fmt(j / k, 3)}`, { cex: 0.74, col: "#7a6a94", font: 2 });
      }
    }
    pl.abline({ v: MBR, col: "#b0563f", lwd: 2, lty: 2 });
    pl.clip(false);
    pl.text(Math.min(0.9, MBR), 0.96, `the rule says ${fmt(MBR, 4)}`,
      { cex: 0.74, col: "#b0563f", adj: 1, font: 2 });
  });
  $("#ex34-line", content).appendChild(lineCanvas);

  function update() {
    const k = Math.round(num("ex34_k"));
    const lo = jMin(k), hi = jMax(k);
    const jEl = document.getElementById("ex34_j");
    jEl.min = lo; jEl.max = Math.max(lo, hi);
    let j = Math.round(num("ex34_j"));
    if (j < lo) { j = lo; jEl.value = lo; }
    if (j > hi) { j = hi; jEl.value = hi; }
    $("#ex34_j_val", content).textContent = k === 0 ? "—" : bigmark(j);
    jSlider.style.opacity = counted && k > 0 ? 1 : 0.35;

    /* Uncounted, the shared cases can only be shown twice — once in each grid,
       ringed — because nothing yet says they are the same cases. Counting them
       is what puts the two arguments in one space, so counting is what turns
       the picture into a Venn: A0 the box, the two arguments overlapping
       inside it, and the shared cases drawn once, in the middle, belonging to
       both. */
    const legend = (t) => `<p style="font-size:0.9em;margin-bottom:4px;color:#575d66;">${t}</p>`;
    const P1txt = `<span class="math">A<sub>1</sub> &rarr; C</span> &mdash; ${N1} cases where
      <span class="math">A<sub>1</sub></span> held, ${C1} with <span class="math">C</span>.
      <strong style="color:#2f6f9f;">${fmt(P1, 2)}</strong>`;
    const P2txt = `<span class="math">A<sub>2</sub> &rarr; C</span> &mdash; ${N2} cases where
      <span class="math">A<sub>2</sub></span> held, ${C2} with <span class="math">C</span>.
      <strong style="color:#2f6f9f;">${fmt(P2, 2)}</strong>`;

    if (!counted) {
      $("#ex34-grids", content).innerHTML = `<div class="row">
        <div class="col col-6">${legend(P1txt)}${grid(N1, k, 0, C1, "#6b9c78", true)}</div>
        <div class="col col-6">${legend(P2txt)}${grid(N2, k, 0, C2, "#6b9c78", true)}</div></div>
        ${k ? legend(`The <span style="color:${SHARED};font-weight:700;">ringed</span> cases are the
          ${bigmark(k)} where both antecedents held. They are drawn twice here, once in each grid, because
          nothing yet says what is in them.`) : ""}`;
    } else {
      const W = 8 * 20;
      const own = N1 - k;
      const band = (n, shaded, bg, radius) => `<div style="width:${W}px;background:${bg};padding:6px 4px;
        border-radius:${radius};box-sizing:content-box;">${grid(n, 0, 0, shaded, "#6b9c78", false)}</div>`;
      $("#ex34-grids", content).innerHTML = `
        <div style="background:rgba(138,144,153,0.09);border:1px solid var(--rule);border-radius:6px;
          padding:10px 12px 8px;margin-bottom:10px;">
          <p style="font-size:0.9em;margin:0 0 8px;color:#575d66;">
            <span class="math">A<sub>0</sub></span> &mdash; the wider space in which both antecedents are
            defined, and in which the shared cases were counted.</p>
          <div style="display:flex;align-items:stretch;">
            ${band(own, C1 - j, "rgba(107,156,120,0.18)", "70px 0 0 70px")}
            ${band(k, j, "rgba(78,134,140,0.34)", "0")}
            ${band(own, C2 - j, "rgba(47,111,159,0.16)", "0 70px 70px 0")}
          </div>
          <div style="display:flex;font-size:0.78em;color:#575d66;margin-top:4px;">
            <div style="width:${W + 8}px;text-align:center;"><span class="math">A<sub>1</sub></span> only</div>
            <div style="width:${W + 8}px;text-align:center;color:${SHARED};font-weight:700;">both</div>
            <div style="width:${W + 8}px;text-align:center;"><span class="math">A<sub>2</sub></span> only</div>
          </div>
        </div>
        ${legend(`${P1txt} &nbsp;&middot;&nbsp; ${P2txt}<br>
          <span class="math">A<sub>1</sub> &and; A<sub>2</sub> &rarr; C</span> &mdash; ${bigmark(j)} of
          ${bigmark(k)}. <strong style="color:${SHARED};">${k ? fmt(j / k, 3) : "&mdash;"}</strong>`)}`;
    }

    $("#ex34-gloss", content).innerHTML = picked.gloss
      ? `<p style="font-size:0.92em;color:#575d66;margin:2px 0 12px;">
          <span class="math">A<sub>1</sub></span> is <em>${picked.a1}</em>,
          <span class="math">A<sub>2</sub></span> is <em>${picked.a2}</em>,
          <span class="math">C</span> is <em>${picked.c}</em>. ${picked.gloss}</p>`
      : "";

    $("#ex34-ask", content).innerHTML = `<div class="note-block" style="margin-bottom:14px;">
      Balancing the two gives <strong style="color:#b0563f;">${fmt(MBR, 4)}</strong>. Neither argument has
      that as its shaded part. The only cases it could be the shaded part of are those where
      <span class="math">A<sub>1</sub></span> and <span class="math">A<sub>2</sub></span> both held.
      ${k === 0 ? "There are none of those." : counted
        ? `There are ${bigmark(k)} of them, and they have been counted.`
        : `There are ${bigmark(k)} of them and nobody has counted them.`}</div>`;

    let say;
    if (k === 0) {
      say = `The two antecedents never occur together. There is no case of which both are true, so there is
        no population here, and no proportion to take. The belief number is not unknown. There is nothing
        for it to be.`;
    } else if (!counted) {
      say = `Putting the overlap above zero says there is a wider space &mdash;
        <span class="math">A<sub>0</sub></span>, in which both antecedents are defined and sometimes both
        hold. This makes the question possible to answer, but doesn't give that answer. The two arguments
        leave the proportion anywhere between ${fmt(lo / k, 3)} and ${fmt(hi / k, 3)}, and every value in that band is
        consistent with 81 in 100 and 93 in 100. Count them and see.`;
    } else if (lo === hi) {
      say = `Counted, and at this overlap the counts settle it on their own: ${bigmark(lo)} of the
        ${bigmark(k)} shared cases must have C, so the proportion is ${fmt(lo / k, 4)}. The rule said
        ${fmt(MBR, 4)}. Any larger overlap is impossible &mdash; the shared cases would have to hold more
        consequents than <span class="math">A<sub>1</sub></span> contains &mdash; so the two arguments
        cannot be about more than ${bigmark(KMAX)} of the same cases.`;
    } else {
      const got = j / k;
      say = `Counted, and now two things are known. First, that both arguments belong to one wider space,
        <span class="math">A<sub>0</sub></span>: the cases where both antecedents hold are cases of the same
        kind, and they have been counted. Second, that with that space in hand the probability is read off
        it &mdash; <strong>${fmt(got, 4)}</strong> &mdash; which is deduction from what was counted, not an
        inference from the two rules. The rule gave ${fmt(MBR, 4)}${Math.abs(got - MBR) < 0.005
          ? ", which the count happens to agree with; set the count elsewhere and it will not."
          : ", which the count does not bear out."}
        <br><br>Leave them uncounted and neither step is available. There is no
        <span class="math">A<sub>0</sub></span> to appeal to and nothing to deduce from, and the two
        arguments allow anything from ${fmt(lo / k, 3)} to ${fmt(hi / k, 3)}.`;
    }
    $("#ex34-say", content).innerHTML = `<div class="note-block">${say}
      <p style="margin-top:8px;margin-bottom:0;">Pooling the two grids does give a countable figure,
      ${bigmark(C1 + C2)} in ${bigmark(N1 + N2)}, or ${fmt(POOL, 2)}. But observe
      <span class="math">A<sub>2</sub></span> twice as often and it moves even though neither argument
      has changed.</p></div>`;

    drawCanvas(lineCanvas);
  }

  content.addEventListener("input", update);
  content.addEventListener("click", (ev) => {
    const cs = ev.target.closest("[data-case]");
    if (cs) {
      picked = CASES.find((c) => c.key === cs.getAttribute("data-case"));
      $$("[data-case]", content).forEach((x) => x.classList.toggle("btn-primary", x === cs));
      counted = false;
      if (picked.k !== undefined) setSlider("ex34_k", picked.k);
      document.getElementById("ex34_k").disabled = !!picked.lock;
      update();
      return;
    }
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "count") counted = true;
    else if (a === "reset") counted = false;
    else return;
    update();
  });
  update();
});
</script>
