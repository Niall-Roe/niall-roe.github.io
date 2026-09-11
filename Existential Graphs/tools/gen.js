var LOG=[]; function print(){ LOG.push(Array.prototype.join.call(arguments,' ')); }
function G(s){ return compileFormula(parseFormula(s)).graph; }
var M={timeCap:45000,budget:1500000,maxDepth:14,slack:6,beam:700};
function J(x){ return JSON.stringify(x); }

function machine(id, title, cite, note, premF, goalF, opts){
  const P = premF.map(G), Q = G(goalF);
  const res = findProof(P, Q, Object.assign({}, M, opts||{}));
  if (!res.found){ print('/* FAILED: '+id+' */'); return; }
  const steps = res.steps.map(s => ({ eg: writeEG(s.graph, true), rule: s.rule, why: s.why }));
  print('{ id:'+J(id)+', title:'+J(title)+', cite:'+J(cite)+', note:'+J(note)+
        ', prem:'+J(premF)+', goal:'+J(goalF)+', found:"machine", steps:'+J(steps)+' },');
}
function hand(id, title, cite, note, premF, goalF, chain){
  const gs = chain.map(parseEG);
  const pal = subgraphPalette(gs);
  const steps = [{ eg: chain[0], rule: null, why: 'The premisses, scribed on the sheet of assertion.' }];
  let ok = true;
  for (let i=1;i<gs.length;i++){
    const k = canonGraph(gs[i]); let hit=null;
    for (const mv of legalMoves(gs[i-1], {dir:'fwd', palette:pal, maxNodes:80, beta:true})){
      let h; try{h=applyMove(gs[i-1],mv,pal);}catch(e){continue;}
      if (canonGraph(h)===k){ hit=mv; break; }
    }
    if (!hit){ ok=false; print('/* UNVERIFIED STEP '+i+' in '+id+' */'); break; }
    steps.push({ eg: chain[i], rule: ruleOf(hit.op,true), why: describeMove(gs[i-1], hit, true) });
  }
  if (!ok) return;
  print('{ id:'+J(id)+', title:'+J(title)+', cite:'+J(cite)+', note:'+J(note)+
        ', prem:'+J(premF)+', goal:'+J(goalF)+', found:"book", steps:'+J(steps)+' },');
}

print('const PROOFS = [');
hand('mp','Modus ponens','Roberts 1973, §3.3(1), p. 45',
  'Peirce’s own illustration. Roberts works on an iterated copy so that the premisses stay on the sheet as a record; here the premisses themselves are transformed, the shorter route he says students prefer.',
  ['P','P -> Q'],'Q',
  ['P { P | Q }','P ( ( Q ) )','P Q','Q']);
machine('em','The excluded middle','', 'A theorem: it is proved from the blank sheet of assertion, which by C1 is itself a graph.', [], 'P | ~P');
machine('hs','Hypothetical syllogism','', 'Chaining two conditionals.', ['P -> Q','Q -> R'], 'P -> R');
machine('dm','De Morgan','', 'The denial of a disjunction.', ['~(P | Q)'], '~P & ~Q');
machine('pl',"Peirce’s law",'', 'The law that marks classical logic off from intuitionistic logic. It is not in Roberts, but it falls to the same five rules.', [], '((P -> Q) -> P) -> P');
machine('p1','Church’s axiom P1','Roberts 1973, Appendix 4, p. 140',
  'Roberts proves Alpha deductively complete by deriving the axioms of Church’s system P. This is the first.', [], 'P -> (Q -> P)');
machine('p2','The self-distributive law','Roberts 1973, §3.3(2), p. 46; Appendix 4, p. 140',
  'Church’s P2. Roberts gives a seven-step proof at p. 46; the sequence here was found by the machine and is of the same length.', [], '(P -> (Q -> R)) -> ((P -> Q) -> (P -> R))',
  {timeCap:60000, budget:2000000});
machine('p3','Church’s axiom P3','Roberts 1973, Appendix 4, p. 140', 'The third axiom of Church’s system P.', [], '(~P -> ~Q) -> (Q -> P)');
machine('prae','Leibniz’s praeclarum theorema','Peirce, MS 514, with Sowa’s commentary',
  'Sowa notes that Whitehead and Russell need 43 steps and five axioms for this; Peirce needs seven from a blank sheet, and no axioms at all.',
  [], '((P -> R) & (Q -> S)) -> ((P & Q) -> (R & S))', {timeCap:60000, budget:2000000});
hand('barbara','The syllogism Barbara','Roberts 1973, §4.3(2), p. 61',
  'Peirce’s favourite. The rule at each step is the one Roberts gives, including the surgery on the lines of identity at steps 4 to 6.',
  ['Ax (Fx -> Gx)','Ax (Gx -> Hx)'],'Ax (Fx -> Hx)',
  ['( *x F[x] ( G[x] ) ) ( *y G[y] ( H[y] ) )',
   '( *x F[x] ( G[x] ( *y G[y] ( H[y] ) ) ) ) ( *z G[z] ( H[z] ) )',
   '( *x F[x] ( G[x] ( *y G[y] ( H[y] ) ) ) )',
   '( *x F[x] ( G[x] *w x~w ( *y G[y] ( H[y] ) ) ) )',
   '( *x F[x] ( G[x] *w x~w ( *w *y G[y] ( H[y] ) ) ) )',
   '( *x F[x] ( G[x] *w x~w ( *w *y w~y G[y] ( H[y] ) ) ) )',
   '( *x F[x] ( G[x] *w x~w ( *w *y w~y ( H[y] ) ) ) )',
   '( *x F[x] ( G[x] H[x] ) )',
   '( *x F[x] ( H[x] ) )']);
machine('selfid','Everything is identical to itself','Roberts 1973, §4.3(3), p. 62',
  'The first of the two axioms of identity. In Peirce’s hands identity is not a predicate but the line itself, so the proof is a matter of scribing a line and closing it into a cycle.', [], 'Ax (x=x)');
machine('exgen','Existential generalisation','',
  'From ‘everything is F’ to ‘something is F’. The step that supplies the existence is C6: an unattached line may always be scribed on the sheet.',
  ['Ax Fx'], 'Ex Fx');
machine('conv','Conversion','', 'A trivial Beta inference, given to show the rules working on lines of identity.',
  ['Ex (Fx & Gx)'], 'Ex (Gx & Fx)');
print('];');
LOG.join('\n');
