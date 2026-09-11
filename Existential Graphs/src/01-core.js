/* ============================================================================
   EG CORE — data model for Peirce's existential graphs
   Follows Roberts (1973), The Existential Graphs of Charles S. Peirce,
   Ch. 3 (Alpha), Ch. 4 (Beta), Appendix 3 (conventions C1-C9, rules R1-R5).

   A graph is a store of:
     areas  — the sheet of assertion (root) and the area of every cut
     nodes  — cuts and spots, each living on exactly one area
     lns    — "line nodes": points of a line of identity, each on one area
     edges  — segments joining line nodes. An edge joins two line nodes on the
              same area, or a line node on area A to a line node on the area of
              a cut that lies on A (C9: the crossing point counts as outside).
   ========================================================================== */

let __uid = 0;
const uid = (p) => p + (++__uid);
function resetUid(n){ __uid = n||0; }

function newGraph(){
  const g = { areas:{}, nodes:{}, lns:{}, edges:{}, root:null };
  g.root = mkArea(g, null);
  return g;
}
function mkArea(g, cutId){
  const id = uid('a');
  g.areas[id] = { id, cut: cutId, items: [], lns: [] };
  return id;
}
function addCut(g, areaId){
  const id = uid('c');
  const inner = mkArea(g, id);
  g.nodes[id] = { k:'cut', id, area: areaId, inner };
  g.areas[areaId].items.push(id);
  return id;
}
function addSpot(g, areaId, name, nhooks){
  const id = uid('s');
  const hooks = [];
  for (let i=0;i<(nhooks||0);i++) hooks.push(addLn(g, areaId));
  g.nodes[id] = { k:'spot', id, area: areaId, name, hooks };
  g.areas[areaId].items.push(id);
  return id;
}
function addLn(g, areaId){
  const id = uid('n');
  g.lns[id] = { id, area: areaId };
  g.areas[areaId].lns.push(id);
  return id;
}
function addEdge(g, a, b){
  if (a === b) return null;
  for (const e of Object.values(g.edges))
    if ((e.a===a&&e.b===b)||(e.a===b&&e.b===a)) return e.id;
  const id = uid('e');
  g.edges[id] = { id, a, b };
  return id;
}

/* --- structural queries -------------------------------------------------- */

// The area on which a cut sits (its "place"), or null for the root.
function placeOf(g, areaId){
  const a = g.areas[areaId];
  if (!a || !a.cut) return null;
  return g.nodes[a.cut].area;
}
// Depth of an area = number of cuts enclosing it. Root = 0.
function depthOf(g, areaId){
  let d = 0, cur = areaId;
  while (g.areas[cur] && g.areas[cur].cut){ d++; cur = g.nodes[g.areas[cur].cut].area; }
  return d;
}
const evenlyEnclosed = (g,areaId) => depthOf(g,areaId) % 2 === 0;
const oddlyEnclosed  = (g,areaId) => depthOf(g,areaId) % 2 === 1;

// Chain of areas from the root down to areaId, inclusive.
function areaPath(g, areaId){
  const out = []; let cur = areaId;
  while (cur){ out.unshift(cur); cur = placeOf(g, cur); }
  return out;
}
// Does area `anc` contain area `d` (reflexively)? Roberts' relation {anc} ⊇ {d}.
function contains(g, anc, d){
  let cur = d;
  while (cur){ if (cur === anc) return true; cur = placeOf(g, cur); }
  return false;
}
// Every area lying inside a node (for a cut, its own area and all below).
function areasUnder(g, areaId, acc){
  acc = acc || [];
  acc.push(areaId);
  for (const id of g.areas[areaId].items)
    if (g.nodes[id].k === 'cut') areasUnder(g, g.nodes[id].inner, acc);
  return acc;
}
function nodesUnder(g, areaId, acc){
  acc = acc || [];
  for (const id of g.areas[areaId].items){
    acc.push(id);
    if (g.nodes[id].k === 'cut') nodesUnder(g, g.nodes[id].inner, acc);
  }
  return acc;
}

/* --- edges incident on a line node --------------------------------------- */
function edgesAt(g, lnId){
  return Object.values(g.edges).filter(e => e.a===lnId || e.b===lnId);
}
function neighbours(g, lnId){
  return edgesAt(g, lnId).map(e => e.a===lnId ? e.b : e.a);
}

/* Global connected components of the ligature graph. These are the visible
   "ligatures" — Roberts p.49: the totality of lines of identity that join one
   another. Used for drawing, NOT for reading (see readArea). */
function ligatures(g){
  const seen = new Set(), comps = [];
  for (const id of Object.keys(g.lns)){
    if (seen.has(id)) continue;
    const comp = [], stack = [id]; seen.add(id);
    while (stack.length){
      const v = stack.pop(); comp.push(v);
      for (const w of neighbours(g, v)) if (!seen.has(w)){ seen.add(w); stack.push(w); }
    }
    comps.push(comp);
  }
  return comps;
}
// The least enclosed area a ligature reaches — Roberts p.51, the "principal
// secret": a line is as much enclosed as its least enclosed part.
function ligatureHome(g, comp){
  let best = null, bd = Infinity;
  for (const n of comp){
    const d = depthOf(g, g.lns[n].area);
    if (d < bd){ bd = d; best = g.lns[n].area; }
  }
  return best;
}

/* --- deep copy ----------------------------------------------------------- */
function cloneGraph(g){
  const h = { areas:{}, nodes:{}, lns:{}, edges:{}, root:g.root };
  for (const k in g.areas) h.areas[k] = { id:g.areas[k].id, cut:g.areas[k].cut,
    items:g.areas[k].items.slice(), lns:g.areas[k].lns.slice() };
  for (const k in g.nodes){
    const n = g.nodes[k];
    h.nodes[k] = n.k==='cut' ? {k:'cut',id:n.id,area:n.area,inner:n.inner,scroll:n.scroll}
                             : {k:'spot',id:n.id,area:n.area,name:n.name,hooks:n.hooks.slice()};
  }
  for (const k in g.lns) h.lns[k] = { id:g.lns[k].id, area:g.lns[k].area };
  for (const k in g.edges) h.edges[k] = { id:g.edges[k].id, a:g.edges[k].a, b:g.edges[k].b };
  return h;
}

/* --- deletion ------------------------------------------------------------ */
function removeLn(g, lnId){
  for (const e of Object.values(g.edges))
    if (e.a===lnId || e.b===lnId) delete g.edges[e.id];
  const a = g.areas[g.lns[lnId].area];
  if (a) a.lns = a.lns.filter(x => x!==lnId);
  delete g.lns[lnId];
}
function removeNode(g, nodeId){
  const n = g.nodes[nodeId];
  if (!n) return;
  if (n.k === 'cut'){
    for (const child of g.areas[n.inner].items.slice()) removeNode(g, child);
    for (const l of g.areas[n.inner].lns.slice()) removeLn(g, l);
    delete g.areas[n.inner];
  } else {
    for (const h of n.hooks) removeLn(g, h);
  }
  const a = g.areas[n.area];
  if (a) a.items = a.items.filter(x => x!==nodeId);
  delete g.nodes[nodeId];
}

/* --- is the graph purely Alpha? ------------------------------------------ */
function isAlpha(g){
  return Object.keys(g.lns).length === 0;
}
