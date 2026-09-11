/* ============================================================================
   EXERCISES FROM THE OPEN TEXTBOOKS.
   These are the arguments and theorems set for natural deduction in
   forall x: Calgary, by P. D. Magnus, Tim Button, Aaron Thomas-Bolduc and
   Richard Zach (CC BY 4.0, forallx.openlogicproject.org). They are reproduced
   here under that licence, to be worked instead by Peirce's five rules.
   Where the book uses A as a one-place predicate the letter is changed, since
   "Ax" reads as the universal quantifier in the notation of this page.
   ========================================================================== */

const BOOK_EXERCISES = [
  { group: 'Basic rules for TFL — ch. 16', items: [
    ['J -> ~J', '~J'],
    ['Q -> (Q & ~Q)', '~Q'],
    ['A -> (B -> C)', '(A & B) -> C'],
    ['K & L', 'K <-> L'],
    ['(C & D) | E', 'E | D'],
    ['A <-> B\nB <-> C', 'A <-> C'],
    ['~F -> G\nF -> H', 'G | H'],
    ['(Z & K) | (K & M)\nK -> D', 'D'],
    ['~(P -> Q)', '~Q'],
    ['~(P -> Q)', 'P']
  ]},
  { group: 'Constructing proofs — ch. 17', items: [
    ['A -> B\nA -> C', 'A -> (B & C)'],
    ['(A & B) -> C', 'A -> (B -> C)'],
    ['A -> (B -> C)', '(A -> B) -> (A -> C)'],
    ['A | (B & C)', '(A | B) & (A | C)'],
    ['(A & B) | (A & C)', 'A & (B | C)'],
    ['A | B\nA -> C\nB -> D', 'C | D'],
    ['~A | ~B', '~(A & B)'],
    ['A & ~B', '~(A -> B)'],
    ['', '~A -> (A -> ⊥)'],
    ['', '~(A & ~A)'],
    ['', '((A -> C) & (B -> C)) -> ((A | B) -> C)'],
    ['', '~(A -> B) -> (A & ~B)'],
    ['', '(~A | B) -> (A -> B)']
  ]},
  { group: 'Constructing proofs — ch. 17, the harder set', items: [
    ['', '~~A -> A'],
    ['~A -> ~B', 'B -> A'],
    ['A -> B', '~A | B'],
    ['', '~(A & B) -> (~A | ~B)'],
    ['A -> (B | C)', '(A -> B) | (A -> C)'],
    ['', '(A -> B) | (B -> A)'],
    ['', '((A -> B) -> A) -> A']
  ]},
  { group: 'Additional rules for TFL — ch. 18', items: [
    ['E | F\nF | G\n~F', 'E & G'],
    ['M | (N -> M)', '~M -> ~N'],
    ['(M | N) & (O | P)\nN -> P\n~P', 'M & O'],
    ['(X & Y) | (X & Z)\n~(X & D)\nD | M', 'M']
  ]},
  { group: 'Basic rules for FOL — ch. 34', items: [
    ['Q -> Ax Fx', 'Ax (Q -> Fx)'],
    ['Ex (Q -> Fx)', 'Q -> Ex Fx'],
    ['Ax (Fx -> Q)', 'Ex Fx -> Q'],
    ['', 'Ax (Fx -> Ey Fy)'],
    ['Ax Rxx', 'Ax Ey Rxy'],
    ['Ax Ay Az ((Rxy & Ryz) -> Rxz)', 'Ax Ay (Rxy -> Az (Ryz -> Rxz))'],
    ['Ax (Jx -> Kx)\nEx Ay Lxy\nAx Jx', 'Ex (Kx & Lxx)']
  ]},
  { group: 'Conversion of quantifiers — ch. 35', items: [
    ['Ax (Fx -> ~Gx)', '~Ex (Fx & Gx)'],
    ['~Ex (Fx & Gx)', 'Ax (Fx -> ~Gx)'],
    ['~Ex Rxa\nAx Ay Ryx', '⊥'],
    ['~Ex Ey Lxy', '~Laa']
  ]},
  { group: 'Syllogistic figures — ch. 34', items: [
    ['Ax (Fx -> Gx)\nAx (Gx -> Hx)', 'Ax (Fx -> Hx)'],
    ['Ax (Gx -> ~Fx)\nAx (Hx -> Gx)', 'Ax (Hx -> ~Fx)'],
    ['Ax (Gx -> Hx)\nEx (Fx & Gx)', 'Ex (Fx & Hx)'],
    ['Ax (Gx -> ~Hx)\nEx (Fx & Gx)', 'Ex (Fx & ~Hx)']
  ]},
  { group: 'Identity — ch. 37', items: [
    ['Ax Ay (Rxy -> x=y)', 'Rab -> Rba'],
    ['Ex Jx\nEx ~Jx', 'Ex Ey ~(x=y)'],
    ['Pa | Qb\nQb -> b=c\n~Pa', 'Qc']
  ]}
];

/* Which of these the search on this page can manage, as measured. Everything
   else is worth trying with “search harder”, and two of them are in the proof
   library because the search cannot reach them. */
const EX_HARDER = new Set([
  '(A & B) | (A & C)|A & (B | C)',
  'A | B\nA -> C\nB -> D|C | D',
  'A <-> B\nB <-> C|A <-> C',
  '(X & Y) | (X & Z)\n~(X & D)\nD | M|M'
]);
const EX_LIBRARY = new Set([
  'Ax (Fx -> Gx)\nAx (Gx -> Hx)|Ax (Fx -> Hx)',
  'Ax (Gx -> Hx)\nEx (Fx & Gx)|Ex (Fx & Hx)'
]);

(function buildExerciseList(){
  const sel = $('#v-book');
  if (!sel) return;
  let html = '<option value="">Pick an exercise…</option>';
  BOOK_EXERCISES.forEach((g, gi) => {
    html += '<optgroup label="'+esc(g.group)+'">';
    g.items.forEach(([prem, goal], ii) => {
      const label = (prem ? prem.split('\n').join(', ')+' ⊢ ' : '⊢ ') + goal;
      html += '<option value="'+gi+'.'+ii+'">'+esc(label)+'</option>';
    });
    html += '</optgroup>';
  });
  sel.innerHTML = html;
  sel.onchange = () => {
    if (!sel.value) return;
    const [gi, ii] = sel.value.split('.').map(Number);
    const [prem, goal] = BOOK_EXERCISES[gi].items[ii];
    setEditorValue('#v-prem', prem);
    setEditorValue('#v-goal', goal);
    const key = prem+'|'+goal;
    $('#v-booknote').innerHTML = EX_LIBRARY.has(key)
      ? 'The search on this page cannot reach this one. It is worked out in full on the Proofs tab.'
      : EX_HARDER.has(key)
      ? 'This one needs “search harder”.'
      : 'Set in <i>forall x: Calgary</i> (CC BY 4.0) for natural deduction.';
    runProof(EX_HARDER.has(key));
  };
  $('#v-booknote').innerHTML =
    'From <i>forall x: Calgary</i> by P. D. Magnus, Tim Button, Aaron Thomas-Bolduc and '+
    'Richard Zach, CC BY 4.0. Choosing one fills the boxes and runs the search.';
})();

/* ---- one preference for colouring the lines, shared by every panel -------- */
(function bindColourPref(){
  const boxes = $$('.pref-colour');
  PREFS.colour = true;
  boxes.forEach(b => b.onchange = () => {
    PREFS.colour = b.checked;
    boxes.forEach(o => o.checked = PREFS.colour);
    const t = $('nav.tabs button[aria-selected="true"]');
    if (t) refresh(t.dataset.tab);
  });
})();
