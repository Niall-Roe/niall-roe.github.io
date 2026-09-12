/* ============================================================================
   ANIMATING A TRANSFORMATION.

   A proof is a sequence of writings and erasures, and it is much easier to see
   what a rule does if the diagram shows it happening. Each step is played in
   two beats: first the graph the rule is about to act on is marked and left
   standing for a moment, then the drawing moves — enclosures growing to make
   room, a copy appearing where it was scribed, an erased graph fading away.

   Node and line identifiers survive a transformation (applyMove clones the
   graph), so a node can be followed from one step to the next and its geometry
   interpolated between them.
   ========================================================================== */

const EASE = t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
const lerp = (a,b,t) => a + (b-a)*t;

/* Which graphs is this rule about to act on, and how should they be marked? */
function moveFocus(g, mv){
  const f = {};
  if (!mv) return f;
  const areaCut = a => { const A = g.areas[a]; return A && A.cut ? A.cut : null; };
  switch (mv.op){
    case 'erase':     f[mv.node] = 'del'; break;
    case 'deiterate': f[mv.node] = 'del'; if (mv.witness) f[mv.witness] = 'src'; break;
    case 'iterate':   f[mv.node] = 'src'; { const c = areaCut(mv.target); if (c) f[c] = 'area'; } break;
    case 'insert':    { const c = areaCut(mv.area); if (c) f[c] = 'area'; } break;
    case 'dcIn':      (mv.items||[]).forEach(i => f[i] = 'src');
                      { const c = areaCut(mv.area); if (c && !(mv.items||[]).length) f[c] = 'area'; } break;
    // both cuts go, so both are marked: the pair is the thing the rule is
    // about to take off the sheet, and one ring around the outer alone reads
    // as though the inner were staying
    case 'dcOut':     { f[mv.cut] = 'del';
                        const n = g.nodes[mv.cut];
                        const inner = n && g.areas[n.inner] && g.areas[n.inner].items[0];
                        if (inner) f[inner] = 'del'; } break;
    // The rules that work on lines act on points, not on graphs, so these mark
    // the points themselves. Without them the steps that do the ligature
    // surgery — Barbara's fourth, fifth and sixth — showed nothing at all.
    case 'join':      f[mv.a] = 'src'; f[mv.b] = 'src'; break;
    case 'eraseEdge': { const e = g.edges[mv.edge];
                        if (e){ f[e.a] = 'del'; f[e.b] = 'del'; } break; }
    case 'delLine':   f[mv.ln] = 'del'; break;
    case 'retract':   f[mv.ln] = 'del'; break;
    case 'branch':    f[mv.ln] = 'src'; break;
    case 'extend':    f[mv.ln] = 'src'; if (mv.cut) f[mv.cut] = 'area'; break;
    case 'addLine':   { const c = areaCut(mv.area); if (c) f[c] = 'area'; } break;
  }
  return f;
}

/* The transition is prepared once — geometry for both graphs, and the set of
   things to draw — and then a frame is produced for each value of t. */
function prepareTween(gA, gB, GA, GB, opts){
  opts = opts || {};
  const nodeIds = [...new Set([...Object.keys(gA.nodes), ...Object.keys(gB.nodes)])];
  const depthOfId = id => {
    const g = gB.nodes[id] ? gB : gA;
    return depthOf(g, g.nodes[id].area);
  };
  const nodes = nodeIds.sort((x,y) => depthOfId(x) - depthOfId(y)).map(id => {
    const inA = !!gA.nodes[id], inB = !!gB.nodes[id];
    const n = inB ? gB.nodes[id] : gA.nodes[id];
    let a = GA.P[id], b = GB.P[id];
    if (!a && !b) return null;
    if (!a) a = shrink(b);
    if (!b) b = shrink(a);
    const g = inB ? gB : gA;
    // hook positions in both geometries, so the numerals can travel too
    let hkA = null, hkB = null;
    if (n.k === 'spot' && n.hooks.length > 1){
      if (inA) try { hkA = hookPoints(gA, id, GA.P, GA.LN); } catch(e){}
      if (inB) try { hkB = hookPoints(gB, id, GB.P, GB.LN); } catch(e){}
    }
    return { id, n, a, b, inA, inB, hkA, hkB,
             odd: n.k === 'cut' && depthOf(g, n.inner) % 2 === 1 };
  }).filter(Boolean);

  const edgesA = new Set(Object.keys(gA.edges)), edgesB = new Set(Object.keys(gB.edges));
  const keyOf = e => e.a < e.b ? e.a+'|'+e.b : e.b+'|'+e.a;
  const lookupA = {}, lookupB = {};
  for (const e of Object.values(gA.edges)) lookupA[keyOf(e)] = e.id;
  for (const e of Object.values(gB.edges)) lookupB[keyOf(e)] = e.id;
  const chainEdgeIds = (ch, look) => {
    const out = [];
    for (let i=0;i+1<ch.length;i++){
      const k = ch[i] < ch[i+1] ? ch[i]+'|'+ch[i+1] : ch[i+1]+'|'+ch[i];
      if (look[k]) out.push(look[k]);
    }
    return out;
  };
  const chains = [];
  for (const ch of lineChains(gB, GB.pos)){
    const ids = chainEdgeIds(ch, lookupB);
    chains.push({ ch, fresh: ids.some(x => !edgesA.has(x)), gone: false });
  }
  for (const ch of lineChains(gA, GA.pos)){
    const ids = chainEdgeIds(ch, lookupA);
    if (!ids.some(x => !edgesB.has(x))) continue;    // already covered by B's chains
    chains.push({ ch, fresh: false, gone: true });
  }
  // bare, unattached lines (C6)
  const bare = [];
  const hookSet = g => { const s = new Set();
    for (const n of Object.values(g.nodes)) if (n.k==='spot') n.hooks.forEach(h=>s.add(h)); return s; };
  const hA = hookSet(gA), hB = hookSet(gB);
  for (const l of new Set([...Object.keys(gA.lns), ...Object.keys(gB.lns)])){
    const inA = gA.lns[l] && !neighbours(gA,l).length && !hA.has(l);
    const inB = gB.lns[l] && !neighbours(gB,l).length && !hB.has(l);
    if (inA || inB) bare.push({ l, inA: !!inA, inB: !!inB });
  }

  /* A point that only one of the two graphs has still needs somewhere to come
     from, or to go to: the nearest point of its own line that both graphs
     have. Without this a lengthened line appeared at full length rather than
     growing out of the line already drawn, and a retracted one vanished
     instead of drawing back. */
  const nearestKnown = (g, from, known) => {
    const seen = new Set([from]); let front = [from];
    for (let d = 0; d < 40 && front.length; d++){
      const next = [];
      for (const l of front) for (const m of neighbours(g, l)){
        if (seen.has(m)) continue;
        if (known[m]) return known[m];
        seen.add(m); next.push(m);
      }
      front = next;
    }
    return null;
  };
  const fromPos = {}, toPos = {};
  for (const l of Object.keys(gB.lns)) if (!gA.lns[l]){
    const q = nearestKnown(gB, l, GA.pos); if (q) fromPos[l] = q;
  }
  for (const l of Object.keys(gA.lns)) if (!gB.lns[l]){
    const q = nearestKnown(gA, l, GB.pos); if (q) toPos[l] = q;
  }
  // a line that grows or draws back need not fade: it is already continuous
  for (const c of chains){
    const anchored = c.ch.some(l => (c.gone ? gB.lns[l] : gA.lns[l]));
    if (anchored) c.anchored = true;
  }

  let varsA = {}, varsB = {};
  try { varsA = lineVars(gA); } catch(e){}
  try { varsB = lineVars(gB); } catch(e){}

  const LNB = laneMap(gB), LNA = laneMap(gA);
  const colour = opts.colourLines && Math.max(LNA.count, LNB.count) > 1;
  const rankOf = ln => {
    const L = LNB.lig[ln] !== undefined ? LNB : LNA;
    const r = L.rank[L.lig[ln]];
    return r === undefined ? 0 : r;
  };
  const lcOf = ln => colour ? ' lc' + (rankOf(ln) % 7) : '';
  // The frame each end of the transition would be drawn in on its own, and
  // where the graph sits inside it. A pinned frame makes both ends the same.
  const fr = opts.frame;
  const FA = { W: fr ? Math.max(fr.W, GA.W) : GA.W, H: fr ? Math.max(fr.H, GA.H) : GA.H };
  const FB = { W: fr ? Math.max(fr.W, GB.W) : GB.W, H: fr ? Math.max(fr.H, GB.H) : GB.H };
  FA.dx = (FA.W - GA.W)/2; FA.dy = (FA.H - GA.H)/2;
  FB.dx = (FB.W - GB.W)/2; FB.dy = (FB.H - GB.H)/2;

  /* What this step adds and what it takes away, and hence how the motion is
     to be staged. A graph must never simply appear over the top of another:
     first whatever is erased goes, then the enclosures grow to make room, then
     the empty room is marked, and only then is the new graph scribed in it. */
  const hasAdd = nodes.some(it => it.inB && !it.inA) ||
                 chains.some(c => c.fresh) || bare.some(b => b.inB && !b.inA);
  const hasDel = nodes.some(it => it.inA && !it.inB) ||
                 chains.some(c => c.gone) || bare.some(b => b.inA && !b.inB);
  const sched = opts.stage === false ? null
    : hasAdd && hasDel ? { out:[0,0.22], geom:[0.20,0.62], pulse:[0.58,0.88], in:[0.70,1] }
    : hasAdd           ? { out:[0,0.36], geom:[0,0.55],    pulse:[0.53,0.86], in:[0.68,1] }
    : hasDel           ? { out:[0,0.30], geom:[0.26,1],    pulse:null,        in:[0.4,1] }
    :                    { out:[0,0.45], geom:[0,1],       pulse:null,        in:[0.18,1] };

  // the room the new graph is going into, for the pulse
  let addBox = null;
  const widen = q => { if (!q) return;
    addBox = addBox ? { x: Math.min(addBox.x,q.x), y: Math.min(addBox.y,q.y),
                        X: Math.max(addBox.X,q.x+(q.w||0)), Y: Math.max(addBox.Y,q.y+(q.h||0)) }
                    : { x:q.x, y:q.y, X:q.x+(q.w||0), Y:q.y+(q.h||0) }; };
  if (sched && sched.pulse){
    for (const it of nodes) if (it.inB && !it.inA) widen(GB.P[it.id]);
    for (const c of chains) if (c.fresh) for (const l of c.ch)
      if (!gA.lns[l] && GB.pos[l]) widen(GB.pos[l]);
    for (const b of bare) if (b.inB && !b.inA) widen(GB.pos[b.l]);
  }

  return { gA, gB, GA, GB, nodes, chains, bare, opts, lcOf, rankOf, FA, FB,
           hasAdd, hasDel, sched, addBox, fromPos, toPos, varsA, varsB,
           W: Math.max(FA.W, FB.W), H: Math.max(FA.H, FB.H) };
}
const span = (t, w) => w[1] <= w[0] ? (t >= w[1] ? 1 : 0)
                     : Math.max(0, Math.min(1, (t - w[0]) / (w[1] - w[0])));

function tweenFrame(sp, t){
  const { GA, GB, opts } = sp;
  const parts = [];
  const shade = opts.shade, wobble = opts.wobble !== false, hand = !!opts.hand;
  const S = sp.sched || { out:[0,0.45], geom:[0,1], pulse:null, in:[0.18,1] };
  const outT = span(t, S.out);                   // what goes, goes first
  const inT  = span(t, S.in);                    // what comes, comes last
  const e = EASE(span(t, S.geom));               // and the room is made between

  const raised = opts.raised === false ? '' : ' raised';
  const FW = lerp(sp.FA.W, sp.FB.W, e), FH = lerp(sp.FA.H, sp.FB.H, e);
  const dx = lerp(sp.FA.dx, sp.FB.dx, e), dy = lerp(sp.FA.dy, sp.FB.dy, e);
  const sheet = `<rect class="sa" x="0.5" y="0.5" width="${r2(FW-1)}" height="${r2(FH-1)}" rx="6"/>`;

  for (const it of sp.nodes){
    const op = it.inA && it.inB ? 1 : it.inB ? inT : 1 - outT;
    if (op <= 0.01) continue;
    const x = lerp(it.a.x, it.b.x, e), y = lerp(it.a.y, it.b.y, e);
    const w = lerp(it.a.w, it.b.w, e), h = lerp(it.a.h, it.b.h, e);
    if (it.n.k === 'cut'){
      parts.push(`<path class="cut${raised}${shade && it.odd ? ' odd':''}" opacity="${r2(op)}" d="${
        cutPath(x, y, w, h, it.n.id, wobble, hand)}"/>`);
    } else {
      // the moving drawing writes the name the same way the still one does
      const cx = x + w/2 + (it.n.hooks.length>1?6:0), cy = y + h/2;
      const written = hand ? writtenName(it.n.name, cx, cy, it.n.id) : null;
      parts.push(`<g class="spot" opacity="${r2(op)}">`+
        (written || (`<text x="${r2(cx)}" y="${r2(cy)}" `+
        `dominant-baseline="central" text-anchor="middle">${esc(it.n.name)}</text>`))+'</g>');
      if (opts.hookNumbers !== false && it.n.hooks.length > 1)
        parts.push(hookNumerals(it, e, sp));
    }
  }

  // one interpolated position for every point of every line
  const POS = {};
  for (const ln of new Set([...Object.keys(GA.pos), ...Object.keys(GB.pos)])){
    const a = GA.pos[ln] || sp.fromPos[ln], b = GB.pos[ln] || sp.toPos[ln];
    POS[ln] = (a && b) ? { x: lerp(a.x,b.x,e), y: lerp(a.y,b.y,e) } : (a || b);
  }
  // A line that grows out of one already drawn, or draws back into one, needs
  // no fade — it is continuous with what is there. A retraction is still taken
  // off the sheet at the very end, so that nothing is left behind.
  const live = sp.chains.map(c => ({ c, op:
      c.gone  ? (c.anchored ? Math.min(1, (1-t)*4) : 1-outT)
    : c.fresh ? (c.anchored ? 1 : inT) : 1 }))
                        .filter(x => x.op > 0.01);
  const polys = live.map(x => dedupePts(elbowPoints(x.c.ch, POS)));
  const hops  = crossingHops(polys, live.map(x => sp.rankOf(x.c.ch[0])));
  polys.forEach((pts, i) => {
    const d = roundedPath(pts, 5, hops[i]);
    if (d) parts.push(`<path class="loi${sp.lcOf(live[i].c.ch[0])}" opacity="${
      r2(live[i].op)}" d="${d}"/>`);
  });
  for (const b of sp.bare){
    const op = b.inA && b.inB ? 1 : b.inB ? inT : 1 - outT;
    if (op <= 0.01) continue;
    const p = POS[b.l]; if (!p) continue;
    parts.push(`<path class="loi${sp.lcOf(b.l)}" opacity="${r2(op)}" d="M ${r2(p.x)} ${r2(p.y)} L ${
      r2(p.x + LAY.bareW)} ${r2(p.y)}"/>`);
  }
  // the room, marked while it stands empty
  if (S.pulse && sp.addBox){
    const pT = span(t, S.pulse);
    if (pT > 0 && pT < 1){
      const m = 6, B = sp.addBox;
      parts.push(`<rect class="newroom" opacity="${r2(Math.sin(pT*Math.PI)*0.85)}" x="${
        r2(B.x-m)}" y="${r2(B.y-m)}" width="${r2(B.X-B.x+2*m)}" height="${
        r2(B.Y-B.y+2*m)}" rx="9"/>`);
    }
  }
  return { svg: sheet + `<g class="gr" transform="translate(${r2(dx)},${r2(dy)})">` +
                parts.join('\n') + '</g>', W: FW, H: FH };
}
function shrink(b){ return { x: b.x + b.w/2 - 2, y: b.y + b.h/2 - 2, w: 4, h: 4 }; }

/* Which hook is which place of the spot. The static drawing carries these; so
   must the moving one, or a relation becomes unreadable the moment it is drawn
   by an animation rather than at rest. */
function hookNumerals(it, e, sp){
  const A = it.hkA, B = it.hkB, src = B || A;
  if (!src) return '';
  // the name a line carries can change under a rule — two lines joined into
  // one take a single variable — so the label turns over with the motion
  const vars = sp ? (e < 0.5 ? sp.varsA : sp.varsB) : null;
  const alt  = sp ? (e < 0.5 ? sp.varsB : sp.varsA) : null;
  const out = [];
  for (const h of it.n.hooks){
    const a = A && A[h], b = B && B[h];
    const q = (a && b) ? { x: lerp(a.x,b.x,e), y: lerp(a.y,b.y,e), i:(b.i) }
            : (b || a);
    if (!q) continue;
    const name = (vars && vars[h]) || (alt && alt[h]) || null;
    out.push(`<text class="hooknum${sp ? sp.lcOf(h) : ''}" x="${r2(q.x+6)}" y="${
      r2(q.y-4)}">${hookLabel(name, q.i)}</text>`);
  }
  return out.join('');
}

/* The first beat: the graph as it stands, with everything but the graphs the
   rule is about to act on held back, a ghost of whatever is about to be
   scribed shown where it will appear, and an arrow from a graph to the area it
   is about to be copied into. The point is to let the eye find the place
   before anything moves. */
function markFrame(sp, focus, mv){
  const { gA, GA, opts } = sp;
  const parts = [];
  const shade = opts.shade, wobble = opts.wobble !== false, hand = !!opts.hand;
  const raised = opts.raised === false ? '' : ' raised';
  const sheet = `<rect class="sa" x="0.5" y="0.5" width="${r2(sp.FA.W-1)}" height="${r2(sp.FA.H-1)}" rx="6"/>`;

  // anything inside a graph in focus is in focus too
  const lit = new Set(Object.keys(focus));
  for (const id of Object.keys(focus)){
    const n = gA.nodes[id];
    if (n && n.k === 'cut') nodesUnder(gA, n.inner).forEach(x => lit.add(x));
  }
  const dimming = lit.size > 0;

  for (const it of sp.nodes){
    if (!it.inA) continue;
    const op = !dimming || lit.has(it.id) ? 1 : 0.3;
    if (it.n.k === 'cut'){
      const mk = focus[it.id] ? ' mk-' + focus[it.id] : '';
      parts.push(`<path class="cut${raised}${shade && it.odd ? ' odd':''}${mk}" opacity="${
        op}" d="${cutPath(it.a.x, it.a.y, it.a.w, it.a.h, it.n.id, wobble, hand)}"/>`);
    } else {
      const mcx = it.a.x + it.a.w/2 + (it.n.hooks.length>1?6:0), mcy = it.a.y + it.a.h/2;
      const mwritten = hand ? writtenName(it.n.name, mcx, mcy, it.n.id) : null;
      parts.push(`<g class="spot" opacity="${op}">`+
        (mwritten || (`<text x="${r2(mcx)}" y="${r2(mcy)}" `+
        `dominant-baseline="central" text-anchor="middle">${esc(it.n.name)}</text>`))+'</g>');
      if (opts.hookNumbers !== false && it.n.hooks.length > 1)
        parts.push(hookNumerals(it, 0, sp));
    }
  }
  // the lines, as they stand
  const chainsA = lineChains(gA, GA.pos);
  const polysA = chainsA.map(ch => dedupePts(elbowPoints(ch, GA.pos)));
  const hopsA = crossingHops(polysA, chainsA.map(ch => sp.rankOf(ch[0])));
  polysA.forEach((pts,i) => {
    const d = roundedPath(pts, 5, hopsA[i]);
    if (d) parts.push(`<path class="loi${sp.lcOf(chainsA[i][0])}" opacity="${
      dimming ? 0.5 : 1}" d="${d}"/>`);
  });
  for (const b of sp.bare){
    if (!b.inA) continue;
    const p = GA.pos[b.l]; if (!p) continue;
    parts.push(`<path class="loi${sp.lcOf(b.l)}" opacity="${dimming ? 0.5 : 1}" d="M ${
      r2(p.x)} ${r2(p.y)} L ${r2(p.x + LAY.bareW)} ${r2(p.y)}"/>`);
  }

  // an arrow from the graph being copied to the area it is going into
  if (mv && mv.op === 'iterate'){
    const from = GA.P[mv.node];
    const cut = gA.areas[mv.target] && gA.areas[mv.target].cut;
    const to = cut ? GA.P[cut] : GA.P[gA.root] || null;
    if (from && to) parts.push(arrowPath(from, to));
  }
  return { svg: sheet + `<g class="gr" transform="translate(${r2(sp.FA.dx)},${r2(sp.FA.dy)})">` +
                parts.join('\n') + '</g>', W: sp.FA.W, H: sp.FA.H };
}
function arrowPath(a, b){
  const x1 = a.x + a.w/2, y1 = a.y + a.h/2;
  const x2 = b.x + b.w/2, y2 = b.y + b.h/2;
  const dx = x2-x1, dy = y2-y1, len = Math.hypot(dx,dy) || 1;
  if (len < 18) return '';
  // pull the ends clear of both boxes and bow the line a little
  const t0 = Math.min(0.42, (Math.max(a.w,a.h)/2 + 8) / len);
  const t1 = 1 - Math.min(0.42, (Math.max(b.w,b.h)/2 + 8) / len);
  if (t1 <= t0) return '';
  const p0 = { x: x1 + dx*t0, y: y1 + dy*t0 };
  const p1 = { x: x1 + dx*t1, y: y1 + dy*t1 };
  const mx = (p0.x+p1.x)/2 - dy*0.16, my = (p0.y+p1.y)/2 + dx*0.16;
  const ang = Math.atan2(p1.y-my, p1.x-mx), h = 7;
  const head = [
    [p1.x, p1.y],
    [p1.x - h*Math.cos(ang-0.42), p1.y - h*Math.sin(ang-0.42)],
    [p1.x - h*Math.cos(ang+0.42), p1.y - h*Math.sin(ang+0.42)]
  ].map(p => r2(p[0])+','+r2(p[1])).join(' ');
  return `<path class="telegraph" d="M ${r2(p0.x)} ${r2(p0.y)} Q ${r2(mx)} ${r2(my)} ${
    r2(p1.x)} ${r2(p1.y)}"/><polygon class="telegraph-head" points="${head}"/>`;
}

/* ---- the player ---------------------------------------------------------- */
function svgWrap(inner, w, h, scale, pad, hand){
  pad = pad || 12;
  return `<svg class="eg${hand ? ' hand' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w+2*pad} ${h+2*pad}" `+
         `width="${(w+2*pad)*scale}" height="${(h+2*pad)*scale}">${inner}</svg>`;
}

/* Plays gA -> gB inside `el`. Returns a handle with .cancel(). */
function playTransition(el, gA, gB, mv, opts, done){
  opts = opts || {};
  const GA = geom(gA, opts), GB = geom(gB, opts);
  const pad = 12;
  const availW = Math.max(80, el.clientWidth - 34), availH = opts.maxH || 420;
  // the same formula stageSvg uses, so a frame of the transition is the same
  // size as the still drawing on either side of it
  const scaleFor = (W, H) => Math.min(availW/(W+2*pad), availH/(H+2*pad), 2.4);

  const markMs = opts.markMs === undefined ? 700 : opts.markMs;
  let moveMs = opts.moveMs === undefined ? 720 : opts.moveMs;
  let raf = 0, timer = 0, cancelled = false;
  const sp = prepareTween(gA, gB, GA, GB, opts);
  // a staged step is three beats rather than one, so it is given the room
  if (sp.sched && sp.sched.pulse && sp.addBox) moveMs = Math.round(moveMs * 1.5);

  // beat one: mark what the rule is about to act on
  const focus = moveFocus(gA, mv);
  const f0 = markFrame(sp, focus, mv);
  el.innerHTML = svgWrap(f0.svg, f0.W, f0.H, scaleFor(f0.W, f0.H), pad, opts.hand);
  markNodes(el, gA, GA, focus);

  timer = setTimeout(() => {
    if (cancelled) return;
    const t0 = performance.now();
    const tick = now => {
      if (cancelled) return;
      const t = Math.min(1, (now - t0) / moveMs);
      const f = tweenFrame(sp, t);
      el.innerHTML = svgWrap(f.svg, f.W, f.H, scaleFor(f.W, f.H), pad, opts.hand);
      if (t < 1) raf = requestAnimationFrame(tick);
      else if (done) done();
    };
    raf = requestAnimationFrame(tick);
  }, markMs);

  // how long this step runs, so a player can wait for it rather than guess
  return { total: markMs + moveMs,
           cancel(){ cancelled = true; cancelAnimationFrame(raf); clearTimeout(timer); } };
}

// An overlay ring around the graphs the rule is about to act on.
function markNodes(el, g, G, focus){
  const svg = el.querySelector('svg');
  if (!svg) return;
  const host = svg.querySelector('g.gr') || svg;
  const ns = 'http://www.w3.org/2000/svg';
  for (const id of Object.keys(focus)){
    const kind = focus[id];
    const p = G.P[id];
    if (p){
      const m = 4;
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', p.x - m); r.setAttribute('y', p.y - m);
      r.setAttribute('width', p.w + 2*m); r.setAttribute('height', p.h + 2*m);
      r.setAttribute('rx', 10);
      r.setAttribute('class', 'focus focus-' + kind);
      host.appendChild(r);
      continue;
    }
    const q = G.pos && G.pos[id];        // a point of a line of identity
    if (!q) continue;
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', q.x); c.setAttribute('cy', q.y); c.setAttribute('r', 7);
    c.setAttribute('class', 'focus focus-' + kind);
    host.appendChild(c);
  }
}

/* ============================================================================
   ALIGNING TWO GRAPHS THAT SHARE NO HISTORY.
   Within a proof a transformation carries identifiers across, so a node can be
   followed from step to step. Two graphs compiled from two different formulas
   have no such connection, and would simply cross-fade. Matching them up by
   shape first — same enclosure in the same place, same spot with the same name
   — lets the parts they have in common move rather than blink.
   ========================================================================== */
function alignGraph(gA, gB){
  const ligA = ligIndex(gA), ligB = ligIndex(gB);
  const node = {}, area = {}, ln = {};
  area[gB.root] = gA.root;

  /* How much of one area is found again in another: the number of its graphs
     that have an exact counterpart there. Used to decide whether a lone cut is
     a cut that has been drawn round everything, or a cut that has moved. */
  const overlap = (areaA, areaB) => {
    const taken = new Set();
    let n = 0;
    for (const b of gB.areas[areaB].items){
      const cb = canonNode(gB, b, ligB);
      const a = gA.areas[areaA].items.find(x => !taken.has(x) && canonNode(gA, x, ligA) === cb);
      if (a){ taken.add(a); n++; }
    }
    return n;
  };

  (function matchArea(aA, aB){
    /* A cut drawn round the whole of an area, or taken off it, used to be
       matched against whatever single cut already stood there: the old cut
       became the new outer one and everything else was carried inside it, so
       that scribing one cut round "P and not P" appeared to move the graphs
       about instead of simply enclosing them. Where a lone cut is better
       accounted for as newly drawn, the comparison goes on beneath it. This
       changes only which items are compared, never which area is which, so the
       sheet stays the sheet. */
    // the chain of areas reached by going in through one lone cut after another
    const chain = (g, a) => {
      const out = [a];
      while (true){
        const it = g.areas[out[out.length-1]].items;
        if (it.length !== 1 || g.nodes[it[0]].k !== 'cut') break;
        out.push(g.nodes[it[0]].inner);
        if (out.length > 8) break;
      }
      return out;
    };
    let effA = aA, effB = aB, best = overlap(aA, aB);
    for (const d of chain(gB, aB).slice(1)){
      const v = overlap(aA, d);
      if (v > best){ best = v; effB = d; }
    }
    if (effB === aB)
      for (const d of chain(gA, aA).slice(1)){
        const v = overlap(d, aB);
        if (v > best){ best = v; effA = d; }
      }

    const itemsA = gA.areas[effA].items, itemsB = gB.areas[effB].items;
    const used = new Set();
    const take = (a, b) => {
      node[b] = a; used.add(a);
      const nA = gA.nodes[a], nB = gB.nodes[b];
      if (nB.k === 'cut'){ area[nB.inner] = nA.inner; matchArea(nA.inner, nB.inner); }
      else nB.hooks.forEach((h,i) => { if (nA.hooks[i]) ln[h] = nA.hooks[i]; });
    };
    for (const b of itemsB){                         // exactly the same subgraph
      const cb = canonNode(gB, b, ligB);
      const a = itemsA.find(x => !used.has(x) && canonNode(gA, x, ligA) === cb);
      if (a) take(a, b);
    }
    for (const b of itemsB){                         // failing that, the same kind
      if (node[b]) continue;
      const nB = gB.nodes[b];
      const a = itemsA.find(x => !used.has(x) && gA.nodes[x].k === nB.k &&
        (nB.k !== 'spot' || gA.nodes[x].name === nB.name));
      if (a) take(a, b);
    }
  })(gA.root, gB.root);

  // Everything else in B gets an identifier of its own. It must come from the
  // global counter: a counter starting at zero here would mint 'z1' again on
  // the next call, and the graph being aligned to already carries the 'z1' of
  // the call before, so one node would silently overwrite another.
  const fresh = () => uid('z');
  const nid = x => node[x] || (node[x] = fresh());
  const aid = x => area[x] || (area[x] = fresh());
  const lid = x => ln[x]   || (ln[x]   = fresh());

  const h = { areas:{}, nodes:{}, lns:{}, edges:{}, root: gA.root };
  for (const a of Object.keys(gB.areas)){
    const A = gB.areas[a];
    h.areas[aid(a)] = { id: aid(a), cut: A.cut ? nid(A.cut) : null,
      items: A.items.map(nid), lns: A.lns.map(lid) };
  }
  for (const x of Object.keys(gB.nodes)){
    const n = gB.nodes[x];
    h.nodes[nid(x)] = n.k === 'cut'
      ? { k:'cut', id: nid(x), area: aid(n.area), inner: aid(n.inner),
          scroll: n.scroll ? nid(n.scroll) : undefined }
      : { k:'spot', id: nid(x), area: aid(n.area), name: n.name, hooks: n.hooks.map(lid) };
  }
  for (const x of Object.keys(gB.lns))
    h.lns[lid(x)] = { id: lid(x), area: aid(gB.lns[x].area) };
  let e = 0;
  for (const x of Object.keys(gB.edges)){
    const E = gB.edges[x];
    const id = 'ze' + (++e);
    h.edges[id] = { id, a: lid(E.a), b: lid(E.b) };
  }
  return h;
}
