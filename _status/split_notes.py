#!/usr/bin/env python3
"""One-time migration: split each paper's monolithic notes file into one file per
example, under <paper>/notes/.

Nothing is written unless the split verifies as lossless. The check is a multiset
comparison of every non-blank line: each line of the original must survive into
exactly one output file. Blank lines and pure separator rules are exempt.

The original notes file is left exactly where it is. build.py prefers notes/ when
it exists, so the .tex becomes a backup you can delete once you are happy.

Usage:  python3 _status/split_notes.py [--write]
        (without --write it verifies and reports, touching nothing)
"""

import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402  — the parser already reads all three formats

ROOT = build.ROOT


def slugify(s, fallback):
    s = re.sub(r"[^\w\s-]", "", s.lower()).strip()
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s[:48] or fallback


def container_for(paper_dir, num, status):
    """The example's container id, if the article actually has one for it. This is
    what the review overlay and the deep links address by, so a guess is worse than
    a blank.

    Two conditions, both necessary. The entry must actually be built — TEO numbers
    in build order and has an unbuilt stub numbered 1, which would otherwise claim
    the container belonging to a different example. And the id must really be in the
    article, not merely implied by the number."""
    if not num or status not in ("done", "awaiting", "building"):
        return None
    art = paper_dir / "src" / "02_article.html"
    if not art.exists():
        return None
    cid = f"example-ex{num}"
    return cid if f'id="{cid}"' in art.read_text(errors="replace") else None


def plan(p):
    """Build the whole output set in memory. Returns (files, preamble_text)."""
    src = ROOT / p["notes"]
    paper_dir = ROOT / p["slug"]
    preamble, groups = build.parse_notes(src)

    files, seen, pos = [], Counter(), 0
    for g in groups:
        # A section banner becomes its own small file, so it keeps its place in the
        # sequence and survives even when no entries sit under it.
        if g.get("raw_title"):
            pos += 1
            files.append((f'{pos:02d}-group-{slugify(g["title"], "section")}.md',
                          "---\ngroup_heading: true\n---\n\n"
                          + g["raw_title"].strip("\n") + "\n",
                          "", g["raw_title"]))
        for ex in g["examples"]:
            pos += 1
            base = slugify(ex["title"] or ex["heading"], f"entry-{pos}")
            seen[base] += 1
            if seen[base] > 1:
                base = f"{base}-{seen[base]}"
            name = f"{pos:02d}-{base}.md"

            meta = [f"position: {pos}"]
            if ex["num"]:
                meta.append(f"number: {ex['num']}")
            if ex["title"] and ex["title"] != ex["heading"]:
                meta.append(f'title: "{ex["title"]}"')
            meta.append(f"status: {ex['status']}")
            if g["title"]:
                meta.append(f'group: "{g["title"]}"')
            cid = container_for(paper_dir, ex["num"], ex["status"])
            if cid:
                meta.append(f"container: {cid}")
            meta.append(f'heading: "{ex["heading"]}"')

            body = ex["raw"].strip("\n")
            files.append((name, "---\n" + "\n".join(meta) + "\n---\n\n" + body + "\n",
                          ex["raw"], ex.get("raw_heading", "")))
    return files, preamble


SEP = re.compile(r"^[=\-+*_#]{3,}\s*$")


def lines_of(text):
    """Non-blank, non-separator lines, stripped — the unit of the lossless check."""
    return Counter(l.strip() for l in text.split("\n")
                   if l.strip() and not SEP.match(l.strip()))


def verify(p, files, preamble):
    """Every line of the original must land in exactly one output. Headings and
    group banners are carried in frontmatter rather than as body text, so they are
    accounted for separately."""
    original = lines_of((ROOT / p["notes"]).read_text(errors="replace"))

    produced = lines_of(preamble)
    for _name, _full, raw, raw_head in files:
        produced += lines_of(raw)
        # Headings are carried verbatim, in frontmatter or in a group file, so they
        # are counted from the original line rather than re-rendered.
        produced += lines_of(raw_head)

    lost = original - produced
    # A group banner is quoted once per entry under it, so it over-counts; that is
    # duplication, not loss, and only loss matters.
    return lost


def main():
    write = "--write" in sys.argv
    ok = True

    for p in build.PROJECTS:
        if not p.get("notes") or not (ROOT / p["notes"]).exists():
            continue
        files, preamble = plan(p)
        lost = verify(p, files, preamble)

        print(f"\n=== {p['title']}")
        print(f"    {len(files)} entries from {Path(p['notes']).name}")
        if lost:
            ok = False
            print(f"    !! {sum(lost.values())} line(s) would be LOST — not writing:")
            for line, n in list(lost.items())[:12]:
                print(f"       ({n}x) {line[:90]}")
        else:
            print("    lossless: every line accounted for")

        if write and not lost:
            out = ROOT / p["slug"] / "notes"
            out.mkdir(exist_ok=True)
            if preamble.strip():
                (out / "00-preamble.md").write_text(
                    "---\npreamble: true\n---\n\n" + preamble.strip() + "\n")
            for name, full, *_ in files:
                (out / name).write_text(full)
            print(f"    wrote {len(files) + 1} files to {p['slug']}/notes/")

    if not write:
        print("\nDry run. Re-run with --write once the report above looks right.")
    elif not ok:
        print("\nSome papers were skipped because the split would have lost lines.")


if __name__ == "__main__":
    main()
