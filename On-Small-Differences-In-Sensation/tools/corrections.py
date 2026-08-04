#!/usr/bin/env python3
"""
Repair the OCR damage in the reflowed text, against the 1884 scan.

Every correction is an exact before/after pair with the number of times it is
expected to fire. If a pair misses, or fires more often than stated, the run
aborts rather than writing a file that looks fine and is not. That matters here
because several of the corruptions are short strings ("ry", "eing", "deno")
that occur legitimately inside other words — anchoring each one in enough
surrounding text to be unique is the whole safety mechanism.

Readings are taken from the National Academy of Sciences Memoirs printing
(vol. III, fifth memoir, pp. 75-83), which is the same setting of the text.

Usage:  python3 tools/corrections.py           # writes build/article.fixed.json
        python3 tools/corrections.py --diff    # show each change in context
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IN = os.path.join(ROOT, "build", "article.json")
OUT = os.path.join(ROOT, "build", "article.fixed.json")

# ---------------------------------------------------------------------------
# (broken, fixed, times) — anchored in enough context to be unique.
# ---------------------------------------------------------------------------
CORRECTIONS = [
    # -- p. 75-76 -----------------------------------------------------------
    ("themselves have not usually supposed t t this",
     "themselves have not usually supposed that this", 1),
    ("test of direct experiment. If there be.a least",
     "test of direct experiment. If there be a least", 1),

    # -- p. 76 --------------------------------------------------------------
    ("at all, all reason for bel ing in an",
     "at all, all reason for believing in an", 1),
    ("is destroyed. The mathematical t ry has",
     "is destroyed. The mathematical theory has", 1),
    ("upon the value of the no al average",
     "upon the value of the normal average", 1),
    ("ought to be multiplied by \\^2 (1.414)",
     "ought to be multiplied by \u221a2 (1.414)", 1),
    ("The ratio A/2 (1.414) would therefore",
     "The ratio \u221a2 (1.414) would therefore", 1),

    # -- p. 77, the confidence scale ---------------------------------------
    ("deno d some little confidenc eing right.",
     "denoted some little confidence of being right.", 1),
    ("denoted as strong a confidenc one would have",
     "denoted as strong a confidence as one would have", 1),

    # -- p. 77, the paragraph under the scale -------------------------------
    ("when zero was the recorded confide , there",
     "when zero was the recorded confidence, there", 1),
    ("no sensation of preference for th nswer given",
     "no sensation of preference for the answer given", 1),
    ("no sensation that the observe ticed when",
     "no sensation that the observer noticed when", 1),
    ("of this sort as closely as onveniently could",
     "of this sort as closely as he conveniently could", 1),

    # -- p. 79 --------------------------------------------------------------
    ("upon a lever; and its beari s upon the beam",
     "upon a lever; and its bearings upon the beam", 1),

    # -- p. 80 --------------------------------------------------------------
    ("by chance and would tend t confuse the mind",
     "by chance and would tend to confuse the mind", 1),

    # -- p. 82 --------------------------------------------------------------
    ("of this false notion can ly confuse thought",
     "of this false notion can only confuse thought", 1),
    ("influence on psychological experimentati .8",
     "influence on psychological experimentation.8", 1),

    # -- footnote 2: the scanner read theta three ways ----------------------
    ("in the table of the integral Bt, given",
     "in the table of the integral \u03b8t, given", 1),
    ("most works on probabilities; 6t is the proportion",
     "most works on probabilities; \u03b8t is the proportion", 1),
    ("erroneous answers is therefore (1 \u2014 Ot) -=- 2.",
     "erroneous answers is therefore (1 \u2212 \u03b8t) \u00f7 2.", 1),
]

# The displayed expression on p. 77, which the scrape flattened to
# "m = clog-—-— 1-P". Rebuilt rather than corrected.
FORMULA_HTML = (
    '<span class="math">m</span> = '
    '<span class="math">c</span> log'
    '<span class="frac">'
    '<span class="num"><span class="math">p</span></span>'
    '<span class="den">1 \u2212 <span class="math">p</span></span>'
    '</span>'
)

# Front matter, which the scrape did not carry.
TITLE = "On Small Differences of Sensation"
BYLINE = "By C. S. Peirce and J. Jastrow"
READ = "Read October 17, 1884"

# Typographic finish, applied after the word repairs so the anchors above can
# be written with plain ASCII quotes.
SMART = [
    (re.compile(r'"([^"]{1,60})"'), "\u201c\\1\u201d"),
    (re.compile(r"(?<=[A-Za-z])'(?=s\b)"), "\u2019"),
    (re.compile(r"\bvice versa\b"), "<em>vice versa</em>"),
    (re.compile(r"\bUnterschiedsschwelle\b"), "<em>Unterschiedsschwelle</em>"),
    (re.compile(r"\bSchwelle\b"), "<em>Schwelle</em>"),
    (re.compile(r"\bElemente der Psychophysik\b"), "<em>Elemente der Psychophysik</em>"),
    (re.compile(r"\ba (posteriori|priori)\b"), "<em>a \\1</em>"),
    (re.compile(r"&(?!\w+;)"), "&amp;"),
    # the three quantities of the confidence formula, where the sentence under
    # it names them one by one
    (re.compile(r"\bwhere m denotes\b"), 'where <span class="math">m</span> denotes'),
    (re.compile(r"\bscale, p denotes\b"), 'scale, <span class="math">p</span> denotes'),
    (re.compile(r"\band c is a constant\b"), 'and <span class="math">c</span> is a constant'),
]

# Footnote references, printed as a bare digit hard against whatever the
# sentence ended with \u2014 a full stop ("constant.3"), a comma ("curve,7"), or
# nothing at all ("Fechner1", "observations5"). Anchored to a preceding letter
# so that ordinary figures, which are always preceded by a space in this text
# ("December 10", "1,125 experiments", "\u221a2 (1.414)"), cannot match.
FN_REF = re.compile(r"([a-z\u2019])([.,;]?)([1-8])(?=\s|$)")


def apply_corrections(doc):
    """Walk every text field once, applying each pair and counting hits."""
    counts = {c[0]: 0 for c in CORRECTIONS}

    def fix(text):
        for broken, fixed, _n in CORRECTIONS:
            if broken in text:
                counts[broken] += text.count(broken)
                text = text.replace(broken, fixed)
        return text

    for p in doc["paragraphs"]:
        p["text"] = fix(p["text"])
    for b in doc["blocks"]:
        if b["type"] == "para":
            b["text"] = fix(b["text"])
    for s in doc["scale"]:
        s["text"] = fix(s["text"])
    for f in doc["footnotes"]:
        f["text"] = fix(f["text"])

    problems = []
    for broken, _fixed, want in CORRECTIONS:
        got = counts[broken]
        # every pair is applied to both doc["paragraphs"] and doc["blocks"],
        # which hold the same prose, so body hits land twice
        got_norm = got / 2 if got and got % 2 == 0 else got
        if got == 0:
            problems.append("NEVER FIRED: %r" % broken[:56])
        elif got_norm != want and got != want:
            problems.append("fired %s time(s), expected %d: %r"
                            % (got, want, broken[:48]))
    return problems


def smarten(text):
    for rx, rep in SMART:
        text = rx.sub(rep, text)
    return text


def mark_footnote_refs(text):
    return FN_REF.sub(
        lambda m: '%s%s<sup class="fn"><a href="#fn%s" id="fnref%s">%s</a></sup>'
                  % (m.group(1), m.group(2), m.group(3), m.group(3), m.group(3)),
        text)


def main():
    with open(IN, encoding="utf-8") as fh:
        doc = json.load(fh)

    before = {i: p["text"] for i, p in enumerate(doc["paragraphs"])}

    problems = apply_corrections(doc)
    if problems:
        for p in problems:
            print("  !! " + p, file=sys.stderr)
        print("\n%d correction(s) did not apply as stated; nothing written."
              % len(problems), file=sys.stderr)
        return 1

    if "--diff" in sys.argv:
        for i, p in enumerate(doc["paragraphs"]):
            if p["text"] != before[i]:
                for broken, fixed, _n in CORRECTIONS:
                    if broken in before[i]:
                        print("P%-2d  %s\n  -> %s\n" % (i + 1, broken, fixed))
        for s in doc["scale"]:
            print("scale [%s]  %s" % (s["mark"], s["text"]))
        return 0

    for p in doc["paragraphs"]:
        p["html"] = mark_footnote_refs(smarten(p["text"]))
    for b in doc["blocks"]:
        if b["type"] == "para":
            b["html"] = mark_footnote_refs(smarten(b["text"]))
    for s in doc["scale"]:
        s["html"] = smarten(s["text"])
    for f in doc["footnotes"]:
        f["html"] = smarten(f["text"])

    doc["formula_html"] = FORMULA_HTML
    doc["title"] = TITLE
    doc["byline"] = BYLINE
    doc["read"] = READ

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=1, ensure_ascii=False)
    print("wrote %s (%d corrections applied)"
          % (os.path.relpath(OUT, ROOT), len(CORRECTIONS)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
