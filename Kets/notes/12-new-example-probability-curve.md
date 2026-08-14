---
position: 12
number: 13
title: "Probability Curve"
anchor: "As for my assumption that the departures of the single weights from their virtual standards conform to the probability curve, it was only adopted as a ready way of imparting definiteness to the problem. Rich as is the store of data given by Petrie, it is insufficient, apparently, for determining the true law of those departures."
heading: "New example — Probability Curve"
status: done
container: example-ex13
---
### Text

"As for my assumption that the departures of the single weights from their virtual standards conform to the probability curve, it was only adopted as a ready way of imparting definiteness to the problem. Rich as is the store of data given by Petrie, it is insufficient, apparently, for determining the true law of those departures."

### Suggestions

None open.

### Completed

#### ninth pass — your sentence
The assume-nothing readout is now just your line: “Without a law of error you cannot say anything
about the new ket (aside from how much it weighs).”

##### the notes this answers

just fix this:

With nothing assumed: the standards sit there, the ket sits there, and there is no proportion to report — not an unknown number, no number. Definiteness has to be bought, and some law of error is the coin.

make it:

Without a law of error you cannot say anything about the new ket (aside from how much it weighs).

#### eighth pass — possibility, not height, lights the column
I had the rule wrong: the column was lit by whichever curve stood tallest over it, so a standard
that could not have thrown the ket still showed its colour. Now the column lights only the curves
of standards that could have thrown *this* ket — a standard whose wager is nil keeps its curve
dark however tall it stands, so no green appears until the ket comes under the green curve — and
within the column each colour still keeps to its own curve. Both standards are draggable now,
along with the ket. A beta law is a fifth tab, with α and β sliders. The readout sits behind the
grey rule so it cannot be read as paper text; the “drag the black ket…” sentence is cut from the
gaussian and flat readouts; the nearer-yet-impossible sentence is recomputed from wherever the ket
and standards actually are, and names the standard it is about. The ask-the-data-which-law button
is gone.

##### the notes this answers

this is still not working. I would do a new screen shot but the problem is the same. do you see what the problem is? if the ket is near the green one, it is still only possible that it came from yellow, so no part of the green curve should be lit up (until the ket is under that curve)

lets also make the two standards movable?

also globally, if you have added explainer text it needs to be indented. "assuming a ... ] looks like it is part of the paper which is bad. 

 also add the alpha beta distribution mode here. 

here are the texts we can use (remember to grey indent these)

Gaussian:fine, but cut this: 
Drag the black ket, change the law, and watch the wager move.

same for flat.

 for the sharp ones, this sentence should update depending on where the ket is "This ket sits nearer the 144.7 standard, yet under a law that cuts off sharply just above each standard, 144.7 cannot have thrown it."

remove the "ask the data which law" button

#### seventh pass — colours keep to their own curves
The fill now runs blended up to the lower curve only; above that, the taller curve's own colour
alone continues — the amber never climbs the green slope, and with the sharp-cutoff law the green
shading ends exactly where green's possibility ends, which also keeps the earlier 0%-wager fix
honest rather than a patch.

##### the notes this answers

None open.

#### sixth pass — the data asked which law
The second half is built: "ask the data which law" scores the probability curve, the flat
tolerance, and the sharp cutoff on the 142 kets about Peirce's five standards by log-likelihood,
prints the three totals, and notes that the margins are a handful of log-units on 142 weights —
his "insufficient, apparently," made quantitative.

##### the notes this answers

Second half (whether the true law can be determined from the data) still open.

---

the yellow obviously should not climb up the green curve either. yellow bit stays under yellow there.

#### fifth pass — the column obeys the wager
The activation column is now coloured uniformly by the wager at the ket itself, so a 0% wager
shows no trace of that standard's colour anywhere in the column — the green shading you saw is
gone in that case. (The gentle green in the area fill under the curves remains, as that shows the
curves' own territory rather than this ket's wager.)

##### the note this answers

the nearer but less likely button says 0% of the time but there is some green shaded... I suppose that is right because the ket is outside of its possible zone. but then this needs to be reflected by not having the green be shaded in. do not want a band aid fix but want it to work. I suppose there should be no green shaded unit the ket crosses the line, then it can shade in.

#### fourth pass — the column, saturated and clipped
The header no longer says "what the assumption buys." The area fill under the curves stays at its
gentle saturation; the found ket now activates a saturated column one probable error wide, clipped
to the curves themselves — no box, and its width follows the PE slider. The flourish sentence is
cut.

##### the round-4 notes this answers

dont say "what the assumption buys" no stupid ai language please. 

lets keep the saturation under the curves like it is but bump up the saturation in the column. it should not be a box. it should just be a column of saturated colour. it should not extend out beyond the curve. it should be SUPER clear which bits of the curve are being "Activated" by our ket. 

cut "the farther standard is the likelier origin. Nearness is not likelihood; the law decides."

#### third pass — the colour climbs the curves
The flat bar is gone: the colour now fills the area under the curves themselves, slice by slice,
blended by who would own a ket found there — so the big area under the tall green peak argues
visibly against the horizontally-wider amber stretch, exactly the intuition you wanted. The
column around the found ket is now one probable error wide and follows the PE slider.

##### the round-3 notes this answers

Second half (can the true law be determined from the data) still open, with the earlier
[from the build] proposal standing.

---

This is way better. two ideas. first, changing the PE shoudl also change the width of the coloured bar, no?

can we make it so taht the colour there goes up and fills the curves, not just a flat bar at the bottom? that might also make the examples more intuitive and interesting, like there is a lot more area under the tall part of the left curve than the horizontally larger area under the yellow one (in the nearer case) and so it might be closer than we think. lets do that and rejig that case as necessary.

#### second pass — laws of error, the gradient band, and nearer-yet-less-likely
Rebuilt to your notes: your intro text; law tabs (probability curve, flat within a tolerance,
smooth-left with a sharp cutoff just right of the standard, and assume-nothing); the band around
the found ket is a green–yellow gradient coloured by who would own each sliver, while the space
under the curves stays clean; the readout follows your template ("Assuming a [law] law of error,
and two standard kets at [x] and [y] grains, we would wager…"); a probable-error slider; and the
preset you described — "nearer, yet less likely" — places the ket just above the green standard
under the cutoff law, where the farther standard is the likelier origin, with the point stated.

#### what the assumption buys
Built (first half): two standards and a draggable middling ket, with a toggle between "assume the probability curve" (proportions computable and shown) and "assume nothing" (the readout explains there is then no proportion to report — not an unknown number, no number). This is the "show how the assumption is needed" half of the spec.

##### the original suggestion, for reference

First, show how the assumption is needed. without it, we cant tell which weight might belong where. 

second, if there is a way to determine the true law of errors, we could run it here. I dont know what the best methods are nowadays.
