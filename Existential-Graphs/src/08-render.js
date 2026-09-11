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
  bareW: 26, bareH: 16,
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
function cutPath(x, y, w, h, seed, wobble){
  const r = Math.min(22, h/2, w/2);
  if (!wobble) return roundRect(x,y,w,h,r);
  const rnd = seededRand(seed);
  const j = () => (rnd() - 0.5) * 2.4;
  const x0=x+j(), y0=y+j(), x1=x+w+j(), y1=y+h+j();
  return `M ${x0+r} ${y0}
    L ${x1-r+j()} ${y0+j()} Q ${x1} ${y0} ${x1+j()} ${y0+r}
    L ${x1+j()} ${y1-r+j()} Q ${x1} ${y1} ${x1-r+j()} ${y1}
    L ${x0+r+j()} ${y1+j()} Q ${x0} ${y1} ${x0+j()} ${y1-r}
    L ${x0+j()} ${y0+r+j()} Q ${x0} ${y0} ${x0+r} ${y0} Z`;
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
  for (let i = 1; i < n-1; i++){
    const d1 = dist(P[i-1], P[i]), d2 = dist(P[i], P[i+1]);
    const r = Math.min(maxR, d1/2, d2/2);
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
function runWithHops(A, B, xs){
  if (!xs || !xs.length || Math.abs(A.y - B.y) > 0.5) return ` L ${r2(B.x)} ${r2(B.y)}`;
  const fwd = B.x > A.x;
  const lo = Math.min(A.x, B.x) + HOPR + 1, hi = Math.max(A.x, B.x) - HOPR - 1;
  const use = xs.filter(x => x > lo && x < hi).sort((p,q) => fwd ? p-q : q-p);
  let d = '';
  for (const x of use){
    const x1 = fwd ? x - HOPR : x + HOPR, x2 = fwd ? x + HOPR : x - HOPR;
    d += ` L ${r2(x1)} ${r2(A.y)} A ${HOPR} ${HOPR} 0 0 ${fwd ? 1 : 0} ${r2(x2)} ${r2(A.y)}`;
  }
  return d + ` L ${r2(B.x)} ${r2(B.y)}`;
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
function crossingHops(polys){
  const hops = polys.map(p => p.map(() => []));
  for (let i = 0; i < polys.length; i++){
    const P = dedupePts(polys[i]);
    for (let si = 0; si < P.length-1; si++){
      const a = P[si], b = P[si+1];
      if (Math.abs(a.y - b.y) > 0.5) continue;            // not horizontal
      const xlo = Math.min(a.x,b.x), xhi = Math.max(a.x,b.x);
      for (let j = 0; j < polys.length; j++){
        if (j === i) continue;
        const Q = dedupePts(polys[j]);
        for (let sj = 0; sj < Q.length-1; sj++){
          const c = Q[sj], e = Q[sj+1];
          if (Math.abs(c.x - e.x) > 0.5) continue;        // not vertical
          const ylo = Math.min(c.y,e.y), yhi = Math.max(c.y,e.y);
          if (c.x > xlo + 2 && c.x < xhi - 2 && a.y > ylo + 2 && a.y < yhi - 2)
            hops[i][si].push(c.x);
        }
      }
    }
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
  const hl = opts.highlight || {};      // {nodeId:'add'|'del'|'move'}

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
        parts.push(`<path class="cut${mark}${raised}${shade && d%2===1 ? ' odd':''}" d="${
          cutPath(p.x, p.y, p.w, p.h, n.id, wobble)}" data-node="${n.id}" data-area="${n.inner}"/>`);
        drawArea(n.inner);
      } else {
        parts.push(`<g class="spot${mark}" data-node="${n.id}">`+
          `<rect class="spotbg" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="5"/>`+
          `<text x="${p.x + p.w/2 + (n.hooks.length > 1 ? 6 : 0)}" y="${p.y + p.h/2}" `+
          `dominant-baseline="central" text-anchor="middle">${esc(n.name)}</text></g>`);
      }
    }
  }
  drawArea(g.root);

  // lines of identity, drawn heavy (C6-C8). A ligature is drawn as whole
  // chains rather than edge by edge: a line is one graph (C7), and drawing it
  // in pieces leaves the round ends of each piece stacked at every junction.
  const colour = opts.colourLines && LN.count > 1;
  const lc = ln => colour ? ' lc' + (LN.rank[LN.lig[ln]] % 7) : '';
  const chains = lineChains(g, pos);
  const polys  = chains.map(ch => dedupePts(elbowPoints(ch, pos)));
  const hops   = crossingHops(polys);
  polys.forEach((pts, i) => {
    const d = roundedPath(pts, 5, hops[i]);
    if (d) parts.push(`<path class="loi${lc(chains[i][0])}" d="${d}" data-chain="${chains[i].join(',')}"/>`);
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
  // hook numerals, so the order of a spot's hooks can be read off
  if (opts.hookNumbers !== false)
  for (const n of Object.values(g.nodes)){
    if (n.k !== 'spot' || n.hooks.length < 2) continue;
    const hp = hookPoints(g, n.id, P, LN);
    n.hooks.forEach(h => {
      const q = hp[h];
      parts.push(`<text class="hooknum" x="${q.x+6}" y="${q.y-4}">${q.i+1}</text>`);
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
  return `<svg class="eg" xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${r.w+2*pad} ${r.h+2*pad}" `+
         `width="${(r.w+2*pad)*(opts.scale||1)}" height="${(r.h+2*pad)*(opts.scale||1)}">${r.svg}</svg>`;
}
