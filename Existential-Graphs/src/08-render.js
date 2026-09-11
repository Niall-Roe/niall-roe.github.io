/* ============================================================================
   LAYOUT AND RENDERING.
   Cuts nest as closed curves; graphs on one area are stacked, juxtaposition
   being conjunction (C3). Every area keeps a left margin in which the points
   of its lines of identity sit, so a ligature runs down the inside of the
   enclosures it occupies and reaches rightwards to each hook — the shape of
   Peirce's own drawings (Roberts, Figs. 6-9, p. 51).
   ========================================================================== */

const LAY = {
  padX: 16, padY: 12,       // inside a cut
  leftM: 20,                // left margin of an area, where the lines run
  gap: 9,                   // between graphs on one area
  spotH: 22, spotPadX: 9,
  charW: 7.1, minSpotW: 26,
  hookGap: 11,
  bareW: 26, bareH: 16,
  laneW: 9
};

function textWidth(s){ return Math.max(LAY.minSpotW, s.length * LAY.charW + 2*LAY.spotPadX); }

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
  return { lanes, lig, hooks };
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
      bw = textWidth(n.name);
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
  const lm = nLanes ? 8 + nLanes * LAY.laneW + 6 : LAY.padX;
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

/* ---- hook points --------------------------------------------------------- */
function hookPoints(g, spotId, P){
  const n = g.nodes[spotId], p = P[spotId];
  const k = n.hooks.length, out = {};
  if (!k) return out;
  const span = (k-1) * LAY.hookGap;
  let y0 = p.y + p.h/2 - span/2;
  n.hooks.forEach((h,i) => out[h] = { x: p.x, y: y0 + i*LAY.hookGap, i });
  return out;
}

/* ---- positions for the points of the lines of identity ------------------- */
function placeLines(g, P, LN){
  const pos = {}, fixed = {};
  for (const n of Object.values(g.nodes)){
    if (n.k !== 'spot') continue;
    const hp = hookPoints(g, n.id, P);
    for (const h in hp){ pos[h] = { x: hp[h].x, y: hp[h].y }; fixed[h] = true; }
  }
  // spine points sit in their own area's margin, each ligature in its own lane
  for (const l of Object.values(g.lns)){
    if (fixed[l.id]) continue;
    const a = P[l.area];
    const lane = LN ? (LN.lanes[l.area][LN.lig[l.id]] || 0) : 0;
    pos[l.id] = { x: a.x + 8 + lane * LAY.laneW, y: a.y + a.h/2 };
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

/* ---- the renderer -------------------------------------------------------- */
function renderGraph(g, opts){
  opts = opts || {};
  const M = {}, P = {};
  const LN = laneMap(g);
  measure(g, g.root, M, opts.maxRow, LN);
  place(g, g.root, 0, 0, M, P);
  const pos = placeLines(g, P, LN);
  const W = M[g.root].w, H = M[g.root].h;
  const parts = [];
  const shade = opts.shade;
  const wobble = opts.wobble !== false;
  const hl = opts.highlight || {};      // {nodeId:'add'|'del'|'move'}

  // the sheet of assertion
  parts.push(`<rect class="sa" x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="6"/>`);

  function drawArea(areaId){
    for (const id of g.areas[areaId].items){
      const n = g.nodes[id], p = P[id];
      const mark = hl[id] ? ' hl-'+hl[id] : '';
      if (n.k === 'cut'){
        const d = depthOf(g, n.inner);
        parts.push(`<path class="cut${mark}${shade && d%2===1 ? ' odd':''}" d="${
          cutPath(p.x, p.y, p.w, p.h, n.id, wobble)}" data-node="${n.id}" data-area="${n.inner}"/>`);
        drawArea(n.inner);
      } else {
        parts.push(`<g class="spot${mark}" data-node="${n.id}">`+
          `<rect class="spotbg" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="5"/>`+
          `<text x="${p.x + p.w/2}" y="${p.y + p.h/2}" dominant-baseline="central" text-anchor="middle">${
            esc(n.name)}</text></g>`);
      }
    }
  }
  drawArea(g.root);

  // lines of identity, drawn heavy (C6-C8)
  const segs = [];
  for (const e of Object.values(g.edges)){
    const a = pos[e.a], b = pos[e.b];
    if (!a || !b) continue;
    segs.push({ e, a, b });
  }
  for (const s of segs){
    const {a, b} = s;
    let d;
    if (Math.abs(a.y - b.y) < 1.5) d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    else if (Math.abs(a.x - b.x) < 1.5) d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    else {
      // an elbow: run out to the shared margin, then across
      const mx = Math.min(a.x, b.x);
      d = `M ${a.x} ${a.y} L ${mx+0.01} ${a.y} Q ${mx} ${a.y} ${mx} ${a.y + Math.sign(b.y-a.y)*3}`+
          ` L ${mx} ${b.y - Math.sign(b.y-a.y)*3} Q ${mx} ${b.y} ${mx+3} ${b.y} L ${b.x} ${b.y}`;
    }
    parts.push(`<path class="loi" d="${d}" data-edge="${s.e.id}"/>`);
  }
  // a ligature with a single point and no edge is the bare line of C6
  for (const l of Object.values(g.lns)){
    if (neighbours(g, l.id).length) continue;
    const isHook = Object.values(g.nodes).some(n => n.k==='spot' && n.hooks.includes(l.id));
    if (isHook) continue;
    const p = pos[l.id];
    parts.push(`<path class="loi" d="M ${p.x} ${p.y} L ${p.x + LAY.bareW} ${p.y}" data-ln="${l.id}"/>`);
  }
  // branch points
  for (const l of Object.values(g.lns)){
    if (neighbours(g, l.id).length >= 3){
      const p = pos[l.id];
      parts.push(`<circle class="branch" cx="${p.x}" cy="${p.y}" r="2.6"/>`);
    }
  }
  // hook numerals, so the order of a spot's hooks can be read off
  if (opts.hookNumbers !== false)
  for (const n of Object.values(g.nodes)){
    if (n.k !== 'spot' || n.hooks.length < 2) continue;
    const hp = hookPoints(g, n.id, P);
    n.hooks.forEach((h,i) => {
      const q = hp[h];
      parts.push(`<text class="hooknum" x="${q.x+5}" y="${q.y-4}">${i+1}</text>`);
    });
  }

  // small grips on the points of the lines, for the editor
  if (opts.handles)
    for (const l of Object.values(g.lns)){
      const p = pos[l.id]; if (!p) continue;
      parts.push(`<circle class="handle" cx="${p.x}" cy="${p.y}" r="3.6" data-ln="${l.id}"/>`);
    }

  return { svg: parts.join('\n'), w: W, h: H, P, pos, M };
}

function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function svgDoc(g, opts){
  opts = opts || {};
  const r = renderGraph(g, opts);
  const pad = opts.pad || 10;
  return `<svg class="eg" xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${r.w+2*pad} ${r.h+2*pad}" `+
         `width="${(r.w+2*pad)*(opts.scale||1)}" height="${(r.h+2*pad)*(opts.scale||1)}">${r.svg}</svg>`;
}
