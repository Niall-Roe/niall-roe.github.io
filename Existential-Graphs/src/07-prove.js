/* ============================================================================
   THE PROOF FINDER.
   A bidirectional search over Peirce's five rules. The forward half starts from
   the premisses scribed on the sheet of assertion; the backward half starts
   from the conclusion and runs the rules in reverse. Where the two halves meet
   we have a transformation of the premisses into the conclusion.

   For Alpha the question of validity is settled independently by Roberts'
   truth-value analysis (§3.2), so a failed search is reported as a failed
   search and never as a disproof. Beta validity is not decidable at all; there
   we can refute by finite countermodel, and otherwise only search.
   ========================================================================== */

// juxtapose several graphs on one sheet — C3, juxtaposition is conjunction
function juxtapose(graphs){
  const g = newGraph();
  graphs.forEach(p => spliceIn(g, p, g.root));
  return g;
}

// every subgraph of g, as a standalone graph, for the insertion palette
function subgraphPalette(graphs){
  const out = [], seen = new Set();
  for (const g of graphs){
    for (const id of Object.keys(g.nodes)){
      const h = newGraph();
      copyNodeAcross(g, id, h, h.root);
      const key = canonGraph(h);
      if (seen.has(key)) continue;
      seen.add(key); out.push(h);
    }
  }
  return out;
}
function copyNodeAcross(src, id, dst, area){
  const n = src.nodes[id];
  if (n.k === 'spot'){ addSpot(dst, area, n.name, n.hooks.length); return; }
  const c = addCut(dst, area);
  for (const ch of src.areas[n.inner].items) copyNodeAcross(src, ch, dst, dst.nodes[c].inner);
}

function graphSize(g){ return Object.keys(g.nodes).length + Object.keys(g.lns).length; }

/* A crude structural fingerprint: which spots occur, and how deeply. Used only
   to order the search; it never licenses or blocks a step. */
function fingerprint(g){
  const f = {};
  for (const n of Object.values(g.nodes)){
    const key = (n.k==='spot' ? n.name : '()') + '@' + depthOf(g, n.area);
    f[key] = (f[key]||0) + 1;
  }
  f['#ln'] = Object.keys(g.lns).length;
  return f;
}
function fpDist(a, b){
  let d = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) d += Math.abs((a[k]||0) - (b[k]||0));
  return d;
}

function findProof(premGraphs, goalGraph, opts){
  opts = opts || {};
  const maxDepth = opts.maxDepth || 6;
  const budget   = opts.budget   || 60000;
  const t0 = Date.now();
  const timeCap = opts.timeCap || 8000;

  const start = juxtapose(premGraphs);
  const goal  = cloneGraph(goalGraph);
  const palette = subgraphPalette([start, goal]);
  const slack = opts.slack || 3;
  const maxNodes = Math.max(graphSize(start), graphSize(goal)) + slack;

  const beta = !isAlpha(start) || !isAlpha(goal);

  /* Sound pruning, available in Alpha because validity there is decidable.
     Every rule is truth-preserving, so any state the forward search can use
     must still entail the conclusion, and any state the backward search can
     use must still be entailed by the premisses. Roberts proves the rules
     truth-preserving in §3.2 and Appendix 4. */
  const atoms = new Set();
  [start, goal].forEach(x => alphaAtoms(x).forEach(a => atoms.add(a)));
  const A = [...atoms];
  const usePrune = !beta && A.length <= 10;
  const rows = [];
  if (usePrune)
    for (let m = 0; m < (1 << A.length); m++){
      const asg = {}; A.forEach((a,i) => asg[a] = !!(m & (1<<i)));
      rows.push(asg);
    }
  const startVals = usePrune ? rows.map(r => valuate(start, r).value) : null;
  const goalVals  = usePrune ? rows.map(r => valuate(goal,  r).value) : null;
  // forward states must entail the goal; backward states must be entailed by
  // the premisses
  function keepFwd(h){
    if (!usePrune) return true;
    for (let i=0;i<rows.length;i++)
      if (valuate(h, rows[i]).value === 1 && goalVals[i] !== 1) return false;
    return true;
  }
  function keepBwd(h){
    if (!usePrune) return true;
    for (let i=0;i<rows.length;i++)
      if (startVals[i] === 1 && valuate(h, rows[i]).value !== 1) return false;
    return true;
  }

  const kStart = canonGraph(start), kGoal = canonGraph(goal);
  if (kStart === kGoal)
    return { found:true, steps:[{graph:start, rule:null, why:'The conclusion is already scribed.'}], expanded:0 };

  // frontier records: key -> {graph, prev, mv, depth, fwd}
  const fpGoal = fingerprint(goal), fpStart = fingerprint(start);
  const beam = opts.beam || 600;

  const F = new Map(), B = new Map();
  F.set(kStart, { graph:start, prev:null, mv:null, depth:0 });
  B.set(kGoal,  { graph:goal,  prev:null, mv:null, depth:0 });
  let Fq = [kStart], Bq = [kGoal];
  let expanded = 0;

  const expand = (side, q, map, other, dir) => {
    const nq = [];
    for (const key of q){
      const rec = map.get(key);
      if (Date.now() - t0 > timeCap || expanded > budget) return { nq, meet:null, out:true };
      const mvs = legalMoves(rec.graph, { dir, palette, maxNodes, beta });
      // cheap moves first: they shrink or keep the graph
      mvs.sort((a,b) => rank(a) - rank(b));
      for (const mv of mvs){
        expanded++;
        if (expanded > budget) return { nq, meet:null, out:true };
        let h;
        try { h = applyMove(rec.graph, mv, palette); } catch(e){ continue; }
        if (graphSize(h) > maxNodes + 4) continue;
        if (dir === 'fwd' ? !keepFwd(h) : !keepBwd(h)) continue;
        const k = canonGraph(h);
        if (map.has(k)) continue;
        const entry = { graph:h, prev:key, mv, depth:rec.depth+1 };
        map.set(k, entry);
        if (other.has(k)) return { nq, meet:k, out:false };
        nq.push(k);
      }
    }
    return { nq, meet:null, out:false };
  };
  // beam: keep the most promising states in each layer, so that long proofs
  // stay reachable without the frontier exploding
  const trim = (keys, map, target) => {
    if (keys.length <= beam) return keys;
    return keys
      .map(k => ({ k, d: fpDist(fingerprint(map.get(k).graph), target) }))
      .sort((a,b) => a.d - b.d)
      .slice(0, beam)
      .map(x => x.k);
  };
  const rank = mv => ({ deiterate:0, dcOut:1, erase:2, eraseEdge:2,
                        dcIn:3, iterate:4, join:5, insert:6 })[mv.op] ?? 9;

  for (let d = 0; d < maxDepth; d++){
    // always grow the smaller frontier
    const growF = Fq.length <= Bq.length;
    const r = growF ? expand('F', Fq, F, B, 'fwd') : expand('B', Bq, B, F, 'bwd');
    if (growF) Fq = trim(r.nq, F, fpGoal); else Bq = trim(r.nq, B, fpStart);
    if (r.meet) return assemble(F, B, r.meet, expanded, palette);
    if (r.out) break;
    if (!Fq.length && !Bq.length) break;
  }
  return { found:false, expanded, exhausted: Fq.length===0 && Bq.length===0 };
}

function assemble(F, B, meetKey, expanded, palette){
  // forward chain: start ... meet
  const fwd = [];
  let k = meetKey;
  while (k && F.has(k)){ const r = F.get(k); fwd.unshift({ key:k, rec:r }); k = r.prev; }
  // backward chain from meet to goal, read forwards
  const bwd = [];
  k = meetKey;
  while (k && B.has(k)){ const r = B.get(k); bwd.push({ key:k, rec:r }); k = r.prev; }

  const steps = [];
  steps.push({ graph: fwd[0].rec.graph, rule:null, why:'The premisses, scribed on the sheet of assertion.' });
  for (let i = 1; i < fwd.length; i++){
    const r = fwd[i].rec;
    steps.push({ graph:r.graph, rule: ruleOf(r.mv.op, true), mv:r.mv,
                 why: describeMove(fwd[i-1].rec.graph, r.mv, true) });
  }
  for (let i = 1; i < bwd.length; i++){
    const r = bwd[i-1].rec;                       // the move that took bwd[i] -> bwd[i-1]
    steps.push({ graph: bwd[i].rec.graph, rule: ruleOf(r.mv.op, false), mv:r.mv,
                 why: describeMove(bwd[i-1].rec.graph, r.mv, false) });
  }
  return { found:true, steps, expanded };
}
