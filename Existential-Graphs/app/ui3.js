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
 ['R5','The rule of the double cut.','The double cut may be inserted around or removed (where it occurs) from any graph on any area. And these transformations will not be prevented by the presence of ligatures passing from outside the outer cut to inside the inner cut.','4.492(4), 508, 567']
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
  R1: [['P Q', 'P', 'Q stands on the sheet, which is evenly enclosed, so it may be erased.'],
       ['*x F[x] G[x]', '*x F[x]', 'And so may an evenly enclosed graph that carries a line.']],
  R2: [['( P )', '( P Q )', 'Inside one cut the area is oddly enclosed, so any graph at all may be written there.'],
       ['( *x *y F[x] G[y] )', '( *x *y x~y F[x] G[y] )', 'And two lines oddly enclosed on one area may be joined.']],
  R3: [['P ( ( Q ) )', 'P ( ( Q P ) )', 'P is scribed again on an area that its own place contains.'],
       ['*x F[x] ( G[x] )', '*x *w x~w F[x] ( G[x] )', 'R3(a): a branch with a loose end is added to a line of identity.'],
       ['*x *w x~w F[x] ( Q )', '*x *w x~w F[x] ( *w Q )', 'R3(b): a loose end is carried inwards through a cut.']],
  R4: [['P ( Q P )', 'P ( Q )', 'The inner P could have been got by iterating the outer one, so it may be erased.'],
       ['*x F[x] ( F[x] G[x] )', '*x F[x] ( G[x] )', 'The same, where the graph erased carries a line.'],
       ['*x *w x~w F[x] ( *w Q )', '*x *w x~w F[x] ( Q )', 'R4(b): a loose end is drawn back out through a cut.']],
  R5: [['P', '( ( P ) )', 'A double cut may be drawn round anything whatever.'],
       ['( ( P Q ) )', 'P Q', 'And removed wherever one stands.'],
       ['*x F[x] ( ( G[x] ) )', '*x F[x] G[x] ', 'A ligature running right through the pair does not prevent it.']]
};
$('#n-rules').innerHTML = RULES.map(r =>
  '<dt>'+r[0]+' — '+esc(r[1])+'</dt><dd>'+esc(r[2])+' <span class="cite">CP '+r[3]+'</span>'+
  (RULE_DEMOS[r[0]] ? '<div class="demo" data-rule="'+r[0]+'">'+
     (RULE_DEMOS[r[0]].length > 1 ? '<div class="demorow">'+
       RULE_DEMOS[r[0]].map((d,i) =>
         '<button class="btn ghost demopick'+(i?'':' on')+'" data-rule="'+r[0]+'" data-i="'+i+
         '">'+(i+1)+'</button>').join('')+'</div>' : '')+
     '<div class="stage demostage" id="rd-'+r[0]+'"></div>'+
     '<p class="note demosay" id="rs-'+r[0]+'"></p>'+
     '<div class="demorow"><button class="btn ghost demoplay" data-rule="'+r[0]+
       '">▶ play</button></div></div>' : '')+
  '</dd>').join('') +
  '<dd class="cite" style="margin-top:14px">Roberts 1973, Appendix 3, p. 138. All five are implemented, '+
  'including clauses (a)–(d) of R3 and (a)–(c) of R4.</dd>';

$('#n-about').innerHTML = [
 '<p><b>Reading a graph.</b> The interpretation is <i>endoporeutic</i>: it proceeds inwards, ',
 'so that "a nest sucks the meaning from without inwards unto its centre, as a sponge absorbs ',
 'water" (Peirce, Ms 650, quoted Roberts p. 39 n. 13). Each area is read as a conjunction; ',
 'each cut denies its contents; and a line of identity is as much enclosed as its least ',
 'enclosed part, so that an evenly enclosed line reads <i>some</i> and an oddly enclosed one ',
 '<i>any</i> (Roberts p. 51).</p>',
 '<p><b>Shading.</b> Shading the oddly enclosed areas is Peirce\'s own device in MS 514, and ',
 'it is offered here as an aid rather than as part of the formation rules. Nothing in the ',
 'logic depends on it.</p>',
 '<p><b>Colouring the lines.</b> Peirce drew in one ink. Giving each line of identity ',
 'its own colour, where there is more than one, is an aid for the eye at the places ',
 'where lines cross, and nothing in the logic turns on it. Turn it off and the graphs ',
 'are as he would have scribed them.</p>',
 '<p><b>Hook numerals.</b> Peirce distinguishes the hooks of a spot by where the line meets ',
 'it. Since this page lays every hook on the left edge, the small numerals give the order of ',
 'the places instead. They are an artefact of this drawing, not of the system.</p>',
 '<p><b>The proof in writing.</b> Under each proof the same sequence is set down in ',
 'words: each graph in the linear notation, in ordinary notation, or in both, with the ',
 'rule that carried one line to the next. Every line is parsed back and checked against ',
 'the graph it stands for; the few that the linear notation cannot set down exactly — a ',
 'branch with a loose end on an area the line also leaves — are marked rather than ',
 'quietly given as exact.</p>',
 '<p><b>What the proof finder does.</b> It searches forwards from the premisses and backwards ',
 'from the conclusion at the same time, using nothing but the five rules, and reports a ',
 'proof when the two halves meet. For Alpha it also decides validity outright by truth-value ',
 'analysis, so a failed search is never reported as a disproof. Alpha is complete and ',
 'decidable (Roberts, Appendix 4), so where a valid Alpha inference defeats the search, the ',
 'fault is the search\'s and not the system\'s. Beta validity is not decidable at all: there a ',
 'countermodel on a small domain refutes an inference conclusively, but no amount of ',
 'searching can establish validity by failing.</p>',
 '<p><b>Deeper Beta proofs.</b> The syllogism Barbara is beyond the present search, which is ',
 'why it is given on the Proofs tab in the form Roberts prints, each of its eight steps ',
 'checked against the rules by this page.</p>',
 '<p><b>Where the exercises come from.</b> The Find a proof tab carries the exercises ',
 'set for natural deduction in <i>forall x: Calgary</i>, reproduced under its CC BY 4.0 ',
 'licence, to be worked instead by scribing and erasing. Of the fifty-odd, the search ',
 'on this page finds all but two — Barbara and Darii, which are worked out on the ',
 'Proofs tab instead. Four need the “search harder” setting. Where the book uses A as a ',
 'one-place predicate the letter has been changed, since “Ax” reads here as the ',
 'universal quantifier.</p>',
 '<p>Several of the theorems on the Proofs tab are of the same kind, from ',
 '<i>forall x: Calgary</i> by P. D. Magnus, Tim Button, Aaron Thomas-Bolduc and Richard ',
 'Zach (CC BY 4.0, forallx.openlogicproject.org), and the Open Logic Project ',
 '(openlogicproject.org). The theorems themselves are common property; what is shown here ',
 'is what becomes of them when they are proved by scribing and erasing instead.</p>',
 '<p><b>What is not here.</b> Gamma — the broken cut, graphs of graphs, the potentials, ',
 'modality — and the tinctured graphs of 1906. Roberts, chapters 5 and 6.</p>',
 '<hr class="sep"><p><b>Sources.</b> Don D. Roberts, <i>The Existential Graphs of Charles S. ',
 'Peirce</i> (The Hague: Mouton, 1973), chapters 3 and 4 and Appendices 3 and 4. ',
 'Charles S. Peirce, MS 514 (1909), transcribed with commentary by John F. Sowa, ',
 'jfsowa.com/peirce/ms514.htm. P. D. Magnus, Tim Button, Aaron Thomas-Bolduc and Richard ',
 'Zach, <i>forall x: Calgary. An Introduction to Formal Logic</i>, CC BY 4.0. ',
 'References of the form 4.492 are to the <i>Collected Papers</i>.</p>'
].join('');

/* ---- the written records -------------------------------------------------- */
const drawPfWrit = bindWrit('pf', () => PF.proof && PF.graphs
  ? { graphs: PF.graphs, steps: PF.proof.steps, i: PF.i,
      onPick: k => { pfStop(); pfShow(k); } } : null);
const drawVWrit = bindWrit('v', () => VV.steps
  ? { graphs: VV.graphs, steps: VV.steps, i: VV.i,
      onPick: k => { vStop(); vShow(k); } } : null);
WRIT.pf = drawPfWrit; WRIT.v = drawVWrit;

/* ---- go ------------------------------------------------------------------ */
enhanceEditor($('#t-in'));
enhanceEditor($('#v-prem'));
enhanceEditor($('#v-goal'));
enhanceEditor($('#d-from'));
enhanceEditor($('#d-lin'), { glyphs: false });

translate(false);
pfLoad(0);
buildStartList();
buildPuzzleList();
// the Scribe tab opens with something on the sheet rather than a blank
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
  const { a, b, say } = demoPair(rule);
  const fr = proofFrame([a, b]);
  stageSvg(el, a, { shade:true, wobble:true, colourLines: PREFS.colour, hand: PREFS.hand, frame: fr, maxH: 120 });
  $('#rs-'+rule).innerHTML = esc(say) + ' <span class="cite">' +
    esc(fmtFull(sugar(readGraph(a)))) + ' &rarr; ' + esc(fmtFull(sugar(readGraph(b)))) + '</span>';
  demoButton(rule, 'play');
}
function demoButton(rule, mode){
  const b = $('.demoplay[data-rule="'+rule+'"]');
  if (!b) return;
  b.dataset.mode = mode;
  b.textContent = mode === 'reset' ? '↺ set it back' : '▶ play';
  b.classList.toggle('isreset', mode === 'reset');
}
function demoPlay(rule){
  const el = $('#rd-'+rule); if (!el) return;
  if (DEMO.anim[rule]){ DEMO.anim[rule].cancel(); DEMO.anim[rule] = null; }
  clearTimeout(DEMO.timer[rule]);
  const { a, b, mv } = demoPair(rule);
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
