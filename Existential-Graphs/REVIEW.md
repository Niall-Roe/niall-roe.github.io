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
- The machinery for writing spot names in Peirce's own letterforms is built and
  tested, and carries no manuscript data. `tools/hand-glyphs.py` turns the
  harvest into a table of outlines, each with its baseline at y=0; the renderer
  draws from that table when one is present and uses the ordinary face when it
  is not. If any one letter of a name is missing, the whole name falls back, so
  no name is ever drawn half in his hand and half in type. Tested end to end
  against the real letterforms served locally: Peirce's own S and C stood in a
  cut on the page. The table itself was deleted from the working copy in the
  same session and nothing scan-derived is in the repository.
- The generator gates on geometry, not just on the harvest's own confidence. A
  capital has no descender, so ink below the writing line means the baseline
  was mismeasured; and a mark far from the height its case implies is usually a
  joined pair read as one letter. Of 69 marks that the harvest rated good with
  a confident baseline, 37 failed one of those two checks and are refused. That
  has gone back to the harvester, along with the observation that five bad C
  come from a single page, which looks like one bad line fit rather than five
  bad marks.
- The hand is drawn from measurements of the manuscripts rather than invented.
  Three things changed, and the third changes the look most. The cut wanders in
  proportion to its own width, at the measured median of 0.074, so a large cut
  wanders more than a small one, where before it wandered a fixed number of
  pixels whatever its size. The cut stroke and the line of identity are set to
  the measured ratio of about 2.1, both held a little above the measured 0.087
  of x-height, which would be a hairline at screen size. And the cuts no longer
  close: only seven of nineteen cuts measured enclose a single area, the rest
  having ends that run past each other and cross, so the stroke is now carried
  past where it began instead of being shut. A doubled "nib" stroke I had
  invented is gone, the measurements saying one thin line. Checked over 376
  renders: every cut open in the hand, every cut shut in type.
- The mark on a prohibition was showing on every illustration. Giving it a
  `display` overrode the browser's own rule for `hidden`, so hiding it did
  nothing. A prohibition's number stays in its button and the mark sits beside
  it, rather than replacing it.
- The permissions carry 29 illustrations. A prohibition is now played like any
  other, so you watch the move that is not allowed actually being made, with
  the mark held over the drawing throughout. R5 gained a second prohibition:
  two cuts with something standing between them may not be taken off, any more
  than they may be put on.
- Further theorems, 23 of them, set as exercises: Peirce's law, the dilemma,
  contraposition both ways, contraction, antilogism, the quantifier
  distributions and commutations, and the rest. Each was checked — the Alpha
  ones are tautologies by truth-value analysis, the Beta ones have no
  countermodel on up to four individuals — and which of them the search reaches
  was measured rather than guessed. Eighteen it reaches; the five it does not
  are marked as such on the page.
- Peirce on what the graphs are, over the proof stage: "a moving picture of the
  action of the mind in thought". The line is not in Roberts; it comes by way
  of Sowa, who has it from Pietarinen's paper on the magic lantern of logic,
  and the page says so rather than inventing a Collected Papers number.
- The permissions carry 28 illustrations, verified. Each one that is permitted
  was checked to be a single application of its own rule and nothing else; each
  one marked "not permitted" was checked against every move the rules allow
  from its starting graph, and none of them is reachable by any rule at all.
  R1 now shows that erasure reaches an evenly enclosed graph however deep, and
  that it does not reach inside a cut, nor take a cut away from its contents.
  R2 shows a denial being inserted, a large graph being inserted whole, and
  that nothing may be inserted on the sheet. R3 works one starting graph,
  P and (Q) and (R(S)) and an empty cut on an odd area, to show what counts as
  a graph that may be iterated: the whole items may, one cut in or two, but Q
  by itself may not, and nothing may be carried outwards. R5 begins with the
  double cut drawn on the blank sheet, and shows that two cuts with something
  standing between them are not a double cut.
- A branch with a loose end is visible. Left to relax towards its only
  neighbour the loose end converged onto it, so R3(a) drew nothing at all; a
  point hanging off a line is now set a stub's length away. The free end of an
  ordinary line is left where it was.
- The same crossing is no longer bridged twice. One ligature is drawn as
  several chains, so a place where two lines meet could be found more than
  once; it is one crossing and takes one bridge.
- A denial of a denial is drawn as a double cut. The compiler collapsed it, so
  "~~P" scribed a bare P, and the one figure R5 is about could not be written
  from a formula at all. It no longer does R5's work in advance. Two knock-on
  corrections: Celarent's conclusion in the library is now stated as "no F is
  H", which is its traditional form and compiles to the graph the proof
  actually reaches; and three captions on the example wall that claimed two
  formulas gave the same graph now say what is true, that they are the same
  once R5 has removed the double cuts. Every claim the wall makes is checked by
  machine: two claims of identity, three of identity after R5, three of
  difference, all hold.
- Scribing a cut round a whole area leaves the area where it is. The animation
  matched a newly drawn lone cut against whatever single cut already stood
  there, so the old cut became the new outer one and everything else appeared
  to be carried inside it; going from "P and not P" to "not both P and not P"
  looked like a rearrangement rather than one cut being drawn. The match now
  walks down the chain of lone cuts and compares at whichever depth accounts
  for most of the drawing. Measured over eight such changes, every mark of the
  smaller graph now survives into the larger.
- The tabs are Scribe, The permissions, Proofs, Work it, Find a proof. The old
  Translate is Scribe, and carries the conventions; the old Scribe, the board
  you work on by hand, is Work it until the three proof screens are settled.
- The rules are called the permissions, which is Peirce's own word for them:
  "Let [the student] read these permissions and the commentary as he would
  listen to the rules of a new and intricate game" (quoted in Roberts p. 14).
  Roberts' "rules of transformation" is noted on the page as the same five.
- Choosing one of a rule's illustrations now loads it at its first state and
  leaves it there. One play button sits under each rule and turns into "set it
  back" once it has run.
- The wall of examples is set out to be worked through: Alpha under the
  conventions it turns on, then Beta, forty in all, beginning with the blank
  sheet, which is now drawn rather than described. Several pairs are the same
  graph written two ways, so that clicking the second leaves the drawing where
  it is. Each carries a line saying what it shows.
- A hand-drawn mode. The cut wanders about twice as far and is laid down twice,
  the second stroke lighter and just beside the first, which is what gives a
  nib its weight; the spot letters are set in an italic serif and each glyph
  sits a degree or two off true. It is a pen imitated, not Peirce's own hand
  copied: no scan from the Roberts book is reproduced anywhere on the page, and
  none should be, since that edition is in copyright.
- Where two lines cross, which one bridges over the other no longer depends on
  the accident of which happens to be running horizontally there. Each ligature
  has a rank, the one its colour comes from, and the higher rank always takes
  the bridge, so a pair crosses the same way every time. A crossing that fell
  inside a rounded corner used to have its bridge silently dropped, leaving two
  lines meeting flat; the corner is squared off there instead. Over 73 drawings
  every one of the 11 crossings is now bridged, and no pair bridges both ways.
- Both cuts of a double cut are marked when R5 is about to remove them, and a
  marked cut beats once after the ring appears.
- Play waits for the step it is playing rather than guessing: the dwell is the
  animation's own length plus reading time. The speed slider used to run
  backwards, higher meaning slower; it now means what it says.
- The finder has a strategy. What a textbook writes as one step, "instantiate
  the universal premiss at this individual", is three of Peirce's rules in a
  row: branch the individual's line, extend the branch inwards through the cut,
  join it to the premiss's line inside. A fourth carries the premiss in by R3
  first where it lies further out. The sequence is offered whole, and states it
  proposes are exempt from the beam, which otherwise threw them away for being
  larger than the goal. Every move in it is an ordinary move, applied and
  displayed like any other. On a bench of eleven Beta problems this took the
  finder from five solved to seven: Darii fell in 6,400 transformations where
  before it ran out at 279,000, and Celarent in 70,000 where before it failed.
- The Conventions and rules tab sits between Translate and Proofs, and each of
  the five rules carries canonical illustrations, thirteen in all, drawn from
  the page's own engine: the rule each one exhibits is recovered from the rules
  rather than asserted by a caption, and all thirteen come back as intended.
- Scribe draws as you type, as Translate does, from both the formula box and
  the linear-notation box.
- The fifteen classical syllogisms that hold without existential import are set
  as exercises, each with its medieval name, figure and mood, and the mnemonic
  explained: the name's vowels give the three propositions, A and I from
  affirmo, E and O from nego. All fifteen were checked for a countermodel on up
  to four individuals and none has one; the nine moods left out, which need the
  further premiss that something is a such-and-such, were checked to be
  refutable and are refuted. Five of the fifteen the search cannot reach, and
  those are worked out in the proof library instead.
- No transformation respawns its graph any more. Two causes. The proof finder
  searches forwards from the premisses and backwards from the conclusion at
  once, and where the halves meet the graph on the far side was built in the
  other tree, so nothing in it was the same object as anything in the step
  before; `hydrateSteps` re-derived each step's rule but discarded the
  re-derived graph, so that step could only cross-fade. It now keeps them, as
  the library path already did, and falls back to matching by shape where no
  rule can be recovered. Measured over four found proofs and the 25 library
  proofs: every joint now carries identity, and each drawing is still the graph
  the search produced.
- A step is now staged rather than played all at once: what is erased goes
  first, then the enclosures grow to make room, then the empty room is outlined
  while it stands empty, and only then is the new graph scribed into it. A step
  that adds something is given half again as long, since it is three beats
  rather than one. Lines of identity grow out of the line already drawn and
  draw back into it instead of fading in and out.
- Hooks are labelled with the variable each line carries — the same names the
  reading prints underneath — in the colour of that line, with the argument
  place as a small figure after the name. Before they were bare ordinals, which
  said which place but not which line.
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

**Peirce's own placement of the hooks is not followed here.** There is a
convention, and Roberts states it: "The rule for reading the individuals
denoted by the lines of identity other than the one positioned at 9 o'clock, is
to take them in their order clockwise" (Roberts 1973, p. 74). So the first hook
belongs due left of the spot and the rest follow clockwise from it, which for a
dyad puts the second at 3 o'clock. This page instead stacks every hook down the
spot's left edge in the order of the lanes the lines run in, which keeps lines
from crossing but loses the placement that carries the order. The label makes
the order recoverable — the variable name, with the argument place as a small
raised figure — but it is a departure, not Peirce's drawing. Doing it properly
means letting a line reach the right, top and bottom of a spot, which the lane
router cannot currently do.

**Literal translation. DONE for the denial.** A denial is now a cut round
whatever is denied and nothing else, so the notation reads from the outside in:
the "~" is the cut, and what it governs is drawn inside it whole. "~(Q -> P)"
scribes a cut round the scroll, ( ( Q ( P ) ) ), where it used to scribe the
tidied Q ( P ). The two say the same thing and R5 takes the outer pair off in
one step, but that step belongs to the reader.

One thing had to be kept back. "Ax φ" is not a cut anyone wrote, it is a
quantifier, and its graph is the figure Peirce draws: the scroll with the line
running through it. Making its denial literal too put a double cut inside every
universal on the page. The rewriting compNeg used to do for everything is kept
for that one place, under its own name, and the explicit "~" is literal.

**Was: literal translation, with a tidying step.** Niall's
call: scribe what the formula says, and then offer to take off the double cuts
that are not doing any work — the ones that are not there because something of
the form "not not" is being proved. So "~(P | Q)" would be drawn as a double
cut round the disjunction, as it is written, and a clean-up would reduce it to
two cuts side by side. That wants: the three remaining elisions in compNeg
removed, a reduction pass that removes double cuts, a control on the Scribe
page to run it, and a check of every library goal, since several compile to
graphs that would change. Not started.

**Was: should the translation be literal throughout?** The compiler no longer
elides the double cut of a double negation, but it still simplifies three other
denials as it scribes them: "~(P | Q)" gives two cuts side by side rather than
a double cut round the disjunction, and likewise "~(P -> Q)" and "~Ax Fx". Each
of those is also a double cut removed in advance. The choice is between a
translation that says exactly what the formula says and leaves R5 something to
do, and one that scribes the tidiest equivalent. Going fully literal is the
more coherent position and the better teaching, but it changes the graph that
several library goals compile to, so it wants deciding rather than drifting
into. This is Niall's call.

**Peirce's hand is on the page.** The letterforms are built into index.html —
78 marks over 34 characters, 92 KB — and every spot name the page draws is set
in them rather than in type. Niall has cleared the rights question.

Three things had to be fixed before it was worth anything. The letterforms were
never in the build, so the mode was only a wobblier cut and an italic face; the
table generator now writes `src/12-hand.js` and build.sh includes it. The
animated renderer drew its own spots and had never been taught to write, so the
Translate tab, which animates by default, always showed the typeface no matter
what the still renderer did. And the cuts are closed again: his own overshoot
and cross, but an open curve on a screen reads as a mistake, and a cut that
does not enclose is the one thing in this notation that must never be in doubt.
What is kept of that finding is the wander, which is measured.

**Was: the whole page draws in Peirce's own hand.** Every spot name it ever writes
— all 30 library proofs, all 39 examples on the Scribe wall, all 90 exercises
and theorems — can be set in marks cut from the manuscripts. 78 marks over 34
characters, 92 KB, which a single-file page carries comfortably. The geometry
gate now refuses nothing: the harvest's own quality and this check have
converged, and it stands as a guard against regression rather than a filter.

The last gap was instructive rather than a gap. Four marks whose recorded
baseline did not match their traced outline turned out to share one cause: when
the harvest was patched to record which method had measured a baseline, the
label was written but the number was left as it had been, so seven marks
carried a line-profile measurement under a label saying it was the ink bottom.
Reported, and fixed at the source; the check now says no non-descending mark
hangs below its stated line.

**Was: nearly the whole page draws in Peirce's own hand.** 30 of 30 library proofs,
38 of 39 Scribe examples, 84 of 90 exercises. One letter, U, is held up by a
mark whose recorded baseline does not match its traced outline; six more, B J K
N Y Z, are wanted only by the textbook exercise set. The table is 65 KB over 27
characters.

The generator also cleans the crops. A crop often catches a fragment of the
neighbouring line, a comma or the foot of an ascender, which traces as its own
detached blob. The letter is the tallest piece of ink, so anything lying wholly
above or below it came off another line and is dropped. Where the stray is
joined to the letter in one stroke nothing can be done on this side, and those
marks are reported back rather than drawn.

**Was: every proof in the library draws in Peirce's own hand.** Q and R were the
last blockers and they came off one manuscript line, "P, Q, R, really lie in
the straight line". All 30 library proofs now write every spot name from the
marks; 32 of the 39 examples on the Scribe wall do too. Four letters are still
wanted anywhere on the page: D, L, U and W. The table is 61 KB over 23
characters, a comfortable weight for a single file.

Getting there cost several corrections on both sides, and every one was settled
by opening the image rather than by reasoning about the number. The common
shape: a good measurement of the wrong quantity. A height check applied to a
mark that had never been scaled; a baseline fitted on a crop holding two lines;
a descender tolerance shorter than his Q; a label recording a method the number
did not use; and, in this generator, a list of acceptable characters that was
right when written and silently stopped matching the page as it grew, and a
width rule set at a round number that turned out to be narrower than Peirce's
capital E, which carries a long horizontal flourish and runs 1.8 ems wide as a
single letter. Thresholds are now calibrated on the marks themselves. Capital
G descends in this hand. The absolute-height check assumed a scaling that marks
without a measurable x-height never had, and was discarding clean capitals for
being small crops. His capital Q carries a tail a third of its height, longer
than my descender tolerance. And an ordinary capital R kicks its leg under the
line, which is a pen and not a mismeasurement, so the tolerance for letters
that do not descend was tighter than a hand. The rule I have taken from it: a
measurement is evidence about a measurement, not about a mark.

**Was: Barbara draws in Peirce's own hand; half the library still cannot.** The
second harvest brought F, G and H, so the syllogisms are drawable, and 15 of
the 30 proofs now write every spot name from the manuscripts. The other 15 fall
back for two letters: Q, whose sixteen marks are all the capital-I misread, and
R, which has one unreviewed mark. Since every Alpha proof is P, Q and R, those
two would take the library to nearly all of it, and they have been asked for.

Two corrections to my own gate came out of this, both from looking at the marks
instead of trusting a measurement. Peirce's capital G descends, so rejecting it
for having ink below the writing line was wrong; the gate now takes that
judgement from the harvest rather than making a conflicting one. And the
absolute-height check assumed every mark had been scaled to a common x-height,
which a mark with no measurable x-height cannot be — it was throwing away clean
capitals for being small crops. Each mark is now scaled by its own ink height
above the line, and joined pairs are caught by width instead. That took the
table from 32 marks over 15 characters to 52 over 21.

**Was: the letterforms are harvested but cannot yet be used.** Of the 32 characters
the page draws, twelve are drawable after the geometry gate: A C H M O P S X r
t x z. F and G are the blockers — the syllogisms are built on F, G, H and M,
and G turned out to be a misread: all 43 of them are Peirce's capital I, which
a reader takes for G, Q or 9. A second harvest has been asked for, aimed at F
and G, then more x y z, then L N J q u v w.

**Was: the letterforms are harvested but cannot yet be used.** 762 marks across 39
characters are in ~/Documents/Peirce-hand, each a transparent PNG and a traced
SVG with reel, frame, Robin number and a baseline. The page draws 32 characters
inside a graph, and of those only six are both eye-checked good and confidently
measured: A, C, P, S, X, t. Twelve are absent altogether — F, H, J, L, M, N, O,
q, r, u, v, w — and F, H and M are three of the four letters the syllogisms are
built on. Fourteen more are present but rated mixed, poor or unreviewed,
including the variables x, y and z that label every Beta line. A mode falling
back to a typeface for two thirds of its letters would look worse than none, so
the glyphs wait on a second pass, which has been asked for.

**The rights on the scans are unresolved, and this repository is the live site.**
Peirce died in 1914 so the writing is out of copyright, but the images are the
Houghton microfilm and redistribution rights for those digitisations are not
settled. A traced outline is a weaker claim on the digitiser's work than a
photographic crop, which is an argument for publishing the SVGs rather than the
PNGs if anything is published at all. Nothing derived from the scans is on the
page: not the glyphs, and not the nineteen figures, which are good. The
measurements are facts about the manuscripts and carry no such question, which
is why they are what went in. This is Niall's decision and probably Houghton's.

**Peirce's actual letterforms.** Niall's wish: a toggle that mimics his hand,
built from examples of his capitals and his line weight. What is on the page is
a generic pen, not his. Doing it properly means a source of his letterforms
that can be redistributed. The Roberts plates cannot be used; the manuscripts
themselves are out of copyright, being Peirce's own and published before 1929,
but the photographs of them at Harvard carry their own terms, so the thing to
find is an openly licensed set of images, or to draw a face from them by hand.
MS 514 as transcribed by Sowa is already cited on the page and is a starting
point for the shapes if not for the images.

**The interactive part wants to be direct.** Niall's note: scribing should be
click and drag rather than buttons and selection. Worth doing before anything
else is added to the Scribe tab.

**Work it by hand should be a button, not a suggestion.** When no proof is
found, `app/ui2.js` tells the reader to "work it by hand on the Scribe tab" and
then leaves them to retype the premisses. It should be a button that carries
the premisses and the conclusion over, scribes the premisses on the Scribe
sheet and sets the conclusion as the goal — the puzzle machinery already there.
Niall's note: the Scribe tab wants reworking around this, so do that first
rather than bolting the button onto it as it stands.

**Four Beta problems on the bench are still out of reach.** Barbara, the chain
of two conditionals, the distribution of a universal over a conjunction, and
the interchange of quantifiers. All four have universal premisses and a
universal conclusion, and all four need the graph to grow substantially before
it shrinks. The strategy reaches the right state for Barbara in one move — from
it the rest is five ordinary moves, measured — but the layer that state sits in
is too wide to get through inside the time cap. What is wanted is a smaller
branching factor, not more depth or a wider beam: both were tried and neither
helped. Weighting the beam's distance so that missing material counts more than
surplus was also tried; it fixed nothing and broke Celarent, and was reverted.

**Two steps of the generated Calemes proof carry no rule.** The linear notation
cannot always say which ligature a point belongs to, so replaying those two
steps from the stored string cannot recover the move, and they animate by shape
matching with no ring. The same limitation shows in the some-for-all proof. The
fix is to store the move alongside the string in the library rather than
re-deriving it.

**Search harder freezes everything for up to thirty seconds.** `app/ui2.js:239`
runs a 30-second cap synchronously, so nothing responds, including the tab bar.
The exercise dropdown triggers this automatically for the four exercises marked
as needing it. The budget caps themselves do hold — overshoot is bounded by one
state's expansion — so this is a responsiveness problem, not a runaway.

**A found proof cross-fades at the joint instead of moving.** FIXED — see
"Fixed so far". `hydrateSteps` re-derived each step and then threw the result
away.

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

## The three tabs are one — done

Proofs, Work it and Find a proof are a single tab, Prove it. Niall's shape, not
the four-tab one I proposed: one list, two boxes, and then the same proof
either played or handed over.

- **One list.** Every worked proof and every exercise in one dropdown, 120 of
  them, the worked proofs first in order of how many steps they take, then the
  exercises in the order the books set them. Choosing anything fills the boxes.
- **Two boxes**, premisses above and conclusion below, with the search beneath.
- **Two buttons once there is a proof**: play it, or work it yourself. The
  first shows the stage, the steps and the writing; the second swaps in the
  sheet, the goal and the rules.
- **One player.** The library and the search had a player each, sharing all
  their machinery and none of their code. The search now dresses its result as
  a library entry and the one player serves both; the second is deleted.
- **The controls are the five permissions.** Each rule is named with a gloss
  and shows what it allows here, including the rules that allow nothing at the
  moment, so the set is always visible rather than a list that silently
  shrinks. R5 is split into the double cut drawn and the double cut removed.

Two things had been quietly broken and this surfaced them. R2 was given an
empty palette, so the rule that lets you scribe any graph whatever could never
be applied: it now draws on the subgraphs of the sheet and of the goal. And the
move list deduplicated by result across rules, so R5's removal of a double cut
was hidden behind R1's erasure of the same thing. Two rules reaching one graph
are two moves to someone learning the rules, and the dedupe is now per rule.

The search runs on its own: as soon as anything is chosen, and again a moment
after the boxes stop changing. Whatever was found is dropped the instant the
inference changes, so Automate never offers a proof of something the reader has
stopped asking about, and it says "looking…" while it works.

Automate was greyed out for a reason that took a moment to see: the page opens
on the simplest thing in the list, which is a proof of no steps at all, and the
test for "is there a proof" demanded at least one step. A proof of no steps is
still a proof — the conclusion was already scribed — and the pill now says so.

The two ways on are now equally weighted and sit under the one heading: the
sheet of assertion is named whichever mode you are in, with Automate and Work
it yourself beneath it. Automate is greyed until there is something to watch.
When a proof is found the search buttons are replaced by a green pill saying so
and how many steps it took, with a way back to searching.

One thing I broke in the merge and fixed: a stray closing tag carried over from
the old board's markup collapsed the two-column grid, so the sheet of assertion
fell below the chooser instead of standing beside it. The goal card also kept a
puzzle dropdown that no longer has anything to pick, the proof being chosen
above it; the card now just shows the goal, and the hint and move count compare
against whichever proof is chosen, worked or found.

### The controls, as six cards

The move list told the reader what was possible and nothing about which rule
they were using. Each rule now has a card, and the sheet and the cards talk to
each other in both directions.

- **Pick a graph, and the rules that can act on it light up**, with a count of
  what each offers here. Picking the outer of two copies lights deiteration,
  and so does picking the inner one, since the rule concerns the pair.
- **Pick a rule, and the places it can act are marked on the sheet** as you
  pass over them; clicking one applies it. With a graph already picked, only
  its own moves are marked, so arming iteration on a chosen P shows just the
  areas that P could go into.
- **Insertion opens a box** when the area picked is oddly enclosed, and what is
  typed is scribed there whole. A conjunction typed as one graph goes in as one
  graph: the palette holds subgraphs, so the typed graph is added to it entire.
- A rule with nothing to do is drawn dim rather than hidden, so the set of five
  is always in view. The full list of every legal move is still there, folded
  away beneath.

Nothing in the cards decides what is legal. Each asks legalMoves what it may do
and shows that, so the panel cannot drift from the rules.

### What working three proofs through by hand turned up

Driving the board myself, rather than testing the pieces, found four faults. The
first three were invisible from the outside and would have looked like the page
ignoring the reader.

- **Double cut elimination did nothing.** A cut is drawn as a single element
  carrying two names, the cut and the area inside it, and the hit test looked
  only at the area. R5 aims at the cut, so the click matched nothing and fell
  through in silence. Any rule aiming at a cut rather than its area was dead.
- **A move was only committed when its animation finished.** Interrupt the
  animation — switch tab, click again, a machine that never runs the frames —
  and the move was lost while still being counted, so the move count and the
  sheet disagreed. The sheet now changes first and the animation only shows
  what changed, with a watchdog in case it never reports back.
- **Settling left the animation running.** Its next frame painted over the
  drawn sheet, and since animation frames carry no identifiers the drawing
  stopped answering clicks altogether. Settling now cancels.
- **A click during an animation was dropped without a word.** Anyone working at
  a normal pace loses moves that way. A new move now cuts the running animation
  short and goes on top of it.

The panel also says in words what is picked and what a rule will do with it,
which is what the rings alone could not: "Picked: “P”, on the sheet of
assertion", then "Iterating “P” — 3 places marked in green", and on hovering
one of them the exact sentence for that move. Modus ponens now goes through in
three moves by hand, which the status line reports as matching the library.

### Insertion, and two bugs in it

- **"( P )" scribed P.** In the linear notation that is a cut round P; in
  ordinary notation the brackets only group, so it is plain P. The box guessed,
  tried the formula reading first, and got it wrong exactly when the reader was
  thinking in the notation the page prints everywhere. The box now says which
  notation it is reading, and shows what it is about to scribe, in both the
  linear form and the reading, before anything is scribed.
- **Clicking an area with insertion armed scribed something at random.** With
  nothing chosen to insert, the click applied whichever move headed the list,
  which was usually a copy of what the reader had just clicked on. Insertion is
  never applied by a click on the sheet now: the click says where, and the box
  says what.

### The goal, and the hint

The space beside the mode switch belongs to whichever mode is showing: the
conclusion you are trying to reach while you work, which turns green the moment
you reach it, and Peirce's line about a moving picture of thought while you
watch. The list opens on modus ponens rather than on a proof of no steps, which
showed nothing being done.

The hint gives away as little as it can and more each time it is asked: once,
which rule; twice, and which graph on the sheet it acts on; three times, and
the rule armed with the place to click marked. The count resets after every
move, so each step is asked for afresh rather than the reader being handed the
rest of the proof.

### More from working it

- **Watching after working showed the machine's proof, not yours.** The mode
  switch played whatever the player happened to hold. It now plays what you
  did, and says so, with a link to the found proof when there is one. The
  source is passed in explicitly rather than set after the fact, which is what
  had let a recursive load overwrite it.
- **A double cut can be drawn round a graph.** It could only be drawn on an
  empty patch of an area, so wrapping something meant scribing the pair beside
  it and then iterating it in. Where the move encloses exactly one graph, that
  graph is now what you click, and picking a graph and pressing the rule wraps
  it in one go.

### The board, worked over again

- **A rule with nothing left to choose now just does it.** Pick a graph, press
  erasure or deiteration or the double cut removed, and it happens; the
  animation shows which higher copy the erased one answered to. Demanding a
  second click for a rule that has no choice to make read as the page refusing
  to work, and for the double cut there was nothing further to click at all.
  Insertion still asks, because what to scribe is not on the sheet to point at.
- **The rules run across the panel**, six abreast where there is room, and the
  "what it says" card is gone. The reading and the linear notation sit under
  the sheet instead and follow it live.
- **What you have done is written down as you do it**, rule by rule, in the
  same form as a machine proof's steps, with an undo; and when you are finished
  you can step through your own proof in the player, premisses first.
- The space beside the switch carries Peirce's full remark to Kehler, with the
  source on hover: "At great pains, I learned to think in diagrams… It consists
  in thinking in stereoscopic moving pictures" (MS L 231, 22 June 1911), by way
  of Pietarinen's 2011 paper.

### Which proof watching shows

Switching to watching used to play whatever the reader had done, finished or
not, which meant an unfinished attempt was played back instead of a proof.
Watching now shows a completed attempt, and otherwise the found proof, with the
other one click away either way and named for what it is: "your proof" when it
reaches the conclusion, "how far you got" when it does not. The button under
the record says the same.

The Prove tab also opens on the board rather than on the player, and a proof
turning up from the search no longer pulls the reader off the board to watch
it. The point is to try it first.

### Iteration in either order

Picking the graph and then the rule always worked; picking the rule first did
not, because the rule had no way to ask which graph. It now asks. With
iteration armed and nothing chosen, the graphs that can be copied are marked
and the prompt says "First pick the graph to copy". Once one is chosen it stays
marked, the prompt becomes "Copying P. Now pick where it goes", and passing
over a destination draws the same dashed arrow the animation uses, from the
graph to the place it would land, so the click is visible before it is made.

The sheet itself is now markable as a destination. It is drawn as the backing
rectangle rather than as a cut, so it had no name for the marker to find, and
the count said three places while two were lit.

### What R6 actually says

The illustration claimed a double cut may be taken off "wherever such a pair
stands", which is not the rule. The two cuts come off when nothing stands
between them. What is inside the inner cut makes no difference, and a line of
identity passing through the pair does not prevent it. Both the rule text and
the examples now say that, and there are two prohibitions: a graph sitting
between the cuts, and a second cut sitting there.

### Numbering, and the copy

The double cut removed is R6. Roberts counts five rules, treating the double
cut as one read both ways; the page says so. Six is how many things there are
to reach for when you are working, and it makes the shape of the set visible:
three operations, each with a direction in and a direction out. R1 erases and
R2 writes; R3 copies inwards and R4 erases such a copy; R5 draws a double cut
and R6 takes one off. A cut is a graph like any other, so its pair behaves like
the other two.

Every rule now carries examples, 39 in all, each checked to be a single
application of its own rule, with the moves it does not allow marked as such
and checked to be unreachable by any rule.

The About card is gone. How to read a graph sits on the Scribe page, where you
are reading graphs; how the finder works sits on the Prove page, folded into a
card you open if you want it; and what is left beside the rules is Peirce on
the Graphist and the Interpreter, what is not here, and the sources.

The prose I wrote has been rewritten plainly. Framing sentences round Peirce's
quotations are gone — the quotations stand on their own — and the claims on the
Scribe page now carry citations from the Collected Papers rather than being
asserted: juxtaposition asserts both (4.398), the cut severs what it encloses
(4.399), a heavy point denotes one individual without saying which (4.405), a
line asserts the identity of what its ends denote (4.406).

### Gamma — for later

Peirce went on to a third part after Alpha and Beta. Gamma carries the broken
cut for modality, graphs about graphs, the potentials, and the tinctures of the
1906 Prolegomena; Roberts gives it chapters 5 and 6. None of it is on the page,
which says so plainly in the new note on Alpha and Beta rather than leaving the
reader to assume the two parts are the whole system. Adding even the broken cut
would mean a second kind of cut in the engine, a modal reading, and rules that
are not among the five, so it is a project rather than an afternoon.

### Still to do here

The board is where the direct-manipulation work belongs, now that it has a
permanent home. (The thirty-second freeze on "search harder" is fixed: see the
session notes at the end.)


# This session: the search, the headings, and two unsound things

## Where things are said

How to read a graph is now a card at the head of the Scribe tab, with Peirce's
sponge line above it, in the same shape as the permissions card on Manipulate.
It used to be buried at the foot of the conventions card, below everything it
was meant to help with.

The heading that said five permissions says six. On the Prove tab "Transform
it" is "Rules of manipulation", matching the language everywhere else, and the
drawing tools, which used to sit in the left column under the bare heading
"Scribe", are called "Scribing marks by hand" and stand under the rules they
serve. They are the marks R2 lets you write in an oddly enclosed place, so that
is what the card now says.

The About-these-rules card is gone. Peirce on the Graphist and the Interpreter
has moved up beside the permissions, and the sources are a footer, visible from
every tab rather than filed under one of them. The rule examples now have the
width of the page.

Double cut removal is R6 everywhere, not only on the cards: in the rule the
engine reports, in the sentence under each step, and in the thirteen places in
the proof library where a stored step said R5 for a removal.

## What the finder does while it searches

It no longer freezes the page. The search is a generator, driven ninety
milliseconds at a time, and the count of transformations tried goes up under
the buttons while it runs. The thirty-second "search harder" was the worst of
it and is now just a longer wait with something to watch. Time spent painting
is given back to the search, so a sliced search does as much work as a blocking
one; a search in a background tab, where timers are slowed to a crawl, is
capped instead of running on for minutes.

The premisses and conclusion under the buttons are rewritten the moment the
target changes, with the step count left blank until there is a proof. Before,
they went on describing the last thing found.

## Making it smarter

Three things the search now knows to try. Each is offered as a whole sequence;
none of them licenses a step, and every move in them is an ordinary move.

*Applying a universal to an individual* was already there: branch, carry in,
join.

*Detaching a consequent* is new. Where a conditional stands outside a place
that already holds its antecedent, iterate it in (R3), deiterate the antecedent
against the copy already there (R4), take off the double cut (R6). The middle
of that is a bigger graph than either end, so a search ranking states by
resemblance to the conclusion throws the opening away.

*Assuming the antecedent* is new, and is the deduction theorem done in the
rules themselves: to prove a conditional from the blank sheet, draw a double
cut (R5), write the antecedent between the cuts, which is oddly enclosed (R2),
iterate it inside (R3), and work the proof of the consequent there. It is sound
because the rules turn on even and odd enclosure, and the inside of the inner
cut is evenly enclosed like the sheet. The exception is the bare line of
identity, licensed on the sheet by C1 and nowhere else; a sub-proof that puts
one down is not transplanted, and that is checked move by move.

The insertion palette also stopped mangling Beta. A subgraph with a line of
identity in it used to be copied without the line; now it is lifted whole when
no line crosses its edge. That alone reaches two theorems the search had never
got, and it is why the steps of an assumed proof resolve to rules.

Measured over the whole list of 90 exercises: 77 found, where before the same
list gave 71. The constructive dilemma, which is what prompted this, is found
in about eight seconds of JavaScriptCore and under three in a browser. Four of
the 77 proofs contain a step the page cannot match to a single rule; the page
says so on those rather than claiming every step was checked.

Still beyond it: Barbara, Celarent, Cesare, Camestres and Calemes; the
hypothetical syllogism in Beta; two distribution theorems; and four of the
textbook exercises.

## FIXED — erasing a spot could sever a ligature

Removing a spot removed its hooks, and a hook may be the point at which several
points of one line meet. Taking it away broke the line, so the rest of the
graph said something else. Read forwards that is only a weakening, which is why
it went unnoticed; read backwards, where the search runs the rules in reverse,
it made deiteration stop being the inverse of iteration, and the page would
report a proof of *Ex Fx therefore Ax Fx*. A hook that two or more points meet
at is now left behind as an ordinary point of the line, which is what erasing
one spot does.

## FIXED — a false meeting could be reported as a proof

The search treats two graphs as one state when their canonical forms agree, and
for Beta that form is not quite fine enough: two graphs that say different
things can share one. The two halves of the search then meet at what is not
really one graph. Every assembled chain is now model-checked step by step —
Alpha by truth-value analysis, Beta by looking for a countermodel on one or two
individuals — and a chain that fails is thrown away, that meeting-point struck
off, and the search goes on. All 158 steps of the 30 library proofs pass the
same check, and so does every proof the search returns over the 90 exercises.

The canonical form itself is still too coarse. Strengthening it is the real
fix; the check is a net under it.

## FIXED — a countermodel was looked for in the wrong formula

A free variable cannot be scribed, so the page closes it existentially. The
countermodel search was still reading the typed formula, so *Fa therefore Ax
Fx* came back as having no countermodel on three individuals. It now reads the
graphs.

# Copy, linear notation, and graphs that rearranged themselves

Not pushed: waiting on Niall to look at it locally.

## The copy

The subtitle under the page title is gone. How to read a graph now opens with
Niall's own introduction to the sheet, graphs and cuts. Every example in it is
a highlighted phrase that draws itself, step by step, on a small sheet beside
the text; the last one ties each cut to its part of ¬((A ⊃ B) ∧ (C ∨ ¬D)) by
colour. Peirce's sponge line now follows the paragraph on reading from the
outside in, instead of opening the card. The notes on shading, coloured lines
and hook labels moved under the conventions, as "About the drawing".

The introduction to the rules on Manipulate is Niall's overview. His message
broke off after "If you have a copy of a graph"; the rest of that paragraph and
the R5/R6 paragraph were written to match and should be checked.

## Linear notation on Scribe

The proposition box has a switch between ordinary and linear notation, with
its own short guide to the notation. Switching carries what is in the box
across without changing the drawing: a double cut survives the trip, which the
kinder reading back would otherwise have collapsed. The choice is remembered.

## Why graphs rearranged, and what was done

Graphs on an area are drawn in the order they are stored, and order means
nothing. Three things changed it without need. Drawing a double cut put the new
pair at the end of the row; taking one off put what it held at the end. Matching
a new drawing to the old by shape, as the Scribe box, the reading card and the
unresolved joints of a proof all do, kept the new graph's order rather than
the one on screen. All three now keep what the eye already has.

Measured over the thirty worked proofs and a set of formulas that differ only
in order: 14 reorderings before, 3 after. The three left are a double cut drawn
round two graphs that were not next to each other, which the rule itself has
to gather.

Where a finished proof stands in a different order from its conclusion as
written, the player adds a last step, Rearrange, that only moves things into
that order. It is set apart from the rules in the step list and is not counted
among the steps. Beta proofs do not get one: their final drawings carry a
different number of line points from the conclusion, so the move could not be
shown without redrawing.

## Also fixed

- Choosing a worked proof set off the automatic search, which replaced the
  book's proof with one of its own 700 ms later.
- A leftover line at start-up put *P ⊃ Q* alone on the board over modus ponens,
  so the premiss P was missing until the reader switched modes.
- The switch between working a proof and watching it now stays where the reader
  put it while they move between problems. It starts on working it by hand.
- The `hidden` attribute did not hide elements whose class sets `display`.

## Lines of identity, through the rule cards

The rules already had their Beta clauses among the legal moves: R1 takes up a
bare line or breaks a join, R2 puts a line down or joins two, R3 branches a line
or carries a loose end in through a cut, R4 takes a loose end back. But what
they act on is a point of a line, and the points could not be clicked as
targets, so these moves were reachable only from the full list. Beside them sat
a card of tools for drawing by hand, which changed the sheet under no rule and
left no trace in the reader's proof.

Now the points are targets like any graph. Arm a rule and the points it can act
on light up; click one, and where the move needs a second thing named, the
point to join it to or the cut to carry it into, those light up for the second
click. A point picked with no rule armed lights the rules that can act on it.
Insertion's box offers a line of identity alongside the typed graph. The hand
tools are gone; Undo and the display toggles sit under the cards. Verified by
working the instantiation of a universal premiss entirely by clicks: branch,
carry in, join.

## Watching a proof the finder did not find

The switch to watching was enabled only by a proof the page had, so a Barbara
worked by hand, which the finder cannot reach, could not be played back. It now
opens as soon as the reader has made a move. Choosing an exercise also cleared
nothing of the previous problem's proof, so the switch could have played a
proof of something else; that is reset now. And coming back from watching no
longer wipes the board, unless the problem has changed meanwhile.
