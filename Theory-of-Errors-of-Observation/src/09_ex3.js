<script>
/* ==========================================================================
   THE TWENTY-FOUR DAYS — the tables and the plate

   Not behind a trigger. This is the apparatus for the whole experimental half
   of the paper, so it sits open at the foot of the page.

   Three views of the same data. The tables as Peirce set them, with his
   abbreviation of the leading digits intact. The plate, either his own or
   redrawn from the tables with the smoothing in your hands. And one day at a
   time, larger.

   The smoothing is his: "smoothed off by the addition of adjacent numbers in
   the table eight times over". Adding adjacent entries is convolution with
   [1,1]; doing it eight times is the eighth row of Pascal's triangle. The sums
   are divided back by 2^passes so the vertical scale stays comparable — he
   would have rescaled when drawing. The smoother curve on each of his figures
   is not a fit of any kind: it is "a mean curve for every day drawn by eye".
   ========================================================================*/
(function () {
  const host = document.getElementById("ex3-block");
  if (!host) return;

  let view = "table", di = 0, passes = 8, meanSd = 22, plateOriginal = false;
  const overlay = { mean: true, gauss: false };

  const D = () => PEIRCE_DAYS[di];

  /* ------------------------------------------------------------ maths ---- */
  function smooth(c, k) {
    let a = c.slice();
    for (let p = 0; p < k; p++) {
      const b = new Array(a.length).fill(0);
      for (let i = 0; i < a.length; i++) b[i] = a[i] + (i + 1 < a.length ? a[i + 1] : 0);
      a = b;
    }
    const shift = Math.round(k / 2), out = new Array(a.length).fill(0);
    for (let i = 0; i < a.length; i++) {
      const j = i - shift;
      if (j >= 0 && j < a.length) out[i] = a[j] / Math.pow(2, k);
    }
    return out;
  }
  // Peirce's "mean curve for every day drawn by eye". How much of the bounce a
  // hand leaves in is a matter of the hand, so it is put on a slider.
  function meanCurve(c, sd) {
    const R = Math.ceil(sd * 3), w = [];
    for (let i = -R; i <= R; i++) w.push(Math.exp(-0.5 * (i / sd) * (i / sd)));
    const tot = w.reduce((s, v) => s + v, 0);
    return c.map((_, i) => {
      let s = 0;
      for (let j = -R; j <= R; j++) if (c[i + j] !== undefined) s += c[i + j] * w[j + R];
      return s / tot;
    });
  }
  function moments(c, lo) {
    let n = 0, s = 0;
    c.forEach((v, i) => { n += v; s += v * (lo + i); });
    const m = s / n;
    let q = 0;
    c.forEach((v, i) => { q += v * Math.pow(lo + i - m, 2); });
    return { n, mean: m, sd: Math.sqrt(q / n) };
  }
  function medianOf(c, lo) {
    const n = c.reduce((s, v) => s + v, 0);
    let acc = 0;
    for (let i = 0; i < c.length; i++) { acc += c[i]; if (acc >= n / 2) return lo + i; }
    return lo;
  }

  /* --------------------------------------------------------- the month ---
     July 1872 began on a Monday. Every Sunday is missing from the series, and
     so are the 2nd to the 4th — Independence Day and the days about it — and
     the 11th to the 13th. Setting the days out as a month shows the shape of
     the month's work in a way a list of dates does not. */
  const DOW = ["S", "M", "T", "W", "T", "F", "S"];
  const MONTHS = [
    { name: "July 1872", days: 31, firstDow: 1, month: "July" },
    { name: "August 1872", days: 3, firstDow: 4, month: "August" },
  ];
  const dayIndex = (month, d) => PEIRCE_DAYS.findIndex((p) => p.date === `${month} ${d}`);

  function calendarHTML() {
    let out = `<div class="cal-wrap">`;
    for (const m of MONTHS) {
      out += `<div class="cal"><div class="cal-name">${esc(m.name)}</div><div class="cal-grid">`;
      out += DOW.map((d) => `<div class="cal-dow">${d}</div>`).join("");
      for (let i = 0; i < m.firstDow; i++) out += `<div class="cal-day blank"></div>`;
      for (let d = 1; d <= m.days; d++) {
        const i = dayIndex(m.month, d);
        out += (i < 0)
          ? `<div class="cal-day off">${d}</div>`
          : `<button class="cal-day has${i === di ? " is-on" : ""}" data-day="${i}"
              title="${esc(PEIRCE_DAYS[i].n)} — ${bigmark(PEIRCE_DAYS[i].total)} observations">${d}</button>`;
      }
      out += `</div></div>`;
    }
    return out + `</div>`;
  }

  /* ------------------------------------------------- Peirce's own table ---
     Nine column-pairs, each read downwards, as at pp. 138-158, with his
     abbreviation kept: the time is set in full at the head and the foot of a
     column, wherever the run of milliseconds breaks, and at every multiple of
     ten; elsewhere the last digit alone. */
  function tableHTML(d) {
    const cols = [];
    for (let k = 0; k < 9; k++) cols.push(dayColumn(d, k));
    let out = `<table class="peirce-data-table"><caption>${esc(d.n)}. ${esc(d.date)}, 1872</caption><tr>`;
    for (let k = 0; k < 9; k++) out += `<th>Thousandths<br>of a second</th><th>Number of<br>observations</th>`;
    out += `</tr>`;
    for (let r = 0; r < d.per; r++) {
      out += "<tr>";
      for (let k = 0; k < 9; k++) {
        const cell = cols[k][r];
        if (!cell) { out += `<td></td><td class="pc"></td>`; continue; }
        const [x, y] = cell;
        const prev = r > 0 && cols[k][r - 1] ? cols[k][r - 1][0] : null;
        const last = r === cols[k].length - 1;
        const label = (prev === null || last || x !== prev + 1 || x % 10 === 0)
          ? String(x) : String(x % 10);
        out += `<td class="pv">${label}</td><td class="pc">${y}</td>`;
      }
      out += "</tr>";
    }
    return out + "</table>";
  }

  /* ---------------------------------------------------------- one day ---- */
  const one = mkCanvas(340, (pl) => {
    const d = D(), dc = dayCounts(d), c = dc.counts, lo = dc.lo;
    const sm = smooth(c, passes), m = moments(c, lo);
    const xlo = Math.max(lo, Math.round(m.mean - 4.2 * m.sd));
    const xhi = Math.min(lo + c.length - 1, Math.round(m.mean + 4.2 * m.sd));
    const top = niceMax(Math.max(...sm) * 1.25, 1);
    pl.setup({ xlim: [xlo, xhi], ylim: [0, top], mar: [3.2, 3.6, 2.2, 1.2] });
    pl.axes({ nx: 6 });
    pl.box();
    pl.axisLabels("Interval between the signal and the answer, in thousandths of a second",
                  "Number of observations");
    pl.title(`${d.n} — ${d.date}, 1872`, { cex: 1.0 });
    pl.clip(true);
    const xs = sm.map((_, i) => lo + i);
    if (passes === 0) {
      for (let i = 0; i < c.length; i++)
        if (c[i]) pl.segments(lo + i, 0, lo + i, c[i], { col: "rgba(47,111,159,0.55)", lwd: 1 });
    }
    pl.lines(xs, sm, { col: PAL.accent, lwd: 1.6 });
    if (overlay.mean) pl.lines(xs, meanCurve(c, meanSd), { col: PAL.ink, lwd: 2.2 });
    if (overlay.gauss) pl.lines(xs, xs.map((x) => dnorm(x, m.mean, m.sd) * m.n),
      { col: PAL.accent3, lwd: 2, lty: 2 });
    pl.clip(false);
    const leg = ["The figures, smoothed"], col = [PAL.accent];
    if (overlay.mean) { leg.push("A mean curve, by eye"); col.push(PAL.ink); }
    if (overlay.gauss) { leg.push("The Gaussian of the same mean and spread"); col.push(PAL.accent3); }
    pl.legend("topright", { legend: leg, fill: col, cex: 0.68 });
  });

  /* ---------------------------------------------------------- the plate --
     Twenty-four panels, two columns of twelve, as on Plate 27. Every panel is
     drawn at the same smoothing, so the slider moves the whole month at once. */
  const plate = mkCanvas(1420, (pl) => {
    const W = pl.W, H = pl.H, rows = 12, colW = W / 2, panelH = (H - 26) / rows;
    const LABGAP = 13;                       // room under each baseline for its scale
    const ctx = pl.ctx;
    ctx.clearRect(0, 0, W, H);
    PEIRCE_DAYS.forEach((d, i) => {
      const col = i < rows ? 0 : 1, r = i % rows;
      const x0 = col * colW + 66, x1 = col * colW + colW - 14;
      const yBase = 22 + r * panelH + panelH - 8 - LABGAP;
      const dc = dayCounts(d), c = dc.counts, m = moments(c, dc.lo);
      const sm = smooth(c, passes), mc = meanCurve(c, meanSd);
      const lo = Math.round(m.mean - 3.6 * m.sd), hi = Math.round(m.mean + 3.6 * m.sd);
      const top = Math.max(...sm) * 1.12 || 1;
      const X = (v) => x0 + (v - lo) / (hi - lo) * (x1 - x0);
      const Y = (v) => yBase - (v / top) * (panelH - 14);
      ctx.strokeStyle = PAL.rule; ctx.lineWidth = 1; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x0, yBase); ctx.lineTo(x1, yBase); ctx.stroke();
      // the four verticals, each with the millisecond it stands at written under it
      ctx.fillStyle = PAL.inkFaint; ctx.font = `9px ${PLOT_FACE}`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (let g = 1; g <= 4; g++) {
        const gx = x0 + (x1 - x0) * g / 5;
        ctx.beginPath(); ctx.moveTo(gx, yBase); ctx.lineTo(gx, yBase - panelH + 10 + LABGAP); ctx.stroke();
        ctx.fillText(String(Math.round(lo + (hi - lo) * g / 5)), gx, yBase + 3);
      }
      ctx.fillStyle = PAL.ink; ctx.font = `10px ${PLOT_FACE}`;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(`${d.n} ${d.date}`, x0 - 6, yBase - panelH / 2 + 4);
      const draw = (arr, colr, lw) => {
        ctx.strokeStyle = colr; ctx.lineWidth = lw; ctx.beginPath();
        let started = false;
        for (let j = 0; j < arr.length; j++) {
          const xv = dc.lo + j;
          if (xv < lo || xv > hi) continue;
          const px = X(xv), py = Y(arr[j]);
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };
      draw(sm, PAL.accent, 1);
      if (overlay.mean) draw(mc, PAL.ink, 1.6);
    });
    ctx.fillStyle = PAL.inkSoft; ctx.font = `italic 12px ${PLOT_FACE}`; ctx.textAlign = "center";
    ctx.fillText("Redrawn from the tables — all twenty-four days at the same smoothing", W / 2, 12);
  });

  /* ---------------------------------------------------------- rendering -- */
  const passSlider = (id) => slider(id, "Smoothing passes:", 0, 16, passes, 1,
    (v) => (v === 0 ? "none — the raw figures" : v === 8 ? "8 — as Peirce had it" : String(v)));
  const meanSlider = (id) => slider(id, "The mean curve, drawn by eye:", 4, 48, meanSd, 1,
    (v) => (v <= 10 ? v + " — bouncy" : v >= 34 ? v + " — very smooth" : String(v)), "k4");

  function render() {
    const body = $("#ex3-body", host);
    if (view === "table") {
      const d = D(), dc = dayCounts(d), m = moments(dc.counts, dc.lo);
      body.innerHTML = `
        <div class="row">
          <div class="col col-7">${calendarHTML()}</div>
          <div class="col col-5"><div class="key-insight" style="margin-top:0;">
            <p style="margin-bottom:0;">${esc(d.n)} &mdash; ${esc(d.date)}. This table sums to
            <strong>${bigmark(d.total)}</strong> observations${d.total === 500 ? ""
              : `, not the five hundred Peirce says he took each day`}.
            Mean ${fmt(m.mean, 1)} ms, median ${bigmark(medianOf(dc.counts, dc.lo))} ms.</p>
          </div></div>
        </div>
        <div class="table-scroll">${tableHTML(d)}</div>`;
    } else if (view === "plate") {
      body.innerHTML = `
        <div class="ex-buttonbar">
          <button class="btn btn-sm" data-act="plate-redraw">The redrawing</button>
          <button class="btn btn-sm" data-act="plate-orig">Peirce&rsquo;s own plate</button>
          ${plateOriginal ? "" : `<span class="bar-sep"></span>
            <button class="btn btn-sm" data-act="mean">Mean curves</button>
            <button class="btn btn-sm" data-act="peirce">Reset to Peirce&rsquo;s</button>`}
        </div>
        ${plateOriginal ? "" : `<div id="ex3-plate-ctl"></div>`}
        <div id="ex3-plate-body"></div>`;
      const pb = $("#ex3-plate-body", body);
      if (plateOriginal) {
        pb.innerHTML = `<figure class="plate-orig">
          <img src="Text/plate-27.png" alt="Plate 27, diagrams illustrating Appendix No. 21">
          <figcaption>Plate 27 as engraved for the Coast Survey Report for 1870.</figcaption></figure>`;
      } else {
        $("#ex3-plate-ctl", body).appendChild(passSlider("ex3_pass_p"));
        $("#ex3-plate-ctl", body).appendChild(meanSlider("ex3_msd_p"));
        pb.appendChild(plate);
        drawCanvas(plate);
      }
    } else {
      body.innerHTML = `
        <div class="row">
          <div class="col col-4">
            ${calendarHTML()}
            <div id="ex3-ctl"></div>
            <div class="ex-buttonbar">
              <button class="btn btn-sm" data-act="mean">Mean curve by eye</button>
              <button class="btn btn-sm" data-act="gauss">Lay a Gaussian over it</button>
              <button class="btn btn-sm" data-act="peirce">Reset to Peirce&rsquo;s</button>
              <button class="btn btn-warning btn-sm" data-act="clear">Clear the overlays</button>
            </div>
            <div id="ex3-readout"></div>
          </div>
          <div class="col col-8">
            <div class="plot-container" id="ex3-one"></div>
            <div class="table-scroll ex3-day-table">${tableHTML(D())}</div>
          </div>
        </div>`;
      $("#ex3-ctl", body).appendChild(passSlider("ex3_pass"));
      $("#ex3-ctl", body).appendChild(meanSlider("ex3_msd"));
      $("#ex3-one", body).appendChild(one);
      $("#ex3-readout", body).innerHTML = readout();
      drawCanvas(one);
    }
    syncButtons();
  }

  function readout() {
    const d = D(), dc = dayCounts(d), m = moments(dc.counts, dc.lo);
    return `<div class="key-insight" style="margin-top:0;">
      <p style="margin-bottom:6px;"><strong>${esc(d.n)}</strong> &mdash; ${esc(d.date)}, 1872.</p>
      <p style="margin-bottom:0;">${bigmark(d.total)} observations, from ${bigmark(dc.lo)} to
      ${bigmark(dc.lo + dc.counts.length - 1)} ms. Mean ${fmt(m.mean, 1)},
      median ${bigmark(medianOf(dc.counts, dc.lo))}, standard deviation ${fmt(m.sd, 1)} ms.</p></div>`;
  }

  function syncButtons() {
    $$("[data-act]", host).forEach((b) => {
      const a = b.getAttribute("data-act");
      b.classList.toggle("is-active",
        (a === "mean" && overlay.mean) || (a === "gauss" && overlay.gauss) ||
        (a === "plate-redraw" && !plateOriginal) || (a === "plate-orig" && plateOriginal));
    });
  }

  function redraw() {
    if (view === "plate" && !plateOriginal) drawCanvas(plate);
    else if (view === "day") drawCanvas(one);
  }

  /* ------------------------------------------------------------ events -- */
  host.addEventListener("click", (ev) => {
    const tab = ev.target.closest("[data-view]");
    if (tab) {
      view = tab.getAttribute("data-view");
      $$("#ex3-tabs .mode-tab", host).forEach((t) => t.classList.toggle("active", t === tab));
      render(); return;
    }
    const cell = ev.target.closest("[data-day]");
    if (cell) { di = +cell.getAttribute("data-day"); render(); return; }
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "plate-redraw" || a === "plate-orig") {
      plateOriginal = a === "plate-orig"; render(); return;
    }
    if (a === "mean") overlay.mean = !overlay.mean;
    else if (a === "gauss") overlay.gauss = !overlay.gauss;
    else if (a === "peirce") {            // eight passes, a mean curve, nothing else
      passes = 8; meanSd = 22; overlay.mean = true; overlay.gauss = false;
      ["ex3_pass", "ex3_pass_p"].forEach((s) => { if (document.getElementById(s)) setSlider(s, 8); });
      ["ex3_msd", "ex3_msd_p"].forEach((s) => { if (document.getElementById(s)) setSlider(s, 22); });
    } else if (a === "clear") {
      overlay.mean = false; overlay.gauss = false;
    } else return;
    syncButtons(); redraw();
  });

  host.addEventListener("input", (ev) => {
    const id = ev.target.id;
    if (id === "ex3_pass" || id === "ex3_pass_p") { passes = +ev.target.value; redraw(); }
    else if (id === "ex3_msd" || id === "ex3_msd_p") { meanSd = +ev.target.value; redraw(); }
  });

  /* --------------------------------------------------------- the block --- */
  host.innerHTML = `
    <span class="ex-num" aria-hidden="true">3</span>
    <h5 class="ex3-head">The twenty-four days &mdash; the tables and the plate</h5>
    <p class="ex3-lead">Five hundred observations on every week-day for a month, recorded to the
      millisecond on the Hipp chronoscope. The tables are set here as Peirce set them, and the plate
      is redrawn from them, so the smoothing he describes can be taken apart.</p>
    <div class="mode-tabs" id="ex3-tabs">
      <button class="mode-tab active" data-view="table">The tables</button>
      <button class="mode-tab" data-view="plate">The plate</button>
      <button class="mode-tab" data-view="day">One day</button>
    </div>
    <div id="ex3-body"></div>`;
  render();
})();
</script>
