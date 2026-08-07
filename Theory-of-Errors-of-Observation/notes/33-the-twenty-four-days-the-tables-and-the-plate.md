---
position: 33
number: 3
title: "The twenty-four days: the tables and the plate"
status: done
group: "Experiments"
heading: "3 — The twenty-four days: the tables and the plate"
---
Status: awaiting approval

### Text

"Five hundred observations were made on every week-day during a month,
twenty-four days' observations in all. The results are given in the accompanying
table, and are also shown upon plate No. 27."

### Suggestions

- The pencil ("Draw it myself") draws left to right only and does not yet let
  you go back over a stretch. Enough, or should it be a proper freehand tool?
- The plate is drawn at one scale per panel, each centred on its own day. Peirce
  drew them on a common horizontal scale, which is what makes the drift across
  the month visible down the column. Say which you want. Easier to judge now
  that his own plate is a button away.
- Nothing yet uses the tables to make the paper's own point — that the range of
  errors narrowed after the twelfth day. That wants its own example, on the
  sentence that says so.
- [from the build] Should the discrepancy note live in the example, or only in
  these notes? At the moment the tables tab says when a day does not sum to 500.

### Completed

#### the mean curve's default width

22 is right. [22 seems good.] The slider stays, defaulting there, and "Reset to
Peirce's" returns to it.

#### REVISION 3 (your notes): the plate's two buttons, the legend cut

- The plate carries both buttons at all times — "The redrawing" and "Peirce's
  own plate" — with the current one marked, instead of one button that swapped
  its own label. It opens on the redrawing. The mean-curve and reset controls,
  and the two sliders, still appear only on the redrawing, there being nothing
  for them to drive on his.
- The line under the calendar is cut. The question I had raised with it — why
  the 2nd to 4th and 11th to 13th of July are missing — goes with it.

#### REVISION 2 (your notes): the plate's scales, the day's table, the pencil out

- Every panel of the plate now carries its own scale: the four verticals are
  labelled with the millisecond they stand at, set under the baseline. The
  canvas is taller to make room. They are in milliseconds, to agree with the
  tables and the one-day tab; Peirce labelled his in seconds (0.15, 0.20 ...)
  and only on the top panel of each column, since his panels share a scale.
  Say if you would rather have it his way.
- On the one-day tab the table has moved up beside the buttons — it is now in
  the same column as the plot, directly under it, so the calendar, the sliders
  and the buttons sit alongside both. It scrolls within 300px.
- "Draw it myself" is gone, and the pencil machinery with it.
- The Plate 27 figure that sat in the article above this block is removed. The
  plate is a button away inside the block now, so it was there twice.
- The mean curve has a slider of its own, from 4 (bouncy) to 48 (very smooth),
  default 22. It sits beside the smoothing slider on both the plate and the
  one-day tab, so on the plate it redraws all twenty-four mean curves at once.
  "Reset to Peirce's" restores both sliders.

#### REVISION 1 (your notes): at the foot of the page, and a calendar

- The whole thing now sits open at the foot of the page and is not behind a
  trigger at all. It is no longer an example container: it is a plain block set
  off by a rule, with the numeral 3 still in the margin, built at load. The
  "Five hundred observations" sentence is plain text again.
- The day is chosen from a calendar of July 1872 with August 1-3 beside it,
  instead of a dropdown. July 1872 began on a Monday. Days with observations are
  clickable and carry their roman numeral and total in the tooltip; days without
  are dimmed, which puts the shape of the month on view — every Sunday absent,
  and the 2nd to 4th and 11th to 13th of July.
- The plate has a button that swaps between the redrawing and Peirce's own
  engraved Plate 27. On the redrawing the smoothing slider sits above it, so
  moving it redraws all twenty-four panels at once and the month tightens
  together; the mean curves toggle with it. The slider is hidden on his plate,
  there being nothing to drive.
- "Reset to Peirce's" on both the plate and the one-day tab: eight passes, mean
  curve on, everything else off.
- The chosen day carries between the tabs.

#### three tabs: the tables, the plate, one day

Data from Koenker's transcription (Koenker's data/MiM/data), parsed exactly as
his ReadPeirceData does, and held in the shape Peirce printed it: nine
column-pairs per day, each read downwards, with a value smaller than the one
above it treated as an abbreviation for the hundreds carried down. 13 KB
embedded in the page, so nothing is fetched at run time.

THE TABLES. Peirce's own layout, reproduced to the digit. His abbreviation rule
turned out to be readable off the printed page: the time is set in full at the
head and the foot of each column, wherever the run of milliseconds breaks, and
at every multiple of ten; elsewhere the last digit alone. Checked cell by cell
against pp. 138-139 — the first row reads 158 1, 348 0, 389 1, 430 0, 471 1,
512 1, 553 0, 593 1, 633 2, and the first column reads 158, 240, 261, 277, 296,
312, 3, 4, 5, 6, 7, 8, 9, 320, 1, 2, 3, 4, 5, 6, 7, both exactly as printed.

THE PLATE. All twenty-four panels, two columns of twelve, roman numeral and date
at the left of each, baseline and four verticals as on Plate 27. Each panel
carries the figures smoothed eight times over and a mean curve.

ONE DAY. The smoothing is put in your hands. Peirce says the curve was "smoothed
off by the addition of adjacent numbers in the table eight times over", which is
convolution with [1,1] eight times, so the slider runs 0 to 16 passes and is
labelled at 8 as his. At 0 the raw figures show as spikes. The sums are divided
back by 2^passes so the vertical scale stays comparable. Then the four overlays:
a mean curve by eye, a pencil so you can draw your own — his smoother curve is
"a mean curve for every day drawn by eye", not a fit of any kind — a Gaussian of
the same mean and spread, and clear.

#### discrepancies found in the data, as asked

1. Peirce says five hundred observations were made on every week-day. The
   printed tables sum to 500 on only two of the twenty-four days (the 14th and
   the 19th). The whole month comes to 11,803, not 12,000 — 197 short.

2. The twelfth day, July 20, sums to 396: 104 short, where no other day is out
   by more than 11. This is not a transcription slip. I summed the printed table
   on p. 149 by hand and it comes to 396 as well, and that day's table is
   visibly shorter than the others — 18 rows where the eleventh day has 20, and
   it shares a page with the thirteenth. Whatever happened, happened before the
   tables were set.

3. Two days run over: the seventeenth by 7 and the twenty-first by 2.

4. Koenker's Day01.txt has two stray periods, "1." on line 9 and ".0" on line
   15. R's scan() reads them as 1 and 0, so his analysis is unaffected, and the
   parser here does the same; they are transcription noise, not data.
