/* ============================================================================
   ONE TAB FOR PROVING.

   Choosing a proof, setting one of your own, watching it played, and working it
   by hand were four screens doing two jobs. They are one screen now: a list
   that holds every worked proof and every exercise, two boxes for an inference
   of your own, and then the same proof either played for you or handed to you
   to do.
   ========================================================================== */

/* The list, simple things first: the worked proofs in order of how many steps
   they take, then the exercises in the order the books set them. */
function buildProofList(){
  const sel = $('#pf-sel');
  if (!sel) return;
  const alpha = [], beta = [];
  PROOFS.forEach((p, i) => {
    let isBeta = false;
    try { isBeta = !isAlpha(parseEG(p.steps[p.steps.length-1].eg)) ||
                   p.prem.some(f => !isAlpha(compileFormula(parseFormula(f)).graph)); } catch(e){}
    (isBeta ? beta : alpha).push({ i, n: p.steps.length - 1, t: p.title });
  });
  // a proof of no steps at all shows nothing being done, so it is no way to
  // open: those sort to the end rather than the front
  const rank = n => n === 0 ? 1e6 : n;
  const byLength = a => a.sort((x, y) => rank(x.n) - rank(y.n) || x.t.localeCompare(y.t))
    .map(x => '<option value="lib:'+x.i+'">'+esc(x.t)+
      ' <span>('+x.n+' step'+(x.n===1?'':'s')+')</span>'.replace(/<[^>]+>/g,'')+'</option>').join('');
  let html = '<optgroup label="Worked proofs — Alpha">'+byLength(alpha)+'</optgroup>'+
             '<optgroup label="Worked proofs — Beta">'+byLength(beta)+'</optgroup>';
  BOOK_EXERCISES.forEach((g, gi) => {
    html += '<optgroup label="'+esc(g.group)+'">';
    g.items.forEach(([prem, goal, name], ii) => {
      const label = name || ((prem ? prem.split('\n').join(', ')+' ⊢ ' : '⊢ ') + goal);
      html += '<option value="ex:'+gi+'.'+ii+'">'+esc(label)+'</option>';
    });
    html += '</optgroup>';
  });
  sel.innerHTML = html;
  sel.onchange = () => pfChoose(sel.value);
}

/* A proof the finder has just produced, dressed as a library entry so that one
   player serves both. */
function proofFromSteps(steps, prem, goal){
  return { id:'found', title:'A proof found here', cite:'', note:'', prem: prem, goal: goal,
           found:'machine', _h: hydrateSteps(steps),
           steps: steps.map(s => ({ eg: writeEG(s.graph, true), rule: s.rule, why: s.why })) };
}

/* What is under the buttons restates the inference being worked on. It is
   rewritten the moment the target changes, so it never describes the last
   thing searched for; the step count stays blank until there is a proof. */
function pfKvFromBoxes(steps){
  const kv = $('#pf-kv');
  if (!kv) return;
  const prem = $('#v-prem').value.split('\n').map(x => x.trim()).filter(Boolean);
  const goal = $('#v-goal').value.trim();
  kv.innerHTML =
    (prem.length ? '<dt>premisses</dt><dd>'+prem.map(x=>esc(fmtSrc(x))).join('<br>')+'</dd>'
                 : '<dt>from</dt><dd>the blank sheet of assertion</dd>') +
    '<dt>conclusion</dt><dd>'+(goal ? esc(fmtSrc(goal)) : '&mdash;')+'</dd>' +
    '<dt>steps</dt><dd>'+(steps == null ? '&mdash;' : steps)+'</dd>';
  if (steps == null){
    $('#pf-cite').innerHTML = '';
    $('#pf-note').textContent = '';
    $('#pf-prov').textContent = '';
  }
}

function pfChoose(v){
  if (!v) return;
  pfStop();
  if (v.slice(0,4) === 'lib:'){
    const i = +v.slice(4), p = PROOFS[i];
    setEditorValue('#v-prem', p.prem.join('\n'));
    setEditorValue('#v-goal', p.goal);
    // filling the boxes sets a search going, which would replace the worked
    // proof with one of its own a moment later; this one is already known
    clearTimeout(AUTO.t);
    VV.run++;
    $('#v-verdict').innerHTML = '';
    $('#v-booknote').innerHTML = '';
    pfLoad(i);
    AUTO.last = $('#v-prem').value.trim() + '\u0000' + $('#v-goal').value.trim();
    // a new problem starts a clean board, whichever view is showing
    workFromBoxes();
    proveModes();
    // the tab opens on the board, and after that stays on whichever of the
    // two the reader last chose
    proveMode(PV.want);
    return;
  }
  const [gi, ii] = v.slice(3).split('.').map(Number);
  const [prem, goal, name, note, hard] = BOOK_EXERCISES[gi].items[ii];
  PF.proof = null; PF.found = null; PF.source = null;
  setEditorValue('#v-prem', prem || '');
  setEditorValue('#v-goal', goal);
  $('#v-booknote').innerHTML = note || '';
  pfKvFromBoxes(null);
  AUTO.last = $('#v-prem').value.trim() + '\u0000' + $('#v-goal').value.trim();
  workFromBoxes();
  if (hard){
    // measured as beyond the search; the reader is sent straight to the board.
    // Filling the boxes has already set a search going, so it is called off.
    clearTimeout(AUTO.t);
    VV.run++;
    $('#v-verdict').innerHTML =
      '<p><span class="pill mid">not reached by the search here</span> '+
      'Work it yourself, or pick the worked proof of it from the list above.</p>';
    proveModes(); proveMode('work');
    return;
  }
  clearTimeout(AUTO.t);                // the search is started here, once
  runProof(false);
}

/* Which of the two the reader is doing. Working it by hand is always open;
   watching it done is only open once there is something to watch. */
/* A proof of no steps at all is still a proof: the conclusion was already
   scribed. Requiring one step is what left Automate greyed out on the first
   thing in the list. */
/* Which of the two the reader chose. It starts on working it by hand and
   changes only when they switch; moving between problems keeps it. Where there
   is nothing to watch yet the board is shown meanwhile, and the choice comes
   back as soon as a proof does. */
const PV = { want: 'work' };
function haveProof(){ return !!(PF.proof && PF.proof.steps && PF.proof.steps.length >= 1); }
/* The proof the page has for this problem, found or from the list, as opposed
   to whatever happens to be in the player. */
function haveFound(){ return !!(PF.found && PF.found.steps && PF.found.steps.length >= 1); }
/* Something to watch: a proof the page has, or the reader's own moves. A proof
   worked by hand where the finder found none is as watchable as any other. */
function canWatch(){ return haveFound() || haveTrail(); }
// the inference the boxes hold, to tell whether the board still belongs to it
function boxesKey(){ return $('#v-prem').value.trim() + '\u0000' + $('#v-goal').value.trim(); }

function proveModes(){
  const found = haveFound(), watchable = canWatch();
  $('#pv-play').disabled = !watchable;
  $('#v-searchrow').style.display = found ? 'none' : '';
  $('#v-foundrow').style.display = found ? '' : 'none';
  if (found){
    const n = PF.found.steps.length - 1;
    $('#v-foundpill').textContent = n
      ? 'Proof found — ' + n + ' step' + (n === 1 ? '' : 's')
      : 'Proof found — the conclusion is already scribed';
  }
  if ($('#play-view').style.display === 'none')
    $('#pv-say').textContent = watchable ? '' : 'No proof found, so there is nothing to watch yet.';
  if (!watchable && $('#play-view').style.display !== 'none') proveMode('work');
}
function proveMode(which){
  const play = which === 'play' && canWatch();
  $('#play-view').style.display = play ? '' : 'none';
  $('#work-view').style.display = play ? 'none' : '';
  $('#work-side').style.display = play ? 'none' : '';
  $('#pv-play').classList.toggle('on', play);
  $('#pv-work').classList.toggle('on', !play);
  $('#goal-inline').style.display = play ? 'none' : '';
  $('#quote-inline').style.display = play ? '' : 'none';
  if (play){
    /* Which proof to show on arriving here. A finished piece of work is what
       the reader will want to watch; an unfinished one is a record of trying,
       and playing it back instead of the proof would be no help at all. So a
       completed attempt is shown, and otherwise the found proof is, with the
       attempt one click away either way. Where the page has no proof of its
       own, the reader's work is what there is. */
    const want = trailDone() ? 'you' : (haveFound() ? 'machine' : (haveTrail() ? 'you' : null));
    // a worked proof from the list counts as the proof to watch, just as a found one does
    const showing = PF.source === 'lib' ? 'machine' : PF.source;
    if (want && (showing !== want || !haveProof())){
      if (want === 'you') watchMine();
      else { pfAdopt(PF.found); PF.source = PF.found.id === 'found' ? 'machine' : 'lib'; }
    } else pfShow(PF.i);
    proveSource();
  } else {
    // coming back from watching leaves the board as the reader left it; it is
    // set up afresh only if the problem itself has changed meanwhile
    if (ED.key !== boxesKey()) workFromBoxes();
    drawRender();
  }
}

/* When there are two proofs to hand — the one found and the one made — the
   reader is told which is playing and can take the other. */
function haveTrail(){ return !!(ED.trail && ED.trail.length); }
/* Has the reader actually got there? */
function trailDone(){
  try {
    return haveTrail() && !!ED.goal && canonGraph(ED.g) === ED.goal.canon;
  } catch(e){ return false; }
}

function proveSource(){
  const say = $('#pv-say');
  if (!say) return;
  if ($('#play-view').style.display === 'none'){ say.textContent = ''; return; }
  const mine = haveTrail();
  const found = PF.found && PF.found.steps;
  if (!mine){ say.textContent = ''; return; }
  const isMine = PF.source === 'you';
  const done = trailDone();
  const mineName = done ? 'your proof' : 'how far you got';
  say.innerHTML = 'Watching <b>' + (isMine ? mineName : 'the proof found') + '</b>' +
    (found && mine ? ' &middot; <a href="#" id="pv-other">show ' +
      (isMine ? 'the proof found' : mineName) + '</a>' : '');
  const other = $('#pv-other');
  if (other) other.onclick = e => {
    e.preventDefault();
    if (isMine){ if (PF.found) { pfAdopt(PF.found); PF.source = 'machine'; } }
    else watchMine();
    proveSource();
  };
}
/* Putting a kept proof back into the player. */
function pfAdopt(p){
  PF.proof = p; PF.i = 0;
  pfView(p);
  pfShow(0);
}

/* Handing the inference to the board: the premisses are scribed, and the
   conclusion becomes the goal to reach. */
function workFromBoxes(){
  const prem = $('#v-prem').value.split('\n').map(x => x.trim()).filter(Boolean);
  const goal = $('#v-goal').value.trim();
  let gs = [], gg = null;
  try { gs = prem.map(f => compileFormula(parseFormula(f)).graph); } catch(e){ return; }
  try { gg = goal ? compileFormula(parseFormula(goal)).graph : null; } catch(e){}
  ED.g = gs.length ? juxtapose(gs) : newGraph();
  ED.sel = null; ED.pick = []; ED.hist = [{ g: cloneGraph(gs.length ? juxtapose(gs) : newGraph()), kind:'start' }];
  ED.moves = 0; ED.trail = [];
  ED.key = boxesKey();
  if (typeof drawTrail === 'function') drawTrail();
  ED.goal = gg ? { graph: gg, canon: canonGraph(gg), reached: false } : null;
  // the proof chosen above is what the hint and the move count compare against
  PUZ.cur = (gg && PF.proof && PF.proof.steps && PF.proof.steps.length > 1)
    ? { lib: PF.proof, steps: PF.proof.steps.length - 1 } : (gg ? { lib: null } : null);
  if (gg){
    $('#z-body').style.display = '';
    $('#z-note').style.display = 'none';
    $('#z-show').style.display = PF.proof ? '' : 'none';
    stageSvg($('#z-goal'), gg, { shade:true, wobble:true, colourLines: PREFS.colour,
                                 hand: PREFS.hand, maxH: 92, pad: 8 });
    try { $('#z-goalread').textContent = fmtFull(sugar(readGraph(gg))); } catch(e){}
    $('#goal-inline').classList.remove('reached');
    $('#z-status').textContent = '';
  } else {
    $('#z-body').style.display = 'none';
    $('#z-note').style.display = '';
  }
}

$('#pv-play').onclick = () => { PV.want = 'play'; proveMode('play'); };
$('#pv-work').onclick = () => { PV.want = 'work'; proveMode('work'); };
/* The search runs on its own: as soon as something is chosen, and again a
   moment after the boxes stop changing. Anything already found is dropped the
   instant the inference changes, so Automate never offers a proof of something
   the reader is no longer asking about. */
const AUTO = { t: 0, last: '' };
function autoSearch(){
  clearTimeout(AUTO.t);
  const key = $('#v-prem').value.trim() + '\u0000' + $('#v-goal').value.trim();
  if (key === AUTO.last) return;
  PF.proof = null; PF.graphs = null; PF.found = null;
  $('#v-verdict').innerHTML = '<span class="note">looking…</span>';
  pfKvFromBoxes(null);
  proveModes();
  AUTO.t = setTimeout(() => {
    AUTO.last = key;
    if (!$('#v-goal').value.trim()){ $('#v-verdict').innerHTML = ''; proveModes(); return; }
    runProof(false);
  }, 700);
}
['#v-prem', '#v-goal'].forEach(id => {
  const box = $(id);
  if (box) box.addEventListener('input', autoSearch);
});

$('#v-again').onclick = () => {
  PF.proof = null; PF.graphs = null; PF.found = null;
  $('#v-verdict').innerHTML = '';
  proveModes();
};
