/* ============================================================================
   THE PROOF FINDER.
   A bidirectional search over Peirce's rules. The forward half starts from
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

/* every subgraph of g, as a standalone graph, for the insertion palette.
   Where a graph has lines of identity in it, lifting a part of it off only
   makes sense if no line crosses the edge of that part; where one does, the
   part is taken without its lines, which is still a graph and still something
   R2 permits scribing. */
function subgraphPalette(graphs){
  const out = [], seen = new Set();
  for (const g of graphs){
    for (const id of Object.keys(g.nodes)){
      let h = nodeAsGraph(g, id);
      if (!h){ h = newGraph(); copyNodeAcross(g, id, h, h.root); }
      const key = canonGraph(h);
      if (seen.has(key)) continue;
      seen.add(key); out.push(h);
    }
  }
  return out;
}
// one node and everything under it, standing on a sheet of its own — null if a
// line of identity runs across the boundary, so that it cannot be lifted off
function nodeAsGraph(src, id){
  const n = src.nodes[id];
  const inside = new Set();
  if (n.k === 'spot') n.hooks.forEach(l => inside.add(l));
  else for (const a of areasUnder(src, n.inner))
    for (const l of src.areas[a].lns) inside.add(l);
  if (!inside.size) return null;                 // no lines: the plain copy does
  for (const e of Object.values(src.edges))
    if (inside.has(e.a) !== inside.has(e.b)) return null;
  const h = cloneGraph(src);
  moveNode(h, id, h.root);
  for (const x of h.areas[h.root].items.slice()) if (x !== id) removeNode(h, x);
  for (const l of h.areas[h.root].lns.slice()) if (!inside.has(l)) removeLn(h, l);
  repairEdges(h);
  return h;
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

/* The same thought in Alpha. What a textbook writes as one step — "P, and if
   P then Q, so Q" — is not one of Peirce's rules either, and when the P in
   question is sitting inside a cut it is three: iterate the conditional in
   beside it (R3), deiterate the antecedent against the copy already there
   (R4), and take off the double cut that is left (R6). The middle of that
   sequence is a larger graph than either end, so a search that judges a state
   by how much it looks like the conclusion throws the opening away. This is
   what the constructive dilemma turns on, and every argument by cases with it.

   As with the Beta sequence, nothing here licenses a step: each move is an
   ordinary move, applied and displayed like any other. */
function subtreeHasLines(g, cutId){
  for (const a of areasUnder(g, g.nodes[cutId].inner))
    if (g.areas[a].lns.length) return true;
  return false;
}
function detachments(g, maxNodes){
  const out = [];
  if (Object.keys(g.nodes).length >= maxNodes) return out;
  const lig = ligIndex(g);
  const canon = {};
  for (const id of Object.keys(g.nodes)) canon[id] = canonNode(g, id, lig);
  const areasAll = areasUnder(g, g.root);
  for (const id of Object.keys(g.nodes)){
    const c = g.nodes[id];
    if (c.k !== 'cut') continue;
    if (g.areas[c.inner].lns.length || subtreeHasLines(g, id)) continue;
    const items = g.areas[c.inner].items;
    if (items.length < 2) continue;
    const banned = new Set(areasUnder(g, c.inner));
    for (const d of items){
      if (g.nodes[d].k !== 'cut') continue;        // the consequent is what the cut denies
      const ante = items.filter(x => x !== d);
      for (const t of areasAll){
        if (t === c.area || banned.has(t)) continue;
        if (!contains(g, c.area, t)) continue;
        const there = g.areas[t].items.map(x => canon[x]);
        if (!ante.every(x => there.includes(canon[x]))) continue;
        out.push({ node:id, keep:d, into:t });
      }
    }
  }
  return out;
}
function runDetachment(g, m, palette){
  const steps = [];
  const was = new Set(g.areas[m.into].items);
  let mv = { op:'iterate', node:m.node, target:m.into };
  let h = applyMove(g, mv, palette); steps.push({ mv, graph:h });
  const c2 = h.areas[m.into].items.find(x => !was.has(x));
  if (c2 === undefined) return null;
  const inner = h.nodes[c2].inner;
  for (let guard = 0; guard < 8; guard++){
    const lig = ligIndex(h);
    const outside = h.areas[m.into].items.filter(x => x !== c2)
      .map(x => canonNode(h, x, lig));
    let pick = null;
    for (const x of h.areas[inner].items)
      if (outside.includes(canonNode(h, x, lig))){ pick = x; break; }
    if (pick === null) break;
    const w = h.areas[m.into].items.find(y => y !== c2 &&
      canonNode(h, y, ligIndex(h)) === canonNode(h, pick, ligIndex(h)));
    if (w === undefined) break;
    mv = { op:'deiterate', node:pick, witness:w };
    h = applyMove(h, mv, palette); steps.push({ mv, graph:h });
  }
  const rest = h.areas[inner].items;
  if (rest.length !== 1 || h.nodes[rest[0]].k !== 'cut') return null;
  mv = { op:'dcOut', cut:c2 };
  h = applyMove(h, mv, palette); steps.push({ mv, graph:h });
  return steps;
}

/* The search is written as a generator so that it can be run in slices: the
   page drives it a few dozen milliseconds at a time, paints the count of
   transformations tried, and comes back. Everything else — the tests, the
   library generator — calls findProof and gets the same answer in one go.
   What is yielded is the running count; what is sent back in is how long the
   caller paused, which is discounted from the time cap so that a search run
   in slices does no less work than one run straight through. */
function findProof(premGraphs, goalGraph, opts){
  const it = searchProof(premGraphs, goalGraph, opts);
  let r = it.next();
  while (!r.done) r = it.next(0);
  return r.value;
}
function* searchProof(premGraphs, goalGraph, opts){
  opts = opts || {};
  const maxDepth = opts.maxDepth || 6;
  const budget   = opts.budget   || 60000;
  const t0 = Date.now();
  const timeCap = opts.timeCap || 8000;
  const sliceMs = opts.sliceMs || 90;
  let paused = 0, mark = Date.now();
  const spent = () => Date.now() - t0 - paused;

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

  /* If the thing to prove is a conditional standing on the blank sheet, there
     is a second way in (below), and it is usually the one that works. So the
     ordinary search is given part of the time and the fallback the rest,
     rather than the fallback waiting out a search that was never going to
     finish. */
  const canAssume = opts.deduction !== false && !premGraphs.length &&
                    scrollSplits(goal).length > 0;
  let mainCap    = canAssume ? Math.max(1500, Math.round(timeCap * 0.45)) : timeCap;
  let mainBudget = canAssume ? Math.round(budget * 0.45) : budget;

  const kStart = canonGraph(start), kGoal = canonGraph(goal);
  if (kStart === kGoal)
    return { found:true, steps:[{graph:start, rule:null, why:'The conclusion is already scribed.'}], expanded:0 };

  // frontier records: key -> {graph, prev, mv, depth, fwd}
  const fpGoal = fingerprint(goal), fpStart = fingerprint(start);
  const beam = opts.beam || 600;

  const badMeets = new Set();
  const F = new Map(), B = new Map();
  F.set(kStart, { graph:start, prev:null, mv:null, depth:0 });
  B.set(kGoal,  { graph:goal,  prev:null, mv:null, depth:0 });
  let Fq = [kStart], Bq = [kGoal];
  let expanded = 0;

  function* expand(side, q, map, other, dir){
    const nq = [];
    for (const key of q){
      const rec = map.get(key);
      if (spent() > mainCap || expanded > mainBudget) return { nq, meet:null, out:true };
      if (Date.now() - mark > sliceMs){
        const waited = yield { expanded, found:false };
        // a page in a background tab has its timers slowed to a crawl; only so
        // much of each gap is given back, so that a search there does less work
        // rather than running on for minutes of the reader's time
        if (typeof waited === 'number') paused += Math.min(waited, sliceMs * 3);
        mark = Date.now();
      }
      const mvs = legalMoves(rec.graph, { dir, palette, maxNodes, beta });
      // cheap moves first: they shrink or keep the graph
      mvs.sort((a,b) => rank(a) - rank(b));
      for (const mv of mvs){
        expanded++;
        if (expanded > mainBudget) return { nq, meet:null, out:true };
        let h;
        try { h = applyMove(rec.graph, mv, palette); } catch(e){ continue; }
        if (graphSize(h) > maxNodes + 4) continue;
        if (dir === 'fwd' ? !keepFwd(h) : !keepBwd(h)) continue;
        const k = canonGraph(h);
        if (map.has(k)) continue;
        const entry = { graph:h, prev:key, mv, depth:rec.depth+1 };
        map.set(k, entry);
        if (other.has(k) && !badMeets.has(k)) return { nq, meet:k, out:false };
        nq.push(k);
      }
      // and the strategy: whole sequences the rules would take three steps to
      // reach. Only forwards, where the rule parities suit them.
      if (dir !== 'fwd' || !strategy) continue;
      const plans = [];
      if (beta) for (const m of instantiations(rec.graph, maxNodes))
        plans.push(() => runInstantiation(rec.graph, m, palette));
      for (const m of detachments(rec.graph, maxNodes))
        plans.push(() => runDetachment(rec.graph, m, palette));
      for (const plan of plans){
        let steps;
        try { steps = plan(); } catch(e){ continue; }
        if (!steps) continue;
        /* Only where the sequence ends is a state worth going on from: the
           states in the middle of it are recorded so that the proof can be
           read back, but putting them in the frontier as well crowds out the
           ordinary search, which is what actually finishes these proofs. */
        let prevKey = key, prevDepth = rec.depth, lastKey = null, fresh = false;
        for (const st of steps){
          expanded++;
          if (graphSize(st.graph) > maxNodes + 4){ lastKey = null; break; }
          if (!keepFwd(st.graph)){ lastKey = null; break; }
          const k2 = canonGraph(st.graph);
          fresh = !map.has(k2);
          if (fresh){
            map.set(k2, { graph:st.graph, prev:prevKey, mv:st.mv, depth:prevDepth+1 });
            if (other.has(k2) && !badMeets.has(k2)) return { nq, meet:k2, out:false };
          }
          prevKey = k2; prevDepth = map.get(k2).depth; lastKey = k2;
        }
        if (lastKey && fresh){ map.get(lastKey).strat = true; nq.push(lastKey); }
      }
    }
    return { nq, meet:null, out:false };
  }
  // beam: keep the most promising states in each layer, so that long proofs
  // stay reachable without the frontier exploding
  const trim = (keys, map, target) => {
    if (keys.length <= beam) return keys;
    // A state the strategy proposed is never trimmed. The beam keeps whatever
    // most resembles the target, and the opening of a syllogism does the
    // opposite — it carries a premiss inwards and makes the graph larger — so
    // the one state worth keeping was reliably the first thrown away.
    // and the exempt states take at most half the beam between them
    const strat = keys.filter(k => map.get(k).strat).slice(0, Math.max(1, beam >> 1));
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

  let done = false;
  for (let attempt = 0; attempt < 2 && !done; attempt++){
    for (let d = 0; d < maxDepth; d++){
      // always grow the smaller frontier
      const growF = Fq.length <= Bq.length;
      const r = growF ? yield* expand('F', Fq, F, B, 'fwd') : yield* expand('B', Bq, B, F, 'bwd');
      if (growF) Fq = trim(r.nq, F, fpGoal); else Bq = trim(r.nq, B, fpStart);
      if (r.meet){
        const got = assemble(F, B, r.meet, expanded, palette);
        if (soundChain(got.steps)) return got;
        badMeets.add(r.meet);          // a false meeting: go on looking
        continue;
      }
      if (r.out) break;
      if (!Fq.length && !Bq.length){ done = true; break; }
    }
    if (attempt || !canAssume) break;
    const dt = yield* assumeAntecedent(goal, Object.assign({}, opts,
      { timeCap: Math.max(1200, timeCap - spent()), budget: Math.max(20000, budget - expanded) }));
    if (dt) return { found:true, steps:dt.steps, expanded: expanded + dt.expanded, assumed:true };
    // the other way in came to nothing, so the rest of the time goes back to
    // the ordinary search, which picks up where it stopped
    mainCap = timeCap; mainBudget = budget;
  }
  return { found:false, expanded, exhausted: Fq.length===0 && Bq.length===0 };
}

/* ============================================================================
   ASSUMING THE ANTECEDENT.
   A theorem of the form "if A then B" is scribed as a scroll: A between two
   cuts, B inside the inner one. Proving it from the blank sheet is much harder
   than proving B from A, because nothing on a blank sheet suggests where to
   start. What a textbook does instead is assume A, derive B, and discharge the
   assumption. The same thing can be done here with the rules themselves:

     draw a double cut on the blank sheet                            (R5)
     write A in the oddly enclosed area between the two cuts         (R2)
     iterate A into the inner cut                                    (R3)
     work the proof of B from A there, inside the inner cut

   The last part is sound because Peirce's rules turn on whether a place is
   evenly or oddly enclosed, and the inside of the inner cut is evenly enclosed
   like the sheet itself: every step of the inner proof is permitted in its new
   place for the same reason it was permitted on the sheet. What is left when
   the inner proof ends is A between the cuts and B inside, which is the
   theorem. Only Alpha is treated this way; a line of identity on the sheet is
   licensed by C1 rather than by parity, so the mapping would not be safe. */
function scrollSplits(goal){
  const root = goal.areas[goal.root];
  if (root.items.length !== 1 || root.lns.length) return [];
  const C = root.items[0];
  const c = goal.nodes[C];
  if (c.k !== 'cut') return [];
  const M = c.inner;
  // a line resting between the two cuts would tie the antecedent to the
  // consequent, and then neither can be lifted off on its own
  if (goal.areas[M].lns.length) return [];
  const items = goal.areas[M].items;
  if (items.length < 2) return [];
  // any cut inside can be read as the consequent, but the one written last is
  // the one the notation meant, so it is tried first
  return items.filter(d => goal.nodes[d].k === 'cut').reverse()
              .map(d => ({ C, M, cons:d, ante: items.filter(x => x !== d) }));
}
/* The antecedent, or any part of it, standing on a sheet of its own. */
function liftAnte(src, sp, keep){
  const h = cloneGraph(src);
  for (const id of h.areas[sp.M].items.slice())
    if (keep.indexOf(id) < 0) removeNode(h, id);
  for (const id of h.areas[sp.M].items.slice()) moveNode(h, id, h.root);
  for (const l of h.areas[sp.M].lns.slice()) moveLn(h, l, h.root);
  removeNode(h, sp.C);
  repairEdges(h);
  return h;
}
/* And the consequent, likewise. */
function liftCons(src, sp){
  const h = cloneGraph(src);
  const I = h.nodes[sp.cons].inner;
  for (const id of h.areas[I].items.slice()) moveNode(h, id, h.root);
  for (const l of h.areas[I].lns.slice()) moveLn(h, l, h.root);
  removeNode(h, sp.cons);
  for (const id of h.areas[sp.M].items.slice()) removeNode(h, id);
  removeNode(h, sp.C);
  repairEdges(h);
  return h;
}
// ( A ( X ) ) — the scroll with A between the cuts and X inside the inner one
function scrollOf(A, X){
  const g = newGraph();
  const c = addCut(g, g.root);
  spliceIn(g, A, g.nodes[c].inner);
  const d = addCut(g, g.nodes[c].inner);
  spliceIn(g, X, g.nodes[d].inner);
  return g;
}
/* Every step of the inner proof has to stay legal two cuts further in. Peirce's
   rules turn on whether a place is evenly or oddly enclosed, and the inside of
   the inner cut is evenly enclosed like the sheet, so almost all of them do.
   The exception is the bare line of identity: C1 licenses one on the sheet of
   assertion outright, and the inside of the inner cut is not the sheet. A proof
   that puts down or takes up a line on that ground is not transplanted. */
function transplantable(sub){
  for (let i = 1; i < sub.steps.length; i++){
    const mv = sub.steps[i].mv;
    if (!mv) return false;
    if (mv.op === 'addLine' || mv.op === 'delLine') return false;
  }
  return true;
}
function* assumeAntecedent(goal, opts){
  let used = 0;
  const splits = scrollSplits(goal);
  // the first reading gets the time; a second one gets what is left of it
  const cap = opts.timeCap || 8000, t0 = Date.now();
  for (const sp of splits){
    const per = Math.max(900, cap - (Date.now() - t0));
    const A = liftAnte(goal, sp, sp.ante);
    const B = liftCons(goal, sp);
    const sub = yield* searchProof([A], B,
      Object.assign({}, opts, { deduction:false, timeCap: per }));
    used += sub.expanded || 0;
    if (!sub.found) continue;
    const steps = [];
    let outer = newGraph();
    steps.push({ graph: newGraph(), rule:null,
                 why:'The blank sheet of assertion, which is itself a graph (C1).' });
    steps.push({ graph: scrollOf(outer, newGraph()), rule:'R5',
                 why:'R5: a double cut is drawn on the blank sheet.' });
    for (let k = 1; k <= sp.ante.length; k++){
      outer = liftAnte(goal, sp, sp.ante.slice(0, k));
      steps.push({ graph: scrollOf(outer, newGraph()), rule:'R2',
                   why:'R2, insertion: the area between the two cuts is oddly enclosed, so what is supposed may be scribed there.' });
    }
    for (let k = 1; k <= sp.ante.length; k++)
      steps.push({ graph: scrollOf(outer, liftAnte(goal, sp, sp.ante.slice(0, k))), rule:'R3',
                   why:'R3, iteration: the supposition is scribed again inside the inner cut, which its own place contains.' });
    for (let i = 1; i < sub.steps.length; i++)
      steps.push({ graph: scrollOf(outer, sub.steps[i].graph),
                   rule: sub.steps[i].rule, why: sub.steps[i].why });
    if (!transplantable(sub)) continue;
    if (canonGraph(steps[steps.length-1].graph) !== canonGraph(goal)) continue;
    return { steps, expanded: used };
  }
  return null;
}


/* A last check on the answer. The search treats two graphs as the same state
   when they have the same canonical form, and for Beta that form is not quite
   fine enough: two graphs that say different things can share one. Where that
   happens the two halves of the search meet at what is not really one graph,
   and the chain they make is not a proof. So every chain is model-checked step
   by step before it is offered, and one that fails is thrown away and the
   search goes on. Alpha is settled by truth-value analysis, Beta by looking
   for a countermodel on one or two individuals. */
function soundChain(steps){
  for (let i = 1; i < steps.length; i++){
    const a = steps[i-1].graph, b = steps[i].graph;
    try {
      if (isAlpha(a) && isAlpha(b)){
        const e = alphaEntails([a], b);
        if (e.decided && !e.entails) return false;
      } else {
        if (findCountermodel([readGraph(a)], readGraph(b), 2, 20000)) return false;
      }
    } catch(e){ /* a graph the reading cannot handle is left to the rules */ }
  }
  return true;
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
