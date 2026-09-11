<script>
/* ============================================================================
   The second picture, and the numbers under both.

   The board shows one generation at a time; this shows the sequence. It plots
   the population's spread by generation against the recursion it obeys,
   σ_{g+1}² = r²σ_g² + σ_f², carried forward from wherever the run has got to
   under whatever the controls now say. The horizontal rule is that
   recursion's fixed point. With the chutes off there is no fixed point and no
   rule: the line just climbs.
   ==========================================================================*/

function drawSpread(pl, W, H) {
  const hist = Pop.history, mus = Pop.means;
  if (!hist.length) return;

  const gNow = hist.length - 1;
  const gEnd = Math.max(12, gNow + 4);
  const cur = hist[gNow];
  const fp = fixedPoint();

  // the recursion carried forward from here under the present settings
  const fx = [], fy = [];
  let s = cur;
  for (let k = gNow; k <= gEnd; k++) { fx.push(k); fy.push(s / SIGMA0); s = nextSigma(s); }

  let yMax = 1.6, yMin = 0;
  for (const v of hist) yMax = Math.max(yMax, v / SIGMA0);
  for (const v of fy) yMax = Math.max(yMax, v);
  if (Number.isFinite(fp)) yMax = Math.max(yMax, fp / SIGMA0);
  for (const v of mus) { yMax = Math.max(yMax, v / SIGMA0); yMin = Math.min(yMin, v / SIGMA0); }
  yMax = Math.min(yMax * 1.12, 14);
  yMin = Math.max(yMin * 1.12, -14);

  pl.setup({ xlim: [0, gEnd], ylim: [yMin, yMax], mar: [2.5, 3.4, 1.9, 1.0] });
  const span = yMax - yMin;

  // the spread the board was founded with
  pl.abline({ h: 1, col: rgba(COL.faint, 0.8), lwd: 1, lty: 3 });
  pl.text(gEnd * 0.02, 1 + span * 0.035, 'the spread it started with',
    { col: COL.faint, adj: 0, cex: 0.64 });

  /* The mean, on the same axis and in the same units, so that the one thing
     the apparatus governs and the one thing it does not can be watched
     together. Under any setting of the chutes the spread goes where the
     recursion sends it; the mean goes wherever the environment puts it. */
  if (mus.length) {
    const mx = mus.map((_, i) => i), my = mus.map((v) => v / SIGMA0);
    pl.lines(mx, my, { col: COL.env, lwd: 1.8, lty: 1 });
    pl.points(mx, my, { col: COL.env, cex: 0.75 });
    pl.text(gNow, my[gNow] + span * 0.05, 'mean',
      { col: COL.env, adj: gNow > gEnd * 0.7 ? 1 : 0, cex: 0.66, font: 2 });
  }

  // where these settings send it, whatever it starts from
  if (Number.isFinite(fp) && fp / SIGMA0 < yMax * 0.97) {
    pl.abline({ h: fp / SIGMA0, col: COL.chute, lwd: 1.4, lty: 2 });
    pl.text(gEnd * 0.98, fp / SIGMA0 - span * 0.045,
      `settles at ${(fp / SIGMA0).toFixed(2)}σ₀`, { col: COL.chute, adj: 1, cex: 0.66 });
  } else if (!Number.isFinite(fp) && sigmaFam() > 1e-9) {
    pl.text(gEnd * 0.98, yMax - span * 0.06, 'no fixed point — the barriers are straight down',
      { col: COL.chute, adj: 1, cex: 0.66 });
  }

  pl.lines(fx, fy, { col: rgba(COL.pop, 0.55), lwd: 1.6, lty: 2 });

  const hx = hist.map((_, i) => i), hy = hist.map((v) => v / SIGMA0);
  pl.lines(hx, hy, { col: COL.pop, lwd: 2.2 });
  pl.points(hx, hy, { col: COL.pop, cex: 0.9 });
  pl.points([gNow], [hy[gNow]], { col: COL.pop, cex: 1.7 });
  pl.text(gNow, hy[gNow] + span * 0.055, 'spread',
    { col: COL.pop, adj: gNow > gEnd * 0.7 ? 1 : 0, cex: 0.66, font: 2 });

  const xat = RPlot.ticks(0, gEnd, 6).filter((v) => Number.isInteger(v));
  pl.axes({ xat, ny: 4 });
  pl.axisLabels('generation', 'σ₀ = 1');
  pl.title('Spread and mean, generation by generation', { cex: 0.88 });
}

/* ------------------------------------------------------------- READOUT --- */

function row(lbl, val, cls) {
  return `<div class="rrow"><span class="lbl">${lbl}</span>` +
         `<span class="val ${cls || ''}">${val}</span></div>`;
}

function readoutHtml() {
  const sP = sd(Pop.parents);
  const kids = Drop.live ? Drop.out : Pop.children;
  const left = pendingBins().length;
  const fp = fixedPoint();
  const gNow = Math.max(0, Pop.history.length - 1);
  const u = (v) => (v / SIGMA0).toFixed(2) + ' σ₀';

  let out = `<div class="gen">Generation ${gNow}</div>`;
  out += row('Parents, spread', u(sP), 'pop');
  if (kids && kids.length > 1)
    out += row(Drop.live ? `Children so far (${left} compartment${left === 1 ? '' : 's'} to go)`
                         : 'Children, spread', u(sd(kids)), 'pop');
  else out += row('Children', '—', '');
  out += row('What the settings predict', u(nextSigma(sP)), '');

  /* The mean is reported beside the spread, and is the one line the settings
     of the chutes have no bearing on at all. */
  const muP = mean(Pop.parents);
  if (State.env !== 0 || Math.abs(muP) > 0.2 * SIGMA0) {
    out += row('Parents, mean', signed(muP / SIGMA0) + ' σ₀', 'env');
    if (kids && kids.length > 1)
      out += row('Children, mean', signed(mean(kids) / SIGMA0) + ' σ₀', 'env');
  }
  // with the chutes off there is no fixed point — unless the lower bank is off
  // too, in which case nothing moves at all
  const settles = Number.isFinite(fp) ? u(fp)
    : (sigmaFam() < 1e-9 ? 'it stands still — nothing scatters'
                         : 'nowhere — it grows without limit');
  out += row('Where they settle', settles, 'chute');

  const off = offBoard(kids || Pop.parents);
  if (off) {
    out += `<p class="sentence warn">${off} of ${(kids || Pop.parents).length} shot would have
      landed off the board. The walls are holding them in the end compartments, so the two
      outermost bars are taller than the population really is there.</p>`;
  }

  if (State.trace) out += traceSentence();
  return out;
}

/* The family being followed, read whichever way round the reader has asked for.
   Downward the answer is the familiar one. Upward it is the one that settles
   what regression is not: the parents of an extreme set of children are
   themselves nearer the middle, and no amount of the population drifting
   inward can explain a pull that runs backwards in time. */
function traceSentence() {
  const b = State.traceBin;
  const fam = tracedPositions();
  const kids = Drop.live ? Drop.out : Pop.children;
  const muP = mean(Pop.parents);
  const muC = (kids && kids.length > 1) ? mean(kids) : muP;
  // everything is stated as a departure from its own generation's mean, which
  // is the only way the two ends can be compared once the mean has moved
  const dev = (v, mu) => signed((v - mu) / SIGMA0);

  if (State.traceDir === 'down') {
    const held = Board.ghost ? Board.ghost[b] : Board.parentCounts[b];
    let s = `<p class="sentence">The <b>parent</b> compartment
      <b>${dev(binCentre(b), muP)} σ₀</b> from its own generation's mean holds
      <b>${held}</b> shot.`;
    if (fam.length > 1) {
      s += ` Its children average <b>${dev(mean(fam), muC)} σ₀</b> from theirs, and are scattered
        ${(sd(fam) / SIGMA0).toFixed(2)} σ₀ about that.`;
    } else if (fam.length === 1) {
      s += ` Its one child landed ${dev(fam[0], muC)} σ₀ from the children's mean.`;
    } else if (!held) {
      s += ` There is nothing in it to follow.`;
    } else {
      s += ` Open it to see where its children go.`;
    }
    return s + '</p>';
  }

  const held = Board.childCounts[b];
  let s = `<p class="sentence">The <b>child</b> compartment
    <b>${dev(binCentre(b), muC)} σ₀</b> from its own generation's mean holds
    <b>${held}</b> shot.`;
  if (fam.length > 1) {
    s += ` The parents they came from average <b>${dev(mean(fam), muP)} σ₀</b> from theirs —
      nearer the middle than the children are, because more of the shot they could have come
      from stood near the middle.`;
  } else if (fam.length === 1) {
    s += ` Its one shot came from a parent ${dev(fam[0], muP)} σ₀ from the parents' mean.`;
  } else {
    s += ` Drop a generation to see which parents fill it.`;
  }
  return s + '</p>';
}
</script>
