<script>
/* ==========================================================================
   EXAMPLE 13 — The hair of the inhabitants of Saturn
   Two distinct arguments live in this passage, and the demonstration keeps
   them apart:
     (i) if every enclosed area must be given one-half, the halves add to more
         than unity;
     (ii) "the relative areas occupied by different classes of colors are
          perfectly arbitrary" - the same colours, laid out differently, give
          the same region a different share of the chart.
   ========================================================================*/

/* four equally defensible ways of spreading the same colours across a chart.
   Each is a monotone bijection of [0,1] onto itself; hue = 360 * f(u).        */
const EX13_CHARTS = [
  { id: "even", name: "Chart A", sub: "equal steps of hue", f: (u) => u },
  { id: "warm", name: "Chart B", sub: "a painter's chart, generous with the warm colours", f: (u) => Math.pow(u, 1.9) },
  { id: "cool", name: "Chart C", sub: "a dyer's chart, generous with the blues", f: (u) => Math.pow(u, 1 / 1.9) },
  { id: "ends", name: "Chart D", sub: "ruled by wavelength, crowding the middle",
    f: (u) => 0.5 + 0.5 * Math.tanh(2.6 * (u - 0.5)) / Math.tanh(1.3) }
];

function ex13Inverse(f, y) {   // f is increasing on [0,1]
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/* share of the chart occupied by the colours between hues a and b */
const ex13Share = (f, a, b) => ex13Inverse(f, b / 360) - ex13Inverse(f, a / 360);

registerExample("example-ex13", (box) => {
  box.appendChild(exHeader("Interactive Example: The Color-Chart and the Inhabitants of Saturn", "ex13-content"));
  const content = h(`<div id="ex13-content" class="example-content">
    <p>We know nothing whatever about the hair of the inhabitants of Saturn. Here is a chart of all possible
      colors, shading into one another. Enclose two areas with a line and ask what the chance is that the hair
      falls within each.</p>

    <div class="control-panel" id="ex13-controls"></div>
    <div class="plot-container" id="ex13-plot"></div>

    <h5>What the conceptualist is obliged to say</h5>
    <div id="ex13-reductio"></div>

    <h5 style="margin-top:22px;">And the areas themselves are arbitrary</h5>
    <p style="font-size:0.95em;">The four charts below contain exactly the same colors; they differ only in how
      much room each color is given. The enclosed regions are the same <em>colors</em> throughout. Their
      <em>areas</em> are not.</p>
    <div class="table-scroll" id="ex13-areas"></div>
    <div class="note-block">Neither answer survives. Assigning one-half to every enclosed area contradicts the
      addition rule as soon as there are more than two areas; assigning each area its share of the chart makes
      the answer depend on which chart the draughtsman happened to rule. There is no fact in the case for a
      probability to be the measure of &mdash; which is Peirce's point: &ldquo;the chance is entirely
      indefinite.&rdquo;</div>
  </div>`);
  box.appendChild(content);

  const ctl = $("#ex13-controls", content);
  ctl.appendChild(select("ex13_chart", "Which color-chart are we using?",
    EX13_CHARTS.map((c) => [c.id, `${c.name} — ${c.sub}`]), "even"));
  ctl.appendChild(slider("ex13_h1", "Area 1 begins at hue:", 0, 340, 20, 5, (v) => `${v}°`));
  ctl.appendChild(slider("ex13_h2", "Area 1 ends / Area 2 begins at hue:", 10, 350, 110, 5, (v) => `${v}°`));
  ctl.appendChild(slider("ex13_h3", "Area 2 ends at hue:", 20, 360, 200, 5, (v) => `${v}°`));
  ctl.appendChild(slider("ex13_n", "Or carve the whole chart into this many areas:", 2, 12, 3, 1));
  content.addEventListener("input", () => update());
  content.addEventListener("change", () => update());

  function bounds() {
    const h1 = Math.min(num("ex13_h1"), 340);
    const h2 = Math.max(h1 + 10, Math.min(num("ex13_h2"), 350));
    const h3 = Math.max(h2 + 10, Math.min(num("ex13_h3"), 360));
    return [h1, h2, h3];
  }
  const chart = () => EX13_CHARTS.find((c) => c.id === val("ex13_chart")) || EX13_CHARTS[0];

  const canvas = mkCanvas(300, (pl) => {
    const c = chart();
    const [h1, h2, h3] = bounds();
    pl.setup({ xlim: [0, 1], ylim: [0, 1], mar: [3, 1, 3, 1], ext: false });
    pl.title(`${c.name} — ${c.sub}`, { cex: 1.05 });
    const NC = 150, NR = 24;
    const top = 0.82, bot = 0.20;
    for (let i = 0; i < NC; i++) {
      const u0 = i / NC, u1 = (i + 1) / NC;
      const hue = 360 * c.f((u0 + u1) / 2);
      for (let j = 0; j < NR; j++) {
        const light = 88 - (j / (NR - 1)) * 60;
        const y0 = bot + (j / NR) * (top - bot), y1 = bot + ((j + 1) / NR) * (top - bot);
        pl.rect(u0, y0, u1, y1, { col: `hsl(${hue.toFixed(1)}, 72%, ${light.toFixed(1)}%)`, border: null });
      }
    }
    const uA0 = ex13Inverse(c.f, h1 / 360), uA1 = ex13Inverse(c.f, h2 / 360);
    const uB1 = ex13Inverse(c.f, h3 / 360);
    const outline = (x0, x1, label, share) => {
      pl.rect(x0, bot, x1, top, { col: null, border: "#1f2328", lwd: 3 });
      pl.text((x0 + x1) / 2, top + 0.08, label, { cex: 0.85, font: 2 });
      pl.text((x0 + x1) / 2, top + 0.03, `${fmt(share * 100, 1)}% of the chart`, { cex: 0.7, col: "#3a3f45" });
    };
    outline(uA0, uA1, "Area 1", uA1 - uA0);
    outline(uA1, uB1, "Area 2", uB1 - uA1);
    pl.text(0.5, bot - 0.06, "every color, shading into its neighbours", { cex: 0.75, col: "#575d66", font: 3 });
    pl.text(0.01, bot - 0.13, `hue ${fmt(360 * c.f(0.001), 0)}°`, { cex: 0.65, col: "#8a9099", adj: 0 });
    pl.text(0.99, bot - 0.13, `hue ${fmt(360 * c.f(0.999), 0)}°`, { cex: 0.65, col: "#8a9099", adj: 1 });
  });
  $("#ex13-plot", content).appendChild(canvas);

  function update() {
    const c = chart();
    const [h1, h2, h3] = bounds();
    const n = num("ex13_n");

    const halfSum = n * 0.5;
    $("#ex13-reductio", content).innerHTML = `
      <div class="row">
        <div class="col col-4"><div style="padding:14px;border:2px solid #2f6f9f;border-radius:6px;text-align:center;">
          <p style="margin-bottom:4px;font-weight:700;">Area 1</p>
          <p style="margin-bottom:4px;font-size:0.85em;color:#575d66;">hues ${h1}°–${h2}°</p>
          <p style="margin-bottom:0;font-size:1.6em;font-weight:700;">&frac12;</p>
          <p style="margin-bottom:0;font-size:0.78em;color:#575d66;">no data either way</p></div></div>
        <div class="col col-4"><div style="padding:14px;border:2px solid #2f6f9f;border-radius:6px;text-align:center;">
          <p style="margin-bottom:4px;font-weight:700;">Area 2</p>
          <p style="margin-bottom:4px;font-size:0.85em;color:#575d66;">hues ${h2}°–${h3}°</p>
          <p style="margin-bottom:0;font-size:1.6em;font-weight:700;">&frac12;</p>
          <p style="margin-bottom:0;font-size:0.78em;color:#575d66;">no data either way</p></div></div>
        <div class="col col-4"><div style="padding:14px;border:2px solid #b0563f;border-radius:6px;text-align:center;background:#f9efec;">
          <p style="margin-bottom:4px;font-weight:700;">Both together</p>
          <p style="margin-bottom:4px;font-size:0.85em;color:#575d66;">hues ${h1}°–${h3}°</p>
          <p style="margin-bottom:0;font-size:1.1em;font-weight:700;color:#b0563f;">
            &frac12; + &frac12; = 1 &nbsp;<span style="font-weight:400;">by addition</span></p>
          <p style="margin-bottom:0;font-size:1.1em;font-weight:700;color:#b0563f;">
            &frac12; &nbsp;<span style="font-weight:400;">by the same principle</span></p></div></div>
      </div>
      <div style="padding:15px;background:#f2dcd8;border:1px solid #e9cec8;border-radius:5px;margin-top:14px;">
        <p style="margin-bottom:6px;"><strong>The contradiction.</strong> The two areas are incompatible, so the
          rule for the addition of probabilities gives their union <strong>1</strong>. But the union is itself
          an enclosed area about which we are equally ignorant, so the same reasoning gives it
          <strong>&frac12;</strong>. &ldquo;The probability for each of the smaller areas being one-half, that
          for the larger should be at least unity, which is absurd.&rdquo;</p>
        <p style="margin-bottom:0;">Carve the chart into <strong>${n}</strong> areas instead and the same
          principle awards &frac12; to each: the probabilities of ${n} exhaustive, incompatible alternatives
          sum to <strong>${fmt(halfSum, 1)}</strong>, where they are obliged to sum to 1.</p>
      </div>`;

    const rows = EX13_CHARTS.map((cc) => {
      const a = ex13Share(cc.f, h1, h2), b = ex13Share(cc.f, h2, h3);
      const cur = cc.id === c.id ? ' style="background:#f5ead1;font-weight:700;"' : "";
      return `<tr${cur}><td style="text-align:left;">${cc.name} &mdash; ${cc.sub}</td>
        <td>${fmt(a * 100, 1)}%</td><td>${fmt(b * 100, 1)}%</td><td>${fmt((a + b) * 100, 1)}%</td></tr>`;
    }).join("");
    const shares = EX13_CHARTS.map((cc) => ex13Share(cc.f, h1, h2));
    const lo = Math.min(...shares), hi = Math.max(...shares);
    $("#ex13-areas", content).innerHTML = `<table class="tbl">
      <thead><tr><th style="text-align:left;">Layout of the chart</th>
        <th>Area 1<br>(hues ${h1}°–${h2}°)</th><th>Area 2<br>(hues ${h2}°–${h3}°)</th><th>Both</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="font-size:0.9em;margin-top:10px;">The very same colors &mdash; hues ${h1}° to ${h2}° &mdash;
        occupy anywhere from <strong>${fmt(lo * 100, 1)}%</strong> to <strong>${fmt(hi * 100, 1)}%</strong> of the
        chart, a factor of ${fmt(hi / Math.max(lo, 1e-9), 1)}, depending only on how the chart was drawn.</p>`;
    drawCanvas(canvas);
  }
  update();
});

/* ==========================================================================
   Held back for the moment.

   The examples themselves are untouched, above and in their own files; this
   only replaces what their triggers open, so that nothing has to be unpicked
   to put them back. Delete this block and they return as they were.
   ========================================================================*/
["example-ex22", "example-ex23", "example-ex24", "example-ex25"].forEach((id) => {
  registerExample(id, (box) => {
    box.appendChild(h(`<div class="example-content" style="padding-top:2px;">
      <p class="ed-note" style="margin-bottom:0;">Coming soon.</p></div>`));
  });
});
</script>
</body>
</html>
