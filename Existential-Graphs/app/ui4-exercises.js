/* ============================================================================
   EXERCISES FROM THE OPEN TEXTBOOKS.
   These are the arguments and theorems set for natural deduction in
   forall x: Calgary, by P. D. Magnus, Tim Button, Aaron Thomas-Bolduc and
   Richard Zach (CC BY 4.0, forallx.openlogicproject.org). They are reproduced
   here under that licence, to be worked instead by Peirce's rules.
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

/* ============================================================================
   THE CLASSICAL SYLLOGISMS.
   The medieval names are themselves a notation. Each name's vowels give the
   three propositions in order, and the four kinds take their letters from two
   Latin words: affIrmO, I affirm, gives A for the universal affirmative and I
   for the particular; nEgO, I deny, gives E and O. So Barbara is A, A, A and
   Ferio is E, I, O, and the name tells you the form before you read it.

   The fifteen here are the moods that hold without assuming that the terms
   have any instances. The other nine of the traditional twenty-four —
   Barbari, Celaront, Cesaro, Camestros, Camenos, Darapti, Felapton, Fesapo
   and Bramantip — draw a particular conclusion from two universal premisses,
   and need the further premiss that something is a such-and-such. They are
   left out rather than quietly repaired.
   ========================================================================== */
const SYLL_FORMS = {
  A: (x,y) => 'Ax ('+x+'x -> '+y+'x)',
  E: (x,y) => '~Ex ('+x+'x & '+y+'x)',
  I: (x,y) => 'Ex ('+x+'x & '+y+'x)',
  O: (x,y) => 'Ex ('+x+'x & ~'+y+'x)'
};
const SYLL_SAY = {
  A: (x,y) => 'All <i>'+x+'</i> are <i>'+y+'</i>',
  E: (x,y) => 'No <i>'+x+'</i> is <i>'+y+'</i>',
  I: (x,y) => 'Some <i>'+x+'</i> is <i>'+y+'</i>',
  O: (x,y) => 'Some <i>'+x+'</i> is not <i>'+y+'</i>'
};
// figure: where the middle term stands in each premiss
const SYLL_FIG = {
  1: [['M','P'], ['S','M']],
  2: [['P','M'], ['S','M']],
  3: [['M','P'], ['M','S']],
  4: [['P','M'], ['M','S']]
};
const SYLLOGISMS = [
  ['Barbara',    1, 'AAA'], ['Celarent',  1, 'EAE'], ['Darii',     1, 'AII'],
  ['Ferio',      1, 'EIO'],
  ['Cesare',     2, 'EAE'], ['Camestres', 2, 'AEE'], ['Festino',   2, 'EIO'],
  ['Baroco',     2, 'AOO'],
  ['Datisi',     3, 'AII'], ['Disamis',   3, 'IAI'], ['Ferison',   3, 'EIO'],
  ['Bocardo',    3, 'OAO'],
  ['Calemes',    4, 'AEE'], ['Dimatis',   4, 'IAI'], ['Fresison',  4, 'EIO']
];
function syllogism(name, fig, mood){
  const [p1, p2] = SYLL_FIG[fig];
  const prem = [ SYLL_FORMS[mood[0]](p1[0], p1[1]),
                 SYLL_FORMS[mood[1]](p2[0], p2[1]) ].join('\n');
  const goal = SYLL_FORMS[mood[2]]('S', 'P');
  return { name, fig, mood, prem, goal };
}
const SYLL_ALL = SYLLOGISMS.map(x => syllogism(x[0], x[1], x[2]));
// the vowels of the name, marked, beside what each one says
function syllNote(s){
  const marked = s.name.replace(/[aeiou]/gi, ch =>
    '<b class="vowel">' + ch.toUpperCase() + '</b>');
  const [p1, p2] = SYLL_FIG[s.fig];
  const line = (kind, x, y) =>
    '<b class="vowel">'+kind+'</b> &nbsp;' + SYLL_SAY[kind](x, y);
  return '<p style="margin:0 0 6px"><b style="font-size:15px">'+marked+'</b> &nbsp;'+
    '<span class="cite">figure '+s.fig+', mood '+s.mood.split('').join('&thinsp;')+'</span></p>'+
    '<p style="margin:0 0 4px">'+line(s.mood[0], p1[0], p1[1])+'<br>'+
    line(s.mood[1], p2[0], p2[1])+'<br>'+
    '<span style="opacity:.7">so</span> &nbsp;'+line(s.mood[2], 'S', 'P')+'</p>'+
    '<p class="cite" style="margin:4px 0 0">The vowels of the name give the three '+
    'propositions. A and I are the vowels of <i>affirmo</i>, E and O those of '+
    '<i>nego</i>; the first of each pair is universal, the second particular.</p>';
}
/* The five whose premisses and conclusion are all universal. The search on
   this page does not reach them; each is worked out in full on the Proofs tab,
   by the strategy opening and then an ordinary search. */
const SYLL_LIBRARY = new Set(['Barbara','Celarent','Cesare','Camestres','Calemes']);
BOOK_EXERCISES.push({ group: 'The classical syllogisms',
  items: SYLL_ALL.map(s => [s.prem, s.goal, s.name,
    syllNote(s) + (SYLL_LIBRARY.has(s.name)
      ? '<p class="cite" style="margin:6px 0 0">The search on this page does not reach this one. '+
        'It is worked out step by step on the Proofs tab, under “' + s.name + ' — figure ' + s.fig + '”.</p>'
      : ''), SYLL_LIBRARY.has(s.name)]) });

/* ============================================================================
   FURTHER THEOREMS TO PROVE.
   Standard results from the usual logic courses, set here as things to reach
   by scribing and erasing. Every one was checked: the Alpha ones are
   tautologies by truth-value analysis, and the Beta ones have no countermodel
   on up to four individuals. Which of them the search on this page reaches was
   measured, not guessed, and the ones it cannot are marked.
   ========================================================================== */
const MORE_THEOREMS = [
  ['((P -> Q) -> P) -> P', 'Peirce’s law'],
  ['(P -> Q) | (Q -> P)', 'one conditional or the other always holds'],
  ['~(P <-> ~P)', 'nothing is equivalent to its own denial'],
  ['((P -> Q) & (~P -> Q)) -> Q', 'proof by cases'],
  ['(P & Q) -> P', 'simplification'],
  ['P -> (Q -> P)', 'a truth follows from anything'],
  ['(P -> Q) -> (~Q -> ~P)', 'contraposition'],
  ['(~Q -> ~P) -> (P -> Q)', 'contraposition, the other way'],
  ['((P | Q) & ~P) -> Q', 'the disjunctive syllogism'],
  ['((P -> Q) & (R -> S) & (P | R)) -> (Q | S)', 'the constructive dilemma'],
  ['~(P & Q) -> (~P | ~Q)', 'de Morgan'],
  ['(P | (Q & R)) -> ((P | Q) & (P | R))', 'or distributes over and'],
  ['(P -> (P -> Q)) -> (P -> Q)', 'contraction'],
  ['((P & ~Q) -> R) -> ((P & ~R) -> Q)', 'antilogism'],
  ['Ax (Fx -> Gx) -> (Ex Fx -> Ex Gx)', 'a universal carries into an existential'],
  ['Ax (Fx & Gx) -> (Ax Fx & Ax Gx)', 'a universal distributes over and'],
  ['(Ex Fx | Ex Gx) -> Ex (Fx | Gx)', 'an existential distributes over or'],
  ['Ex (Fx & Gx) -> (Ex Fx & Ex Gx)', 'some F that is G gives some F and some G'],
  ['Ax Fx -> Ex Fx', 'from all to some'],
  ['~Ax Fx -> Ex ~Fx', 'a denied universal'],
  ['Ax Ay Rxy -> Ay Ax Rxy', 'two universals commute'],
  ['Ex Ey Rxy -> Ey Ex Rxy', 'two existentials commute'],
  ['(Ax Fx & Ex Gx) -> Ex (Fx & Gx)', 'all F, and some G, so some F that is G']
];
// measured: these two are beyond the search here, whatever the setting. The
// others on this list were too, until the search learnt to assume the
// antecedent; they are reached now.
const THEOREM_HARD = new Set([
  '(Ex Fx | Ex Gx) -> Ex (Fx | Gx)',
  'Ax Fx -> Ex Fx'
]);
BOOK_EXERCISES.push({ group: 'Further theorems', items: MORE_THEOREMS.map(([f, name]) =>
  ['', f, name,
   '<p style="margin:0 0 6px"><b>' + name + '</b></p>' +
   '<p class="cite" style="margin:0">Proved from the blank sheet of assertion, which by C1 is '+
   'itself a graph. ' + (THEOREM_HARD.has(f)
     ? 'The search on this page does not reach this one; it is set as something to work by hand.'
     : 'The search on this page reaches this one.') + '</p>',
   THEOREM_HARD.has(f)]) });

/* The exercises are listed on the Prove it tab now, beside the worked proofs. */

/* ---- drawing as a pen would, shared by every panel ------------------------ */
(function bindHandPref(){
  const boxes = $$('.pref-hand');
  PREFS.hand = false;
  boxes.forEach(b => b.onchange = () => {
    PREFS.hand = b.checked;
    boxes.forEach(o => o.checked = PREFS.hand);
    const t = $('nav.tabs button[aria-selected="true"]');
    if (t) refresh(t.dataset.tab);
    if (typeof demoDrawAll === 'function') demoDrawAll();
  });
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
