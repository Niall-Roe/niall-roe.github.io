var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
function G(s){ return compileFormula(parseFormula(s)).graph; }
function pad(s,n){s=String(s);while(s.length<n)s+=' ';return s;}
var M={timeCap:30000,budget:900000,maxDepth:14,slack:8,beam:700};
function tryIt(name, prems, goal){
  const P=prems.map(G), Q=G(goal); const t0=Date.now(); let r;
  try{ r=findProof(P,Q,M);}catch(e){ print(pad(name,30)+' ERROR '+e.message); return; }
  print(pad(name,30)+(r.found? ('✓ '+(r.steps.length-1)+' steps ['+r.steps.slice(1).map(s=>s.rule).join(' ')+']')
                             : ('✗ none '+r.expanded+' exp'))+'  '+(Date.now()-t0)+'ms');
}
tryIt('QN: ~Ex Fx -> Ax ~Fx', ['~Ex Fx'], 'Ax ~Fx');
tryIt('QN: Ax ~Fx -> ~Ex Fx', ['Ax ~Fx'], '~Ex Fx');
tryIt('QN: ~Ax Fx -> Ex ~Fx', ['~Ax Fx'], 'Ex ~Fx');
tryIt('Ex Ay R -> Ay Ex R',  ['Ex Ay Rxy'], 'Ay Ex Rxy');
tryIt('Darii',               ['Ax (Gx -> Hx)','Ex (Fx & Gx)'], 'Ex (Fx & Hx)');
tryIt('Celarent',            ['Ax (Fx -> Gx)','Ax (Gx -> ~Hx)'], 'Ax (Fx -> ~Hx)');
tryIt('Ax(Fx&Gx)->AxFx',     ['Ax (Fx & Gx)'], 'Ax Fx');
tryIt('ExFx|ExGx -> Ex(F|G)',['Ex Fx'], 'Ex (Fx | Gx)');
tryIt('symmetry of identity',['Ex Ey (x=y & Fx)'], 'Ex Ey (y=x & Fx)');
LOG.join('\n');
