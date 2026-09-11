var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
function G(s){ return compileFormula(parseFormula(s)).graph; }
var M={timeCap:40000,budget:1500000,maxDepth:14,slack:7,beam:800};
[['(A & B) | (A & C)','A & (B | C)'],
 ['A | B, A -> C, B -> D','C | D'],
 ['A <-> B, B <-> C','A <-> C'],
 ['(X & Y) | (X & Z), ~(X & D), D | M','M']].forEach(([pr,go])=>{
  const P=pr.split(',').map(s=>s.trim()).map(G), Q=G(go);
  let r; try{r=findProof(P,Q,M);}catch(e){print(pr+' ERR '+e.message);return;}
  print((r.found?'✓ '+(r.steps.length-1)+' steps':'✗ none')+'   '+pr+' ⊢ '+go);
});
LOG.join('\n');
