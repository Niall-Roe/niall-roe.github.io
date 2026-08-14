# Kets — session handoff

Paste this to start a fresh session. Everything below is current as of commit `9332dfd`
(pushed to `main`). Nothing is uncommitted.

## What this is

An interactive edition of Peirce's Naucratis balance-weights passage (*Minute Logic*, MS 427,
printed as CP 1.208–211), at `Kets/` in the `niall-roe.github.io` repo. Live at
**https://niall-roe.github.io/Kets/** — case-sensitive capital K. Companion facsimile page at
`century-pound/` → **https://niall-roe.github.io/century-pound/**.

Read `CLAUDE.md` at the repo root first — it has the build rules, the notes conventions, and the
**approval rule** (finished work goes to `### Awaiting approval`, never to `### Completed`;
only Niall moves things to Completed).

## How to work on it

- Build: `cd Kets && ./build.sh` (assembles `index.html` from `src/` parts; never hand-edit
  `index.html`). `./build.sh --check` verifies it's current.
- Review server: `python3 _status/serve.py` from the repo root, then
  `http://127.0.0.1:8787/Kets/`. It injects the review overlay and reads `Kets/notes/`.
  **Restart it after adding a new paper slug** to `_status/build.py`.
- Dashboard: `python3 _status/build.py`.
- The in-app browser is blocked from `127.0.0.1` in some sessions — test by JS-evaluating in the
  Browser pane if `preview_start` works, otherwise use curl + the console-message tool.

## Standing instructions from Niall (learned the hard way)

1. **Every unapproved entry's notes are build instructions.** If an entry is not `status: done`,
   there is work in it. Do not reply "waiting on you" for anything buildable — build it, and
   leave a note only for what genuinely needs his input.
2. **"Gradient/gradated"** (he sometimes autocorrected to "graduation") means the *bars
   themselves* shade smoothly across the axis, blending bin to bin as standards trade ownership —
   not flat per-cluster tints. This is global, in `drawMixture` in `src/04_engine.js`.
3. Colour fills must **keep to their own curves**: blend up to the lower curve, then only the
   taller curve's own colour above it. No colour climbing another curve's slope.
4. Explainer text in every example is indented editorial style (global CSS rule on
   `.example-content > p:first-of-type`).
5. No "AI language" — no "it's not x, it's y", no flourish. House style is in CLAUDE.md.
6. He reads carefully and re-reads. If a note repeats, the previous attempt misread it.

## The page now

18 examples, margin numerals 1–18, all opening clean with zero console errors. Notes:
6 done, 13 awaiting approval, 0 building. Entry 04's *historical* half (Peirce's alternative
approach) still genuinely needs his details; its computable half is built as example 5.

Key examples: 1 letterforms (O/0, I/1, u/v) · 2 Petrie + map + his qedet photo · 3 the 158-row
table with grid→histogram · 4 copies of a standard (known-standards ⇄ figuring-out, law buttons,
snap) · 5 the modern calculation (EM + BIC + bootstrap) · 6 Peirce's diagram (data/curves,
blocks, his chart) · 7 the no-gap ruler · 8 the 1926 register + every-standard view · 9 merge ·
10 Century Dictionary · 11 towns · 12 buyers/sellers · 13 the law of error · 14 methods and error
curves · 15 theory of errors · 16 directions and destinations (Haack) · 17 the first attempt,
by hand · 18 figuring out the probable error.

## Verified data (`Kets/data/`, see its README)

- `naukratis1888-kat.csv` — all 158 kets, transcribed fresh from the 1886 scan and verified;
  five printed misprints flagged in a `correction` column.
- `kets-peirce.csv` — the 142 tenth-of-a-grain kets (Peirce says 144; he counted 14 whole-grain
  entries where the table has 16).
- `qedet_1926.csv` / `_bronze` / `_units` — 821 stone qedets from the 1926 register, newly
  transcribed and verified; `superseded/` holds the old error-ridden transcription.

## Findings established this session (don't re-derive)

- **Peirce's smoothing rule**: his own draft heads the column *"The same smoothed by 0.7 each +
  0.3 previous"* — `smoothed(i) = 0.7·count(i) + 0.3·count(i−1)`, exact on all 30 rows in both
  drafts. The Separated column divides each smoothed value between neighbouring standards, worked
  by little share-algebra problems on the rough pages (`11x + 6(1−x) = 6x + 7(1−x)`, x = ⅙).
- **Probable error**: median departure from his five standards is exactly 0.700 grains; his
  first-attempt bisections gave 1.1 and 0.9; the published ⅝ is a shade tight (holds 59 of 142).
  PE = 0.6745σ is the only place the Gaussian assumption enters.
- **Restored to the article**: the omitted paragraph describing his never-drawn diagram, plus his
  two actual pen sketches (rectangle, contrary flexure) from MS 427.
- **BIC on the 142 weights prefers 2 standards, not 5** — five are licensed by outside knowledge
  (the practice of weighing fixing the PE near half a grain), not by parsimony.
- **The 1926 register (821 qedets) does not dissolve his five.** Fitting five to it lands at
  139.1 / 141.9 / 144.6 / 147.1 / 150.4 grains — within a fraction of a grain of Peirce's,
  only the heaviest drifting up — with a looser fitted PE near 0.73. What the extra data cannot
  settle is the *number*: BIC edges four over five by 2–3 units, and seven follows bin noise.
  (An earlier draft's "five standards crowd the middle" claim was wrong and is gone.)
- **Petrie's rival hypothesis, cited**: *Ancient Weights and Measures* (1926), ch. vi §32
  "History", pp. 14–15 — the qedet read historically, Old Kingdom weights in two families near
  144 and 149, merged past tracing by the xviii<sup>th</sup> dynasty, a late fixed 140 at
  Heliopolis. Peirce does not consider it; the Towns example now says so with the citation.
- **The order of his working**: he tallies first, in one sitting (the remarks about numbers
  falling off belong to the tally), and the Smoothed column belongs to the ruled table drawn up
  afterwards, standards read off only at the end. Example 17 walks it in that order.

## Open, needing Niall

- Entry 04: his details of Peirce's alternative historical approach.
- Entry 09: verify the 1884–85 OWM dates and the meter-testimony anecdote.
- Entry 18: MS transcription will settle the concentric-circle constructions, which neighbour owns
  which Separated share, and why 0.7/0.3 leans to the lighter neighbour.
- Three small wording calls flagged in the ninth-pass notes: entry 05's "proving"/"providing the
  counts"; entry 15's default route (his sentence ends 1N, the kept default ends 1E); entry 10's
  added word "soil" in "Naucratis' soil".

## Note on tooling

The Browser pane's `screenshot` returns blank frames in this project (it reports the pane as
hidden), so **verify drawings by probing canvas pixels** via the JS tool — get `cv._pl` for the
data↔pixel mapping and `getImageData` to test what is actually painted. That is how the ex13
column rule was proved: sample the band under one curve inside vs outside the lit column and
compare. Interaction state can be driven the same way, by clicking the real controls in JS.
