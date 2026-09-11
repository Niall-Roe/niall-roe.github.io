/* ============================================================================
   PARSER for ordinary logical notation.
   AST nodes: {t:'atom',name,args:[]} {t:'eq',l,r} {t:'not',a}
              {t:'and',xs} {t:'or',xs} {t:'imp',a,b} {t:'iff',a,b}
              {t:'ex',v,a} {t:'all',v,a}
   ========================================================================== */

const SYN = {
  not:  ['~','¬','!'],
  and:  ['&','∧','·','•'],
  or:   ['|','∨','+'],
  imp:  ['->','=>','⊃','→'],
  iff:  ['<->','<=>','≡','↔'],
  all:  ['∀'],
  ex:   ['∃']
};

function tokenize(src){
  const T = []; let i = 0;
  const s = src;
  const isIdStart = c => /[A-Za-z_]/.test(c);
  const isId = c => /[A-Za-z0-9_']/.test(c);
  while (i < s.length){
    const c = s[i];
    if (/\s/.test(c)){ i++; continue; }
    // multi-char operators first
    let matched = false;
    for (const [k, list] of Object.entries(SYN)){
      for (const op of list.slice().sort((a,b)=>b.length-a.length)){
        if (s.startsWith(op, i)){ T.push({t:k, s:op, i}); i += op.length; matched = true; break; }
      }
      if (matched) break;
    }
    if (matched) continue;
    if (s.startsWith('<->', i)){ T.push({t:'iff', i}); i+=3; continue; }
    if (c === '(' || c === '['){ T.push({t:'(', i}); i++; continue; }
    if (c === ')' || c === ']'){ T.push({t:')', i}); i++; continue; }
    if (c === ','){ T.push({t:',', i}); i++; continue; }
    if (c === '='){ T.push({t:'=', i}); i++; continue; }
    if (c === '-' && s[i+1] !== '>'){ T.push({t:'not', s:'-', i}); i++; continue; }
    if (isIdStart(c)){
      let j = i; while (j < s.length && isId(s[j])) j++;
      T.push({t:'id', v: s.slice(i,j), i}); i = j; continue;
    }
    throw new ParseError('Unexpected character ' + JSON.stringify(c), i);
  }
  T.push({t:'eof', i: s.length});
  return T;
}

function ParseError(msg, at){ this.message = msg; this.at = at; this.name='ParseError'; }
ParseError.prototype = Object.create(Error.prototype);

// Word forms recognised as operators / quantifiers.
const WORD = {
  not:'not', NOT:'not',
  and:'and', AND:'and',
  or:'or', OR:'or', v:'or',
  implies:'imp', IMPLIES:'imp',
  iff:'iff', IFF:'iff',
  all:'all', ALL:'all', forall:'all', every:'all', A:'all',
  exists:'ex', EXISTS:'ex', some:'ex', E:'ex'
};

function parseFormula(src){
  const T = tokenize(src);
  let p = 0;
  const peek = () => T[p];
  const at = k => T[p].t === k;
  const eat = k => { if (!at(k)) throw new ParseError('Expected '+k+' here', T[p].i); return T[p++]; };
  const isWord = w => T[p].t==='id' && WORD[T[p].v] === w;

  function formula(){ return iff(); }

  function iff(){
    let a = imp();
    while (at('iff') || isWord('iff')){ p++; a = {t:'iff', a, b: imp()}; }
    return a;
  }
  function imp(){
    const a = or();
    if (at('imp') || isWord('implies')){ p++; return {t:'imp', a, b: imp()}; } // right assoc
    return a;
  }
  function or(){
    const xs = [and()];
    while (at('or') || isWord('or')){ p++; xs.push(and()); }
    return xs.length===1 ? xs[0] : {t:'or', xs};
  }
  function and(){
    const xs = [unary()];
    while (at('and') || isWord('and')){ p++; xs.push(unary()); }
    return xs.length===1 ? xs[0] : {t:'and', xs};
  }
  // Quantifier written solid: Ax, Ex, A x, exists x, ∀x …
  const QLET = /^([AE])([a-z][0-9]?'?)$/;
  const QWORD = { all:'all', All:'all', ALL:'all', forall:'all', Forall:'all',
                  every:'all', A:'all',
                  exists:'ex', Exists:'ex', EXISTS:'ex', some:'ex', Some:'ex', E:'ex' };

  function unary(){
    if (at('not')){ p++; return {t:'not', a: unary()}; }
    if (T[p].t==='id' && T[p].v==='not'){ p++; return {t:'not', a: unary()}; }
    // ∀ / ∃ glyph followed by variables
    if (at('all') || at('ex')){
      const kind = T[p].t; p++;
      const vs = varList();
      return vs.reduceRight((acc,v)=>({t:kind, v, a:acc}), unary());
    }
    if (T[p].t === 'id'){
      const w = T[p].v;
      // "Ax", "Ey" — quantifier letter fused to its variable
      const m = QLET.exec(w);
      if (m){
        const kind = m[1]==='A' ? 'all' : 'ex';
        p++;
        return {t:kind, v:m[2], a: unary()};
      }
      // "forall x", "exists x, y", "A x"
      if (QWORD[w] && T[p+1] && T[p+1].t==='id' && /^[a-z]/.test(T[p+1].v)
          && !QLET.test(T[p+1].v)){
        const kind = QWORD[w]; p++;
        const vs = varList();
        return vs.reduceRight((acc,v)=>({t:kind, v, a:acc}), unary());
      }
    }
    return primary();
  }
  function varList(){
    const vs = [];
    for(;;){
      const tk = eat('id');
      if (!/^[a-z]/.test(tk.v))
        throw new ParseError('A quantified variable must start with a lowercase letter; got "'+tk.v+'".', tk.i);
      vs.push(tk.v);
      if (at(',')){ p++; continue; }
      if (at('id') && /^[a-z][0-9]?'?$/.test(T[p].v)) continue;
      break;
    }
    return vs;
  }
  function primary(){
    if (at('(')){
      // "(x)Fx" — the classical universal prefix
      if (T[p+1] && T[p+1].t==='id' && /^[a-z][0-9]?'?$/.test(T[p+1].v)
          && T[p+2] && T[p+2].t===')'){
        const v = T[p+1].v; p += 3;
        return {t:'all', v, a: unary()};
      }
      // "(Ex)Fx", "(∃x)Fx"
      {
        const save = p; p++;
        let kind = null;
        if (at('ex')||at('all')){ kind = T[p].t; p++; }
        else if (T[p].t==='id'){
          const m = QLET.exec(T[p].v);
          if (m){ // "(Ex)"
            kind = m[1]==='A'?'all':'ex';
            p++;
            if (at(')')){ p++; return {t:kind, v:m[2], a: unary()}; }
            p = save;
          } else if (QWORD[T[p].v]){ kind = QWORD[T[p].v]; p++; }
        }
        if (kind && at('id') && /^[a-z]/.test(T[p].v)){
          const vs = varList();
          if (at(')')){ p++; return vs.reduceRight((acc,v)=>({t:kind,v,a:acc}), unary()); }
        }
        p = save;
      }
      p++; const f = formula(); eat(')'); return f;
    }
    if (at('id')){
      const tk = T[p++];
      let name = tk.v, args = [];
      if (at('(')){
        p++;
        if (!at(')')){
          for(;;){ const a = eat('id'); args.push(a.v); if (at(',')){p++;continue;} break; }
        }
        eat(')');
      } else if (/^[A-Z]/.test(name) && name.length > 1){
        // "Fxy" — a predicate letter followed by its variables
        const m = /^([A-Z][A-Za-z0-9_]*?)((?:[a-z][0-9]?'?)+)$/.exec(name);
        if (m) { name = m[1]; args = m[2].match(/[a-z][0-9]?'?/g) || []; }
      }
      if (at('=')){
        p++;
        const r = eat('id');
        if (args.length) throw new ParseError('Identity joins two individual terms.', tk.i);
        return {t:'eq', l:name, r:r.v};
      }
      if (/^[a-z]/.test(name) && args.length===0)
        throw new ParseError('"'+name+'" reads as an individual, not a proposition. '+
          'Use a capital letter for a predicate, e.g. F'+name+'.', tk.i);
      return {t:'atom', name, args};
    }
    throw new ParseError('Expected a formula here.', T[p].i);
  }

  const f = formula();
  if (!at('eof')) throw new ParseError('Unexpected extra input', T[p].i);
  return f;
}

/* --- pretty-print an AST back to notation --------------------------------- */
const GL = { not:'¬', and:'∧', or:'∨', imp:'⊃', iff:'≡',
             all:'∀', ex:'∃' };
// A spot whose name is an English phrase reads with its hooks in place:
// "— is a catholic", "— adores —" (Roberts pp. 48-49).
function spotPhrase(a){
  if (!a.args.length) return a.name;
  const phrase = /\s/.test(a.name) || /^[a-z]/.test(a.name);
  if (!phrase) return a.name+'('+a.args.join(',')+')';
  if (a.args.length === 1) return a.args[0]+' '+a.name;
  if (a.args.length === 2) return a.args[0]+' '+a.name+' '+a.args[1];
  return a.name+'('+a.args.join(',')+')';
}
function fmt(a, outerPrec){
  outerPrec = outerPrec||0;
  const wrap = (s,p) => p < outerPrec ? '('+s+')' : s;
  switch(a.t){
    case 'true':  return '⊤';
    case 'false': return '⊥';
    case 'atom': return spotPhrase(a);
    case 'eq':   return a.l+'='+a.r;
    case 'not':  return GL.not + fmt(a.a, 5);
    case 'and':  return wrap(a.xs.map(x=>fmt(x,4)).join(' '+GL.and+' '), 4);
    case 'or':   return wrap(a.xs.map(x=>fmt(x,3)).join(' '+GL.or+' '), 3);
    case 'imp':  return wrap(fmt(a.a,3)+' '+GL.imp+' '+fmt(a.b,2), 2);
    case 'iff':  return wrap(fmt(a.a,2)+' '+GL.iff+' '+fmt(a.b,2), 1);
    case 'all':  return wrap(GL.all+a.v+' '+fmt(a.a,5), 5);
    case 'ex':   return wrap(GL.ex+a.v+' '+fmt(a.a,5), 5);
  }
  return '?';
}
