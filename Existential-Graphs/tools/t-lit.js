var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
['⊥','~⊥','P -> ⊥','~P -> (P -> ⊥)','P & ⊥','absurd'].forEach(t=>{
  try{ const g=compileFormula(parseFormula(t)).graph;
    print(t+'  =>  '+writeEG(g,true)+'  =>  '+fmtFull(sugar(readGraph(g)))+
      '   taut='+(isAlpha(g)?truthTable(g).tautology:'-'));
  }catch(e){ print(t+'  ERR '+e.message); }
});
LOG.join('\n');
