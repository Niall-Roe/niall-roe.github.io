#!/usr/bin/env python3
"""Put the example triggers and containers into the generated article.

    python3 tools/examples.py

src/02_article.html is written by render.py from the scraped text, so a trigger
typed into it by hand is gone at the next build. This runs after render.py and
puts them back from the one place that already knows where each example belongs:
the notes entries in ../notes/, whose `anchor:` is the passage the example hangs
on and whose `container:` is the id the page addresses it by.

An entry is wired only when it has BOTH. That is the convention in
_status/CONVENTIONS.md — an entry that is merely planned has no container — so
specs sitting in the notes cost nothing here and appear the moment one is built.

Matching folds the things a quote and its printed form disagree about: curly
quotes, dashes, non-breaking spaces, and the line-break hyphenation the scan
leaves behind ("observa- tions"). The fold is applied to both sides and a map is
kept back to the original offsets, so the markup is inserted around the real
characters rather than around the normalised ones.

Run directly to see what it would wire, without writing:  --dry-run
"""

import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
ARTICLE = HERE / "src" / "02_article.html"
NOTES = HERE / "notes"

FOLD = {"‘": "'", "’": "'", "“": '"', "”": '"',
        "–": "-", "—": "-", "‑": "-", " ": " "}


def entries():
    """(container, anchor, position) for every entry that is ready to be wired."""
    out = []
    for f in sorted(NOTES.glob("*.md")):
        text = f.read_text(errors="replace")
        m = re.match(r"\A---\n(.*?)\n---\n", text, re.S)
        if not m:
            continue
        meta = {}
        for line in m.group(1).split("\n"):
            if ":" in line:
                k, _, v = line.partition(":")
                meta[k.strip()] = v.strip().strip('"')
        if meta.get("container") and meta.get("anchor"):
            out.append((meta["container"], meta["anchor"], f.name))
    return out


def fold(s):
    """Normalised text plus a map from each folded character back to its index
    in the original."""
    out, idx, i = [], [], 0
    while i < len(s):
        c = FOLD.get(s[i], s[i])
        # "observa- tions" -> "observations", so a quote of the plain word matches
        if c == "-" and i + 1 < len(s) and s[i + 1] == " " \
                and i and s[i - 1].isalpha() and i + 2 < len(s) and s[i + 2].isalpha():
            i += 2
            continue
        if c.isspace():
            if out and out[-1] == " ":
                i += 1
                continue
            c = " "
        out.append(c)
        idx.append(i)
        i += 1
    return "".join(out), idx


BLOCK = re.compile(r"</?(?:p|div|table|tr|td|th|h[1-6]|ul|ol|li|blockquote)\b", re.I)


def project(doc):
    """The document's visible text, folded, with each character mapped back to
    the span of source it came from. Tags are skipped and entities collapse to
    the one character they stand for, so a quote carrying a footnote marker or
    an <em> still matches — those sit between characters, not in them."""
    chars = []                                   # (folded_char, start, end)
    i, n = 0, len(doc)
    while i < n:
        if doc[i] == "<":
            j = doc.find(">", i)
            i = (j + 1) if j != -1 else n
            continue
        if doc[i] == "&":
            j = doc.find(";", i)
            if j != -1 and j - i <= 10:
                chars.append((html.unescape(doc[i:j + 1]), i, j + 1))
                i = j + 1
                continue
        chars.append((doc[i], i, i + 1))
        i += 1

    out, idx = [], []
    k = 0
    while k < len(chars):
        c, s, e = chars[k]
        c = FOLD.get(c, c)
        # "observa- tions" -> "observations", so a quote of the plain word matches
        if (c == "-" and k + 2 < len(chars) and chars[k + 1][0].isspace()
                and out and out[-1].isalpha() and chars[k + 2][0].isalpha()):
            k += 2
            continue
        if c.isspace():
            if out and out[-1] == " ":
                k += 1
                continue
            c = " "
        out.append(c)
        idx.append((s, e))
        k += 1
    return "".join(out), idx


def find(doc, anchor):
    """Where `anchor` sits in `doc`, as (start, end) offsets into the source.
    The match may span inline markup, but never a block boundary — wrapping a
    trigger across </p> would produce markup the browser silently repairs into
    something else."""
    folded, idx = project(doc)
    want = re.sub(r"\s+", " ", "".join(FOLD.get(c, c) for c in html.unescape(anchor))).strip()
    for length in (len(want), 300, 200, 160, 120, 90, 60, 40):
        frag = want[:length].rstrip(" .…")
        if len(frag) < 25:
            break
        at = folded.find(frag)
        if at < 0:
            continue
        start, end = idx[at][0], idx[at + len(frag) - 1][1]
        if BLOCK.search(doc[start:end]):
            continue                             # would cross a paragraph; try shorter
        return start, end
    return None


def para_end(doc, at):
    """The end of the paragraph containing `at`, where the container goes."""
    close = doc.find("</p>", at)
    return close + 4 if close != -1 else None


def main():
    doc = ARTICLE.read_text()
    if "example-trigger" in doc:
        print("examples.py: article already wired — run render.py first", file=sys.stderr)
        return 1

    wired, missed = [], []
    # Insert from the bottom up so earlier offsets stay valid.
    plan = []
    for cid, anchor, src in entries():
        hit = find(doc, anchor)
        if not hit:
            missed.append((cid, src))
            continue
        end = para_end(doc, hit[1])
        if end is None:
            missed.append((cid, src))
            continue
        plan.append((hit[0], hit[1], end, cid, src))

    for start, end, pend, cid, src in sorted(plan, key=lambda r: -r[0]):
        container = f'\n\n  <div id="{cid}" class="example-container"></div>\n'
        doc = (doc[:pend] + container + doc[pend:])
        doc = (doc[:start]
               + f'<span class="example-trigger" data-toggle="{cid}">'
               + doc[start:end] + "</span>"
               + doc[end:])
        wired.append((cid, src))

    if "--dry-run" in sys.argv:
        for cid, src in sorted(wired):
            print(f"  would wire {cid:22} {src}")
    else:
        ARTICLE.write_text(doc)
        print(f"examples.py: wired {len(wired)} example(s) into the article")
    for cid, src in missed:
        print(f"  ! anchor not found for {cid} ({src})", file=sys.stderr)
    return 1 if missed else 0


if __name__ == "__main__":
    sys.exit(main())
