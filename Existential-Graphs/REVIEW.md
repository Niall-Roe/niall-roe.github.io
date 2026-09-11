# Review notes

From four reviews of the page. Items marked **FIXED** have been done and
verified; everything else is written down but not acted on.

## Fixed so far

- R5 no longer severs a line of identity when a double cut is inserted around a
  cut. Verified by re-running the fuzz: 1,848 Beta moves and 5,021 Alpha moves
  model-checked, no violations, where before there were 25.
- An undecided truth-value analysis is reported as undecided instead of as
  valid.
- The two Translate examples that were wrong have been corrected and checked
  against the engine.
- Editing a formula twice in a row no longer draws the wrong graph.
- The hook numerals survive an animated redraw, and are legible.
- The rules that act on lines of identity now mark what they act on.
- The Scribe transform panel says where each move acts, previews it on hover or
  focus, plays it when clicked, and is reachable by keyboard.
- The animation no longer stutters at step boundaries. Every still drawing sized
  itself to its own graph while every transition sized itself to the larger of
  two, so the frame jumped at the start and end of each step. The frame is now
  explicit: pinned across a whole proof, sized to its largest step, so nothing
  rescales or shifts between steps and the stage stays one height; interpolated
  where the sequence is open-ended, as on Translate. Checked at all 226 step
  boundaries in the library: the still before, the first frame, the last frame
  and the still after place every cut and spot identically.
- Scribe opens with P → Q on the sheet, a list of standard propositions to
  start from, and a puzzle mode: pick an inference, its premisses are scribed,
  and the page counts the moves until the sheet says the conclusion. Hints
  follow the library's own route where there is one.

All 25 library proofs still verify, replay, render and write out; the searches
still find their proofs.

---

# Correctness

These make the page show something false. All were introduced by me and all have
a verified reproduction.

## FIXED — a rule of transformation was unsound: R5 severed lines of identity

The worst finding, because it was in the engine rather than the interface. R5 says
a double cut may be inserted around any graph on any area, and that the
transformation "will not be prevented by the presence of ligatures passing from
outside the outer cut to inside the inner cut" — that is, the line must be
threaded through the two new cuts. `applyMove`'s `dcIn` case does thread lines
belonging to a moved **spot**, because `moveNode` carries a spot's hooks with it.
It does not thread lines running into a moved **cut**, because those points stay
in the cut's own area and the rewiring loop never sees them.

The result is an edge spanning two cut boundaries, which breaks the model's
invariant. The reading then treats the two ends as unconnected, so the line is
cut in half and the graph says something else.

Smallest reproduction, on the Scribe tab, with `Ex (Fx & ~Gx)` loaded:

    before   *a F[a] ( *a G[a] )        reads  ∃x (F(x) ∧ ¬G(x))
    after    *a F[a] ( ( ( *b G[b] ) ) ) reads  ∃x (F(x) ∧ ∀y ¬G(y))

The second is a different and stronger proposition. Inserting the double cut
around the spot F, or around the spot G inside the cut, is fine; it is only
around a cut that the line is severed.

Found by generating every legal move on every Beta state the page displays and
model-checking each on domains of one and two individuals: 1,848 moves checked,
25 unsound, every one of them a `dcIn` around a cut.

**What is and is not affected.** No library proof is affected — every step of all
25 preserves truth on domains of one and two. Ten Beta searches all returned
sound proofs, so the search does not reach the bad move on the cases tried. The
reachable path today is the Scribe tab, whose transform panel offers the move
directly under the description "a double cut is inserted". But the search does
have the move available, so a wrong Beta proof is possible in principle.

**Fixed** by a general repair rather than a patch to the double-cut case. After
any move, an edge found spanning more than one cut has a point added on each
area it now crosses, which is what C7 and the note at Roberts p. 50 require of a
line: it crosses one cut at a time, and the crossing is marked by a point. This
also covers any future move that shifts a graph deeper into a nest.

Re-checked after the fix: the reproduction above is unchanged by the move, as R5
requires, and the fuzz that found 25 violations now finds none.

Alpha is unaffected and was checked separately: 2,623 forward moves and 2,398
backward moves against full truth tables, no violations.

## FIXED — the page could call an invalid inference valid

`app/ui2.js:214-225`, with the follow-on sentence at `:253`.

`alphaEntails` (`src/05-semantics.js:57`) gives up and returns `{decided:false}`
above eighteen distinct spots. `runProof` tests only `if (ent.decided &&
!ent.entails)` and then falls through unconditionally to printing **valid — by
the truth-value analysis of Roberts §3.2**. So a skipped decision is reported as
a decision in favour.

Reproduction: premiss `A`, conclusion `A & B & ... & S` (nineteen letters). The
page says valid, the search then fails, and it goes on to say *"The inference is
nevertheless valid, and so by the completeness of Alpha a proof exists."* The
inference is plainly false.

This was the exact mirror of the property the page advertises. It is careful
never to report a failed search as a disproof, and then asserted validity it had
not established.

**Fixed.** An undecided analysis now reports itself as undecided and says why,
and the sentence about a proof therefore existing is gated on the analysis having
actually been made. The nineteen-letter case now reads "too many spots to settle
by truth-value analysis"; ordinary valid and invalid cases are unchanged.

## FIXED — editing a formula twice in a row drew the wrong graph

`src/11-anim.js:331` — `let k = 0; const fresh = () => 'z' + (++k);`

`ui1.js:95` stores the aligned graph back into `TR.graph`, so on the next edit the
previous graph already contains `z1`, `z2`. A matched node can be given the name
`z1`, and an unmatched node then gets `fresh()` returning `z1` as well. The
second write silently destroys the first and nodes are lost.

Verified by replaying live typing: three of seven successive edits end on a wrong
drawing, and the wrong drawing stays up until you change tabs.

    P & Q & R          drawn as  P ∧ R ∧ R
    R & Q              drawn as  Q ∧ Q
    Ex (Fx & Gx & Hx)  drawn as  ∃x (H(x) ∧ G(x) ∧ H(x))

**Fixed** by taking the name from the global counter, which cannot collide.
Re-run over seven successive edits: no wrong drawings, where before there were
three.

## Smaller ones of the same kind

**Every step of a proof's backward half loses the name of the graph it is
about.** `src/07-prove.js:193` passes `bwd[i-1].rec.graph`, the result of the
move, where it wants `bwd[i].rec.graph`, the graph the move acts on. By then the
node is gone, so `describeMove` falls back to "the graph" instead of naming the
enclosure or the spot. One index.

**A graph with twelve or more lines of identity reads back into a formula the
page cannot re-parse.** `src/04-read.js:23` names the twelfth ligature `x12`,
but the parser accepts only one digit (`src/02-parse.js:102`). Since
`syncScribeBoxes` writes the reading into the formula box, "Scribe it" then
fails on the page's own output. Worse in the quiet direction: `Fx12` parses as a
nought-place spot named `Fx12` with no complaint.

**A spot name containing a double quote breaks the linear notation.**
`src/09-egnotation.js:130` quotes without escaping, so `he said "hi"` comes back
as a different graph, with no error.

**"No countermodel on up to three individuals" is not always true.**
`src/05-semantics.js:139` skips a domain size silently when the search space
exceeds its budget, which two binary predicates are enough to trigger, but
`app/ui2.js:237` reports three regardless. It should say which sizes were
actually searched.

## FIXED — two of the Translate examples were wrong

`app/ui1.js:70-72`. I checked both against the engine rather than taking the
report on trust.

`Ax Ay Az ~(x=y & y=z & x=z)`, labelled "three things are not all identical",
reads back as **∀x ⊥** and is false in every model. The page draws one small
empty cut and glosses it "the pseudograph (the absurd)". Someone clicking a chip
that promises a three-variable graph and getting a blob labelled *the absurd*
will conclude the renderer is broken. The existential form is the one Roberts
draws at Fig. 14: `Ex Ey Ez ~(x=y & y=z & x=z)`.

`Ex Ay (Mxy -> Lxy)`, labelled "every mother loves some child of hers", reads
back as ∃x∀y — *some* mother loves *all* her children. Roberts gives the reading
at p. 60 as "take any individual you please, say i, there is an individual j,
such that, if i is mother of j, then i loves j", which is `Ax Ey (Mxy -> Lxy)`.
The quantifiers were the wrong way round.

**Fixed:** both formulas replaced and checked against the engine. The first is
now satisfiable and reads as three things not all identical; the second reads
∀x∃y, as Roberts has it.

## FIXED — the hook numerals were absent almost everywhere

Only `src/08-render.js:436` emits them, and that is the static path. Every
animated path — clicking an example, pressing Draw it, typing with "draw as I
type" on — goes through `playTransition`, which does not. So after any of those,
the count of `.hooknum` elements is zero, and toggling the checkbox off and on is
what brings them back.

This is worse than a cosmetic loss. With three variables the graph cannot be read
without them: `Ex Ey Ez (Rxy & Ryz & Rzx & Sx & Sz)` draws three spots all
labelled R, each with two hooks, and nothing distinguishes R(x,y) from R(y,x).

Where they did render they were 8px in `--ink3` at 3.95:1, tucked against the
spot's letter, and effectively invisible at 1:1.

**Fixed.** The moving drawing now carries them too, interpolating each hook's
position between the two geometries so the numerals travel with the spot, and
they are 10px semibold in `--ink2`. Checked on a three-variable relational graph:
six numerals at rest, six after Draw it, six after clicking an example, where
before it was six, none, none.

---

# The page as a piece of software

**Search harder freezes everything for up to thirty seconds.** `app/ui2.js:239`
runs a 30-second cap synchronously, so nothing responds, including the tab bar.
The exercise dropdown triggers this automatically for the four exercises marked
as needing it. The budget caps themselves do hold — overshoot is bounded by one
state's expansion — so this is a responsiveness problem, not a runaway.

**A found proof cross-fades at the joint instead of moving.** `app/ui1.js:173`
re-derives each step and then throws the result away, where `hydrateProof` at
`:159` keeps it. The forward and backward halves of a search share no node
identifiers, so that one step loses the animation the module exists to provide.
One line, mirroring the function above it.

**The editor mirror drifts once a box gets a scrollbar.** `app/style.css:52`
gives the mirror `overflow:hidden` and the textarea `overflow:auto`, so on
platforms with classic scrollbars the two wrap at different columns and the
colours sit under the wrong characters. Invisible on macOS. `scrollbar-gutter:
stable` on the shared rule fixes it.

**Auto-pairing a bracket destroys the undo stack.** `app/ui0-editor.js:59`
assigns to `value` directly, so after typing a bracket, undo no longer reaches
anything typed before it.

**`canonGraph` is not quite canonical.** `src/06-rules.js:73` stops permuting
later tie groups once it has given up on an earlier one, and a bare dot canonises
differently from a two-point line on one area although C6 and C7 make them the
same graph. The consequence is a search that can miss a meeting of its two
halves, and spurious asterisks in the written proof — not a wrong proof.

---

# A second look at the experience

My own pass, after the fixes above, at desktop width. Ordered by how much each
would help a philosopher arriving cold. Items already listed further down are
not repeated.

## 1. The landing tab never says how to read the picture

The graph is large, clear and correct, and nothing on the tab tells a newcomer
what the picture means. The three facts that unlock it fit in three sentences:
graphs side by side are both asserted; a cut denies what it encloses; the heavy
line means "something", and the further in its outermost end sits, the more it
comes to mean "anything". Everything is on the Conventions tab, but that is the
last tab and no one starts there, and nothing on the first four points to it.

A short primer under the graph — three sentences and a link to the conventions
— would turn the landing tab from a demonstration into an explanation. This is
the single change with the most leverage.

## 2. The landing tab is cluttered with things that are not the task

Under the formula box: nine glyph buttons, seventeen example chips, a Draw
button with a checkbox, then four drawing preferences (shade, hand-drawn,
numerals, colour) — all before "How to write it". The preferences are not part
of translating anything; they belong in a small row under the graph card, or
behind a disclosure. The chips could be cut to eight well-chosen ones with the
rest behind "more".

Three headings and labels need plainer words. "Read back, endoporeutically" is
the second heading a visitor reads and its second word is a term of art; "What
the graph says" would do, with the term introduced in the primer. "Beta — a
finite check only" is a pill with no antecedent on a tab that is not about
validity at all; drop it here. And the note that appears when a free variable
is closed for the reader sits at the foot of the third card, a screen below the
box it is about; the parse error sits in the graph card. Both belong under the
formula box.

## 3. DONE — Scribe opened dead, and now has a goal

The tab arrived on a blank sheet with a panel offering one move. It now opens
with P → Q on the sheet, a Start-from list of twenty standard propositions, and
the free formula box beneath. The wrong instruction about the sheet's border is
gone.

The bigger idea — giving it a goal — is built. Pick a puzzle: seventy-five of
them, the twenty-five library proofs first, each marked with its step count,
then the textbook exercises. Its premisses are scribed on the sheet and the
conclusion is drawn small beside; the page counts applications of the rules
until the sheet says the conclusion, and compares the count with the library's
where there is one. A Hint, when the sheet is on the library's route, marks the
entry in the Transform panel that takes the next step, and says so plainly when
the sheet has left the route. Undo uncounts a move; free scribing with the Cut
and Spot buttons is not counted, since it is not a rule. The original idea: Let the reader pick a target — a
conclusion from the proof library, or one of the textbook exercises — and
transform the sheet towards it, with the page saying when the goal is reached
and how many moves it took. That turns the rules from a list into a puzzle,
which for a logician is the most engaging thing the page could be. It is a
feature rather than a fix, but the pieces exist: the move panel, the animation,
and a canonical comparison of graphs.

## 4. Small things on Proofs

A one-line legend for the rings — green is what the rule appeals to, red is what
is about to go, dashed is the area it acts on — since nothing says so. The
speed slider runs backwards: its value is a duration, so dragging right makes it
slower; relabel it "step time" or invert it. Every caption prints its rule
twice, "R4 — R4, deiteration", because the justification strings already begin
with the rule. And the stage changes height between steps, so the caption and
buttons jump up and down the page during play; fixing its minimum height to the
tallest step of the proof, computed once on load, would hold everything still.

## 5. Small things on Find a proof

The verdict card says "Press the button" beside two buttons; "Search for a
proof, or pick an exercise below" is what it means. "Search harder" freezes the
page for up to thirty seconds with a spinner that stops spinning; if it cannot
be chunked, it should at least say so before starting. The verdict card is
otherwise a large empty box on arrival, which could carry one sentence on what a
verdict will say.

## 6. The header

The four-line blurb, with its citation, repeats on every tab and takes the top
of the screen each time. The first sentence is the useful one; the source
belongs on the Conventions tab, where it already is.

---

# As a visitor finds it

Ordered by how much it costs a first-time reader. Several of these overlap the
correctness list above and are not repeated.

**FIXED — the mark-then-move promise was not kept for any step involving a line
of identity.** `join`, `eraseEdge`, `addLine`, `delLine`, `branch`, `extend` and
`retract` all fell through with no focus at all. In Barbara that was steps 4, 5
and 6, the ligature surgery, which are exactly the steps a newcomer cannot
follow unaided.

These rules act on points rather than on graphs, so the marking now rings the
points themselves: the two being joined, the one being branched, the one about
to be retracted. All eight Barbara steps now mark something, where three marked
nothing.

**FIXED — the legal-move list on Scribe was unusable as offered.** On
`Ax (Fx -> Gx)`, the first thing anyone will load, the panel listed 22 moves with
only 9 distinct descriptions: eight identical lines reading "a double cut is
inserted", four identical "a branch with a loose end is added". Nothing
distinguished them, there was no preview, and applying one was an instant jump —
so the one place the reader is doing the logic themselves was the one place with
no animation.

Each entry now carries a second line saying where it acts: *around the enclosure
two cuts in, one cut in*, *copied two cuts in*, *keeping the one on the sheet*.
The wording never repeats what the line above already names. Where two moves
would still read alike — two branches from different points of one line — they
are numbered. On the three formulas tried, every move is now distinct: 21 of 21,
18 of 18, 13 of 13.

Hovering an entry, or reaching it by keyboard, marks on the drawing exactly what
that move would act on, which is what tells the double-cut entries apart at a
glance. Clicking plays the transformation with the same marking and movement the
Proofs tab uses. The entries are buttons, so they are in the tab order and
announced as actionable.

**A line of identity on the sheet is drawn overlapping the cut wall.** Measured:
the cut path begins at x=33.3 and the sheet-level line runs to x=36 with a
3.2-unit round cap, so it ends inside the border and reads as attached to it.
C9 and the page's own note say the opposite.

**Errors appear about 1700px away from the box they describe.** `#t-err` sits in
the graph card, and the free-variable note at the bottom of the third card.
Type an unclosed bracket and the box turns red with no visible explanation, while
the caret-under-the-typo renders where the column offsets point it at nothing.
The stale graph also stays on screen, undimmed and unmarked, while the formula is
in error.

**On a phone the diagram is the last thing on the page.** At 375px the Translate
panel is 2085px tall and the graph starts around 1900px: the blurb, seventeen
chips, five checkboxes and the whole "how to write it" section come first. The
grid children need an `order` inside the existing 900px media block. The
two-column breakpoint is also higher than it needs to be — the columns fit in
about 620px, so a tablet collapses unnecessarily.

**The diagrams convey nothing to a screen reader, and slightly worse than
nothing:** the `<text>` nodes are exposed, so it reads "F G" as three
disconnected letters. `role="img"` plus an `aria-label` set to the gloss the page
already computes would turn each diagram into a sentence. The textareas are
unlabelled too, so their accessible name falls back to their contents.

**`prefers-reduced-motion` is half-honoured.** The focus-ring pulse and the
telegraph dashes are suppressed, but nothing in `src/11-anim.js` checks it, so
the graph morph still runs — which is the motion someone would be asking to
suppress.

Smaller: every caption prints its rule twice, because the `why` strings already
begin "R4, "; the speed slider runs backwards, since the value is a duration; the
stage has no minimum height, so the caption and transport jump up the page during
play; the default line colours are dark red then dark green, which a deuteranope
sees as two olives when blue is already in the palette at position three; dark
mode shading is about 1.15:1 against the sheet and effectively invisible;
`--ink3` at 3.95:1 is under AA and is used for every card heading; the proof
dropdown interleaves Alpha and Beta; the chips carry a `title` that overrides
their visible label for assistive technology; and the English gloss becomes
unparseable for nested conditionals.

---

# Things that are sound

Worth recording so they are not re-reviewed. The bundle parses clean under strict
mode with no top-level redeclarations; 224 top-level names, no collisions. No
unescaped user string reaches `innerHTML`: all thirty-one sites check out, spot
names reach both SVG and HTML through `esc`. Nothing hangs — two hundred stacked
negations, three thousand nested brackets, a thousand-deep implication chain, a
hundred quantifiers, a five-thousand-character spot name, a free variable and a
cycle in a line of identity all complete cleanly, with no `NaN` reaching an SVG
attribute. Fuzzing all 231 legal moves across nine formulas, `applyMove` never
mutated its caller's graph and never threw.

The Conventions and rules tab was called excellent and scrupulous, and the
Proofs tab the best part of the page — the citation, the provenance line
distinguishing transcribed from hand-worked from machine-found, the clickable
steps, the written proof with its three forms and Copy. The mark-then-move
animation reads exactly as intended wherever it fires, and 3200 ms is the right
pace. On Find a proof, the verdict pills, the countermodel display and the
distinction between "not valid" and "no proof found within the bound" all hold
up. Nesting and shading are legible to five levels; hop-overs render; the
seeded wobble means nothing shimmers while typing.

The per-frame `innerHTML` in the animation is fine and should be left alone:
0.18 ms a frame on the page's own examples, 3 ms on a deliberately absurd one.
Two genuinely quadratic things sit on the proof search's path rather than the
frame path — the join enumeration at `src/06-rules.js:237` runs a full traversal
per pair of points, and `ligInvariant` at `:51` rebuilds a map per component.
Both matter only if the search budget matters.

One latent hazard: `esc` at `src/08-render.js:450` does not escape the
apostrophe, and is used to build attributes. Every present call site uses double
quotes so nothing is exploitable, but adding it closes the door.

---

# Tidying

Dead: `src/05-semantics.js:105-110` is a named function expression built and
discarded, duplicated verbatim by the lines below it. `src/02-parse.js:35` is
unreachable. `RULE_NAME` (`src/06-rules.js:17`), `resetUid`, `oddlyEnclosed`,
`ligatureHome` (`src/01-core.js`), and the `quant` tag written at
`src/03-compile.js:101` are never read. Three options `renderGraph` takes are
never passed: `highlight`, `raised`, `maxRow`.

Duplicated by hand: the union-find in `src/04-read.js:31` and
`src/09-egnotation.js:144`; threading a line inwards in `spineAt` and `ensure`;
`svgDoc` and `svgWrap`; and the node-drawing loop, which exists three times
across the renderer and the animator.

Build: `build.sh:8` opens the redirect before the group runs, so a failure
part-way through leaves a truncated `index.html` in the repository — build to a
temp file and move it. Load order is load-bearing and unwritten: `ui3.js` must
come last because it bootstraps, and `ui4.js` must follow `ui1.js`. A comment
would cover it.

**The Scribe tab asks for a spot through `prompt()`, and reports two errors
through `alert()`.** `app/ui2.js:83, 85, 92, 96`. In a sandboxed iframe without
`allow-modals`, `prompt()` returns null, so the Spot button does nothing at all
and says nothing. The two `alert()` calls mean the "no graph may rest partly on
one area and partly on another" error — a rule the page exists to teach — is
swallowed in silence. This page is the only one in the repository that uses a
modal at all; the other ten return no hits for `alert|prompt|confirm`.

The Scribe toolbar is already a DOM panel, so the fix needs no new machinery: an
inline text input and a hooks select for the spot, and a status line for the two
errors.

**The Copy button on the proof-in-writing table dies quietly in a sandbox.**
`app/ui5-writ.js:102`. `navigator.clipboard` is guarded and has a rejection
branch, so it degrades to "Copy failed" rather than throwing. But without
`allow-clipboard-write` the button is permanently dead, and copying is the only
way to get the transcript out. On the failure branch it could select the text
instead, so it can be copied by hand.

**`README.md` opens by saying there is no build step.** There is one, and
`CLAUDE.md` forbids hand-editing `index.html`. A future session trusting the
README would edit the built file directly. The rest of the README is accurate.

**`tools/runner.sh` assembles the sources in a different order from
`build.sh`.** `runner.sh:4` globs `../src/*.js`, which puts `10-library.js`
before `11-anim.js`; `build.sh` puts the library last. Hoisting has probably
been covering this, but the tests have not been exercising the order that ships.
Renaming `10-library.js` to `12-library.js` would make lexical order match build
order without touching the naming scheme.

**Everything else in the offline constraint passes.** No `fetch`,
`XMLHttpRequest`, `import`, `Worker`, `WebSocket`; no external stylesheet,
script, font or image; no storage or cookies; no navigation. The only `http://`
strings are SVG namespace declarations. Font stacks are system-only. The page
works offline and over `file://` as required.

---

# Fitting the repository

Out of scope for the review that was asked for, but established while scoping it.

**`build.sh` has no `--check`, and this is worse than it sounds.** There is no
argument handling, so `./build.sh --check` runs the full build, overwrites
`index.html`, prints `built index.html`, and exits 0 — as though it had verified
something. `_status/build.py:761` runs exactly that command on every project it
knows about. The page escapes this today only because it is not in `PROJECTS`.

**So the two must be done in order: add `--check` first, add the page to
`PROJECTS` second.** Doing it the other way round means the dashboard rewrites a
published file and reports it fresh regardless of whether it was.
`severity/build.sh:25-34` has the `--check` branch to copy.

**The page is invisible to every repository script.** `_status/build.py:1259`,
`assess.py:64` and `serve.py:47` all drive off the same hard-coded `PROJECTS`
list, with no directory scan anywhere. No dashboard card; and `serve.py` serves
the page without the review overlay, so it cannot be commented on while cruising.
One entry with `"slug": "Existential-Graphs"` and `"notes": None` is enough —
`load_notes` already handles a null.

**Not on the illustrations index — but that is the normal state.** Six of the
eight entries in `_site/pages/illustrations.html:30-68` sit inside a commented
block headed "Uncomment when you are happy for them to be linked publicly", and
two further siblings are not in the file at all. Adding a card inside the
commented block is the conventional move; publishing it is a separate decision.

**House style, no visitor impact.** `build.sh` and `tools/runner.sh` are
`#!/bin/zsh` where all eleven other build scripts are `#!/usr/bin/env bash`.
`build.sh` uses bare `set -e` with no part-existence guard, so a renamed part
truncates the published file instead of aborting; siblings use `set -euo
pipefail` and a guard loop. It also lacks the review-overlay marker check that
`severity` and `regression-to-the-mean` carry. `src/` plus `app/` with hyphenated
names is the odd layout in a repository that otherwise uses `src/NN_name.ext`.

**Two things that are fine and need no work.** The absence of a `notes/`
directory is not a breach: `CONVENTIONS.md` scopes that rule to paper editions,
and `century-pound` is a concept app without one. Nothing is tracked that should
not be: `.DS_Store` is covered by `.gitignore` and untracked, and tracking the
built `index.html` is correct, since the repository owns the live files.

**`shared/lib.js` and `shared/scaffold.js` do not bind this page.** Only the five
paper editions pull from `shared/`; no concept app does. `scaffold.js` is the
click-a-highlighted-passage framework and addresses `.article-container` and
`.example-container[id]`, neither of which this page has. `lib.js` is
`lgamma`/`dnorm`/`pnorm`/`qnorm` and a canvas renderer imitating R base graphics;
this page is SVG and symbolic and computes no distributions. The only overlap is
a one-line `$` helper.

Worth recording separately, and not caused by this page: the four concept apps
that carry a local `src/03_lib.js` have already forked it four ways, and none of
the four matches `shared/lib.js`.
