# Probability of Induction — outstanding work

Numbered so we can pick items off by number. Anchor quotes are the text in
`src/02_article.html` each item attaches to.

---

## A. New examples

### A1. The principle of indifference
How it is meant to work, and Peirce's objection to it.

Peirce's own reductio is already built as ex13 (the Saturn colour chart: every
sub-area gets ½, so a containing area gets at least unity, which is absurd).
This item wants the *positive* statement first — the principle as its advocates
intend it — so that ex13 lands as a refutation of something the reader has
already seen stated fairly.

Candidate home: §II, near
> "Except that this introduces the thoroughly unclear idea of cases equally
> possible in place of cases equally frequent"

or at the head of the run leading into ex13.

---

### A2. Which bag did this coin come from?
Anchor:
> "Now, if there be any way of enumerating the possibilities of Nature so as to
> make them equally probable, it is clearly one which should make one
> arrangement or combination of the elements of Nature as probable as another
> … leads simply to the conclusion that reasoning from past to future
> experience is absolutely worthless."

The Laplacean procedure for "is this coin fair?" is one of two things, and
neither is what we wanted:

1. A report of one's own degree of certainty that the coin is fair. The method
   of balancing reasons (ex9, ex12) has already shown that a single number of
   that kind is not the target — we want the second number, the probable error.
2. A question about **selection**: which of 100 bags did this coin come from,
   where the nth bag holds coins landing heads n/100 of the time? On that
   reading the repeated flips inform us about *the manner in which the coin was
   drawn*, not about the coin in front of us. - this is sometimes applicable and appropriate, e.g., if we are really trying to figure out where soemthing came from. but it does not apply when we are trying to figure out the "probability" of something like a law of nature. we do not have a statistics of possible universes. 

Build: 100 bags in a row, coin drawn from one of them, flips accumulating.
Show the posterior over *bags* forming while the coin itself never changes.
The point to land: the calculation is about the draw, not the object.

### A3. Universes as plenty as blackberries
Anchor:
> "The relative probability of this or that arrangement of Nature is something
> which we should have a right to talk about if universes were as plenty as
> blackberries, if we could put a quantity of them in a bag, shake them well
> up, draw out a sample, and examine them to see what proportion of them had
> one arrangement and what proportion another."

Same machinery as A2 with worlds substituted for coins, to press the point that
we care about *this* world. Probably one example with a toggle rather than two
separate builds — decide when we get there. [ could use something like the probabilty of a law of nature as the esxample, as part of the point is that for peirce, such things have no probabilities (as probabilities apply to procedures)

---

### A4. The shuffled deck
Anchor:
> "In short, it would be to assume that Nature is a pure chaos, or chance
> combination of independent elements, in which reasoning from one fact to
> another would be impossible; and since … there is no judgment of pure
> observation without reasoning, it would be to suppose all human cognition
> illusory and no real knowledge possible."

The presupposition defeats itself. It is like insisting the deck be shuffled and
then reading order in the cards drawn as evidence of order in the deck — having
stipulated a shuffle, there is by construction no order left to find.

Build: deal from a deck the user can set as shuffled or ordered. In the shuffled
case, show that any apparent run carries no information about what comes next;
in the ordered case, show that it does. Connects to A2/A3: the indifference
assumption *is* the stipulation of a shuffle.

[could be nice to contrast this against a case where the order is important and is learned about... any ideas?]

---

### A5. Our conclusion according with the fact
Anchor:
> "And is not this, after all, what we want to know much rather than the other?
> Why should we want to know the probability that the fact will accord with our
> conclusion? That implies that we are interested in all possible worlds, and
> not merely the one in which we find ourselves placed. Why is it not much more
> to the purpose to know the probability that our conclusion will accord with
> the fact?"

Demonstrate the two directions visually, side by side:
- P(fact accords with conclusion) — quantifying over possible worlds.
- P(conclusion accords with fact) — one world, quantifying over the ways our
  procedure could have gone.

Same numbers, opposite conditioning. This is the hinge of §IV, so it deserves a
clear picture.

---

### A6. Probability of the conclusion vs trustworthiness of the proceeding
Anchor:
> "In the former case, we know that premises precisely similar in form to those
> of the given ones will yield true conclusions, just once in a calculable
> number of times. In the latter case, we only know that premises obtained
> under circumstances similar to the given ones (though perhaps themselves very
> different) will yield true conclusions, at least once in a calculable number
> of times. … in the case of analytic inference we know the probability of our
> conclusion (if the premises are true), but in the case of synthetic
> inferences we only know the degree of trustworthiness of our proceeding."

Two panels: an analytic inference where the class of *forms* is fixed and the
rate is calculable, against a synthetic one where the class is fixed by *how the
premises were obtained* and only the trustworthiness of the method is available.
Pairs naturally with ex19/ex20 (Epimenides deductive vs the induction from five
or six), and could reuse their machinery.

---

## B. Getting Peirce's table into the paper

### B1. Print the bbbb / wwww table in the article
Anchor:
> "In this way, we should have a distribution like that shown in the following
> table, where w stands for a white ball and b for a black one. The reader can,
> if he chooses, verify the table for himself."

The table is currently only inside ex14. It should appear in the text as Peirce
printed it, since the following paragraphs refer to it directly ("In the second
group, where there is one b, there are two sets just alike; in the third there
are 4 …").

### B2. Sliders drive the printed table
The granary proportion should change the table live: 1 in 3 white gives sets of
1, 2, 4, 8, 16; ten times as many black gives 1, 10, 100, 1000, 10000; even
numbers give one set per group. An earlier draft did something like this —
recover that behaviour.

### B3. "page 713" → "above", with a scroll link
Anchor:
> "Then the table on page 713 represents the relative frequency of the
> different ways in which these balls might be drawn."

Replace the magazine page reference with "above" and link it to the table from
B1. Depends on B1.

---

## C. Re-anchoring existing examples

The principle: put the trigger on the sentence that states the *result*, so the
reader has read the content before clicking.

### C1. Move ex15
From:
> "As we cannot have an urn with an infinite number of balls to represent the
> inexhaustibleness of Nature, let us suppose one with a finite number …"

To:
> "It will be seen that if we should judge by these four balls of the
> proportion in the urn, 32 times out of 81 we should find it 1⁄4, and 24 times
> out of 81 we should find it 1⁄2, the truth being 1⁄3."

### C2. Move ex16 (the census)
From the whole paragraph to its last sentence only:
> "We see that the actual discrepancy is ten times the sum of these, and such a
> result would happen, according to our table, only once out of 10,000,000,000
> censuses, in the long run."

### C3. Move ex18 (one white ball in 100)
From the whole paragraph to its last sentence only:
> "Thus we should be tolerably certain of not being in error by more than one
> ball in 100."

---

## D. Enhancements to existing examples

### D1. ex18 — Peirce's own wording, live
Restore the earlier behaviour where the paragraph's text was rewritten as the
sliders moved. Specifically, carry the sentence "Thus we should be tolerably
certain of not being in error by more than one ball in 100" and put the computed
figure in brackets after the 100, so Peirce's phrasing and the exact number sit
together. Depends on C3.

### D2. ex20 — running proportion plot
The Cretans induction currently shows a histogram of estimates. Add a plot of
the estimate approaching the true proportion as instances accumulate, matching
the first beans example (ex10), so the two readings sit in the same visual
idiom.

---

## Done

- **C1, C2, C3** — ex15, ex16 and ex18 re-anchored onto their result sentences.
- **B1** — Peirce's table printed in the article, with the sets written out.
- **B2** — granary ratio and number drawn drive it live.
- **B3** — "page 713" replaced by a link to the table above.
- **Extra** — a toggle on the table between the sets as listed and the same
  counts as terms of the binomial.
- **D1** — ex18 rewrites Peirce's paragraph from the sliders, with the computed
  certainty in brackets. At his own settings it reproduces his printed figures
  exactly (366, 370, 185, 61, 15, 3 per thousand, and 0.921).
- **D2** — ex20 gained a running-proportion plot, the estimate approaching the
  truth as instances accumulate, with five instances marked.
- **Merge** — the binomial example (was ex14) is now the second view of the
  table's toggle, sharing its sliders, and is no longer a separate box. The
  dead "show individual sequences" checkbox went with it.
- **A1** — ex21, the principle of indifference, on "cases equally possible in
  place of cases equally frequent". A die where the principle is sound, then a
  bag of unknown composition enumerated two defensible ways that disagree,
  with the granary's own frequency to settle it.
- **A2 + A3** — ex22, built as one example with a coins/worlds toggle as agreed.
  101 bags, the nth holding coins that come up heads n in 100; flips narrow
  down which bag, while the coin's bias never moves. Switching to universes
  runs the identical arithmetic on the identical counts and the verdict text
  turns: there is no granary of universes and no draw was made, so the number
  is a frequency of nothing. Anchored on "leads simply to the conclusion that
  reasoning from past to future experience is absolutely worthless", with the
  blackberries sentence quoted inside the worlds verdict.

- **A4** — ex23, insisting on the shuffle. A deck dealt as a chain, with an
  "order in the deck" slider. At zero the continuation rate sits on a half at
  every run length, so twenty reds leave the next card an even chance — not a
  finding but the stipulation. Above zero the same tallies read the order off
  the record, which answers the bracketed question: the contrast case is the
  same deck with the slider moved, so nothing else differs.

- **A5** — ex24, which way round. One inequality, |p̂ − p| ≤ e, conditioned two
  ways side by side. Left: fix the urn, range over samples, and the rate is
  settled by p, s and e alone — simulation converges on it. Right: fix the
  sample, range over urns, and three defensible weightings give three answers
  (0.410, 0.359, 0.522 at five balls, spread 0.164). Raising the sample size
  closes the spread to nothing, which is the point: they agree only once the
  data has taken over from the weighting.

- **A6** — ex25, the conclusion or the proceeding. Left: one form of argument,
  every instance alike, so the rate belongs to the conclusion. Right: five
  inquiries with truths from 0.28 to 0.93 sharing nothing but the manner of
  getting the premises; each comes off about half the time (0.449, 0.506,
  0.513, 0.533, 0.568; pooled 0.514), because a half is what the probable
  error was defined to deliver.

**All items in this list are now built.** Remaining scatter worth a look some
time: the residual wobble around a half in ex25 is binomial discreteness, not
a bug; and the Firefox slider-wheel question from earlier is still unchecked.

## Order of play

Cheapest first, and B1 unblocks B3:

1. C1, C2, C3 — pure re-anchoring, no new code.
2. B1, B2, B3 — the table, then its sliders, then the link.
3. D1, D2 — enhancements to what is already there.
4. A1 — indifference stated before ex13 refutes it.
5. A2, A3, A4 — the selection/shuffle cluster, which hang together.
6. A5, A6 — the §IV hinge and the analytic/synthetic contrast.
