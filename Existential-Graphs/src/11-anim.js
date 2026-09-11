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
    case 'dcOut':     f[mv.cut] = 'del'; break;
    case 'join': case 'eraseEdge': case 'addLine': case 'delLine':
    case 'branch': case 'extend': case 'retract': break;
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
    return { id, n, a, b, inA, inB,
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

  return { gA, gB, GA, GB, nodes, chains, bare, opts,
           W: Math.max(GA.W, GB.W), H: Math.max(GA.H, GB.H) };
}

function tweenFrame(sp, t){
  const { GA, GB, opts } = sp;
  const parts = [];
  const shade = opts.shade, wobble = opts.wobble !== false;
  const outT = Math.min(1, t / 0.45);            // what goes, goes early
  const inT  = Math.max(0, (t - 0.5) / 0.5);     // what comes, comes late
  const e = EASE(t);

  const raised = opts.raised === false ? '' : ' raised';
  parts.push(`<rect class="sa" x="0.5" y="0.5" width="${sp.W-1}" height="${sp.H-1}" rx="6"/>`);

  for (const it of sp.nodes){
    const op = it.inA && it.inB ? 1 : it.inB ? inT : 1 - outT;
    if (op <= 0.01) continue;
    const x = lerp(it.a.x, it.b.x, e), y = lerp(it.a.y, it.b.y, e);
    const w = lerp(it.a.w, it.b.w, e), h = lerp(it.a.h, it.b.h, e);
    if (it.n.k === 'cut'){
      parts.push(`<path class="cut${raised}${shade && it.odd ? ' odd':''}" opacity="${r2(op)}" d="${
        cutPath(x, y, w, h, it.n.id, wobble)}"/>`);
    } else {
      parts.push(`<g class="spot" opacity="${r2(op)}"><text x="${
        r2(x + w/2 + (it.n.hooks.length>1?6:0))}" y="${r2(y + h/2)}" `+
        `dominant-baseline="central" text-anchor="middle">${esc(it.n.name)}</text></g>`);
    }
  }

  // one interpolated position for every point of every line
  const POS = {};
  for (const ln of new Set([...Object.keys(GA.pos), ...Object.keys(GB.pos)])){
    const a = GA.pos[ln], b = GB.pos[ln];
    POS[ln] = (a && b) ? { x: lerp(a.x,b.x,e), y: lerp(a.y,b.y,e) } : (a || b);
  }
  const live = sp.chains.map(c => ({ c, op: c.gone ? 1-outT : (c.fresh ? inT : 1) }))
                        .filter(x => x.op > 0.01);
  const polys = live.map(x => dedupePts(elbowPoints(x.c.ch, POS)));
  const hops  = crossingHops(polys);
  polys.forEach((pts, i) => {
    const d = roundedPath(pts, 5, hops[i]);
    if (d) parts.push(`<path class="loi" opacity="${r2(live[i].op)}" d="${d}"/>`);
  });
  for (const b of sp.bare){
    const op = b.inA && b.inB ? 1 : b.inB ? inT : 1 - outT;
    if (op <= 0.01) continue;
    const p = POS[b.l]; if (!p) continue;
    parts.push(`<path class="loi" opacity="${r2(op)}" d="M ${r2(p.x)} ${r2(p.y)} L ${
      r2(p.x + LAY.bareW)} ${r2(p.y)}"/>`);
  }
  return parts.join('\n');
}
function shrink(b){ return { x: b.x + b.w/2 - 2, y: b.y + b.h/2 - 2, w: 4, h: 4 }; }

/* ---- the player ---------------------------------------------------------- */
function svgWrap(inner, w, h, scale, pad){
  pad = pad || 12;
  return `<svg class="eg" xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w+2*pad} ${h+2*pad}" `+
         `width="${(w+2*pad)*scale}" height="${(h+2*pad)*scale}">${inner}</svg>`;
}

/* Plays gA -> gB inside `el`. Returns a handle with .cancel(). */
function playTransition(el, gA, gB, mv, opts, done){
  opts = opts || {};
  const GA = geom(gA, opts), GB = geom(gB, opts);
  const W = Math.max(GA.W, GB.W), H = Math.max(GA.H, GB.H);
  const pad = 12;
  const availW = Math.max(80, el.clientWidth - 34), availH = opts.maxH || 420;
  const scale = Math.min(availW/(W+2*pad), availH/(H+2*pad), 2.4);

  const markMs = opts.markMs === undefined ? 700 : opts.markMs;
  const moveMs = opts.moveMs === undefined ? 720 : opts.moveMs;
  let raf = 0, timer = 0, cancelled = false;
  const sp = prepareTween(gA, gB, GA, GB, opts);

  // beat one: mark what the rule is about to act on
  el.innerHTML = svgWrap(tweenFrame(sp, 0), W, H, scale, pad);
  markNodes(el, gA, GA, moveFocus(gA, mv));

  timer = setTimeout(() => {
    if (cancelled) return;
    const t0 = performance.now();
    const tick = now => {
      if (cancelled) return;
      const t = Math.min(1, (now - t0) / moveMs);
      el.innerHTML = svgWrap(tweenFrame(sp, t), W, H, scale, pad);
      if (t < 1) raf = requestAnimationFrame(tick);
      else if (done) done();
    };
    raf = requestAnimationFrame(tick);
  }, markMs);

  return { cancel(){ cancelled = true; cancelAnimationFrame(raf); clearTimeout(timer); } };
}

// An overlay ring around the graphs the rule is about to act on.
function markNodes(el, g, G, focus){
  const svg = el.querySelector('svg');
  if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  for (const id of Object.keys(focus)){
    const p = G.P[id]; if (!p) continue;
    const kind = focus[id];
    const r = document.createElementNS(ns, 'rect');
    const m = 4;
    r.setAttribute('x', p.x - m); r.setAttribute('y', p.y - m);
    r.setAttribute('width', p.w + 2*m); r.setAttribute('height', p.h + 2*m);
    r.setAttribute('rx', 10);
    r.setAttribute('class', 'focus focus-' + kind);
    svg.appendChild(r);
  }
}
