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

  const LNB = laneMap(gB), LNA = laneMap(gA);
  const colour = opts.colourLines && Math.max(LNA.count, LNB.count) > 1;
  const lcOf = ln => {
    if (!colour) return '';
    const L = LNB.lig[ln] !== undefined ? LNB : LNA;
    return ' lc' + (L.rank[L.lig[ln]] % 7);
  };
  return { gA, gB, GA, GB, nodes, chains, bare, opts, lcOf,
           W: Math.max(GA.W, GB.W), H: Math.max(GA.H, GB.H) };
}

function tweenFrame(sp, t){
  const { GA, GB, opts } = sp;
  const parts = [];
  const shade = opts.shade, wobble = opts.wobble !== false;
  const outT = Math.min(1, t / 0.45);            // what goes, goes early
  const inT  = Math.max(0, (t - 0.18) / 0.82);   // what comes, arrives visibly
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
  return parts.join('\n');
}
function shrink(b){ return { x: b.x + b.w/2 - 2, y: b.y + b.h/2 - 2, w: 4, h: 4 }; }

/* The first beat: the graph as it stands, with everything but the graphs the
   rule is about to act on held back, a ghost of whatever is about to be
   scribed shown where it will appear, and an arrow from a graph to the area it
   is about to be copied into. The point is to let the eye find the place
   before anything moves. */
function markFrame(sp, focus, mv){
  const { gA, GA, opts } = sp;
  const parts = [];
  const shade = opts.shade, wobble = opts.wobble !== false;
  const raised = opts.raised === false ? '' : ' raised';
  parts.push(`<rect class="sa" x="0.5" y="0.5" width="${sp.W-1}" height="${sp.H-1}" rx="6"/>`);

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
      parts.push(`<path class="cut${raised}${shade && it.odd ? ' odd':''}" opacity="${op}" d="${
        cutPath(it.a.x, it.a.y, it.a.w, it.a.h, it.n.id, wobble)}"/>`);
    } else {
      parts.push(`<g class="spot" opacity="${op}"><text x="${
        r2(it.a.x + it.a.w/2 + (it.n.hooks.length>1?6:0))}" y="${r2(it.a.y + it.a.h/2)}" `+
        `dominant-baseline="central" text-anchor="middle">${esc(it.n.name)}</text></g>`);
    }
  }
  // the lines, as they stand
  const chainsA = lineChains(gA, GA.pos);
  const polysA = chainsA.map(ch => dedupePts(elbowPoints(ch, GA.pos)));
  const hopsA = crossingHops(polysA);
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
  return parts.join('\n');
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
  const focus = moveFocus(gA, mv);
  el.innerHTML = svgWrap(markFrame(sp, focus, mv), W, H, scale, pad);
  markNodes(el, gA, GA, focus);

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

  (function matchArea(aA, aB){
    const itemsA = gA.areas[aA].items, itemsB = gB.areas[aB].items;
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
