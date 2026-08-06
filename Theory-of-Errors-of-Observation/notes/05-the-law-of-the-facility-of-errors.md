---
position: 5
number: 2
title: "The law of the facility of errors"
status: awaiting
anchor: "These accidental variations are, however, in all cases subject to a statistical law, so that (observations of a certain kind forming the limited universe, X bei"
group: "The Theory of Observations"
container: example-ex2
heading: "2 — The law of the facility of errors"
---

Status: awaiting approval

### Text

"These accidental variations are, however, in all cases subject to a statistical
law, so that (observations of a certain kind forming the limited universe, X
being the unknown quantity, Xi the quantity observed) the quantity,"
... "The special form of the function phi is called the law of the facility of
the errors."

### Suggestions

- The strip is fixed at 0.10 wide. Should it be a slider, so that d-epsilon
  getting small is something you can watch? This matters more now that the strip
  is carrying Peirce's d-xi.
- "Two observers run together" anticipates the splitting-the-universe section a
  long way ahead. Keep it here, or hold it back?
- [from the build] The limited universe is only implied — it is whatever kind of
  observation is selected, and changing the kind clears the shots. Worth making
  explicit in the graphic, or does the radio button carry it?

### Awaiting approval

#### phi as a relative number, folded in from the passage above

Four kinds of observation, all named by Peirce: transit observations (normal), a
star out from behind the moon (skewed right, no mass to the left), a coarse
instrument (uniform), and two observers run together (bimodal). The marksman is
on the left and the law on the right — the same fact drawn twice, since the
horizontal scatter of the shots is what the curve describes. A strip of width
d-epsilon runs across both.

The passage between examples 1 and 2 is where phi comes from, so it now opens
this example too. Peirce defines it as a relative number, and the example was
already computing that ratio without naming it, so the statement is two-sided —
a tally on the left, a law on the right:

    the shots in the strip, out of      =     the height of the law there,
    every shot fired                          times the width of the strip

    [xi_Xi , x_x] / [x_x] . d-xi              phi(e, x) . de

    24 / 400 = 0.0600                         0.807 x 0.10 = 0.0807

The bracket notation uses the same mirrored inverted comma as the article text.
The readout gives both numbers and says they close on each other as more shots
are fired, which is the whole content of the claim. A line underneath notes that
the left side is a tally and nothing else, that the limited universe here is
every shot this marksman fired, and that since e = xi - x the two differentials
are the same width.

Example 2 now opens from three passages; only the first takes the margin
number, which needed a change to the shared scaffolding.

Two layout bugs fixed on the way: a note spanning every column of the statement
grid was dumping its whole width into the operator column (337px), and the
three-column variant outranked the narrow-screen rule so it never collapsed on
mobile.

### Completed

None yet.
