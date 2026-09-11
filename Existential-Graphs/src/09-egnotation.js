/* ============================================================================
   A LINEAR NOTATION FOR GRAPHS, so that a graph can be written down exactly.

     P Q            two graphs juxtaposed on one area  (C3: conjunction)
     ( X )          a cut with X on its area            (C5)
     ( )            the empty cut, the pseudograph
     Name           a spot with no hooks
     Name[a,b]      a spot whose hooks lie on the ligatures a and b
     *a             a point of the ligature a on this area
     a~b            the ligatures a and b joined on this area

   A ligature named in a nested area is threaded inwards from its outermost
   occurrence, which is what fixes whether it reads 'some' or 'any' (Roberts
   p. 51).
   ========================================================================== */

function parseEG(src){
  const g = newGraph();
  const lig = Object.create(null);      // name -> { home, spine:{area:ln} }
  let i = 0;

  function ws(){ while (i < src.length && /\s/.test(src[i])) i++; }
  function ident(){
    // a spot whose name has spaces in it — "is a catholic" — is quoted
    if (src[i] === '"'){
      const j = src.indexOf('"', i+1);
      if (j < 0) throw new Error('unclosed quotation at '+i);
      const t = src.slice(i+1, j); i = j+1; return t;
    }
    const m = /^[A-Za-z_][A-Za-z0-9_'.\-]*/.exec(src.slice(i));
    if (!m) throw new Error('expected a name at '+i);
    i += m[0].length;
    return m[0];
  }
  function ligName(){
    const m = /^[a-z][A-Za-z0-9_]*/.exec(src.slice(i));
    if (!m) throw new Error('expected a ligature name at '+i);
    i += m[0].length; return m[0];
  }
  function ensure(name, area){
    let b = lig[name];
    if (!b){ b = lig[name] = { home: area, spine: {} }; b.spine[area] = addLn(g, area); return b.spine[area]; }
    if (b.spine[area]) return b.spine[area];
    const path = areaPath(g, area);
    const hi = path.indexOf(b.home);
    if (hi < 0) throw new Error('ligature "'+name+'" used outside the area it starts on');
    let prev = b.spine[b.home];
    for (let k = hi+1; k < path.length; k++){
      const a = path[k];
      if (!b.spine[a]){ b.spine[a] = addLn(g, a); addEdge(g, prev, b.spine[a]); }
      prev = b.spine[a];
    }
    return b.spine[area];
  }

  function body(area){
    for(;;){
      ws();
      if (i >= src.length) return;
      const c = src[i];
      if (c === ')' || c === '}' || c === '|') return;
      if (c === '"'){
        const name = ident();
        let args = [];
        ws();
        if (src[i] === '['){
          i++;
          for(;;){ ws(); if (src[i]===']'){i++;break;} args.push(ligName()); ws();
            if (src[i]===','){i++;continue;} if (src[i]===']'){i++;break;}
            throw new Error('expected , or ] at '+i); }
        }
        const sid = addSpot(g, area, name, args.length);
        args.forEach((a,k) => addEdge(g, g.nodes[sid].hooks[k], ensure(a, area)));
        continue;
      }
      if (c === '('){
        i++;
        const cut = addCut(g, area);
        body(g.nodes[cut].inner);
        ws();
        if (src[i] !== ')') throw new Error('missing ) at '+i);
        i++;
        continue;
      }
      if (c === '{'){          // { A | B } — a scroll: A on the outer close,
        i++;                   // B on the loop (C4)
        const outer = addCut(g, area), oa = g.nodes[outer].inner;
        body(oa);
        ws();
        if (src[i] !== '|') throw new Error('a scroll needs | between antecedent and consequent, at '+i);
        i++;
        const loop = addCut(g, oa);
        g.nodes[outer].scroll = loop;
        body(g.nodes[loop].inner);
        ws();
        if (src[i] !== '}') throw new Error('missing } at '+i);
        i++;
        continue;
      }
      if (c === '*'){ i++; ensure(ligName(), area); continue; }
      // "a~b" — a join
      const jm = /^([a-z][A-Za-z0-9_]*)\s*~\s*([a-z][A-Za-z0-9_]*)/.exec(src.slice(i));
      if (jm){ i += jm[0].length; addEdge(g, ensure(jm[1], area), ensure(jm[2], area)); continue; }
      const name = ident();
      let args = [];
      ws();
      if (src[i] === '['){
        i++;
        for(;;){
          ws();
          if (src[i] === ']'){ i++; break; }
          args.push(ligName());
          ws();
          if (src[i] === ','){ i++; continue; }
          if (src[i] === ']'){ i++; break; }
          throw new Error('expected , or ] at '+i);
        }
      }
      const sid = addSpot(g, area, name, args.length);
      args.forEach((a,k) => addEdge(g, g.nodes[sid].hooks[k], ensure(a, area)));
    }
  }
  body(g.root);
  ws();
  if (i < src.length) throw new Error('unexpected "'+src[i]+'" at '+i);
  return g;
}

/* --- and back again -------------------------------------------------------- */
function qname(s){ return /^[A-Za-z_][A-Za-z0-9_'.\-]*$/.test(s) ? s : '"'+s+'"'; }
function writeEG(g, plain){
  // Names are assigned area by area, exactly as the endoporeutic reading
  // assigns variables, so that a line running out of an area and back in is
  // written as two ligatures joined on the inner area.
  const st = { n: 0 };
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const fresh = () => alpha[st.n++ % 26] + (st.n > 26 ? String(Math.floor(st.n/26)) : '');
  const hooks = new Set();
  for (const n of Object.values(g.nodes))
    if (n.k === 'spot') n.hooks.forEach(h => hooks.add(h));

  function areaX(aid, inherited, skip){
    const A = g.areas[aid], here = new Set(A.lns);
    const parent = {};
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const union = (x,y) => { x=find(x); y=find(y); if (x!==y) parent[x]=y; };
    A.lns.forEach(l => parent[l] = l);
    for (const e of Object.values(g.edges))
      if (here.has(e.a) && here.has(e.b)) union(e.a, e.b);

    const inh = {}, nameOfComp = {};
    for (const l of A.lns){
      const r = find(l);
      if (!inh[r]) inh[r] = [];
      if (inherited[l] !== undefined && !inh[r].includes(inherited[l])) inh[r].push(inherited[l]);
    }
    const out = [], joins = [], news = [];
    for (const l of A.lns){
      const r = find(l);
      if (nameOfComp[r] !== undefined) continue;
      const got = inh[r] || [];
      if (!got.length){ nameOfComp[r] = fresh(); news.push(nameOfComp[r]); }
      else {
        nameOfComp[r] = got[0];
        for (let i=1;i<got.length;i++) joins.push(got[0]+'~'+got[i]);
      }
    }
    const nm = l => nameOfComp[find(l)];
    // a point is worth writing only if it carries no hook
    const shown = new Set();
    for (const l of A.lns){
      if (hooks.has(l)) continue;
      const k = nm(l);
      if (!shown.has(k)){ shown.add(k); out.push('*'+k); }
    }
    out.push(...joins);
    for (const id of A.items){
      if (id === skip) continue;
      const n = g.nodes[id];
      if (n.k === 'spot'){
        out.push(qname(n.name) + (n.hooks.length ? '['+n.hooks.map(nm).join(',')+']' : ''));
        continue;
      }
      const childInh = {};
      const inSet = new Set(g.areas[n.inner].lns);
      for (const e of Object.values(g.edges)){
        if (here.has(e.a) && inSet.has(e.b)) childInh[e.b] = nm(e.a);
        else if (here.has(e.b) && inSet.has(e.a)) childInh[e.a] = nm(e.b);
      }
      if (!plain && n.scroll && g.nodes[n.scroll] && g.nodes[n.scroll].area === n.inner){
        const loop = n.scroll;
        const sub = areaX(n.inner, childInh, loop);      // the outer close
        const loopSet = new Set(g.areas[g.nodes[loop].inner].lns);
        const oaSet = new Set(g.areas[n.inner].lns);
        const loopInh = {};
        for (const e of Object.values(g.edges)){
          if (oaSet.has(e.a) && loopSet.has(e.b)) loopInh[e.b] = sub.nm(e.a);
          else if (oaSet.has(e.b) && loopSet.has(e.a)) loopInh[e.a] = sub.nm(e.b);
        }
        out.push('{ ' + sub.text + ' | ' + areaX(g.nodes[loop].inner, loopInh).text + ' }');
      } else {
        out.push('( ' + areaX(n.inner, childInh).text + ' )');
      }
    }
    return { text: out.join(' '), nm };
  }
  return areaX(g.root, {}).text;
}
