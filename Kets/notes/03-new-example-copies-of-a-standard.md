---
position: 3
number: 4
title: "Copies of a standard"
anchor: "it is evident that the weights were intended to be copies of several different standards, probably four or five; for there would be no use of a balance, if one could detect the errors of the balance-weights by simply “hefting” them, and comparing them with one's memory of the standard weight. Considering that these weights are small, and were therefore used for weighing costly or even precious matter, our knowledge of the practice of weighing among the ancients gives us ground for thinking it likely that about half the weights would depart from their virtual standards by more, and about half by less, than, say, four or five tenths of one per cent, which, upon a ket, would be from half to two-thirds of a grain."
heading: "New example — Copies of a standard"
status: awaiting
container: example-ex4
---
### Text

"it is evident that the weights were intended to be copies of several different standards, probably four or five; for there would be no use of a balance, if one could detect the errors of the balance-weights by simply “hefting” them, and comparing them with one's memory of the standard weight. Considering that these weights are small, and were therefore used for weighing costly or even precious matter, our knowledge of the practice of weighing among the ancients gives us ground for thinking it likely that about half the weights would depart from their virtual standards by more, and about half by less, than, say, four or five tenths of one per cent, which, upon a ket, would be from half to two-thirds of a grain."

### Suggestions

None open.

### Awaiting approval

#### eighth pass — buttons that hold still
The cast button no longer moves: the copies count has come out of the button bar (it is reported
in the readout under the plot instead), so nothing shifts when it appears, and both bars are set
in the small button size with the settings pinned left and the actions pinned right, so the
figuring row no longer spills. Randomize is on the known view too — there it also sets the
probable-error slider to the spread it drew with, since on that page everything is known. And each
per-standard spread slider now wears its own standard's colour, thumb and value alike.

##### the notes this answers

this is good except for the buttons. the cast button moves after I hit it. on the figuring page they seem to sort of spill over. lets have a randomize button on the known view too. 

when I untangle "same spread for each" it works great, but the slider colours dont match the dist colours. 

(the gradient is perfect, thank you.)

#### seventh pass — your comments, item by item
Each line of your paste, as pasted. The intro is your text ("If you knew the standards and you
knew how well standards would be copied…"); the old "Two directions through one picture" is cut.
In figuring-out mode the cast button is gone: the bar there is *randomize* (a hidden truth —
two to five standards at a spread you are not shown, 100 copies of each), *snap to best fit*
(does the best under your toggles), and *reveal the actual* (overlays, dotted, the
distributions from the assuming-known page). The bars in figuring mode are no longer exact blocks:
they shade smoothly bin to bin in the candidates' colours, this palette not the screenshot's. The
readout is your text — "The solid black curve is a smoothed out summary of the histogram (more on
how Peirce smoothed his data below). The red dashed curve is the sum of your [n] candidate
standards. Average miss: [x] weights per class. Drag the standards to bring the dashed curve onto
the black one." — with the law sentence cut. The laws are gaussian only: a "hold the probable
error at the slider" toggle and a "same spread for each" toggle (per-standard spread sliders
appear when the latter is off). And the bars are regrouped: resets on the left, cast+clear
together on the right; in figuring mode, toggles left, actions right.

##### the notes this answers

seriously, please read and implement my comments! here I am literally just copy pasting:

cut this "Two directions through one picture. Assuming known standards goes the easy way: place standards, cast copies, and see the distribution they print — every copy one block in its standard's colour. Figuring out the standards is Peirce's actual task, run in reverse: you are given only the heaped-up data, you choose a law of error, you place candidate standards, and you compare the curve your guesses imply with the curve the data draw."

write."If you knew the standards and you know how well standards would be copied, you could predict how many weights would cluster around each standard. However, if you just had the data, you would have to instead try to select the values of standard and probable error that would, if correct, be most likely to have produced the data. Use the below to explore both circumstances. In the first mode, set the standards and generate kets. In the second, pretend you do not know the standards, and try to fit them."

we need to make it clear that the data is generated according to the first. mode and the point of the second mode is to try and fit that data. maybe on that second mode the cast Botton shoudl be replaced with the fit button. also, in the figuring out mode there should be a randomize button, that sets a random number of standards at a random PE and draws 100 copies of each. then there should be a snap to best fit button (which does the best with the settings you have decided), but also a reveal actual button, which just shows the distributions from the assumed known page.

.when we switch from known to figuring, the bars should no longer be exact blocks, but be gradients.

I put a screenshot in at around 531. the colours here are too bright and the lines too bold, but this is the general I deal I mean with the gradient. do something liek that. (for the figuring out mode)

Write: the solid black curve is a smoothed out summary of the histogram (more on how Peirce smoothed his dat below). The red dashed curve is the sum of your [] candidate standards. Average miss: 8.44 weights per class. Drag the standards to bring the dashed curve onto the black one.

cut:"Without a law restricting each curve, any placement could be excused; the law is what gives the comparison force."

for this example, lets only have the gaussian with a toggle for fixing the probable error on and off, and one for same spread each. (no flat or sharp dist.s)

have the cast and clear buttons be grouped together. same for the resettings. maybe settings on left and action buttons on right.

#### sixth pass — spreads in hand
Under "gaussian, own spread each," a spread slider now appears for every candidate standard, so
the spreads can be shaped by hand before (or instead of) snapping; snap still fits them, and
dragging a dome takes over from the fit.

##### the notes this answers

Adjustable per-standard spreads before snapping (when "gaussian, own spread each" is chosen)
are not in yet — snap fits them, but there is no hand control. Proposal: a small spread slider
per guess, shown only under that law. Say the word.

---

cut this "Two directions through one picture. Assuming known standards goes the easy way: place standards, cast copies, and see the distribution they print — every copy one block in its standard's colour. Figuring out the standards is Peirce's actual task, run in reverse: you are given only the heaped-up data, you choose a law of error, you place candidate standards, and you compare the curve your guesses imply with the curve the data draw."

write."If you knew the standards and you know how well standards would be copied, you could predict how many weights would cluster around each standard. However, if you just had the data, you would have to instead try to select the values of standard and probable error that would, if correct, be most likely to have produced the data. Use the below to explore both circumstances. In the first mode, set the standards and generate kets. In the second, pretend you do not know the standards, and try to fit them."

we need to make it clear that the data is generated according to the first. mode and the point of the second mode is to try and fit that data. maybe on that second mode the cast Botton shoudl be replaced with the fit button.  also, in the figuring out mode there should be a randomize button, that sets a random number of standards at a random PE and draws  100 copies of each. then there should be a snap to best fit button (which does the best with the settings you have decided), but also a reveal actual button, which just shows the distributions from the assumed known page. 

.when we switch from known to figuring, the bars should no longer be exact blocks, but be gradients. 

I put a screenshot in at around 531. the colours here are too bright and the lines too bold, but this is the general I deal I mean with the gradient. do something liek that. 

Write: the solid black curve is a smoothed out summary of the histogram (more on how Peirce smoothed his dat below). The red dashed curve is the sum of your [] candidate standards. Average miss: 8.44 weights per class. Drag the standards to bring the dashed curve onto the black one.

cut:"Without a law restricting each curve, any placement could be excused; the law is what gives the comparison force."

for this example, lets only have the gaussian with a toggle for fixing the probable error on and off, and one for same spread each. 

have the cast and clear buttons be grouped together. same for the resettings. maybe settings on left and action buttons on right.

---

this text should be indented like the blurb at the very start, so that it does not look like paper text. 

the play button is good. but lets mark the standards at the pauses, not just at the end. 

the flag a standard here Botton can go. but it shoudl effectively flag one wherever peirce did automatically. 

when paused, the play button should read, continue. 

after the histogram is drawn, we sohuld get to see how he generates the smoothed curve. I think you are wrong to say the smoothing comes out of the separated column, as the separated column is separating the smoothed value. he is clearly smoothing first. see if the(imperfect)  transcriptions of the MSs give you any hint. if not I will revisit and describe it for you. 

nothing shows up for his working drawn. 

the MS page is good.

---

the sum curve should be more prominent. 

the toggles dont work on the peirce's chart view. 

make the gradient better for the data and curves view. 

the blocks view should also have the smoothed line. at least if its toggled on?

how can I change the PE if the hold the spread toggle is on? maybe that toggle shoudl be right by the slider? and if I slide it should auto toggle off?

the text should read:

the above paragraph is omitted from published versions as in it peirce describes a chart he never produced. Below, you can see how he set the standards, and see if you can set them better. use Peirce's Chart to see the data presented in the manner described  described above. 

all this extra text should be clearly indented with the blue line. the sort of info text you have below is fine, with the grey line.

---

yes do that please. also, please carefully read my previous set of suggestions. you did not do so last time. 

I feel like I am taking crazy pills with the gradient point. this is the screenshot. '/Users/niallroe/Documents/GitHub/niall-roe.github.io/Kets/Images/Screenshot 2026-08-13 at 5.30.57 PM.png'

note my other notes about the colour pallet.

#### fourth pass — colour restored, the game named
The gradient is back in figuring-out mode: the area under the guess curves is blended slice by
slice in the guesses' colours, under the solid black data curve. The invitation is explicit (a
highlighted "drag the standards to bring the dashed curve onto the black one"), and the known-
standards page keeps its drag cue in the intro.

##### the round-4 notes this answers

we have lost the colour gradient. bring that back please. 

the assumed page is great. have a highlighted thing inviting people to drag the standards around. 

in figuring out the standards, reintroduce the colours, and invite the user to drag the standards around to try to get the sum curve to match the drawn curve. 

they should be allowed to modify the spreads if the SDs are unfixed. otherwise this is alright.

#### third pass — the direction reversed, and the bugs out
Rebuilt as you specced. The tabs are now "assuming known standards" and "figuring out the
standards". In the second mode nothing jumps: the data (cast copies or the real kets) draw their
own solid black curve, your candidate standards are stable domes (no re-randomising on repeated
clicks), and the law of error is chosen from buttons — probability curve, gaussian with its own
spread for each standard, flat tolerance, sharp cutoff right. The dashed red curve is what your
guesses imply under the chosen law, with an average-miss readout; "snap to best fit" fits once
under that law (no more freezing — the fit no longer reruns on every frame) and dragging any dome
takes over from it. Preset buttons: two standards, two clusters (three low + two high), and
Petrie's data as Peirce cleaned it. The intro explains the inversion: the first mode goes from
assumptions to distribution; Peirce's task, the second mode, goes from data to assumptions.

##### the round-3 notes this answers

On the place of ignorance mode, the standards move. let's fix that. they should be in the same place. also when I move them around in that view and generate more copies they dont appear in the right place. (when in ignorance mode, and I click peirce's data repeatedly, those ket dots jump around) .

snapping to gaussian freezes the rest of the example. lets not do that. 

have buttons that reset it to the two examples, and one that makes two clusters, where there are three lower standards close together and two higher ones.

We shoudl also explain that as presented, we are going from assumptions about the standards to the distribution they would generate. Peirce's task is the opposite. Go from the generated data to assumptions about the standards.  rename the buttons to be "Assuming Known Standards" and "[Figuring Out] possible standards". in the second mode, there should be more ways than gaussian to do it, and once you have chosen a law of error, you should be able to move the kets around and see how the sum curve compares to the actual curve. then having a snap to best fit button shoudl take whatever law you have chosen and do the best it can. (one option should be to have different std dvs for each standard, when gaussian).

#### second pass — blocks, ignorance, and the guessing game
Rebuilt to your notes: starts with two standards close together; every copy is one block in its
standard's colour, so a middle bar of seven shows as four blue and three red; a "place of
ignorance" tab hides the standards and shows only the summed curve, its colours blending to purple
where the classes overlap; in that mode you place guess-domes yourself, with a note that without
any restriction on curve shape, any placement can be made to add up to the sum — then "snap the
guesses to gaussian curves" fits them (EM, spread held at the probable error) and most placements
stop fitting. A "Petrie's data, as Peirce cleaned it" button loads the 142 real kets with Peirce's
standards and bins, so the whole game runs on the real data for continuity. The flagged note text
is cut, and that phrasing is gone (noted for the future).

#### the sandbox
Built as specced: 1–6 standards (slider), placed spread over 137–152 and draggable along the axis as little ket-domes; "cast one copy of each" and "cast 25 of each" buttons; copies pile into half-grain classes (the bin of Peirce's own diagram and of the Kets.R app — the notes said PE-sized bins, but Peirce's MS speaks of half-grain classes, so half a grain it is; say the word and I'll switch); each standard's probability curve and the dashed sum-curve overlay; a probable-error slider (default ⅝ grain) with the "half depart by more, half by less" reading spelled out. Bars are tinted by the standard that parented most of the bin's copies.

##### the original suggestion, for reference

Here the user should be able to set how many standard weights there are, say from 1 to 6. that should have that many "standard" weights appear, as little balls that look sort of like the balls in the picture. These can be distributed horizontally sort of under a number line. they shoudl be generated as sort of random weights between 137 and 152, but try to keep them sort of spread out. the user can also adjust them by clicking and dragging them on the number line. 

then there can be a button to create a copy of the standard. that produces another blob ... lets say just above the standard of which it is a copy, maybe on top of the number line. its weight = the standard \pm some error term. it should be equal to what peirce is saying here about the PE and grains. but that should also be explained. when many copies are generated, there should be a histogram appearing on the number line, I suppose the bin size shoudl be the PE size, I think that is what Peirce does. 

there should be a sort of normal curve imposed over the histogram, and the sum of the curves should be there too. 

maybe this gets broken out into smaller examples, to better show how he calculates the prob error too... but for now lets do it.
