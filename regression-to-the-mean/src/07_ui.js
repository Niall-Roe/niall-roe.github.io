<script>
/* ============================================================================
   Controls, the actions behind the buttons, and the mount.
   ==========================================================================*/

let BoardEl = null, SpreadEl = null, ReadEl = null;

/* --------------------------------------------------------- THE FOLLOWING --- */

/* Which shot belong to the family being followed, in both rows at once.

   Downward it is the ordinary question: this compartment of parents, where do
   its children land? Upward it is the same relation read backwards: this
   compartment of children, which parents did they come from? The second is
   worth asking because the answer is the same shape as the first — the parents
   of tall children are, on average, nearer the middle than their children are.
   Nothing is pulling anything anywhere; the relation is simply not perfect,
   and an imperfect relation regresses whichever end you read it from. */
function retrace() {
  Board.parentTrace = zeros();
  Board.childTrace = zeros();
  if (!State.trace) return;
  /* Only the distribution end needs accumulating. The single compartment at
     the other end is read straight off the board when it is drawn, so that it
     stays right while a pile is filling or draining under it. */
  const b = State.traceBin, S = Drop.landedSrc, D = Drop.landedDst;
  if (State.traceDir === 'down') {
    for (let i = 0; i < S.length; i++) if (S[i] === b) Board.childTrace[D[i]]++;
  } else {
    for (let i = 0; i < S.length; i++) if (D[i] === b) Board.parentTrace[S[i]]++;
  }
}

// the positions of the family being followed, at whichever end is being asked about
function tracedPositions() {
  const b = State.traceBin, out = [];
  if (State.traceDir === 'down') {
    for (let i = 0; i < Drop.out.length; i++) if (Drop.src[i] === b) out.push(Drop.out[i]);
  } else {
    for (let i = 0; i < Drop.out.length; i++) if (binOf(Drop.out[i]) === b) out.push(Drop.srcPos[i]);
  }
  return out;
}

function followBin(b, dir) {
  State.trace = true;
  State.traceBin = b;
  if (dir) State.traceDir = dir;
  const cb = document.getElementById('trace'); if (cb) cb.checked = true;
  const dd = document.getElementById('traceDir'); if (dd) dd.value = State.traceDir;
  setSliderValue('traceBin', b, fmtBin);
  syncDisabled();
  retrace();
}

/* ---------------------------------------------------------- THE ACTIONS --- */

function clearDrop() {
  Drop.live = false; Drop.pending = null;
  Drop.out = []; Drop.src = []; Drop.srcPos = [];
  Drop.landedSrc = []; Drop.landedDst = [];
}

function newPopulation() {
  stopAnim();
  clearDrop();
  Pop.gen = 0; Pop.children = null;
  Board.parentCounts = zeros(); Board.childCounts = zeros(); Board.ghost = null;
  rescale(SIGMA0);

  if (State.animate) {
    const built = buildSeed();
    Pop.parents = built.xs;
    startPhase('seed', built.shots, phaseMs(), refresh);
  } else {
    Pop.parents = seedPositions(State.n);
    Board.parentCounts = histogram(Pop.parents);
  }
  Pop.history = [sd(Pop.parents)];
  Pop.means = [mean(Pop.parents)];
  retrace();
  refresh();
}

// the children take their parents' place in the upper row
function promoteNow() {
  Pop.parents = Pop.children;
  Pop.children = null;
  Pop.gen++;
  clearDrop();
  Board.parentCounts = histogram(Pop.parents);
  Board.childCounts = zeros(); Board.ghost = null;
  rescale(sd(Pop.parents));
  retrace();
}
function promote(then) {
  promoteNow();
  if (State.animate) startPhase('lift', null, 560 / State.speed, then);
  else then();
}

function beginDrop() {
  Drop.live = true;
  Drop.out = []; Drop.src = []; Drop.srcPos = [];
  Drop.landedSrc = []; Drop.landedDst = [];
  // the mark the chutes are set on, fixed now: opening compartments one at a
  // time must not move the target the earlier ones were aimed at
  Drop.mu = mean(Pop.parents);
  Board.ghost = Board.parentCounts.slice();
  Board.childCounts = zeros();
  retrace();
}

function finishRelease(built) {
  for (let i = 0; i < built.out.length; i++) {
    Drop.out.push(built.out[i]);
    Drop.src.push(built.src[i]);
    Drop.srcPos.push(built.srcPos[i]);
  }
  Drop.pending = null;
  retrace();
  if (!pendingBins().length) completeDrop();
}
function completeDrop() {
  Pop.children = Drop.out.slice();
  Pop.history.push(sd(Drop.out));
  Pop.means.push(mean(Drop.out));
  Drop.live = false;
}

/* Open some compartments. `bins` null means every one still standing — the
   ordinary "drop a generation"; a single bin is Galton's demonstration of one
   family at a time. */
function release(bins) {
  if (Anim.kind) return;
  /* Asking to open named compartments that hold nothing is not a request for
     anything, and must not fall through to the promotion below — which would
     advance a generation on the strength of a click that did nothing. Only
     `bins == null`, the request to open whatever is left, may promote. */
  if (bins && !bins.some((b) => Board.parentCounts[b] > 0)) return;
  const start = () => {
    if (!Drop.live) beginDrop();
    const list = (bins || pendingBins()).filter((b) => Board.parentCounts[b] > 0);
    if (!list.length) { refresh(); return; }
    const built = buildRelease(list);
    if (State.animate) {
      Drop.pending = built;
      const frac = clamp(0.3 + 0.7 * built.shots.length / Math.max(1, State.n), 0.3, 1);
      startPhase('drop', built.shots, Math.max(750, phaseMs() * frac),
        () => { finishRelease(built); refresh(); });
    } else {
      for (const s of built.shots) {
        Board.parentCounts[s.src]--; Board.childCounts[s.dst]++;
        Drop.landedSrc.push(s.src); Drop.landedDst.push(s.dst);
      }
      finishRelease(built);
    }
    refresh();
  };
  if (!Drop.live && Pop.children) promote(start); else start();
}

/* Bring whatever is part-finished to a close without animating it, so that an
   action taken in the middle of a fall starts from a coherent board. */
function settle() {
  if (Anim.kind === 'drop' && Drop.pending) {
    const built = Drop.pending;
    for (let i = Anim.emitted; i < built.shots.length; i++)
      Board.parentCounts[built.shots[i].src]--;
    for (let i = Anim.landed; i < built.shots.length; i++) {
      const s = built.shots[i];
      Board.childCounts[s.dst]++; Drop.landedSrc.push(s.src); Drop.landedDst.push(s.dst);
    }
    stopAnim();
    finishRelease(built);
  } else if (Anim.kind) {
    const seeding = Anim.kind === 'seed';
    stopAnim();
    if (seeding) Board.parentCounts = histogram(Pop.parents);
  }
  if (Drop.live) {
    const list = pendingBins();
    if (list.length) {
      const built = buildRelease(list);
      for (const s of built.shots) {
        Board.parentCounts[s.src]--; Board.childCounts[s.dst]++;
        Drop.landedSrc.push(s.src); Drop.landedDst.push(s.dst);
      }
      finishRelease(built);
    } else completeDrop();
  }
}

// the same thing many times over, with nothing to watch
function runGenerations(k) {
  settle();
  if (Pop.children) promoteNow();
  for (let g = 0; g < k - 1; g++) {
    const kids = dropPositions(Pop.parents);
    Pop.history.push(sd(kids)); Pop.means.push(mean(kids));
    Pop.parents = kids; Pop.gen++;
  }
  clearDrop();
  Board.parentCounts = histogram(Pop.parents);
  Board.childCounts = zeros(); Board.ghost = null;
  rescale(sd(Pop.parents));
  // the last generation through the ordinary path, so the board shows a real pair
  beginDrop();
  const built = buildRelease(pendingBins());
  for (const s of built.shots) {
    Board.parentCounts[s.src]--; Board.childCounts[s.dst]++;
    Drop.landedSrc.push(s.src); Drop.landedDst.push(s.dst);
  }
  finishRelease(built);
  refresh();
}

/* --------------------------------------------------------- THE CONTROLS --- */

const fmtR   = (v) => v.toFixed(2);
const fmtSig = (v) => v.toFixed(2) + 'σ';
const fmtBin = (b) => signed(binCentre(b) / SIGMA0) + 'σ';

function buildControls(root) {
  const btnDrop = h('<button class="btn primary" id="b_drop">Drop a generation</button>');
  const btnOne  = h('<button class="btn" id="b_one">Open the followed compartment</button>');
  const btnRun  = h('<button class="btn" id="b_run">Run 20 generations</button>');
  const btnNew  = h('<button class="btn" id="b_new">New population</button>');
  root.append(btnDrop, btnOne, btnRun, btnNew);
  btnDrop.addEventListener('click', () => release(null));
  btnOne.addEventListener('click', () => { followBin(State.traceBin, 'down'); release([State.traceBin]); });
  btnRun.addEventListener('click', () => runGenerations(20));
  btnNew.addEventListener('click', newPopulation);
  root.append(helpText('Or click a compartment on the board to open just that one, and let '
    + 'the rest follow after.'));

  root.append(h('<hr>'), h('<h4>The chutes</h4>'));

  const sR = slider('r', 'Reversion toward the mean, <i>r</i>', 0, 1, State.r, 0.01, fmtR);
  sR.classList.add('k1');
  sR.querySelector('input').addEventListener('input', (e) => {
    State.r = +e.target.value;
    if (State.tied) setSliderValue('famRel', famRel(), fmtSig);
    refresh();
  });
  root.append(sR);
  root.append(helpText('At <i>r</i> = 1 the chutes hang straight down and nothing regresses. '
    + 'At <i>r</i> = 0 every family is centred on the mean.'));

  const cTied = checkbox('tied', 'Hold the population still', State.tied);
  cTied.querySelector('input').addEventListener('change', (e) => {
    if (!e.target.checked) State.famRel = famRel();   // take over from where it was
    State.tied = e.target.checked;
    setSliderValue('famRel', famRel(), fmtSig);
    syncDisabled();
    refresh();
  });
  root.append(cTied);
  root.append(helpText('Sets the lower bank to &sigma;<sub>f</sub> = '
    + '&sigma;&radic;(1&nbsp;&minus;&nbsp;<i>r</i>&sup2;), which is the setting that makes the '
    + 'children exactly as spread out as their parents.'));

  const sF = slider('famRel', 'Spread within a family, &sigma;<sub>f</sub>',
    0, 1.4, famRel(), 0.01, fmtSig);
  sF.classList.add('k2');
  sF.querySelector('input').addEventListener('input', (e) => {
    State.famRel = +e.target.value; refresh();
  });
  root.append(sF);

  root.append(h('<hr>'), h('<h4>The environment</h4>'));

  const sE = slider('env', 'Displacement given to every child', -0.4, 0.4, State.env, 0.01,
    (v) => (v === 0 ? 'none' : signed(v) + 'σ each generation'));
  sE.classList.add('k4');
  sE.querySelector('input').addEventListener('input', (e) => {
    State.env = +e.target.value; refresh();
  });
  root.append(sE);
  root.append(helpText('The chutes are set on the mean of whatever is in the compartments, so '
    + 'they fix the shape of the distribution about the mean and say nothing about where the '
    + 'mean is. This moves it, and leaves the spread untouched.'));

  root.append(h('<hr>'), h('<h4>The board</h4>'));

  const sN = slider('n', 'Shot per generation', 100, 1200, State.n, 50, (v) => String(v));
  sN.querySelector('input').addEventListener('change', (e) => {
    State.n = +e.target.value; newPopulation();
  });
  root.append(sN);
  root.append(helpText('Changing this starts a new population.'));

  root.append(h('<hr>'), h('<h4>Following one family</h4>'));

  const cT = checkbox('trace', 'Follow one compartment', State.trace);
  cT.querySelector('input').addEventListener('change', (e) => {
    State.trace = e.target.checked; syncDisabled(); retrace(); refresh();
  });
  root.append(cT);

  const dD = select('traceDir', 'Which way to read it', [
    ['down', 'parents → their children'],
    ['up', 'children → their parents'],
  ], State.traceDir);
  dD.querySelector('select').addEventListener('change', (e) => {
    State.traceDir = e.target.value; retrace(); refresh();
  });
  root.append(dD);

  const sT = slider('traceBin', 'The compartment followed', 0, BINS - 1, State.traceBin, 1, fmtBin);
  sT.classList.add('k3');
  sT.querySelector('input').addEventListener('input', (e) => {
    State.traceBin = +e.target.value; retrace(); refresh();
  });
  root.append(sT);

  root.append(h('<hr>'), h('<h4>Display</h4>'));

  const cO = checkbox('outline', "Hold the parents' outline over the children", State.outline);
  cO.querySelector('input').addEventListener('change', (e) => {
    State.outline = e.target.checked; refresh();
  });
  root.append(cO);

  const cA = checkbox('animate', 'Animate the drop', State.animate);
  cA.querySelector('input').addEventListener('change', (e) => {
    State.animate = e.target.checked;
    if (!State.animate) settle();
    syncDisabled(); refresh();
  });
  root.append(cA);

  const sS = slider('speed', 'Speed', 0.5, 4, State.speed, 0.1, (v) => '×' + v.toFixed(1));
  sS.querySelector('input').addEventListener('input', (e) => { State.speed = +e.target.value; });
  root.append(sS);

  syncDisabled();
}

// a control that is being driven by another one says so rather than lying
function syncDisabled() {
  const pair = (id, on) => {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.disabled = !on;
    inp.closest('.ctl').classList.toggle('off', !on);
  };
  pair('famRel', !State.tied);
  pair('traceBin', State.trace);
  pair('traceDir', State.trace);
  pair('speed', State.animate);
}

/* ------------------------------------------------ CLICKING A COMPARTMENT --- */

/* The upper row is openable: a click on one of its compartments releases it on
   its own. The lower row is not — a click there asks the other question, which
   compartment of children this is and where its parents came from. */
function boardHit(el, ev) {
  const pl = el._pl;
  if (!pl) return null;
  const rect = el.getBoundingClientRect();
  const x = pl.invX(ev.clientX - rect.left), y = pl.invY(ev.clientY - rect.top);
  if (Math.abs(x) > HALF + 0.5) return null;
  const b = binOf(x);
  if (y >= Y.pBase - 0.015 && y <= Y.pBase + BARMAX + 0.05)
    return Board.parentCounts[b] > 0 ? { row: 'p', bin: b } : null;
  if (y >= Y.cBase - 0.015 && y <= Y.cBase + BARMAX + 0.05)
    return Board.childCounts[b] > 0 ? { row: 'c', bin: b } : null;
  return null;
}

function wireBoard(el) {
  const same = (a, z) => (!a && !z) || (a && z && a.row === z.row && a.bin === z.bin);
  el.addEventListener('pointermove', (ev) => {
    const hit = Anim.kind ? null : boardHit(el, ev);
    el.style.cursor = hit ? 'pointer' : 'default';
    if (!same(hit, Board.hover)) { Board.hover = hit; if (!Anim.kind) drawCanvas(el); }
  });
  el.addEventListener('pointerleave', () => {
    if (Board.hover) { Board.hover = null; if (!Anim.kind) drawCanvas(el); }
  });
  el.addEventListener('click', (ev) => {
    if (Anim.kind) return;
    const hit = boardHit(el, ev);
    if (!hit) return;
    if (hit.row === 'p') { followBin(hit.bin, 'down'); release([hit.bin]); }
    else { followBin(hit.bin, 'up'); refresh(); }
  });
}

/* ------------------------------------------------------------- REFRESH --- */

function refresh() {
  const set = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  set('live-r', fmtR(State.r));
  set('live-sd', (sd(Pop.parents) / SIGMA0).toFixed(2));

  /* The numbers in the prose are departures from a generation's own mean, not
     positions on the board, so that they stay true once the environment has
     moved the mean off the board's centre. */
  const dev = (binCentre(State.traceBin) - mean(Pop.parents)) / SIGMA0;
  set('live-px', signed(dev));
  set('live-cx', signed(State.r * dev));
  /* The sentence these two sit in is a claim about the machine whose spread is
     holding still, so they carry that machine's answer, r·d, in both
     directions. The measured answer belongs in the readout, next to the
     family it was measured on. */
  set('live-ux', signed(dev));
  set('live-upx', signed(State.r * dev));

  if (ReadEl) ReadEl.innerHTML = readoutHtml();

  const left = pendingBins().length;
  const bd = document.getElementById('b_drop');
  if (bd) bd.textContent = Drop.live && left && left < BINS
    ? `Let the other ${left} compartment${left === 1 ? '' : 's'} follow`
    : (Pop.children ? `Drop generation ${Pop.history.length}` : 'Drop a generation');
  const bo = document.getElementById('b_one');
  if (bo) {
    const b = State.traceBin;
    const has = Board.parentCounts[b] > 0;
    bo.disabled = !has;
    bo.textContent = has ? `Open the compartment at ${fmtBin(b)}` : `Nothing left at ${fmtBin(b)}`;
  }

  if (!Anim.kind && BoardEl) drawCanvas(BoardEl);
  if (SpreadEl) drawCanvas(SpreadEl);
}

/* ---------------------------------------------------------------- MOUNT --- */

function build() {
  buildControls($('#controls'));

  const fig = $('#figure');

  BoardEl = mkCanvas(620, drawBoard);
  wireBoard(BoardEl);
  const box1 = h('<div class="plot-container"></div>');
  box1.append(BoardEl);
  fig.append(box1);
  fig.append(h('<p class="plot-hint">Click a compartment in the upper row to open that one on '
    + 'its own; click one in the lower row to ask which parents its children came from.</p>'));

  ReadEl = h('<div class="readout"></div>');
  fig.append(ReadEl);

  SpreadEl = mkCanvas(240, drawSpread);
  const box2 = h('<div class="plot-container"></div>');
  box2.append(SpreadEl);
  fig.append(box2);

  newPopulation();
}
</script>
