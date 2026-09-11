<script>
/* ============================================================================
   The apparatus as a model, and the state it holds.

   Everything is measured in COMPARTMENT WIDTHS from the centre of the board.
   A shot's whole career is three lines of arithmetic:

       parent x                                  where it rests at A–A
       -> r·x                                    the chute
       -> r·x + (±s ±s ... ROWS_FAM times)       the lower bank

   so the population's spread obeys  σ' ² = r²σ² + σ_f² , with σ_f = s√ROWS_FAM.
   The fixed point of that recursion, σ_f/√(1−r²), is where the board settles
   whatever it starts from — and it is σ itself exactly when the lower bank is
   set to σ√(1−r²), which is the setting the apparatus was built to demonstrate.
   ==========================================================================*/

/* ---- the board ---------------------------------------------------------- */

const BINS = 17;                                  // compartments across
const HALF = (BINS - 1) / 2;                      // the board runs −8 … +8

const ROWS_TOP = 16, STEP_TOP = 0.5;              // the upper bank
const SIGMA0 = STEP_TOP * Math.sqrt(ROWS_TOP);    // 2 compartments: the founding spread
const ROWS_FAM = 12;                              // the lower bank

/* The board is ±4σ₀ wide, which holds a settled population comfortably and is
   overrun — visibly, against the walls — by one that is growing. */

const State = {
  r: 0.67,
  famRel: 0.74,   // σ_f as a multiple of σ₀, when it is set by hand
  /* Ticked, the lower bank follows the chutes: σ_f = σ₀√(1−r²), the setting
     that holds the population still. It starts OFF, because the article's
     first two demonstrations are run at r = 1, and a tied bank at r = 1 has
     no pins in it at all — the shot would fall without scattering and both
     demonstrations would silently fail. 0.74 is the tied value at r = 0.67,
     so the board loads on the stationary numbers either way. */
  tied: false,
  env: 0,         // a constant displacement given to every child, in σ₀ per generation
  n: 400,
  trace: true,
  traceBin: 12,   // index into the compartments, 0 … BINS−1
  traceDir: 'down',   // 'down': parents → their children; 'up': the same relation backwards
  outline: true,  // hold the parents' outline over the children
  animate: true,
  speed: 1.4,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function famRel()   { return State.tied ? Math.sqrt(1 - State.r * State.r) : State.famRel; }
function sigmaFam() { return famRel() * SIGMA0; }

/* The mouth of a chute has width, so a shot enters the lower bank anywhere
   across it — uniform over one lattice spacing of the walk, which is the
   width that matters. Without this the walk lands every child on a comb of
   spacing 2·step; the comb aliases against the unit compartments, and the
   BACKWARD conditionals come out visibly wrong — the exact enumeration puts
   the parents of the +2σ compartment at 1.45σ where the smooth machine says
   1.30σ, so the "two readings agree" demonstration would fail on its own
   readout. The jitter carries variance step²/3, so the step is set from
   ROWS_FAM + 1/3 and the bank's total is exactly σ_f² either way. */
function stepFam()  { return sigmaFam() / Math.sqrt(ROWS_FAM + 1 / 3); }
function mouthJitter() { return (Math.random() - 0.5) * 2 * stepFam(); }

// where the population settles, whatever it starts from
function fixedPoint() {
  const r = State.r;
  return r >= 1 ? Infinity : sigmaFam() / Math.sqrt(1 - r * r);
}
function nextSigma(s) {
  return Math.sqrt(State.r * State.r * s * s + sigmaFam() * sigmaFam());
}

/* ---- the population ----------------------------------------------------- */

const Pop = {
  gen: 0,
  parents: [],     // positions at A–A
  children: null,  // positions in the lower compartments, or null before a drop
  history: [],     // the population's spread by generation, in compartments
  means: [],       // and its mean, which the spread says nothing about
};

function sd(xs) {
  const n = xs.length;
  if (n < 2) return 0;
  let m = 0; for (let i = 0; i < n; i++) m += xs[i]; m /= n;
  let v = 0; for (let i = 0; i < n; i++) v += (xs[i] - m) * (xs[i] - m);
  return Math.sqrt(v / (n - 1));
}
function mean(xs) {
  if (!xs.length) return 0;
  let m = 0; for (let i = 0; i < xs.length; i++) m += xs[i];
  return m / xs.length;
}

// the walls: a shot that would land off the board rests in the end compartment
const binOf = (x) => clamp(Math.round(x) + HALF, 0, BINS - 1);
const binCentre = (b) => b - HALF;

function histogram(xs) {
  const c = new Array(BINS).fill(0);
  for (let i = 0; i < xs.length; i++) c[binOf(xs[i])]++;
  return c;
}
function offBoard(xs) {
  let k = 0;
  for (let i = 0; i < xs.length; i++) if (Math.abs(xs[i]) > HALF + 0.5) k++;
  return k;
}

/* ---- the two banks ------------------------------------------------------ */

/* One shot through a bank: `rows` deflections of ±step. The whole walk is
   returned, not just its end, because the animation draws the shot at every
   row and the histogram is the same object either way — the normal curve on
   this page is summed out of coin tosses, not drawn from qnorm. */
function bankWalk(x0, rows, step) {
  const xs = new Array(rows + 1);
  xs[0] = x0;
  for (let k = 1; k <= rows; k++) xs[k] = xs[k - 1] + (Math.random() < 0.5 ? -step : step);
  return xs;
}
function bankEnd(x0, rows, step) {
  let x = x0;
  for (let k = 0; k < rows; k++) x += (Math.random() < 0.5 ? -step : step);
  return x;
}

// a fresh population from the upper bank
function seedPositions(n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = bankEnd(0, ROWS_TOP, STEP_TOP);
  return out;
}

/* Where a chute delivers a shot that starts at x.

   The chutes converge on the mean of whatever is in the compartments, not on
   any fixed mark on the board: what a family regresses toward is its own
   population, wherever that population has got to. So the apparatus fixes the
   SHAPE of the distribution about the mean and says nothing whatever about
   where the mean is. `env` is what says that — a displacement given equally to
   every child, which moves the whole generation and leaves its spread exactly
   as it was. */
function chuteTarget(x, mu) {
  return mu + State.env * SIGMA0 + State.r * (x - mu);
}
// one generation: the chutes, then the lower bank
function dropPositions(parents) {
  const s = stepFam(), mu = mean(parents);
  const out = new Array(parents.length);
  for (let i = 0; i < parents.length; i++)
    out[i] = bankEnd(chuteTarget(parents[i], mu) + mouthJitter(), ROWS_FAM, s);
  return out;
}

/* ---- colours ------------------------------------------------------------ */

/* Orange belongs to the chutes and to the coefficient that sets them, purple
   to whichever family is being followed, blue to the population, teal to the
   environment and to the mean it moves. Nothing else on the page is allowed to
   be any of those four. */
const COL = {
  parent: '#455a64',
  pop:    '#1565c0',
  family: '#6a1b9a',
  chute:  '#ef6c00',
  env:    '#00695c',
  pin:    '#b9c4ca',
  wall:   '#e2e7ea',
  rule:   '#90a4ae',
  ink:    '#37474f',
  faint:  '#78909c',
};

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

/* ---- small numeric helpers ---------------------------------------------- */

function grid(from, to, n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = from + (i / (n - 1)) * (to - from);
  return out;
}
const lerp = (a, b, t) => a + (b - a) * t;
// signed, to two places, with the sign always printed
const signed = (v, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
</script>
