---
preamble: true
---

Regression to the Mean — example notes

Started 17 August 2026. A concept app rather than an edition of a paper, so
"examples" here are whatever parts of the app want specifying or changing;
there is no source text to anchor against in the way the Peirce papers have.

The apparatus is Galton's two-stage quincunx. The page is built around three
things it can be made to show, and any new entry should say which of the three
it belongs to:

1. **The mixture.** Open one compartment at A–A, watch it make its own small
   normal heap, let the rest follow, and see the heaps add up to the curve the
   uninterrupted machine would have made. Galton's answer to how heredity and
   normality can both be true at once.
2. **The two directions.** With the barriers straight down (r = 1) the machine
   already regresses, but only backwards: a compartment's children land
   directly below it, while the parents of a bottom compartment lie toward the
   centre. Stigler's point, and the one that kills the reading of regression as
   a force. Verified numerically at n = 30 000: children +2.05σ (directly
   below), parents +1.29σ, for the compartment at +2.00σ; and with the chutes
   slanted and tied, the two directions agree (+1.37σ / +1.31σ against the
   predicted 1.34).
3. **The mean.** The chutes are set on the mean of whatever is in the
   compartments, so the apparatus governs the shape about the mean and nothing
   else. The environment slider moves the mean and leaves the spread alone; the
   two lines in the lower figure separate.

Sources followed: Stigler, *Statistics on the Table* (1999), ch. 9, pp. 177 ff,
for the reconstruction of Galton's thought experiment and for the two
directions; Galton, *Natural Inheritance* (1889), p. 63, for the figure.
Volume and page numbers for the 1877 and 1885 Galton papers are deliberately
omitted from the citations rather than guessed — worth filling in from the
originals.

A finding from the review pass of 19 August 2026, worth knowing before touching
the physics: the walks are sums of ±step, so without correction every child
lands on a comb of spacing 2·step, and the comb aliases against the unit
compartments — the exact enumeration put the backward conditional at 1.45σ
where the smooth machine says 1.30σ, failing the "two readings agree"
demonstration on the page's own readout. The fix is in stepFam(): the chute
mouth has width, so a uniform jitter of one lattice spacing is added where a
shot enters the lower bank, and the step is set from ROWS_FAM + 1/3 so the
bank's variance is exactly σ_f² with the jitter included. Do not remove the
jitter without re-checking the backward conditionals.

Entries follow _status/CONVENTIONS.md. With the review server running, select a
passage on the page and click "+ Add example" to write one.
