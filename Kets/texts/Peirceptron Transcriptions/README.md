# Peirceptron transcriptions — the Kets of Naucratis

Machine transcriptions of MS 427 and MS 426, made 2026-08-13 by THE
PEIRCEPTRON (round 8), a TrOCR model fine-tuned on Peirce's hand.

## Where the pages are

MS 427 is filmed in **two volumes**, and the two drafts sit in different
ones — which is why they can be hard to find:

| Draft | Source | Pages | Pipeline frames |
|---|---|---|---|
| **First Attempt** | `427 – … – 371.pdf` | 5–23 | 00427_0343–0361 |
| **Second Attempt** | `427 – … – 338.pdf` | 15–24 | 00427_0015–0024 |
| Egyptian weights + error memoir | `426 – … – 53.pdf` | 10 | 00426_0010 |

Two anchors were confirmed by eye, image against image: **Second Attempt
p.1 = 338.pdf p.15** (the sheet headed "The Kets of Naucratis", with the
Egypt Exploration Fund footnote) and **First Attempt p.1 = 371.pdf p.6**.
The extent of each run was then traced by reading continuity — where the
argument starts and where the topic changes — so the **endpoints are
inferred, not verified**. 371.pdf p.5 and p.6 are two drafts of the same
opening sentence.

The **Second Attempt is the version that reached print**: EP2 pp. 119–120,
indexed there as "Kets of Naucratis, 119-20". Related material appears in
W8 pp. 349–51 and 466–67. The First Attempt appears to be unprinted.

## Files

- `MS427-First-Attempt.md` / `-pages.pdf` — 19 pages, transcription and images
- `MS427-Second-Attempt.md` / `-pages.pdf` — 10 pages, transcription and images
- `MS426-p10.md` / `.pdf` — the page carrying both threads
- `Related-passages.md` — every other page in the read corpus mentioning the
  kets or Peirce's theory of errors

## What these transcriptions are worth

Unedited machine output. On its exam the model reads Peirce's hand at about
**6–7% character error** — roughly one wrong character in fifteen — and it
scores the same on unpublished material as on published. In practice that
means the prose is mostly right and mostly readable, while proper nouns,
figures and cancelled matter are unreliable. "Naucratis" comes out as
"Manaratis" in MS 426; the Egypt Exploration Fund becomes "Teirstmann of
Egyptian Eplor".

Three specific cautions:

1. **Numbers are the weakest part**, and this passage is full of them. Every
   grain-value, weight-count and probable error should be read from the
   image, never from the transcription.
2. **The calculation slips** (First Attempt, around 371.pdf pp. 7–14) are
   tables and arithmetic, not prose. The model produces digit-soup there.
   They are included for completeness and should be treated as placeholders.
3. **Peirce's cancellations and interlinear insertions are not represented.**
   The line cutter finds one line at a time; deleted matter and squeezed-in
   revisions may be merged, dropped, or run together. The published editions
   do this work editorially; this pipeline does not, yet.

## Provenance and rights

Images are from the Houghton Library microfilm of the Peirce papers, via the
Robin catalogue numbering. **Redistribution rights for the microfilm
digitisations are unclear** — that is recorded as an open question in the
project's own notes, and the scans are deliberately kept out of its public
repository. The page PDFs here are included because they were asked for; if
this directory is published on a public site, the images are the part worth
checking before it goes up. The transcriptions are machine output over
Peirce's own words (d. 1914).
