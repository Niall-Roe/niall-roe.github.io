<script>
/* ============================================================================
   Shared core.

   SDT and Neyman-Pearson are the SAME two normal distributions and the SAME
   threshold; only the vocabulary differs. So there is one set of parameters
   here, and switching mode swaps a label table — the curves do not move.

   Each mode still adds its own apparatus on top (the NP simulation has a
   "reality" distribution the SDT one has no use for, the SDT simulation has a
   trial-by-trial confusion matrix); that lives in the per-tab files.
   ==========================================================================*/

const State = {
  mode: 'sdt',           // 'sdt' | 'np' | 'compare'
  tab: 1,                // 1 = Parameters, 2 = Simulation, 3 = Severity

  /* ---- the shared distributions ----
     dist2 ("noise" / H0) is always N(0, 1) and anchors the scale.
     dist1 ("signal" / H1) is N(separation, spread). */
  separation: 1.5,
  threshold: 1.0,
  spread: 1.0,

  constraint: 'none',    // none | lr | hit | fa
  targetLr: 1,
  targetHit: 0.75,
  targetFa: 0.05,

  preset: { sdt: 'custom', np: 'custom' },

  /* NP-only. Which of these two is the master decides what n does:
       npHold 'separation' — d√n is fixed, so n only reinterprets it as
                             d = (d√n)/√n and the curves never move;
       npHold 'd'          — Cohen's d is fixed, so raising n pushes the
                             alternative rightward (separation = d√n) and
                             power climbs. */
  nInterp: 25,
  npHold: 'separation',
  effectD: 0.3,            // = separation / sqrt(nInterp)

  showLr: false,
  showLrSlope: false,
  showSkill: false,
  separateDists: false,

  core: { d: 1.5, t: 1.0, s: 1.0 },
};

/* ------------------------------------------------------------- LABELS --- */

const LABELS = {
  sdt: {
    modeName: 'Signal Detection Theory',
    separation: 'Sensitivity (d′)',
    threshold: 'Criterion (c)',
    spread: 'Signal Std Dev (σ)',
    thresholdShort: 'c',
    separationShort: 'd′',
    dist1: 'Signal', dist2: 'Noise',
    state1: 'Signal PRESENT', state2: 'Signal ABSENT',
    resp1: 'Response: YES', resp2: 'Response: NO',
    cells: ['Hit', 'Miss', 'False Alarm', 'Correct Rejection'],
    hitName: 'Hit Rate', faName: 'False Alarm Rate',
    curveTitle: 'ROC Space',
    curveX: 'P(False Alarm)', curveY: 'P(Hit)',
    distTitle: 'Evidence Distributions',
    distTitleSep: 'Evidence Distributions (Separated by True State)',
    distX: 'Evidence (x)',
    skill: 'PSS (Peirce Skill Score)',
    matrixTitle: 'Magnitude-Aware Confusion Matrix',
    fixHit: 'Fix hit rate', fixFa: 'Fix false-alarm rate',
    metricsTitle: 'Metrics',
    accent: '#1f77b4',
  },
  np: {
    modeName: 'Neyman–Pearson',
    separation: 'Standardized effect (d√n)',
    threshold: 'Critical value (z_crit)',
    spread: 'Alternative Std Dev',
    thresholdShort: 'z_crit',
    separationShort: 'd√n',
    dist1: 'H₁ (alternative)', dist2: 'H₀ (null)',
    state1: 'H₁ True (effect exists)', state2: 'H₀ True (no effect)',
    resp1: 'Reject H₀', resp2: 'Fail to Reject H₀',
    cells: ['Power (1−β)', 'Type II Error (β)', 'Type I Error (α)', 'Correct Retention'],
    hitName: 'Power (1−β)', faName: 'Alpha (α)',
    curveTitle: 'Power Function',
    curveX: 'α  (Type I Error Rate)', curveY: 'Power (1−β)',
    distTitle: 'Sampling Distributions of the Test Statistic',
    distTitleSep: 'Sampling Distributions (Separated by Hypothesis)',
    distX: 'Z-statistic',
    skill: 'Power − α',
    matrixTitle: 'Decision Outcome Probabilities',
    fixHit: 'Fix power', fixFa: 'Fix α',
    metricsTitle: 'Test Characteristics',
    accent: '#e07b1a',
  },
};

// Comparison mode borrows SDT's labels for anything that needs a single name.
const L = () => LABELS[State.mode === 'compare' ? 'sdt' : State.mode];

/* ------------------------------------------------------------ SOLVERS --- */

// golden-section search for the minimum of a unimodal fn on [lo, hi]
function minimize1D(fn, lo, hi, iters = 200) {
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = lo, b = hi;
  let c = b - gr * (b - a), d = a + gr * (b - a);
  for (let i = 0; i < iters; i++) {
    if (fn(c) < fn(d)) b = d; else a = c;
    c = b - gr * (b - a); d = a + gr * (b - a);
    if (Math.abs(b - a) < 1e-10) break;
  }
  return (a + b) / 2;
}

function computeCore() {
  const S = State;
  const d = S.separation, s = S.spread;
  let t;
  if (S.constraint === 'lr') {
    const target = S.targetLr;
    if (Math.abs(target - 1) < 0.01 && Math.abs(s - 1) < 0.01) {
      t = d / 2;                       // equal-variance shortcut
    } else {
      t = minimize1D((cv) => {
        const lr = dnorm(cv, d, s) / dnorm(cv, 0, 1);
        return (lr - target) * (lr - target);
      }, -3, 6);
    }
  } else if (S.constraint === 'hit') {
    // hit = 1 - pnorm((t - d)/s)  =>  t = d + s * qnorm(1 - hit)
    // (the R original had this sign inverted, which silently gave 1 - the
    //  requested hit rate; corrected here.)
    t = d + s * qnorm(1 - S.targetHit);
  } else if (S.constraint === 'fa') {
    t = qnorm(1 - S.targetFa);
  } else {
    t = S.threshold;
  }
  S.core = { d, t, s };
  return S.core;
}

const syncEffectD = () => { State.effectD = State.separation / Math.sqrt(State.nInterp); };

/* The distribution controls, built once and reused by the Parameters tab and
   the Simulation tab so you can steer from wherever you happen to be looking.
   `prefix` keeps element ids unique between the two copies. */
function appendCoreControls(root, prefix, onChange, opts = {}) {
  const S = State, lab = L();
  const id = (k) => `${prefix}_${k}`;
  const useD = (S.mode === 'np' && S.npHold === 'd');
  const refresh = () => { computeCore(); updateDerivedRow(prefix); onChange(); };

  if (useD) {
    const dSl = slider(id('effect_d'), "Effect size (Cohen's d):", 0, 1.5, S.effectD, 0.01, (v) => v.toFixed(2));
    dSl.querySelector('input').addEventListener('input', (e) => {
      S.effectD = +e.target.value;
      S.separation = S.effectD * Math.sqrt(S.nInterp);
      refresh();
    });
    root.appendChild(dSl);
    root.appendChild(readonlyRow(lab.separation, rround(S.separation, 3), id('sep_derived'), '= d√n'));
  } else {
    const sepSl = slider(id('separation'), lab.separation + ':', -2, 5, S.separation, 0.01, (v) => v.toFixed(2));
    sepSl.querySelector('input').addEventListener('input', (e) => {
      S.separation = +e.target.value; syncEffectD(); refresh();
    });
    root.appendChild(sepSl);
  }

  if (S.constraint === 'none') {
    const thSl = slider(id('threshold'), lab.threshold + ':', -2, 5, S.threshold, 0.01, (v) => v.toFixed(2));
    thSl.querySelector('input').addEventListener('input', (e) => { S.threshold = +e.target.value; refresh(); });
    root.appendChild(thSl);
  } else {
    computeCore();
    root.appendChild(readonlyRow(lab.threshold, rround(S.core.t, 3), id('thr_fixed'), 'fixed by constraint'));
  }

  if (opts.spread) {
    const spSl = slider(id('spread'), lab.spread + ':', 0.5, 2.0, S.spread, 0.1, (v) => v.toFixed(1));
    spSl.querySelector('input').addEventListener('input', (e) => { S.spread = +e.target.value; refresh(); });
    root.appendChild(spSl);
  }

  if (opts.n && S.mode === 'np') {
    const nSl = slider(id('n'), 'Sample size (n):', 5, 200, S.nInterp, 5, (v) => v);
    nSl.querySelector('input').addEventListener('input', (e) => {
      S.nInterp = +e.target.value;
      if (S.npHold === 'd') S.separation = S.effectD * Math.sqrt(S.nInterp); else syncEffectD();
      refresh();
    });
    root.appendChild(nSl);
    root.appendChild(helpText(S.npHold === 'd'
      ? 'Holding d fixed, so more data pushes the alternative away from the null and power climbs.'
      : 'Holding d√n fixed, so n only re-expresses the separation as an effect size — the curves stay put.'));
  }
}

function updateDerivedRow(prefix) {
  const el = document.getElementById(`${prefix}_sep_derived`);
  if (el) el.innerHTML = `${rround(State.separation, 3)} <span class="ro-note">= d√n</span>`;
}

function metrics() {
  const { d, t, s } = State.core;
  const fa = 1 - pnorm(t);
  const hit = 1 - pnorm((t - d) / s);
  const lr = dnorm(t, d, s) / dnorm(t, 0, 1);
  return {
    fa, hit,
    skill: hit - fa,
    lr,
    lrPlus: hit / fa,
    lrMinus: (1 - hit) / (1 - fa),
  };
}

/* ------------------------------------------------------------ PRESETS --- */

const PRESETS = {
  sdt: [
    ['custom', 'Custom'],
    ['finley', "Finley's Tornado Data (1884)"],
  ],
  np: [
    ['custom', 'Custom'],
    ['drug_trial', 'Drug Trial (d = 0.8, n = 25)'],
    ['ab_test', 'A/B Test (d = 0.3, n = 100)'],
    ['psych', 'Classic Psychology (d = 0.5, n = 30)'],
  ],
};

/* Finley's 1884 tornado verification, the data Peirce wrote about:
   28 hits, 23 misses, 72 false alarms, 2680 correct rejections.
   So 51 tornadoes in 2803 occasions — a 1.8% base rate, which is the whole
   point of the example and why raw accuracy flatters him so badly. */
const FINLEY = { hits: 28, misses: 23, falseAlarms: 72, correctRejections: 2680 };
FINLEY.signal = FINLEY.hits + FINLEY.misses;              // 51
FINLEY.noise = FINLEY.falseAlarms + FINLEY.correctRejections; // 2752
FINLEY.total = FINLEY.signal + FINLEY.noise;              // 2803

function applyPreset(key) {
  const S = State;
  if (key === 'finley') {
    const hit = Math.min(Math.max(FINLEY.hits / FINLEY.signal, 0.001), 0.999);
    const fa = Math.min(Math.max(FINLEY.falseAlarms / FINLEY.noise, 0.001), 0.999);
    S.threshold = qnorm(1 - fa);
    S.separation = qnorm(hit) + qnorm(1 - fa);
    S.spread = 1.0;
    S.constraint = 'none';
    // carry the actual trial structure into the simulation, base rate and all
    S.simNTotal = FINLEY.total;
    S.simPropSignal = FINLEY.signal / FINLEY.total;
    S.simSpeed = 100;
    S.simRandomize = true;
  } else if (key === 'drug_trial' || key === 'ab_test' || key === 'psych') {
    const spec = { drug_trial: [0.8, 25], ab_test: [0.3, 100], psych: [0.5, 30] }[key];
    const [d, n] = spec;
    S.separation = d * Math.sqrt(n);
    S.spread = 1.0;
    S.nInterp = n;
    S.constraint = 'fa';
    S.targetFa = 0.05;
  }
}

/* ------------------------------------------------------------- COLORS --- */

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

// hit/power, miss/type II, false alarm/type I, correct rejection/retention
const OUTCOME_COLORS = ['#2ca02c', '#d62728', '#ff7f0e', '#1f77b4'];
const OUTCOME_RGB = ['44,160,44', '214,39,40', '255,127,14', '31,119,180'];

/* -------------------------------------------------------- SHARED VIEWS --- */

function tableHtml(headers, rows) {
  return `<table class="tbl"><thead><tr>${headers.map((x) => `<th>${x}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr><td class="lbl">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>`;
}

// filled region under `ys` down to `baseline`, for x-indices [i0, i1)
function fillRegion(pl, xs, ys, i0, i1, baseline, color) {
  if (i1 <= i0) return;
  pl.ribbon(xs.slice(i0, i1), ys.slice(i0, i1), baseline, { col: color });
}

/* The outcome matrix. Identical arithmetic in both modes — only the row,
   column and cell captions change. */
function buildMatrixHtml(hit, fa, counts) {
  const lab = L();
  const tp = hit, fn = 1 - hit, fp = fa, tn = 1 - fa;
  const cell = (i, prop, count) => {
    const body = counts
      ? `${count}<br>(${rround(prop, 3)})`
      : rround(prop, 3);
    return `<td style="background-color: rgba(${OUTCOME_RGB[i]},${prop});">${lab.cells[i]}<br>${body}</td>`;
  };
  return `<table class="conf-table">
    <tr><th class="label-cell"></th><th class="label-cell">${lab.resp1}</th><th class="label-cell">${lab.resp2}</th></tr>
    <tr><th class="label-cell">${lab.state1}</th>
      ${cell(0, tp, counts && counts[0])}${cell(1, fn, counts && counts[1])}</tr>
    <tr><th class="label-cell">${lab.state2}</th>
      ${cell(2, fp, counts && counts[2])}${cell(3, tn, counts && counts[3])}</tr>
  </table>`;
}

function buildMetricsTableHtml() {
  const lab = L(), m = metrics(), S = State;
  const rows = [
    [lab.separation, rround(S.core.d, 3)],
    [lab.threshold, rround(S.core.t, 3)],
    [lab.faName, rround(m.fa, 4)],
    [lab.hitName, rround(m.hit, 3)],
    ['LR (at threshold)', rround(m.lr, 3)],
    ['LR+', rround(m.lrPlus, 3)],
    ['LR−', rround(m.lrMinus, 3)],
    [lab.skill, rround(m.skill, 3)],
  ];
  if (State.mode === 'np') {
    rows.splice(1, 0, ["Effect size (Cohen's d)", rround(S.core.d / Math.sqrt(S.nInterp), 3)]);
    rows.push(['Beta (β)', rround(1 - m.hit, 3)]);
    rows.push(['Standard error (1/√n)', rround(1 / Math.sqrt(S.nInterp), 4)]);
  }
  return tableHtml(['Metric', 'Value'], rows);
}
</script>
