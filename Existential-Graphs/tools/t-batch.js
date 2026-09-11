var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
function G(s){ return compileFormula(parseFormula(s)).graph; }
function pad(s,n){s=String(s);while(s.length<n)s+=' ';return s;}
var M={timeCap:25000,budget:900000,maxDepth:14,slack:6,beam:700};
function tryIt(name, prems, goal){
  const P=prems.map(G), Q=G(goal); const t0=Date.now(); let r;
  try{ r=findProof(P,Q,M);}catch(e){ print(pad(name,34)+' ERROR '+e.message); return; }
  const ms=Date.now()-t0;
  print(pad(name,34)+(r.found? ('✓ '+(r.steps.length-1)+' steps  ['+r.steps.slice(1).map(s=>s.rule).join(' ')+']')
                             : ('✗ none  '+r.expanded+' exp'))+'  '+ms+'ms');
}
tryIt('consequentia mirabilis', [], '(~P -> P) -> P');
tryIt('exportation ->',   [], '((P & Q) -> R) -> (P -> (Q -> R))');
tryIt('importation',      [], '(P -> (Q -> R)) -> ((P & Q) -> R)');
tryIt('or of conditionals',[], '(P -> Q) | (Q -> P)');
tryIt('no self-negation', [], '~(P <-> ~P)');
tryIt('dilemma',          [], '((P | Q) -> R) -> ((P -> R) & (Q -> R))');
tryIt('distribution',     [], '(P & (Q | R)) -> ((P & Q) | (P & R))');
tryIt('contraposition',   [], '(P -> Q) -> (~Q -> ~P)');
tryIt('double neg intro', [], 'P -> ~~P');
tryIt('ex falso',         [], '(P & ~P) -> Q');
tryIt('spec transitivity',[], '((P -> Q) & (Q -> R)) -> (P -> R)');
tryIt('reductio',         [], '((P -> Q) & (P -> ~Q)) -> ~P');
tryIt('Frege collapse',   [], '((P -> Q) -> P) -> ((P -> Q) -> Q)');
LOG.join('\n');
