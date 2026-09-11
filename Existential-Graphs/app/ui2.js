/* =============================== SCRIBE ==================================== */
const ED = { g: newGraph(), sel: null, hist: [], pick: [], anim: null };
function edPush(){ ED.hist.push(cloneGraph(ED.g)); if (ED.hist.length > 60) ED.hist.shift(); }
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
  const opts = { shade: $('#d-shade').checked, wobble: true,
                 handles: $('#d-handles').checked, pad: 14 };
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
      h.onclick = ev => { ev.stopPropagation(); togglePick(h.dataset.ln); };
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
    $('#d-gloss').textContent = rd.gloss;
    $('#d-lin2').textContent = writeEG(ED.g) || '(the blank sheet)';
    $('#d-val').innerHTML = valuationBadge(ED.g);
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
  if (ED.pick.length) hint += '  ('+ED.pick.length+' line point'+(ED.pick.length===1?'':'s')+' picked)';
  $('#d-hint').textContent = hint;

  drawMoves();
  if (!ED.quiet) syncScribeBoxes('graph');
}
function togglePick(ln){
  const i = ED.pick.indexOf(ln);
  if (i >= 0) ED.pick.splice(i,1); else ED.pick.push(ln);
  if (ED.pick.length > 2) ED.pick.shift();
  drawRender();
}
$('#d-cut').onclick = () => { edPush(); addCut(ED.g, selArea()); drawRender(); };
$('#d-spot').onclick = () => {
  const name = prompt('The spot — a word or phrase, as Peirce writes “is a catholic”:', 'F');
  if (name === null) return;
  const nh = prompt('How many hooks? (0 for a proposition, 1 for “—is a man”, 2 for “—loves—”)', '0');
  if (nh === null) return;
  edPush(); addSpot(ED.g, selArea(), name.trim() || 'F', Math.max(0, Math.min(6, parseInt(nh)||0)));
  drawRender();
};
$('#d-line').onclick = () => { edPush(); addLn(ED.g, selArea()); drawRender(); };
$('#d-join').onclick = () => {
  if (ED.pick.length !== 2){ alert('Pick two line points first, by clicking the small circles on the lines.'); return; }
  const [a,b] = ED.pick;
  const aa = ED.g.lns[a].area, ab = ED.g.lns[b].area;
  if (!(aa === ab || placeOf(ED.g, aa) === ab || placeOf(ED.g, ab) === aa)){
    alert('No graph may rest partly on one area and partly on another (Roberts p. 50 n. 1).\n'+
          'Two points can be joined only on one area, or across a single cut.');
    return;
  }
  edPush(); addEdge(ED.g, a, b); ED.pick = []; drawRender();
};
$('#d-del').onclick = () => {
  if (!ED.sel) return;
  edPush();
  if (ED.sel.kind === 'node') removeNode(ED.g, ED.sel.id);
  else if (ED.sel.id !== ED.g.root){
    const cut = ED.g.areas[ED.sel.id].cut;
    removeNode(ED.g, cut);
  }
  ED.sel = null; ED.pick = []; drawRender();
};
$('#d-undo').onclick = () => { if (ED.hist.length){ ED.g = ED.hist.pop(); ED.sel=null; ED.pick=[]; drawRender(); } };
$('#d-clear').onclick = () => { edPush(); ED.g = newGraph(); ED.sel=null; ED.pick=[]; drawRender(); };
// Whichever box is used, the other is brought into step, so that the two
// descriptions of the graph on the sheet always agree.
function syncScribeBoxes(from){
  try {
    if (from !== 'lin') setEditorValue('#d-lin', writeEG(ED.g) || '');
    if (from !== 'formula'){
      const f = fmtStrict(sugar(readGraph(ED.g)), 0);
      setEditorValue('#d-from', f);
    }
  } catch(e){ /* a graph with no formula of its own is left alone */ }
}
$('#d-load').onclick = () => {
  try { edPush(); ED.g = compileFormula(parseFormula($('#d-from').value)).graph;
        ED.sel=null; ED.pick=[]; drawRender(); syncScribeBoxes('formula'); }
  catch(e){ $('#d-err').textContent = e.message; }
};
$('#d-loadlin').onclick = () => {
  try { edPush(); ED.g = parseEG($('#d-lin').value); ED.sel=null; ED.pick=[];
        drawRender(); syncScribeBoxes('lin'); }
  catch(e){ $('#d-err').textContent = e.message; }
};
['#d-shade','#d-handles'].forEach(s => $(s).addEventListener('change', drawRender));
// Enter scribes; shift-Enter starts a new line
[['#d-from','#d-load'], ['#d-lin','#d-loadlin']].forEach(([box, btn]) =>
  $(box).addEventListener('keydown', e => {
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

function drawMoves(){
  let mvs;
  try { mvs = legalMoves(ED.g, { dir:'fwd', palette: [], beta: !isAlpha(ED.g), maxNodes: 40 }); }
  catch(e){ $('#d-moves').innerHTML = '<p class="note">—</p>'; return; }
  const seen = new Set(), keep = [];
  for (const mv of mvs){
    let h; try { h = applyMove(ED.g, mv, []); } catch(e){ continue; }
    const k = canonGraph(h);
    if (seen.has(k)) continue;                 // same result by another route
    seen.add(k);
    keep.push({ mv, h, rule: ruleOf(mv.op, true),
                why: shortWhy(describeMove(ED.g, mv, true)),
                where: whereOf(ED.g, mv) });
  }
  if (!keep.length){
    $('#d-moves').innerHTML = '<p class="note">No rule applies to the blank sheet but R5 and C6.</p>';
    return;
  }
  const order = ['R1','R2','R3','R3(a)','R3(b)','R4','R4(a)','R4(a,b)','R5','C6/R2'];
  const rank = r => { const i = order.indexOf(r); return i < 0 ? 99 : i; };
  keep.sort((a,b) => rank(a.rule) - rank(b.rule));
  const counts = {};
  keep.forEach(k => { const key = k.why+'|'+k.where; counts[key] = (counts[key]||0)+1; });
  const seenLabel = {};
  keep.forEach(k => {
    const key = k.why+'|'+k.where;
    if (counts[key] > 1){
      seenLabel[key] = (seenLabel[key]||0)+1;
      k.where = (k.where ? k.where+' ' : '') + '(' + seenLabel[key] + ' of ' + counts[key] + ')';
    }
  });
  const groups = {};
  keep.forEach((k,i) => (groups[k.rule] = groups[k.rule] || []).push({k,i}));
  DMOVES = keep;
  $('#d-moves').innerHTML = Object.keys(groups).map(r =>
    '<div class="movegroup">'+esc(r)+'</div><ul class="moves">'+
    groups[r].map(({k,i}) =>
      '<li><button type="button" class="movebtn" data-i="'+i+'">'+
      '<span class="d">'+esc(k.why)+'</span>'+
      (k.where ? '<span class="w">'+esc(k.where)+'</span>' : '')+
      '</button></li>').join('')+
    '</ul>').join('');
}

/* Hovering or focusing an entry marks, on the drawing, what that move would act
   on — which is what tells the eight double-cut entries apart at a glance. */
function previewMove(i){
  const k = DMOVES[i];
  if (!k || ED.anim) return;
  const opts = { shade: $('#d-shade').checked, wobble: true,
                 handles: $('#d-handles').checked, colourLines: PREFS.colour, pad: 14 };
  const el = $('#d-stage');
  stageSvg(el, ED.g, opts);
  try { markNodes(el, ED.g, geom(ED.g, opts), moveFocus(ED.g, k.mv)); } catch(e){}
}
function unpreview(){ if (!ED.anim) drawRender(); }

$('#d-moves').addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  const k = DMOVES[+b.dataset.i]; if (!k) return;
  edPush();
  const el = $('#d-stage');
  const opts = { shade: $('#d-shade').checked, wobble: true,
                 colourLines: PREFS.colour, markMs: 520, moveMs: 620 };
  ED.anim = playTransition(el, ED.g, k.h, k.mv, opts, () => {
    ED.anim = null; ED.g = k.h; ED.sel = null; ED.pick = []; drawRender();
  });
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
$('#v-ex').innerHTML = V_EXAMPLES.map((e,i)=>'<button data-i="'+i+'">'+esc(e[2])+'</button>').join('');
$('#v-ex').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  const ex = V_EXAMPLES[+b.dataset.i];
  setEditorValue('#v-prem', ex[0].join('\n'));
  setEditorValue('#v-goal', ex[1]);
};
const VV = { steps: null, graphs: null, i: 0, timer: null };
function runProof(hard){
  const premSrc = $('#v-prem').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const goalSrc = $('#v-goal').value.trim();
  $('#v-proofcard').style.display = 'none';
  $('#v-writ-card').style.display = 'none';
  if (!goalSrc){ $('#v-verdict').textContent = 'Give a conclusion.'; return; }
  let prems, goal, premAst, goalAst;
  try {
    premAst = premSrc.map(parseFormula); goalAst = parseFormula(goalSrc);
    prems = premAst.map(a => compileFormula(a).graph);
    goal = compileFormula(goalAst).graph;
  } catch(e){ $('#v-verdict').innerHTML = '<span class="err">'+esc(e.message)+'</span>'; return; }

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
          '<p>The inference fails, so no sequence of the five rules can produce it — '+
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
      const cm = findCountermodel(premAst, goalAst, 3);
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
                      : { timeCap: 6000,  budget: 150000,  maxDepth: 12, slack: 4, beam: 400 };
    let res;
    try { res = findProof(prems, goal, opts); }
    catch(e){ $('#v-verdict').innerHTML = head + '<span class="err">'+esc(e.message)+'</span>'; return; }
    if (res.found){
      $('#v-verdict').innerHTML = head +
        '<p><span class="pill ok">proof found</span> — '+(res.steps.length-1)+
        ' step'+(res.steps.length===2?'':'s')+', '+res.expanded.toLocaleString()+' transformations tried.</p>';
      vLoad(res.steps);
    } else {
      $('#v-verdict').innerHTML = head +
        '<p><span class="pill mid">no proof found within the bound</span></p>'+
        '<p>The search tried '+res.expanded.toLocaleString()+' transformations and stopped. '+
        (beta ? 'Beta is only semi-decidable, so this settles nothing either way. '
              : settled
              ? 'The inference is nevertheless valid, and so by the completeness of Alpha '+
                '(Roberts, Appendix 4) a proof exists. '
              : 'Whether the inference holds is still undecided. ')+
        'Try “search harder”, or work it by hand on the Scribe tab.</p>';
    }
  }, 30);
}
$('#v-go').onclick = () => runProof(false);
$('#v-hard').onclick = () => runProof(true);
function vLoad(steps){
  VV.steps = steps;
  const h = hydrateSteps(steps);
  VV.graphs = h.graphs; VV.mvs = h.mvs; VV.i = 0;
  $('#v-proofcard').style.display = '';
  $('#v-writ-card').style.display = '';
  $('#v-steps').innerHTML = steps.map((s,k) =>
    '<li data-k="'+k+'"><span class="n">'+(k+1)+'</span><span class="r">'+
    esc(s.rule||'premiss')+'</span><span class="w">'+esc(s.why)+'</span></li>').join('');
  vShow(0);
}
function vShow(i, animate){
  if (!VV.steps) return;
  const from = VV.i;
  VV.i = Math.max(0, Math.min(VV.steps.length-1, i));
  if (VV.anim){ VV.anim.cancel(); VV.anim = null; }
  if (animate && VV.i === from + 1){
    VV.anim = playTransition($('#v-stage'), VV.graphs[from], VV.graphs[VV.i], VV.mvs[VV.i],
      { shade:true, wobble:true, colourLines: PREFS.colour, markMs: 620, moveMs: 700 },
      () => { VV.anim = null; });
  } else if (animate && VV.i === from - 1){
    VV.anim = playTransition($('#v-stage'), VV.graphs[from], VV.graphs[VV.i], null,
      { shade:true, wobble:true, colourLines: PREFS.colour, markMs: 0, moveMs: 560 },
      () => { VV.anim = null; });
  } else {
    stageSvg($('#v-stage'), VV.graphs[VV.i], { shade:true, wobble:true });
  }
  const s = VV.steps[VV.i];
  $('#v-why').innerHTML = '<b>'+esc(s.rule||'Premiss')+'</b> — '+esc(s.why)+
    '<br><span class="mono" style="font-size:12px;color:var(--ink3)">'+
    esc(fmtFull(sugar(readGraph(VV.graphs[VV.i]))))+'</span>';
  $$('#v-steps li').forEach(li => li.classList.toggle('cur', +li.dataset.k === VV.i));
  if (WRIT.v) WRIT.v();
}
function vStop(){
  if (VV.timer){ clearTimeout(VV.timer); VV.timer=null; }
  if (VV.anim){ VV.anim.cancel(); VV.anim=null; }
  $('#v-play').textContent='▶ play';
}
$('#v-next').onclick = ()=>{ vStop(); vShow(VV.i+1, true); };
$('#v-prev').onclick = ()=>{ vStop(); vShow(VV.i-1, true); };
$('#v-first').onclick = ()=>{ vStop(); vShow(0); };
$('#v-steps').onclick = e => { const li = e.target.closest('li'); if (li){ vStop(); vShow(+li.dataset.k); } };
$('#v-play').onclick = () => {
  if (VV.timer || VV.anim){ vStop(); return; }
  if (VV.i >= VV.steps.length-1) vShow(0);
  $('#v-play').textContent = '❚❚ pause';
  const advance = () => {
    if (VV.i >= VV.steps.length-1){ vStop(); return; }
    vShow(VV.i+1, true);
    VV.timer = setTimeout(advance, 1700);
  };
  VV.timer = setTimeout(advance, 300);
};
