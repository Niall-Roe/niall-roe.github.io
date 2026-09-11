/* ============================================================================
   THE SCRIBE TAB AS A PUZZLE.
   Pick an inference; its premisses are scribed on the sheet; transform them
   one legal move at a time until the sheet says the conclusion. The page knows
   when you have arrived, counts the moves, and can nudge you along the proof
   the library holds. Where the reader watches on the Proofs tab, here they do
   the reasoning.
   ========================================================================== */

/* Propositions to experiment on, for the Start-from list. */
const START_PROPS = [
  { group: 'Alpha — propositions', items: [
    ['P -> Q', 'if P then Q'],
    ['P & Q', 'P and Q'],
    ['P | Q', 'P or Q'],
    ['~P', 'not P'],
    ['~(P & Q)', 'not both P and Q'],
    ['P <-> Q', 'P if and only if Q'],
    ['P -> (Q -> R)', 'if P then, if Q then R'],
    ['(P -> Q) -> P', 'if P implies Q then P'],
    ['(P & Q) -> R', 'if P and Q then R'],
    ['P & (Q | R)', 'P and either Q or R']
  ]},
  { group: 'Beta — with lines of identity', items: [
    ['Ex Fx', 'something is F'],
    ['Ax Fx', 'everything is F'],
    ['Ax (Fx -> Gx)', 'all F is G'],
    ['Ex (Fx & Gx)', 'some F is G'],
    ['Ex (Fx & ~Gx)', 'some F is not G'],
    ['~Ex (Fx & Gx)', 'no F is G'],
    ['Ax Ey Rxy', 'everything bears R to something'],
    ['Ey Ax Rxy', 'something is borne R by everything'],
    ['Ex Ey ~(x=y)', 'there are two things'],
    ['Ax Ey (Cx -> (Axy & Wy))', 'every catholic adores some woman']
  ]}
];

function buildStartList(){
  const sel = $('#d-start');
  if (!sel) return;
  sel.innerHTML = '<option value="">—</option>' + START_PROPS.map(g =>
    '<optgroup label="'+esc(g.group)+'">' +
    g.items.map(([f,l]) => '<option value="'+esc(f)+'">'+esc(l)+' — '+esc(f)+'</option>').join('') +
    '</optgroup>').join('');
  sel.value = 'P -> Q';
  sel.onchange = () => {
    if (!sel.value) return;
    puzzleClear();
    setEditorValue('#d-from', sel.value);
    $('#d-load').click();
  };
}

/* ---- the puzzles ---------------------------------------------------------- */
const PUZ = { list: [], cur: null };

function buildPuzzleList(){
  const sel = $('#z-sel');
  if (!sel) return;
  const list = [];
  // the proof library first: every one comes with a known route
  PROOFS.forEach((p, i) => list.push({
    id: 'lib'+i, title: p.title, prem: p.prem.slice(), goal: p.goal,
    lib: p, steps: p.steps.length - 1
  }));
  // then the textbook exercises the search on this page can manage
  if (typeof BOOK_EXERCISES !== 'undefined')
    BOOK_EXERCISES.forEach((g, gi) => g.items.forEach(([prem, goal], ii) => {
      const key = prem + '|' + goal;
      if (typeof EX_LIBRARY !== 'undefined' && EX_LIBRARY.has(key)) return;   // already above
      list.push({ id: 'ex'+gi+'.'+ii, prem: prem ? prem.split('\n') : [], goal,
                  title: (prem ? prem.split('\n').join(', ') + ' ⊢ ' : '⊢ ') + goal,
                  group: g.group });
    }));
  PUZ.list = list;
  const libOpts = list.filter(x => x.lib).map(x =>
    '<option value="'+x.id+'">'+esc(x.title)+' ('+x.steps+' step'+(x.steps===1?'':'s')+')</option>').join('');
  const exOpts = list.filter(x => !x.lib).map(x =>
    '<option value="'+x.id+'">'+esc(x.title)+'</option>').join('');
  sel.innerHTML = '<option value="">No puzzle — free play</option>' +
    '<optgroup label="From the proof library">' + libOpts + '</optgroup>' +
    '<optgroup label="From forall x: Calgary">' + exOpts + '</optgroup>';
  sel.onchange = () => {
    if (!sel.value){ puzzleClear(); return; }
    const pz = list.find(x => x.id === sel.value);
    if (pz) puzzleStart(pz);
  };
  $('#z-hint').onclick = puzzleHint;
  $('#z-restart').onclick = () => { if (PUZ.cur) puzzleStart(PUZ.cur); };
  $('#z-quit').onclick = () => { sel.value = ''; puzzleClear(); };
  $('#z-show').onclick = () => {
    if (!PUZ.cur || !PUZ.cur.lib) return;
    const i = PROOFS.indexOf(PUZ.cur.lib);
    $$('nav.tabs button').find(b => b.dataset.tab === 'proofs').click();
    $('#pf-sel').value = i; pfLoad(i);
  };
}

function puzzleStart(pz){
  PUZ.cur = pz;
  let prems, goal;
  try {
    prems = pz.prem.map(f => compileFormula(parseFormula(f)).graph);
    goal = compileFormula(parseFormula(pz.goal)).graph;
  } catch(e){ $('#z-status').textContent = 'Could not set this puzzle up: ' + e.message; return; }
  ED.goal = { graph: goal, canon: canonGraph(goal), reached: false };
  ED.moves = 0;
  const start = $('#d-start'); if (start) start.value = '';     // the sheet is the puzzle's now
  ED.hist = [];
  ED.g = juxtapose(prems); ED.sel = null; ED.pick = [];
  $('#z-body').style.display = '';
  $('#z-note').style.display = 'none';
  $('#z-show').style.display = pz.lib ? '' : 'none';
  stageSvg($('#z-goal'), goal, { shade: true, wobble: true, colourLines: PREFS.colour, maxH: 140 });
  try { $('#z-goalread').textContent = 'Goal: ' + fmtFull(sugar(readGraph(goal))); } catch(e){}
  drawRender();
  syncScribeBoxes('graph');
}

function puzzleClear(){
  PUZ.cur = null; ED.goal = null; ED.moves = 0;
  $('#z-body').style.display = 'none';
  $('#z-note').style.display = '';
  const sel = $('#z-sel'); if (sel) sel.value = '';
  $('#z-status').textContent = '';
}

/* Called after every redraw of the sheet. */
function puzzleCheck(){
  if (!ED.goal) return;
  const st = $('#z-status');
  const there = canonGraph(ED.g) === ED.goal.canon;
  const n = ED.moves, mv = n === 1 ? '1 move' : n + ' moves';
  if (there){
    if (!ED.goal.reached){ ED.goal.reached = true; }
    let extra = '';
    if (PUZ.cur && PUZ.cur.lib){
      const k = PUZ.cur.steps;
      extra = n <= k ? (n < k ? ' The library takes '+k+'.' : ' That is as short as the library’s.')
                     : ' The library does it in '+k+'.';
    }
    st.innerHTML = '<span class="pill ok">reached</span> in '+mv+'.'+esc(extra);
  } else {
    ED.goal.reached = false;
    st.innerHTML = '<span class="pill mid">not there yet</span> '+mv+' so far.';
  }
}

/* A nudge: if the sheet matches a state on the library's route, point at the
   entry in the Transform panel that takes the next step of that route. */
function puzzleHint(){
  const st = $('#z-status');
  if (!PUZ.cur || !ED.goal){ return; }
  if (!PUZ.cur.lib){
    st.innerHTML = '<span class="pill mid">no route on file</span> This one has no proof in the library to follow; '+
      'the search on the Find a proof tab may manage it.';
    return;
  }
  const h = hydrateProof(PUZ.cur.lib);
  const here = canonGraph(ED.g);
  const at = h.graphs.findIndex(g => canonGraph(g) === here);
  if (at < 0){
    st.innerHTML = '<span class="pill mid">off the library’s route</span> Nothing wrong with that, but there is '+
      'no hint from here. Undo back to a place you recognise, or start again.';
    return;
  }
  if (at === h.graphs.length - 1){ puzzleCheck(); return; }
  const nextCanon = canonGraph(h.graphs[at+1]);
  const idx = DMOVES.findIndex(k => canonGraph(k.h) === nextCanon);
  const rule = PUZ.cur.lib.steps[at+1].rule;
  if (idx < 0){
    st.innerHTML = '<span class="pill mid">hint</span> The library’s next step is '+esc(rule)+
      ', but the panel does not list a matching move here.';
    return;
  }
  const btn = $('#d-moves button[data-i="'+idx+'"]');
  st.innerHTML = '<span class="pill ok">hint</span> The library’s next step is '+esc(rule)+
    ' — the entry now marked in the panel.';
  if (btn){
    $$('#d-moves button.hinted').forEach(b => b.classList.remove('hinted'));
    btn.classList.add('hinted');
    btn.scrollIntoView({ block: 'nearest' });
    previewMove(idx);
  }
}
