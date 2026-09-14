/* =============================== SCRIBE ==================================== */
const ED = { g: newGraph(), sel: null, hist: [], pick: [], anim: null,
             goal: null, moves: 0 };
// The history records what kind of change is about to be made, so that a
// puzzle can count only applications of the rules and undo can uncount them.
function edPush(kind){
  ED.hist.push({ g: cloneGraph(ED.g), kind: kind || 'edit' });
  if (ED.hist.length > 60) ED.hist.shift();
}
function edSel(kind, id){ ED.sel = { kind, id }; drawRender(); }
function selArea(){
  if (!ED.sel) return ED.g.root;
  if (ED.sel.kind === 'area') return ED.sel.id;
  const n = ED.g.nodes[ED.sel.id];
  return n ? n.area : ED.g.root;
}
function drawRender(){
  if (ED.anim) return;                 // let a running transformation finish
  const el = $('#d-stage');
  // the points of the lines are shown while a rule is armed, whatever the box
  // says, since they are what the line clauses of the rules act on
  const armed = typeof RS !== 'undefined' && !!RS.rule && Object.keys(ED.g.lns).length > 0;
  const opts = { shade: $('#d-shade').checked, wobble: true,
                 handles: $('#d-handles').checked || armed || (ED.sel && ED.sel.kind === 'ln'), pad: 14 };
  let svg;
  try { svg = stageSvg(el, ED.g, opts); }
  catch(e){ $('#d-err').textContent = 'could not draw: '+e.message; return; }
  $('#d-err').textContent = '';

  // selection ring
  if (svg && ED.sel){
    if (ED.sel.kind === 'area'){
      const p = svg.querySelector('[data-area="'+ED.sel.id+'"]');
      if (p) p.classList.add('hl-add');
      else {
        const sa = svg.querySelector('.sa');
        if (sa && ED.sel.id === ED.g.root) sa.setAttribute('stroke','var(--accent)');
      }
    } else if (ED.sel.kind === 'ln'){
      const p = svg.querySelector('.handle[data-ln="'+ED.sel.id+'"]');
      if (p) p.classList.add('sel');
    } else {
      const p = svg.querySelector('[data-node="'+ED.sel.id+'"]');
      if (p) p.classList.add('hl-add');
    }
  }
  if (svg){
    svg.querySelectorAll('[data-node]').forEach(el2 => {
      el2.classList.add('pick');
      el2.onclick = ev => { ev.stopPropagation();
        const id = el2.dataset.node;
        edSel(ED.g.nodes[id].k === 'cut' ? 'area' : 'node',
              ED.g.nodes[id].k === 'cut' ? ED.g.nodes[id].inner : id); };
    });
    svg.querySelectorAll('.handle').forEach(h => {
      h.onclick = ev => { ev.stopPropagation(); edSel('ln', h.dataset.ln); };
      if (ED.pick.includes(h.dataset.ln)) h.classList.add('sel');
    });
    const sa = svg.querySelector('.sa');
    if (sa){ sa.classList.add('pick'); sa.onclick = () => edSel('area', ED.g.root); }
    svg.onclick = () => edSel('area', ED.g.root);
  }

  // what it says
  try {
    const rd = readings(ED.g);
    $('#d-read').textContent = rd.plain;
    $('#d-lin2').textContent = writeEG(ED.g) || '(the blank sheet)';
  } catch(e){ $('#d-read').textContent = '—'; }

  // where we are
  const s = ED.sel;
  let hint = 'Selected: the sheet of assertion.';
  if (s && s.kind === 'area' && s.id !== ED.g.root)
    hint = 'Selected: the area of a cut, '+depthOf(ED.g, s.id)+' cut'+
      (depthOf(ED.g,s.id)===1?'':'s')+' in — '+
      (evenlyEnclosed(ED.g, s.id) ? 'evenly' : 'oddly')+' enclosed.';
  else if (s && s.kind === 'node')
    hint = 'Selected: the spot “'+ED.g.nodes[s.id].name+'”.';
  else if (s && s.kind === 'ln')
    hint = 'Selected: a point of a line of identity.';
  if ($('#d-hint')) $('#d-hint').textContent = hint;

  if (typeof drawRuleCards === 'function') drawRuleCards(); else drawMoves();
  if (typeof armSheet === 'function') armSheet(svg);
  if (!ED.quiet) syncScribeBoxes('graph');
  if (typeof puzzleCheck === 'function') puzzleCheck();
}
/* The board used to carry tools for drawing by hand — a cut, a spot, a line,
   a join, erase anything — which changed the sheet without any rule and left
   no trace in the reader's proof. Everything they did is now a clause of one
   of the rules and is done through its card: a typed graph or a line through
   insertion, a join through R2, a break or a bare line taken up through R1.
   Undo stays, since taking back a move is not a move. */
function edUndo(){
  if (!ED.hist.length) return;
  const h = ED.hist.pop();
  ED.g = h.g; ED.sel = null; ED.pick = [];
  if (typeof RS !== 'undefined'){ RS.rule = null; RS.src = null; RS.lnSrc = null; }
  if (h.kind === 'rule' && ED.moves > 0) ED.moves--;
  drawRender();
}
if ($('#d-undo')) $('#d-undo').onclick = () => {
  edUndo();
  if (ED.trail && ED.trail.length) ED.trail.pop();
  if (typeof drawTrail === 'function') drawTrail();
};
// Whichever box is used, the other is brought into step, so that the two
// descriptions of the graph on the sheet always agree.
function syncScribeBoxes(from){
  if (!$('#d-lin')) return;      // the merged tab has no such boxes
  try {
    if (from !== 'lin') setEditorValue('#d-lin', writeEG(ED.g) || '');
    if (from !== 'formula'){
      const f = fmtStrict(sugar(readGraph(ED.g)), 0);
      setEditorValue('#d-from', f);
    }
  } catch(e){ /* a graph with no formula of its own is left alone */ }
}
if ($('#d-load')) $('#d-load').onclick = () => {
  try { edPush(); ED.g = compileFormula(parseFormula($('#d-from').value)).graph;
        ED.sel=null; ED.pick=[]; drawRender(); syncScribeBoxes('formula'); }
  catch(e){ $('#d-err').textContent = e.message; }
};
if ($('#d-loadlin')) $('#d-loadlin').onclick = () => {
  try { edPush(); ED.g = parseEG($('#d-lin').value); ED.sel=null; ED.pick=[];
        drawRender(); syncScribeBoxes('lin'); }
  catch(e){ $('#d-err').textContent = e.message; }
};
['#d-shade','#d-handles'].forEach(s => $(s).addEventListener('change', drawRender));

/* Drawing as the formula is typed, as on Translate. A half-written formula
   does not parse, and its error is left to stand quietly until the typing
   settles rather than being thrown up on every keystroke. */
const DLIVE = { t: 0 };
function dLive(box, btn){
  clearTimeout(DLIVE.t);
  if (!$('#d-live') || !$('#d-live').checked) return;
  DLIVE.t = setTimeout(() => {
    const raw = $(box).value.trim();
    if (!raw){ $('#d-err').textContent = ''; return; }
    try {
      const g = box === '#d-lin' ? parseEG(raw)
                                 : compileFormula(parseFormula(raw)).graph;
      if (canonGraph(g) === canonGraph(ED.g)){ $('#d-err').textContent = ''; return; }
      $(btn).click();
    } catch(e){ /* still being typed */ }
  }, 420);
}
if ($('#d-from')) $('#d-from').addEventListener('input', () => dLive('#d-from','#d-load'));
if ($('#d-lin')) $('#d-lin').addEventListener('input', () => dLive('#d-lin','#d-loadlin'));
// Enter scribes; shift-Enter starts a new line
[['#d-from','#d-load'], ['#d-lin','#d-loadlin']].forEach(([box, btn]) =>
  $(box) && $(box).addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); $(btn).click(); }
  }));

/* --- the legal moves, offered for experiment ------------------------------
   Two rules the panel has to obey. Every entry must say where it acts, or eight
   entries all reading "a double cut is inserted" are indistinguishable and the
   panel is useless. And applying one must be watchable: this is the one place
   the reader is doing the logic rather than watching it, so it should get the
   same marking and movement the Proofs tab gets. -------------------------- */

// How far in an area lies, in words.
function whereArea(g, area){
  const d = depthOf(g, area);
  if (d === 0) return 'on the sheet';
  if (d === 1) return 'one cut in';
  if (d === 2) return 'two cuts in';
  return d + ' cuts in';
}
function nameOfNode(g, id){
  const n = g.nodes[id];
  if (!n) return 'a graph';
  return n.k === 'spot' ? '“'+n.name+'”' : 'the enclosure ' + whereArea(g, n.inner);
}
// Where this move acts. The line above it already names the graph, so this says
// only where, and never repeats the name.
function whereOf(g, mv){
  switch (mv.op){
    case 'erase':    return whereArea(g, g.nodes[mv.node].area);
    case 'dcOut':    return whereArea(g, g.nodes[mv.cut].area);
    case 'deiterate':
      return 'the one ' + whereArea(g, g.nodes[mv.node].area) +
             ', keeping the one ' + whereArea(g, g.nodes[mv.witness].area);
    case 'iterate':  return 'copied ' + whereArea(g, mv.target);
    case 'insert':   return whereArea(g, mv.area);
    case 'dcIn': {
      const items = (mv.items || []);
      const what = !items.length ? 'around nothing'
        : 'around ' + items.map(i => nameOfNode(g, i)).join(' and ');
      return what + ', ' + whereArea(g, mv.area);
    }
    case 'join':     return 'two points ' + whereArea(g, g.lns[mv.a].area);
    case 'eraseEdge':{ const e = g.edges[mv.edge];
                       return e ? whereArea(g, g.lns[e.a].area) : ''; }
    case 'addLine':  return whereArea(g, mv.area);
    case 'delLine': case 'branch': case 'retract':
                     return whereArea(g, g.lns[mv.ln].area);
    case 'extend':   return 'into the enclosure ' + whereArea(g, g.nodes[mv.cut].inner);
  }
  return '';
}

let DMOVES = [];
function shortWhy(w){ return w.replace(/^R\d[^:]*:\s*/, '').replace(/^C6[^:]*:\s*/,''); }

/* The six permissions, each with whatever it allows here.

   Every rule is named and shown, including the ones that happen to allow
   nothing at this moment, so that the reader sees the whole set rather than a
   list that silently shrinks. R2 is given something to insert — the subgraphs
   of the sheet and of the goal — since a rule that lets you scribe any graph
   whatever is useless with nothing to scribe. Drawing a double cut and taking
   one off are listed apart, as R5 and R6, because a reader looking for the
   second should not have to find it among the first. */
const RULE_GROUPS = [
  ['R1',  'erasure',      'Anything evenly enclosed may go.'],
  ['R2',  'insertion',    'Anything whatever may be scribed on an oddly enclosed area.'],
  ['R3',  'iteration',    'A graph may be scribed again on an area its own place contains.'],
  ['R4',  'deiteration',  'A copy that could have been got by iteration may be erased.'],
  ['R5', 'the double cut drawn',   'A double cut may be drawn round anything, anywhere.'],
  ['R6', 'the double cut removed', 'And taken off wherever one stands.']
];
function ruleBucket(mv){
  const r = ruleOf(mv.op, true);
  if (mv.op === 'dcIn') return 'R5';
  if (mv.op === 'dcOut') return 'R6';
  if (r.slice(0,2) === 'R3' || mv.op === 'branch' || mv.op === 'extend') return 'R3';
  if (r.slice(0,2) === 'R4' || mv.op === 'retract') return 'R4';
  if (r.slice(0,2) === 'R1' || mv.op === 'delLine' || mv.op === 'eraseEdge') return 'R1';
  if (r.slice(0,2) === 'R2' || mv.op === 'join' || mv.op === 'addLine') return 'R2';
  return r;
}
function drawMoveList(){
  let mvs;
  // something to insert: the graphs already in play, and those of the goal
  let pal = [];
  try {
    const gs = [ED.g];
    if (ED.goal && ED.goal.graph) gs.push(ED.goal.graph);
    pal = subgraphPalette(gs);
  } catch(e){ pal = []; }
  try { mvs = legalMoves(ED.g, { dir:'fwd', palette: pal, beta: !isAlpha(ED.g), maxNodes: 40 }); }
  catch(e){ return; }
  const seen = new Set(), keep = [];
  for (const mv of mvs){
    let h; try { h = applyMove(ED.g, mv, pal); } catch(e){ continue; }
    // the same result by another route is dropped, but only within one rule:
    // R1 can erase a double cut and R6 can remove it, and to a reader learning
    // the rules those are two different moves that happen to agree
    const bucket = ruleBucket(mv);
    const k = bucket + '|' + canonGraph(h);
    if (seen.has(k)) continue;
    seen.add(k);
    keep.push({ mv, h, rule: bucket,
                why: shortWhy(describeMove(ED.g, mv, true)),
                where: whereOf(ED.g, mv) });
  }
  const counts = {};
  keep.forEach(k => { const key = k.rule+'|'+k.why+'|'+k.where; counts[key] = (counts[key]||0)+1; });
  const seenLabel = {};
  keep.forEach(k => {
    const key = k.rule+'|'+k.why+'|'+k.where;
    if (counts[key] > 1){
      seenLabel[key] = (seenLabel[key]||0)+1;
      k.where = (k.where ? k.where+' ' : '') + '(' + seenLabel[key] + ' of ' + counts[key] + ')';
    }
  });
  DMOVES = keep;
  const by = {};
  keep.forEach((k,i) => (by[k.rule] = by[k.rule] || []).push({k,i}));
  const host = $('#d-movelist') || $('#d-moves');
  host.innerHTML = RULE_GROUPS.map(([id, name, gloss]) => {
    const here = by[id] || [];
    const head = '<div class="movegroup">'+esc(id.replace('+','').replace('-',''))+
      ' — '+esc(name)+'<span class="gloss">'+esc(gloss)+'</span></div>';
    if (!here.length)
      return head + '<p class="note none">Nothing on the sheet to which this applies just now.</p>';
    return head + '<ul class="moves">'+ here.map(({k,i}) =>
      '<li><button type="button" class="movebtn" data-i="'+i+'">'+
      '<span class="d">'+esc(k.why)+'</span>'+
      (k.where ? '<span class="w">'+esc(k.where)+'</span>' : '')+
      '</button></li>').join('') + '</ul>';
  }).join('');
}


/* Hovering or focusing an entry marks, on the drawing, what that move would act
   on — which is what tells the eight double-cut entries apart at a glance. */
function previewMove(i){
  const k = DMOVES[i];
  if (!k || ED.anim) return;
  const opts = { shade: $('#d-shade').checked, wobble: true,
                 handles: $('#d-handles').checked, colourLines: PREFS.colour, hand: PREFS.hand, pad: 14 };
  const el = $('#d-stage');
  stageSvg(el, ED.g, opts);
  try { markNodes(el, ED.g, geom(ED.g, opts), moveFocus(ED.g, k.mv)); } catch(e){}
}
function unpreview(){ if (!ED.anim) drawRender(); }

$('#d-moves').addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  const k = DMOVES[+b.dataset.i]; if (!k) return;
  // the cards own this now, and commit the move before the animation runs
  if (typeof applyRuleMove === 'function'){ applyRuleMove({ mv: k.mv }); return; }
});
$('#d-moves').addEventListener('mouseover', e => {
  const b = e.target.closest('button[data-i]'); if (b) previewMove(+b.dataset.i);
});
$('#d-moves').addEventListener('mouseout', e => {
  const b = e.target.closest('button[data-i]'); if (b) unpreview();
});
$('#d-moves').addEventListener('focusin', e => {
  const b = e.target.closest('button[data-i]'); if (b) previewMove(+b.dataset.i);
});
$('#d-moves').addEventListener('focusout', e => {
  const b = e.target.closest('button[data-i]'); if (b) unpreview();
});

/* ============================== FIND A PROOF =============================== */
const V_EXAMPLES = [
  [['P','P -> Q'],'Q','modus ponens'],
  [['P -> Q','Q -> R'],'P -> R','hypothetical syllogism'],
  [[], '((P -> Q) -> P) -> P', "Peirce's law"],
  [[], '((P -> R) & (Q -> S)) -> ((P & Q) -> (R & S))', 'praeclarum theorema'],
  [['P | Q','~P'],'Q','disjunctive syllogism'],
  [['Ax Fx'],'Ex Fx','existential generalisation'],
  [['Ex (Fx & Gx)'],'Ex Gx','a Beta inference'],
  [['P -> Q'],'Q -> P','invalid — look for the countermodel'],
  [['Ax Ey Rxy'],'Ey Ax Rxy','invalid — order of selection matters']
];
if ($('#v-ex')){
$('#v-ex').innerHTML = V_EXAMPLES.map((e,i)=>'<button data-i="'+i+'">'+esc(e[2])+'</button>').join('');
  $('#v-ex').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const ex = V_EXAMPLES[+b.dataset.i];
    setEditorValue('#v-prem', ex[0].join('\n'));
    setEditorValue('#v-goal', ex[1]);
  };
}

const VV = { steps: null, graphs: null, i: 0, timer: null, run: 0 };
function runProof(hard){
  VV.run++;                                  // anything still running is stale
  const premSrc = $('#v-prem').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const goalSrc = $('#v-goal').value.trim();
  if ($('#v-proofcard')) $('#v-proofcard').style.display = 'none';
  if ($('#v-writ-card')) $('#v-writ-card').style.display = 'none';
  if (!goalSrc){ $('#v-verdict').textContent = 'Give a conclusion.'; return; }
  let prems, goal, premAst, goalAst;
  try {
    premAst = premSrc.map(parseFormula); goalAst = parseFormula(goalSrc);
    prems = premAst.map(a => compileFormula(a).graph);
    goal = compileFormula(goalAst).graph;
  } catch(e){ $('#v-verdict').innerHTML = '<span class="err">'+esc(e.message)+'</span>'; return; }
  if (typeof pfKvFromBoxes === 'function') pfKvFromBoxes(null);

  $('#v-verdict').innerHTML = '<span class="spin"></span>searching…';
  setTimeout(() => {
    const beta = prems.some(p=>!isAlpha(p)) || !isAlpha(goal);
    let head = '', settled = false;
    if (!beta){
      const ent = alphaEntails(prems, goal);
      if (ent.decided && !ent.entails){
        const cm = Object.keys(ent.countermodel).map(a =>
          a+' = '+(ent.countermodel[a] ? 'true' : 'false')).join(', ');
        $('#v-verdict').innerHTML =
          '<p><span class="pill bad">not valid</span></p>'+
          '<p>The inference fails, so no sequence of the rules can produce it — '+
          'the rules are truth-preserving (Roberts, Appendix 4).</p>'+
          '<p class="mono">A countermodel: '+esc(cm)+'</p>';
        return;
      }
      // above eighteen spots the analysis gives up rather than deciding, and a
      // decision it declined to make is not a decision in favour
      settled = ent.decided;
      head = ent.decided
        ? '<p><span class="pill ok">valid</span> — by the truth-value analysis of Roberts §3.2.</p>'
        : '<p><span class="pill mid">too many spots to settle by truth-value analysis</span></p>'+
          '<p>There are more than eighteen distinct spots here, so the table was not '+
          'built. Whether the inference holds is undecided; a proof, if the search '+
          'finds one, would settle it.</p>';
    } else {
      /* The countermodel is looked for in what is actually scribed, not in what
         was typed: a free variable cannot be scribed at all, so the page closes
         it existentially, and a check run on the typed formula would be
         answering a different question. */
      let premRead = premAst, goalRead = goalAst;
      try { premRead = prems.map(readGraph); goalRead = readGraph(goal); } catch(e){}
      const cm = findCountermodel(premRead, goalRead, 3);
      if (cm){
        $('#v-verdict').innerHTML =
          '<p><span class="pill bad">not valid</span></p>'+
          '<p>A countermodel on '+cm.n+' individual'+(cm.n===1?'':'s')+':</p>'+
          '<p class="mono">'+esc(Object.keys(cm.preds).map(k =>
            k.split('/')[0]+' holds of {'+(cm.preds[k].join('; ')||'nothing')+'}').join('  ·  '))+'</p>'+
          '<p class="note">Individuals are numbered from 0.</p>';
        return;
      }
      head = '<p><span class="pill mid">no countermodel on up to three individuals</span></p>';
    }
    const opts = hard ? { timeCap: 30000, budget: 1200000, maxDepth: 14, slack: 6, beam: 700 }
                      : { timeCap: 9000,  budget: 300000,  maxDepth: 12, slack: 4, beam: 400 };
    /* The search is run a slice at a time, so that the page keeps drawing and
       the count of transformations tried can be watched going up. A search
       started later takes over: an older one notices its tag is stale on its
       next slice and stops without reporting. */
    const tag = VV.run;
    let it;
    try { it = searchProof(prems, goal, opts); }
    catch(e){ $('#v-verdict').innerHTML = head + '<span class="err">'+esc(e.message)+'</span>'; return; }
    $('#v-verdict').innerHTML = head +
      '<p><span class="spin"></span>searching &mdash; <span id="v-count" class="mono">0</span>'+
      ' transformations tried</p>';
    const step = paused => {
      if (tag !== VV.run) return;
      let r;
      try { r = it.next(paused); }
      catch(e){ $('#v-verdict').innerHTML = head + '<span class="err">'+esc(e.message)+'</span>'; return; }
      if (!r.done){
        const c = $('#v-count');
        if (c) c.textContent = (r.value.expanded||0).toLocaleString();
        const t = Date.now();
        setTimeout(() => step(Date.now() - t), 0);
        return;
      }
      const res = r.value;
      if (res.found){
        $('#v-verdict').innerHTML = head +
          '<p><span class="pill ok">proof found</span> &mdash; '+(res.steps.length-1)+
          ' step'+(res.steps.length===2?'':'s')+', '+res.expanded.toLocaleString()+
          ' transformations tried.</p>'+
          (res.assumed ? '<p class="note">Found by assuming the antecedent: the search proved '+
            'the consequent from it, and the proof of the whole conditional is built round '+
            'that, starting from a double cut on the blank sheet.</p>' : '');
        pfLoadFound(res.steps, prems, goal);
      } else {
        $('#v-verdict').innerHTML = head +
          '<p><span class="pill mid">no proof found within the bound</span></p>'+
          '<p>The search tried '+res.expanded.toLocaleString()+' transformations and stopped. '+
          (beta ? 'Beta is only semi-decidable, so this settles nothing either way. '
                : settled
                ? 'The inference is nevertheless valid, and so by the completeness of Alpha '+
                  '(Roberts, Appendix 4) a proof exists. '
                : 'Whether the inference holds is still undecided. ')+
          'Try “search harder”, or work it yourself below.</p>';
        if (typeof proveModes === 'function'){ PF.proof = null; PF.found = null; proveModes(); proveMode('work'); }
      }
    };
    step(0);
  }, 30);
}
$('#v-go').onclick = () => runProof(false);
$('#v-hard').onclick = () => runProof(true);
/* The found-proof player is gone: one player now serves both, in ui1. What
   is left here is the search itself and its verdict. */

