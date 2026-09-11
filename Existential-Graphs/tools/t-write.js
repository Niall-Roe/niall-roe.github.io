var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
function G(s){ return compileFormula(parseFormula(s)).graph; }
var M={timeCap:12000,budget:300000,maxDepth:12,slack:5,beam:500};
var badScroll=0, badPlain=0, n=0, ex=[];
function check(g, tag){
  n++;
  for (const [plain,label] of [[false,'scroll'],[true,'plain']]){
    let w, ok=false;
    try{ w = writeEG(g, plain); ok = canonGraph(parseEG(w))===canonGraph(g); }
    catch(e){ ok=false; w='ERR '+e.message; }
    if (!ok){ if(plain) badPlain++; else badScroll++;
      if (ex.length<6) ex.push(label+' ['+tag+'] '+w); }
  }
}
// every library step
PROOFS.forEach(p => p.steps.forEach((s,i) => check(parseEG(s.eg), p.id+'#'+(i+1))));
// and some freshly found proofs, whose graphs come straight from applyMove
[[[],'((P -> Q) -> P) -> P'],[['P','P -> Q'],'Q'],[['P -> Q','Q -> R'],'P -> R'],
 [[],'(P -> (Q -> R)) -> ((P->Q)->(P->R))'],[['Ax Fx'],'Ex Fx'],
 [['Ex (Fx & Gx)'],'Ex Gx']].forEach(([pr,go])=>{
  const r=findProof(pr.map(G), G(go), M);
  if (r.found) r.steps.forEach((s,i)=>check(s.graph, go+'#'+(i+1)));
});
print('graphs checked: '+n);
print('scroll form not faithful: '+badScroll);
print('plain form not faithful: '+badPlain);
ex.forEach(e=>print('   '+e));
LOG.join('\n');
