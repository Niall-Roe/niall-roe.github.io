---
position: 4
number: 5
title: "Alternative view"
anchor: "n order to represent these observations, I have adopted the following rough-and-ready theory; for to make elaborate calculations would, from every point of view, be a waste of time"
heading: "New example — Alternative view"
status: awaiting
---
### Text

"n order to represent these observations, I have adopted the following rough-and-ready theory; for to make elaborate calculations would, from every point of view, be a waste of time"

### Suggestions

Your details of Peirce's alternative approach, when ready — the historical half of this entry
is the one thing on the page I cannot build without you.

### Awaiting approval

#### seventh pass — the calculations, in the picture you know
Your recollection is right, and the example now says so plainly: the modern name for Peirce's
rough-and-ready theory is a *gaussian mixture model*, and that is what this was already fitting
(by expectation–maximization) — the fault was the display, not the method. So the BIC bar chart
and the separate bootstrap strip are gone. Press run, and a number-of-standards slider draws each
fit in the same picture as everywhere else on the page: the kets as gradient bars, the class
curves and their dashed sum, the black smoothed curve of the data, domes on the axis at the fitted
standards. The 150 resamplings are small ticks along the floor beneath each standard, so how
firmly the data pin it down shows in place rather than in a second chart. The readout gives that
fit's score, the number the criterion prefers, and the two-standard moral; the explainer carries
the indent.

##### the notes this answers

This one does not make it clear to me what is going on.

and when you add text... indent it. that is a global. universal always change that I dont want to have to remind you of every time forever thanks.

is this the best approach? I recall here being something called like a gaussian mixture model or something.

whatever we do, it shoudl display the standards in the same way we have been displaying them. the graphs you have here dont really tell ole anything.

#### sixth pass — the computable half, built
Un-parked as far as it can be: the "how would we calculate it today" half is now example 5 in the
article, anchored on the rough-and-ready sentence. Press run: EM mixture fits for one through six
standards, compared by BIC, plus 150 bootstrap resamplings showing where five standards land. The
result is worth your eye: by parsimony on the 142 weights alone the criterion prefers two broad
standards — five are not demanded by the numbers, and what licenses five is the outside knowledge
that a single weight's probable error is near half a grain, which forbids classes as loose as the
two-standard fit needs. The readout says exactly this, computed fresh each run. The historical
half — Peirce's own alternative approach — still awaits your details, and the panel can absorb it
when they come.

##### the notes this answers

Waiting on your details of Peirce's alternative approach before building.

[from the build] For the "how would we calculate it today" half: the natural modern rendering is an equal-variance Gaussian-mixture fit by EM (the Kets.R app already does this with mixtools), with the number of standards chosen by BIC and uncertainty by bootstrap. I can build that half now if you want it without waiting on the historical half.

---

yeah lets build that now. what did your look at First Attempt suggest about the historical method? try to build that too.
