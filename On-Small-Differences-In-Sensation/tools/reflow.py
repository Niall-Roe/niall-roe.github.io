#!/usr/bin/env python3
"""
Turn the raw OCR dump of the Writings vol. 5 text into structured prose.

The source is a plain-text scrape saved with an .html extension. It carries the
damage typical of a column scrape:

  * every line hard-wrapped at the measure, so paragraphs have to be re-flowed
  * words hyphenated across the break ("sen-" / "sation")
  * running heads and page numbers dropped in wherever the page ended, which is
    usually in the middle of a sentence
  * footnotes sitting at the foot of each printed page, i.e. spliced into the
    body between the line that ends the page and the line that continues it
  * tables flattened column-major into one value per line, which is lossy —
    those regions are marked and left for reconstruction from the scan

Nothing here rewrites words. This pass only decides what each line IS and puts
it back where it belongs; spelling repairs live in corrections.py and the tables
in tables.py, so that each kind of change stays reviewable on its own.

Usage:  python3 tools/reflow.py            # writes build/article.json
        python3 tools/reflow.py --report   # prints a classification summary
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "On Small Differences.html")
OUT_DIR = os.path.join(ROOT, "build")
OUT = os.path.join(OUT_DIR, "article.json")

# ---------------------------------------------------------------------------
# Regions, given as 1-indexed inclusive line ranges into the source.
#
# These are stated by hand rather than sniffed. A footnote that resumes on the
# next page after thirty lines of unrelated body text cannot be found by any
# rule that does not already know the answer, and a wrong guess would silently
# splice a footnote into the middle of a sentence. Eight footnotes and nine
# tables is little enough to just say outright.
# ---------------------------------------------------------------------------

FOOTNOTE_RANGES = {
    1: [(22, 22)],
    2: [(58, 64), (96, 112)],   # split across the foot of pp. 123-124
    3: [(153, 154)],
    4: [(249, 312)],
    5: [(421, 422)],
    6: [(585, 588)],
    7: [(1061, 1097)],
    8: [(1098, 1120)],
}

# Flattened tables. Column-major order is not recoverable from the text, so the
# span is recorded, dropped from the prose, and rebuilt from the scan later.
TABLE_RANGES = [
    (98, 109, "fn2-error-ratio"),
    (175, 241, "confidence-groups-1-2"),
    (251, 285, "fn4-variations"),
    (315, 366, "marks-by-ratio"),
    (470, 570, "daily-peirce"),
    (591, 886, "daily-jastrow"),
    (897, 1045, "group-summaries"),
    (1069, 1097, "fn7-plus-minus"),
    (1105, 1116, "fn8-color-sense"),
]

# Page furniture. The bare page numbers are kept as gutter markers so the
# edition can still be cited by the printed pagination.
RUNNING_HEADS = [
    re.compile(r"^\s*small differences of sen\w*\s*tion,?\s*1884\s*$", re.I),
    # p. 132 lost both the W and the R: "HITINGS OF CHARLES S. PEIRCE". Anchor
    # on the part of the head the scanner got right.
    re.compile(r"^\s*\w*ITINGS OF CHARLES S\. PEIRCE,?\s*1884[-–]1886\s*$", re.I),
]
PAGE_NUMBER = re.compile(r"^\s*(1[0-9]{2})\s*$")

# The four-degree confidence scale, set as a displayed list. Given as a range
# rather than sniffed: OCR ate the verb on the third item ("2 deno d"), so a
# rule keyed to the word "denoted" finds three of the four and silently folds
# the fourth into the surrounding prose.
SCALE_RANGE = (143, 148)
SCALE_ITEM = re.compile(r"^\s*([0-3])\s")

# Displayed expressions, lifted out of the paragraph that introduces them.
FORMULA_LINES = {167}

TITLE_LINE = 1
FIRST_BODY_LINE = 3

# A short line that closes a sentence ends a paragraph. Full-measure lines in
# this scrape run 62-70 characters, so anything under the threshold that also
# lands on terminal punctuation is a paragraph end rather than a wrap.
SHORT_LINE = 56
ENDS_SENTENCE = re.compile(r'[.!?][)"”’]?\d?\s*$')

# Paragraph breaks the length rule cannot see, because the last line of the
# paragraph happens to fill the measure. Given as the source line number that
# ENDS the paragraph. Checked against the scan one by one — the same test
# catches a dozen mid-paragraph sentence ends that must NOT break, so this
# cannot be widened into a rule.
#
#    57  "...but we ought to do so in a predictable ratio of cases." (p. 124
#         opens a new paragraph, but the line before it fills the measure)
#   142  "...upon a scale of four degrees, as follows:" -> the scale list
#   469  "The following tables show the results of the observations for each"
#   583  "...slightly larger than the calculated probable errors."
FORCE_BREAK_AFTER = {57, 142, 469, 583}

# Two lines of p. 131 came out of the scrape in the wrong order: the scrape has
# "day:" ahead of the line it completes. Swap them back.
SWAP_LINES = [(468, 469)]

# Line-end hyphens that are part of the word rather than the wrap. Joining
# these without the hyphen would invent a word the authors did not write.
KEEP_HYPHEN = {
    "india", "post", "one", "two", "three", "four", "half", "self", "non",
    "to-day", "left", "right", "well",
}


def classify(lines):
    """Label every source line. Returns a list of (kind, payload) per line."""
    n = len(lines)
    kind = ["body"] * (n + 1)          # 1-indexed
    payload = [None] * (n + 1)

    for num, spans in FOOTNOTE_RANGES.items():
        for lo, hi in spans:
            for i in range(lo, hi + 1):
                kind[i] = "footnote"
                payload[i] = num

    # Tables win over footnotes: several tables sit inside a footnote, and the
    # table has to come out of the footnote's prose the same way it comes out
    # of the body's.
    for lo, hi, name in TABLE_RANGES:
        for i in range(lo, hi + 1):
            kind[i] = "table"
            payload[i] = name

    for i in range(1, n + 1):
        raw = lines[i - 1]
        if kind[i] == "table":
            continue
        if i == TITLE_LINE:
            kind[i] = "title"
            continue
        if not raw.strip():
            kind[i] = "blank"
            continue
        if any(h.match(raw) for h in RUNNING_HEADS):
            kind[i] = "runhead"
            continue
        m = PAGE_NUMBER.match(raw)
        if m:
            kind[i] = "pagenum"
            payload[i] = m.group(1)
            continue
        if kind[i] == "footnote":
            continue
        if i in FORMULA_LINES:
            kind[i] = "formula"
            continue
        lo, hi = SCALE_RANGE
        if lo <= i <= hi:
            kind[i] = "scale"
            m2 = SCALE_ITEM.match(raw)
            payload[i] = m2.group(1) if m2 else None

    return kind, payload


def table_start_lines():
    """First source line of each table that interrupts the BODY.

    Four of the nine tables sit inside a footnote, at the foot of the page.
    Those do not touch the body's paragraphing — the body flows straight past
    them — so breaking on them would cut a sentence in half at the page turn.
    """
    owner = footnote_owner()
    return {lo for lo, hi, _nm in TABLE_RANGES if owner(lo, hi) is None}


def footnote_owner():
    """-> f(lo, hi) giving the footnote a span sits inside, or None."""
    spans = [(lo, hi, num)
             for num, rs in FOOTNOTE_RANGES.items() for lo, hi in rs]

    def which(lo, hi):
        for f_lo, f_hi, num in spans:
            if f_lo <= lo and hi <= f_hi:
                return num
        return None

    return which


def join_lines(chunk):
    """Re-flow wrapped lines, healing hyphens broken across the break."""
    out = ""
    for line in chunk:
        s = line.strip()
        if not s:
            continue
        if out.endswith("-"):
            stem = re.split(r"[\s\-]", out[:-1].rstrip())[-1].lower()
            if stem in KEEP_HYPHEN:
                out += s                      # genuine compound: keep the hyphen
            else:
                out = out[:-1] + s            # wrap hyphen: drop it and close up
        elif out:
            out += " " + s
        else:
            out = s
    return re.sub(r"\s+", " ", out).strip()


def split_paragraphs(items, force_after):
    """items: list of (lineno, text). Break on short sentence-ending lines."""
    paras, cur = [], []
    for lineno, text in items:
        cur.append((lineno, text))
        short = len(text.rstrip()) < SHORT_LINE
        if (short and ENDS_SENTENCE.search(text)) or lineno in force_after:
            paras.append(cur)
            cur = []
    if cur:
        paras.append(cur)
    return paras


def build(lines, kind, payload):
    n = len(lines)
    body_items, foot_items = [], {}
    scale_items = []
    blocks = []            # ordered stream of what the page contains
    pending_page = None

    i = 1
    while i <= n:
        k = kind[i]
        if k in ("blank", "runhead", "title"):
            i += 1
            continue
        if k == "pagenum":
            pending_page = payload[i]
            i += 1
            continue
        if k == "table":
            name = payload[i]
            j = i
            while j <= n and kind[j] == "table" and payload[j] == name:
                j += 1
            blocks.append({"type": "table", "name": name,
                           "src": [i, j - 1], "page": pending_page})
            pending_page = None
            i = j
            continue
        if k == "formula":
            blocks.append({"type": "formula", "raw": lines[i - 1].strip(),
                           "src": i})
            i += 1
            continue
        if k == "scale":
            # One item per marked line; an unmarked line is the tail of the
            # item above it, wrapped.
            j = i
            while j <= n and kind[j] == "scale":
                if payload[j] is not None:
                    chunk, j2 = [lines[j - 1]], j + 1
                    while j2 <= n and kind[j2] == "scale" and payload[j2] is None:
                        chunk.append(lines[j2 - 1])
                        j2 += 1
                    text = join_lines(chunk)
                    text = re.sub(r"^\s*[0-3]\s+", "", text)
                    scale_items.append({"mark": payload[j], "text": text,
                                        "src": j})
                    j = j2
                else:
                    j += 1
            blocks.append({"type": "scale", "count": len(scale_items)})
            i = j
            continue
        if k == "footnote":
            num = payload[i]
            j = i
            chunk = []
            while j <= n and kind[j] == "footnote" and payload[j] == num:
                chunk.append((j, lines[j - 1]))
                j += 1
            foot_items.setdefault(num, []).extend(chunk)
            i = j
            continue
        # ordinary body line
        body_items.append((i, lines[i - 1]))
        if pending_page:
            blocks.append({"type": "page", "n": pending_page, "at": i})
            pending_page = None
        i += 1

    # A table always closes the paragraph that introduces it, and the line
    # doing the introducing usually fills the measure ("...explained below.",
    # "...following tables:"), so the length rule never sees it.
    force = set(FORCE_BREAK_AFTER)
    body_lines = [ln for ln, _ in body_items]
    for start in table_start_lines():
        before = [ln for ln in body_lines if ln < start]
        if before:
            force.add(max(before))

    # A displayed formula also closes the paragraph that introduces it: the
    # prose resumes underneath with "where m denotes...".
    for fl in FORMULA_LINES:
        before = [ln for ln in body_lines if ln < fl]
        if before:
            force.add(max(before))

    paras = []
    for group in split_paragraphs(body_items, force):
        text = join_lines([t for _, t in group])
        if text:
            paras.append({"text": text, "src": [group[0][0], group[-1][0]]})

    notes = []
    for num in sorted(foot_items):
        group = foot_items[num]
        text = join_lines([t for _, t in group])
        text = re.sub(r"^\s*%d\.\s*" % num, "", text)
        notes.append({"n": num, "text": text,
                      "src": [group[0][0], group[-1][0]]})

    # Merge everything into one ordered stream, keyed on source line, so the
    # renderer can walk the document in printed order instead of guessing how
    # the paragraphs, tables, scale and formula interleave.
    stream = []
    for p in paras:
        stream.append({"type": "para", "text": p["text"], "at": p["src"][0],
                       "src": p["src"]})
    owner = footnote_owner()
    for b in blocks:
        if b["type"] == "table":
            # A table printed inside a footnote belongs to that footnote, not
            # to the body stream it happens to fall between.
            fn = owner(b["src"][0], b["src"][1])
            if fn is not None:
                for note in notes:
                    if note["n"] == fn:
                        note.setdefault("tables", []).append(b["name"])
                continue
            stream.append({"type": "table", "name": b["name"], "at": b["src"][0],
                           "src": b["src"]})
        elif b["type"] == "formula":
            stream.append({"type": "formula", "raw": b["raw"], "at": b["src"]})
        elif b["type"] == "scale":
            stream.append({"type": "scale", "at": SCALE_RANGE[0]})
        elif b["type"] == "page":
            stream.append({"type": "page", "n": b["n"], "at": b["at"]})
    stream.sort(key=lambda b: b["at"])

    return {
        "title": lines[TITLE_LINE - 1].strip(),
        "blocks": stream,
        "paragraphs": paras,
        "scale": scale_items,
        "footnotes": notes,
        "tables": [{"name": nm, "src": [lo, hi]} for lo, hi, nm in TABLE_RANGES],
    }


def main():
    with open(SRC, encoding="utf-8", errors="replace") as fh:
        lines = fh.read().split("\n")
    while lines and not lines[-1].strip():
        lines.pop()

    for a, b in SWAP_LINES:
        lines[a - 1], lines[b - 1] = lines[b - 1], lines[a - 1]

    kind, payload = classify(lines)
    doc = build(lines, kind, payload)

    if "--report" in sys.argv:
        from collections import Counter
        c = Counter(kind[1:])
        print("source lines : %d" % len(lines))
        for k, v in sorted(c.items(), key=lambda kv: -kv[1]):
            print("  %-9s %4d" % (k, v))
        print("paragraphs   : %d" % len(doc["paragraphs"]))
        print("scale items  : %d" % len(doc["scale"]))
        print("footnotes    : %d" % len(doc["footnotes"]))
        print("tables       : %d" % len(doc["tables"]))
        print("page marks   : %d" % len(doc["pages"]))
        print()
        print("shortest paragraphs (possible false breaks):")
        for p in sorted(doc["paragraphs"], key=lambda p: len(p["text"]))[:6]:
            print("  L%-5s %3d ch  %s" % (p["src"][0], len(p["text"]),
                                          p["text"][:60]))
        print()
        print("paragraphs not ending in terminal punctuation (possible merges):")
        bad = [p for p in doc["paragraphs"] if not ENDS_SENTENCE.search(p["text"])]
        for p in bad[:8]:
            print("  L%-5s %s" % (p["src"][0], p["text"][-58:]))
        if not bad:
            print("  (none)")
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=1, ensure_ascii=False)
    print("wrote %s (%d paragraphs, %d footnotes, %d tables)"
          % (os.path.relpath(OUT, ROOT), len(doc["paragraphs"]),
             len(doc["footnotes"]), len(doc["tables"])))


if __name__ == "__main__":
    main()
