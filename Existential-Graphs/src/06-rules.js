/* ============================================================================
   THE RULES OF TRANSFORMATION  (Roberts, Appendix 3; §3.2 and §4.2)

   R1  erasure     Any evenly enclosed graph and any evenly enclosed portion of
                   a line of identity may be erased.
   R2  insertion   Any graph may be scribed on any oddly enclosed area, and two
                   lines of identity oddly enclosed on the same area may be
                   joined.
   R3  iteration   If a graph P occurs on SA or in a nest of cuts, it may be
                   scribed on any area not part of P which is contained by {P}.
   R4  deiteration Any graph whose occurrence could be the result of iteration
                   may be erased.
   R5  double cut drawn    The double cut may be drawn round any graph on any
                   area; ligatures may pass through it.
   R6  double cut removed  And it may be taken off wherever two cuts stand one
                   immediately inside the other with nothing between them.
                   Roberts counts these two as one rule read both ways.
   ========================================================================== */

const RULE_NAME = {
  R1:'R1 erasure', R1L:'R1 erasure (line)',
  R2:'R2 insertion', R2J:'R2 insertion (join)',
  R3:'R3 iteration', R4:'R4 deiteration',
  R5in:'R5 double cut, drawn', R5out:'R6 double cut, removed'
};

/* --- ligature labelling, for structural comparison ------------------------ */
function ligIndex(g){
  const comps = ligatures(g), map = {};
  comps.forEach((c,i) => c.forEach(l => map[l] = i));
  return map;
}
// Canonical string for a node. Two nodes with the same canon are the same
// graph — and, in Beta, their lines join the corresponding hooks (Roberts p.57).
function canonNode(g, id, lig){
  const n = g.nodes[id];
  if (n.k === 'spot') return 'S:' + n.name + '[' + n.hooks.map(h => lig[h]).join(',') + ']';
  return 'C{' + canonAreaBody(g, n.inner, lig) + '}';
}
function canonAreaBody(g, areaId, lig){
  const parts = g.areas[areaId].items.map(i => canonNode(g, i, lig)).sort();
  const here = new Set(g.areas[areaId].lns);
  const es = [];
  for (const e of Object.values(g.edges))
    if (here.has(e.a) && here.has(e.b)) es.push([lig[e.a], lig[e.b]].sort().join('~'));
  const bare = g.areas[areaId].lns.map(l => lig[l]).sort();
  return parts.join('|') + ';' + es.sort().join(',') + ';' + bare.join(',');
}
/* Ligatures have to be labelled canonically, or else two drawings of the very
   same graph would compare as different merely because their lines were made
   in a different order. Components are first sorted by an invariant — where
   their points lie, and which hooks of which spots they occupy — and any that
   tie are settled by trying the orderings and keeping the least. */
function ligInvariant(h, comp){
  const hookOf = {};
  for (const n of Object.values(h.nodes))
    if (n.k === 'spot') n.hooks.forEach((x,i) => hookOf[x] = n.name+'#'+i);
  const marks = comp.map(l => (hookOf[l] || '*') + '@' + depthOf(h, h.lns[l].area)).sort();
  return marks.join(',') + '|' + comp.length;
}
function canonGraph(g){
  const h = normalizeLines(cloneGraph(g));
  const comps = ligatures(h);
  if (!comps.length) return canonAreaBody(h, h.root, {});
  const tagged = comps.map(c => ({ c, inv: ligInvariant(h, c) }));
  tagged.sort((a,b) => a.inv < b.inv ? -1 : a.inv > b.inv ? 1 : 0);
  // tie groups
  const groups = [];
  for (const t of tagged){
    const g0 = groups[groups.length-1];
    if (g0 && g0[0].inv === t.inv) g0.push(t); else groups.push([t]);
  }
  const orderings = [[]];
  let blown = false;
  for (const grp of groups){
    if (grp.length > 4){ blown = true; }
    const perms = blown ? [grp] : permute(grp);
    const next = [];
    for (const base of orderings) for (const p of perms) next.push(base.concat(p));
    if (next.length > 120){ orderings.length = 0; orderings.push(next[0]); blown = true; }
    else { orderings.length = 0; orderings.push(...next); }
  }
  let best = null;
  for (const ord of orderings){
    const lig = {};
    ord.forEach((t,i) => t.c.forEach(l => lig[l] = i));
    const s = canonAreaBody(h, h.root, lig);
    if (best === null || s < best) best = s;
  }
  return best;
}
function permute(xs){
  if (xs.length <= 1) return [xs.slice()];
  const out = [];
  for (let i=0;i<xs.length;i++){
    const rest = xs.slice(0,i).concat(xs.slice(i+1));
    for (const p of permute(rest)) out.push([xs[i]].concat(p));
  }
  return out;
}

/* A point in the middle of a line of identity is not a separate thing: the line
   is one graph, however many points we happen to have marked on it (C7). So
   before comparing two graphs we drop the points that merely mark a passage
   along a line, keeping every loose end, every branch, and every point whose
   removal would take the line out of an area it occupies. */
function normalizeLines(g){
  const hooks = new Set();
  for (const n of Object.values(g.nodes))
    if (n.k === 'spot') n.hooks.forEach(h => hooks.add(h));
  let changed = true;
  while (changed){
    changed = false;
    for (const id of Object.keys(g.lns)){
      if (hooks.has(id)) continue;
      const nb = neighbours(g, id);
      if (nb.length !== 2) continue;
      const A = g.lns[id].area;
      const [u, v] = nb;
      const au = g.lns[u].area, av = g.lns[v].area;
      // keep the point unless the line still occupies A without it
      if (au !== A && av !== A) continue;
      // the edge that replaces it must still join one area to itself or to the
      // area of a cut upon it
      const ok = au === av || placeOf(g, au) === av || placeOf(g, av) === au;
      if (!ok) continue;
      removeLn(g, id);
      addEdge(g, u, v);
      changed = true;
    }
  }
  return g;
}

/* --- copying a subgraph --------------------------------------------------- */
// Thread a line of identity inwards from `fromLn` to `targetArea` (R3(b)).
function threadTo(g, fromLn, targetArea){
  const src = g.lns[fromLn].area;
  if (src === targetArea) return fromLn;
  const path = areaPath(g, targetArea);
  const i = path.indexOf(src);
  if (i < 0) return null;                     // not contained: cannot extend
  let prev = fromLn;
  for (let k = i+1; k < path.length; k++){
    const ln = addLn(g, path[k]);
    addEdge(g, prev, ln);
    prev = ln;
  }
  return prev;
}
// Copy node `id` into `targetArea`. External ligature attachments are re-made
// by extending the same ligature inwards (R3(c)).
function copyNodeInto(g, id, targetArea){
  const srcArea = g.nodes[id].area;
  const inside = new Set();                   // lns belonging to the subgraph
  (function collect(nid){
    const n = g.nodes[nid];
    if (n.k === 'spot') n.hooks.forEach(h => inside.add(h));
    else {
      g.areas[n.inner].lns.forEach(l => inside.add(l));
      g.areas[n.inner].items.forEach(collect);
    }
  })(id);

  const lnMap = {};
  function cp(nid, into){
    const n = g.nodes[nid];
    if (n.k === 'spot'){
      const sid = addSpot(g, into, n.name, n.hooks.length);
      n.hooks.forEach((h,i) => lnMap[h] = g.nodes[sid].hooks[i]);
      return sid;
    }
    const cid = addCut(g, into), ia = g.nodes[cid].inner;
    // a spot's hooks are made by addSpot below; copying them here as well would
    // leave stray points on the line
    const hookHere = new Set();
    for (const ch of g.areas[n.inner].items)
      if (g.nodes[ch].k === 'spot') g.nodes[ch].hooks.forEach(h => hookHere.add(h));
    g.areas[n.inner].lns.forEach(l => { if (!hookHere.has(l)) lnMap[l] = addLn(g, ia); });
    g.areas[n.inner].items.forEach(ch => cp(ch, ia));
    return cid;
  }
  const newId = cp(id, targetArea);

  // internal edges
  for (const e of Object.values(g.edges).slice()){
    if (inside.has(e.a) && inside.has(e.b) && lnMap[e.a] && lnMap[e.b])
      addEdge(g, lnMap[e.a], lnMap[e.b]);
  }
  // edges leaving the subgraph: rejoin the copy to the very same ligature
  for (const e of Object.values(g.edges).slice()){
    let inn = null, out = null;
    if (inside.has(e.a) && !inside.has(e.b)){ inn = e.a; out = e.b; }
    else if (inside.has(e.b) && !inside.has(e.a)){ inn = e.b; out = e.a; }
    if (inn === null || !lnMap[inn]) continue;
    const anchor = threadTo(g, out, g.lns[lnMap[inn]].area);
    if (anchor !== null) addEdge(g, anchor, lnMap[inn]);
  }
  return newId;
}

/* --- enumerating the legal moves ------------------------------------------
   Erasure and insertion are the only rules whose parity flips when a proof is
   read backwards: what R1 erases from an evenly enclosed area, R2 could have
   scribed on an oddly enclosed one. Iteration/deiteration and the double cut
   are available in both directions, being each other's converse.
   `palette` holds the graphs that may be scribed; in a search it is drawn from
   the premisses and the conclusion. -------------------------------------- */

function legalMoves(g, opts){
  opts = opts || {};
  const dir = opts.dir || 'fwd';
  const fwd = dir === 'fwd';
  const eraseParity  = fwd ? 0 : 1;
  const insertParity = fwd ? 1 : 0;
  const out = [];
  const areasAll = areasUnder(g, g.root);
  const maxNodes = opts.maxNodes || Infinity;
  const size = Object.keys(g.nodes).length;

  /* erasure */
  for (const id of Object.keys(g.nodes))
    if (depthOf(g, g.nodes[id].area) % 2 === eraseParity)
      out.push({ op:'erase', node:id });
  for (const e of Object.values(g.edges)){
    const da = depthOf(g, g.lns[e.a].area), db = depthOf(g, g.lns[e.b].area);
    if (da % 2 === eraseParity && db % 2 === eraseParity)
      out.push({ op:'eraseEdge', edge:e.id });
  }
  /* insertion */
  if (size < maxNodes && opts.palette && opts.palette.length){
    for (const a of areasAll){
      if (depthOf(g, a) % 2 !== insertParity) continue;
      opts.palette.forEach((p,i) => out.push({ op:'insert', area:a, pat:i }));
    }
  }
  for (const a of areasAll){
    if (depthOf(g, a) % 2 !== insertParity) continue;
    const ls = g.areas[a].lns;
    for (let i=0;i<ls.length;i++) for (let j=i+1;j<ls.length;j++){
      if (find2(g, ls[i]) === find2(g, ls[j])) continue;
      out.push({ op:'join', a:ls[i], b:ls[j] });
    }
  }
  /* iteration — both directions */
  if (size < maxNodes)
  for (const id of Object.keys(g.nodes)){
    const n = g.nodes[id];
    const banned = n.k==='cut' ? new Set(areasUnder(g, n.inner)) : new Set();
    for (const b of areasAll){
      if (!contains(g, n.area, b)) continue;
      if (banned.has(b)) continue;
      out.push({ op:'iterate', node:id, target:b });
    }
  }
  /* deiteration — both directions */
  const lig = ligIndex(g);
  const canon = {};
  for (const id of Object.keys(g.nodes)) canon[id] = canonNode(g, id, lig);
  for (const m of Object.keys(g.nodes)){
    for (const n of Object.keys(g.nodes)){
      if (m === n || canon[m] !== canon[n]) continue;
      const N = g.nodes[n];
      if (!contains(g, N.area, g.nodes[m].area)) continue;
      if (N.k === 'cut' && areasUnder(g, N.inner).includes(g.nodes[m].area)) continue;
      out.push({ op:'deiterate', node:m, witness:n });
      break;
    }
  }
  /* lines of identity ------------------------------------------------------
     C6 licenses an unattached line on the sheet of assertion outright; R2
     licenses one on any oddly enclosed area. R3(a),(b) and R4(a),(b) let a
     loose end be branched, extended inwards, retracted or withdrawn. */
  if (opts.beta){
    const isHook = new Set();
    for (const n of Object.values(g.nodes))
      if (n.k==='spot') n.hooks.forEach(h => isHook.add(h));
    const looseEnd = l => !isHook.has(l) && neighbours(g, l).length <= 1;

    if (size < maxNodes){
      for (const a of areasAll)
        if (a === g.root || depthOf(g, a) % 2 === insertParity)
          out.push({ op:'addLine', area:a });
    }
    for (const l of Object.keys(g.lns)){
      const nb = neighbours(g, l);
      const myArea = g.lns[l].area;
      if (nb.length === 0 && !isHook.has(l) &&
          (myArea === g.root || depthOf(g, myArea) % 2 === eraseParity))
        out.push({ op:'delLine', ln:l });
      if (size < maxNodes){
        // R3(a): a branch with a loose end, no cut crossed
        out.push({ op:'branch', ln:l });
        // R3(b): extend a loose end inwards through a cut
        if (looseEnd(l))
          for (const id of g.areas[myArea].items)
            if (g.nodes[id].k === 'cut') out.push({ op:'extend', ln:l, cut:id });
      }
      // R4(a)/(b): retract a loose end
      if (looseEnd(l) && nb.length === 1){
        const wArea = g.lns[nb[0]].area;
        if (wArea === myArea || wArea === placeOf(g, myArea))
          out.push({ op:'retract', ln:l });
      }
    }
  }

  /* the double cut — both directions */
  if (size < maxNodes)
  for (const a of areasAll){
    const items = g.areas[a].items;
    // "around any graph on any area" — and any several graphs juxtaposed on one
    // area are themselves a graph (C3), so every selection of them counts
    if (items.length <= 4){
      for (let m = 0; m < (1 << items.length); m++)
        out.push({ op:'dcIn', area:a, items: items.filter((_,i) => m & (1<<i)) });
    } else {
      out.push({ op:'dcIn', area:a, items:[] });
      for (const i of items) out.push({ op:'dcIn', area:a, items:[i] });
      for (let i=0;i+1<items.length;i++) out.push({ op:'dcIn', area:a, items:[items[i],items[i+1]] });
      out.push({ op:'dcIn', area:a, items:items.slice() });
    }
  }
  for (const id of Object.keys(g.nodes)){
    const n = g.nodes[id];
    if (n.k !== 'cut') continue;
    const inner = g.areas[n.inner];
    if (inner.items.length !== 1) continue;
    const d = g.nodes[inner.items[0]];
    if (!d || d.k !== 'cut') continue;
    // R5 tolerates ligatures passing right through, but nothing may rest on
    // the outer area (Roberts p.59).
    // R5 tolerates ligatures passing from outside the outer cut to inside the
    // inner one; what it forbids is any graph *resting* on the outer area
    // (Roberts p.59). So every component of line on that area must run right
    // through: out through the outer cut and in through the loop.
    const passes = componentsOn(g, n.inner).every(comp => {
      const out_ = comp.some(l => neighbours(g,l).some(w => g.lns[w].area === n.area));
      const in_  = comp.some(l => neighbours(g,l).some(w => g.lns[w].area === d.inner));
      return out_ && in_;
    });
    if (!passes) continue;
    out.push({ op:'dcOut', cut:id });
  }
  return out;
}
// connected components of the line points lying on one area
function componentsOn(g, areaId){
  const here = new Set(g.areas[areaId].lns);
  const seen = new Set(), out = [];
  for (const l of g.areas[areaId].lns){
    if (seen.has(l)) continue;
    const comp = [], st = [l]; seen.add(l);
    while (st.length){
      const v = st.pop(); comp.push(v);
      for (const w of neighbours(g, v))
        if (here.has(w) && !seen.has(w)){ seen.add(w); st.push(w); }
    }
    out.push(comp);
  }
  return out;
}

// quick union-find over the whole ligature graph, for the join test
function find2(g, l){
  const seen = new Set([l]); const st=[l]; let min=l;
  while (st.length){ const v=st.pop(); for (const w of neighbours(g,v)) if(!seen.has(w)){seen.add(w);st.push(w); if(w<min) min=w;} }
  return min;
}

/* The Peirce rule a move exhibits, given the direction it was found in.
   A backward step T→S is justified by the forward rule that carries T to S. */
function ruleOf(op, fwd){
  switch(op){
    case 'erase': case 'eraseEdge': return fwd ? 'R1' : 'R2';
    case 'insert': case 'join':     return fwd ? 'R2' : 'R1';
    case 'iterate':                 return fwd ? 'R3' : 'R4';
    case 'deiterate':               return fwd ? 'R4' : 'R3';
    case 'dcIn':                    return fwd ? 'R5' : 'R6';
    case 'dcOut':                   return fwd ? 'R6' : 'R5';
    case 'addLine':                 return fwd ? 'C6/R2' : 'R1';
    case 'delLine':                 return fwd ? 'R1' : 'C6/R2';
    case 'branch':                  return fwd ? 'R3(a)' : 'R4(a)';
    case 'extend':                  return fwd ? 'R3(b)' : 'R4(b)';
    case 'retract':                 return fwd ? 'R4(a,b)' : 'R3(a,b)';
  }
  return '?';
}

/* --- apply a move --------------------------------------------------------- */
function applyMove(g0, mv, palette){
  const g = cloneGraph(g0);
  switch (mv.op){
    case 'erase':     removeNode(g, mv.node); break;
    case 'eraseEdge': delete g.edges[mv.edge]; break;
    case 'insert':    spliceIn(g, palette[mv.pat], mv.area); break;
    case 'join':      addEdge(g, mv.a, mv.b); break;
    case 'iterate':   copyNodeInto(g, mv.node, mv.target); break;
    case 'deiterate': removeNode(g, mv.node); break;
    case 'addLine':  addLn(g, mv.area); break;
    case 'delLine':  removeLn(g, mv.ln); break;
    case 'branch':   { const nl = addLn(g, g.lns[mv.ln].area); addEdge(g, mv.ln, nl); break; }
    case 'extend':   { const nl = addLn(g, g.nodes[mv.cut].inner); addEdge(g, mv.ln, nl); break; }
    case 'retract':  removeLn(g, mv.ln); break;
    case 'dcIn': {
      const outer = addCut(g, mv.area), oa = g.nodes[outer].inner;
      const loop  = addCut(g, oa), la = g.nodes[loop].inner;
      for (const id of mv.items) moveNode(g, id, la);
      // Whatever was moved, any ligature now running from the old area into it
      // has further to travel; repairEdges marks the point at which it crosses
      // each new cut. R5 is explicit that a ligature passing from outside the
      // outer cut to inside the inner one does not prevent the transformation
      // (Roberts p. 59), so the line must be carried through, not cut.
      break;
    }
    case 'dcOut': {
      const n = g.nodes[mv.cut];
      const d = g.nodes[g.areas[n.inner].items[0]];
      const dest = n.area;
      for (const id of g.areas[d.inner].items.slice()) moveNode(g, id, dest);
      for (const l of g.areas[d.inner].lns.slice()) moveLn(g, l, dest);
      for (const l of g.areas[n.inner].lns.slice()) moveLn(g, l, dest);
      removeNode(g, mv.cut);
      break;
    }
    default: throw new Error('unknown move '+mv.op);
  }
  repairEdges(g);
  fixScrolls(g);
  return g;
}

/* A line of identity is one graph (C7), and no graph may rest partly on one area
   and partly on another (Roberts p. 50 n. 1): a line crosses one cut at a time,
   and the crossing is marked by a point. Moving a graph into a new enclosure
   gives any line running into it further to travel, so the points it now needs
   are added here. Without this the line is left spanning two cuts, which the
   reading takes for two separate lines — and the graph then says something
   else. */
function repairEdges(g){
  for (const e of Object.values(g.edges).slice()){
    if (!g.edges[e.id]) continue;
    const la = g.lns[e.a], lb = g.lns[e.b];
    if (!la || !lb) continue;
    const aA = la.area, aB = lb.area;
    if (aA === aB || placeOf(g, aA) === aB || placeOf(g, aB) === aA) continue;
    let outer, inner, oArea, iArea;
    if (contains(g, aA, aB)) { outer = e.a; inner = e.b; oArea = aA; iArea = aB; }
    else if (contains(g, aB, aA)) { outer = e.b; inner = e.a; oArea = aB; iArea = aA; }
    else continue;                       // unrelated areas: not ours to mend
    const path = areaPath(g, iArea);
    const k = path.indexOf(oArea);
    if (k < 0) continue;
    delete g.edges[e.id];
    let prev = outer;
    for (let i = k + 1; i < path.length - 1; i++){
      const mid = addLn(g, path[i]);
      addEdge(g, prev, mid);
      prev = mid;
    }
    addEdge(g, prev, inner);
  }
}
// A cut is the outer cut of a scroll only while its loop is still on its area;
// the rules may have moved or erased it (C4).
function fixScrolls(g){
  for (const n of Object.values(g.nodes)){
    if (n.k !== 'cut' || n.scroll === undefined) continue;
    const loop = g.nodes[n.scroll];
    if (!loop || loop.area !== n.inner) delete n.scroll;
  }
}

// Move an existing node (with everything under it) to another area.
function moveNode(g, id, destArea){
  const n = g.nodes[id];
  const old = g.areas[n.area];
  old.items = old.items.filter(x => x !== id);
  n.area = destArea;
  g.areas[destArea].items.push(id);
  if (n.k === 'spot') n.hooks.forEach(h => moveLn(g, h, destArea));
}
function moveLn(g, id, destArea){
  const old = g.areas[g.lns[id].area];
  old.lns = old.lns.filter(x => x !== id);
  g.lns[id].area = destArea;
  g.areas[destArea].lns.push(id);
}
// Scribe a copy of graph `p` (a whole graph object) onto `area` of g.
function spliceIn(g, p, area){
  if (!p) return;
  const map = {};
  (function cp(srcArea, dstArea){
    const hookHere = new Set();
    for (const id of p.areas[srcArea].items)
      if (p.nodes[id].k === 'spot') p.nodes[id].hooks.forEach(h => hookHere.add(h));
    for (const l of p.areas[srcArea].lns) if (!hookHere.has(l)) map[l] = addLn(g, dstArea);
    for (const id of p.areas[srcArea].items){
      const n = p.nodes[id];
      if (n.k === 'spot'){
        const sid = addSpot(g, dstArea, n.name, n.hooks.length);
        n.hooks.forEach((h,i) => map[h] = g.nodes[sid].hooks[i]);
      } else {
        const cid = addCut(g, dstArea);
        cp(n.inner, g.nodes[cid].inner);
      }
    }
  })(p.root, area);
  for (const e of Object.values(p.edges))
    if (map[e.a] && map[e.b]) addEdge(g, map[e.a], map[e.b]);
}

/* --- human-readable justification ----------------------------------------- */
function describeMove(g, mv, fwd){
  fwd = fwd !== false;
  const nm = id => {
    const n = g.nodes[id];
    if (!n) return 'the graph';
    return n.k === 'spot' ? '“'+n.name+'”' : 'the enclosure';
  };
  const par = id => g.nodes[id] ? (evenlyEnclosed(g, g.nodes[id].area) ? 'evenly' : 'oddly') : '';
  switch (mv.op){
    case 'erase': return fwd
      ? 'R1, erasure: '+nm(mv.node)+' is '+par(mv.node)+' enclosed, so it may be erased.'
      : 'R2, insertion: '+nm(mv.node)+' stands on an oddly enclosed area, where any graph may be scribed.';
    case 'eraseEdge': return fwd
      ? 'R1, erasure: an evenly enclosed portion of a line of identity is erased.'
      : 'R2, insertion: two oddly enclosed lines on the same area are joined.';
    case 'insert': return fwd
      ? 'R2, insertion: the area is oddly enclosed, so any graph whatever may be scribed on it.'
      : 'R1, erasure: the graph is evenly enclosed, so it may be erased.';
    case 'join': return fwd
      ? 'R2, insertion: two lines of identity oddly enclosed on the same area are joined.'
      : 'R1, erasure: an evenly enclosed portion of a line of identity is erased.';
    case 'iterate': return fwd
      ? 'R3, iteration: '+nm(mv.node)+' is scribed again on an area contained by its own place.'
      : 'R4, deiteration: the copy could have been got by iteration, so it may be erased.';
    case 'deiterate': return fwd
      ? 'R4, deiteration: '+nm(mv.node)+' could have been got by iterating '+nm(mv.witness)+
        ', which is less enclosed, so it may be erased.'
      : 'R3, iteration: the graph is scribed again on an area contained by its own place.';
    case 'addLine': return fwd
      ? 'C6: an unattached line of identity may always be scribed — "something exists".'
      : 'R1, erasure: an evenly enclosed line of identity is erased.';
    case 'delLine': return fwd
      ? 'R1, erasure: an evenly enclosed line of identity is erased.'
      : 'C6: an unattached line of identity may always be scribed.';
    case 'branch': return fwd
      ? 'R3(a), iteration: a branch with a loose end is added to a line of identity.'
      : 'R4(a), deiteration: a branch with a loose end is retracted into the line.';
    case 'extend': return fwd
      ? 'R3(b), iteration: a loose end of the ligature is extended inwards through a cut.'
      : 'R4(b), deiteration: a loose end of the ligature is retracted outwards through a cut.';
    case 'retract': return fwd
      ? 'R4(a,b), deiteration: a loose end is retracted.'
      : 'R3(a,b), iteration: a loose end is extended.';
    case 'dcIn':  return fwd ? 'R5: a double cut is drawn.' : 'R6: a double cut is removed.';
    case 'dcOut': return fwd ? 'R6: a double cut is removed.' : 'R5: a double cut is drawn.';
  }
  return mv.op;
}
