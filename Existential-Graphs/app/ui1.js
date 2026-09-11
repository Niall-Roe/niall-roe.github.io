/* ============================================================================
   THE APPLICATION
   ========================================================================== */
const PREFS = { colour: true, hand: false };
const WRIT = { pf: null, v: null };
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---- tabs ---------------------------------------------------------------- */
$$('nav.tabs button').forEach(b => b.onclick = () => {
  $$('nav.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
  $$('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-'+b.dataset.tab));
  refresh(b.dataset.tab);
});
// a panel that was hidden had no width to size its drawing to
function refresh(tab){
  if (tab === 'translate') translate(false);
  else if (tab === 'proofs' && PF.proof) pfShow(PF.i);
  else if (tab === 'draw') drawRender();
  else if (tab === 'prove' && VV.steps) vShow(VV.i);
  else if (tab === 'notes' && typeof demoDrawAll === 'function') demoDrawAll();
}
let __rz;
window.addEventListener('resize', () => {
  clearTimeout(__rz);
  __rz = setTimeout(() => {
    const b = $('nav.tabs button[aria-selected="true"]');
    if (b) refresh(b.dataset.tab);
  }, 150);
});

/* ---- shared rendering helpers -------------------------------------------- */
function stageSvg(el, g, opts){
  el.innerHTML = svgDoc(g, Object.assign({ pad: 12, scale: 1, colourLines: PREFS.colour, hand: PREFS.hand }, opts||{}));
  const svg = el.querySelector('svg');
  if (svg){
    const w = parseFloat(svg.getAttribute('width'));
    const h = parseFloat(svg.getAttribute('height'));
    const availW = Math.max(80, el.clientWidth - 34);
    const availH = (opts && opts.maxH) || 420;
    const k = Math.min(availW / w, availH / h, 2.4);
    svg.setAttribute('width', w * k);
    svg.setAttribute('height', h * k);
  }
  return svg;
}
// three readings of one graph, as Peirce gives three of his Fig. 5 (Roberts p. 39-40)
function readings(g){
  const raw = readGraph(g);
  return { plain: fmtFull(sugar(raw)), literal: fmtFull(raw), gloss: gloss(sugar(raw)) };
}
function valuationBadge(g){
  if (!isAlpha(g)) return '<span class="pill mid">Beta — a finite check only</span>';
  const tt = truthTable(g, 12);
  if (tt.tooBig) return '<span class="pill mid">too many spots to tabulate</span>';
  if (tt.tautology) return '<span class="pill ok">a theorem — true on every assignment</span>';
  if (tt.contradiction) return '<span class="pill bad">absurd — false on every assignment</span>';
  return '<span class="pill mid">contingent</span>';
}

/* ============================ TRANSLATE ==================================== */
/* The wall of examples, set out to be worked through in order. Each group
   follows the conventions it turns on, so that nothing is shown before the
   convention that licenses it: the sheet first, then juxtaposition, then the
   cut, then the scroll; and in Beta the line, the branch, and the points on a
   cut. Several pairs are the same graph written two ways — clicking the second
   of a pair leaves the drawing where it is, which is the lesson. */
const T_EXAMPLES = [
 { group: 'Alpha — the sheet, juxtaposition and the cut', keys: 'C1–C5',
   quote: ['The whole sheet is a graph, and every part of it; so that to scribe a graph upon ' +
           'it is to assert that graph of the universe the sheet represents.',
           'after Peirce, CP 4.396–397'],
   items: [
   ['',            'the blank sheet',        'C1, C2: the sheet is itself a graph, and asserts whatever is scribed on it.'],
   ['P',           'P',                      'C2: scribed on the sheet, it is asserted.'],
   ['P & Q',       'P and Q',                'C3: two graphs side by side are both asserted. There is no sign for "and".'],
   ['~P',          'not P',                  'C5: the cut denies precisely what it encloses.'],
   ['~~P',         'not not P',              'The double cut, drawn as written. R5 removes it, and what is left is P.'],
   ['P & ~P',      'P and not P',            'Absurd, and the drawing shows it: P both on the sheet and denied.'],
   ['~(P & ~P)',   'not both P and not P',   'The law of contradiction.'],
   ['P | ~P',      'P or not P',             'The excluded middle. Worked out in full on the Proofs tab.'],
   ['~(P & Q)',    'not both P and Q',       'One cut round the pair.'],
   ['~P | ~Q',     'not P or not Q',         'De Morgan. The same as the last once R5 has taken off the two double cuts.'],
   ['P -> Q',      'if P then Q',            'C4: the scroll. The antecedent on the outer area, the consequent in the inner.'],
   ['~(P & ~Q)',   'not both P and not Q',   'The same graph again: a conditional is a scroll however it is written.'],
   ['P | Q',       'either P or Q',          'A cut round each, and both inside one more.'],
   ['Q | P',       'either Q or P',          'The same graph. Order is not drawn, so it cannot be mistaken for a difference.'],
   ['P <-> Q',     'P if and only if Q',     'Two scrolls, one each way.'],
   ['(P & Q) -> R','if P and Q then R',      'Both antecedents on the outer area of the scroll.'],
   ['P -> (Q -> R)','if P then if Q then R', 'Exportation. The same as the last once the double cut is removed.'],
   ['(P -> Q) -> P','if P implies Q then P', 'Peirce\u2019s law is the conditional from this to P.'],
   ['P & (Q | R)', 'P and either Q or R',    'Set as an exercise with its distribution.'],
   ['(P -> (Q -> R)) -> ((P->Q)->(P->R))', 'self-distribution', 'Church\u2019s P2, proved on the Proofs tab.']
 ]},
 { group: 'Beta — lines of identity', keys: 'C6–C9',
   quote: ['A chemical atom is quite like a relative [term] in having a definite number of ' +
           'loose ends or “unsaturated bonds”, corresponding to the blanks of the relative.',
           'Peirce, CP 3.469'],
   items: [
   ['Ex Fx',       'something is F',         'C6: a line scribed on the sheet says that something exists; the spot says what it is.'],
   ['Ax Fx',       'everything is F',        'The same line, now oddly enclosed, and so read as "any".'],
   ['~Ex Fx',      'nothing is F',           'One cut round the first of these: what says something is F, denied.'],
   ['Ex (Fx & Gx)','some F is G',            'C7, C8: one branching line, so one individual, holding both spots.'],
   ['Ex (Fx & ~Gx)','some F is not G',       'The branch runs into the cut.'],
   ['Ax (Fx -> Gx)','all F is G',            'The line runs from the outer area of the scroll into the inner.'],
   ['~Ex (Fx & Gx)','no F is G',             'Both spots on one line, and a cut round the pair.'],
   ['Ex (Gx & ~Ux)','some good thing is not ugly', ''],
   ['Ax (Mx -> Dx)','every man will die',    ''],
   ['Ex (Mx & ~Dx)','there is a man who will not die', 'The denial of the last.'],
   ['~Ex (Px)',    'it is false that there is a phoenix', ''],
   ['Ex Ey ~(x=y)','there are two things',   'C9: the points lie on the cut, and so outside it. Two lines that do not meet.'],
   ['Ex Ey Ez ~(x=y & y=z & x=z)', 'three things are not all identical', ''],
   ['Ax Ey Rxy',   'everything bears R to something', ''],
   ['Ey Ax Rxy',   'something is borne R by everything', 'Not the same graph. The order of the lines is the order of the quantifiers.'],
   ['Ax Ey (Mxy -> Lxy)', 'every mother loves some child of hers', ''],
   ['Ax Ey (Cx -> (Axy & Wy))', 'every catholic adores some woman', ''],
   ['Ey Ax (Wy & (Cx -> Axy))', 'some woman is adored by every catholic', 'Again not the same. Compare the two drawings.'],
   ['Ex Ey (Mx & My & Exy)', 'some man eats a man', ''],
   ['Ax Ay (Lxy -> Lyx)', 'loving is mutual', 'Two lines, and the same two hooks taken the other way round.']
 ]}
];
function tOpts(){ return { shade: $('#t-shade').checked, wobble: $('#t-wobble').checked,
                           hookNumbers: $('#t-hooks').checked, colourLines: PREFS.colour, hand: PREFS.hand }; }
const TR = { graph: null, anim: null, timer: 0 };

// Draw the new graph by moving the old one into it, so that what the change to
// the formula does to the graph can be watched rather than guessed.
function drawTranslated(g, animate){
  const el = $('#t-stage');
  if (TR.anim){ TR.anim.cancel(); TR.anim = null; }
  const prev = TR.graph;
  TR.graph = g;
  if (!animate || !prev || !window.playTransition){ stageSvg(el, g, tOpts()); return; }
  let aligned;
  try { aligned = alignGraph(prev, g); } catch(e){ aligned = null; }
  if (!aligned){ stageSvg(el, g, tOpts()); return; }
  TR.graph = aligned;
  TR.anim = playTransition(el, prev, aligned, null,
    Object.assign({ markMs: 0, moveMs: 620 }, tOpts()),
    () => { TR.anim = null; });
}
function translate(animate){
  const src = $('#t-in').value.trim();
  $('#t-err').textContent = '';
  if (!src){
    // C1: the blank sheet is itself a graph, so it is drawn, not described
    const blank = newGraph();
    drawTranslated(blank, animate);
    $('#t-read').textContent = fmtFull(sugar(readGraph(blank)));
    $('#t-gloss').textContent = 'nothing is asserted, and so nothing is denied';
    $('#t-lin').textContent = '(the blank sheet)';
    $('#t-alt').innerHTML = ''; $('#t-notes').innerHTML = '';
    $('#t-val').innerHTML = ''; return; }
  let ast, r;
  try { ast = parseFormula(src); r = compileFormula(ast); }
  catch (e){
    $('#t-err').textContent = e.message + (e.at !== undefined ? '\n' + ' '.repeat(e.at) + '↑' : '');
    return;
  }
  const g = r.graph;
  drawTranslated(g, animate);
  const rd = readings(g);
  $('#t-read').textContent = rd.plain;
  $('#t-gloss').textContent = rd.gloss;
  $('#t-alt').innerHTML = rd.literal !== rd.plain
    ? '<p class="note" style="margin-top:2px">Taking every cut as a bare denial: '+
      '<span class="mono">'+esc(rd.literal)+'</span></p>' : '';
  $('#t-lin').textContent = writeEG(g);
  $('#t-notes').innerHTML = r.notes.map(n => '<div>'+esc(n)+'</div>').join('');
  $('#t-val').innerHTML = valuationBadge(g);
}
$('#t-in').addEventListener('input', () => {
  if (!$('#t-live').checked) return;
  clearTimeout(TR.timer);
  TR.timer = setTimeout(() => translate(true), 420);   // let the typing settle
});
$('#t-in').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); clearTimeout(TR.timer); translate(true); }
});
$('#t-draw').onclick = () => { clearTimeout(TR.timer); translate(true); };
['#t-shade','#t-wobble','#t-hooks'].forEach(s => $(s).addEventListener('change', () => translate(false)));
$('#t-ex').innerHTML = T_EXAMPLES.map((grp, gi) =>
  '<div class="chipgroup"><h3>'+esc(grp.group)+
  ' <span class="cite">'+esc(grp.keys)+'</span></h3>'+
  (grp.quote ? '<blockquote class="peirce">'+grp.quote[0]+
    '<span class="cite">'+esc(grp.quote[1])+'</span></blockquote>' : '')+
  '<div class="chips">'+
  grp.items.map((e, ii) =>
    '<button data-g="'+gi+'" data-i="'+ii+'"'+(e[2] ? ' title="'+esc(e[2])+'"' : '')+
    '>'+esc(e[1])+'</button>').join('')+'</div></div>').join('');
$('#t-ex').onclick = ev => {
  const b = ev.target.closest('button'); if (!b) return;
  const e = T_EXAMPLES[+b.dataset.g].items[+b.dataset.i];
  $$('#t-ex button').forEach(x => x.classList.toggle('on', x === b));
  setEditorValue('#t-in', e[0]);
  $('#t-exsay').innerHTML = e[2] ? esc(e[2]) : '';
  clearTimeout(TR.timer); translate(true);
};

/* --- rebuilding a proof so that it can be animated -------------------------
   A transformation carries node identifiers across (applyMove clones the
   graph), so re-running the proof gives us graphs whose parts can be followed
   from one step to the next. It also tells us which rule acted on what. */
function resolveMove(gA, gB, pal, printed){
  const k = canonGraph(gB);
  let loose = null;
  for (const mv of legalMoves(gA, { dir:'fwd', palette: pal, maxNodes: 120, beta: true })){
    let h; try { h = applyMove(gA, mv, pal); } catch(e){ continue; }
    if (canonGraph(h) === k) return { mv, graph: h };
    // the linear notation cannot always tell apart two points of one ligature
    // lying on the same area; where it cannot, match on what it prints
    if (!loose && printed && writeEG(h, true) === printed) loose = { mv, graph: h };
  }
  return loose;
}
/* Where a step cannot be resolved to a rule application at all, the drawing
   must still not start over. The proof finder searches forwards from the
   premisses and backwards from the conclusion at once, and where the two
   halves meet the graph on the far side was built in the other tree: not one
   part of it is the same object as any part of the step before, though the two
   are drawn the same. alignGraph matches them by shape, so what they have in
   common moves into place instead of the whole diagram blinking out and back.
   Without it every found proof had exactly one step that respawned. */
function carryOver(gPrev, gNext){
  try { return alignGraph(gPrev, gNext); } catch(e){ return gNext; }
}
function hydrateChain(targets, printedAt){
  const pal = subgraphPalette(targets);
  const graphs = [targets[0]], mvs = [null];
  for (let i = 1; i < targets.length; i++){
    const r = resolveMove(graphs[i-1], targets[i], pal, printedAt ? printedAt(i) : undefined);
    graphs.push(r ? r.graph : carryOver(graphs[i-1], targets[i]));
    mvs.push(r ? r.mv : null);
  }
  return { graphs, mvs };
}
function hydrateProof(p){
  if (p._h) return p._h;
  p._h = hydrateChain(p.steps.map(s => parseEG(s.eg)), i => p.steps[i].eg);
  return p._h;
}
// the same, for a proof the finder has just produced
function hydrateSteps(steps){ return hydrateChain(steps.map(s => s.graph)); }

/* ============================== PROOFS ===================================== */
const PF = { proof: null, i: 0, timer: null, anim: null };
// group the list: propositional graphs first, then those with lines of identity
(function(){
  const alpha = [], beta = [];
  PROOFS.forEach((p,i) => {
    let isBeta = false;
    try { isBeta = !isAlpha(parseEG(p.steps[p.steps.length-1].eg)) ||
                   p.prem.some(f => !isAlpha(compileFormula(parseFormula(f)).graph)); } catch(e){}
    (isBeta ? beta : alpha).push('<option value="'+i+'">'+esc(p.title)+'</option>');
  });
  $('#pf-sel').innerHTML =
    '<optgroup label="Alpha — the logic of truth functions">'+alpha.join('')+'</optgroup>'+
    '<optgroup label="Beta — lines of identity and quantification">'+beta.join('')+'</optgroup>';
})();
function pfLoad(i){
  const p = PROOFS[i];
  PF.proof = p; PF.i = 0;
  const h = hydrateProof(p);
  PF.graphs = h.graphs; PF.mvs = h.mvs;
  PF.frame = proofFrame(PF.graphs);
  $('#pf-cite').innerHTML = p.cite ? '<b>'+esc(p.cite)+'</b>' : '';
  $('#pf-note').textContent = p.note || '';
  $('#pf-kv').innerHTML =
    (p.prem.length ? '<dt>premisses</dt><dd>'+p.prem.map(x=>esc(fmtSrc(x))).join('<br>')+'</dd>'
                   : '<dt>from</dt><dd>the blank sheet of assertion</dd>') +
    '<dt>conclusion</dt><dd>'+esc(fmtSrc(p.goal))+'</dd>' +
    '<dt>steps</dt><dd>'+(p.steps.length-1)+'</dd>';
  $('#pf-prov').textContent =
    p.found === 'book' ? 'Each step here is the one printed in the source, and each has been checked against the rules.'
  : p.found === 'hand' ? 'This sequence was worked out for this page, not transcribed; each step has been checked against the rules.'
  : 'This sequence was found by the proof finder in this page, and each step checked against the rules.';
  $('#pf-steps').innerHTML = p.steps.map((s,k) =>
    '<li data-k="'+k+'"><span class="n">'+(k+1)+'</span><span class="r">'+
    esc(s.rule||'premiss')+'</span><span class="w">'+esc(s.why)+'</span></li>').join('');
  pfShow(0);
}
function fmtSrc(s){ try { return fmt(parseFormula(s), 0); } catch(e){ return s; } }
// The sheet a proof is drawn on stays one size from first step to last, sized
// to the largest step, so the drawing never rescales or shifts between steps.
function proofFrame(graphs){
  let W = 0, H = 0;
  for (const g of graphs){ const G = geom(g, {}); W = Math.max(W, G.W); H = Math.max(H, G.H); }
  return { W, H };
}
const pfStepMs = () => 4800 - (+$('#pf-speed').value || 2600);
function pfShow(i, animate){
  const p = PF.proof; if (!p) return;
  const from = PF.i;
  PF.i = Math.max(0, Math.min(p.steps.length-1, i));
  if (PF.anim){ PF.anim.cancel(); PF.anim = null; }
  const g = PF.graphs[PF.i];
  // the slider is labelled speed, so dragging it right must make the step
  // shorter; the value is turned into a duration here
  const speed = pfStepMs();
  if (animate && PF.i === from + 1 && ANIM_ON()){
    PF.anim = playTransition($('#pf-stage'), PF.graphs[from], g, PF.mvs[PF.i],
      { shade:true, wobble:true, colourLines: PREFS.colour, hand: PREFS.hand, frame: PF.frame,
        markMs: Math.round(speed*0.42), moveMs: Math.round(speed*0.48) },
      () => { PF.anim = null; });
    PF.dur = PF.anim.total;
  } else if (animate && PF.i === from - 1 && ANIM_ON()){
    // rewinding is not a rule application, so nothing is marked; the drawing
    // simply runs backwards
    PF.anim = playTransition($('#pf-stage'), PF.graphs[from], g, null,
      { shade:true, wobble:true, colourLines: PREFS.colour, hand: PREFS.hand, frame: PF.frame, markMs: 0,
        moveMs: Math.round(speed*0.4) }, () => { PF.anim = null; });
  } else {
    stageSvg($('#pf-stage'), g, { shade:true, wobble:true, frame: PF.frame });
  }
  const s = p.steps[PF.i];
  $('#pf-why').innerHTML = '<b>'+esc(s.rule ? s.rule : 'Premiss')+'</b> — '+esc(s.why)+
    '<br><span class="mono" style="font-size:12px;color:var(--ink3)">'+
    esc(fmtFull(sugar(readGraph(g))))+'</span>';
  $$('#pf-steps li').forEach(li => li.classList.toggle('cur', +li.dataset.k === PF.i));
  if (WRIT.pf) WRIT.pf();
  const cur = $('#pf-steps li.cur'); if (cur) cur.scrollIntoView({block:'nearest'});
}
$('#pf-sel').onchange = e => { pfStop(); pfLoad(+e.target.value); };
$('#pf-steps').onclick = e => { const li = e.target.closest('li'); if (li){ pfStop(); pfShow(+li.dataset.k); } };
$('#pf-next').onclick = () => { pfStop(); pfShow(PF.i+1, true); };
$('#pf-prev').onclick = () => { pfStop(); pfShow(PF.i-1, true); };
$('#pf-first').onclick = () => { pfStop(); pfShow(0); };
function pfStop(){
  if (PF.timer){ clearTimeout(PF.timer); PF.timer = null; }
  if (PF.anim){ PF.anim.cancel(); PF.anim = null; }
  $('#pf-play').textContent = '▶ play';
}
const ANIM_ON = () => !$('#pf-anim') || $('#pf-anim').checked;
$('#pf-play').onclick = () => {
  if (PF.timer || PF.anim){ pfStop(); return; }
  if (PF.i >= PF.proof.steps.length-1) pfShow(0);
  $('#pf-play').textContent = '❚❚ pause';
  const advance = () => {
    if (PF.i >= PF.proof.steps.length-1){ pfStop(); return; }
    pfShow(PF.i+1, true);
    // wait out the step itself, then leave the drawing standing long enough to
    // be read before the next rule is applied
    const sp = pfStepMs();
    PF.timer = setTimeout(advance, (PF.dur || Math.round(sp*0.9)) + Math.round(sp*0.62));
  };
  PF.timer = setTimeout(advance, 300);
};
