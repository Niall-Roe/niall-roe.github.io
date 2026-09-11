var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
function G(s){ return compileFormula(parseFormula(s)).graph; }
function pad(s,n){s=String(s);while(s.length<n)s+=' ';return s;}
var M={timeCap:9000,budget:250000,maxDepth:12,slack:5,beam:500};
var EX = [
 ['A -> B, A -> C','A -> (B & C)'],
 ['(A & B) -> C','A -> (B -> C)'],
 ['A -> (B -> C)','(A -> B) -> (A -> C)'],
 ['A | (B & C)','(A | B) & (A | C)'],
 ['(A & B) | (A & C)','A & (B | C)'],
 ['A | B, A -> C, B -> D','C | D'],
 ['~A | ~B','~(A & B)'],
 ['A & ~B','~(A -> B)'],
 ['','~A -> (A -> ⊥)'],
 ['','~(A & ~A)'],
 ['','((A -> C) & (B -> C)) -> ((A | B) -> C)'],
 ['','~(A -> B) -> (A & ~B)'],
 ['','(~A | B) -> (A -> B)'],
 ['','~~A -> A'],
 ['~A -> ~B','B -> A'],
 ['A -> B','~A | B'],
 ['','~(A & B) -> (~A | ~B)'],
 ['A -> (B | C)','(A -> B) | (A -> C)'],
 ['','(A -> B) | (B -> A)'],
 ['','((A -> B) -> A) -> A'],
 ['J -> ~J','~J'],
 ['Q -> (Q & ~Q)','~Q'],
 ['K & L','K <-> L'],
 ['(C & D) | E','E | D'],
 ['A <-> B, B <-> C','A <-> C'],
 ['~F -> G, F -> H','G | H'],
 ['(Z & K) | (K & M), K -> D','D'],
 ['~(P -> Q)','~Q'],
 ['~(P -> Q)','P'],
 ['E | F, F | G, ~F','E & G'],
 ['M | (N -> M)','~M -> ~N'],
 ['(M | N) & (O | P), N -> P, ~P','M & O'],
 ['(X & Y) | (X & Z), ~(X & D), D | M','M'],
 ['Q -> Ax Fx','Ax (Q -> Fx)'],
 ['Ex (Q -> Fx)','Q -> Ex Fx'],
 ['Ax (Fx -> Q)','Ex Fx -> Q'],
 ['','Ax (Fx -> Ey Fy)'],
 ['Ax Rxx','Ax Ey Rxy'],
 ['Ax (Fx -> ~Gx)','~Ex (Fx & Gx)'],
 ['~Ex (Fx & Gx)','Ax (Fx -> ~Gx)'],
 ['Ax (Fx -> Gx), Ax (Gx -> Hx)','Ax (Fx -> Hx)'],
 ['Ax (Gx -> Hx), Ex (Fx & Gx)','Ex (Fx & Hx)'],
 ['Ax Ay (Rxy -> x=y)','Rab -> Rba'],
 ['Ex Jx, Ex ~Jx','Ex Ey ~(x=y)']
];
EX.forEach(([pr,go],i)=>{
  let P, Q;
  try{ P = pr?pr.split(',').map(s=>s.trim()).filter(Boolean).map(G):[]; Q=G(go); }
  catch(e){ print(pad(i+1,3)+' PARSE ERR  '+pr+' ⊢ '+go+' :: '+e.message); return; }
  let r; try{ r=findProof(P,Q,M);}catch(e){ print(pad(i+1,3)+' ERR '+e.message); return; }
  print(pad(i+1,3)+' '+(r.found?'✓ '+(r.steps.length-1)+'st':'✗      ')+'  '+pad(pr||'—',34)+' ⊢ '+go);
});
LOG.join('\n');
