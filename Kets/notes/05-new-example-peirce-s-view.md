---
position: 5
number: 6
title: "Peirce's view"
anchor: "I have assumed that there were five different standards; that the weights depart from their standards according to the probability curve; and that the probable error of a single weight is five-eighths of a grain. I assume that of the 144 weights"
heading: "New example — Peirce's view"
status: awaiting
container: example-ex6
---
### Text

"I have assumed that there were five different standards; that the weights depart from their standards according to the probability curve; and that the probable error of a single weight is five-eighths of a grain. I assume that of the 144 weights"

### Suggestions

None open.

### Awaiting approval

#### ninth pass — your note text, and the live restatement
The mis-posted block is disregarded, as you say — it is answered on example 5. The note under the
plot is now your text: Peirce worked through this twice, the first attempt's 140 / 145 / 149 with
142½ not unlikely, the second attempt beginning from that working but confidently asserting five,
and the 36 / 30 / 30 / 22 / 24 against his 36 / 25 / 26 / 23 / 34. One word changed: “proving the
counts” is set as “providing the counts” — say the word if you did mean proving. It ends with the
live sentence, “As you have it now, your five standards at … contain … weights each,” each
standard and each count wearing its own colour and following the domes as you drag them.

##### the notes this answers

This one does not make it clear to me what is going on. 

and when you add text... indent it. that is a global. universal always change that I dont want to have to remind you of every time forever thanks. 

is this the best approach? I recall here being something called like a gaussian mixture model or something. 

whatever we do, it shoudl display the standards in the same way we have been displaying them. the graphs you have here dont really tell ole anything.

---

sorry, the suggestion that read as follows was for example 5, disregard: 

"This one does not make it clear to me what is going on.

and when you add text... indent it. that is a global. universal always change that I dont want to have to remind you of every time forever thanks.

is this the best approach? I recall here being something called like a gaussian mixture model or something.

whatever we do, it shoudl display the standards in the same way we have been displaying them. the graphs you have here dont really tell ole anything."

---

change this to be

Peirce worked through this twice. in his first attempt he tabulated the weights in half-grain classes, smoothed the counts by hand, and read the clusterings off the chart, concluding standards at about 140, 145 and 149 grains, with another not unlikely at about 142½ (see the above example). The second attempt apparently begins from that working but confidently asserts that there are five standards, proving the counts in the table above. Assigning each ket to its nearest standard under his own five gives 36 / 30 / 30 / 22 / 24, not his 36 / 25 / 26 / 23 / 34. 

As you have it now, your [x] standards at [a b c...] contain [n, m o] weights each. [make sure colour coordination matches. this is basically just reprinting the 
x were designed to conform to ta standard of ..."]

#### eighth pass — blocks are blocks again
The blocks view is back to individually coloured blocks, each in its likeliest standard's own
solid tint — the gradient stays out of that view — and the smoothed curve of the data draws
there whenever its checkbox is on (which it now is by default, matching the state it showed).

##### the notes this answers

unde the blocks view we WANT to be able to see thhe individually coloured blocks, not the gradient. please change it back for that view. also it shoudl still have the smoothed curve visible. come on.

#### seventh pass — the gradient, at last, and the second attempt
You were right and I finally saw it: I had been reading "gradient" as the wash under the curves,
while your screenshot shows the BARS themselves shading smoothly across the axis. Fixed at the
engine level: every data bar on the page is now filled with the blended colour at its own bin —
the blend shifting bin to bin, so the bars run blue into green into gold into rust as the
standards trade ownership, saturated like your reference, in this palette. It applies here, in
Merge, in Towns, in the 1926 example, everywhere. And the "his second attempt (five standards)"
button now sits beside the first-attempt one. I apologise for the repeats it took.

##### the notes this answers

in data and curves the blocks sohudl be gradiated like int he screenshot. this is like the 10th time I am asking for this global change why are you ignoring me. 

if we have a first attempt button we should also have a second attempt button.

#### fourth pass — colour back, the aim stated, the chart smoothed
The main view's bars are mixed blocks again with the gradient under the class curves; the smoothed
data curve is on by default and the intro now names the game — place the standards so the sum of
the class curves matches the smoothed curve of the data. Peirce's chart carries the smoothed data
curve too, drawn with a wider window so it is properly smoother, dotted so it defers to his brown
sum-curve. The palette is also reordered site-wide so neighbouring standards wear adjacent hues
(blue–green–gold–rust–violet) and their mixtures read as blends rather than clashes.

##### the round-4 notes this answers

Your animation of how he decided the standards remains open — likely as an extension of the
new first-attempt example. The MS transcriptions will feed both.

---

this is working great. but bring back the colour. note again that the goal is to have the sum curve match the smoothed curve. peirce's chart should have the smoothed curve too? and that curve should be... smoother?

#### third pass — the familiar main view, with toggles
The main view is now the standard one: data bars, a smoothed curve of the data, the class curves
and their sum, each on its own checkbox; blocks and Peirce's chart are the other two tabs. In
Peirce's-chart mode the full sentences of the restored paragraph are highlighted in their colours
(background tint, not just the font). A "his first attempt (four standards)" button loads 139.7 /
142.5 / 145 / 149, and the note tells the two-attempts sequence — with the new first-attempt
example (margin numeral 17, just above) walking the manuscript page itself.

##### the round-3 notes this answers

Your fuller description of how Peirce decided on the standards (the first attempt's smoothing
and clustering) is still wanted — the MS transcriptions will let us compare properly, as you say.
The smoothed-counts working (his anticipation of kernel smoothing) could be its own example
anchored on "To a person thoroughly familiar with the theory of errors…" when the transcription
is ready.

---

The main view here should be the one we are already familiar with above. It sohuld have toggles for showing the actual data, the curve over that data (CSP smoothed it, and we can have sliders etc for that) and then the sum curve. 

CSP's chart should be the third option. the full sentences should be highlighted the relevant colour, not just the font. 

this looks really good. 

there will be a next step, though possibly in its own example, that should animate how he went about deciding on standards.

#### second pass — Peirce's own diagram, restored and drawn
The intro is cut to one line so the plot and the article table share the screen, with the
drag cue explicit. The big change comes from your chapter: the paragraph where Peirce describes
his diagram — omitted by the CP editors because the chart was never drawn — is restored to the
article just after the table (marked editorially in footnote 2), and the example now opens in
"Peirce's diagram" mode drawn to his description: red circled points for the observations, blue
curves for the classes, a brown curve for their sum. The words red, blue and brown in the restored
paragraph wear their colours while the example is open. Blocks and gradient modes are tabs, as in
the sandbox; a "best fit" button does the EM fit (spread holdable at ⅝ grain — it lands near your
chapter's K-cluster values, e.g. 139.19 vs your 139.03); and a "his first attempt" button sets the
four standards he read off his first chart (139.7, 142.5, 145, 149), with the note now telling the
two-attempts story.

#### Peirce's assumptions, live against the data
Built: the real 142 kets as a half-grain histogram with Peirce's five standards, curves, and sum overlaid; standards draggable; sliders for the number of standards and the probable error; classes colour-blended by which standard claims them (ported from the Kets.R app's behaviour); and the article's table driven live — counts and standards update in real time as you play, each row wearing its standard's colour, with a restore-Peirce's-figures control. The "five" and "five-eighths" in Peirce's sentence go live too.
The counts shown are each ket assigned to its nearest standard. Under Peirce's own standards that gives 36/30/30/22/24, not his printed 36/25/26/23/34 — his counts came off his hand-drawn diagram, not from a computation on the table. This is stated in a note under the plot.

##### the original suggestion, for reference

this could basically show the same example thing above but with these assumptions. it should show also how the 36, 25, 26, etc were arrived at, and show them visually. there is an R shiny app somewhere called somethign like Kets that sort of has this already. you could copy it for this and (sort of) for the above one too).

---

make sure that as the user plays with the values, number of standards, etc, the table updates in real time. make sure the table rows are colour coordinate with the standards.
