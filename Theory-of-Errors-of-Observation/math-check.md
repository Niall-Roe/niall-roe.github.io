# Math check: index.html vs. Text/On the Theory of Errors of Observation.pdf

Method: the PDF's formulas do not OCR (the text layer returns garbage for them), so every
formula was compared by rendering the PDF pages as images and reading them by eye against
the HTML source. Page mapping: printed p.N = PDF page N−113 (p.119 = PDF page 6, etc.).

Scope: the whole article, printed pp. 114–137 = HTML lines 74–800.
Counted 47 `<div class="formula">` blocks plus ~18 inline expressions. All were checked.

**Headline: the transcription is faithful.** No formula was found where the HTML says
something different from the book. Everything below is either (B) an error that is already
in the printed book and was copied correctly, or (C) a typographic/markup choice worth your
eye, or (D) something omitted.

---

## A. Formula-by-formula verdict

`OK` = HTML agrees with the printed page, symbol for symbol.
`OK*` = agrees, but see the numbered note in section B or C.

### Inline math, pp. 115–118 (HTML lines 79–125)

| # | HTML line | Expression | Page | Verdict |
|---|-----------|-----------|------|---------|
| i1 | 80 | m<sup>,</sup> ; m<sup>,</sup> b | 115 | OK* (C1) |
| i2 | 82 | V<sup>m</sup> ; V<sup>m,</sup> V<sup>w</sup> ; K V [V<sup>m,</sup> V<sup>w</sup>] | 115 | OK* (C1) |
| i3 | 82 | m +<sub>,</sub> w | 115 | OK |
| i4 | 84 | x +<sub>,</sub> 0 = x | 115 | OK |
| i5 | 86 | x<sup>,</sup> 1 = x | 115 | OK* (C1) |
| i6 | 88 | 0<sup>x</sup> = 0 ; 0<sup>0</sup> = 1 ; 1x = 1 ; 10 = 0 | 115 | OK* (B1) |
| i7 | 90 | [m] / m | 115 | OK |
| i8 | 90 | [t1] ; [t1] / [1] | 115 | OK |
| i9 | 96 | [m<sup>,</sup>] | 116 | OK* (C1) |
| i10 | 115 | [m<sup>,</sup>1] / [1] | 117 | OK* (C1) |
| i11 | 115 | [m<sup>,</sup>a] / [a] | 117 | OK* (C1) |
| i12 | 118 | [t<sup>,</sup>r] / [t] | 118 | OK* (C1) |
| i13 | 120 | [x<sup>,</sup>n] / [x] | 118 | OK* (C1) |
| i14 | 120 | [n<sub>x</sub>] dn | 118 | OK |
| i15 | 122 | [m<sub>x</sub><sup>,</sup>n<sub>y</sub>] dm.dn / [m<sub>x</sub>] dm | 118 | OK* (C1) |
| i16 | 122 | [m<sub>x</sub><sup>,</sup>n<sub>y</sub>] / [m<sub>x</sub>] dn | 118 | OK* (C1) |
| i17 | 125 | [A<sup>,</sup>B] / [A] | 118 | OK* (C1) |
| i18 | 128 | [A<sup>,</sup>B] / [B] | 119 | OK* (C1) |

### Display formulas

| # | HTML line | What it is | Page | Verdict |
|---|-----------|-----------|------|---------|
| 1 | 130 | [A,B]/[B] = [A,B]/[A] × [A] ÷ [B] | 119 | OK* (C1) |
| 2 | 141 | [ξ<sub>Ξ</sub>, x<sub>x</sub>] / [x<sub>x</sub>] dξ | 119 | OK* (C1) |
| 3 | 147 | same = φ(ε, x) | 119 | OK* (C1) |
| 4 | 168 | [x<sub>x</sub>, ξ<sub>Ξ</sub>] / [ξ<sub>Ξ</sub>] dx | 120 | OK* (C1) |
| 5 | 180 | ψ(ε, ξ) = φ(ε,x)/Φξ · Ψx | 120 | OK |
| 6 | 186 | two-column list φ<sub>1</sub>(ε<sub>1</sub>,x) / Φ<sub>1</sub>ξ<sub>1</sub> … &c. | 120 | OK (2-col table, as printed) |
| 7 | 197 | Ψx . φ<sub>1</sub>/Φ<sub>1</sub>ξ<sub>1</sub> . φ<sub>2</sub>/Φ<sub>2</sub>ξ<sub>2</sub> . φ<sub>3</sub>/Φ<sub>3</sub>ξ<sub>3</sub> .&c. | 120 | OK |
| 8 | 206 | Ψ<sup>x</sup> · <sup>n</sup>Π<sub>i=1</sub> φ<sub>i</sub>/Φ<sub>i</sub>ξ<sub>i</sub> | 120 | OK* (C2) |
| 9 | 217 | ∫ φ<sub>1</sub>(ε<sub>1</sub>,x) . φ<sub>2</sub>([ε]−ε<sub>1</sub>,x) . dε<sub>1</sub> | 121 | OK |
| 10 | 223 | the four-term Taylor expansion (φ<sub>2</sub>, φ′<sub>2</sub>, ½φ″<sub>2</sub>, ⅙φ‴<sub>2</sub>) | 121 | OK |
| 11 | 233 | <sup>n−1</sup>Π<sub>1</sub><sup>i</sup> (1 − ∫… D<sub>i</sub> + ½∫… D²ε<sub>i</sub> − &c.) φ<sub>n</sub>([ε],x) | 121 | OK* (C2, C3) |
| 12 | 241 | ∫ ε<sub>i</sub> φ<sub>i</sub>(ε<sub>i</sub>, x) | 121 | OK |
| 13 | 248 | ½ ∫ ε<sub>i</sub>² φ<sub>i</sub>(ε<sub>i</sub>, x) | 122 | OK |
| 14 | 254 | [ε], [ε²], [ε³], &c. | 122 | OK |
| 15 | 260 | [ε]/M, [ε²]/M², [ε³]/M³, &c. | 122 | OK |
| 16 | 275 | φ(ε,x) = h/√∂ · G<sup>−h²(ε−E)²</sup> | 123 | OK* (C4) |
| — | 288 | h/√∂ G<sup>−h²x²</sup> (inline) | 124 | OK* (C4) |
| — | 290 | y = 1/√∂ G<sup>−x²</sup> ; D<sub>x</sub>fx = 1/a ; y = 1/√∂ G<sup>−(fx)²</sup> ; 1/(D<sub>x</sub>fx)² | 124 | OK* (C4) |
| — | 297–310 | Bradley error table (95/94, 89/88, … 5/8) | 125 | OK* (C5) — all 22 numbers match |
| — | 379–386 | the "Let—" definitions (x<sub>i</sub>, ε<sub>i</sub>, g<sub>i</sub>ε<sub>i</sub>, w<sub>i</sub>, E, x) | 127 | OK |
| 17 | 388 | x = Σ<sub>i</sub>(w<sub>i</sub>x<sub>i</sub>) / Σ<sub>i</sub>w<sub>i</sub> | 127 | OK |
| 18 | 397 | w<sub>i</sub> = E² / ε<sub>i</sub>² | 128 | OK |
| — | 401 | "The mean error of w<sub>i</sub> will be w<sub>i</sub>²g<sub>i</sub>²" | 128 | OK* (B2) |
| 19 | 403 | D<sub>x₂</sub> x = w<sub>2</sub> / Σ<sub>i</sub>w<sub>i</sub> | 128 | OK (print really does say x₂) |
| 20 | 407 | D<sub>w<sub>i</sub></sub>x = (x<sub>i</sub>Σw<sub>i</sub> − Σw<sub>i</sub>x)/(Σw<sub>i</sub>)² = (x<sub>i</sub>−x)/Σw<sub>i</sub> | 128 | OK |
| 21 | 414 | ε² = Σ(x<sub>i</sub>−x)²/(Σw)²·w<sub>i</sub>²g<sub>i</sub>² + Σw<sub>i</sub>²/(Σw)²·ε<sub>i</sub>² = […w<sub>i</sub>g<sub>i</sub>²…]/(Σw)² | 128 | OK* (B3, C6) |
| 22 | 422 | ε′ = E / √(Σ<sub>i</sub>w<sub>i</sub>) | 128 | OK |
| 23 | 426 | ε″ = √[ Σw<sub>i</sub>(x<sub>i</sub>−x)² / ((m−1)Σw<sub>i</sub>) ] | 128 | OK |
| 24 | 432 | ε² = ε′² + Σ(x<sub>i</sub>−x)²w<sub>i</sub>²g<sub>i</sub>² / (Σw<sub>i</sub>)² | 128 | OK (w<sub>i</sub>² here, as printed) |
| 25 | 439 | (x<sub>1</sub>−x) = x<sub>i</sub> − (w<sub>1</sub>x<sub>1</sub>+w<sub>2</sub>x<sub>2</sub>)/(w<sub>1</sub>+w<sub>2</sub>) = w<sub>2</sub>/(w<sub>1</sub>+w<sub>2</sub>) x<sub>1</sub> − x<sub>2</sub> | 129 | OK* (B4) |
| 26 | 444 | x<sub>2</sub> − x = −w<sub>1</sub>/(w<sub>1</sub>+w<sub>2</sub>)(x<sub>1</sub>−x<sub>2</sub>) | 129 | OK |
| 27 | 448 | ε² = ε′² + w<sub>1</sub>²w<sub>2</sub>²/(w<sub>1</sub>+w<sub>2</sub>)⁴ (g<sub>1</sub>²+g<sub>2</sub>²)(x<sub>1</sub>−x<sub>2</sub>)² | 129 | OK |
| — | 452 | Put w<sub>2</sub>/w<sub>1</sub> = r | 129 | OK |
| 28 | 454 | ε² = ε′² + r²/(1+r)⁴ (g<sub>1</sub>²+g<sub>2</sub>²)(x<sub>1</sub>−x<sub>2</sub>)² | 129 | OK |
| 29 | 458 | ε″ = √[(w<sub>1</sub>w<sub>2</sub>²+w<sub>1</sub>²w<sub>2</sub>)/(w<sub>1</sub>+w<sub>2</sub>)³ (x<sub>1</sub>−x<sub>2</sub>)²] = √[w<sub>1</sub>w<sub>2</sub>/(w<sub>1</sub>+w<sub>2</sub>)² (x<sub>1</sub>−x<sub>2</sub>)²] | 129 | OK (radical spans the whole thing, as printed) |
| 30 | 463 | ε″² = w<sub>1</sub>w<sub>2</sub>/(w<sub>1</sub>+w<sub>2</sub>)²(x<sub>1</sub>−x<sub>2</sub>)² = r/(1+r)²(x<sub>1</sub>−x<sub>2</sub>)² | 129 | OK |
| 31 | 468 | ε² = ε′² + r/(1+r)²(g<sub>1</sub>²+g<sub>2</sub>²)ε″² | 129 | OK |
| — | 472 | "Now, suppose ε² < ε<sub>1</sub>² < ε<sub>2</sub>²; then r < 1" | 129 | OK (print has ε², not ε′²) |
| 32 | 474 | ε<sub>1</sub>² > ε′² + r/(1+r)²(g<sub>1</sub>²+g<sub>2</sub>²)ε″² | 129 | OK |
| 33 | 480 | ε′ = ε<sub>1</sub>√(w<sub>1</sub>/(w<sub>1</sub>+w<sub>2</sub>)) = ε<sub>1</sub>/√(1+r) = ε<sub>2</sub>√(r/(1+r)) | 129 | OK |
| 34 | 487 | ε′² = ε<sub>1</sub>²·1/(1+r) = ε<sub>2</sub>²·r/(1+r) | 130 | OK |
| 35 | 491 | ε<sub>1</sub>²/ε<sub>2</sub>² = w<sub>2</sub>/w<sub>1</sub> = r | 130 | OK |
| 36 | 495 | ε<sub>1</sub>² = rε<sub>2</sub>² | 130 | OK |
| 37 | 497 | ε<sub>1</sub>² − ε′² = ε<sub>1</sub>²·r/(1+r) | 130 | OK |
| 38 | 501 | ε<sub>1</sub>²·r/(1+r) > r/(1+r²) (g<sub>1</sub>²+g<sub>2</sub>²)ε″² | 130 | OK* (B5) |
| 39 | 505 | ε<sub>1</sub>²/ε″²(1+r) > (g<sub>1</sub>²+g<sub>2</sub>²) | 130 | OK |
| 40 | 509 | ε<sub>2</sub>²r = ε<sub>1</sub>² | 130 | OK |
| 41 | 511 | r·ε<sub>2</sub>²/ε″²(1+r) > (g<sub>1</sub>²+g<sub>2</sub>²) | 130 | OK |
| 42 | 515 | r(ε<sub>1</sub>²+ε<sub>2</sub>²)/ε″² > g<sub>1</sub>²+g<sub>2</sub>² | 130 | OK |
| 43 | 524 | g<sub>i</sub> = 1/√(2m<sub>i</sub>) | 130 | OK |
| 44 | 530 | 2r(ε<sub>1</sub>²+ε<sub>2</sub>²)/ε″² > 1/m<sub>1</sub> + 1/m<sub>2</sub> | 130 | OK |
| 45 | 537 | (ε<sub>1</sub>²+ε<sub>2</sub>²)/(x<sub>1</sub>−x<sub>2</sub>)² > (g<sub>1</sub>²+g<sub>2</sub>²)/(1+r)² | 131 | OK |
| 46 | 543 | (ε<sub>1</sub>²+ε<sub>2</sub>²)/(x<sub>1</sub>−x<sub>2</sub>)²·(1+r)² > (1/m<sub>1</sub>+1/m<sub>2</sub>)/2 | 131 | OK |
| 47 | 550 | [ (x<sub>1</sub>−x)²/ε<sub>1</sub>² + (x<sub>2</sub>−x)²/ε<sub>2</sub>² ] / [ 1/ε<sub>1</sub>² + 1/ε<sub>2</sub>² ] < −4ε<sub>1</sub>² / (1/m<sub>1</sub>+1/m<sub>2</sub>) | 131 | OK* (B6) |

Nothing after HTML line 564 contains math (the rest is the narrative of the experiments).

---

## B. Errors that are IN THE PRINTED BOOK and were copied correctly

Do not "fix" these silently — the HTML is right to reproduce them. But each is a candidate
for an editorial footnote if you want the page to be usable.

**B1 — p.115, HTML line 88: "1x = 1 … when 10 = 0".**
The book sets 0<sup>x</sup> and 0<sup>0</sup> with proper superscripts but sets the parallel
1<sup>x</sup> and 1<sup>0</sup> flat, as "1x" and "10". Almost certainly a typesetting slip in
the book; the sense requires 1<sup>x</sup> = 1 and 1<sup>0</sup> = 0. The HTML copies the book.

**B2 — p.128, HTML line 401: "The mean error of w<sub>i</sub> will be w<sub>i</sub>²g<sub>i</sub>²".**
Printed exactly so. Two things are off in the original itself: (a) this is a *mean square*
error, not a mean error; (b) since w = E²/ε², a fractional error g in ε gives a fractional
error 2g in w, so it should be 4w<sub>i</sub>²g<sub>i</sub>². Peirce drops the 4, and it
propagates to the constant in item 47. Transcription is faithful.

**B3 — p.128, HTML line 414.** Within one equation the book writes
w<sub>i</sub>²g<sub>i</sub>² in the first line and w<sub>i</sub>g<sub>i</sub>² in the collected
fraction on the third line. The w<sub>i</sub>² version is the correct one (and is what he uses
from then on, item 24). Both appear in the print; the HTML reproduces both.

**B4 — p.129, HTML line 439.** The book prints
"(x<sub>1</sub> − x) = x<sub>i</sub> − …" (should be x<sub>1</sub>, not x<sub>i</sub>) and
"= w<sub>2</sub>/(w<sub>1</sub>+w<sub>2</sub>) x<sub>1</sub> − x<sub>2</sub>" with no
parentheses around x<sub>1</sub> − x<sub>2</sub>. Both quirks are in the print; the HTML copies them.

**B5 — p.130, HTML line 501: "r/(1 + r²)".** The book prints 1 + r² where the algebra
(and the very next line) requires (1 + r)². Printed error, faithfully copied.

**B6 — p.131, HTML line 550: "−4ε<sub>1</sub>²".** The minus sign is in the book. It cannot be
right: the left side is a sum of squares and must be positive. Working the same condition
forward from item 44 gives 2ε<sub>1</sub>²(1+r) / (1/m<sub>1</sub> + 1/m<sub>2</sub>), which is
4ε<sub>1</sub>²/(1/m<sub>1</sub>+1/m<sub>2</sub>) when r = 1 — so "−" should be "+", or the 4
is standing in for 2(1+r). Printed error, faithfully copied.

---

## C. Typography / markup choices worth your eye

C1, C2 and C4 have been **fixed** in index.html — see section E for what was done.

**C1 — FIXED. The inverted comma.** It was rendered with `<sup>,</sup>`, i.e. raised to
cap-height like a prime; the book sets it at ordinary comma height, on the baseline, and
mirrored left-to-right (that flip is what "inverted" means here). It affects 21 sites.
Now rendered as an ordinary comma with `transform: scaleX(-1)`, at normal height.

**C2 — FIXED. The two product symbols were written differently**, and neither matched the
book:
- Line 206 was `<sup>n</sup>Π<sub>i=1</sub>`
- Line 233 was `<sup>n−1</sup>Π<sub>1</sub><sup>i</sup>` (i and 1 in the opposite slots)

The book prints both as Π with a subscript i attached, the upper limit above the Π and "1"
below it. Both now render that way.

**C3 — still open (deliberate). Line 233, "φ<sub>n</sub>([ε], x)".** The book prints
"φ n ([ε], x)" with the n on the line and spaced, not subscripted. φ<sub>n</sub> is the
sensible reading and matches the rest of the series, so this is a silent good correction —
just noting it.

**C4 — FIXED. The two special glyphs.** In the book, π appears as a glyph shaped like ∂ (so
the Gaussian reads h/√∂) — the HTML's `∂` is a near-exact match and is unchanged. The base of
natural logarithms was set as `G`, which read as an ordinary letter. At high magnification
the printed glyph is a **small spiral**: a nearly closed ring whose free end curls inward and
stops near the centre. It is now drawn as an inline SVG spiral, so it depends on no font.

**C5 — p.125 table.** All 22 numbers match. The book has one extra header row under
"Between—" containing two double-prime marks (″ ″), i.e. the units are seconds of arc. That
row is not in the HTML table.

**C6 — line 414, squaring.** The book squares the whole fraction,
((x<sub>i</sub>−x)/Σw<sub>i</sub>)², and likewise (w<sub>i</sub>/Σw<sub>i</sub>)²; the HTML
distributes the square as (x<sub>i</sub>−x)²/(Σw<sub>i</sub>)² and
w<sub>i</sub>²/(Σw<sub>i</sub>)². Identical in value, different on the page.

---

## D. Omitted from the HTML

**D1 — "Details of the experiments", printed pp. 138–158** (PDF pages 25 onward): the 24
day-by-day tables of raw observations, "Thousandths of a second / Number of observations",
FIRST DAY JULY 1 1872 through the twenty-fourth day. Not in the HTML at all. Probably
deliberate, since the same data sits in `Koenker's data/MiM/data/Day01.txt` … `Day24.txt` —
but if you want the page to be a complete edition of the paper, that is the gap.

**D2 —** the running heads, page numbers and the footnote rule are of course dropped; the two
footnotes themselves (fn1 on p.115, fn2 on p.123) are present and correct.

---

## E. Changes made to index.html after this check

Only presentation was touched. No formula's content was altered, nothing in section B was
"corrected", and no text was added or removed.

1. **Inverted comma (21 sites).** `<sup>,</sup>` → `<span class="inv-comma">,</span>`;
   `V<sup>m,</sup>` → `V<sup>m</sup><span class="inv-comma">,</span>`; the two
   `+<sub>,</sub>` → the same span, so the whole file is now consistent. CSS:
   `.inv-comma { display: inline-block; transform: scaleX(-1); }` — an ordinary comma at
   ordinary height, flipped left-to-right.

2. **Product signs (2 sites, HTML lines ~206 and ~233).** Now a three-row stack —
   upper limit / Π with subscript i / 1 — via
   `.bigprod { display: inline-flex; flex-direction: column; align-items: center; }`.

3. **The e glyph (4 sites).** An `<svg><symbol id="peirce-swirl">` is defined once just after
   `<body>`; each `.peirce-e` span now contains `<svg class="swirl"><use href="#peirce-swirl"/></svg>`
   instead of the letter G. The path is a parametric spiral traced to match the printed
   glyph (nearly a full outer ring, then an inward hook of about a third of a turn, mirrored,
   slightly narrowed horizontally). It inherits text colour via `stroke="currentColor"` and
   scales with the surrounding font size, so it works in the running text and in the display
   formulas alike. The `data-modern="e"` attribute and the tooltip are preserved.

Verified in the browser at both normal and 3× size: 4 swirls, 21 mirrored commas, 2 stacked
product signs, symbol resolves.

---

## Files used

- `index.html` (804 lines, 47 formula blocks)
- `Text/On the Theory of Errors of Observation.pdf` (47 pages; article = pages 1–24)
