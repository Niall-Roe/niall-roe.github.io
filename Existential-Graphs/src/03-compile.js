/* ============================================================================
   COMPILE: logical notation -> existential graph.
   C4: the scroll (two cuts, one inside the other) is the sign of the
       conditional de inesse.   C5: the cut precisely denies its contents.
   C3: juxtaposition is conjunction.
   Universal quantification is ¬∃¬ — Roberts p.51, Fig. 5.
   ========================================================================== */

function compileFormula(ast, opts){
  opts = opts || {};
  const g = newGraph();
  const notes = [];
  // binding: variable -> { homeArea, spine: {areaId -> lnId} }
  const env = Object.create(null);

  // Existentially close free variables at the sheet: EG admits no graph with
  // an unoccupied hook (Roberts p.49), so a free variable has no rendering.
  const free = freeVars(ast);
  for (const v of free){
    env[v] = mkBinding(g.root, v);
    notes.push('"'+v+'" occurred free; closed existentially on the sheet of '+
               'assertion. Peirce allows no graph with an empty hook '+
               '(Roberts 1973, p. 49), so a free variable cannot be scribed.');
  }

  function mkBinding(areaId, name){
    const ln = addLn(g, areaId);
    return { home: areaId, name, spine: { [areaId]: ln } };
  }
  // Get (creating if need be) the point of v's line of identity on `area`,
  // extending the line inwards through every intervening cut.
  function spineAt(b, area){
    if (b.spine[area]) return b.spine[area];
    const path = areaPath(g, area);
    const hi = path.indexOf(b.home);
    if (hi < 0) throw new Error('variable used outside its scope');
    let prev = b.spine[b.home];
    for (let i = hi+1; i < path.length; i++){
      const a = path[i];
      if (!b.spine[a]){ b.spine[a] = addLn(g, a); addEdge(g, prev, b.spine[a]); }
      prev = b.spine[a];
    }
    return b.spine[area];
  }

  function comp(a, area){
    switch (a.t){
      case 'atom': {
        const sid = addSpot(g, area, a.name, a.args.length);
        const sp = g.nodes[sid];
        a.args.forEach((v, i) => {
          const b = env[v];
          if (!b) throw new Error('unbound variable '+v);
          addEdge(g, sp.hooks[i], spineAt(b, area));
        });
        return;
      }
      case 'eq': {
        const bl = env[a.l], br = env[a.r];
        if (!bl || !br) throw new Error('unbound variable in identity');
        addEdge(g, spineAt(bl, area), spineAt(br, area));
        return;
      }
      case 'not': compNeg(a.a, area); return;
      case 'true': return;                                  // the blank sheet (C1)
      case 'false': addCut(g, area); return;                  // the empty cut (C5)
      case 'and': a.xs.forEach(x => comp(x, area)); return;
      case 'or': {
        // ¬(¬x₁ ∧ ¬x₂ ∧ …)
        const c = addCut(g, area), inner = g.nodes[c].inner;
        a.xs.forEach(x => { const d = addCut(g, inner); comp(x, g.nodes[d].inner); });
        return;
      }
      case 'imp': {
        // the scroll: antecedent on the outer close, consequent on the inner
        const outer = addCut(g, area), oa = g.nodes[outer].inner;
        comp(a.a, oa);
        const loop = addCut(g, oa);
        g.nodes[outer].scroll = loop;      // C4: this cut is the outer cut of a scroll
        comp(a.b, g.nodes[loop].inner);
        return;
      }
      case 'iff':
        comp({t:'imp', a:a.a, b:a.b}, area);
        comp({t:'imp', a:a.b, b:a.a}, area);
        return;
      case 'ex': {
        const save = env[a.v];
        env[a.v] = mkBinding(area, a.v);
        comp(a.a, area);
        env[a.v] = save;
        return;
      }
      case 'all': {
        // ¬∃v¬φ : one cut, the line of identity on its area, and the denial of
        // φ scribed there — which for φ = A ⊃ B gives Peirce's two-cut figure
        // for 'All A is B' (Roberts p. 52, Fig. 9).
        const outer = addCut(g, area), oa = g.nodes[outer].inner;
        const save = env[a.v];
        env[a.v] = mkBinding(oa, a.v);
        g.nodes[outer].quant = a.v;
        compDenial(a.a, oa);
        env[a.v] = save;
        return;
      }
    }
    throw new Error('cannot compile node '+a.t);
  }

  // scribe the denial of `a` on `area`
  /* The denial that the universal quantifier is built out of.

     "Ax φ" is not a cut the reader wrote; it is a quantifier, and its graph is
     the figure Peirce draws for it — the scroll with the line of identity
     running through, ( *x F ( G ) ) for "all F is G" (Roberts p. 52, Fig. 9).
     Getting there from ¬∃x¬φ means scribing the denial of φ in its tidy form
     rather than enclosing φ whole, which would leave a double cut inside every
     universal on the page. This is the rewriting that compNeg used to do for
     everything, kept for the one place it belongs. */
  function compDenial(a, area){
    switch (a.t){
      case 'false': return;                                // ¬⊥ asserts nothing
      case 'true': addCut(g, area); return;
      case 'not': comp(a.a, area); return;
      case 'imp':                                          // ¬(A ⊃ B) is A and not-B
        comp(a.a, area);
        compDenial(a.b, area);
        return;
      case 'or':                                           // ¬(A ∨ B) is ¬A and ¬B
        a.xs.forEach(x => compDenial(x, area));
        return;
      case 'all': {                                        // ¬∀v φ is ∃v ¬φ
        const save = env[a.v];
        env[a.v] = mkBinding(area, a.v);
        compDenial(a.a, area);
        env[a.v] = save;
        return;
      }
      default: {
        const c = addCut(g, area);
        comp(a, g.nodes[c].inner);
        return;
      }
    }
  }

  /* A denial is a cut round whatever is denied, and nothing else.

     The notation is read from the outside in: the "~" is the cut, and what it
     governs is drawn inside it whole. So "~(Q -> P)" is a cut round the scroll
     for Q ⊃ P, which is ( ( Q ( P ) ) ), not the graph for Q ∧ ¬P. The two say
     the same thing, and R5 will take the outer pair off in one step, but that
     step belongs to the reader and not to the translation. Every case that
     used to be rewritten on the way in — a denied conditional, a denied
     disjunction, a denied universal, a denial of a denial — is now simply
     enclosed. */
  function compNeg(a, area){
    const c = addCut(g, area);
    comp(a, g.nodes[c].inner);
  }


  comp(ast, g.root);
  return { graph: g, notes };
}

/* Every point of a spine is a genuine part of the line of identity: it is the
   outermost such point that fixes whether the line reads 'some' or 'any'
   (Roberts p.51). So nothing here is pruned. */
function freeVars(ast, bound, out){
  bound = bound || new Set(); out = out || [];
  const add = v => { if (!bound.has(v) && !out.includes(v)) out.push(v); };
  switch(ast.t){
    case 'atom': ast.args.forEach(add); break;
    case 'eq': add(ast.l); add(ast.r); break;
    case 'not': freeVars(ast.a, bound, out); break;
    case 'and': case 'or': ast.xs.forEach(x=>freeVars(x,bound,out)); break;
    case 'imp': case 'iff': freeVars(ast.a,bound,out); freeVars(ast.b,bound,out); break;
    case 'ex': case 'all': {
      const b2 = new Set(bound); b2.add(ast.v);
      freeVars(ast.a, b2, out); break;
    }
  }
  return out;
}
