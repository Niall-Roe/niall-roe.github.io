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
/* A crude distance between two fingerprints, used only to order the beam.
   Weighting what the state still lacks more heavily than what it has to spare
   was tried and made things worse, so the two count the same. */
function fpDist(a, b){
  let d = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) d += Math.abs((a[k]||0) - (b[k]||0));
  return d;
}

/* ============================================================================
   STRATEGY.
   Peirce's rules are fine grained, and the search is otherwise blind: in Beta
   there is nothing like the truth-value analysis of Alpha to prune with. What
   a textbook writes as one step — "instantiate the universal premiss at this
   individual" — is three of Peirce's rules in a row: branch the individual's
   line (R3a), extend the branch inwards through the cut (R3b), and join it
   there to the premiss's own line (R2, which is licensed because the inside of
   that cut is oddly enclosed). None of the three looks like progress on its
   own, so a blind search must stumble on all three before anything improves.
   That sequence is offered whole.

   Nothing here licenses a step. Each move in the sequence is an ordinary move,
   applied by applyMove and recorded and displayed like any other; the strategy
   only decides which moves are worth trying together.
   ========================================================================== */
function instantiations(g, maxNodes){
  const out = [], seen = new Set();
  if (Object.keys(g.nodes).length >= maxNodes) return out;   // branch needs the room
  const universal = id => {
    const c = g.nodes[id];
    return c && c.k === 'cut' && g.areas[c.inner].lns.length > 0;
  };
  for (const l of Object.keys(g.lns)){
    const area = g.lns[l].area;
    // the premiss is already lying beside the individual
    for (const id of g.areas[area].items){
      if (!universal(id)) continue;
      const c = g.nodes[id];
      if (depthOf(g, c.inner) % 2 !== 1) continue;      // R2 joins only where it is odd
      for (const t of g.areas[c.inner].lns){
        if (find2(g, t) === find2(g, l)) continue;      // already one ligature
        const key = 'h' + find2(g,l) + '>' + id + '>' + find2(g,t);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ln:l, cut:id, target:t });
      }
    }
    // or it is lying further out, and must be carried in first: R3 iterates it
    // onto the individual's own area, and the copy is what gets applied. This
    // is the opening of every syllogism with two universal premisses.
    for (const id of Object.keys(g.nodes)){
      if (!universal(id)) continue;
      const c = g.nodes[id];
      if (c.area === area) continue;
      if (!contains(g, c.area, area)) continue;
      if (areasUnder(g, c.inner).includes(area)) continue;   // no iterating into itself
      if (depthOf(g, area) % 2 !== 0) continue;   // the copy's inside must come out odd
      const key = 'i' + find2(g,l) + '>' + canonNode(g, id, ligIndex(g)) + '>' + area;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ln:l, iterate:id, into:area });
    }
  }
  return out;
}
function runInstantiation(g, m, palette){
  const steps = [];
  let h = g, cut = m.cut, target = m.target;
  if (m.iterate !== undefined){
    const was = new Set(h.areas[m.into].items);
    const mv0 = { op:'iterate', node:m.iterate, target:m.into };
    h = applyMove(h, mv0, palette); steps.push({ mv:mv0, graph:h });
    cut = h.areas[m.into].items.find(x => !was.has(x));
    if (cut === undefined) return null;
    const inner = h.areas[h.nodes[cut].inner];
    target = inner.lns.find(t => find2(h, t) !== find2(h, m.ln));
    if (target === undefined) return null;
  }
  let before = new Set(Object.keys(h.lns));
  let mv = { op:'branch', ln:m.ln };
  h = applyMove(h, mv, palette); steps.push({ mv, graph:h });
  const w = Object.keys(h.lns).find(x => !before.has(x));
  if (!w) return null;
  before = new Set(Object.keys(h.lns));
  mv = { op:'extend', ln:w, cut };
  h = applyMove(h, mv, palette); steps.push({ mv, graph:h });
  const inner = Object.keys(h.lns).find(x => !before.has(x));
  if (!inner) return null;
  mv = { op:'join', a:inner, b:target };
  h = applyMove(h, mv, palette); steps.push({ mv, graph:h });
  return steps;
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
  const strategy = opts.strategy !== false;

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
      // and the strategy: whole sequences the rules would take three steps to
      // reach. Only forwards, where the rule parities suit them.
      if (!beta || dir !== 'fwd' || !strategy) continue;
      for (const m of instantiations(rec.graph, maxNodes)){
        let steps;
        try { steps = runInstantiation(rec.graph, m, palette); } catch(e){ continue; }
        if (!steps) continue;
        let prevKey = key, prevDepth = rec.depth;
        for (const st of steps){
          expanded++;
          if (graphSize(st.graph) > maxNodes + 4) break;
          if (!keepFwd(st.graph)) break;
          const k2 = canonGraph(st.graph);
          if (!map.has(k2)){
            map.set(k2, { graph:st.graph, prev:prevKey, mv:st.mv, depth:prevDepth+1, strat:true });
            if (other.has(k2)) return { nq, meet:k2, out:false };
            nq.push(k2);
          }
          prevKey = k2; prevDepth = map.get(k2).depth;
        }
      }
    }
    return { nq, meet:null, out:false };
  };
  // beam: keep the most promising states in each layer, so that long proofs
  // stay reachable without the frontier exploding
  const trim = (keys, map, target) => {
    if (keys.length <= beam) return keys;
    // A state the strategy proposed is never trimmed. The beam keeps whatever
    // most resembles the target, and the opening of a syllogism does the
    // opposite — it carries a premiss inwards and makes the graph larger — so
    // the one state worth keeping was reliably the first thrown away.
    const strat = keys.filter(k => map.get(k).strat);
    const rest  = keys.filter(k => !map.get(k).strat);
    const room  = Math.max(0, beam - strat.length);
    return strat.concat(rest
      .map(k => ({ k, d: fpDist(fingerprint(map.get(k).graph), target) }))
      .sort((a,b) => a.d - b.d)
      .slice(0, room)
      .map(x => x.k));
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
