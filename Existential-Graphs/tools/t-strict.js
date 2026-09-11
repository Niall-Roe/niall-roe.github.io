var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
function pad(s,n){s=String(s);while(s.length<n)s+=' ';return s;}
const T=['Ex (Fx & ~Gx)','Ax (Fx -> Gx)','Ax Ey (Cx -> (Axy & Wy))','P -> Q','Ex Ey ~(x=y)','~A -> (A -> ⊥)'];
for(const t of T){
  const g=compileFormula(parseFormula(t)).graph;
  const strict=fmtStrict(sugar(readGraph(g)),0);
  let same='?';
  try{ same = canonGraph(compileFormula(parseFormula(strict)).graph)===canonGraph(g); }catch(e){ same='ERR '+e.message; }
  print(pad(t,30)+' => '+pad(strict,40)+' reparses to same graph: '+same);
}
// a graph whose spots have spaces
const g2=parseEG('( *x "is a catholic"[x] ( *x "adores"[x,y] *y "is a woman"[y] ) )');
const s2=fmtStrict(sugar(readGraph(g2)),0);
print('phrase spots => '+s2);
try{ print('  reparses: '+(canonGraph(compileFormula(parseFormula(s2)).graph)===canonGraph(g2))); }
catch(e){ print('  reparse ERR '+e.message); }
LOG.join('\n');
