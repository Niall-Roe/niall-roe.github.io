---
position: 7
number: 8
title: "How true?"
anchor: "but to decide how near my theory probably comes to the true theory or how it ought to be modified, would be a very intricate problem for the solution of which the data are probably insufficient."
heading: "New example — How true?"
status: building
container: example-ex8
---
### Text

"but to decide how near my theory probably comes to the true theory or how it ought to be modified, would be a very intricate problem for the solution of which the data are probably insufficient."

### Suggestions

Your question "what does the rest of the data show?" — if you mean the register's other
standards: the 1926 book continues past the qedet into Necef (152–169 grs), Khoirine, Beqa and
more; only the rough OCR covers those (data/qedet_1926_rough.csv), and the 1888 table's other
standards (Assyrian, Phoenician, Attic…) sit unverified in data/superseded/. Either could get the
verified treatment if you want a neighbouring-standard comparison — say which.

---

cut "The same machinery runs on either: set the number of standards, fit them, and see whether the extra data sharpens or dissolves the five."

in the both screen the summary curves need to be more prominent. 

also, for the both screen, can we just sum all the data? like, if there were 4 at 140 in the earlier set, just add those four to the later set. and present one, summed set. colour the bars like in the other views. but maybe make the earlier ones a littler darker or something. 

let me drag the standards around obviously. 

can the best fit button find the overall best fit given the assumptions that we have toggled on, like are we holding the spread, do they all have the same spared? are we holding the number of standards to the slider number? if we give it freedom, it should just find the real best fit. maybe just an additional button that says "best fit over all" or something is simpler. 

rewrite "The all-Egypt register is a broad single mound near 140–141 grains: weights from many towns and centuries piled together until the classes merge past recovery. Fit five standards to it and they crowd the middle instead of finding Peirce's five — his caution about what more data would show was well placed, though this register is a wider population, not a re-survey of Naucratis."

say something like, here there do appear to be 5 peaks, but [...[ but what? the five standards dont crowd the middle with I use it. is the message that they have merged beyond recoverY? 7 seems to do well idk. what's the takeaway?]

---

I mean, if you were to use CSP's method not he bigger data set, what standards would you find?

### Awaiting approval

#### fourth pass — distributions on the both view
The both view now draws each dataset's smoothed curve, the class curves in their colours, and the
model's sum, alongside the rescaled histograms; the single views use the full block-and-gradient
look.

##### the round-4 notes this answers

on the both view we need to see the individual distributions, and again the colour. 

also, what does the rest of the data show?

#### third pass — curves everywhere
The single-dataset views now draw the data's own smoothed curve in black over the blended bars, so
the model's sum has something to be compared against; the both view carries each dataset's smoothed
curve (blue for 1885, amber for 1926, rescaled) plus the model sum for the current standards, and
the standards stay draggable with best-fit and Peirce's-five buttons.

##### the round-3 notes this answers

we need distributions on the both view too. we also need the curve representing the data, against which we can compare the sum curve.

#### second pass — the full machinery on both registers
Rebuilt with the same engine as the rest: number-of-standards slider, draggable domes, best-fit
button (spread holdable at ⅝ grain), a "Peirce's five" reset, and dataset tabs — the 142, the 821,
or both rescaled — so the effect of the extra data is a matter of pressing fit on each and
comparing where the domes land.

#### asking the 1926 register
Built (second half of the spec): the 821 stone qedets of Petrie's 1926 register — newly transcribed from the plates and verified for this page — overlaid on the 142 Naucratis kets, with tabs for either dataset alone and a toggle for Peirce's five standards. The all-Egypt heap is a broad single mound with no fivefold structure at his standards; the example reads this as Peirce anticipated — many towns and centuries merge the classes inextricably, and only a one-town hoard keeps the clumping visible.

##### the original suggestion, for reference

This shoudl do two things. First, it should be where we show the intricate working out that would be required to show this (both what would have been available in Peirce's day, and what we would do now.)

second, we should here appeal to the much larger set of Kets from the later book and see if it helps.
