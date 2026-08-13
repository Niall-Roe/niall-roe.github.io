# Kets data

Two sources, in two different states of trust.

## 1. The table Peirce used — VERIFIED

**`naukratis1888-kat.csv`** — the Egyptian Kat Standard table (158 weights) from
W. M. Flinders Petrie, *Naukratis. Part I, 1884–5* (1886), pp. 75–76
(`texts/petrie1888.pdf`, image pages 84–85). Transcribed fresh from the scan on
13 August 2026 and verified row by row: every row passes the arithmetic check
unit = ancient ÷ x except where the print itself is inconsistent, and every cell
that disagreed with the older transcription was re-read at high zoom.

Columns are as printed (`no, material, form, present_grs, ch, ancient_grs, x,
unit_grs_printed`), plus:

- `unit_grs` — the unit value as a plain number (the one printed value corrected:
  row 150's `159.4` is a misprint for `150.4`);
- `unit_to_tenth` — whether Petrie gave the ket to a tenth of a grain. This is
  Peirce's selection criterion. In the print, a unit like `140·` (trailing dot,
  no tenth digit) or `145` (no dot) is to the grain only; `140·0` is to the tenth;
- `correction` — non-empty on the five rows where the print is internally
  inconsistent, with the printed value, the corrected reading, and why:
  - no. 93 — ancient 2890 vs unit 145·0 (2900 intended);
  - no. 96 — x printed 59 (50 intended; 7270/50 = 145.4 as printed);
  - no. 120 — present and ancient printed 285·1 vs unit 147·6 (295·1 intended);
  - no. 149 — x printed 5 (2 intended; 300·0/2 = 150·0 as printed);
  - no. 150 — unit printed 159·4 (150·4 intended);
- `description` — Petrie's remark on that weight from the chapter prose
  (via `descriptions.csv`; the remarks are transcribed but have not had the same
  cell-level verification as the numbers).

`ch` is the change column: the sum of gain and loss in grains, entered only when
it exceeds 2% or 1/50th of the whole; `B` means the weight is broken.

**`kets-peirce.csv`** — the subset Peirce describes in CP 1.209: the weights
whose ket-value Petrie gave to a tenth of a grain. **Note: this yields 142
weights, not the 144 Peirce states.** Also, against the printed table, his claim
that between 136.8 and 151.3 grains no interval wider than a third of a grain is
unrepresented has three exceptions (136.8→137.2, 137.2→137.6, 149.4→149.8, and
150.0→150.4, 150.8→151.3 are 0.4–0.5 apart). His five-standard counts
(36+25+26+23+34) do sum to 144. Whether he counted differently, worked from a
now-lost tally, or simply slipped, is an open question — his own histogram
("red dots", "curves in blue", "a brown curve", MS 427 pp. 17–18, in
`texts/427 - *.pdf`) was omitted by the CP editors and would settle it.
His range statement "from 137 to 152" fits: the 142 run 136.8–152.5.

## 2. The larger collection — VERIFIED (13 Aug 2026)

The qedet sections of Petrie, *Ancient Weights and Measures* (1926), transcribed
fresh from the column scans in `texts/1926 pngs of columns/`:

- **`qedet_1926.csv`** — the stone qedet register, plates XXXIII–XXXVII,
  catalogue nos. 3076–3876: 821 entries (801 numbered + 20 sub-lettered
  A-entries) plus 40 continuation lines ("SEE K/P" alternative readings).
  Columns: `no, row, material, form, grs, x, unit_printed, unit_grs, correction,
  detail`. The register prints only the tenth digit of the unit between anchor
  values; `unit_grs` is the reconstructed full value. The register continues
  past 152 grs to 153.5; the Necef standard (152–169 grs) begins at no. 3877
  and is not included.
- **`qedet_1926_bronze.csv`** — the metal register, plates XLIV–XLV: the bronze
  qedet section (nos. 4978–5095, 188 rows incl. `d` duplicate sub-entries) plus
  the stater section that precedes it on the same plate (4915–4977), labelled
  by `section`. Columns follow the plate: `now / change / original` weights.
- **`qedet_1926_units.csv`** — the minimal view: catalogue number and qedet
  value in grains, one line per entry (821 rows, 135.5–153.5 grs).
- `transcripts-1926/` — the per-column transcript files the above are built
  from, one per plate column, kept so any cell can be traced back to its scan.

**Verification.** Catalogue numbering checks strictly consecutive 3076→3876
across all 13 stone columns; every entry passes unit ≈ grs ÷ x to within a
tenth of a grain; the unit sequence is monotone; all arithmetic failures were
adjudicated by zooming to the printed cell (three were my misreads, fixed; five
are the book's own misprints, kept as printed and flagged in `correction` —
nos. 3141, 3239, 3431, 3838, 3872A); a 16-row spot audit (~40 values re-read
blind across every column) matched the transcripts exactly. Material/form/detail
columns are best-effort readings of Petrie's hand-lettered abbreviations and did
not get per-cell verification; hieroglyphs and cartouches in the detail column
are noted as "cartouche"/"glyph" or approximated. The bronze plates' sparse
unit column made the arithmetic check inapplicable there; those rest on the
numbering check and the spot audit.

- `Rough Petrie Table.xlsx` / `qedet_1926_rough.csv` — the earlier OCR-quality
  transcription (~1,197 rows, including Necef/Khoirine/Beqa sections not covered
  above). Superseded for the qedet sections; too noisy to serve even as a
  cross-check (decimal points and leading digits are systematically lost).
- `texts/Petrie Table.pdf` — the same 1926 plates as a 7-page PDF. (Despite the
  name it is *not* the 1888 table.)

## Older files — superseded for the kats

`superseded/weights.csv` and `superseded/tidied.csv` (all 516 Naukratis weights,
all standards) are an earlier transcription. Their **Egyptian Kat rows contain
~65 rows with errors** (dropped decimal points, digit slips, wrong materials, a
wrong multiplier — e.g. no. 2's present weight 165.8 for 685.8, no. 21 "Bronze"
for "Basalt, br.", no. 96 x=53). Use `naukratis1888-kat.csv` for the kats. The
non-kat standards in `superseded/tidied.csv` have not been verified against the
scan — see `superseded/README.md`.
