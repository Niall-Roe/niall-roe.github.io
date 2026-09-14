/* ============================================================================
   THE PERMISSIONS, AS SIX CARDS.

   The old panel listed every legal move at once, which is honest but tells the
   reader nothing about which rule they are using. Here each rule has a card of
   its own, and the sheet and the cards talk to each other both ways:

     pick a graph on the sheet  -> the rules that can act on it light up
     pick a rule                -> the places it could act light up as you pass
                                   over them, and clicking one applies it

   Nothing here decides what is legal. Every card asks legalMoves what it may
   do and shows that; a rule with nothing to offer is drawn dim rather than
   hidden, so the set of five is always in view.
   ========================================================================== */

const RULE_CARDS = [
  ['R1',  'Erasure',     'R1', 'Erase anything in an evenly enclosed place.'],
  ['R2',  'Insertion',   'R2', 'Write anything you like in an oddly enclosed place.'],
  ['R3',  'Iteration',   'R3', 'Copy a graph inwards, into any place its own place contains.'],
  ['R4',  'Deiteration', 'R4', 'Erase a copy that iteration could have made.'],
  ['R5',  'Double cut drawn',   'R5', 'Draw two cuts, one just inside the other, round anything.'],
  ['R6',  'Double cut removed', 'R6', 'Take such a pair off, wherever one stands.']
];

const RS = { rule: null, moves: [], pat: null, watchdog: 0, mode: 'formula', raw: '', src: null,
             lnSrc: null };

/* The lines of identity, worked through the same cards. Each rule already has
   its Beta clauses among the legal moves — R1 takes up a bare line or breaks a
   join, R2 puts a line down or joins two, R3 branches a line or carries a loose
   end in through a cut, R4 takes a loose end back — and what they act on is a
   point of a line rather than a graph. So the points on the sheet are targets
   like any graph: click one, and where a move needs a second thing named (the
   point to join it to, the cut to carry it into) the second click names it. */
const LINE_OPS = new Set(['delLine', 'eraseEdge', 'join', 'addLine', 'branch', 'extend', 'retract']);
// the points of a line a move is about
function linePoints(m){
  const mv = m.mv;
  switch (mv.op){
    case 'delLine': case 'branch': case 'retract': case 'extend': return [mv.ln];
    case 'join': return [mv.a, mv.b];
    case 'eraseEdge': { const e = ED.g.edges[mv.edge]; return e ? [e.a, e.b] : []; }
  }
  return [];
}
function lineMovesAt(ln){
  return RS.moves.filter(m => m.card === RS.rule && LINE_OPS.has(m.mv.op) && linePoints(m).includes(ln));
}
const sameTwo = (xs, a, b) => xs.length === 2 && ((xs[0] === a && xs[1] === b) || (xs[0] === b && xs[1] === a));
/* A click on a point of a line, with a rule armed. */
function lineClick(ln){
  if (RS.lnSrc){
    const src = RS.lnSrc;
    const mine = lineMovesAt(src);
    if (ln === src){
      // the same point again: the move that needs nothing more, if there is one
      const single = mine.find(m => ['branch', 'retract', 'delLine'].includes(m.mv.op));
      if (single){ applyRuleMove(single); return; }
      RS.lnSrc = null; drawRuleCards(); return;
    }
    const pair = mine.find(m => (m.mv.op === 'join' || m.mv.op === 'eraseEdge') &&
                                sameTwo(linePoints(m), src, ln));
    if (pair){ applyRuleMove(pair); return; }
    RS.lnSrc = null;                         // not a partner: start from this point instead
  }
  const mine = lineMovesAt(ln);
  if (!mine.length) return;
  // a rule with only one thing it can do at this point does it
  if (mine.length === 1){ applyRuleMove(mine[0]); return; }
  RS.lnSrc = ln;
  drawRuleCards();
}

/* What the selection amounts to: the graph picked, and the area it governs. */
function selCtx(){
  const g = ED.g, s = ED.sel;
  if (!s) return { node: null, area: g.root };
  if (s.kind === 'ln') return { node: null, ln: s.id, area: g.lns[s.id] ? g.lns[s.id].area : g.root };
  if (s.kind === 'area') {
    const cut = g.areas[s.id] && g.areas[s.id].cut;
    return { node: cut || null, area: s.id };
  }
  return { node: s.id, area: g.nodes[s.id] ? g.nodes[s.id].area : g.root };
}

function rulePalette(){
  const gs = [ED.g];
  if (ED.goal && ED.goal.graph) gs.push(ED.goal.graph);
  try {
    const pal = subgraphPalette(gs);
    // a typed graph goes in whole as well as in parts: R2 permits any graph
    // whatever, and "Z & W" is one graph even though its subgraphs are two
    if (RS.pat) pal.push(RS.pat);
    return pal;
  } catch(e){ return RS.pat ? [RS.pat] : []; }
}

/* Every legal move, tagged with the card it belongs to and the thing on the
   sheet it acts upon. */
function ruleMoves(){
  const pal = rulePalette();
  let mvs = [];
  // a Beta problem keeps its line moves even when the sheet has, for the
  // moment, no line on it
  const beta = !isAlpha(ED.g) || !!(ED.goal && ED.goal.graph && !isAlpha(ED.goal.graph));
  try { mvs = legalMoves(ED.g, { dir:'fwd', palette: pal, beta, maxNodes: 40 }); }
  catch(e){ return { pal, list: [] }; }
  const list = [];
  for (const mv of mvs){
    let card = null, target = null, also = null;
    switch (mv.op){
      case 'erase':     card='R1'; target=mv.node; break;
      case 'delLine':   card='R1'; target=mv.ln; break;
      case 'eraseEdge': card='R1'; target=mv.edge; break;
      case 'insert':    card='R2'; target=mv.area; break;
      case 'join':      card='R2'; target=mv.a; break;
      case 'addLine':   card='R2'; target=mv.area; break;
      case 'iterate':   card='R3'; target=mv.target; also=mv.node; break;
      case 'branch':    card='R3'; target=mv.ln; break;
      case 'extend':    card='R3'; target=mv.cut; also=mv.ln; break;
      case 'deiterate': card='R4'; target=mv.node; also=mv.witness; break;
      case 'retract':   card='R4'; target=mv.ln; break;
      // A double cut may be drawn round a graph, not only on an empty patch of
      // an area. Where the move encloses exactly one graph, that graph is what
      // the reader clicks; where it encloses nothing, the area is.
      case 'dcIn':      card='R5';
                        target = (mv.items && mv.items.length === 1) ? mv.items[0] : mv.area;
                        break;
      case 'dcOut':     card='R6'; target=mv.cut; break;
      default: continue;
    }
    list.push({ mv, card, target, also });
  }
  return { pal, list };
}

/* Does this move concern what the reader has picked? */
function touchesSelection(m){
  const c = selCtx();
  const mv = m.mv;
  // a point picked: the moves about that point, and nothing else
  if (c.ln) return LINE_OPS.has(mv.op) && linePoints(m).includes(c.ln);
  if (LINE_OPS.has(mv.op) && mv.op !== 'addLine') return false;
  switch (m.card){
    case 'R1':  return mv.op === 'erase' ? mv.node === c.node : true;
    case 'R2':  return mv.op === 'insert' || mv.op === 'addLine' ? mv.area === c.area : true;
    case 'R3':  return mv.op === 'iterate' ? mv.node === c.node : true;
    // either copy lights the rule: the one that would go, or the one it came from
    case 'R4':  return mv.op === 'deiterate' ? (mv.node === c.node || mv.witness === c.node) : true;
    // with a graph picked, the double cut goes round that graph; with only an
    // area picked, it goes on the area
    case 'R5': return c.node
      ? !!(mv.items && mv.items.length === 1 && mv.items[0] === c.node)
      : mv.area === c.area;
    case 'R6': return mv.cut === c.node;
  }
  return false;
}

function drawRuleCards(){
  const host = $('#d-moves');
  if (!host) return;
  const { list } = ruleMoves();
  RS.moves = list;
  const mine = {};
  for (const m of list) if (touchesSelection(m)) (mine[m.card] = mine[m.card] || []).push(m);
  const anyHere = {};
  for (const m of list) (anyHere[m.card] = anyHere[m.card] || []).push(m);

  host.innerHTML = '<div class="rulecards">' + RULE_CARDS.map(([id, name, tag, gloss]) => {
    const fits = (mine[id] || []).length, any = (anyHere[id] || []).length;
    const cls = 'rulecard' + (fits ? ' fits' : any ? '' : ' dim') + (RS.rule === id ? ' armed' : '');
    return '<button type="button" class="'+cls+'" data-rule="'+id+'"'+(any ? '' : ' disabled')+'>'+
      '<span class="rc-tag">'+tag+'</span>'+
      '<span class="rc-name">'+esc(name)+'</span>'+
      '<span class="rc-gloss">'+esc(gloss)+'</span>'+
      '<span class="rc-n">'+(fits ? fits+' here' : any ? any+' on the sheet' : 'nothing to do')+'</span>'+
      '</button>';
  }).join('') + '</div>' +
  (RS.rule === 'R2' ? insertBox() : '') +
  '<p class="note" id="rs-say">'+esc(ruleSay())+'</p>' +
  '<details class="allmoves"><summary class="note">Every move open to you, in full</summary>'+
  '<div id="d-movelist"></div></details>';
  drawMoveList();
  paintTargets();
}

/* Reading what the reader types.

   "( P )" is a cut round P in the linear notation and plain P in ordinary
   notation, where the brackets only group. Guessing between them gets it wrong
   half the time — typing "( P )" and being handed P is the sort of thing that
   makes a reader distrust the whole page — so the box says which notation it
   is reading and shows what it is about to scribe before anything is scribed.
*/
function insertParse(raw){
  if (!raw.trim()) return { g: null, err: '' };
  try {
    const g = RS.mode === 'lin' ? parseEG(raw)
                                : compileFormula(parseFormula(raw)).graph;
    return { g, err: '' };
  } catch(e){ return { g: null, err: e.message }; }
}
function insertShow(g){
  if (!g) return '<span style="opacity:.6">Type what you want scribed there.</span>';
  let reads = '';
  try { reads = fmtFull(sugar(readGraph(g))); } catch(e){}
  // the plain form, so that what is promised here is written the same way as
  // the line under the sheet will write it
  return 'Will scribe <span class="mono">' + esc(writeEG(g, true) || '(the blank sheet)') + '</span>' +
         (reads ? ' — ' + esc(reads) : '');
}
function insertBox(){
  const c = selCtx();
  const odd = depthOf(ED.g, c.area) % 2 === 1;
  if (!odd) return '<p class="note">Insertion needs an oddly enclosed place. '+
    'Click one on the sheet: anywhere inside an odd number of cuts.</p>';
  const raw = RS.raw || '';
  const { g, err } = insertParse(raw);
  // always present, so that typing can fill it without a redraw
  const shows = '<p class="note insertshow">' + insertShow(g) + '</p>';
  return '<div class="insertbox">'+
    '<label class="fld">The graph to scribe '+esc(whereName(c.area))+'</label>'+
    '<div class="btnrow" style="margin:4px 0 6px">'+
      '<button type="button" class="btn ghost seg'+(RS.mode!=='lin'?' on':'')+'" data-mode="formula">a formula</button>'+
      '<button type="button" class="btn ghost seg'+(RS.mode==='lin'?' on':'')+'" data-mode="lin">linear notation</button>'+
    '</div>'+
    '<input type="text" id="rs-ins" value="'+esc(raw)+'" spellcheck="false" placeholder="'+
      (RS.mode==='lin' ? '( P )  or  *x F[x]' : '~P  or  P &amp; Q')+'">'+
    shows +
    '<div class="btnrow"><button class="btn" id="rs-insgo"'+(g?'':' disabled')+'>Scribe it</button>'+
      (RS.moves.some(m => m.mv.op === 'addLine' && m.mv.area === c.area)
        ? '<button type="button" class="btn ghost" id="rs-insline">Or put down a line of identity</button>' : '')+
    '</div>'+
    '<p class="err" id="rs-inserr">'+esc(err)+'</p></div>';
}

/* Naming what is picked, so that the panel can talk about it in words rather
   than leaving the reader to infer it from a ring on the drawing. */
function nameOf(id){
  const n = ED.g.nodes[id];
  if (!n) return null;
  if (n.k === 'spot') return '\u201c' + n.name + '\u201d';
  const inner = ED.g.areas[n.inner];
  const kids = inner ? inner.items.length : 0;
  return kids ? 'the cut round ' + kids + ' graph' + (kids === 1 ? '' : 's') : 'the empty cut';
}
function whereName(areaId){
  if (areaId === ED.g.root) return 'on the sheet of assertion';
  const d = depthOf(ED.g, areaId);
  return 'inside ' + d + ' cut' + (d === 1 ? '' : 's') +
         ', where it is ' + (d % 2 ? 'oddly' : 'evenly') + ' enclosed';
}

function ruleSay(){
  const c = selCtx();
  const picked = c.node ? nameOf(c.node) : null;
  if (!RS.rule){
    if (c.ln) return 'Picked: a point of a line of identity, ' + whereName(c.area) +
      '. The rules that can act on it are marked.';
    return picked
      ? 'Picked: ' + picked + ', ' + whereName(ED.g.nodes[c.node].area) +
        '. The rules that can act on it are marked.'
      : 'Nothing picked. Click a graph or a point of a line, or click a rule to see where it applies.';
  }
  const name = (RULE_CARDS.find(r => r[0] === RS.rule) || [])[1] || '';
  if (RS.lnSrc){
    const ms = lineMovesAt(RS.lnSrc), ops = new Set(ms.map(m => m.mv.op));
    const bits = [];
    if (ops.has('branch')) bits.push('click the point again to branch the line there');
    if (ops.has('retract')) bits.push('click the point again to take this loose end back');
    if (ops.has('delLine')) bits.push('click the point again to erase the line');
    if (ops.has('extend')) bits.push('click a cut marked in green to carry the line into it');
    if (ops.has('join')) bits.push('click another point marked in green to join the two lines');
    if (ops.has('eraseEdge')) bits.push('click the next point along, marked in green, to break the line between them');
    return name + ', on a point of a line. ' + bits.join('; or ').replace(/^./, c => c.toUpperCase()) + '.';
  }
  if (RS.rule === 'R3' && !iterSource()){
    const n = iterCandidates().length, l = lineCandidates().length;
    if (!n && !l) return 'Iteration. Nothing here can be copied inwards.';
    return 'Iteration. First pick ' + [n ? 'the graph to copy' : '', l ? 'a point of a line to branch or carry inwards' : '']
      .filter(Boolean).join(', or ') + ': marked in green.';
  }
  if (RS.rule === 'R3' && RS.src){
    const here3 = armedMoves();
    return 'Copying ' + (nameOf(RS.src) || 'it') + '. Now pick where it goes: ' +
      here3.length + ' place' + (here3.length === 1 ? '' : 's') + ' marked in green.';
  }
  const here = armedMoves();
  const pts = lineCandidates().length;
  if (!here.length && pts) return name + ': pick a point of a line, marked in green.';
  if (!here.length) return name + ' has nothing to act on here.';
  const what = picked ? ' ' + picked : '';
  const verb = { R1:'Erasing', R2:'Scribing on', R3:'Iterating', R4:'Erasing the copy of',
                 R5:'Drawing a double cut round', R6:'Taking off the double cut' }[RS.rule] || name;
  return verb + what + ': ' + here.length + ' place' + (here.length === 1 ? '' : 's') +
         ' marked in green. Click one, or click the rule again to stop.';
}

/* Which moves the armed rule is offering: those that concern the graph the
   reader has picked, if any do, and otherwise everywhere the rule can act. */
/* Iteration is the one rule that needs two things named: the graph to copy and
   the place to copy it into. It can be done in either order. Picking the graph
   first and then the rule leaves only the places to choose. Picking the rule
   first leaves both, so the graph is chosen by the next click and held in
   RS.src, and only then are the places offered. */
function iterSource(){
  const c = selCtx();
  return RS.src || (c.node && ED.g.nodes[c.node] ? c.node : null);
}
function armedMoves(){
  const all = RS.moves.filter(m => m.card === RS.rule);
  if (RS.lnSrc) return all.filter(m => LINE_OPS.has(m.mv.op) && linePoints(m).includes(RS.lnSrc));
  if (RS.rule === 'R3'){
    const src = iterSource();
    if (!src) return [];                       // nothing to copy yet
    const mine = all.filter(m => m.mv.op !== 'iterate' || m.also === src);
    return mine.length ? mine : all;
  }
  const mine = all.filter(touchesSelection);
  // with nothing picked, the moves about points wait for a point to be clicked
  return mine.length ? mine : all.filter(m => !LINE_OPS.has(m.mv.op) || m.mv.op === 'addLine');
}
// the points the armed rule could act on, before one is chosen
function lineCandidates(){
  const out = new Set();
  for (const m of RS.moves)
    if (m.card === RS.rule && LINE_OPS.has(m.mv.op)) linePoints(m).forEach(l => out.add(l));
  return [...out];
}
/* With iteration armed and nothing yet chosen to copy, the graphs that could
   be copied are what the reader is choosing between. */
function iterCandidates(){
  const seen = new Set(), out = [];
  for (const m of RS.moves)
    if (m.card === 'R3' && m.mv.op === 'iterate' && m.also && !seen.has(m.also)){
      seen.add(m.also); out.push(m.also);
    }
  return out;
}

/* Marking the sheet. With a rule armed, everywhere it could act is shown; with
   a graph picked and no rule armed, the graph itself is shown. */
function paintTargets(){
  const svg = $('#d-stage') && $('#d-stage').querySelector('svg');
  if (!svg) return;
  svg.querySelectorAll('.tgt,.tgt-src').forEach(e => e.classList.remove('tgt','tgt-src'));
  if (!RS.rule) return;
  const point = (ln, cls) => { const h = svg.querySelector('.handle[data-ln="'+ln+'"]'); if (h) h.classList.add(cls); };
  if (RS.lnSrc){
    point(RS.lnSrc, 'tgt-src');
    for (const m of lineMovesAt(RS.lnSrc)){
      if (m.mv.op === 'extend'){
        const c = svg.querySelector('[data-node="'+m.mv.cut+'"]'); if (c) c.classList.add('tgt');
      } else linePoints(m).forEach(l => { if (l !== RS.lnSrc) point(l, 'tgt'); });
    }
    return;
  }
  // before a point is chosen, every point the rule could act on
  if (!(ED.sel && ED.sel.kind === 'ln')) lineCandidates().forEach(l => point(l, 'tgt'));
  if (RS.rule === 'R3' && !iterSource()){
    for (const id of iterCandidates()){
      const el = svg.querySelector('[data-node="'+id+'"]');
      if (el) el.classList.add('tgt');
    }
    return;
  }
  const src = RS.rule === 'R3' ? iterSource() : null;
  if (src){
    const el = svg.querySelector('[data-node="'+src+'"]');
    if (el) el.classList.add('tgt-src');
  }
  const here = armedMoves();
  for (const m of here){
    // the sheet itself is drawn as the backing rectangle, not as a cut, so it
    // has no data-area of its own to find
    const t = m.target === ED.g.root ? svg.querySelector('.sa')
            : (svg.querySelector('[data-area="'+m.target+'"]') ||
               svg.querySelector('[data-node="'+m.target+'"]'));
    if (t) t.classList.add('tgt');
    if (m.also){
      const a = svg.querySelector('[data-node="'+m.also+'"]') ||
                svg.querySelector('[data-area="'+m.also+'"]');
      if (a) a.classList.add('tgt-src');
    }
  }
}

/* Applying one. The move is an ordinary move and is played like any other. */
/* The arrow Peirce's own telegraphing uses in the animation, shown live while
   the reader is deciding: from the graph that would be copied to the place it
   would land, so that what the click will do is visible before it is made. */
function showArrow(svg, fromId, toId){
  clearArrow(svg);
  if (!fromId || !toId) return;
  let G;
  try { G = geom(ED.g, { shade: $('#d-shade').checked, wobble: true }); } catch(e){ return; }
  const a = G.P[fromId];
  const b = G.P[toId] || (ED.g.areas[toId] ? G.P[toId] : null);
  if (!a || !b) return;
  const host = svg.querySelector('g.gr') || svg;
  const d = arrowPath(a, b);
  if (!d) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'liveArrow');
  g.innerHTML = d;
  host.appendChild(g);
}
function clearArrow(svg){
  if (!svg) return;
  svg.querySelectorAll('.liveArrow').forEach(e => e.remove());
}

/* Choosing where to scribe, without scribing anything yet. */
function pickArea(el){
  const id = el.dataset.area || (ED.g.nodes[el.dataset.node] && ED.g.nodes[el.dataset.node].inner);
  if (!id) return;
  RS.raw = '';
  edSel('area', id);
  const box = $('#rs-ins'); if (box) box.focus();
}

/* Applying a move. The sheet changes first and the animation only shows what
   changed: committing it in the animation's callback instead meant that an
   interrupted animation — a switch of tab, a second click, a machine that
   never runs the frames — lost the move while still counting it. A watchdog
   redraws if the animation never reports back. */
function applyRuleMove(m){
  // A click while the last move is still playing used to be dropped without a
  // word. Anyone working at a normal pace loses moves that way, so the running
  // animation is cut short and the new move goes on top of it.
  if (ED.anim){ ED.anim.cancel(); ED.anim = null; clearTimeout(RS.watchdog); drawRender(); }
  const pal = rulePalette();
  let h;
  try { h = applyMove(ED.g, m.mv, pal); } catch(e){ $('#d-err').textContent = e.message; return; }
  const from = ED.g;
  edPush('rule');
  ED.moves++;
  ED.g = h; ED.sel = null; ED.pick = []; RS.rule = null; RS.pat = null; RS.raw = ''; RS.src = null;
  RS.lnSrc = null;
  if (typeof hintReset === 'function') hintReset();
  // what the reader has done, kept so that it can be read back and replayed
  ED.trail = ED.trail || [];
  ED.trail.push({ graph: h, mv: m.mv, rule: ruleOf(m.mv.op, true),
                  why: describeMove(from, m.mv, true) });
  drawTrail();
  const el = $('#d-stage');
  let handle = null, done = false;
  // settling must also stop the animation: left running, its next frame paints
  // over the drawn sheet and the drawing stops answering clicks
  const settle = () => {
    if (done) return;
    done = true;
    clearTimeout(RS.watchdog);
    if (handle) handle.cancel();
    ED.anim = null;
    drawRender();
  };
  handle = playTransition(el, from, h, m.mv,
    { shade: $('#d-shade').checked, wobble: true, colourLines: PREFS.colour,
      hand: PREFS.hand, markMs: 420, moveMs: 560 },
    settle);
  ED.anim = handle;
  RS.watchdog = setTimeout(settle, (handle.total || 1000) + 700);
}

$('#d-moves').addEventListener('input', e => {
  if (e.target.id !== 'rs-ins') return;
  RS.raw = e.target.value;
  const { g, err } = insertParse(RS.raw);
  const show = $('.insertshow'), go = $('#rs-insgo'), box = $('#rs-inserr');
  if (box) box.textContent = RS.raw.trim() ? err : '';
  if (go) go.disabled = !g;
  if (show) show.innerHTML = insertShow(g);
});

$('#d-moves').addEventListener('click', e => {
  const card = e.target.closest('.rulecard');
  if (card){
    const want = card.dataset.rule;
    if (RS.rule === want){ RS.rule = null; RS.src = null; RS.lnSrc = null; drawRender(); return; }
    RS.rule = want; RS.src = null; RS.lnSrc = null;
    // a point already picked is where the rule starts
    if (ED.sel && ED.sel.kind === 'ln'){
      const here = lineMovesAt(ED.sel.id);
      if (here.length === 1){ applyRuleMove(here[0]); return; }
      if (here.length) RS.lnSrc = ED.sel.id;
    }
    /* If the reader has already picked a graph and the rule can do exactly one
       thing with it, there is nothing left to ask: clicking the rule does it.
       Erasing a graph, erasing a copy, taking off a double cut — none of these
       needs a second click, and demanding one for a rule that has no choice to
       make reads as the page refusing to work. Insertion always asks, because
       what to scribe is not on the sheet to be pointed at. */
    const only = want === 'R2' || RS.lnSrc ? [] : armedMoves();
    if (ED.sel && ED.sel.kind !== 'ln' && only.length === 1){ applyRuleMove(only[0]); return; }
    // drawn again rather than only repainted: the points of the lines are shown
    // on the sheet while a rule is armed
    drawRender();
    return;
  }
  const mode = e.target.closest('[data-mode]');
  if (mode){ RS.mode = mode.dataset.mode; drawRuleCards(); return; }
  if (e.target.closest('#rs-insline')){
    const c = selCtx();
    const m = RS.moves.find(x => x.mv.op === 'addLine' && x.mv.area === c.area);
    if (m){ RS.raw = ''; applyRuleMove(m); }
    return;
  }
  if (e.target.closest('#rs-insgo')){
    const raw = ($('#rs-ins').value || '').trim();
    RS.raw = raw;
    const { g, err } = insertParse(raw);
    if (!g){ $('#rs-inserr').textContent = err || 'Nothing to scribe.'; return; }
    RS.pat = g;
    const { list } = ruleMoves();
    RS.moves = list;
    const want = canonGraph(g);
    const c = selCtx();
    const pal = rulePalette();
    const hit = list.find(m => m.card === 'R2' && m.mv.op === 'insert' && m.mv.area === c.area &&
      canonGraph(pal[m.mv.pat]) === want);
    if (!hit){ $('#rs-inserr').textContent = 'That cannot be scribed there.'; return; }
    RS.raw = '';
    applyRuleMove(hit);
  }
});

/* The sheet, made to answer the armed rule. Passing over a place the rule can
   act on lights it; clicking it applies the rule there. With no rule armed the
   sheet behaves as before, and a click picks a graph. */
function armSheet(svg){
  if (!svg) return;
  /* A cut is drawn as one element carrying two names: the cut itself and the
     area inside it. Different rules aim at different ones — R5 removes the
     cut, R2 scribes on the area — so both have to be tested, or the rule that
     wanted the other name silently does nothing when clicked. */
  const hit = el => {
    if (!RS.rule) return [];
    const ids = [el.dataset.area, el.dataset.node].filter(Boolean);
    return armedMoves().filter(m => ids.includes(m.target));
  };
  svg.querySelectorAll('[data-node],[data-area]').forEach(el => {
    el.onmouseenter = () => {
      if (!RS.rule) return;
      const ms = hit(el);
      if (!ms.length) return;
      el.classList.add('tgt-hot');
      if (RS.rule === 'R3' && !RS.lnSrc) showArrow(svg, iterSource(), ms[0].target);
      const say = $('#rs-say');
      if (say) say.textContent = shortWhy(describeMove(ED.g, ms[0].mv, true)) + ' \u2014 click to do it.';
    };
    el.onmouseleave = () => {
      el.classList.remove('tgt-hot');
      clearArrow(svg);
      const say = $('#rs-say'); if (say) say.textContent = ruleSay();
    };
    const was = el.onclick;
    el.onclick = ev => {
      ev.stopPropagation();
      const ms = hit(el);
      // Insertion is never applied by clicking the sheet. Clicking an area
      // with it armed says WHERE, and the box then says WHAT; before the fix a
      // click scribed whichever graph happened to head the palette, which was
      // usually a copy of what the reader had just clicked on.
      if (RS.rule === 'R2' && ms.length){ pickArea(el); return; }
      // iteration, armed with nothing chosen yet: this click names the graph
      if (RS.rule === 'R3' && !RS.lnSrc && !iterSource()){
        const id = el.dataset.node;
        if (id && iterCandidates().includes(id)){ RS.src = id; drawRuleCards(); }
        return;
      }
      if (RS.rule && ms.length){ applyRuleMove(ms[0]); return; }
      if (RS.rule){ return; }              // armed, but not a place it can act
      if (was) was(ev);
    };
  });
  svg.querySelectorAll('.handle').forEach(h => {
    const ln = h.dataset.ln;
    h.onclick = ev => {
      ev.stopPropagation();
      if (RS.rule){ lineClick(ln); return; }
      // with no rule armed a point is picked like a graph, and the rules that
      // can act on it light up
      edSel('ln', ln);
    };
    h.onmouseenter = () => {
      if (!RS.rule) return;
      const ms = RS.lnSrc ? lineMovesAt(RS.lnSrc).filter(m => m.mv.op !== 'extend' &&
                   (ln === RS.lnSrc ? ['branch','retract','delLine'].includes(m.mv.op) : linePoints(m).includes(ln)))
                          : lineMovesAt(ln);
      if (!ms.length) return;
      h.classList.add('tgt-hot');
      const say = $('#rs-say');
      if (say) say.textContent = shortWhy(describeMove(ED.g, ms[0].mv, true)) +
        (ms.length > 1 && !RS.lnSrc ? ' Click to choose.' : ' \u2014 click to do it.');
    };
    h.onmouseleave = () => {
      h.classList.remove('tgt-hot');
      const say = $('#rs-say'); if (say) say.textContent = ruleSay();
    };
  });
  const sa = svg.querySelector('.sa');
  if (sa){
    sa.onmouseenter = () => { if (RS.rule && RS.moves.some(m => m.card===RS.rule && m.target===ED.g.root)) sa.classList.add('tgt-hot'); };
    sa.onmouseleave = () => sa.classList.remove('tgt-hot');
    const wasSa = sa.onclick;
    sa.onclick = ev => {
      ev.stopPropagation();
      const ms = RS.rule ? armedMoves().filter(m => m.target === ED.g.root) : [];
      if (RS.rule === 'R2' && ms.length){ edSel('area', ED.g.root); return; }
      if (RS.rule && ms.length){ applyRuleMove(ms[0]); return; }
      if (RS.rule) return;
      if (wasSa) wasSa(ev);
    };
  }
  paintTargets();
}


/* The reader's own proof, written down as it is made, and playable when it is
   done — the same sequence the machine's proofs are played from. */
function drawTrail(){
  const card = $('#trail-card'), list = $('#d-trail');
  if (!card || !list) return;
  const t = ED.trail || [];
  card.style.display = t.length ? '' : 'none';
  list.innerHTML = t.map((s, k) =>
    '<li data-k="'+k+'"><span class="n">'+(k+1)+'</span><span class="r">'+
    esc(s.rule)+'</span><span class="w">'+esc(shortWhy(s.why))+'</span></li>').join('');
  const go = $('#d-replay');
  if (go){
    go.disabled = t.length < 1;
    const done = typeof trailDone === 'function' && trailDone();
    go.textContent = done ? 'Step through your proof' : 'Step through what you have so far';
  }
  // the switch to watching opens as soon as there is a move of the reader's own to watch
  if (typeof proveModes === 'function') proveModes();
}

function trailSteps(){
  const t = ED.trail || [];
  if (!t.length) return null;
  const first = ED.hist && ED.hist.length ? ED.hist[0].g : null;
  if (!first) return null;
  return [{ graph: first, rule: null, why: 'The premisses, scribed on the sheet of assertion.' }]
    .concat(t.map(s => ({ graph: s.graph, rule: s.rule, why: s.why })));
}

function watchMine(){
  const steps = trailSteps();
  if (!steps) return false;
  pfLoadFound(steps, null, null, 'you');
  return true;
}
if ($('#d-replay')) $('#d-replay').onclick = () => {
  if (watchMine() && typeof proveMode === 'function'){ PV.want = 'play'; proveMode('play'); }
};
if ($('#d-undo2')) $('#d-undo2').onclick = () => {
  if (typeof edUndo === 'function') edUndo();
  else if ($('#d-undo')) $('#d-undo').click();
  if (ED.trail && ED.trail.length) ED.trail.pop();
  drawTrail();
};
