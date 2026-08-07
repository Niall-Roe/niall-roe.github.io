---
position: 26
status: done
anchor: "The kernel of it is that the conjoint probability of all the arguments in our possession"
heading: "27 (new) — which way the connection runs"
---
### Suggestions

None open.

### Completed

#### which way the connection runs

Anchored on "The kernel of it is that the conjoint probability of all the
arguments in our possession ... must be intimately connected with the just
degree of our belief in that fact". Your paragraph opens it, as written (I took
out a doubled "of" in "the nature of of this intimate connection").

Two argument sliders give a proper intensity of belief, shown on a belief line
running −6 to +6 with an even chance at the middle. Under it, on the same scale,
a second line that is yours to move, and four dispositions to park it at —
believe just what you ought, stubborn, sceptical, over enthusiastic.

The demonstration is that nothing happens. Move the lower slider through its
whole range and the proper intensity above does not stir; the readout says so in
as many words once you have touched it. Each line also carries the probability
its belief corresponds to, so the gap is legible as a difference in probability
and not only as a difference in nats. Verified that the proper value is
character-for-character identical before and after the belief is dragged.

"Update your belief" is set as text rather than as a button — it is the
sentence the three completions finish — and "to its proper state" is selected
from the start, so something moves on the first drag:

  to its proper state   snaps to whatever the arguments warrant
  stubbornly            moves the right way, at 66% of the evidence's speed
  enthusiastically      moves the right way, at 133% of it

The rate applies to how far the evidence has just moved, not to the gap standing
open. Applied to the gap, all three end up in the same place however slow the
rate, because a drag fires a hundred times and a hundred part-steps arrive where
one whole one does. Applied to the change, the dispositions separate properly:
take the arguments from Peirce's pair down to two even chances and the proper
intensity falls 4.037 to nothing, while the stubborn believer is still at +1.37
and the enthusiast has overshot to −1.33.

The belief is held as a real number and only written to the slider, never read
back off it — rounding each step to the slider's own resolution biased the
accumulation enough, at a stubborn two thirds, to move the belief further than
the evidence had. The slider itself is finer now, 0.01.

Neither intensity shows a probability. Both are unit-less, as your own paragraph
says, and printing one against either was quietly suggesting it could be read
back out.

Labels are Proper Intensity of Belief and Your Intensity of Belief.

The closing line is now the instruction: move the probability sliders to see how
they impact the proper intensity of belief; move the Your Belief slider to see
how much it impacts any worldly probability.

Earlier fixes:
 - The marker on the proper line was invisible. It was being drawn and
   positioned correctly, but its track had no colour key, and the marker had no
   colour of its own to fall back on, so it painted nothing. The marker now
   carries a default colour so this cannot happen silently again, and the
   proper line is keyed green like the other derived readings.
 - The dispositions were in fact wired — they were setting the slider all
   along — but with no visible marker to move against, and with stubborn and
   sceptical moving it only a little, they read as inert. The pressed one is
   now marked until you move the slider by hand.

This closes the outstanding items on both 9 and 26 — it was the same one-way
street both times, and it belongs here rather than in either of them.

#### the note marked, the instruction moved

Your added paragraph is set behind the same blue rule. "Move the probability
sliders to see how they impact the proper intensity of belief. Move the Your
Belief slider to see how much it impacts any worldly probability." has come out
of the readout at the bottom and now sits on its own line at the end of the
preamble, where it can be read before the sliders rather than after them. The
readout keeps the two intensities and the gap between them.

#### the sub-example hidden, and its trigger unlinked

"34 (new) — a proportion of what?" is off the page. Its container is out of the
article and the trigger inside 27's own note is now plain text: the sentence
still reads "and cannot be used to determine any probability", but it is no
longer a link and opens nothing.

Nothing is deleted. The example's code is still in src/07_ex912.js, its notes
entry is intact and still marked done, and a comment sits where the container
was saying what to put back. Restoring it is two lines.
