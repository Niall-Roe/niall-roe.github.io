# Existential Graphs

A single self-contained page, `index.html`. Open it in a browser; there is no build
step and nothing is loaded from the network.

## What it does

- **Translate** — ordinary logical notation into an existential graph, with the graph
  read back endoporeutically and an English gloss.
- **Proofs** — thirteen proofs, animated step by step, each step labelled with the rule
  that licenses it.
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

## Verification

Every proof in the library is checked at load time: each step must follow from the one
before by a single application of one of the five rules. Barbara reproduces Roberts'
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
