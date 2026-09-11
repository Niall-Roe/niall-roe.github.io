<script>
/* ============================================================================
   The apparatus as a picture, and the shot moving through it.

   The whole board is drawn in one canvas whose user coordinates are
   compartments across and a fraction of the height up, so every level below
   is a number between 0 and 1 and nothing has to be re-derived in pixels.

       1.000   the hopper
       0.960   ┐
               │  upper bank — a triangle of pins, because every shot
       0.805   ┘  enters it at the centre
       0.790   the tallest a compartment can be drawn
       0.600   A–A: the floor of the parent compartments
       0.520   the foot of the chutes
       0.495   ┐
               │  lower bank — a full lattice, because families enter it
       0.330   ┘  all across the board
       0.260   the tallest a child compartment can be drawn
       0.070   the floor of the child compartments
   ==========================================================================*/

const Y = {
  hopper:   0.995,
  topBank0: 0.960,
  topBank1: 0.805,
  pBase:    0.600,
  chute1:   0.520,
  famBank0: 0.495,
  famBank1: 0.330,
  cBase:    0.070,
};
const BARMAX = 0.190;   // the depth of a compartment, as a fraction of the board
const BARPAD = 0.08;    // the wall between one compartment and the next
const PINR = 1.5;
const SHOTR = 2.3;

const Board = {
  scale: 100,             // shot per compartment at which a bar is drawn full
  parentCounts: new Array(BINS).fill(0),   // what the upper row holds NOW
  childCounts: new Array(BINS).fill(0),
  ghost: null,            // what the upper row held before this generation began
  parentTrace: new Array(BINS).fill(0),    // the family being followed, above
  childTrace: new Array(BINS).fill(0),     // and below
  lift: 0,                // 0 … 1 while a generation is lifted into the upper row
  hover: null,            // {row, bin} under the pointer
};

/* A generation need not be released all at once. Galton's demonstration is to
   open ONE compartment, watch its contents make a small heap of their own, and
   only then let the rest follow — which is how the eye sees that the big heap
   is the small ones added up. A compartment still to go is one that still has
   shot in it, so no separate record of what has been released is kept.

   The compartments a release drains are not refilled. An emptied one is drawn
   as a ghost of what it held, which is both the record of the generation and
   the thing that says, at a glance, which compartments have been opened. */
const Drop = {
  live: false,      // a generation is part-way through
  out: [],          // the children so far, as positions
  src: [],          // the compartment each came out of
  srcPos: [],       // and the position of the parent it came from
  landedSrc: [],    // the same pairing in compartments only, kept current
  landedDst: [],    // through an animation, because the drawing wants it
  pending: null,    // the release now in the air, so it can be landed if cut short
  mu: 0,            // the mean the chutes are set on for this generation, fixed at
                    // its start so that opening compartments one at a time cannot
                    // move the mark the earlier ones were aimed at
};

const zeros = () => new Array(BINS).fill(0);

/* The vertical scale, in shot per compartment. Fixed for the whole of a
   generation so that nothing jumps while shot are falling, and recomputed at
   the moment one generation is lifted into the place of the last. It allows
   for the heap the children are about to make as well as the one the parents
   have made, so a population that is about to narrow does not overflow. */
function rescale(sigmaNow) {
  /* The expected count in the tallest compartment, with two and a half
     standard deviations of headroom on top of it. The count there is very
     nearly binomial, so its SD is about the square root of the count; without
     the allowance an ordinary run trips the over-full marker on the middle
     compartment about a quarter of the time, which would report sampling
     variation as though it were the board running out of room. */
  const peak = (s) => {
    const p = State.n / (Math.max(s, 0.4) * Math.sqrt(2 * Math.PI));
    return p + 2.5 * Math.sqrt(p);
  };
  let obs = 1;
  for (let b = 1; b < BINS - 1; b++) obs = Math.max(obs, Board.parentCounts[b]);
  Board.scale = Math.max(peak(sigmaNow), peak(nextSigma(sigmaNow)), obs * 1.04);
}
const perShot = () => BARMAX / Board.scale;

/* -------------------------------------------------------------- DRAWING --- */

function rectU(pl, x0, x1, y0, y1, o) {
  const c = pl.ctx;
  const px = pl.X(x0), py = pl.Y(y1);
  const w = pl.X(x1) - px, hh = pl.Y(y0) - py;
  if (hh <= 0) return;
  if (o.fill) { c.fillStyle = o.fill; c.fillRect(px, py, w, hh); }
  if (o.stroke) {
    c.strokeStyle = o.stroke; c.lineWidth = o.lwd || 1; c.setLineDash([]);
    c.strokeRect(px + 0.5, py + 0.5, w - 1, hh - 1);
  }
}

function addDot(c, px, py, r) { c.moveTo(px + r, py); c.arc(px, py, r, 0, 2 * Math.PI); }

/* The upper bank. Every shot enters at the centre, so the pins it can meet
   form a triangle — the shape a quincunx is usually drawn with. */
function drawPinsTriangle(pl, rows, step, y0, y1, col) {
  const c = pl.ctx;
  c.fillStyle = col; c.beginPath();
  for (let k = 0; k < rows; k++) {
    const y = pl.Y(lerp(y0, y1, (k + 0.5) / rows));
    for (let j = 0; j <= k; j++) {
      const x = (2 * j - k) * step;
      if (Math.abs(x) > HALF + 0.5) continue;
      addDot(c, pl.X(x), y, PINR);
    }
  }
  c.fill();
}

/* The lower bank. Families enter it wherever their chute puts them, so it is
   the whole board's worth of pins, not a triangle. Its lattice is finer than
   the upper bank's whenever the scatter within a family is smaller than the
   scatter across the population — which is what the eye should read off it. */
function drawPinsLattice(pl, rows, step, y0, y1, col) {
  // a bank set to no scatter at all has no pins in it: the shot fall straight
  // through, and drawing a lattice would claim a deflection it never makes
  if (step < 0.05) return;
  const c = pl.ctx;
  const sp = Math.max(step, 0.11);          // keep the picture drawable as σ_f → 0
  c.fillStyle = col; c.beginPath();
  const lim = HALF + 0.5;
  for (let k = 0; k < rows; k++) {
    const y = pl.Y(lerp(y0, y1, (k + 0.5) / rows));
    for (let x = (k % 2) ? sp : 0; x <= lim; x += 2 * sp) {
      addDot(c, pl.X(x), y, PINR);
      if (x > 1e-9) addDot(c, pl.X(-x), y, PINR);
    }
  }
  c.fill();
}

// the partitions between compartments, and their floor
function drawCompartments(pl, base) {
  const c = pl.ctx;
  c.strokeStyle = COL.wall; c.lineWidth = 1; c.setLineDash([]);
  c.beginPath();
  for (let b = 0; b <= BINS; b++) {
    const px = Math.round(pl.X(b - HALF - 0.5)) + 0.5;
    c.moveTo(px, pl.Y(base)); c.lineTo(px, pl.Y(base + BARMAX));
  }
  c.stroke();
  c.strokeStyle = COL.rule; c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(pl.X(-HALF - 0.5), Math.round(pl.Y(base)) + 0.5);
  c.lineTo(pl.X(HALF + 0.5), Math.round(pl.Y(base)) + 0.5);
  c.stroke();
}

const barX = (b) => [b - HALF - 0.5 + BARPAD, b - HALF + 0.5 - BARPAD];

function drawBars(pl, counts, base, colTotal, trace, colTrace, o) {
  const per = perShot(), c = pl.ctx, opt = o || {};
  for (let b = 0; b < BINS; b++) {
    const n0 = counts[b];
    if (!n0) continue;
    const [x0, x1] = barX(b);
    const full = n0 * per, hgt = Math.min(full, BARMAX);
    rectU(pl, x0, x1, base, base + hgt, { fill: colTotal });
    const t = trace ? trace[b] : 0;
    if (t) rectU(pl, x0, x1, base, base + Math.min(t * per, hgt), { fill: colTrace });
    if (full > BARMAX + 1e-9 && !opt.quiet) {
      // the compartment is over-full; say so rather than let the bar lie
      const px = pl.X((x0 + x1) / 2), py = pl.Y(base + BARMAX);
      c.fillStyle = COL.chute;
      c.beginPath();
      c.moveTo(px, py - 5); c.lineTo(px - 4, py - 1); c.lineTo(px + 4, py - 1);
      c.closePath(); c.fill();
    }
  }
}

// the parents' shape, held over the children so the two can be compared in place
function drawOutline(pl, counts, base, col) {
  const per = perShot(), xs = [], ys = [];
  for (let b = 0; b < BINS; b++) {
    const y = base + Math.min(counts[b] * per, BARMAX);
    xs.push(b - HALF - 0.5, b - HALF + 0.5);
    ys.push(y, y);
  }
  pl.lines(xs, ys, { col, lwd: 1.5, lty: 2 });
}

/* The chutes. At r = 1 they hang straight down and the apparatus is two plain
   quincunxes in series; below it they fan inward, and the fan is the whole
   mechanism of the page. */
function drawChutes(pl, mu) {
  const lit = new Set();
  if (State.trace) {
    if (State.traceDir === 'down') lit.add(State.traceBin);
    else for (let b = 0; b < BINS; b++) if (Board.parentTrace[b]) lit.add(b);
  }
  for (let b = 0; b < BINS; b++) {
    const x = b - HALF, on = lit.has(b);
    pl.segments(x, Y.pBase, chuteTarget(x, mu), Y.chute1, {
      col: on ? COL.family : rgba(COL.chute, 0.55),
      lwd: on ? 2.4 : 1.4,
    });
  }
}

/* The mark the chutes are set on, and the mark the board started from. When
   the environment is doing nothing the two coincide and only one line shows;
   when it is not, the gap between them is the whole of what heredity has no
   say in. */
function drawMeanLines(pl, mu) {
  /* Far enough out to be more than the sample mean wobbling: at four hundred
     shot its standard error is about 0.05σ, so a fifth of a σ is several of
     them and an environment doing nothing will not trip this. */
  const moved = Math.abs(mu) > 0.2 * SIGMA0;
  if (moved) {
    pl.abline({ v: 0, col: rgba(COL.rule, 0.5), lwd: 1, lty: 3 });
    pl.text(0, Y.chute1 - 0.018, 'where it began', { col: COL.rule, cex: 0.6 });
  }
  pl.abline({ v: mu, col: moved ? COL.env : rgba(COL.rule, 0.55), lwd: moved ? 1.6 : 1, lty: 3 });
  if (moved)
    pl.text(mu, Y.pBase + BARMAX + 0.028, `mean ${signed(mu / SIGMA0)}σ`,
      { col: COL.env, cex: 0.64, font: 2 });
}

// the compartment under the pointer, drawn as openable
function drawHover(pl) {
  const hv = Board.hover;
  if (!hv || Anim.kind) return;
  const [x0, x1] = barX(hv.bin);
  const base = hv.row === 'p' ? Y.pBase : Y.cBase;
  rectU(pl, x0, x1, base, base + BARMAX,
    { fill: rgba(hv.row === 'p' ? COL.chute : COL.family, 0.12),
      stroke: hv.row === 'p' ? COL.chute : COL.family, lwd: 1.4 });
}

function drawSigmaAxis(pl) {
  const c = pl.ctx;
  c.strokeStyle = COL.faint; c.fillStyle = COL.faint;
  c.lineWidth = 1; c.setLineDash([]);
  const y = Math.round(pl.Y(0.018)) + 0.5;
  c.beginPath(); c.moveTo(pl.X(-HALF - 0.5), y); c.lineTo(pl.X(HALF + 0.5), y); c.stroke();
  c.font = '11px "Helvetica Neue", Arial, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'top';
  for (let k = -4; k <= 4; k++) {
    const x = k * SIGMA0;
    if (Math.abs(x) > HALF + 0.5) continue;
    const px = pl.X(x);
    c.beginPath(); c.moveTo(px, y); c.lineTo(px, y + 4); c.stroke();
    c.fillText(k === 0 ? '0' : (k > 0 ? '+' : '−') + Math.abs(k) + 'σ', px, y + 6);
  }
}

function drawShot(pl, t) {
  if (!Anim.shots) return;
  const c = pl.ctx;
  const plain = new Path2D(), traced = new Path2D();
  let any = false;
  for (let i = Anim.landed; i < Anim.emitted; i++) {
    const s = Anim.shots[i];
    const u = (t - s.delay) / Anim.travel;
    if (u < 0) continue;
    const p = pathAt(s, u);
    const px = pl.X(p[0]), py = pl.Y(p[1]);
    const hot = State.trace &&
      (State.traceDir === 'down' ? s.src === State.traceBin : s.dst === State.traceBin);
    const path = hot ? traced : plain;
    path.moveTo(px + SHOTR, py); path.arc(px, py, SHOTR, 0, 2 * Math.PI);
    any = true;
  }
  if (!any) return;
  c.fillStyle = COL.parent; c.fill(plain);
  c.fillStyle = COL.family; c.fill(traced);
}

/* What to paint in the family's colour, in each row.

   One end of the question is a single compartment and needs no bookkeeping —
   it is simply whatever that compartment holds at this instant, which is why
   it is read fresh here rather than cached: during a fall the pile is changing
   under it. The other end is a distribution over compartments and has to be
   accumulated from the pairs, which `retrace` does. */
function parentTraceView() {
  if (!State.trace) return null;
  if (State.traceDir === 'up') return Board.parentTrace;
  const out = zeros(), b = State.traceBin;
  out[b] = Board.ghost ? Board.ghost[b] : Board.parentCounts[b];
  return out;
}
function childTraceView() {
  if (!State.trace) return null;
  if (State.traceDir === 'down') return Board.childTrace;
  const out = zeros(), b = State.traceBin;
  out[b] = Board.childCounts[b];
  return out;
}

// of the family being followed, the part still sitting in the upper compartments
function solidTrace() {
  const view = parentTraceView();
  if (!view) return null;
  const out = zeros();
  for (let b = 0; b < BINS; b++) out[b] = Math.min(view[b], Board.parentCounts[b]);
  return out;
}

function drawBoard(pl, W, H) {
  pl.setup({ xlim: [-HALF - 0.5, HALF + 0.5], ylim: [0, 1],
             mar: [1.95, 0.55, 0.25, 0.55], ext: false });
  const t = Anim.kind ? Anim.now : 0;
  const ghostGrey = rgba(COL.parent, 0.15), ghostFam = rgba(COL.family, 0.20);
  const mu = Drop.live ? Drop.mu : (Pop.parents.length ? mean(Pop.parents) : 0);

  drawMeanLines(pl, mu);

  drawPinsTriangle(pl, ROWS_TOP, STEP_TOP, Y.topBank0, Y.topBank1,
    Anim.kind === 'seed' ? COL.pin : '#e6ebee');

  if (Board.lift > 0) {
    // one generation on its way from the lower row into the upper
    const base = lerp(Y.cBase, Y.pBase, Board.lift);
    drawCompartments(pl, Y.pBase);
    drawCompartments(pl, Y.cBase);
    drawChutes(pl, mu);
    drawPinsLattice(pl, ROWS_FAM, stepFam(), Y.famBank0, Y.famBank1, COL.pin);
    drawBars(pl, Board.parentCounts, base, COL.pop, null, null);
  } else {
    drawCompartments(pl, Y.pBase);
    drawHover(pl);
    // compartments already opened, as a ghost of what they held
    if (Board.ghost)
      drawBars(pl, Board.ghost, Y.pBase, ghostGrey, parentTraceView(), ghostFam, { quiet: true });
    drawBars(pl, Board.parentCounts, Y.pBase, COL.parent, solidTrace(), COL.family);

    drawChutes(pl, mu);
    drawPinsLattice(pl, ROWS_FAM, stepFam(), Y.famBank0, Y.famBank1, COL.pin);

    drawCompartments(pl, Y.cBase);
    drawBars(pl, Board.childCounts, Y.cBase, COL.pop, childTraceView(), COL.family);
    if (State.outline && Board.ghost)
      drawOutline(pl, Board.ghost, Y.cBase, COL.parent);
  }

  drawShot(pl, t);
  drawSigmaAxis(pl);

  // labels
  const edge = HALF + 0.42;
  pl.text(-edge, Y.pBase + 0.022, 'A', { col: COL.rule, adj: 0, cex: 0.72, font: 2 });
  pl.text(edge, Y.pBase + 0.022, 'A', { col: COL.rule, adj: 1, cex: 0.72, font: 2 });
  pl.text(-edge, Y.pBase + BARMAX + 0.028, 'parents', { col: COL.parent, adj: 0, cex: 0.74, font: 2 });
  pl.text(-edge, Y.cBase + BARMAX + 0.028, 'children', { col: COL.pop, adj: 0, cex: 0.74, font: 2 });
  pl.text(edge, lerp(Y.pBase, Y.chute1, 0.5),
    State.r >= 0.999 ? 'barriers, straight down' : `chutes: ${State.r.toFixed(2)} of the way back`,
    { col: COL.chute, adj: 1, cex: 0.68 });
  pl.text(edge, lerp(Y.famBank0, Y.famBank1, 0.5),
    famRel() < 0.025 ? 'no scatter within a family'
                     : `within a family: ${famRel().toFixed(2)}σ`,
    { col: COL.faint, adj: 1, cex: 0.68 });
}

/* ------------------------------------------------------------ ANIMATION --- */

const Anim = {
  kind: null,        // 'seed' | 'lift' | 'drop'
  shots: null,
  t0: 0, now: 0, dur: 0, travel: 0, stagger: 0,
  emitted: 0, landed: 0,
  raf: 0,
  then: null,        // what to run when this phase ends
};

// distance along a shot's path, in a space where the board is one unit wide
function prepPath(p) {
  const cum = new Array(p.length);
  cum[0] = 0;
  for (let k = 1; k < p.length; k++) {
    const dx = (p[k][0] - p[k - 1][0]) / BINS, dy = p[k][1] - p[k - 1][1];
    cum[k] = cum[k - 1] + Math.hypot(dx, dy);
  }
  return cum;
}
function pathAt(s, u) {
  const p = s.path, cum = s.cum;
  const L = cum[cum.length - 1] * clamp(u, 0, 1);
  let k = 1;
  while (k < cum.length - 1 && cum[k] < L) k++;
  const d = cum[k] - cum[k - 1];
  const f = d > 1e-12 ? (L - cum[k - 1]) / d : 1;
  return [lerp(p[k - 1][0], p[k][0], f), lerp(p[k - 1][1], p[k][1], f)];
}

const jitter = () => (Math.random() - 0.5) * 0.34;

/* Shot from the hopper through the upper bank into the compartments at A–A.
   Each is given the height it will come to rest at, which is the height of the
   pile at the moment it lands — so the heap grows under the falling shot
   rather than being redrawn around them. */
function buildSeed() {
  const n = State.n, per = perShot();
  const shots = new Array(n), xs = new Array(n), fill = zeros();
  for (let i = 0; i < n; i++) {
    const walk = bankWalk(0, ROWS_TOP, STEP_TOP);
    const xEnd = walk[ROWS_TOP], b = binOf(xEnd), rest = fill[b]++;
    const path = [[0, Y.hopper]];
    for (let k = 0; k <= ROWS_TOP; k++)
      path.push([walk[k], lerp(Y.topBank0, Y.topBank1, k / ROWS_TOP)]);
    path.push([b - HALF + jitter(), Y.pBase + rest * per]);
    shots[i] = { path, cum: prepPath(path), src: b, dst: b };
    xs[i] = xEnd;
  }
  return { shots, xs };
}

/* Opening a set of compartments: the chutes carry what comes out toward the
   centre, the lower bank scatters it. Shot leave from the top of their pile,
   so the parent heap drains as the child heap builds; and the child heap is
   built on from wherever compartments opened earlier left it, which is what
   lets one compartment be released and the rest follow after. */
function buildRelease(bins) {
  const s = stepFam(), per = perShot(), mu = Drop.mu;
  const want = new Set(bins);
  const parents = Pop.parents;

  // the rest index is a shot's height in its pile, counted over the whole
  // compartment — a compartment still standing is untouched by earlier releases
  const fill = zeros(), items = [];
  for (let i = 0; i < parents.length; i++) {
    const b = binOf(parents[i]), rest = fill[b]++;
    if (want.has(b)) items.push({ x: parents[i], b, rest });
  }
  items.sort((a, z) => z.rest - a.rest);

  const land = Board.childCounts.slice();
  const m = items.length;
  const shots = new Array(m), out = new Array(m);
  const src = new Array(m), srcPos = new Array(m);
  for (let j = 0; j < m; j++) {
    const it = items[j];
    // the shot leaves the chute anywhere across its mouth — see stepFam()
    const foot = chuteTarget(it.x, mu) + mouthJitter();
    const walk = bankWalk(foot, ROWS_FAM, s);
    const xEnd = walk[ROWS_FAM], db = binOf(xEnd), rest = land[db]++;
    const path = [[it.x, Y.pBase + it.rest * per], [it.x, Y.pBase], [foot, Y.chute1],
                  [foot, Y.famBank0]];
    for (let k = 1; k <= ROWS_FAM; k++)
      path.push([walk[k], lerp(Y.famBank0, Y.famBank1, k / ROWS_FAM)]);
    path.push([db - HALF + jitter(), Y.cBase + rest * per]);
    shots[j] = { path, cum: prepPath(path), src: it.b, dst: db };
    out[j] = xEnd; src[j] = it.b; srcPos[j] = it.x;
  }
  return { shots, out, src, srcPos };
}

// the compartments not yet opened: the ones with shot still in them
function pendingBins() {
  const out = [];
  for (let b = 0; b < BINS; b++) if (Board.parentCounts[b] > 0) out.push(b);
  return out;
}

function startPhase(kind, shots, dur, then) {
  Anim.kind = kind; Anim.shots = shots; Anim.dur = dur; Anim.then = then || null;
  Anim.stagger = shots ? dur * 0.58 : 0;
  Anim.travel = shots ? dur - Anim.stagger : dur;
  Anim.emitted = 0; Anim.landed = 0;
  Anim.t0 = performance.now(); Anim.now = 0;
  cancelAnimationFrame(Anim.raf);
  Anim.raf = requestAnimationFrame(animFrame);
}

function animFrame(now) {
  const t = Math.min(now - Anim.t0, Anim.dur);
  Anim.now = t;
  advance(t);
  drawCanvas(BoardEl);
  if (t >= Anim.dur) {
    const then = Anim.then;
    Anim.kind = null; Anim.shots = null; Anim.then = null; Board.lift = 0;
    if (then) then();
  } else {
    Anim.raf = requestAnimationFrame(animFrame);
  }
}

// how far the stream has got: emitted has left its compartment, landed has arrived
function advance(t) {
  if (Anim.kind === 'lift') { Board.lift = t / Anim.dur; return; }
  const n = Anim.shots.length;
  const idx = (tt) => clamp(Math.floor(tt / Math.max(Anim.stagger, 1e-6) * (n - 1)) + 1, 0, n);
  const em = t >= Anim.dur ? n : idx(t);
  const la = t >= Anim.dur ? n : idx(t - Anim.travel);
  for (let i = Anim.emitted; i < em; i++) {
    Anim.shots[i].delay = Anim.stagger * (n > 1 ? i / (n - 1) : 0);
    if (Anim.kind === 'drop') Board.parentCounts[Anim.shots[i].src]--;
  }
  for (let i = Anim.landed; i < la; i++) {
    const s = Anim.shots[i];
    if (Anim.kind === 'seed') Board.parentCounts[s.dst]++;
    else { Board.childCounts[s.dst]++; Drop.landedSrc.push(s.src); Drop.landedDst.push(s.dst); }
  }
  Anim.emitted = em; Anim.landed = la;
  if (Anim.kind === 'drop') retrace();
}

function stopAnim() {
  cancelAnimationFrame(Anim.raf);
  Anim.kind = null; Anim.shots = null; Anim.then = null; Board.lift = 0;
}

const phaseMs = () => 2800 / State.speed;
</script>
