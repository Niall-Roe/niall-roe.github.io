---
preamble: true
---

A Theory of Probable Inference — Examples


STATUS

Examples 1, 2 and 3 are built. The rest is the survey pass: every place in the
paper where I think an interactive example earns its keep, numbered in the order
it appears in the text, with the passage it would hang off and what it would do.

BUILD NOTE

The page is now assembled from parts, as the Probability of Induction page is:
run ./build.sh in this folder to write index.html from src/. ./build.sh --check
says whether index.html is behind src/.

  src/01_head.html    <head>, all CSS, opens .article-container
  src/02_article.html Peirce's text, triggers, example containers, footnotes
  src/03_lib.js       maths, the canvas renderer, DOM helpers (from PoI, as-is)
  src/04_scaffold.js  triggers, live numbers, margin numbers (from PoI, as-is)
  src/05_ex123.js     examples 1-3
  src/99_tail.html    closes </body></html>

03 and 04 are the Probability of Induction's own files, unedited, so anything
written for either paper runs in the other. One part file per group of examples
from here on, so an example can be edited without touching the text.

Numbers are assigned in reading order, not build order. (The Errors of
Observation page numbered in build order and left gaps; here the paper is
already whole, so reading order costs nothing and the margin numerals will run
down the page in sequence.) If you would rather number as they are built, say
so — it is one line per example.

The page itself has been reformatted to match the Probability of Induction
edition: same palette, same type, same margin gutter, and the whole example
scaffolding from that page (.example-trigger, .example-container,
.example-header, .ex-num, .live/.k1–k4, .hl-text, .hl-band, .mode-tabs, the row
/ col grid) is already in the stylesheet here. So an example written for that
page drops into this one with no restyling, and the margin number appears beside
its trigger automatically from the container id.

The page-number and paragraph-number marginalia are gone.


GENERAL, CARRIED OVER FROM THE OTHER TWO PAPERS

- Wherever a number or a phrase of Peirce's is being driven, drive it in his own
  sentence: wrap it in .live and colour-code it to the control that moves it.
  Sliders in preference to number entry wherever the quantity is ordered.

- Continuity matters more here than anywhere, because this paper is Peirce
  rebuilding the same three arguments — deduction, induction, hypothesis — from
  five different angles. Where an example restates something the reader already
  met in the Probability of Induction, reuse that example's graphic and say so,
  rather than inventing a second picture of the same thing. Several of the
  examples below are explicitly "PoI's ex-N, re-pointed."

- This paper is more schematic than the other two: its content is very often a
  three-line argument form. So the default graphic here is the argument itself,
  set out, with the terms live and colour-coded, and a population picture beside
  it — not a chart hanging off to one side.

- Peirce's Forms I–V and the "(bis)" variants are already set off with hairlines
  in the page. Those blocks are the natural anchors: an example that belongs to
  a Form should open under that Form's block, not three paragraphs later.

- Let the text do the explaining. Where an example needs a word of its own, say
  it plainly.

- [square brackets] as before: something for the reader to set.













- The whole of the discussion of the copula of inclusion (section V, "This
  classification of probable inference is connected with a preference for the
  copula of inclusion over those used by Miss Ladd and by Mr. Mitchell"). It is
  a remark to his co-authors in Studies in Logic. Nothing moves.

- The decapitated frog. It is an analogy, not a mechanism, and a picture of it
  would be either grisly or coy.

- Section X's closing pages on Gratry and the miraculous intervention, and on
  whether the mind is adapted to the universe. Argument, not quantity.

- The gap at pp. 150–151. Tempting to reconstruct Form VI in a "coming soon"
  block, since example 14 gets close to it, but reconstructing missing Peirce
  and presenting it interactively is a different kind of act from illustrating
  him. Left alone unless you want it.



(One block per example as it is built, appended here, per the convention in the
Errors of Observation notes.)

1  built.  Awaiting your read.
2  built.  Awaiting your read.
3  built.  Awaiting your read; two open questions above, on euchre and on the
   default setting of the care dial.
4-28  not built.
