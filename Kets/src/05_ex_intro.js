<script>
/* ==========================================================================
   Examples 1-3: the opening idea, Petrie and Naucratis, and the table itself.
   ==========================================================================*/

/* ---- ex1: two real classes whose forms precisely agree ------------------ */
registerExample("example-ex1", (box) => {
  box.appendChild(exHeader("Interactive Example: Two classes, one form", "ex1-content"));
  const content = h(`<div id="ex1-content" class="example-content">
    <p>Here are two real classes of written marks, each defined by its purpose &mdash; and each
      clustering about its own middling form, whose variations overlap.
      <span class="click-cue">Click anywhere on the axis of forms</span> to interrogate a mark of
      that shape; the marker splits into each class's share, and the mark itself is drawn below.</p>
    <div class="ex-buttonbar" id="ex1-pairs"></div>
    <div class="plot-container"></div>
    <div class="ex1-glyphs" style="display:flex;justify-content:space-between;align-items:flex-end;
         margin:0 40px 10px 45px;"></div>
    <div class="note-block" id="ex1-read"><span class="help-text">No mark interrogated yet.</span></div>
  </div>`);
  box.appendChild(content);

  /* each pair: the two purposes, their middling forms on a 0-1 axis of "form",
     and how to draw a mark of a given form */
  const PAIRS = {
    o0: { a: "letter O", b: "digit 0", muA: 0.78, muB: 0.30, sd: 0.14,
      axis: "form (how round the oval is)",
      draw: (c, f, S) => {
        c.lineWidth = S * 0.10;
        c.beginPath(); c.ellipse(S / 2, S / 2, (0.16 + 0.24 * f) * S, 0.40 * S, 0, 0, 2 * Math.PI); c.stroke();
      } },
    l1: { a: "letter I", b: "digit 1", muA: 0.25, muB: 0.75, sd: 0.14,
      axis: "form (serifs give way to the head-flag)",
      draw: (c, f, S) => {
        /* left of centre: serifed capital I, the crossbars growing toward
           almost-square; right of centre: the bars fade and the top-left flag
           takes over, angling down into the digit 1 */
        c.lineWidth = S * 0.10;
        const cx = S * 0.55, top = S * 0.12, bot = S * 0.9;
        c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, bot); c.stroke();
        const serif = Math.max(0, (0.55 - f)) * S * 0.75 + (f < 0.55 ? S * 0.06 : 0);
        if (serif > 1) {
          c.beginPath(); c.moveTo(cx - serif / 2, top); c.lineTo(cx + serif / 2, top); c.stroke();
          c.beginPath(); c.moveTo(cx - serif / 2, bot); c.lineTo(cx + serif / 2, bot); c.stroke();
        }
        const flag = Math.max(0, f - 0.35) * S * 0.5;
        if (flag > 1) {
          c.beginPath(); c.moveTo(cx, top);
          c.lineTo(cx - flag, top + flag * (0.45 + 0.55 * f));
          c.stroke();
        }
      } },
    uv: { a: "letter u", b: "letter v", muA: 0.75, muB: 0.27, sd: 0.14,
      axis: "form (how round the bottom is)",
      draw: (c, f, S) => {
        c.lineWidth = S * 0.10;
        const top = S * 0.18, bot = S * 0.86, L = S * 0.28, R = S * 0.82, M = (L + R) / 2;
        c.beginPath();
        c.moveTo(L, top);
        c.bezierCurveTo(L, top + (bot - top) * (0.4 + 0.55 * f), M - (R - L) * 0.5 * f, bot, M, bot);
        c.bezierCurveTo(M + (R - L) * 0.5 * f, bot, R, top + (bot - top) * (0.4 + 0.55 * f), R, top);
        c.stroke();
      } },
  };
  let pair = "o0", query = null;

  const bar = $("#ex1-pairs", content);
  [["o0", "O and 0"], ["l1", "I and 1"], ["uv", "u and v"]].forEach(([k, lab], i) => {
    const b = h(`<button class="btn btn-sm${k === pair ? " is-active" : ""}" data-k="${k}">${lab}</button>`);
    b.addEventListener("click", () => {
      pair = k; query = null;
      $$("button", bar).forEach((x) => x.classList.toggle("is-active", x.dataset.k === k));
      glyphRow(); drawCanvas(cv);
      $("#ex1-read", content).innerHTML = '<span class="help-text">No mark interrogated yet.</span>';
    });
    bar.appendChild(b);
  });

  const cv = mkCanvas(250, (pl, W, H) => {
    const P = PAIRS[pair];
    const xs = seqBy(-0.1, 1.1, 0.01);
    const yA = xs.map((x) => dnorm(x, P.muA, P.sd)), yB = xs.map((x) => dnorm(x, P.muB, P.sd));
    const ymax = dnorm(0, 0, P.sd) * 1.1;
    pl.setup({ xlim: [-0.1, 1.1], ylim: [0, ymax], mar: [3, 1.4, 0.8, 0.8] });
    pl.axes({ xat: [P.muB, P.muA], xlabels: [P.b, P.a], yat: [] });
    pl.axisLabels(P.axis, "");
    pl.polygon(xs.concat(xs.slice().reverse()), yB.concat(xs.map(() => 0).reverse()), { col: "rgba(176,86,63,.12)" });
    pl.polygon(xs.concat(xs.slice().reverse()), yA.concat(xs.map(() => 0).reverse()), { col: "rgba(47,111,159,.12)" });
    pl.lines(xs, yB, { col: PAL.accent2, lwd: 1.7 });
    pl.lines(xs, yA, { col: PAL.accent, lwd: 1.7 });
    pl.text(P.muB, ymax * 0.93, P.b + "s", { col: PAL.accent2, cex: 0.9 });
    pl.text(P.muA, ymax * 0.93, P.a + "s", { col: PAL.accent, cex: 0.9 });
    if (query !== null) {
      /* the marker, thicker, coloured in each class's share */
      const dA = dnorm(query, P.muA, P.sd), dB = dnorm(query, P.muB, P.sd);
      const pA = dA / (dA + dB), top = ymax * 0.84;
      pl.segments(query, 0, query, top * pA, { col: PAL.accent, lwd: 6 });
      pl.segments(query, top * pA, query, top, { col: PAL.accent2, lwd: 6 });
      pl.text(query, ymax * 0.9 + 0.0, "this form", { col: PAL.ink, cex: 0.8 });
    }
  }, { onclick: (x) => { query = Math.max(0, Math.min(1.02, x)); drawCanvas(cv); read(); } });
  $(".plot-container", content).appendChild(cv);

  function miniGlyph(f, size, col) {
    const el = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    el.width = size * dpr; el.height = size * dpr;
    el.style.width = el.style.height = size + "px";
    const c = el.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.strokeStyle = col || PAL.inkSoft; c.lineCap = "round"; c.lineJoin = "round";
    PAIRS[pair].draw(c, f, size);
    return el;
  }
  function glyphRow() {
    const row = $(".ex1-glyphs", content);
    row.innerHTML = "";
    for (let i = 0; i < 11; i++) row.appendChild(miniGlyph(i / 10, 30));
  }
  glyphRow();

  function read() {
    const P = PAIRS[pair];
    const dA = dnorm(query, P.muA, P.sd), dB = dnorm(query, P.muB, P.sd);
    const pA = dA / (dA + dB);
    const box = h(`<div><p style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">
      <span id="ex1-mark"></span>
      <span>A mark of this form: <strong style="color:${PAL.accent}">${Math.round(pA * 100)}%</strong>
      of them are ${P.a}s, <strong style="color:${PAL.accent2}">${Math.round(100 - pA * 100)}%</strong>
      are ${P.b}s.</span></p>
      <p>That is everything the two curves can say. Handed this one mark with no
      <em>supplementary information</em> &mdash; no surrounding word, no column of figures &mdash;
      we know the proportions, but not <em>which ones</em> had one purpose and which the other.</p></div>`);
    const read = $("#ex1-read", content);
    read.innerHTML = ""; read.appendChild(box);
    $("#ex1-mark", box).appendChild(miniGlyph(query, 46, PAL.ink));
  }
});

/* ---- the Delta map, drawn once, reused by ex11 --------------------------- */
function drawDeltaMap(pl, W, H, opts) {
  const o = opts || {};
  pl.setup({ xlim: [0, 10], ylim: [0, 8], mar: [0.5, 0.5, 0.5, 0.5], ext: false });
  const sea = "rgba(47,111,159,.10)";
  pl.polygon([0, 10, 10, 0], [8, 8, 6.2, 6.6], { col: sea });
  const coast = seqBy(0, 10, 0.25);
  pl.lines(coast, coast.map((x) => 6.6 - 0.4 * Math.sin((x / 10) * Math.PI)), { col: PAL.accent, lwd: 1.2 });
  pl.text(5, 7.4, "Mediterranean Sea", { col: PAL.accent, cex: 0.95, font: 3 });
  const stem = [[5.6, 0.2], [5.5, 1.2], [5.4, 2.2]];
  const canopic = [[5.4, 2.2], [4.4, 3.4], [3.4, 4.6], [2.6, 5.6], [2.2, 6.44]];
  const pelusiac = [[5.4, 2.2], [6.2, 3.4], [7.2, 4.6], [8.0, 5.6], [8.4, 6.34]];
  const rosetta  = [[4.4, 3.4], [4.4, 4.8], [4.6, 6.23]];
  [stem, canopic, pelusiac, rosetta].forEach((br) =>
    pl.lines(br.map((p) => p[0]), br.map((p) => p[1]), { col: PAL.accent, lwd: 2 }));
  pl.text(5.95, 0.6, "Nile", { col: PAL.accent, cex: 0.85, font: 3 });
  o.townDots = {};
  const town = (x, y, name, col, big, dy) => {
    pl.points([x], [y], { col: col || PAL.inkSoft, cex: big ? 1.5 : 1 });
    pl.text(x, y + (dy || -0.42), name, { col: col || PAL.inkSoft, cex: big ? 0.95 : 0.82, font: big ? 2 : 1 });
    o.townDots[name] = [x, y];
  };
  town(1.2, 6.9, "Alexandria", PAL.inkFaint);
  town(3.05, 5.05, "NAUCRATIS", PAL.ink, true, -0.5);
  town(4.55, 5.6, "Sais", o.towns ? KCOL[0] : PAL.inkFaint);
  town(5.9, 1.6, "Memphis", o.towns ? KCOL[1] : PAL.inkFaint);
  town(8.6, 5.9, "Tanis", o.towns ? KCOL[2] : PAL.inkFaint);
  if (o.towns) {
    town(7.35, 3.9, "Bubastis", KCOL[3]);
    town(6.6, 1.9, "Heliopolis", KCOL[4]);
  }
  if (o.note) pl.text(5, 0.25, o.note, { col: PAL.inkFaint, cex: 0.75, font: 3 });
}

/* ---- ex2: Petrie at Naucratis ------------------------------------------- */
registerExample("example-ex2", (box) => {
  box.appendChild(exHeader("Petrie at Naucratis", "ex2-content"));
  const content = h(`<div id="ex2-content" class="example-content">
    <div class="row">
      <div class="col col-4"><img src="${IMG_PETRIE}" alt="W. M. Flinders Petrie"
        style="max-width:100%;border:1px solid var(--rule);">
        <div style="font-size:.78em;color:var(--ink-faint);margin-top:4px;">W. M. Flinders Petrie
        (Wikimedia Commons)</div></div>
      <div class="col col-8"><p style="margin-top:0">William Matthew Flinders Petrie
        (1853&ndash;1942) excavated Naucratis &mdash; the Greek trading town on the Canopic branch
        of the Nile, chartered under Amasis II &mdash; in 1884&ndash;5, and published the weights in
        <em>Naukratis, Part I</em> (1886), chapter 9 of which covers the weights. Metrology ran in
        the family: his first book was a survey of Stonehenge, and his grandfather Matthew Flinders
        charted Australia. The &ldquo;exactitude and circumspection&rdquo; Peirce admired shows in
        the table: each weight measured to a tenth of a Troy grain, with its material, its
        catalogued form, and the correction for damage.</p>
        <p>On the unit's name: the Egyptian is <em>qdt</em> (Coptic &#x2C99;&#x2C93;&#x3EF;), and
        the literature transliterates it Qedet, Kedet, Kite, Kat, or Ket. Petrie wrote <em>kat</em>
        in 1886 and corrected himself to <em>qedet</em> by 1926; Peirce's <em>ket</em> must come
        from elsewhere, as Petrie never uses &ldquo;ket.&rdquo; This edition keeps to &ldquo;ket,&rdquo; Peirce's spelling.</p></div>
    </div>
    <div class="row" style="margin-top:14px;">
      <div class="col col-8"><div class="plot-container" style="margin:0;"></div></div>
      <div class="col col-4"><img src="${IMG_QEDET}" alt="Seven bronze qedet weights, domed, with red catalogue numbers"
        style="max-width:100%;border:1px solid var(--rule);">
        <div style="font-size:.78em;color:var(--ink-faint);margin-top:4px;">Here are five kets
        from University College London's Petrie Museum of Egyptian Archaeology.</div></div>
    </div>
  </div>`);
  box.appendChild(content);
  $(".plot-container", content).appendChild(mkCanvas(280, (pl, W, H) =>
    drawDeltaMap(pl, W, H, { note: "schematic — not to scale" })));
});

/* ---- ex3: Petrie's table, recreated from the verified data --------------- */
registerExample("example-ex3", (box) => {
  box.appendChild(exHeader("Petrie's table: the 158 kets, and Peirce's first cut", "ex3-content"));
  /* the values bounding the unrepresented gaps wider than a third of a grain */
  const tenth = KAT1888.filter((r) => r[9]).map((r) => r[8]);
  const vals = Array.from(new Set(tenth.filter((v) => v <= 151.3))).sort((a, b) => a - b);
  const gapEnds = new Set();
  for (let i = 1; i < vals.length; i++)
    if (vals[i] - vals[i - 1] > 1 / 3 + 1e-9) { gapEnds.add(vals[i - 1]); gapEnds.add(vals[i]); }

  const content = h(`<div id="ex3-content" class="example-content">
    <p>The table below reproduces the Egyptian Ket Standard table on pages 75&ndash;76 of Petrie's
      <em>Naukratis, Part I</em> (1886) &mdash; the Egypt Exploration Fund's Third Memoir, the work
      Peirce cites in the manuscript &mdash; retranscribed and verified against the scan. Peirce
      cleaned the data by removing every weight whose unit was not given to a tenth of a grain
      (<span style="font-variant-numeric:tabular-nums">140&middot;</span> rather than
      <span style="font-variant-numeric:tabular-nums">140&middot;0</span>); in doing so he counted
      fourteen such weights where the table holds sixteen. Petrie also recorded how far each weight
      had strayed from its ancient value &mdash; corrections the third toggle displays. Each cell
      below is one weight:</p>
    <div id="ex3-grid" style="position:relative;height:120px;margin:10px 0;transition:height .5s ease;"></div>
    <div class="ex-buttonbar">
      <button class="btn" id="ex3-filter">Peirce's cut: keep the tenth-of-a-grain kets</button>
      <button class="btn" id="ex3-wrong">where Peirce got it wrong</button>
      <button class="btn" id="ex3-corr">size of correction</button>
      <button class="btn" id="ex3-hist">arrange as a histogram</button>
    </div>
    <p id="ex3-count" class="ex7-work-line" style="text-align:left"></p>
    <div class="table-scroll" style="max-height:320px;overflow-y:auto;border-top:1px solid var(--rule-soft);border-bottom:1px solid var(--rule-soft);">
      <table class="tbl" id="ex3-table"><thead style="position:sticky;top:0;background:var(--paper);"><tr>
        <th>No.</th><th>Material</th><th>Present</th><th>Ancient</th><th>&times;</th><th>Unit</th>
      </tr></thead><tbody></tbody></table>
    </div>
    <div class="note-block" id="ex3-note"></div>
  </div>`);
  box.appendChild(content);

  const grid = $("#ex3-grid", content), tb = $("#ex3-table tbody", content);
  const corrOf = (r) => {
    const pres = parseFloat(String(r[3]).replace(/,/g, "")), anc = parseFloat(String(r[5]).replace(/,/g, ""));
    if (!isFinite(pres) || !isFinite(anc) || !anc) return null;
    return Math.abs(anc - pres) / anc;
  };
  KAT1888.forEach((r) => {
    const c0 = corrOf(r);
    grid.appendChild(h(`<div data-no="${r[0]}" title="No. ${r[0]} — ${esc(r[1])} — unit ${r[7]} grs. — present ${r[3]}, ancient ${r[5]}${c0 !== null ? ", changed " + (100 * c0).toFixed(1) + "%" : ""}" style="position:absolute;
      background:rgba(87,93,102,.22);border-radius:1px;transition:left .6s ease, top .6s ease, width .4s, height .4s;"></div>`));
    tb.appendChild(h(`<tr data-no="${r[0]}">
      <td>${r[0]}</td><td style="text-align:left">${esc(r[1])}</td>
      <td>${r[3]}</td><td>${r[5]}</td><td>${r[6]}</td>
      <td>${r[7]}</td></tr>`));
  });

  const modes = { filter: false, wrong: false, corr: false, hist: false };
  /* two placements for the same 158 cells: 24-per-row catalogue order, or
     stacked into half-grain columns — the histogram the later examples draw */
  function layout() {
    const gw = grid.clientWidth || 600;
    if (!modes.hist) {
      const cols = 24, cell = gw / cols;
      grid.style.height = Math.ceil(KAT1888.length / cols) * cell + "px";
      KAT1888.forEach((r, i) => {
        const el = grid.children[i];
        el.style.width = el.style.height = (cell - 2) + "px";
        el.style.left = (i % cols) * cell + "px";
        el.style.top = Math.floor(i / cols) * cell + "px";
      });
    } else {
      const bins = Math.ceil((153.5 - BIN_0) / BIN_W);
      const cell = Math.min(gw / bins, 13);
      const depth = {};
      let maxD = 1;
      const rows = KAT1888.map((r) => {
        const b = Math.max(0, Math.min(bins - 1, Math.floor((r[8] - BIN_0) / BIN_W)));
        depth[b] = (depth[b] || 0) + 1;
        maxD = Math.max(maxD, depth[b]);
        return [b, depth[b]];
      });
      grid.style.height = (maxD + 1) * cell + "px";
      rows.forEach(([b, d], i) => {
        const el = grid.children[i];
        el.style.width = el.style.height = (cell - 2) + "px";
        el.style.left = b * cell + "px";
        el.style.top = (maxD - d) * cell + "px";
      });
    }
  }
  const NOTES = {
    base: `Broken weights carry a B in Petrie's change column; the red-marked units above are
      those given to the grain only.`,
    filter: `Peirce says this cut leaves <strong>144</strong>: he counted fourteen weights given
      to the grain only, but the printed table holds <strong>sixteen</strong>, so it leaves
      <strong>142</strong>. (His five assumed counts, 36+25+26+23+34, sum to his 144.) He also
      works on the interval 136.8&ndash;151.3, which quietly drops no. 157 at 152.5 grains as well.`,
    wrong: `Amber marks the weights on either side of the stretches wider than a third of a grain
      that no weight occupies &mdash; the intervals his no-gap claim misses (each 0.4&ndash;0.5
      grains). Together with fourteen-for-sixteen, these are small slips of tallying by eye from
      a hand-drawn chart; the conclusion they support survives them.`,
    corr: `Rows shaded by the correction Petrie applied to reach the ancient value:
      unshaded under ½%, <span style="background:rgba(154,123,63,.25);padding:0 4px;">amber to 2%</span>,
      <span style="background:rgba(176,86,63,.25);padding:0 4px;">red beyond</span> (mostly the broken,
      B-marked weights). As Peirce says: basalt and syenite barely wear, so the corrections are small.`,
  };
  function apply() {
    KAT1888.forEach((r, i) => {
      const cell = grid.children[i], tr = tb.children[i];
      let bg = "rgba(87,93,102,.22)", rowBg = "";
      const c = corrOf(r);
      /* correction view: the cell shrinks and warms with the size of the change */
      cell.style.transform = (modes.corr && c !== null)
        ? `scale(${Math.max(0.35, 1 - Math.min(c, 0.06) * 9).toFixed(2)})` : "";
      if (modes.corr && c !== null && c >= 0.005)
        bg = rowBg = c >= 0.02 ? "rgba(176,86,63,.28)" : "rgba(154,123,63,.28)";
      if (modes.wrong && gapEnds.has(r[8])) bg = rowBg = "rgba(154,123,63,.45)";
      if (modes.filter && !r[9]) bg = rowBg = "rgba(176,86,63,.45)";
      cell.style.background = bg;
      tr.style.background = rowBg;
      tr.style.opacity = (modes.filter && !r[9]) ? 0.45 : 1;
    });
    $$("button", $(".ex-buttonbar", content)).forEach((b) => {
      const k = b.id.replace("ex3-", "");
      b.classList.toggle("is-active", !!modes[k]);
    });
    const kept = KAT1888.filter((r) => r[9]).length;
    $("#ex3-count", content).innerHTML = modes.filter
      ? `158 weights &mdash; <strong style="color:var(--accent)">${kept} remain</strong> (Peirce says 144; he counted 14 to-the-grain units, the table holds 16)`
      : `158 weights`;
    $("#ex3-note", content).innerHTML =
      (modes.filter ? NOTES.filter : "") + (modes.wrong ? " " + NOTES.wrong : "") +
      (modes.corr ? " " + NOTES.corr : "") || NOTES.base;
    refreshLive("example-ex3");
  }
  ["filter", "wrong", "corr", "hist"].forEach((k) => {
    $("#ex3-" + k, content).addEventListener("click", () => { modes[k] = !modes[k]; apply(); layout(); });
  });
  apply();
  requestAnimationFrame(layout);
  window.addEventListener("resize", layout);
  registerLive("example-ex3", { n: () => (modes.filter ? "142" : null) });
});
</script>
