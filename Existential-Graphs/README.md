# Existential Graphs

A single self-contained page, `index.html`. Open it in a browser; there is no build
step and nothing is loaded from the network.

## What it does

- **Translate** — ordinary logical notation into an existential graph, with the graph
  read back endoporeutically and an English gloss. The formula boxes close their own
  brackets, pick out matching pairs, colour the notation as you type, and carry a row of
  buttons for the glyphs. `Ax`/`Ex` and `∀`/`∃` and `(x)`/`(Ex)` all work.
- **Proofs** — twenty-five proofs, animated step by step. Each step first marks the graph
  the rule is about to act on, then shows the transformation: enclosures growing to make
  room, a copy appearing where it was scribed, an erased graph fading away.
- **Scribe** — build a graph by hand (or from a formula, or from the linear notation),
  see what it says, and apply the rules to it. Every move offered is legal.
- **Find a proof** — a bidirectional search over the five rules, with a verdict on
  validity independent of the search.
- **Conventions & rules** — C1–C9 and R1–R5, quoted from Roberts' Appendix 3.

## Scope

Alpha and Beta. Gamma (the broken cut, graphs of graphs, modality) and the tinctured
graphs of 1906 are not implemented.

Alpha validity is decided outright by truth-value analysis, so a failed search is never
reported as a disproof. Beta validity is not decidable: a countermodel on a small finite
domain refutes conclusively, and otherwise the search reports only what it did and did
not find. The search handles Alpha theorems up to about eight steps and simple Beta
inferences; deeper Beta proofs, Barbara among them, are in the proof library instead.

## Where the exercises come from

Several of the theorems on the Proofs tab are the sort of thing set as natural-deduction
exercises in the open logic textbooks — *forall x: Calgary* (P. D. Magnus, Tim Button,
Aaron Thomas-Bolduc and Richard Zach, CC BY 4.0) and the Open Logic Project. The theorems
are common property; what is shown here is what becomes of them when they are proved by
scribing and erasing.

## Drawing conventions

Cuts carry a very light shadow, to separate the levels of a nest. Oddly enclosed areas are
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
