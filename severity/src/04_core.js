<script>
/* ============================================================================
   Shared state and the pieces every scenario uses.

   The four scenarios differ in what the data look like — a sample mean, a
   2x2 table of forecasts, a count of cups — but they are all asked the same
   question, and they all answer it with the same three-way verdict. Keeping
   the classification, the colours and the table shape here is what makes the
   comparison across scenarios legible.
   ==========================================================================*/

const State = {
  scenario: 'water',

  /* The two continuous scenarios are the same test with different framing, so
     they run the same code — but they keep separate copies of the settings,
     so that fiddling with the custom test does not silently rewrite the water
     plant example you came in on. Water pins μ₀ at 150; custom exposes it. */
  cont: {
    water:  { observedMean: 152, claimMu: 153, alpha: 0.025, n: 100, sigma: 10, mu0: 150 },
    custom: { observedMean: 152, claimMu: 153, alpha: 0.025, n: 100, sigma: 10, mu0: 150 },
  },

  // Finley's tornado forecasts, 1884-1891
  tp: 28, tn: 2680, fp: 72, fn: 23,
  claimTpr: 0.5,
  /* The R original opened on FPR < 0.1. With a standard error of 0.003 that
     claim clears the observed rate by some twenty-four standard errors — it
     passes trivially and shows nothing. 0.03 sits about where the question is
     actually live. */
  claimFpr: 0.03,

  // Fisher's lady tasting tea: j = milk-first cups correctly identified, 0..4
  teaCorrect: 4,
  teaClaim: 0.75,

};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* Round to a slider's step so that dragging and the slider agree on the value.
   The trailing toFixed clears the binary-fraction drift that would otherwise
   leave 151.2 stored as 151.20000000000002 and fail an equality test in the
   tables. */
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

function severityBar(sev) {
  const pct = Math.round(Math.max(0, Math.min(1, sev)) * 100);
  return `<div class="severity-bar" style="background: linear-gradient(to right,
    #4caf50 ${pct}%, #eee ${pct}%);"></div>`;
}

// the headline readout: the number first, everything else in support of it
function severityReadout(claimHtml, sev, extraHtml) {
  const [cls, level] = severityClass(sev);
  return `<div class="severity-box ${cls}">
    <div>${claimHtml}</div>
    <div class="sev-headline">${Number.isFinite(sev) ? rround(sev, 3) : '—'}<span
      class="sev-level">${level}</span></div>
    ${severityBar(sev)}
    ${extraHtml || ''}
  </div>`;
}

/* A disclosure. The tables are the least readable form of the answer and the
   plots are the most, so the numbers live behind a click — present for anyone
   who wants to check them, absent for everyone who does not. The inner div is
   what gets re-rendered, so the open/closed state survives every redraw. */
function foldedNumbers(summary) {
  return h(`<details class="fold"><summary>${summary}</summary>
    <div class="fold-body"></div></details>`);
}

/* -------------------------------------------------------------- COLORS --- */

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

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
  weak:      '#f9a825',
  bent:      '#c62828',
};

/* Where to put the value label so it clears both reference lines. A number
   sitting on top of the 0.84 rule is exactly the number you most want to read
   against it. */
function severityLabelY(sev) {
  const clear = (y) => y > 0.06 && y < 0.95
    && Math.abs(y - 0.84) > 0.04 && Math.abs(y - 0.5) > 0.04;
  return [sev + 0.1, sev - 0.1, sev + 0.17, sev - 0.17].find(clear)
    || clamp(sev + 0.1, 0.06, 0.95);
}

// horizontal reference lines drawn on every severity curve
function severityBenchmarks(pl, o = {}) {
  pl.abline({ h: 0.84, col: COL.pass, lwd: 1.2, lty: 3 });
  pl.abline({ h: 0.5, col: COL.bent, lwd: 1.2, lty: 3 });
  if (o.labels !== false) {
    const x = o.at !== undefined ? o.at : pl.xlim[1];
    const adj = o.adj !== undefined ? o.adj : 1;
    pl.text(x, 0.885, 'passes severely (0.84)', { col: COL.pass, adj, cex: 0.64 });
    pl.text(x, 0.455, 'BENT below 0.5', { col: COL.bent, adj, cex: 0.64 });
  }
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

/* ---------------------------------------------------- BAYES FACTOR KEY --- */

// Jeffreys' grades, stated in terms of BF10 (evidence for H1 over H0)
function bfInterpretation(bf10) {
  if (!Number.isFinite(bf10)) return '—';
  const strength = (b) => b > 100 ? 'Extreme' : b > 30 ? 'Very strong'
    : b > 10 ? 'Strong' : b > 3 ? 'Moderate' : b > 1 ? 'Weak' : null;
  if (bf10 >= 1) {
    const s = strength(bf10);
    return s ? `${s} evidence for H₁` : 'No evidence either way';
  }
  const s = strength(1 / bf10);
  return s ? `${s} evidence for H₀` : 'No evidence either way';
}

/* ------------------------------------------------------- SCENARIO HOST --- */
/* Each scenario module registers a builder here; the switcher in 08_close.js
   calls it the first time that scenario is shown and never again, so slider
   positions survive switching away and back. */

const SCENARIOS = {};
function registerScenario(key, buildFn) { SCENARIOS[key] = { build: buildFn, built: false }; }
</script>
