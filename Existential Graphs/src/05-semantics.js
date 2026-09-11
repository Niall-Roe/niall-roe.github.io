/* ============================================================================
   SEMANTICS.
   Alpha: Roberts §3.2 — "Let 1 and 2 represent the truth-values truth and
   falsehood".  The value of an area is the value of the conjunction of all the
   graphs scribed on it; the value of an enclosure is 2 if the value of its
   area is 1, and 1 if the value of its area is 2 (C5).
   ========================================================================== */

function alphaAtoms(g){
  const s = new Set();
  for (const n of Object.values(g.nodes)) if (n.k==='spot') s.add(n.name);
  return [...s].sort();
}

// Returns {areaVal:{areaId:1|2}, cutVal:{cutId:1|2}, value:1|2}
function valuate(g, assign){
  const areaVal = {}, cutVal = {};
  function valArea(areaId){
    let v = 1;                                    // the blank sheet has the value 1
    for (const id of g.areas[areaId].items){
      const n = g.nodes[id];
      let nv;
      if (n.k === 'spot') nv = assign[n.name] ? 1 : 2;
      else { const inner = valArea(n.inner); nv = inner === 1 ? 2 : 1; cutVal[id] = nv; }
      if (nv === 2) v = 2;                        // a single 2 gives the area the value 2
    }
    areaVal[areaId] = v;
    return v;
  }
  const value = valArea(g.root);
  return { areaVal, cutVal, value };
}

// Full truth table over the atoms. Returns {atoms, rows, tautology, contradiction}
function truthTable(g, cap){
  const atoms = alphaAtoms(g);
  cap = cap || 14;
  if (atoms.length > cap) return { atoms, rows: null, tooBig: true };
  const rows = [];
  let taut = true, contra = true;
  for (let m = 0; m < (1 << atoms.length); m++){
    const assign = {};
    atoms.forEach((a,i) => assign[a] = !!(m & (1 << i)));
    const v = valuate(g, assign).value;
    rows.push({ assign, value: v });
    if (v !== 1) taut = false;
    if (v !== 2) contra = false;
  }
  return { atoms, rows, tautology: taut, contradiction: contra };
}

/* --- Alpha consequence: does the conjunction of premisses entail the goal? -- */
function alphaEntails(prems, goal){
  const atoms = new Set();
  [...prems, goal].forEach(g => alphaAtoms(g).forEach(a => atoms.add(a)));
  const A = [...atoms];
  if (A.length > 18) return { decided:false };
  for (let m = 0; m < (1 << A.length); m++){
    const assign = {};
    A.forEach((a,i) => assign[a] = !!(m & (1 << i)));
    const premTrue = prems.every(p => valuate(p, assign).value === 1);
    if (premTrue && valuate(goal, assign).value !== 1)
      return { decided:true, entails:false, countermodel: assign };
  }
  return { decided:true, entails:true };
}

/* ============================================================================
   Beta: evaluate the endoporeutic reading over a finite model.
   A model is { n, preds: { "Name/arity": Set of "i,j" } }.
   ========================================================================== */

function evalAst(a, model, asg){
  switch(a.t){
    case 'true':  return true;
    case 'false': return false;
    case 'atom': {
      const key = a.name+'/'+a.args.length;
      const S = model.preds[key];
      if (!S) return false;
      return S.has(a.args.map(v => asg[v]).join(','));
    }
    case 'eq':  return asg[a.l] === asg[a.r];
    case 'not': return !evalAst(a.a, model, asg);
    case 'and': return a.xs.every(x => evalAst(x, model, asg));
    case 'or':  return a.xs.some(x => evalAst(x, model, asg));
    case 'imp': return !evalAst(a.a, model, asg) || evalAst(a.b, model, asg);
    case 'iff': return evalAst(a.a, model, asg) === evalAst(a.b, model, asg);
    case 'ex':  {
      for (let i=0;i<model.n;i++){ const s = Object.assign({}, asg); s[a.v]=i;
        if (evalAst(a.a, model, s)) return true; }
      return false;
    }
    case 'all': {
      for (let i=0;i<model.n;i++){ const s = Object.assign({}, asg); s[a.v]=i;
        if (!evalAst(a.a, model, s)) return false; }
      return true;
    }
  }
  throw new Error('cannot evaluate '+a.t);
}

function signatureOf(asts){
  const sig = {};
  (function walk(a){
    if (!a) return;
    if (a.t==='atom') sig[a.name+'/'+a.args.length] = a.args.length;
    if (a.a) walk(a.a); if (a.b) walk(a.b);
    if (a.xs) a.xs.forEach(walk);
  });
  const w = a => {
    if (!a) return;
    if (a.t==='atom') sig[a.name+'/'+a.args.length] = a.args.length;
    if (a.a) w(a.a); if (a.b) w(a.b); if (a.xs) a.xs.forEach(w);
  };
  asts.forEach(w);
  return sig;
}

/* Search for a finite countermodel to "premisses ⊨ goal", domains 1..maxN.
   Beta validity is not decidable, so a failure here settles nothing; finding a
   countermodel, on the other hand, is conclusive. */
function findCountermodel(premAsts, goalAst, maxN, budget){
  maxN = maxN || 3; budget = budget || 200000;
  const sig = signatureOf([...premAsts, goalAst]);
  const keys = Object.keys(sig);
  for (let n = 1; n <= maxN; n++){
    // all tuples for each predicate
    const slots = keys.map(k => {
      const ar = sig[k];
      let tuples = [[]];
      for (let i=0;i<ar;i++){
        const nxt = [];
        for (const t of tuples) for (let d=0; d<n; d++) nxt.push(t.concat(d));
        tuples = nxt;
      }
      return { key:k, tuples: tuples.map(t=>t.join(',')) };
    });
    const total = slots.reduce((acc,s)=>acc * Math.pow(2, s.tuples.length), 1);
    if (!isFinite(total) || total > budget) continue;
    for (let m = 0; m < total; m++){
      let rest = m;
      const preds = {};
      for (const s of slots){
        const bits = Math.pow(2, s.tuples.length);
        const mask = rest % bits; rest = Math.floor(rest / bits);
        const S = new Set();
        s.tuples.forEach((t,i) => { if (mask & (1<<i)) S.add(t); });
        preds[s.key] = S;
      }
      const model = { n, preds };
      if (premAsts.every(p => evalAst(p, model, {})) && !evalAst(goalAst, model, {}))
        return { model, n, preds: Object.fromEntries(keys.map(k=>[k,[...preds[k]]])) };
    }
  }
  return null;
}
