/* ============================================================================
   LAYOUT AND RENDERING.
   Cuts nest as closed curves; graphs on one area are stacked, juxtaposition
   being conjunction (C3). Every area keeps a left margin in which the points
   of its lines of identity sit, so a ligature runs down the inside of the
   enclosures it occupies and reaches rightwards to each hook — the shape of
   Peirce's own drawings (Roberts, Figs. 6-9, p. 51).
   ========================================================================== */

const LAY = {
  padX: 20, padY: 15,       // inside a cut
  leftM: 22,                // left margin of an area, where the lines run
  gap: 12,                  // between graphs on one area
  spotH: 24, spotPadX: 7,
  charW: 7.1, minSpotW: 24,
  hookGap: 16,
  bareW: 26, bareH: 16, stub: 18,
  cutW: 1.15, loiW: 2.4,      // the drawn widths, in the hand
  laneW: 15
};

function textWidth(s, nhooks){
  return Math.max(LAY.minSpotW, s.length * LAY.charW + 2*LAY.spotPadX) + (nhooks > 1 ? 12 : 0);
}

/* Does anything on or under this area carry a line of identity? Where lines
   are involved the graphs are stacked, so that each spot's hooks face the
   margin the line runs down; where they are not, graphs sit side by side, as
   Peirce scribes them (Roberts p. 46). */
function areaHasLines(g, areaId){
  if (g.areas[areaId].lns.length) return true;
  for (const id of g.areas[areaId].items){
    const n = g.nodes[id];
    if (n.k === 'spot'){ if (n.hooks.length) return true; }
    else if (areaHasLines(g, n.inner)) return true;
  }
  return false;
}

/* Each ligature that runs down an area's margin gets its own lane, so that two
   distinct lines of identity on one area never appear to join. */
function laneMap(g){
  const lig = ligIndex(g);
  const hooks = new Set();
  for (const n of Object.values(g.nodes))
    if (n.k === 'spot') n.hooks.forEach(h => hooks.add(h));
  const lanes = {};
  for (const a in g.areas) lanes[a] = {};
  for (const l of Object.values(g.lns)){
    if (hooks.has(l.id)) continue;
    const m = lanes[l.area];
    if (m[lig[l.id]] === undefined) m[lig[l.id]] = Object.keys(m).length;
  }
  // a stable order for the ligatures, so that colouring them is repeatable
  const mins = {};
  for (const l of Object.keys(lig)){
    const n = parseInt(String(l).replace(/\D/g,''), 10) || 0;
    if (mins[lig[l]] === undefined || n < mins[lig[l]]) mins[lig[l]] = n;
  }
  const order = Object.keys(mins).sort((a,b) => mins[a] - mins[b]);
  const rank = {};
  order.forEach((k,i) => rank[k] = i);
  return { lanes, lig, hooks, rank, count: order.length };
}

/* ---- measure: bottom-up sizes ------------------------------------------- */
function measure(g, areaId, M, maxRow, LN){
  maxRow = maxRow || 560;
  const area = g.areas[areaId];
  const horiz = !areaHasLines(g, areaId);
  const sizes = [];
  for (const id of area.items){
    const n = g.nodes[id];
    let bw, bh;
    if (n.k === 'spot'){
      bw = textWidth(n.name, n.hooks.length);
      bh = Math.max(LAY.spotH, n.hooks.length * LAY.hookGap + 8);
    } else {
      const m = measure(g, n.inner, M, maxRow, LN);
      bw = m.w; bh = m.h;
    }
    M[id] = { w: bw, h: bh };
    sizes.push({ id, w: bw, h: bh });
  }

  const rows = [];
  if (horiz){
    let cur = [], cw = 0;
    for (const it of sizes){
      if (cur.length && cw + LAY.gap + it.w > maxRow){ rows.push(cur); cur = []; cw = 0; }
      cur.push(it); cw += (cur.length>1 ? LAY.gap : 0) + it.w;
    }
    if (cur.length) rows.push(cur);
  } else {
    for (const it of sizes) rows.push([it]);
  }

  let w = 0, h = 0;
  for (const r of rows){
    let rw = 0, rh = 0;
    r.forEach((it,i) => { rw += (i?LAY.gap:0) + it.w; rh = Math.max(rh, it.h); });
    r.h = rh; r.w = rw;
    w = Math.max(w, rw); h += rh + LAY.gap;
  }
  if (rows.length) h -= LAY.gap;

  if (area.lns.length && !rows.length){ w = Math.max(w, LAY.bareW); h = Math.max(h, LAY.bareH); }
  if (!rows.length && !area.lns.length){ w = Math.max(w, 30); h = Math.max(h, 16); }
  const nLanes = LN ? Object.keys(LN.lanes[areaId]).length : (area.lns.length ? 1 : 0);
  const lm = nLanes ? 10 + nLanes * LAY.laneW + 8 : LAY.padX;
  const box = { w: lm + w + LAY.padX, h: h + 2*LAY.padY, contentW: w, leftM: lm, rows, horiz };
  M[areaId] = box;
  return box;
}

/* ---- place: top-down positions ------------------------------------------ */
function place(g, areaId, x, y, M, P){
  const box = M[areaId];
  P[areaId] = { x, y, w: box.w, h: box.h };
  let cy = y + LAY.padY;
  const cx0 = x + box.leftM;
  for (const r of box.rows){
    let cx = cx0;
    for (const it of r){
      const n = g.nodes[it.id];
      P[it.id] = { x: cx, y: cy + (r.h - it.h)/2, w: it.w, h: it.h };
      if (n.k === 'cut') place(g, n.inner, P[it.id].x, P[it.id].y, M, P);
      cx += it.w + LAY.gap;
    }
    cy += r.h + LAY.gap;
  }
}

/* ---- hook points ---------------------------------------------------------
   The hooks are laid down the spot's left edge in the order of the lines that
   reach them, not in the order of the arguments, so that a spot's own lines
   never have to cross each other. Which place is which is carried by the
   numerals instead — Peirce distinguishes the hooks by position around the
   spot, which a uniform left edge cannot do. */
function hookPoints(g, spotId, P, LN){
  const n = g.nodes[spotId], p = P[spotId];
  const k = n.hooks.length, out = {};
  if (!k) return out;
  const laneOf = h => {
    if (!LN) return 0;
    const lig = LN.lig[h];
    // the lane this hook's ligature runs in, on the nearest area that has one
    let a = n.area;
    while (a){
      const m = LN.lanes[a];
      if (m && m[lig] !== undefined) return depthOf(g, a) * 100 + m[lig];
      a = placeOf(g, a);
    }
    return 999;
  };
  const order = n.hooks.map((h,i) => ({ h, i, lane: laneOf(h) }))
                       .sort((a,b) => a.lane - b.lane || a.i - b.i);
  const span = (k-1) * LAY.hookGap;
  const y0 = p.y + p.h/2 - span/2;
  order.forEach((o, row) => out[o.h] = { x: p.x, y: y0 + row*LAY.hookGap, i: o.i });
  return out;
}

/* A hook carries two facts: which line reaches it, and which place of the
   spot it is. The line is named by the variable the reading gives it; the
   place is the small figure after the name, since the hooks are laid down the
   spot's edge in the order of their lines and not in the order of the
   arguments. */
const SUPER = ['\u00b9','\u00b2','\u00b3','\u2074','\u2075','\u2076','\u2077','\u2078','\u2079'];
function hookLabel(name, i){
  const place = SUPER[i] || ('^'+(i+1));
  return name ? esc(name) + '<tspan class="hookpl">' + place + '</tspan>' : esc(String(i+1));
}

/* ---- positions for the points of the lines of identity ------------------- */
function placeLines(g, P, LN){
  const pos = {}, fixed = {};
  for (const n of Object.values(g.nodes)){
    if (n.k !== 'spot') continue;
    const hp = hookPoints(g, n.id, P, LN);
    for (const h in hp){ pos[h] = { x: hp[h].x, y: hp[h].y }; fixed[h] = true; }
  }
  // spine points sit in their own area's margin, each ligature in its own lane
  for (const l of Object.values(g.lns)){
    if (fixed[l.id]) continue;
    const a = P[l.area];
    const lane = LN ? (LN.lanes[l.area][LN.lig[l.id]] || 0) : 0;
    pos[l.id] = { x: a.x + 10 + lane * LAY.laneW, y: a.y + a.h/2 };
  }
  // relax towards the neighbours, clamped inside the owning area
  for (let it = 0; it < 60; it++){
    for (const l of Object.values(g.lns)){
      if (fixed[l.id]) continue;
      const nb = neighbours(g, l.id);
      if (!nb.length) continue;
      const a = P[l.area];
      let sy = 0; nb.forEach(w => sy += pos[w].y);
      let y = sy / nb.length;
      y = Math.max(a.y + 7, Math.min(a.y + a.h - 7, y));
      pos[l.id].y = pos[l.id].y * 0.4 + y * 0.6;
    }
  }
  /* A branch with a loose end (R3a) is a graph in its own right and has to be
     seen as one. Left to relax towards its only neighbour it converged onto
     it and disappeared, so R3(a) drew nothing at all. Only a point hanging off
     a line is moved: the free end of an ordinary line, whose neighbour is
     itself an end, is left where the relaxation put it. */
  for (const l of Object.values(g.lns)){
    if (fixed[l.id]) continue;
    const nb = neighbours(g, l.id);
    if (nb.length !== 1 || neighbours(g, nb[0]).length < 2) continue;
    // A branch added by R3(a) lies on the same area as the line it comes off.
    // An ordinary line's outer end sits on a different area from the point it
    // runs to, and must be left alone: treating those as stubs stacked every
    // point of "there are three things" on one spot.
    if (g.lns[nb[0]].area !== g.lns[l.id].area) continue;
    const a = P[l.area], q = pos[nb[0]];
    let y = q.y + LAY.stub;
    if (y > a.y + a.h - 7) y = q.y - LAY.stub;
    if (y < a.y + 7 || y > a.y + a.h - 7)
      pos[l.id] = { x: Math.min(q.x + LAY.stub, a.x + a.w - 7), y: q.y };
    else
      pos[l.id] = { x: q.x, y };
    fixed[l.id] = true;
  }

  // spread coincident points on one area so the spine reads as a line
  const byArea = {};
  for (const l of Object.values(g.lns)){
    if (fixed[l.id]) continue;
    const key = l.area + '/' + (LN ? LN.lig[l.id] : 0);
    (byArea[key] = byArea[key] || []).push(l.id);
  }
  for (const a in byArea){
    const ls = byArea[a].sort((p,q) => pos[p].y - pos[q].y);
    for (let i=1;i<ls.length;i++)
      if (pos[ls[i]].y - pos[ls[i-1]].y < 6) pos[ls[i]].y = pos[ls[i-1]].y + 6;
  }
  return pos;
}

/* ---- a hand-drawn closed curve for a cut --------------------------------- */
function seededRand(seed){
  let s = 0; for (let i=0;i<seed.length;i++) s = (s*31 + seed.charCodeAt(i)) & 0x7fffffff;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s / 0x7fffffff); };
}
/* How unsteady the cut is drawn. A pen held over a sheet does not close a
   curve on the millimetre, and Peirce's own cuts in the manuscripts wander;
   `hand` simply widens the wander, and is paired in the drawing with a second
   stroke laid slightly off the first, which is what gives a nib its weight. */
/* A written letter is never quite upright and never quite on the line. SVG
   takes one rotation per glyph, which is enough to make a row of letters look
   set down by a hand rather than by a press. */
function handRotate(seed, name){
  const rnd = seededRand(seed + '#r');
  return Array.from(name).map(() => r2((rnd() - 0.5) * 11)).join(' ');
}
/* A name set in Peirce's own letterforms, where they have been harvested.
   The table is optional: with none present, or with any letter of this name
   missing from it, nothing is written here and the ordinary face is used
   instead, since a name half in his hand and half in type reads as a fault
   rather than as a limitation. */
function writtenName(name, cx, cy, seed){
  const T = typeof PEIRCE_HAND !== 'undefined' ? PEIRCE_HAND : null;
  if (!T || !T.glyphs) return null;
  const marks = [];
  for (const ch of name){
    if (ch === ' '){ marks.push(null); continue; }
    const v = T.glyphs[ch];
    if (!v || !v.length) return null;          // one gap and the whole name goes
    marks.push(v);
  }
  const size = LAY.spotH * 0.55;               // the drawn face, in page units
  const k = size / T.em;
  const rnd = seededRand(seed + '#w');
  const pick = [];
  let w = 0;
  for (const v of marks){
    if (!v){ w += size * 0.3; pick.push(null); continue; }
    const g = v[Math.floor(rnd() * v.length) % v.length];
    pick.push(g); w += g.a * k;
  }
  let x = cx - w/2;
  const y = cy + size * 0.32;                  // sit the writing line under the middle
  const out = [];
  for (const g of pick){
    if (!g){ x += size * 0.3; continue; }
    const tilt = (rnd() - 0.5) * 7;
    out.push(`<path class="written" transform="translate(${r2(x)},${r2(y)}) scale(${
      r2(k)}) rotate(${r2(tilt)})" d="${g.d}"/>`);
    x += g.a * k;
  }
  return out.join('');
}

function handShift(seed){
  const rnd = seededRand(seed + '#y');
  return (rnd() - 0.5) * 1.8;
}

/* Drawing with ink rather than with a pen of one width.

   Measured on the centrelines of nineteen of Peirce's own figures, about
   90,000 samples: the stroke runs from roughly half its median width to about
   1.6 times it, a coefficient of variation near 0.5. And it does not flicker —
   two points stay alike over some four stroke widths and have drifted apart by
   sixteen. Both of those are ratios, so they carry to any scale.

   A single SVG path cannot change width along itself, so the stroke is drawn
   as a row of overlapping pieces cut out of the same path with a dash window,
   each piece carrying its own width from a smooth walk of that spread and that
   length. Round caps make the joins invisible. */
function inkRuns(len, baseW, seed){
  const rnd = seededRand(seed + '#ink');
  const run = Math.max(5, baseW * 4);
  const n = Math.max(1, Math.min(60, Math.round(len / run)));
  if (n < 2) return [{ w: baseW, dash: null }];
  const step = len / n;
  const out = [];
  let g = 0;
  for (let i = 0; i < n; i++){
    g = g * 0.5 + (rnd() + rnd() + rnd() - 1.5) * 0.95;
    // the walk's own spread is about 0.55; 0.80 takes the width to the
    // measured coefficient of variation of 0.5, and the floor keeps the
    // thinnest run from breaking the line
    const lap = step * 0.4;
    const from = Math.max(0, i * step - lap);
    const to = Math.min(len, (i + 1) * step + lap);
    out.push({ w: r2(Math.max(baseW * 0.5, baseW * Math.exp(g * 0.80))),
               dash: `${r2(to - from)} ${r2(len * 2 + 20)}`,
               off: r2(-from) });
  }
  return out;
}
function inkStroke(cls, d, len, baseW, seed){
  const runs = inkRuns(len, baseW, seed);
  if (runs.length < 2) return `<path class="${cls}" d="${d}"/>`;
  return runs.map(r => `<path class="${cls}" style="stroke-width:${r.w}px" `+
    `stroke-dasharray="${r.dash}" stroke-dashoffset="${r.off}" d="${d}"/>`).join('');
}
function polyLen(pts){
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i-1], pts[i]);
  return L;
}

function cutPath(x, y, w, h, seed, wobble, hand){
  const r = Math.min(22, h/2, w/2);
  if (!wobble) return roundRect(x,y,w,h,r);
  const rnd = seededRand(seed + (hand ? '~h' : ''));
  /* How far the curve wanders off a true ellipse. In the manuscripts this was
     measured at a median 0.074 of the cut's own width, so it scales with the
     cut rather than being a fixed number of pixels: a large cut wanders more
     than a small one, which is what a hand does. */
  const amp = hand ? Math.max(2.2, Math.min(w, h) * 0.074) : 2.4;
  const j = () => (rnd() - 0.5) * amp;
  const x0=x+j(), y0=y+j(), x1=x+w+j(), y1=y+h+j();
  const body = `M ${x0+r} ${y0}
    L ${x1-r+j()} ${y0+j()} Q ${x1} ${y0} ${x1+j()} ${y0+r}
    L ${x1+j()} ${y1-r+j()} Q ${x1} ${y1} ${x1-r+j()} ${y1}
    L ${x0+r+j()} ${y1+j()} Q ${x0} ${y1} ${x0+j()} ${y1-r}
    L ${x0+j()} ${y0+r+j()} Q ${x0} ${y0} ${x0+r} ${y0}`;
  /* Peirce's own cuts often overshoot and cross at the join rather than
     closing, but an open curve on a screen reads as a mistake rather than as a
     hand, and a cut that does not enclose is the one thing in this notation
     that must never be in doubt. So the curve is closed, and what is kept of
     the finding is the wander, which is measured. */
  return body + ' Z';
}

function roundRect(x,y,w,h,r){
  return `M ${x+r} ${y} H ${x+w-r} Q ${x+w} ${y} ${x+w} ${y+r}
          V ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h}
          H ${x+r} Q ${x} ${y+h} ${x} ${y+h-r}
          V ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;
}

/* ---- paths for the lines of identity -------------------------------------
   The points of a ligature are strung into chains, so that each unbroken run
   of line is one path. Chains break only where a line ends or branches. */
function lineChains(g, pos){
  const adj = {};
  for (const l of Object.keys(g.lns)) adj[l] = [];
  for (const e of Object.values(g.edges)){
    if (!pos[e.a] || !pos[e.b] || !adj[e.a] || !adj[e.b]) continue;
    adj[e.a].push({ to:e.b, e:e.id });
    adj[e.b].push({ to:e.a, e:e.id });
  }
  const used = new Set(), chains = [];
  const deg = l => adj[l].length;
  function walkFrom(start){
    for (const first of adj[start]){
      if (used.has(first.e)) continue;
      used.add(first.e);
      const pts = [start, first.to];
      let prev = start, cur = first.to;
      while (deg(cur) === 2){
        const nxt = adj[cur].find(x => !used.has(x.e));
        if (!nxt) break;
        used.add(nxt.e);
        prev = cur; cur = nxt.to; pts.push(cur);
      }
      chains.push(pts);
    }
  }
  for (const l of Object.keys(adj)) if (deg(l) !== 2) walkFrom(l);
  for (const l of Object.keys(adj)) walkFrom(l);   // whatever is left is a cycle
  return chains;
}
// Between two points that share neither coordinate the line turns a corner:
// it runs vertically at the smaller x, then across — the hook shape Peirce draws.
function elbowPoints(chain, pos){
  const out = [pos[chain[0]]];
  for (let i = 1; i < chain.length; i++){
    const a = out[out.length-1], b = pos[chain[i]];
    if (!b) continue;
    if (Math.abs(a.x-b.x) > 1 && Math.abs(a.y-b.y) > 1)
      out.push(a.x < b.x ? { x:a.x, y:b.y } : { x:b.x, y:a.y });
    out.push(b);
  }
  return out;
}
// A polyline with the corners rounded — the radius never exceeds half of either
// adjacent run, so a corner can never overshoot its own segment — and with a
// small hop wherever this line crosses another. The hop is Peirce's 'bridge',
// "a bit of paper ribbon, with one line passing under it and the other upon it"
// (Ms 455, quoted Roberts p. 55).
function roundedPath(pts, maxR, hops){
  const P = dedupePts(pts);
  if (P.length < 2) return null;
  const n = P.length;
  const rad = new Array(n).fill(0);
  // A crossing that falls inside a rounded corner has no straight run to be
  // bridged on, and the bridge was simply dropped — two lines met flat on the
  // page. The corner is squared off instead, which frees the whole segment.
  const near = [];
  if (hops) for (const list of hops) if (list) for (const q of list) near.push(q);
  for (let i = 1; i < n-1; i++){
    const d1 = dist(P[i-1], P[i]), d2 = dist(P[i], P[i+1]);
    let r = Math.min(maxR, d1/2, d2/2);
    if (near.some(q => Math.hypot(q.x - P[i].x, q.y - P[i].y) < HOPR + 2.5)) r = 0;
    rad[i] = r < 0.8 ? 0 : r;
  }
  const towards = (p, q, r) => r <= 0 ? { x:p.x, y:p.y }
    : { x: p.x + (q.x-p.x)/dist(p,q)*r, y: p.y + (q.y-p.y)/dist(p,q)*r };

  let d = '';
  for (let i = 0; i < n-1; i++){
    const A = i === 0 ? P[0] : towards(P[i], P[i+1], rad[i]);
    const B = i === n-2 ? P[n-1] : towards(P[i+1], P[i], rad[i+1]);
    if (i === 0) d += `M ${r2(A.x)} ${r2(A.y)}`;
    d += runWithHops(A, B, hops && hops[i]);
    if (i < n-2){
      const C = towards(P[i+1], P[i+2], rad[i+1]);
      d += ` Q ${r2(P[i+1].x)} ${r2(P[i+1].y)} ${r2(C.x)} ${r2(C.y)}`;
    }
  }
  return d;
}
const HOPR = 4.2;
/* The bridge itself. A run may be horizontal or vertical, so the crossings are
   measured as distances along it rather than as x positions, and the arc is
   shrunk where the crossing sits close to a corner — a bridge that would not
   fit used to be dropped, which left two lines meeting flat on the page. The
   sweep is chosen so that the arc always rises off the same side: upwards on a
   horizontal run, leftwards on a vertical one. */
function runWithHops(A, B, pts){
  const plain = ` L ${r2(B.x)} ${r2(B.y)}`;
  if (!pts || !pts.length) return plain;
  const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
  if (len < 3) return plain;
  const ux = dx/len, uy = dy/len;
  const sweep = (ux > 0.5 || uy > 0.5) ? 1 : 0;
  const at = pts.map(p => (p.x-A.x)*ux + (p.y-A.y)*uy)
                .filter(t => t > 0.6 && t < len - 0.6)
                .sort((p,q) => p-q);
  let d = '', last = 0;
  for (const t of at){
    const r = Math.min(HOPR, t - last - 0.4, len - t - 0.4);
    if (r < 1.2) continue;
    d += ` L ${r2(A.x + ux*(t-r))} ${r2(A.y + uy*(t-r))}` +
         ` A ${r2(r)} ${r2(r)} 0 0 ${sweep} ${r2(A.x + ux*(t+r))} ${r2(A.y + uy*(t+r))}`;
    last = t + r;
  }
  return d + plain;
}
function dedupePts(pts){
  const P = [];
  for (const p of pts){
    if (!p) continue;
    const q = P[P.length-1];
    if (!q || Math.abs(q.x-p.x) > 0.4 || Math.abs(q.y-p.y) > 0.4) P.push(p);
  }
  return P;
}
const dist = (p,q) => Math.hypot(p.x-q.x, p.y-q.y) || 1e-6;

/* Where one line crosses another, the horizontal one hops over. */
/* Where two lines of identity cross, one is drawn bridging over the other, as
   Peirce draws it (Ms 455). Which one bridges must not depend on the accident
   of which happens to be running horizontally there, or the same pair of lines
   passes over and under each other by turns down the page. Each ligature has a
   rank already, the one its colour is taken from, and the higher rank always
   takes the bridge: so a given pair crosses the same way every time, and the
   line kept whole is the same line throughout the drawing. */
function crossingHops(polys, keys){
  const Ps = polys.map(dedupePts);
  const hops = Ps.map(P => P.map(() => []));
  const segs = [];
  Ps.forEach((P, i) => {
    for (let s = 0; s + 1 < P.length; s++){
      const a = P[s], b = P[s+1];
      const horiz = Math.abs(a.y - b.y) <= 0.5, vert = Math.abs(a.x - b.x) <= 0.5;
      if (horiz === vert) continue;                    // degenerate or diagonal
      segs.push({ i, s, a, b, horiz });
    }
  });
  const key = i => (keys && keys[i] !== undefined) ? keys[i] : i;
  for (let m = 0; m < segs.length; m++)
    for (let n = m + 1; n < segs.length; n++){
      const A = segs[m], B = segs[n];
      if (A.i === B.i || A.horiz === B.horiz) continue;
      const H = A.horiz ? A : B, V = A.horiz ? B : A;
      const x = V.a.x, y = H.a.y;
      const xlo = Math.min(H.a.x, H.b.x), xhi = Math.max(H.a.x, H.b.x);
      const ylo = Math.min(V.a.y, V.b.y), yhi = Math.max(V.a.y, V.b.y);
      if (!(x > xlo + 0.5 && x < xhi - 0.5 && y > ylo + 0.5 && y < yhi - 0.5)) continue;
      const kh = key(H.i), kv = key(V.i);
      const over = (kh === kv ? H.i > V.i : kh > kv) ? H : V;
      // one ligature is drawn as several chains, so the same place on the page
      // can be found twice; it is one crossing and takes one bridge
      const here = hops[over.i][over.s];
      if (here.some(q => Math.abs(q.x - x) < 0.01 && Math.abs(q.y - y) < 0.01)) continue;
      here.push({ x, y });
    }
  return hops;
}

const r2 = n => Math.round(n*100)/100;

/* ---- the renderer -------------------------------------------------------- */
// Geometry only: sizes and positions for every area, node and line point.
function geom(g, opts){
  opts = opts || {};
  const M = {}, P = {};
  const LN = laneMap(g);
  measure(g, g.root, M, opts.maxRow, LN);
  place(g, g.root, 0, 0, M, P);
  const pos = placeLines(g, P, LN);
  return { M, P, pos, LN, W: M[g.root].w, H: M[g.root].h };
}

function renderGraph(g, opts){
  opts = opts || {};
  const G0 = geom(g, opts);
  const M = G0.M, P = G0.P, pos = G0.pos, LN = G0.LN;
  const W = G0.W, H = G0.H;
  const parts = [];
  const shade = opts.shade;
  const wobble = opts.wobble !== false;
  const hand = !!opts.hand;
  const hl = opts.highlight || {};      // {nodeId:'add'|'del'|'move'}
  const tint = opts.tint || {};         // {cutId: 0-3}, to tie a cut to part of a formula

  // The frame is the sheet as drawn. Left to itself it is the graph's own size;
  // given a frame it is that size, never smaller than the graph, with the graph
  // centred in it. A proof pins one frame across all its steps so that nothing
  // rescales or shifts between them.
  const FW = opts.frame ? Math.max(opts.frame.W, W) : W;
  const FH = opts.frame ? Math.max(opts.frame.H, H) : H;
  const dx = r2((FW - W) / 2), dy = r2((FH - H) / 2);
  const raised = opts.raised === false ? '' : ' raised';
  const sheet = `<rect class="sa" x="0.5" y="0.5" width="${FW-1}" height="${FH-1}" rx="6"/>`;

  function drawArea(areaId){
    for (const id of g.areas[areaId].items){
      const n = g.nodes[id], p = P[id];
      const mark = hl[id] ? ' hl-'+hl[id] : '';
      if (n.k === 'cut'){
        const d = depthOf(g, n.inner);
        const tc = tint[id] !== undefined ? ' tint' + tint[id] : '';
        parts.push(`<path class="cut${mark}${tc}${raised}${shade && d%2===1 ? ' odd':''}" d="${
          cutPath(p.x, p.y, p.w, p.h, n.id, wobble, hand)}" data-node="${n.id}" data-area="${n.inner}"/>`);
      if (hand) parts.push(inkStroke('cut ink' + tc, cutPath(p.x, p.y, p.w, p.h, n.id, wobble, hand),
        2*(p.w + p.h), LAY.cutW, n.id));
        drawArea(n.inner);
      } else {
        const cx = p.x + p.w/2 + (n.hooks.length > 1 ? 6 : 0);
        const cy = p.y + p.h/2;
        const written = hand ? writtenName(n.name, cx, cy, n.id) : null;
        parts.push(`<g class="spot${mark}" data-node="${n.id}">`+
          `<rect class="spotbg" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="5"/>`+
          (written || (`<text x="${cx}" y="${
            r2(cy + (hand ? handShift(n.id) : 0))}" `+
          (hand ? `rotate="${handRotate(n.id, n.name)}" ` : '')+
          `dominant-baseline="central" text-anchor="middle">${esc(n.name)}</text>`))+
          `</g>`);
      }
    }
  }
  drawArea(g.root);

  // lines of identity, drawn heavy (C6-C8). A ligature is drawn as whole
  // chains rather than edge by edge: a line is one graph (C7), and drawing it
  // in pieces leaves the round ends of each piece stacked at every junction.
  const colour = opts.colourLines && LN.count > 1;
  const lc = ln => colour ? ' lc' + (LN.rank[LN.lig[ln]] % 7) : '';
  let VARS = {}; try { VARS = lineVars(g); } catch(e){}
  const chains = lineChains(g, pos);
  const polys  = chains.map(ch => dedupePts(elbowPoints(ch, pos)));
  const hops   = crossingHops(polys, chains.map(ch => LN.rank[LN.lig[ch[0]]]));
  polys.forEach((pts, i) => {
    const d = roundedPath(pts, 5, hops[i]);
    if (!d) return;
    const cls = 'loi' + lc(chains[i][0]);
    parts.push(hand
      ? inkStroke(cls, d, polyLen(pts), LAY.loiW, chains[i][0])
      : `<path class="${cls}" d="${d}" data-chain="${chains[i].join(',')}"/>`);
  });
  // a ligature with a single point and no edge is the bare line of C6
  for (const l of Object.values(g.lns)){
    if (neighbours(g, l.id).length) continue;
    const isHook = Object.values(g.nodes).some(n => n.k==='spot' && n.hooks.includes(l.id));
    if (isHook) continue;
    const p = pos[l.id];
    parts.push(`<path class="loi${lc(l.id)}" d="M ${p.x} ${p.y} L ${p.x + LAY.bareW} ${p.y}" data-ln="${l.id}"/>`);
  }
  // where three or more lines meet, a dot just fills the join (C8, teridentity)
  for (const l of Object.values(g.lns)){
    if (neighbours(g, l.id).length >= 3){
      const p = pos[l.id];
      parts.push(`<circle class="branch${lc(l.id)}" cx="${p.x}" cy="${p.y}" r="1.7"/>`);
    }
  }
  // hook labels: the variable each line carries, in the colour of that line,
  // so that a relation can be read off the drawing the way it is written
  if (opts.hookNumbers !== false)
  for (const n of Object.values(g.nodes)){
    if (n.k !== 'spot' || n.hooks.length < 2) continue;
    const hp = hookPoints(g, n.id, P, LN);
    n.hooks.forEach(h => {
      const q = hp[h];
      parts.push(`<text class="hooknum${lc(h)}" x="${q.x+6}" y="${
        q.y-4}">${hookLabel(VARS[h], q.i)}</text>`);
    });
  }

  // small grips on the points of the lines, for the editor
  if (opts.handles)
    for (const l of Object.values(g.lns)){
      const p = pos[l.id]; if (!p) continue;
      parts.push(`<circle class="handle" cx="${p.x}" cy="${p.y}" r="3.6" data-ln="${l.id}"/>`);
    }

  return { svg: sheet + `<g class="gr" transform="translate(${dx},${dy})">` + parts.join('\n') + '</g>',
           w: FW, h: FH, dx, dy, P, pos, M };
}

function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function svgDoc(g, opts){
  opts = opts || {};
  const r = renderGraph(g, opts);
  const pad = opts.pad || 10;
  return `<svg class="eg${opts && opts.hand ? ' hand' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${r.w+2*pad} ${r.h+2*pad}" `+
         `width="${(r.w+2*pad)*(opts.scale||1)}" height="${(r.h+2*pad)*(opts.scale||1)}">${r.svg}</svg>`;
}
