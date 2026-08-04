<script>
/* ============================================================================
   State, and the pieces the severity calculation is judged by.
   ==========================================================================*/

const MU0 = 150;   // the standard the plant is held to, in °F

const State = {
  observedMean: 152,
  claimMu: 153,
  alpha: 0.025,
  n: 100,
  sigma: 10,
  // which mean a simulated sample is drawn from: the null, or the claim
  sampleFrom: 'null',
  /* Whether the axes follow the sampling distribution or hold still. Following
     it keeps the picture legible at any n; holding still is what makes the
     effect OF n visible, because the curve then narrows and rises inside a
     stationary frame instead of the frame shrinking to match it. */
  rescale: true,
};

/* The endpoints of the sample-size slider. With the axes held still the frame
   is sized for the widest distribution n can produce and the tallest, so that
   the whole sweep of the slider stays on screen. */
const N_MIN = 10, N_MAX = 500;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* Round to a slider's step so that dragging and the slider agree on the value.
   The trailing toFixed clears the binary-fraction drift that would otherwise
   leave 151.2 stored as 151.20000000000002 and fail an equality test in the
   table. */
const snap = (v, step) => +(Math.round(v / step) * step).toFixed(6);

/* ------------------------------------------------------------ VERDICTS --- */

/* Mayo's thresholds as they are usually reported: 0.84 is one standard error
   of headroom, and below 0.5 the data would look like this at least as often
   were the claim false — the claim is BENT, not merely unproven. */
function severityClass(sev) {
  if (!Number.isFinite(sev)) return ['severity-box', '—'];
  if (sev >= 0.95) return ['severity-high', 'Very High'];
  if (sev >= 0.84) return ['severity-high', 'High'];
  if (sev >= 0.5) return ['severity-medium', 'Moderate'];
  return ['severity-low', 'Low (BENT)'];
}
function assessLabel(sev) {
  if (!Number.isFinite(sev)) return ['—', ''];
  if (sev >= 0.84) return ['Pass', 'assess-pass'];
  if (sev >= 0.5) return ['Weak', 'assess-weak'];
  return ['BENT', 'assess-bent'];
}
const SEV_KEY = `<p class="help-text">Pass &ge; 0.84 &nbsp;&middot;&nbsp; Weak &ge; 0.5
  &nbsp;&middot;&nbsp; below that the claim is <em>BENT</em> — the data would look like this
  even if it were false.</p>`;

// the headline readout: the number first, everything else in support of it
function severityReadout(claimHtml, sev, extraHtml) {
  const [cls, level] = severityClass(sev);
  const pct = Math.round(clamp(sev, 0, 1) * 100);
  return `<div class="severity-box ${cls}">
    <div>${claimHtml}</div>
    <div class="sev-headline">${Number.isFinite(sev) ? rround(sev, 3) : '—'}<span
      class="sev-level">${level}</span></div>
    <div class="severity-bar" style="background: linear-gradient(to right,
      #4caf50 ${pct}%, #eee ${pct}%);"></div>
    ${extraHtml || ''}
  </div>`;
}

/* -------------------------------------------------------------- COLORS --- */

/* Red, amber and green belong to severity and to nothing else on this page.
   The rejection region — which is about the test's verdict, not about how well
   any claim survived — is therefore grey, and the null curve slate. */
const COL = {
  null:      '#455a64',   // the hypothesis being tested
  claim:     '#1565c0',   // the claim whose severity is being computed
  critical:  '#ef6c00',
  observed:  '#6a1b9a',
  severity:  '#2e7d32',
  reject:    '#78909c',   // the rejection region, deliberately inert
  pass:      '#2e7d32',
  bent:      '#c62828',
};

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

/* --------------------------------------------------------------- PLOTS --- */

/* Where to put the value label so it clears both reference lines. A number
   sitting on top of the 0.84 rule is exactly the number you most want to read
   against it. */
function severityLabelY(sev) {
  const clear = (y) => y > 0.06 && y < 0.95
    && Math.abs(y - 0.84) > 0.04 && Math.abs(y - 0.5) > 0.04;
  return [sev + 0.1, sev - 0.1, sev + 0.17, sev - 0.17].find(clear)
    || clamp(sev + 0.1, 0.06, 0.95);
}

// the two horizontal reference lines on the severity curve
function severityBenchmarks(pl, o = {}) {
  pl.abline({ h: 0.84, col: COL.pass, lwd: 1.2, lty: 3 });
  pl.abline({ h: 0.5, col: COL.bent, lwd: 1.2, lty: 3 });
  const x = o.at !== undefined ? o.at : pl.xlim[1];
  const adj = o.adj !== undefined ? o.adj : 1;
  pl.text(x, 0.885, 'passes severely (0.84)', { col: COL.pass, adj, cex: 0.64 });
  pl.text(x, 0.455, 'BENT below 0.5', { col: COL.bent, adj, cex: 0.64 });
}

// shade the area under ys[i0..i1) down to a baseline
function fillRegion(pl, xs, ys, i0, i1, baseline, color) {
  if (i1 <= i0) return;
  pl.ribbon(xs.slice(i0, i1), ys.slice(i0, i1), baseline, { col: color });
}

// index of the first x at or past `v` (the whole array if there is none)
function cutAt(xs, v) {
  const i = xs.findIndex((x) => x >= v);
  return i === -1 ? xs.length : i;
}

// evenly spaced grid, the way seq(from, to, length.out = n) does it
function grid(from, to, n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = from + (i / (n - 1)) * (to - from);
  return out;
}
// seq(from, to, by = step), tolerant of floating point
function seqBy(from, to, step) {
  const out = [];
  for (let v = from; v <= to + step * 1e-6; v += step) out.push(+v.toFixed(10));
  return out;
}
</script>
