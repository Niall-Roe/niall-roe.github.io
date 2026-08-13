---
position: 11
number: 12
title: "Market Forces"
anchor: "For example, where government does not insure uniformity in weights, it is usual for buyers to bring their own weights. It would thus naturally happen that some balance-weights would be manufactured for the use of buyers, and others for the use of sellers; and thus there would naturally be a tendency to the crystallization of a heavier and a lighter norm."
heading: "New example — Market Forces"
status: done
container: example-ex12
---
### Text

"For example, where government does not insure uniformity in weights, it is usual for buyers to bring their own weights. It would thus naturally happen that some balance-weights would be manufactured for the use of buyers, and others for the use of sellers; and thus there would naturally be a tendency to the crystallization of a heavier and a lighter norm."

### Suggestions

None open.

### Completed

#### fourth pass — tolerance defaults to 2 grains
Done as asked.

##### the round-4 notes this answers

It is great. Make the default starting discrepancy tolerance 2 grains and we are done

#### third pass — tight classes
The classes keep their probable error as they migrate: the spread no longer grows with the
generations, so the two norms walk apart as tight as they began. (The looseness before was
accumulated copy-of-copy error; cut as you asked.)

##### the round-3 notes this answers

Ya this is nice. The dist.s get really spread out. is there a way to make them grow apart but also remain a little tighter? like the PE should remain the same. as they migrate around, they dont also get way looser standards.

#### second pass — play, stabilization, and the ghost kets
Rebuilt to your notes: your preamble verbatim; a play button that runs the generations (slider
still live); a "largest tolerated discrepancy" slider — the norms drift apart and then stabilize,
hovering at that separation, with the readout saying why; the two class curves superimposed on the
histograms; and the black ket now visibly was a buyers' ket and a sellers' ket on top of one
another — they ride out with the two means while a grey ghost holds the weighted middle and a
dotted line marks where the one standard stood.

#### crystallization of two norms
Built as specced: one standard; sliders for bias per generation and number of generations of copy-of-copy; buyers' weights drift heavy, sellers' light, copying error accumulating as the generations advance, so one class visibly splits into a bimodal pair. The noise is frozen so the slider replays one history rather than rerolling. The readout names the two emerging norms and makes the point: nobody decreed either — a virtual standard is the fixed point of a practice, and two practices make two.

##### the original suggestion, for reference

Could show a single standard, and have the user set sliders for how the bias sets in after each copy. Then let them copy weights n times and see how they diverge into two standards, one slightly one way for the seller and the other for the buyer.
