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

/* The start-from list is gone: the two boxes on the Prove it tab do that job. */
const PUZ = { list: [], cur: null, hint: 0 };
/* The puzzle list is gone: the proof is chosen on the tab above, and its
   conclusion becomes the goal. What is kept is the goal panel and its buttons. */
function buildPuzzleList(){
  const hint = $('#z-hint'), again = $('#z-restart'), show = $('#z-show'), quit = $('#z-quit');
  if (hint) hint.onclick = puzzleHint;
  if (again) again.onclick = () => { if (typeof workFromBoxes === 'function'){ workFromBoxes(); drawRender(); } };
  if (show) show.onclick = () => { if (typeof proveMode === 'function'){ PV.want = 'play'; proveMode('play'); } };
  if (quit) quit.onclick = () => { ED.goal = null; $('#z-body').style.display = 'none';
                                   $('#z-note').style.display = ''; drawRender(); };
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
  ED.hist = [];
  ED.g = juxtapose(prems); ED.sel = null; ED.pick = [];
  $('#z-body').style.display = '';
  $('#z-note').style.display = 'none';
  $('#z-show').style.display = pz.lib ? '' : 'none';
  stageSvg($('#z-goal'), goal, { shade: true, wobble: true, colourLines: PREFS.colour, hand: PREFS.hand, maxH: 92, pad: 8 });
  try { $('#z-goalread').textContent = fmtFull(sugar(readGraph(goal))); } catch(e){}
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
  const box = $('#goal-inline');
  if (!ED.goal){ if (box) box.classList.remove('reached'); return; }
  if (box) box.classList.toggle('reached', canonGraph(ED.g) === ED.goal.canon);
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
/* A hint that gives away as little as it can, and more each time it is asked.

     once   — which rule to use
     twice  — and which graph on the sheet it acts on
     three  — and where to click, with the rule armed and the place marked

   The count goes back to nothing after every move, so each step is asked for
   afresh rather than the reader being handed the rest of the proof. */
function hintReset(){ PUZ.hint = 0; }

function puzzleHint(){
  const st = $('#z-status');
  if (!PUZ.cur || !ED.goal) return;
  if (!PUZ.cur.lib){
    st.innerHTML = '<span class="pill mid">no route on file</span> There is no proof of this one '+
      'on file to follow. Nothing is stopping you finding your own.';
    return;
  }
  const h = hydrateProof(PUZ.cur.lib);
  const here = canonGraph(ED.g);
  const at = h.graphs.findIndex(g => canonGraph(g) === here);
  if (at < 0){
    st.innerHTML = '<span class="pill mid">off the route on file</span> Nothing wrong with that, '+
      'but there is no hint from here. Undo back to somewhere you recognise, or start again.';
    return;
  }
  if (at === h.graphs.length - 1){ puzzleCheck(); return; }

  const want = canonGraph(h.graphs[at+1]);
  const mv = h.mvs[at+1];
  const rule = PUZ.cur.lib.steps[at+1].rule;
  PUZ.hint = Math.min(3, (PUZ.hint || 0) + 1);

  // which card, and which move on this sheet, answers to the library's step
  const card = (typeof ruleBucket === 'function' && mv) ? ruleBucket(mv) : null;
  const match = (typeof RS !== 'undefined' && RS.moves)
    ? RS.moves.find(m => { try { return canonGraph(applyMove(ED.g, m.mv, rulePalette())) === want; }
                          catch(e){ return false; } })
    : null;

  const say = ['<span class="pill ok">hint</span> The next step on file is <b>'+esc(rule)+'</b>.'];
  if (typeof RS !== 'undefined'){ RS.rule = null; }
  if (PUZ.hint >= 2 && match){
    // put the reader's selection on the graph the rule acts from
    const on = match.also || match.target;
    if (on && ED.g.nodes[on]) ED.sel = { kind:'node', id:on };
    else if (on && ED.g.areas[on]) ED.sel = { kind:'area', id:on };
    say.push('It acts on the graph now picked out on the sheet.');
  }
  if (PUZ.hint >= 3 && match){
    if (typeof RS !== 'undefined'){ RS.rule = match.card; }
    say.push('The rule is armed and the place to click is marked in green.');
  } else if (PUZ.hint < 3){
    say.push('<span class="cite">Ask again for more.</span>');
  }
  // the redraw rewrites the status line, so the hint is put back after it
  drawRender();
  st.innerHTML = say.join(' ');
  if (card){
    const el = $('.rulecard[data-rule="'+card+'"]');
    if (el){ el.classList.add('hinted'); el.scrollIntoView({ block:'nearest' }); }
  }
}

