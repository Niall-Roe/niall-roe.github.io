---
container: example-ex1
position: 1
title: "Fechner's Lights"
status: awaiting
anchor: "Fechner1 gives an experiment to prove the fact assumed, namely: He finds that two very dim lights placed nearly in line with the edge of an opaque body show but one shadow of the edge. It will be found, however, that this phenomenon is not a clearly marked one, unless the lights are nearly in range. If the experiment is performed with lateral shifting of one of the lights, and with a knowledge of the effects of a telescope upon the appearance of terrestrial objects at night, it will be found very far from conclusive."
heading: "New example — Fechner's Lights"
---
### Text

"Fechner1 gives an experiment to prove the fact assumed, namely: He finds that two very dim lights placed nearly in line with the edge of an opaque body show but one shadow of the edge. It will be found, however, that this phenomenon is not a clearly marked one, unless the lights are nearly in range. If the experiment is performed with lateral shifting of one of the lights, and with a knowledge of the effects of a telescope upon the appearance of terrestrial objects at night, it will be found very far from conclusive."

### Suggestions

None open.

### Awaiting approval

#### the lamps, the edge, and the two boundaries

The first example on this paper, and the one the new pipeline was proved on.

A plan view looking down: two point lamps on a line behind a straight edge, and
the bands they throw on a screen in front of it. Both distances are kept equal,
so the two shadow boundaries are symmetric about the edge and their separation
is exactly the lamps' — which means the reading can quote a number off the
picture without a scale note.

Three bands, greyed at the light levels they actually carry: lit by both, lit by
one lamp only, lit by neither. Two buttons for the two settings the passage
turns on. "Nearly in line" puts the boundaries 1 cm apart and the strip
disappears — Fechner's single shadow. "Shifted sideways" puts them 40 cm apart
and there are plainly two, with no least perceptible difference crossed to see
it. That is your clarification: what the experiment shows depends on where the
lamps are put, and it can be made to come out either way.

The dimness slider carries the other half. The step a viewer must catch is
between half the available light and none, so at 22% brightness it is a
difference of 11% of full light, and it shrinks as the lamps dim — which is why
the experiment is easiest to pass in the dark.

The telescope clause is not drawn. It is a second and different objection and I
did not want to crowd the geometry; say if you want it.

#### soft edges, and only one lamp moving

**The edges are blurred, and the blur follows the brightness.** Two point
sources would throw edges of no width at all, and then whether two shadows read
as one would be a question about the eye that the picture could not answer. Real
lamps have size, and a dim lamp is judged by dark-adapted vision, which resolves
less. So each boundary is now a smooth fall rather than a step, over a width of
1 + 18(1 - brightness) cm, and the band is drawn as the light level actually
falling at each point rather than as three flat rectangles.

They now genuinely merge. Whether you see one shadow or two is settled the way
an eye settles it: the steepness at each boundary against the steepness at the
middle of the strip. Two resolved edges leave a flat landing between them; once
they wash together the middle is the steepest place of all, and there is one
edge. Measured on the built page, the separation needed to split them runs
3 cm at full brightness, 18 at 60%, 30 at 30%, 38 at 10% — so the brightness
slider and the shift slider now work against each other, which is the point.

**The label toggle is gone.** They stay labelled.

**Your question about one lamp: yes, it matters, and the text was right.** It
now moves lamp 2 only, with lamp 1 fixed — "lateral shifting of ONE of the
lights". Not just fidelity: with one lamp fixed its boundary is fixed too, so
the shifted lamp's edge walks away from a mark that stays still and the
separation is read against something. Moving both symmetrically kept the figure
tidy and quietly lost that.

#### the blur pulled back, and the slider named for what it does

**You found a real bug in the slider.** It was labelled "How dim the lamps are"
but drove brightness: 100% "dim" was the sharpest, brightest setting, and 5%
"dim" was the murkiest. Inverted, exactly as you said. It now reads "How bright
the lamps are" and the variable behind it is named for that too. No arithmetic
changed — only the label was ever wrong, which is why it was easy to miss.

**The blur was far too wide.** It ran to 15 cm at these brightnesses, which did
not soften the edge so much as delete it: there was nowhere you could point to
and say the shadow began there. It now runs 0.8 cm at full brightness to about
5.7 cm at the dimmest. There is always a definite place where light becomes
shadow, thin though it is, which is what you asked for.

The separation needed to split the two edges is correspondingly tighter, and
still moves with brightness: 3 cm at full, 7 at 60%, 11 at 22%, 12 at 10%.
Measured on the built page.
