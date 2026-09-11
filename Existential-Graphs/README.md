# Existential Graphs

A single self-contained page, `index.html`. Open it in a browser; there is no build
step and nothing is loaded from the network.

## What it does

- **Translate** — ordinary logical notation into an existential graph, with the graph
  read back endoporeutically and an English gloss. Type and the drawing moves into its
  new shape rather than blinking: the two graphs are matched up by shape first, so the
  parts they have in common travel. The formula boxes close their own
  brackets, pick out matching pairs, colour the notation as you type, and carry a row of
  buttons for the glyphs. `Ax`/`Ex` and `∀`/`∃` and `(x)`/`(Ex)` all work.
- **Proofs** — twenty-five proofs, animated step by step. Each step first holds everything
  back except the graph the rule is about to act on, ringing it and drawing an arrow to
  the area it is going into; then the transformation runs, with enclosures growing to make
  room, a copy appearing where it was scribed, and an erased graph fading away.
- **Scribe** — build a graph by hand (or from a formula, or from the linear notation),
  see what it says, and apply the rules to it. Every move offered is legal.
- **Find a proof** — a bidirectional search over the five rules, with a verdict on
  validity independent of the search, and a dropdown of textbook exercises to try.
- **The proof in writing** — under both players, the same proof set down as text: each
  graph in the linear notation, in ordinary notation, or in both, with the rule that
  carried one line to the next. Every line is parsed back and checked against the graph
  it stands for, and can be copied out.
- **Conventions & rules** — C1–C9 and R1–R5, quoted from Roberts' Appendix 3.

## Scope

Alpha and Beta. Gamma (the broken cut, graphs of graphs, modality) and the tinctured
graphs of 1906 are not implemented.

Alpha validity is decided outright by truth-value analysis, so a failed search is never
reported as a disproof. Beta validity is not decidable: a countermodel on a small finite
domain refutes conclusively, and otherwise the search reports only what it did and did
not find. The search handles Alpha theorems up to about eight steps and simple Beta
inferences; deeper Beta proofs, Barbara among them, are in the proof library instead.

## Exercises

The Find a proof tab carries a dropdown of the exercises set for natural deduction in
*forall x: Calgary* (P. D. Magnus, Tim Button, Aaron Thomas-Bolduc and Richard Zach),
reproduced under its CC BY 4.0 licence and worked here by scribing and erasing instead.
Choosing one fills the boxes and runs the search. Of the fifty-odd, the search finds all
but two — Barbara and Darii, which are on the Proofs tab instead — and four need the
"search harder" setting.

Where the book uses `A` as a one-place predicate the letter is changed, since `Ax` reads
as the universal quantifier in this page's notation.

## Drawing conventions

Each line of identity can be given its own colour where there is more than one, which
helps the eye at crossings. Peirce drew in one ink, so this is an aid like the shading and
can be turned off. Cuts carry a very light shadow, to separate the levels of a nest. Oddly enclosed areas are
shaded, which is Peirce's own device in MS 514. Where one line of identity crosses another
the horizontal one hops over it — Peirce's 'bridge', "a bit of paper ribbon, with one line
passing under it and the other upon it". Hooks are laid down a spot's left edge in the
order of the lines that reach them, so a spot's own lines never cross; the numerals carry
the order of the argument places instead.

## Verification

Every proof in the library is checked: each step must follow from the one before by a
single application of one of the five rules, the first graph must be the premisses and the
last the conclusion. The proofs are also replayed through the rules engine when loaded, so
that the animation follows the very nodes the rules act on. Barbara reproduces Roberts'
published proof (p. 61) step for step, under his own rule sequence — R3, R1, R3(a),
R3(b), R2, R4, R5, R1.

## Linear notation

Used by the Scribe tab and by the proof library.

| | |
|---|---|
| `P Q` | two graphs juxtaposed on one area (C3, conjunction) |
| `( X )` | a cut with X on its area (C5) |
| `( )` | the empty cut, the pseudograph |
| `{ A \| B }` | a scroll: A on the outer close, B on the loop (C4) |
| `*x` | a point of the line of identity `x` on this area |
| `F[x,y]` | a spot whose hooks lie on the lines `x` and `y` |
| `x~y` | two lines joined on this area |
| `"is a catholic"` | a spot whose name contains spaces |

## Sources

Don D. Roberts, *The Existential Graphs of Charles S. Peirce* (The Hague: Mouton, 1973),
chapters 3 and 4, Appendix 3 (conventions and rules) and Appendix 4 (completeness and
consistency).

Charles S. Peirce, MS 514 (1909), transcribed with commentary by John F. Sowa,
<https://www.jfsowa.com/peirce/ms514.htm>. The shading of oddly enclosed areas and the
praeclarum theorema come from there.

References of the form 4.492 are to the *Collected Papers*.
