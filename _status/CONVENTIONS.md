# Example notes — the convention

Every paper edition on this site has one notes file listing its examples. This is the
shape they should all take. It is the Probability of Induction file's shape, with a
status line added and the built-record split in two so that work waiting on your
approval is visibly separate from work you have signed off.

## Where the file lives

One per paper, beside the page it describes:

    <paper>/<Paper Name> - Examples.tex

## The entry

Each example is one `##` heading, and nothing else in the file uses `##`.

```
## 12 — The urn with a finite number of balls
Status: awaiting approval

### Text
"As we cannot have an urn with an infinite number of balls to represent the
inexhaustibleness of Nature, let us suppose one with a finite number..."

### Suggestions
What is still to do, in your words. Items I raise while building are marked
[from the build] so they are distinguishable from yours.

### Awaiting approval
#### the table drives off the sliders
What I built this pass and what it does. Stays here until you say it is right.

### Completed
#### re-anchored onto the result sentence
What is built and signed off. Newest first.
```

- **Heading.** Number, an em dash, a short title. The number is the margin numeral on
  the page, so it must match the container id (`example-ex12`).
- **Status.** One of the six below. If the line is absent it is derived from which
  sections have content, but write it — derivation guesses.
- **Text.** The anchor passage, quoted, exactly as it appears in the article. This is
  what the trigger attaches to.
- **Suggestions.** Open items only. When one is done it moves down, it does not get
  ticked in place. "None open." when there are none.
- **Awaiting approval.** Built but unapproved. See below.
- **Completed.** Approved work, each pass under its own `####` sub-heading, so the
  history of an example reads top to bottom.

Nothing is ever deleted from an entry — items move between the three sections.

## Status vocabulary

| Status | Means |
|---|---|
| `blank` | Heading exists, no spec written yet |
| `early` | Spec written, nothing built |
| `building` | Partly built, open suggestions remain |
| `awaiting approval` | Built this pass, waiting on your sign-off |
| `done` | Built and approved, nothing open |
| `parked` | Deliberately not being worked on; say why |

## The approval rule

**When I finish implementing suggestions I do not mark them completed.** I move them
to `### Awaiting approval`, set `Status: awaiting approval`, and say so in my reply.
They move to `### Completed` only after you have looked at the page and said it is
right.

This is so the file never claims your sign-off on your behalf, and so the dashboard
can show you at a glance what is sitting waiting for you rather than what is finished.

If you reject something, it goes back up to `### Suggestions` with a note on what was
wrong — not deleted, because the next attempt should know what the last one got wrong.

## Your own marks

Square brackets in the body are yours: `[great]`, `[not this — see below]`, or a
slider you want the reader to set. They are rendered highlighted in the dashboard's
reading view so your replies stand out from the surrounding spec.

## Numbering

Reading order, not build order, for any paper whose text is already whole — the
margin numerals then run down the page in sequence. Theory of Errors of Observation
numbers in build order and has gaps; that is a legacy choice and it can be renumbered
in one line per example if you want it changed.

## What the three files do today

| File | Entry heading | Spec | Built record | Approval |
|---|---|---|---|---|
| Probability of Induction | `## N` | `### Suggestions` | `### Recently completed` | none |
| A Theory of Probable Inference | `## N` | `Suggestion.` | `--- BUILT: EXAMPLE N ---` | `[great]` inline |
| Errors of Observation | `## <slug>` | freeform prose | `--- BUILT ---` + `REVISION N` | none |

So: no, there is no single convention today. The three files agree on using `##` per
entry and on quoting the anchor passage, and diverge on everything else — the spec
heading, the built marker, whether entries are numbered at all, and whether your
approval is recorded anywhere.

The dashboard reads all three formats, so nothing has to change for it to work. New
entries should be written to the convention above, and existing files can be migrated
when convenient.
