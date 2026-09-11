var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
function pad(s,n){s=String(s);while(s.length<n)s+=' ';return s;}
const T=['P -> Q','P | Q','~(P & ~Q)','~~P','Ax Fx','Ax (Fx -> Gx)','Ax (Gx -> ~Hx)',
 'Ex (Fx & ~Gx)','Ax Ey (Cx -> (Axy & Wy))','Ex Ey ~(x=y)','~Ex(Fx & Gx)',
 '(P -> (Q -> R)) -> ((P->Q)->(P->R))','Ax (Fx -> ~Gx)','~(P -> Q)','Ax Ay (x=y -> (Fx -> Fy))'];
for(const t of T){
  const g=compileFormula(parseFormula(t)).graph;
  const w=writeEG(g,true);
  let back='?'; try{ back=fmtFull(sugar(readGraph(parseEG(w)))); }catch(e){ back='ERR '+e.message; }
  print(pad(t,38)+' => '+pad(w,34)+' => '+back);
}
LOG.join('\n');
