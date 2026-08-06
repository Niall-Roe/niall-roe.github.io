#!/usr/bin/env python3
"""Give every notes entry the same section headings, so the review overlay's write
path has one place to append rather than six.

Only headings change. The prose underneath is moved, never rewritten — verified by
comparing the multiset of non-heading lines before and after, and by checking that
no entry's derived status shifts.

    Text: "…"                 ->  ### Text  +  the quotation
    Suggestion. …             ->  ### Suggestions  +  the paragraph
    ### Recently completed    ->  ### Completed
    --- BUILT: EXAMPLE n ---  ->  ### Completed  +  #### built as example n
    REVISION n (your notes)   ->  #### Revision n (your notes)

`Open questions for you:` is left exactly where it is. It reads as an open item, but
moving it out of the built record into Suggestions would change what the entry says,
and that is your call rather than a migration's.

Usage:  python3 _status/normalize_notes.py [--write]
"""

import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

ROOT = build.ROOT

HEADING = re.compile(r"^(#{2,4} .*|-{2,} *BUILT.*|REVISION \d+.*|Suggestion\.|Text:)")


def normalize(body):
    out = []
    for line in body.split("\n"):
        s = line.rstrip()

        m = re.match(r"^Text: (.*)$", s)
        if m:
            out.append("### Text")
            if m.group(1).strip():
                out.append(m.group(1).strip())
            continue

        m = re.match(r"^Suggestion\.\s*(.*)$", s)
        if m:
            out.append("### Suggestions")
            if m.group(1).strip():
                out.append(m.group(1).strip())
            continue

        if re.match(r"^###\s*Recently completed\s*$", s, re.I):
            out.append("### Completed")
            continue

        m = re.match(r"^-{2,} *BUILT:? *(?:EXAMPLE *(\d+))? *-*\s*$", s, re.I)
        if m:
            out.append("### Completed")
            out.append("#### built as example %s" % m.group(1) if m.group(1)
                       else "#### built")
            continue

        m = re.match(r"^REVISION (\d+)(.*)$", s)
        if m:
            out.append("#### Revision %s%s" % (m.group(1), m.group(2)))
            continue

        out.append(s)

    # A heading directly followed by its own text reads better with a blank line,
    # and the renderer treats a blank line as a paragraph break.
    tidy = []
    for i, line in enumerate(out):
        tidy.append(line)
        if line.startswith("###") and i + 1 < len(out) and out[i + 1].strip():
            tidy.append("")
    return "\n".join(tidy)


def body_lines(text):
    """Non-heading, non-blank content — what must survive the rename untouched."""
    return Counter(l.strip() for l in text.split("\n")
                   if l.strip() and not HEADING.match(l.strip()))


def main():
    write = "--write" in sys.argv
    total = changed = 0
    problems = []

    # Every project's statuses first: renaming a heading must not change what any
    # entry is derived to be, and that can only be checked against a full before-set.
    before_status = {}
    for p in build.PROJECTS:
        loaded, _ = build.load_notes(p)
        if loaded:
            for ex in build.all_examples(loaded[1]):
                before_status[ex.get("file")] = ex["status"]

    for p in build.PROJECTS:
        d = ROOT / p["slug"] / "notes"
        if not d.is_dir():
            continue

        for f in sorted(d.glob("*.md")):
            meta, body = build.read_front(f.read_text(errors="replace"))
            if meta.get("preamble") or meta.get("group_heading"):
                continue
            total += 1
            new = normalize(body)
            if new.strip() == body.strip():
                continue
            changed += 1

            lost = body_lines(body) - body_lines(new)
            if lost:
                problems.append((f.name, "would lose: " + "; ".join(
                    list(lost)[:2])[:90]))
                continue

            if write:
                text = f.read_text(errors="replace")
                front = text[:text.index("---", 3) + 4]
                f.write_text(front + "\n" + new.strip() + "\n")

    print(f"{changed} of {total} entries need renaming.")
    if problems:
        print(f"\n!! {len(problems)} entries would lose content — skipped:")
        for name, why in problems[:8]:
            print(f"   {name}: {why}")

    if write:
        after = {}
        for p in build.PROJECTS:
            loaded, _ = build.load_notes(p)
            if not loaded:
                continue
            for ex in build.all_examples(loaded[1]):
                after[ex.get("file")] = ex["status"]
        shifted = {k: (before_status.get(k), v) for k, v in after.items()
                   if k in before_status and before_status[k] != v}
        print(f"\nStatuses after: {Counter(after.values())}")
        if shifted:
            print(f"!! {len(shifted)} statuses shifted:")
            for k, (a, b) in list(shifted.items())[:8]:
                print(f"   {Path(k).name}: {a} -> {b}")
        else:
            print("No status shifted.")
    else:
        print("\nDry run. Re-run with --write to apply.")


if __name__ == "__main__":
    main()
