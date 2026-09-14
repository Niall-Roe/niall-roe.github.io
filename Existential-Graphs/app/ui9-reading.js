/* ============================================================================
   HOW TO READ A GRAPH.
   The first thing on the page. The text introduces the sheet, the graph and
   the cut in plain words, and every example in it is a highlighted phrase:
   click it and the small sheet beside the text draws it, step by step, the
   parts that stay moving into place rather than being drawn again.

   The steps are written here in the linear notation, which is only how the
   page is told what to draw. The reader is never shown it on this card.
   ========================================================================== */

const RD_DEMOS = {
  assertA:  [['', 'the blank sheet'], ['A', 'A']],
  alsoB:    [['A', 'A'], ['A B', 'A ∧ B']],
  cutOut:   [['A', 'A'], ['(A)', '¬A']],
  notAandB: [['A B', 'A ∧ B'], ['(A) B', '¬A ∧ B']],
  notBoth:  [['A B', 'A ∧ B'], ['(A B)', '¬(A ∧ B)']],
  subgraph: [['B', 'B is a graph'], ['(B)', '¬B is a graph'],
             ['A (B)', 'so is A ∧ ¬B'], ['(A (B))', 'and so is ¬(A ∧ ¬B)']],
  dbl:      [['A', 'A'], ['(A)', '¬A'], ['((A))', '¬¬A, which says A']],
  cond:     [['A', 'A'], ['A (B)', 'A ∧ ¬B'], ['(A (B))', '¬(A ∧ ¬B), that is, A ⊃ B']],
  disj:     [['C D', 'C ∧ D'], ['(C) D', '¬C ∧ D'], ['(C) (D)', '¬C ∧ ¬D'],
             ['((C) (D))', '¬(¬C ∧ ¬D), that is, C ∨ D']],
  outside:  [['(A (B))', 'A ⊃ B'], ['(A (B)) (C)', '(A ⊃ B) ∧ ¬C'],
             ['(A (B)) (C) ((D))', '(A ⊃ B) ∧ ¬C ∧ ¬¬D'],
             ['(A (B)) ((C) ((D)))', '(A ⊃ B) ∧ (C ∨ ¬D)'],
             ['((A (B)) ((C) ((D))))', 'TINTED']]
};

// the reading of the last example, with each part in the colour of its cuts
const RD_TINTED =
  '<span class="tint0">¬(</span><span class="tint1">(A ⊃ B)</span> ∧ ' +
  '<span class="tint2">(C ∨ <span class="tint3">¬D</span>)</span><span class="tint0">)</span>';

/* Which cut belongs to which part of ¬((A ⊃ B) ∧ (C ∨ ¬D)). Found by shape, so
   it holds whatever identifiers the drawing has picked up on the way. */
function rdTint(g){
  const t = {};
  const root = g.areas[g.root];
  if (root.items.length !== 1) return t;
  const outer = root.items[0];
  t[outer] = 0;
  const spotsIn = (id, direct) => {
    const areas = direct ? [g.nodes[id].inner] : areasUnder(g, g.nodes[id].inner);
    const names = [];
    for (const a of areas) for (const x of g.areas[a].items)
      if (g.nodes[x].k === 'spot') names.push(g.nodes[x].name);
    return names;
  };
  const cutsUnder = id => {
    const out = [];
    for (const a of areasUnder(g, g.nodes[id].inner))
      for (const x of g.areas[a].items) if (g.nodes[x].k === 'cut') out.push(x);
    return out;
  };
  for (const id of g.areas[g.nodes[outer].inner].items){
    if (g.nodes[id].k !== 'cut') continue;
    const names = spotsIn(id, false);
    const k = names.includes('A') ? 1 : names.includes('C') ? 2 : null;
    if (k === null) continue;
    t[id] = k;
    for (const c of cutsUnder(id)) t[c] = k;
    // the cut standing right round D is the denial in ¬D
    if (k === 2) for (const c of cutsUnder(id))
      if (spotsIn(c, true).includes('D')) t[c] = 3;
  }
  return t;
}

const RD = { g: null, anim: null, timer: 0, run: 0, tint: null, say: '' };
function rdOpts(extra){
  return Object.assign({ shade: true, wobble: true, colourLines: PREFS.colour,
                         hand: PREFS.hand, maxH: 190 }, extra || {});
}
function rdStill(){
  const el = $('#rd-stage');
  if (!el || !RD.g) return;
  stageSvg(el, RD.g, rdOpts(RD.tint ? { tint: RD.tint } : {}));
}
function rdSay(text){
  const say = $('#rd-say');
  if (!say) return;
  say.innerHTML = text === 'TINTED' ? RD_TINTED : esc(text);
}
function rdStop(){
  RD.run++;
  clearTimeout(RD.timer);
  if (RD.anim){ RD.anim.cancel(); RD.anim = null; }
}
function rdPlay(key){
  const seq = RD_DEMOS[key];
  const el = $('#rd-stage');
  if (!seq || !el) return;
  rdStop();
  const run = RD.run;
  $$('#n-reading .rdlink').forEach(b => b.classList.toggle('on', b.dataset.demo === key));
  let i = -1;
  const step = () => {
    if (run !== RD.run) return;
    i++;
    if (i >= seq.length) return;
    const [src, say] = seq[i];
    let target = parseEG(src);
    const last = i === seq.length - 1;
    // the parts the two drawings share move into place instead of blinking
    if (RD.g){ try { target = alignGraph(RD.g, target); } catch(e){} }
    const settle = () => {
      if (run !== RD.run) return;
      RD.anim = null;
      RD.g = target;
      RD.tint = last && say === 'TINTED' ? rdTint(target) : null;
      rdStill();
      rdSay(say);
      if (!last) RD.timer = setTimeout(step, 750);
    };
    const same = RD.g && canonGraph(RD.g) === canonGraph(target);
    if (!RD.g || same || !window.playTransition || typeof requestAnimationFrame !== 'function'){
      settle();
      return;
    }
    RD.tint = null;
    RD.anim = playTransition(el, RD.g, target, null, rdOpts({ markMs: 0, moveMs: 680 }), settle);
  };
  step();
}

$('#n-reading').innerHTML = [
 '<p>The Existential Graphs are Peirce’s second attempt at a diagrammatic system of ',
 'logic. There are three main elements to this system: the sheet of assertion, graphs, ',
 'and cuts.</p>',
 '<p>At their most basic, a graph is a capital letter. When it is written on the sheet of ',
 'assertion, it is asserted: <button type="button" class="rdlink" data-demo="assertA">writing ',
 'A asserts A</button>. To write A ∧ B, you <button type="button" class="rdlink" ',
 'data-demo="alsoB">simply also scribe B</button>. To assert the negation of A, you ',
 '<button type="button" class="rdlink" data-demo="cutOut">cut it out</button> of the graph ',
 'by scribing a circle around it. So <button type="button" class="rdlink" ',
 'data-demo="notAandB">¬A ∧ B</button> has a cut around A alone, and ',
 '<button type="button" class="rdlink" data-demo="notBoth">¬(A ∧ B)</button> has one cut ',
 'around both.</p>',
 '<p>Note that each sub-graph is also a graph. In <button type="button" class="rdlink" ',
 'data-demo="subgraph">this graph</button>, B is a graph, the cut around B is a graph that ',
 'contains it, and the outer cut, holding A and that cut, is a graph that contains both.</p>',
 '<p>Cuts can be combined, so just as in ordinary notation, <button type="button" ',
 'class="rdlink" data-demo="dbl">¬¬A is the same as A</button>. We keep track of this here ',
 'by shading in the negated regions.</p>',
 '<p>Familiar expressions are made out of just these operators. So ',
 '<button type="button" class="rdlink" data-demo="cond">A ⊃ B</button> becomes ¬(A ∧ ¬B), ',
 'and <button type="button" class="rdlink" data-demo="disj">C ∨ D</button> becomes ',
 '¬(¬C ∧ ¬D). At first this may seem confusing, but you learn to recognise the various ',
 'graphs quickly. It has the added advantage of doing away with the need for translation ',
 'rules. You will see later that a number of simple proofs in ordinary notation are ',
 'zero-step proofs in the graphs: in writing out the premisses you have also written out ',
 'the conclusion.</p>',
 '<p>Graphs can become quite involved. When reading a graph, do so from the outside in. ',
 'So, for example, <button type="button" class="rdlink" data-demo="outside">this graph</button> ',
 'is read as <span class="rdformula">', RD_TINTED, '</span>.</p>',
 '<blockquote class="peirce">A nest sucks the meaning from without inwards unto its centre, ',
 'as a sponge absorbs water.<span class="cite">Peirce, Ms 650, quoted in Roberts 1973, ',
 'p. 39 n. 13</span></blockquote>',
 '<p>See below for more expressions.</p>'
].join('');

$('#n-reading').addEventListener('click', e => {
  const b = e.target.closest('.rdlink');
  if (b) rdPlay(b.dataset.demo);
});

// the sheet starts blank: it is the first of the three things the text names
RD.g = newGraph();
rdSay('the blank sheet');

// a sheet drawn while the card was shut had no width to size itself to, so it
// is drawn again when the card is opened
$('#read-card').addEventListener('toggle', () => { if ($('#read-card').open) rdStill(); });
