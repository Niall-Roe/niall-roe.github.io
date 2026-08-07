---
position: 4
number: 1
title: "The quantity observed and the quantity wanted"
status: done
anchor: "We now pass to the theory of observations. An observation gives us the value of a certain quantity which is connected with an unknown quantity in such a way as to be partly dependent on the latter value, and partly on accidental circumstances, not capable of being separately taken account of"
group: "The Theory of Observations"
container: example-ex1
heading: "1 — The quantity observed and the quantity wanted"
---
Status: awaiting approval

### Text

"We now pass to the theory of observations. An observation gives us the value
of a certain quantity which is connected with an unknown quantity in such a way
as to be partly dependent on the latter value, and partly on accidental
circumstances, not capable of being separately taken account of."

### Suggestions

- Is the transit-instrument framing right this early, or should the first
  example be neutral about what is being measured?
- [from the build] The three-row statement — words, then Peirce's symbols, then
  the numbers — is the pattern I propose to reuse for every formula in the
  paper. Say if you want it the other way up, or the modern line added as a
  fourth row rather than as a footnote.
- TO EDIT: the opening paragraph of the example is a placeholder of mine and is
  yours to rewrite. It is the only prose left in the example, and it carries the
  colour key for the whole paper — unknown quantity green, accidental
  circumstances red, quantity observed blue — so whatever replaces it should
  still name those three things; the three coloured spans are in the markup and
  want keeping. The transit instrument as the running example is open too. It is
  marked with a TO EDIT comment at the top of src/06_ex1.js.

### Completed

#### the statement at the top, the cumulative cloud, the residual

Three colour-coded phrases in Peirce's own sentence light when the example
opens. Sliders set T and the reach of the accidental circumstances; buttons
observe once or fifty times. A number line shows T as a green rule and each
observation as a dot, the newest bracketed back to T and labelled with its own
epsilon; underneath, the series piles into a histogram. The statement sits at
the top, above the controls:

    the quantity observed = the unknown quantity + the accidental circumstances
             O_i                     T                        e_i
            4.911                  5.000                    -0.089

The = and + are set once, in the top row only. The cloud is cumulative: every
observation is kept and drawn faint at a vertical position fixed when it was
made, so the pile darkens where the observations fall thickest — measured on the
built page, the dense middle reads about 30% darker than the sparse edges.

A checkbox hides the unknown quantity; nothing in the data changes when it does,
which is the observer's actual position. A second checkbox shows the mean as a
gold dashed rule, and with the unknown quantity hidden the third term becomes
the residual — the bracket is measured from the mean, labelled r, and the
statement reads O_i = x-bar + r_i in gold rather than green and red. With both
shown, both brackets draw, and the gap between them is the difference between an
error and a residual.

All closing prose cut, at your instruction. The example ends at the plots.
