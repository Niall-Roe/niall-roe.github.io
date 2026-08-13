---
position: 2
number: 3
title: "The Kets"
anchor: "The great majority of them are of basalt and syenite, material so unchangeable that the corrections needed to bring them to their original values are small. I shall deal only with 144 of them from each of which Mr. Petrie has calculated the value of the ket to a tenth of a Troy grain."
heading: "New example — The Kets"
status: done
container: example-ex3
---
### Text

"The great majority of them are of basalt and syenite, material so unchangeable that the corrections needed to bring them to their original values are small. I shall deal only with 144 of them from each of which Mr. Petrie has calculated the value of the ket to a tenth of a Troy grain."

### Suggestions

None open.

### Completed

#### fifth pass — button order
The histogram button is now last in the row, as asked.

##### the note this answers

make the histogram button the final button. then its done.

#### fourth pass — the cells learn to be a histogram
A new "arrange as a histogram" button: the 158 cells glide from catalogue order into half-grain
columns and back, so the reader watches the table become the histogram every later example draws —
and the red/amber/correction togggles now play against either arrangement. This is the foundation
you wanted for the curve-drawing example to come.

##### the round-4 notes this answers

the sorting button should rearrange the kets into a histogram, to prepare the user for the histograms to come. then you can see how pressing the buttons changes the histogram. this can also be the foundation for the curve drawing example that we will have.

#### third pass — provenance, grid at a glance, hover, frozen header
Kat is now Ket in the panel's first line. The intro states the provenance you asked for: pages
75–76 of Naukratis, Part I (1886), the Egypt Exploration Fund's Third Memoir — which is the work
Peirce cites in the manuscript (his marginal footnote reads "Egyptian Exploration Fund. Third
Memoir"). His transcription slip is described concisely (fourteen counted, sixteen in the table).
Rows now highlight in red entire, not just the unit figure; hovering a grid cell shows material,
unit, present, ancient and the percent change; the header row is frozen; and on the correction
toggle each cell shrinks in proportion to how far the weight had strayed, so damage reads at a
glance. On sorting the grid by material: I left the grid in catalogue order (the cell's position
is its identity across the three toggles) — the scaling-plus-tint carries the change signal
without re-sorting; if you want a second, material-grouped grid, say so and it can be a fourth
toggle.

##### the round-3 notes this answers

The hieroglyph in the footnote is currently the Coptic ⲕⲓϯ from your chapter; if you want the
actual Egyptian signs for qdt, tell me which glyphs (or drop an image) — Unicode hieroglyph
coverage in body fonts is unreliable, so an inline image may be safer.

---

This is better. Replace Kat with Ket in the first line. 

Say: the below table is a reproduction of the table found on pages ... to ... of Petrie's []. Peirce likely found the table in [look at my paper I think I talk about this here - also I think he cites it maybe?]. Peirce cleaned the data by removing any measurement that was not made to 1/10th of a grain. However, he also made some transcription mistakes. [concisely describe these]. Further, Petrie's notes say [how much each Ket has changed, this is also displayed visually].

I wanna better visual for the change... maybe could they be sorted into the material? and have change shown by like... I dunno scaling the square? that might be hard. what do you think is best?

when hovering over a box it should show the grains. 

freeze the top row so when scrolling you knwo what the numbers mean.

#### second pass — grid, red rows, two more toggles, and the fourteen-for-sixteen
Built to your notes: a grid of 158 cells above the table, one per weight, so Peirce's cut reads at
a glance (16 cells and their rows go red, whole rows now, not just the unit figure); a second
toggle "where Peirce got it wrong" marking in amber the weights on either side of the unrepresented
gaps his no-gap claim misses, with the tally note; and a "size of correction" toggle shading rows
by how much restoring the ancient value moved them, with the basalt-and-syenite point spelled out.
From your chapter: the note now explains the 144 — he counted fourteen to-the-grain units where the
table holds sixteen — and mentions that his 136.8–151.3 interval also quietly drops no. 157 at
152.5. The transliteration note (qdt, Coptic, kat→qedet, ket kept as Peirce's spelling) is now
footnote 1 in the article, at the first mention as you asked.

#### the table, recreated and filterable
Built: Petrie's Egyptian Kat Standard table (all 158 rows: No., material, present, ancient, ×, unit as printed), scrolling in-page, from the fresh transcription verified against the 1886 scan. Units lacking a tenth digit are set in red; a checkbox applies Peirce's cut and dims them, with a counter. While the filter is on, Peirce's printed "144" in the article goes live and reads 142 — the count the printed table actually yields. A note under the table states the 142-vs-144 discrepancy plainly (his five assumed counts do sum to 144).

##### the original suggestion, for reference

Here we coudl show a (recreation of) Petrie's chart, indicating which ones have not been calculated to 1/10th of a grain. could note that Here Peirce is effectively taking the first step in cleaning his data.
