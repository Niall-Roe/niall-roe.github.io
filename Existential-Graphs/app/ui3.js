/* =========================== CONVENTIONS & RULES =========================== */
const CONVENTIONS = [
 ['C1','The sheet of assertion in all of its parts is a graph.','4.396, 397'],
 ['C2','Whatever is scribed on the sheet of assertion is asserted to be true of the universe represented by that sheet.','4.397'],
 ['C3','Graphs scribed on different parts of the sheet of assertion are all asserted to be true.','4.433'],
 ['C4','The scroll is the sign of a conditional proposition de inesse.','4.401, 435, 437'],
 ['C5','The empty cut is the pseudograph; and the cut precisely denies its contents.','4.467'],
 ['C6','The scribing of a heavy dot or unattached line on the sheet of assertion denotes the existence of a single, individual (but otherwise undesignated) object in the universe of discourse. And it is always permitted to scribe such a dot or line on the sheet.','4.404, 405, 417, 559, 567'],
 ['C7','A heavy line, called a line of identity, shall be a graph asserting the numerical identity of the individuals denoted by its two extremities.','4.406, 444'],
 ['C8','A branching line of identity with n number of branches will be used to express the identity of the n individuals denoted by its n extremities.','4.446, 561'],
 ['C9','Points on a cut shall be considered to lie outside the area of that cut.','4.407, 450']
];
const RULES = [
 ['R1','The rule of erasure.','Any evenly enclosed graph and any evenly enclosed portion of a line of identity may be erased.','4.492(1), 505'],
 ['R2','The rule of insertion.','Any graph may be scribed on any oddly enclosed area, and two lines of identity (or portions of lines) oddly enclosed on the same area, may be joined.','4.492(1), 505'],
 ['R3','The rule of iteration.','If a graph P occurs on SA or in a nest of cuts, it may be scribed on any area not part of P, which is contained by {P}. Consequently, (a) a branch with a loose end may be added to any line of identity, provided that no crossing of cuts results from this addition; (b) any loose end of a ligature may be extended inwards through cuts; (c) any ligature thus extended may be joined to the corresponding ligature of an iterated instance of a graph; and (d) a cycle may be formed by joining, by inward extensions, the two loose ends that are the innermost parts of a ligature.','4.492(2), 506'],
 ['R4','The rule of deiteration.','Any graph whose occurrence could be the result of iteration may be erased. Consequently, (a) a branch with a loose end may be retracted into any line of identity, provided that no crossing of cuts occurs in the retraction; (b) any loose end of a ligature may be retracted outwards through cuts; and (c) any cyclical part of a ligature may be cut at its inmost part.','4.492(2), 506'],
 ['R5','The double cut, drawn.','The double cut may be inserted around any graph on any area, and this transformation will not be prevented by the presence of ligatures passing from outside the outer cut to inside the inner cut.','4.492(4), 508, 567'],
 ['R6','The double cut, removed.','And it may be removed wherever two cuts stand one immediately inside the other with nothing between them. What lies inside the inner cut makes no difference, and a ligature passing through the pair does not prevent it. Roberts gives this and R5 as one rule read both ways.','4.492(4), 508, 567']
];
$('#n-conv').innerHTML = CONVENTIONS.map(c =>
  '<dt>'+c[0]+'</dt><dd>'+esc(c[1])+' <span class="cite">CP '+c[2]+'</span></dd>').join('') +
  '<dd class="cite" style="margin-top:14px">Quoted from Roberts 1973, Appendix 3, pp. 137–138. ' +
  'Gamma conventions C10 and C11, and the changes occasioned by the tinctures, are not implemented here.</dd>';
/* A canonical illustration of each rule, in the fewest marks that show it.
   Each is a pair of graphs in the linear notation; the move between them is
   recovered from the rules themselves, so the ring that marks what the rule
   acts on, and the reading underneath, are the page's own and not captions
   written by hand. */
const RULE_DEMOS = {
  R1: [
    ['P Q', 'P', 'Q stands on the sheet, which is evenly enclosed, so it may be erased.'],
    ['( P ) Q', 'Q', 'A cut and its contents are one graph. Evenly enclosed, it goes entire.'],
    ['P ( Q ( R ) )', 'P ( Q (  ) )', 'R lies under two cuts, and so is evenly enclosed again: it may go.'],
    ['*x F[x] G[x]', '*x F[x]', 'An evenly enclosed graph may go though it carries a line.'],
    ['( P )', '(  )', 'P is oddly enclosed. Erasure does not reach inside a cut.', true],
    ['P ( Q ( R ) )', 'P ( Q )', 'Nor may the inner cut go: it is oddly enclosed, whatever is in it.', true]
  ],
  R2: [
    ['( P )', '( P Q )', 'Inside one cut the area is oddly enclosed, so any graph at all may be written there.'],
    ['( P )', '( P ( Q ) )', 'A denial is a graph like any other, so a cut may be inserted too.'],
    ['( P )', '( P ( Q ( R S ) ( T ) ) )', 'Any graph whatever, however large: there is no limit on what may be scribed on an odd area.'],
    ['( ( P ) )', '( Q ( P ) )', 'One cut in is odd, so Q may be scribed there — between the two cuts.'],
    ['( *x *y F[x] G[y] )', '( *x *y x~y F[x] G[y] )', 'And two lines oddly enclosed on one area may be joined.'],
    ['P', 'P Q', 'Not on the sheet. The sheet is evenly enclosed, and insertion does not reach it.', true]
  ],
  R3: [
    ['P ( ( Q ) )', 'P ( ( Q P ) )', 'P is scribed again on an area that its own place contains.'],
    ['( P ( Q ) ( R ( S ) ) (  ) )', '( P ( Q ) ( R ( S ) ) ( P ) )',
     'What may be iterated is a whole graph on the area. P is one, and the empty cut is inside its place.'],
    ['( P ( Q ) ( R ( S ) ) (  ) )', '( P ( Q ) ( R ( S ) ) ( ( Q ) ) )',
     'So is the cut round Q, taken with its contents. A cut and what it encloses go together.'],
    ['( P ( Q ) ( R ( S ) ) (  ) )', '( P ( Q ) ( R P ( S ) ) (  ) )',
     'It may go one cut in, or two, or as many as you like. Here P goes in one.'],
    ['( P ( Q ) ( R ( S ) ) (  ) )', '( P ( Q ) ( R ( S P ) ) (  ) )',
     'And here the same P goes in through two cuts at once.'],
    ['*x F[x] ( G[x] )', '*x *w x~w F[x] ( G[x] )', 'R3(a): a branch with a loose end is added to a line of identity.'],
    ['*x *w x~w F[x] ( Q )', '*x *w x~w F[x] ( *w Q )', 'R3(b): a loose end is carried inwards through a cut.'],
    ['( P ( Q ) ( R ( S ) ) (  ) )', '( P ( Q ) ( R ( S ) ) ( Q ) )',
     'But not Q by itself. Q is not a graph on this area; it is a graph on the area inside its cut.', true],
    ['( P ( Q ) ( R ( S ) ) (  ) )', '( P ( Q R ( S ) ) ( R ( S ) ) (  ) )',
     'Nor may what is inside a cut be carried out and across. Iteration only goes inwards.', true]
  ],
  R4: [
    ['P ( Q P )', 'P ( Q )', 'The inner P could have been got by iterating the outer one, so it may be erased.'],
    ['*x F[x] ( F[x] G[x] )', '*x F[x] ( G[x] )', 'The same, where the graph erased carries a line.'],
    ['P ( ( P Q ) )', 'P ( ( Q ) )', 'Two cuts in makes no difference: what matters is that the copy is enclosed by its original.'],
    ['*x *w x~w F[x] ( *w Q )', '*x *w x~w F[x] ( Q )', 'R4(b): a loose end is drawn back out through a cut.'],
    ['( P Q )', '( Q )', 'But P may not go: deiteration erases only what iteration could have put there, and there is no P outside for it to have come from.', true]
  ],
  R5: [
    ['', '( (  ) )', 'Two cuts may be drawn on the blank sheet. They say nothing.'],
    ['P', '( ( P ) )', 'Or round any graph. Two cuts, one immediately within the other.'],
    ['P Q', '( ( P Q ) )', 'Round several graphs at once: what is juxtaposed is one graph (C3).'],
    ['P Q', 'P ( ( Q ) )', 'Or round just one of them, leaving the rest where they are.'],
    ['( P Q )', '( P ( ( Q ) ) )', 'And inside a cut as readily as on the sheet: the rule asks nothing about parity.'],
    ['( *x F[x] )', '( ( ( *x F[x] ) ) )', 'A graph carrying a line may be enclosed like any other.'],
    ['P', '( P (  ) )', 'Not this. The two cuts are only a double cut if nothing stands between them.', true]
  ],
  R6: [
    ['( ( P Q ) )', 'P Q', 'Two cuts with nothing between them may be taken off. What is inside the inner cut does not matter.'],
    ['( (  ) )', '', 'The same when there is nothing inside either: what is left is the blank sheet.'],
    ['P ( ( Q ) )', 'P Q', 'The pair need not be the outermost thing on the sheet.'],
    ['*x F[x] ( ( G[x] ) )', '*x F[x] G[x] ', 'A line of identity passing through the pair does not stop it either.'],
    ['( P ( Q ) )', 'P Q', 'Not here. P is standing between the two cuts, and the space between them must be empty.', true],
    ['( ( P ) ( Q ) )', 'P Q', 'Nor here. The space between holds a second cut, so neither inner cut sits alone in it.', true]
  ]
};
$('#n-rules').innerHTML = RULES.map(r =>
  '<dt>'+r[0]+' — '+esc(r[1])+'</dt><dd>'+esc(r[2])+' <span class="cite">CP '+r[3]+'</span>'+
  (RULE_DEMOS[r[0]] ? '<div class="demo" data-rule="'+r[0]+'">'+
     (RULE_DEMOS[r[0]].length > 1 ? '<div class="demorow">'+
       RULE_DEMOS[r[0]].map((d,i) =>
         '<button class="btn ghost demopick'+(i?'':' on')+(d[3]?' notallowed':'')+
         '" data-rule="'+r[0]+'" data-i="'+i+'" title="'+esc(d[2])+'">'+
         (i+1) + (d[3] ? '<span class="nomark"></span>' : '')+'</button>').join('')+'</div>' : '')+
     '<div class="stagewrap"><div class="stage demostage" id="rd-'+r[0]+'"></div>'+
     '<span class="nomark big forbid" id="rf-'+r[0]+'" aria-label="not permitted" hidden></span></div>'+
     '<p class="note demosay" id="rs-'+r[0]+'"></p>'+
     '<div class="demorow"><button class="btn ghost demoplay" data-rule="'+r[0]+
       '">▶ play</button></div></div>' : '')+
  '</dd>').join('') +
  '<dd class="cite" style="margin-top:14px">Roberts 1973, Appendix 3, p. 138. All of them are '+
  'implemented, including clauses (a)–(d) of R3 and (a)–(c) of R4.</dd>';

/* Two notes, each put where it is wanted: how to read a graph at the head of
   the Scribe page, and how the finder works on the Prove page. */
$('#n-reading').innerHTML = [
 '<p>Read a graph from the outside in. Peirce calls this <i>endoporeutic</i>. Everything ',
 'written in one place is asserted together. A cut denies what is inside it. A line of ',
 'identity counts as being wherever its least enclosed point is, so a line in an evenly ',
 'enclosed place reads <i>some</i> and one in an oddly enclosed place reads <i>any</i> ',
 '(Roberts p. 51).</p>',
 '<p><b>Shading.</b> The shaded places are the oddly enclosed ones. Peirce shades them in ',
 'MS 514. It is a help for the eye; nothing in the logic depends on it.</p>',
 '<p><b>Coloured lines.</b> Peirce drew in one ink. Colouring each line of identity ',
 'differently makes it easier to see which is which where they cross. Turn it off and the ',
 'graphs look as he drew them.</p>',
 '<p><b>Hook labels.</b> Peirce tells the hooks of a spot apart by where they sit round it: ',
 'the first at nine o\'clock, the rest clockwise (Roberts p. 74). This page puts them all ',
 'down the left edge instead, so the small letter names the line and the raised figure gives ',
 'the place. That is this drawing\'s doing, not Peirce\'s.</p>'
].join('');

$('#n-finder').innerHTML = [
 '<p>It works forwards from the premisses and backwards from the conclusion at the same ',
 'time, using only the six rules, and reports a proof when the two meet. It runs in slices, ',
 'so the page keeps drawing and the count of transformations tried can be watched going up.</p>',
 '<p>For Alpha it also settles validity outright by checking every assignment, so a failed ',
 'search is never reported as a disproof. Alpha is complete and decidable (Roberts, ',
 'Appendix 4): if a valid Alpha inference defeats the search, that is the search\'s limit, ',
 'not the system\'s. Beta is undecidable. There a countermodel on a small domain settles the ',
 'matter, but no amount of searching settles it the other way.</p>',
 '<p><b>Three things it knows to try.</b> Peirce\'s rules are fine grained, and what a ',
 'textbook writes as one step is several of them in a row. Three such sequences are offered ',
 'to the search whole. None of them licenses anything: every move in them is an ordinary ',
 'move, applied and shown like any other.</p>',
 '<p><i>Applying a universal to an individual</i> is three rules: branch the individual\'s ',
 'line (R3a), carry the branch in through the cut (R3b), join it there to the premiss\'s own ',
 'line (R2). This is what lets the search reach Darii, Ferio, Baroco and most of the ',
 'syllogisms.</p>',
 '<p><i>Detaching a consequent</i> is three more: where a conditional stands outside a place ',
 'that already holds its antecedent, iterate it in (R3), deiterate the antecedent against the ',
 'copy already there (R4), and take off the double cut that is left (R6). The middle of that ',
 'sequence is a bigger graph than either end, which is why a search that judges a state by ',
 'how much it looks like the conclusion throws the opening away. This is what the ',
 'constructive dilemma turns on, and every argument by cases with it.</p>',
 '<p><i>Assuming the antecedent</i> is for a conditional to be proved from the blank sheet, ',
 'where nothing suggests where to start. Instead the search proves the consequent from the ',
 'antecedent, and the proof of the whole is built round that: draw a double cut (R5), write ',
 'the antecedent in the oddly enclosed area between the cuts (R2), iterate it inside (R3), ',
 'and work the inner proof there. That is sound because the rules turn on whether a place is ',
 'evenly or oddly enclosed, and the inside of the inner cut is evenly enclosed like the sheet ',
 'itself. The one exception is the bare line of identity, which C1 licenses on the sheet and ',
 'nowhere else, so a proof that puts one down is not transplanted.</p>',
 '<p><b>The proof in writing.</b> Under each proof the same sequence is written out: every ',
 'graph in the linear notation, in ordinary notation, or both, with the rule that got from ',
 'one line to the next. Each line is read back and checked against the graph it stands for. ',
 'A few graphs cannot be written exactly in the linear notation, and those are marked rather ',
 'than passed off as exact.</p>',
 '<p><b>Where the exercises come from.</b> The list holds the exercises set for natural ',
 'deduction in <i>forall x: Calgary</i>, reproduced under its CC BY 4.0 licence, to be worked ',
 'here by scribing and erasing instead. Where the search cannot reach one, the page says so ',
 'rather than leaving you waiting.</p>'
].join('');


/* ---- the written records -------------------------------------------------- */
const drawPfWrit = bindWrit('pf', () => PF.proof && PF.graphs
  ? { graphs: PF.graphs, steps: PF.proof.steps, i: PF.i,
      onPick: k => { pfStop(); pfShow(k); } } : null);
WRIT.pf = drawPfWrit;

/* ---- go ------------------------------------------------------------------ */
enhanceEditor($('#t-in'));
enhanceEditor($('#v-prem'));
enhanceEditor($('#v-goal'));
if ($('#d-from')) enhanceEditor($('#d-from'));
if ($('#d-lin')) enhanceEditor($('#d-lin'), { glyphs: false });

translate(false);
buildProofList();
buildPuzzleList();
pfChoose($('#pf-sel').value || 'lib:0');
try { ED.g = compileFormula(parseFormula('P -> Q')).graph; } catch(e){}
drawRender();


/* ---- the rule illustrations, played ------------------------------------- */
const DEMO = { pick: {}, anim: {}, timer: {} };
function demoPair(rule){
  const d = RULE_DEMOS[rule][DEMO.pick[rule] || 0];
  const h = hydrateChain([parseEG(d[0]), parseEG(d[1])]);
  return { a: h.graphs[0], b: h.graphs[1], mv: h.mvs[1], say: d[2] };
}
function demoStill(rule){
  const el = $('#rd-'+rule); if (!el) return;
  if (DEMO.anim[rule]){ DEMO.anim[rule].cancel(); DEMO.anim[rule] = null; }
  clearTimeout(DEMO.timer[rule]);
  const d = RULE_DEMOS[rule][DEMO.pick[rule] || 0];
  const { a, b, say } = demoPair(rule);
  const fr = proofFrame([a, b]);
  stageSvg(el, a, { shade:true, wobble:true, colourLines: PREFS.colour, hand: PREFS.hand, frame: fr, maxH: 120 });
  $('#rs-'+rule).innerHTML = (d[3] ? '<span class="pill bad">not permitted</span> ' : '') +
    esc(say) + ' <span class="cite">' +
    esc(fmtFull(sugar(readGraph(a)))) + ' &rarr; ' + esc(fmtFull(sugar(readGraph(b)))) + '</span>';
  forbidMark(rule, d[3] === true);
  demoButton(rule, 'play');
}
/* Some of the illustrations are of what the rule does not permit. There is no
   transformation to play, so both graphs are set down side by side with the
   move struck out between them. */
/* A prohibition is played like anything else — you watch the move that is not
   allowed actually being made — with the mark held over the drawing throughout
   so that it is never mistaken for a rule. */
function forbidMark(rule, on){
  const m = $('#rf-'+rule);
  if (m) m.hidden = !on;
}

function demoButton(rule, mode){
  const b = $('.demoplay[data-rule="'+rule+'"]');
  if (!b) return;
  b.dataset.mode = mode;
  b.hidden = mode === 'none';
  if (mode === 'none') return;
  b.textContent = mode === 'reset' ? '↺ set it back' : '▶ play';
  b.classList.toggle('isreset', mode === 'reset');
}
function demoPlay(rule){
  const el = $('#rd-'+rule); if (!el) return;
  if (DEMO.anim[rule]){ DEMO.anim[rule].cancel(); DEMO.anim[rule] = null; }
  clearTimeout(DEMO.timer[rule]);
  const { a, b, mv } = demoPair(rule);
  forbidMark(rule, RULE_DEMOS[rule][DEMO.pick[rule] || 0][3] === true);
  const fr = proofFrame([a, b]);
  DEMO.anim[rule] = playTransition(el, a, b, mv,
    { shade:true, wobble:true, colourLines: PREFS.colour, hand: PREFS.hand, frame: fr, maxH: 120,
      markMs: 820, moveMs: 760 },
    () => { DEMO.anim[rule] = null; demoButton(rule, 'reset'); });
}
$('#n-rules').addEventListener('click', e => {
  const pick = e.target.closest('.demopick');
  if (pick){
    // choosing an illustration loads it at its first state; it does not play
    const r = pick.dataset.rule;
    DEMO.pick[r] = +pick.dataset.i;
    $$('.demopick[data-rule="'+r+'"]').forEach(b => b.classList.toggle('on', b === pick));
    demoStill(r);
    return;
  }
  const play = e.target.closest('.demoplay');
  if (play){
    if (play.dataset.mode === 'reset') demoStill(play.dataset.rule);
    else demoPlay(play.dataset.rule);
  }
});
function demoDrawAll(){ Object.keys(RULE_DEMOS).forEach(r => { try { demoStill(r); } catch(e){} }); }

// the illustrations are drawn once the whole panel exists
try { demoDrawAll(); } catch(e){ console.error(e); }
