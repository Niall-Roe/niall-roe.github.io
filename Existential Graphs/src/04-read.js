/* ============================================================================
   READ: existential graph -> logical notation, endoporeutically.
   "The interpretation of existential graphs is endoporeutic, that is proceeds
   inwardly" (Peirce, Ms 650, quoted Roberts p.39 n.13).

   Each area is read as a conjunction; the lines of identity whose outermost
   part lies on that area contribute the quantifiers, and each cut contributes
   a negation of the reading of its own area. A line that runs out of an area
   and back in again therefore lands its two ends in an enclosed area as an
   identity — which the cut denies. That is how Peirce's "line through an empty
   cut" (Roberts p.53, Fig. 13) comes out as non-identity.
   ========================================================================== */

const VARNAMES = ['x','y','z','u','v','w','s','t','p','q','r'];

function readGraph(g){
  const st = { n: 0 };
  const ast = readArea(g, g.root, {}, st);
  return ast;
}
function freshVar(st){
  const i = st.n++;
  return i < VARNAMES.length ? VARNAMES[i] : 'x'+(i+1);
}

function readArea(g, areaId, inherited, st){
  const area = g.areas[areaId];
  const lns = area.lns;

  /* 1. components of the line-of-identity graph *on this area* */
  const parent = {};
  const find = a => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const union = (a,b) => { a=find(a); b=find(b); if (a!==b) parent[a]=b; };
  lns.forEach(l => parent[l] = l);
  const here = new Set(lns);
  for (const e of Object.values(g.edges))
    if (here.has(e.a) && here.has(e.b)) union(e.a, e.b);

  /* 2. assign a variable to each component */
  const compVars = {};       // root -> variable name
  const compInherited = {};  // root -> [variables arriving from outside]
  for (const l of lns){
    const r = find(l);
    if (!compInherited[r]) compInherited[r] = [];
    if (inherited[l] !== undefined && !compInherited[r].includes(inherited[l]))
      compInherited[r].push(inherited[l]);
  }
  const fresh = [], eqs = [];
  for (const l of lns){
    const r = find(l);
    if (compVars[r] !== undefined) continue;
    const inh = compInherited[r] || [];
    if (inh.length === 0){ const v = freshVar(st); compVars[r] = v; fresh.push(v); }
    else {
      compVars[r] = inh[0];
      for (let i=1;i<inh.length;i++) eqs.push({t:'eq', l: inh[0], r: inh[i]});
    }
  }
  const varOf = l => compVars[find(l)];

  /* 3. conjuncts */
  const conj = [];
  for (const id of area.items){
    const n = g.nodes[id];
    if (n.k === 'spot'){
      conj.push({t:'atom', name: n.name, args: n.hooks.map(varOf)});
    }
  }
  conj.push(...eqs);
  for (const id of area.items){
    const n = g.nodes[id];
    if (n.k !== 'cut') continue;
    // what does this cut inherit? every edge from this area into its area
    const childInh = {};
    const inSet = new Set(g.areas[n.inner].lns);
    for (const e of Object.values(g.edges)){
      if (here.has(e.a) && inSet.has(e.b)) childInh[e.b] = varOf(e.a);
      else if (here.has(e.b) && inSet.has(e.a)) childInh[e.a] = varOf(e.b);
    }
    const negNode = {t:'not', a: readArea(g, n.inner, childInh, st)};
    const owner = area.cut ? g.nodes[area.cut] : null;
    if (owner && owner.scroll === n.id) negNode.loop = true;   // C4: this is the loop
    conj.push(negNode);
  }

  /* 4. a bare line of identity with nothing on it still asserts existence (C6) */
  let body = conj.length === 0 ? {t:'true'}
           : conj.length === 1 ? conj[0]
           : {t:'and', xs: conj};
  for (let i = fresh.length-1; i>=0; i--) body = {t:'ex', v: fresh[i], a: body};
  return body;
}

/* --- turn the raw ¬/∧ reading into familiar connectives ------------------- */
function sugar(a){
  if (!a) return a;
  switch (a.t){
    case 'and': {
      const xs = a.xs.map(sugar).filter(x => x.t !== 'true');
      if (!xs.length) return {t:'true'};
      return xs.length===1 ? xs[0] : {t:'and', xs: flat(xs,'and')};
    }
    case 'not': {
      const inner = a.a;
      if (inner.t === 'true')  return {t:'false'};   // C5: the empty cut is the pseudograph
      if (inner.t === 'not')   return sugar(inner.a); // the double cut
      if (inner.t === 'ex')    return {t:'all', v: inner.v, a: sugar({t:'not', a: inner.a})};
      if (inner.t === 'and'){
        const xs = inner.xs;
        // A scroll laid down by the compiler names its own loop.
        const li = xs.findIndex(x => x.loop);
        if (li >= 0){
          const rest = xs.filter((_,i)=>i!==li);
          const ant = rest.length === 0 ? {t:'true'}
                    : rest.length === 1 ? sugar(rest[0])
                    : {t:'and', xs: flat(rest.map(sugar),'and')};
          const cons = sugar(xs[li].a);
          return ant.t === 'true' ? cons : {t:'imp', a: ant, b: cons};
        }
        const negs = xs.filter(x => x.t === 'not');
        const pos  = xs.filter(x => x.t !== 'not');
        if (negs.length && pos.length === 0)
          return {t:'or', xs: flat(negs.map(x=>sugar(x.a)),'or')};
        if (negs.length){
          const ant  = pos.length===1 ? sugar(pos[0]) : {t:'and', xs: flat(pos.map(sugar),'and')};
          const cons = negs.length===1 ? sugar(negs[0].a)
                                       : {t:'or', xs: flat(negs.map(x=>sugar(x.a)),'or')};
          return {t:'imp', a: ant, b: cons};
        }
      }
      return {t:'not', a: sugar(inner)};
    }
    case 'ex': return {t:'ex', v:a.v, a: sugar(a.a)};
    case 'all': return {t:'all', v:a.v, a: sugar(a.a)};
    default: return a;
  }
}
function flat(xs, t){
  const out = [];
  for (const x of xs){ if (x.t === t) out.push(...x.xs); else out.push(x); }
  return out;
}

/* --- formatting, including the two degenerate graphs ---------------------- */
function fmtFull(a){
  if (!a) return '—';
  if (a.t === 'true')  return '⊤';
  if (a.t === 'false') return '⊥';
  return fmt(a, 0);
}

/* --- a plodding, literal English gloss ------------------------------------ */
function gloss(a, depth){
  depth = depth||0;
  switch(a.t){
    case 'true': return 'the blank sheet (nothing is asserted)';
    case 'false': return 'the pseudograph (the absurd)';
    case 'atom':
      if (!a.args.length) return a.name;
      if (/\s/.test(a.name) || /^[a-z]/.test(a.name)) return spotPhrase(a);
      return a.name+' holds of '+a.args.join(' and ');
    case 'eq': return a.l+' is the very same individual as '+a.r;
    case 'and': return a.xs.map(x=>gloss(x,depth+1)).join(', and ');
    case 'or': return 'either '+a.xs.map(x=>gloss(x,depth+1)).join(', or ');
    case 'not': return 'it is false that '+gloss(a.a, depth+1);
    case 'imp': return 'if '+gloss(a.a,depth+1)+', then '+gloss(a.b,depth+1);
    case 'iff': return gloss(a.a,depth+1)+' just in case '+gloss(a.b,depth+1);
    case 'ex': return 'something, '+a.v+', is such that '+gloss(a.a,depth+1);
    case 'all': return 'anything you please, '+a.v+', is such that '+gloss(a.a,depth+1);
  }
  return '?';
}
