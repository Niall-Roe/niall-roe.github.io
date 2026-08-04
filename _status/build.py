#!/usr/bin/env python3
"""Write the status dashboard and a reading view of each paper's example notes.

Outputs
    _status/index.html          the dashboard
    _status/notes-<slug>.html   one readable page per notes file

Two kinds of fact go into the dashboard.

DERIVED — read out of the repository every time this runs, so it cannot go stale:
examples built, page size, whether index.html is behind src/, the last commit that
touched the folder, uncommitted files, and — parsed out of each notes file — every
example's status.

DECLARED — the PROJECTS table below: what the paper is, how many examples the notes
plan for, what is next. Edit these by hand as the work moves.

The notes parser reads the three formats now in the repository as well as the one in
_status/CONVENTIONS.md, so no notes file has to be migrated for this to work.

Usage:  python3 _status/build.py [--open]
"""

import html
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent
SITE = "https://niall-roe.github.io"


# ---------------------------------------------------------------------------
# DECLARED. Edit freely.
#
#   stage    polish | building | text-only | stable | off-pipeline
#   notes    the example-notes file, relative to the repo root, or None
#   planned  examples the notes call for, or None if the paper plans none
#   next     what to pick up next, most immediate first
#   docs     other working notes worth opening, (label, path-from-root)
# ---------------------------------------------------------------------------

PROJECTS = [
    {
        "slug": "probability-of-induction",
        "title": "The Probability of Induction",
        "year": "1878",
        "stage": "polish",
        "planned": 33,
        "notes": "probability-of-induction/Probability of Induction - Example Notes.tex",
        "next": [
            "Firefox slider-wheel behaviour is still unchecked.",
            "Residual wobble around a half in ex25 is binomial discreteness, not a bug "
                "— worth a note in the page rather than a fix.",
            "Six numerical fixes live only in the HTML; app.R in Simulating-Peirce "
                "still has the bugs. Port back if the R version should agree again.",
        ],
        "docs": [("TODO.md — outstanding work, with a Done log",
                  "probability-of-induction/TODO.md")],
    },
    {
        "slug": "Theory-of-Probable-Inference",
        "title": "A Theory of Probable Inference",
        "year": "1883",
        "stage": "building",
        "planned": 28,
        "notes": "Theory-of-Probable-Inference/A Theory of Probable Inference - Examples.tex",
        "next": [
            "Examples 4 onward, in reading order.",
            "Several planned examples are explicitly 'PoI's ex-N, re-pointed' "
                "— reuse that machinery rather than drawing a second picture.",
            "Anchor Form I–V examples under their own hairline blocks.",
        ],
        "docs": [],
    },
    {
        "slug": "Theory-of-Errors-of-Observation",
        "title": "On the Theory of Errors of Observation",
        "year": "1873",
        "stage": "building",
        "planned": 33,
        "notes": "Theory-of-Errors-of-Observation/On the Theory of Errors of Observation - Examples.tex",
        "next": [
            "Examples 3 onward. Numbering follows build order, so there are gaps by design.",
            "'Probability and Relative Numbers' is marked but has no spec — it needs "
                "one before anything there can be built.",
            "Tables are not in the page; the data sits in Koenker's data/MiM/data/.",
        ],
        "docs": [("math-check.md — 47 formulas verified against the PDF",
                  "Theory-of-Errors-of-Observation/math-check.md"),
                 ("Step Plan.tex — the three-step plan for this paper",
                  "Theory-of-Errors-of-Observation/On the Theory of Errors of Observation - Step Plan.tex")],
    },
    {
        "slug": "On-Small-Differences-In-Sensation",
        "title": "On Small Differences in Sensation",
        "year": "1884",
        "stage": "text-only",
        "planned": None,
        "notes": None,
        "next": [
            "Decide whether this paper gets demonstrations at all. If so, add "
                "03_lib.js and 04_scaffold.js back to build.sh before 99.",
            "The nine tables are rendered as data and are the obvious first candidates.",
            "Whole folder is still untracked — nothing here is committed yet.",
        ],
        "docs": [],
    },
    {
        "slug": "roc-and-hypothesis-testing",
        "title": "Signal Detection & Hypothesis Testing",
        "year": None,
        "stage": "stable",
        "planned": None,
        "notes": None,
        "next": ["No planned work written down. The flags above say whether it is "
                 "clean; they are read fresh on every run."],
        "docs": [],
    },
    {
        "slug": "severity",
        "title": "Severity",
        "year": None,
        "stage": "stable",
        "planned": None,
        "notes": None,
        "next": ["No planned work written down. The flags above say whether it is "
                 "clean; they are read fresh on every run."],
        "docs": [],
    },
    {
        "slug": "fechners-lab",
        "title": "Fechner's Lab",
        "year": None,
        "stage": "off-pipeline",
        "planned": None,
        "notes": None,
        "next": [
            "A split into src/ was started on 4 August but is unfinished: build.sh "
                "names src/00_intro.html, which does not exist, so --check cannot run. "
                "The parts on disk (_head, _lib, _mid, _foot) come to 26 KB against "
                "the served page's 65 KB.",
            "Until that lands, index.html is still the hand-maintained original — do "
                "not run build.sh over it.",
            "comparison.html is a second page with nothing linking to it.",
        ],
        "docs": [],
    },
]

STAGES = {
    "polish":       ("Polish", "All planned work built; scatter remains."),
    "building":     ("Building", "Text in place, examples going in."),
    "text-only":    ("Text edition", "Reads as an edition; no demonstrations."),
    "stable":       ("Stable", "Published and not being worked on."),
    "off-pipeline": ("Off pipeline", "Published, but not built from src/."),
}

# Status vocabulary, in the order it reads as progress. See _status/CONVENTIONS.md.
STATUS = {
    "done":     ("Done", "Built and approved, nothing open."),
    "awaiting": ("Awaiting approval", "Built this pass, waiting on your sign-off."),
    "building": ("Building", "Partly built, open suggestions remain."),
    "early":    ("Early", "Spec written, nothing built."),
    "blank":    ("Blank", "Heading exists, no spec written yet."),
    "parked":   ("Parked", "Deliberately not being worked on."),
}
STATUS_ORDER = ["done", "awaiting", "building", "early", "blank", "parked"]

# Set inline on the stacked bars: `.bar span` is more specific than `.sq-<status>`,
# so a class alone would be overridden by the plain-bar rule.
STATUS_COLOR = {k: f"var(--s-{k})" for k in STATUS_ORDER}


# ---------------------------------------------------------------------------
# NOTES PARSER
# ---------------------------------------------------------------------------

NO_OPEN = re.compile(r"^\s*(none open|none\.|none|no note written yet|nothing open)",
                     re.I)
BUILT_MARK = re.compile(r"^-{2,}\s*BUILT:?\s*(EXAMPLE\s*(\d+))?", re.I)
REVISION = re.compile(r"^REVISION\s+(\d+)", re.I)
EX_HEAD = re.compile(r"^##(?!#)\s*(.*)$")
SUB_HEAD = re.compile(r"^###(?!#)\s*(.+)$")
SUBSUB = re.compile(r"^####\s*(.+)$")
TOP_HEAD = re.compile(r"^#(?!#)\s*(.+)$")
STATUS_LINE = re.compile(r"^Status:\s*(.+?)\s*$", re.I)
SPEC_LEAD = re.compile(r"^(Suggestion|Suggestions)\.?\s*$", re.I)
BANNER = re.compile(r"^={6,}\s*$")


def split_examples(text):
    """Split a notes file into (preamble, groups). A group is a section banner plus
    the examples under it; papers without banners get one unnamed group."""
    lines = text.replace("\r\n", "\n").split("\n")
    preamble, groups = [], []
    cur_group = {"title": None, "examples": []}
    cur_ex = None
    i = 0

    def flush_ex():
        nonlocal cur_ex
        if cur_ex is not None:
            cur_group["examples"].append(cur_ex)
            cur_ex = None

    while i < len(lines):
        line = lines[i]

        # ==== banner ==== : the line between two rules is the section title
        if BANNER.match(line) and i + 2 < len(lines) and BANNER.match(lines[i + 2]):
            flush_ex()
            if cur_group["examples"] or cur_group["title"]:
                groups.append(cur_group)
            cur_group = {"title": lines[i + 1].strip(), "examples": []}
            i += 3
            continue

        m = EX_HEAD.match(line)
        if m:
            flush_ex()
            cur_ex = {"heading": m.group(1).strip(), "body": []}
            i += 1
            continue

        # A single-# heading before any example is preamble structure; after
        # examples have started it opens a new group (Errors of Observation does this).
        t = TOP_HEAD.match(line)
        if t and not BANNER.match(line):
            if cur_group["examples"] or cur_ex is not None:
                flush_ex()
                groups.append(cur_group)
                cur_group = {"title": t.group(1).strip(), "examples": []}
                i += 1
                continue

        (cur_ex["body"] if cur_ex is not None else preamble).append(line)
        i += 1

    flush_ex()
    if cur_group["examples"] or cur_group["title"]:
        groups.append(cur_group)
    return "\n".join(preamble).strip(), groups


def classify(ex):
    """Work out an example's status and pull out its parts.

    Prefers an explicit `Status:` line. Otherwise derives from which sections carry
    content, reading all three legacy formats as well as the documented one.
    """
    body = "\n".join(ex["body"])
    ex["num"] = None
    ex["title"] = ex["heading"]

    m = re.match(r"^(\d+)(?:\s*(?:—|-|–|\.)\s*(.*))?$", ex["heading"])
    if m:
        ex["num"] = int(m.group(1))
        ex["title"] = (m.group(2) or "").strip()
    else:
        m2 = re.match(r"^(\d+)\s+(?:and|,)\s+(\d+)", ex["heading"])
        if m2:
            ex["num"] = int(m2.group(1))
            ex["title"] = ex["heading"]

    explicit = None
    for line in ex["body"]:
        s = STATUS_LINE.match(line.strip())
        if s:
            v = s.group(1).strip().lower().replace(" ", "-")
            explicit = {"awaiting-approval": "awaiting"}.get(v, v)
            break

    # Section contents, by the heading that introduces them.
    sections = {}
    cur = "_lead"
    for line in ex["body"]:
        h = SUB_HEAD.match(line)
        if h:
            cur = h.group(1).strip().lower()
            sections.setdefault(cur, [])
            continue
        if BUILT_MARK.match(line):
            cur = "built"
            sections.setdefault(cur, [])
            continue
        if REVISION.match(line):
            cur = "built"
            sections.setdefault(cur, [])
        sections.setdefault(cur, []).append(line)

    def content(*keys):
        out = []
        for k in keys:
            for kk, v in sections.items():
                if kk.startswith(k):
                    out += v
        return "\n".join(out).strip()

    suggestions = content("suggestion")
    completed = content("recently completed", "completed", "built")
    awaiting = content("awaiting approval")
    lead = content("_lead")

    open_items = bool(suggestions) and not NO_OPEN.match(suggestions)
    if "open questions for you" in body.lower():
        open_items = True

    ex["has_spec"] = bool(re.search(r"\S", (suggestions + lead + body))) and \
        len(re.findall(r"\w+", body)) > 20
    ex["built"] = bool(completed) or bool(BUILT_MARK.search(body))
    ex["open"] = open_items

    if explicit in STATUS:
        ex["status"] = explicit
    elif awaiting:
        ex["status"] = "awaiting"
    elif not ex["has_spec"]:
        ex["status"] = "blank"
    elif ex["built"] and open_items:
        ex["status"] = "building"
    elif ex["built"]:
        ex["status"] = "done"
    else:
        ex["status"] = "early"

    ex["raw"] = body
    return ex


def parse_notes(path):
    text = Path(path).read_text(errors="replace")
    preamble, groups = split_examples(text)
    for g in groups:
        g["examples"] = [classify(e) for e in g["examples"]]
    return preamble, groups


# ---------------------------------------------------------------------------
# NOTES RENDERING — the plain-text notes as something readable
# ---------------------------------------------------------------------------

def e(s):
    return html.escape(str(s))


def inline(s):
    """Escape, then mark up the file's own conventions: [Niall's marks], "quotes",
    and [from the build] tags."""
    s = e(s)
    s = re.sub(r"\[from the build\]", '<span class="tag-build">from the build</span>',
               s, flags=re.I)
    s = re.sub(r"\[([^\[\]]{1,400})\]", r'<mark class="nrr">[\1]</mark>', s)
    return s


def render_body(raw):
    """Turn the notes' plain text into readable HTML: sub-headings, quoted anchor
    passages as blockquotes, dash lists as lists, everything else as paragraphs."""
    out, para, mode = [], [], None

    def flush():
        nonlocal para, mode
        if not para:
            return
        joined = " ".join(l.strip() for l in para).strip()
        if not joined:
            para, mode = [], None
            return
        if mode == "quote":
            out.append(f"<blockquote>{inline(joined)}</blockquote>")
        elif mode == "list":
            items = "".join(f"<li>{inline(x.strip())}</li>"
                            for x in re.split(r"(?:^|\s)[-–]\s+", joined) if x.strip())
            out.append(f"<ul>{items}</ul>")
        else:
            out.append(f"<p>{inline(joined)}</p>")
        para, mode = [], None

    for line in raw.split("\n"):
        s = line.strip()
        if not s:
            flush()
            continue
        if STATUS_LINE.match(s):
            continue
        h = SUBSUB.match(s)
        if h:
            flush()
            out.append(f'<h4>{inline(h.group(1))}</h4>')
            continue
        h = SUB_HEAD.match(s)
        if h:
            flush()
            out.append(f'<h3 class="sec">{inline(h.group(1))}</h3>')
            continue
        b = BUILT_MARK.match(s)
        if b:
            flush()
            out.append(f'<h3 class="sec built-mark">Built'
                       f'{" — example " + b.group(2) if b.group(2) else ""}</h3>')
            continue
        r = REVISION.match(s)
        if r:
            flush()
            out.append(f'<h4 class="rev">Revision {r.group(1)}</h4>')
            continue
        if SPEC_LEAD.match(s):
            flush()
            out.append('<h3 class="sec">Suggestions</h3>')
            continue
        if s.startswith("Suggestion."):
            flush()
            out.append('<h3 class="sec">Suggestions</h3>')
            s = s[len("Suggestion."):].strip()
            if not s:
                continue
        if re.match(r'^Text:?\s*$', s, re.I):
            flush()
            out.append('<h3 class="sec">Text</h3>')
            continue
        if s.startswith("Text:"):
            flush()
            out.append('<h3 class="sec">Text</h3>')
            s = s[5:].strip()
        m = None
        if re.match(r"^[-–]\s+", s):
            m = "list"
        elif s.startswith('"') or s.startswith("“"):
            m = "quote"
        if m and mode != m:
            flush()
            mode = m
        para.append(s)
    flush()
    return "\n".join(out)


ATTENTION = ["awaiting", "building", "early", "blank"]

FILTER_JS = """<script>
(function () {
  var ATTENTION = %s;
  var chips = [].slice.call(document.querySelectorAll('.chips .chip'));
  var entries = [].slice.call(document.querySelectorAll('#entries .ex'));
  var groups = [].slice.call(document.querySelectorAll('#entries .group'));
  var squares = [].slice.call(document.querySelectorAll('.strip .sq'));
  var showing = document.querySelector('.showing');
  var empty = document.querySelector('.empty');
  var sel = null;                       // null means everything

  function apply() {
    var n = 0;
    entries.forEach(function (el) {
      var on = !sel || sel.indexOf(el.dataset.s) > -1;
      el.hidden = !on;
      if (on) n++;
    });
    // A group heading is only worth showing if something under it survived.
    groups.forEach(function (h) {
      var vis = false, el = h.nextElementSibling;
      while (el && !el.classList.contains('group')) {
        if (el.classList.contains('ex') && !el.hidden) { vis = true; break; }
        el = el.nextElementSibling;
      }
      h.hidden = !vis;
    });
    squares.forEach(function (s) {
      s.classList.toggle('muted', !!sel && sel.indexOf(s.dataset.s) < 0);
    });
    chips.forEach(function (c) {
      var mine = c.dataset.set === 'all' ? !sel
        : c.dataset.set === 'attention' ? same(sel, ATTENTION)
        : c.dataset.set === 'awaiting' ? same(sel, ['awaiting'])
        : !!sel && sel.length === 1 && sel[0] === c.dataset.s;
      c.classList.toggle('on', mine);
    });
    empty.hidden = n > 0;
    showing.hidden = !sel;
    showing.textContent = sel ? 'Showing ' + n + ' of ' + entries.length + ' entries.' : '';
  }

  function same(a, b) {
    return !!a && a.length === b.length && b.every(function (x) { return a.indexOf(x) > -1; });
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var set = c.dataset.set;
      if (set === 'all') sel = null;
      else if (set === 'attention') sel = ATTENTION.slice();
      else if (set === 'awaiting') sel = ['awaiting'];
      else sel = [c.dataset.s];
      apply();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // #s=building from the dashboard legend, or #s=attention. Listened for as well as
  // read at load, so it works whether the page is opened fresh or already showing.
  function fromHash() {
    var m = /^#s=([a-z]+)$/.exec(location.hash);
    if (!m) return false;
    sel = m[1] === 'attention' ? ATTENTION.slice() : [m[1]];
    apply();
    return true;
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
  apply();
})();
</script>""" % (str(ATTENTION).replace("'", '"'),)


def status_chip(st):
    label, blurb = STATUS[st]
    return f'<span class="st st-{st}" title="{e(blurb)}">{e(label)}</span>'


def notes_page(p, groups, preamble):
    counts = tally(groups)
    total = sum(counts.values())
    attention = sum(counts.get(k, 0) for k in ("awaiting", "building", "early", "blank"))

    strip = "".join(
        f'<a class="sq sq-{ex["status"]}" href="#ex-{i}" data-s="{ex["status"]}" '
        f'title="{e(ex["heading"])} — {STATUS[ex["status"]][0]}">'
        f'{e(ex["num"] if ex["num"] else "·")}</a>'
        for i, ex in enumerate(all_examples(groups)))

    chips = [f'<button class="chip" data-set="all">All <b>{total}</b></button>']
    if counts.get("awaiting"):
        chips.append(f'<button class="chip chip-wait" data-set="awaiting">'
                     f'Needs you <b>{counts["awaiting"]}</b></button>')
    if attention:
        chips.append(f'<button class="chip" data-set="attention">'
                     f'Needs attention <b>{attention}</b></button>')
    chips += [f'<button class="chip" data-s="{k}"><i class="sq sq-{k}"></i>'
              f'{STATUS[k][0]} <b>{counts[k]}</b></button>'
              for k in STATUS_ORDER if counts.get(k)]

    body, n = [], 0
    for g in groups:
        if g["title"]:
            body.append(f'<h2 class="group">{e(g["title"])}</h2>')
        for ex in g["examples"]:
            if ex["num"] and ex["title"]:
                head = f'<span class="exn">{ex["num"]}</span>{inline(ex["title"])}'
            elif ex["num"]:
                head = f'<span class="exn">{ex["num"]}</span><span class="untitled">untitled</span>'
            else:
                head = inline(ex["title"] or "untitled")
            body.append(f'''<article class="ex ex-{ex["status"]}" id="ex-{n}" data-s="{ex["status"]}">
  <header><h3>{head}</h3>{status_chip(ex["status"])}</header>
  <div class="notes-body">{render_body(ex["raw"])}</div>
</article>''')
            n += 1

    pre = f'<details class="preamble"><summary>File preamble — general notes for this paper</summary>' \
          f'<div class="notes-body">{render_body(preamble)}</div></details>' if preamble else ""

    return shell(
        title=f'{p["title"]} — example notes',
        body=f'''
<p class="crumb"><a href="index.html">← Status</a></p>
<h1>{e(p["title"])}</h1>
<p class="sub">{total} entries in
  <a href="../{e(p["notes"])}">{e(Path(p["notes"]).name)}</a>.
  Written to the file's own format; see
  <a href="CONVENTIONS.md">CONVENTIONS.md</a> for the one to write new entries to.</p>
<div class="strip">{strip}</div>
<div class="chips">{"".join(chips)}</div>
<p class="showing" hidden></p>
{pre}
<div id="entries">{"".join(body)}</div>
<p class="empty" hidden>Nothing at that status.</p>
{FILTER_JS}
''', cls="reading")


def all_examples(groups):
    return [ex for g in groups for ex in g["examples"]]


def tally(groups):
    c = {}
    for ex in all_examples(groups):
        c[ex["status"]] = c.get(ex["status"], 0) + 1
    return c


# ---------------------------------------------------------------------------
# DERIVED REPOSITORY FACTS
# ---------------------------------------------------------------------------

def git(*args):
    try:
        return subprocess.run(["git", "-C", str(ROOT), *args],
                              capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        return ""


def inspect(slug):
    d = ROOT / slug
    f = {"slug": slug, "exists": d.is_dir()}
    if not f["exists"]:
        return f

    page = d / "index.html"
    f["bytes"] = page.stat().st_size if page.exists() else 0

    src = d / "src"
    f["parts"] = sorted(p.name for p in src.glob("*")) if src.is_dir() else []

    built = set()
    for js in (src.glob("*.js") if src.is_dir() else []):
        built |= set(re.findall(r'registerExample\("([^"]+)"', js.read_text(errors="replace")))
    f["built"] = len(built)

    # Three outcomes, not two: a build that cannot run at all (a part named in
    # build.sh is not on disk) is a different thing from one that ran and is behind.
    build = d / "build.sh"
    f["build_err"] = None
    if build.exists():
        try:
            r = subprocess.run(["bash", str(build), "--check"], cwd=str(d),
                               capture_output=True, text=True, timeout=60)
            out = (r.stdout + r.stderr).strip()
            if r.returncode == 0:
                f["fresh"] = True
            elif "missing part" in out:
                f["fresh"] = "broken"
                f["build_err"] = out.splitlines()[0]
            else:
                f["fresh"] = False
        except Exception:
            f["fresh"] = None
    else:
        f["fresh"] = None

    f["last_commit"] = git("log", "-1", "--format=%ad|%s", "--date=short", "--", slug)
    dirty = [l for l in git("status", "--porcelain", "--", slug).splitlines() if l.strip()]
    f["dirty"] = len(dirty)
    f["untracked_all"] = bool(dirty) and all(l.startswith("??") for l in dirty)
    return f


def human_bytes(n):
    return f"{n/1024:.0f} KB" if n < 1024 * 1024 else f"{n/1024/1024:.1f} MB"


def since(datestr):
    try:
        d = datetime.strptime(datestr, "%Y-%m-%d").date()
    except ValueError:
        return ""
    n = (datetime.now().date() - d).days
    return "today" if n == 0 else "yesterday" if n == 1 else f"{n} days ago"


# ---------------------------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------------------------

def card(p, f, notes):
    if not f.get("exists"):
        return (f'<article class="card"><h2>{e(p["title"])}</h2>'
                f'<p class="flags"><span class="flag warn">folder missing</span></p></article>')

    label, blurb = STAGES[p["stage"]]
    built = f["built"]

    strip = counts_line = ""
    if notes:
        # The bar is the entries themselves, in the squares' own colours, so it
        # never reads 100% while anything is unfinished.
        exs = all_examples(notes["groups"])
        counts = tally(notes["groups"])
        total = len(exs)
        done = counts.get("done", 0)
        segs = "".join(
            f'<span style="width:{100*counts[k]/total:.4f}%;'
            f'background:{STATUS_COLOR[k]}" title="{STATUS[k][0]}: {counts[k]}"></span>'
            for k in STATUS_ORDER if counts.get(k))
        bar = (f'<div class="prog"><div class="bar stacked">{segs}</div>'
               f'<div class="prog-n"><span><strong>{done}</strong> of {total} entries done'
               f'</span><span>{round(100*done/total)}%</span></div></div>')
        strip = ('<a class="strip mini" target="_blank" rel="noopener" '
                 'href="notes-%s.html">%s</a>' % (
            e(p["slug"]),
            "".join(f'<i class="sq sq-{x["status"]}" title="{e(x["heading"])} — '
                    f'{STATUS[x["status"]][0]}"></i>' for x in exs)))
        counts_line = '<p class="legend mini">' + "".join(
            f'<a class="leg" target="_blank" rel="noopener" '
            f'href="notes-{e(p["slug"])}.html#s={k}">'
            f'<i class="sq sq-{k}"></i>{STATUS[k][0]} <b>{counts[k]}</b></a>'
            for k in STATUS_ORDER if counts.get(k)) + "</p>"
    else:
        bar = ('<div class="prog no-bar"><div class="prog-n">'
               f'{"No examples planned" if built == 0 else f"<strong>{built}</strong> examples"}'
               "</div></div>")

    flags = []
    if f["fresh"] == "broken":
        flags.append(f'<span class="flag bad">build.sh cannot run — {e(f["build_err"])}</span>')
    elif f["fresh"] is False:
        flags.append('<span class="flag warn">index.html is behind src/ — run build.sh</span>')
    elif f["fresh"] is True:
        flags.append('<span class="flag ok">build up to date</span>')
    if f["dirty"]:
        kind = "untracked" if f["untracked_all"] else "uncommitted"
        flags.append(f'<span class="flag warn">{f["dirty"]} {kind} '
                     f'file{"s" if f["dirty"] != 1 else ""}</span>')
    if notes and tally(notes["groups"]).get("awaiting"):
        flags.insert(0, f'<span class="flag wait">'
                        f'{tally(notes["groups"])["awaiting"]} awaiting your approval</span>')

    # Everything opens in its own tab, so the dashboard stays put as the thing you
    # come back to. Notes is first because it is the one that answers "what next".
    btns = []
    if notes:
        btns.append(f'<a class="btn primary" target="_blank" rel="noopener" '
                    f'href="notes-{e(p["slug"])}.html">Open Notes</a>')
    btns.append(f'<a class="btn" target="_blank" rel="noopener" '
                f'href="../{e(p["slug"])}/index.html">Open Page</a>')
    btns.append(f'<a class="btn" target="_blank" rel="noopener" '
                f'href="{SITE}/{e(p["slug"])}/">Live Page</a>')

    return f'''<article class="card stage-{p["stage"]}">
  <header>
    <h2><a target="_blank" rel="noopener" href="../{e(p["slug"])}/index.html">{e(p["title"])}</a>
      {f'<span class="year">{e(p["year"])}</span>' if p.get("year") else ""}</h2>
    <div class="pill" title="{e(blurb)}">{e(label)}</div>
  </header>
  {bar}
  {strip}{counts_line}
  {f'<p class="flags">{"".join(flags)}</p>' if flags else ""}
  <footer>{"".join(btns)}</footer>
</article>'''


CSS = """
:root {
  --page:#f4f1ea; --paper:#fff; --ink:#1f2328; --ink-soft:#575d66; --ink-faint:#8a9099;
  --rule:#dbd6cb; --rule-soft:#ece8df; --accent:#7a4a2b; --warn:#9a5b1e; --ok:#4a6b45;
  --s-done:#6b8f5e; --s-awaiting:#c98a2e; --s-building:#b8873f;
  --s-early:#8fa3b8; --s-blank:#cdc7bb; --s-parked:#a89a8c;
}
* { box-sizing:border-box; }
body { margin:0; padding:3rem 1.5rem 5rem; background:var(--page); color:var(--ink);
  font:16px/1.55 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif; }
.wrap { max-width:1180px; margin:0 auto; }
.reading .wrap { max-width:760px; }
h1 { font-size:1.9rem; font-weight:600; margin:0 0 .3rem; letter-spacing:-.01em; }
.sub { color:var(--ink-soft); margin:0 0 1.6rem; font-size:.92rem; }
.crumb { margin:0 0 1.2rem; font-size:.85rem; }
.crumb a, .sub a, .docs a { color:var(--accent); }
.summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:1px;
  background:var(--rule); border:1px solid var(--rule); border-radius:4px;
  overflow:hidden; margin-bottom:2.5rem; }
.summary div { background:var(--paper); padding:.85rem 1.1rem; }
.summary dt { font-size:.72rem; letter-spacing:.07em; text-transform:uppercase;
  color:var(--ink-faint); margin-bottom:.25rem; }
.summary dd { margin:0; font-size:1.05rem; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:1.2rem; }
.card { background:var(--paper); border:1px solid var(--rule); border-radius:5px;
  padding:1.2rem 1.3rem 1rem; display:flex; flex-direction:column;
  border-top:3px solid var(--rule); }
.card.stage-polish { border-top-color:#6b8f5e; }
.card.stage-building { border-top-color:#b8873f; }
.card.stage-text-only { border-top-color:#7a8fa8; }
.card.stage-off-pipeline { border-top-color:#a87f7f; }
.card.stage-stable { border-top-color:#b3ada0; }
.card header { display:flex; gap:1rem; align-items:flex-start; justify-content:space-between; }
h2 { font-size:1.18rem; font-weight:600; margin:0; line-height:1.3; }
h2 a { color:var(--ink); text-decoration:none; }
h2 a:hover { color:var(--accent); }
.year { color:var(--ink-faint); font-weight:400; font-size:.85em; margin-left:.25rem; }
.pill { flex:none; font-size:.68rem; letter-spacing:.06em; text-transform:uppercase;
  padding:.28rem .6rem; border:1px solid var(--rule); border-radius:99px;
  color:var(--ink-soft); background:var(--rule-soft); white-space:nowrap; cursor:help; }
.prog { margin:1.15rem 0 0; }
.bar { height:6px; background:var(--rule-soft); border-radius:3px; overflow:hidden; }
.bar span { display:block; height:100%; background:var(--accent); }
.bar.stacked { display:flex; }
.bar.stacked span { height:100%; }
.bar.overall { height:9px; margin:-1.4rem 0 0; }
.bar.overall + .legend { margin-bottom:2.4rem; }
.prog-n { font-size:.82rem; color:var(--ink-soft); margin-top:.4rem;
  display:flex; justify-content:space-between; }
.prog-n strong { color:var(--ink); }
.no-bar .prog-n { margin-top:0; }
.strip { display:flex; flex-wrap:wrap; gap:3px; margin:1rem 0 .1rem; text-decoration:none; }
.sq { width:15px; height:15px; border-radius:2px; display:inline-block;
  background:var(--s-blank); font-size:9px; line-height:15px; text-align:center;
  color:#fff; text-decoration:none; font-family:ui-monospace,monospace; }
.strip.mini .sq { width:9px; height:9px; border-radius:2px; }
.sq-done{background:var(--s-done)} .sq-awaiting{background:var(--s-awaiting)}
.sq-building{background:var(--s-building)} .sq-early{background:var(--s-early)}
.sq-blank{background:var(--s-blank)} .sq-parked{background:var(--s-parked)}
.legend { display:flex; flex-wrap:wrap; gap:.75rem; margin:.6rem 0 0;
  font-size:.76rem; color:var(--ink-soft); }
.legend.mini { margin-top:.5rem; font-size:.72rem; }
.leg { display:inline-flex; align-items:center; gap:.3rem; color:inherit;
  text-decoration:none; border-bottom:1px solid transparent; }
a.leg:hover { border-bottom-color:var(--rule); }
.leg i { width:9px; height:9px; }
.leg b { color:var(--ink); font-weight:600; }

/* filter chips */
.chips { display:flex; flex-wrap:wrap; gap:.4rem; margin:.9rem 0 .2rem; }
.chip { font:inherit; font-size:.78rem; display:inline-flex; align-items:center; gap:.35rem;
  padding:.3rem .7rem; border:1px solid var(--rule); border-radius:99px;
  background:var(--paper); color:var(--ink-soft); cursor:pointer; }
.chip:hover { border-color:var(--ink-faint); }
.chip.on { background:var(--ink); border-color:var(--ink); color:#fff; }
.chip.on b, .chip.on i { color:#fff; }
.chip b { color:var(--ink); font-weight:600; }
.chip i { width:9px; height:9px; }
.chip-wait { border-color:var(--s-awaiting); color:#8a6218; background:#fdf6e6; }
.chip-wait.on { background:var(--s-awaiting); border-color:var(--s-awaiting); color:#fff; }
.showing, .empty { font-size:.8rem; color:var(--ink-faint); margin:.6rem 0 0; }
.empty { margin:2rem 0; }
.sq.muted { opacity:.22; }
.dim { color:var(--ink-faint); }
.flags { margin:.9rem 0 0; display:flex; flex-wrap:wrap; gap:.4rem; }
.flag { font-size:.74rem; padding:.2rem .5rem; border-radius:3px; }
.flag.warn { background:#f6ecdd; color:var(--warn); }
.flag.bad { background:#f7e2dd; color:#8f3a25; font-weight:600; }
.flag.ok { background:#eaf0e6; color:var(--ok); }
.flag.wait { background:#f7edd6; color:#8a6218; font-weight:600; }
h3 { font-size:.69rem; letter-spacing:.08em; text-transform:uppercase;
  color:var(--ink-faint); margin:0 0 .45rem; font-weight:600; }
.card footer { margin-top:auto; padding-top:.9rem; display:flex; flex-wrap:wrap; gap:.4rem;
  border-top:1px solid var(--rule-soft); margin-top:1rem; }
.btn { font-size:.78rem; padding:.34rem .7rem; border:1px solid var(--rule);
  border-radius:4px; color:var(--ink-soft); background:var(--paper);
  text-decoration:none; white-space:nowrap; }
.btn:hover { border-color:var(--ink-faint); color:var(--ink); }
.btn.primary { border-color:var(--accent); color:var(--accent); }
.btn.primary:hover { background:var(--accent); color:#fff; }
.flags + footer { margin-top:.5rem; }
.repo-notes { margin-top:2.5rem; background:var(--paper); border:1px solid var(--rule);
  border-radius:5px; padding:1.3rem 1.5rem; }
.repo-notes ul { margin:0; padding-left:1.05rem; }
.repo-notes li { font-size:.87rem; color:var(--ink-soft); margin-bottom:.4rem; }
.foot { margin-top:2.5rem; font-size:.8rem; color:var(--ink-faint); }
.foot code, .repo-notes code { background:var(--rule-soft); padding:.1rem .35rem; border-radius:3px; }

/* reading view */
.preamble { background:var(--paper); border:1px solid var(--rule); border-radius:5px;
  padding:.9rem 1.2rem; margin:1.6rem 0 2rem; }
.preamble summary { cursor:pointer; font-size:.85rem; color:var(--ink-soft); }
.preamble[open] summary { margin-bottom:.8rem; }
h2.group { font-size:.75rem; letter-spacing:.1em; text-transform:uppercase;
  color:var(--ink-faint); margin:2.6rem 0 1rem; padding-bottom:.4rem;
  border-bottom:1px solid var(--rule); font-weight:600; }
.ex { background:var(--paper); border:1px solid var(--rule); border-left:3px solid var(--rule);
  border-radius:4px; padding:1.2rem 1.5rem; margin-bottom:1rem; scroll-margin-top:1rem; }
.ex-done{border-left-color:var(--s-done)} .ex-awaiting{border-left-color:var(--s-awaiting)}
.ex-building{border-left-color:var(--s-building)} .ex-early{border-left-color:var(--s-early)}
.ex-blank{border-left-color:var(--s-blank)} .ex-parked{border-left-color:var(--s-parked)}
.ex > header { display:flex; justify-content:space-between; align-items:baseline;
  gap:1rem; margin-bottom:.3rem; }
.ex > header h3 { font-size:1.05rem; text-transform:none; letter-spacing:0;
  color:var(--ink); margin:0; font-weight:600; }
.exn { display:inline-block; min-width:1.6em; color:var(--ink-faint); font-weight:400;
  font-variant-numeric:tabular-nums; }
.untitled { color:var(--ink-faint); font-weight:400; font-style:italic; }
.st { flex:none; font-size:.66rem; letter-spacing:.06em; text-transform:uppercase;
  padding:.2rem .5rem; border-radius:99px; color:#fff; cursor:help; white-space:nowrap; }
.st-done{background:var(--s-done)} .st-awaiting{background:var(--s-awaiting)}
.st-building{background:var(--s-building)} .st-early{background:var(--s-early)}
.st-blank{background:var(--s-blank)} .st-parked{background:var(--s-parked)}
.notes-body { font-size:.92rem; color:var(--ink-soft); }
.notes-body h3.sec { font-size:.68rem; letter-spacing:.09em; text-transform:uppercase;
  color:var(--ink-faint); margin:1.3rem 0 .5rem; }
.notes-body h3.built-mark { color:var(--s-done); }
.notes-body h4 { font-size:.9rem; margin:1rem 0 .35rem; color:var(--ink); font-weight:600; }
.notes-body h4.rev { color:var(--accent); }
.notes-body p { margin:0 0 .7rem; }
.notes-body blockquote { margin:.6rem 0 .9rem; padding:.5rem 0 .5rem 1rem;
  border-left:2px solid var(--rule); color:var(--ink); font-style:italic; }
.notes-body ul { margin:.3rem 0 .8rem; padding-left:1.1rem; }
.notes-body li { margin-bottom:.35rem; }
mark.nrr { background:#fbf0d4; color:#6b4c12; padding:.05rem .2rem; border-radius:2px;
  font-style:normal; }
.tag-build { background:var(--rule-soft); color:var(--ink-faint); font-size:.8em;
  padding:.05rem .35rem; border-radius:2px; }
@media (max-width:560px) { .grid{grid-template-columns:1fr} body{padding:2rem 1rem 3rem} }
"""


def shell(title, body, cls=""):
    return (f'<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>{e(title)}</title><style>{CSS}</style></head>'
            f'<body class="{cls}"><div class="wrap">{body}</div></body></html>')


def main():
    facts = {p["slug"]: inspect(p["slug"]) for p in PROJECTS}

    notes = {}
    for p in PROJECTS:
        if p.get("notes") and (ROOT / p["notes"]).exists():
            pre, groups = parse_notes(ROOT / p["notes"])
            notes[p["slug"]] = {"preamble": pre, "groups": groups}
            (HERE / f'notes-{p["slug"]}.html').write_text(
                notes_page(p, groups, pre))

    order = {"polish": 0, "building": 1, "text-only": 2, "off-pipeline": 3, "stable": 4}
    projects = sorted(PROJECTS, key=lambda p: (order[p["stage"]], p["title"]))

    total_dirty = sum(f.get("dirty", 0) for f in facts.values())
    stale = [p["title"] for p in PROJECTS if facts[p["slug"]].get("fresh") is False]
    broken = [p["title"] for p in PROJECTS if facts[p["slug"]].get("fresh") == "broken"]
    build_note = " · ".join(
        ([f'{", ".join(broken)} <span class="dim">broken</span>'] if broken else []) +
        ([f'{", ".join(stale)} <span class="dim">behind src/</span>'] if stale else [])) or "none"
    counts = {}
    for n in notes.values():
        for k, v in tally(n["groups"]).items():
            counts[k] = counts.get(k, 0) + v
    tracked = sum(counts.values())
    done = counts.get("done", 0)
    awaiting = counts.get("awaiting", 0)
    attention = sum(counts.get(k, 0) for k in ATTENTION)

    overall = "".join(
        f'<span style="width:{100*counts[k]/tracked:.4f}%;'
        f'background:{STATUS_COLOR[k]}" title="{STATUS[k][0]}: {counts[k]}"></span>'
        for k in STATUS_ORDER if counts.get(k)) if tracked else ""

    summary = "".join([
        f'<div><dt>Papers &amp; apps</dt><dd>{len(PROJECTS)}</dd></div>',
        f'<div><dt>Entries done</dt><dd>{done} '
        f'<span class="dim">of {tracked} tracked</span></dd></div>',
        f'<div><dt>Needs attention</dt><dd>{attention or "none"}</dd></div>',
        f'<div><dt>Awaiting your approval</dt><dd>{awaiting or "none"}</dd></div>',
        f'<div><dt>Uncommitted files</dt><dd>{total_dirty or "none"}</dd></div>',
        f'<div><dt>Build problems</dt><dd>{build_note}</dd></div>',
    ])

    (HERE / "index.html").write_text(shell(
        "Status — niall-roe.github.io",
        f'''
<h1>niall-roe.github.io</h1>
<p class="sub">Interactive editions and concept apps, and where each one stands.
Branch <code>{e(git("rev-parse", "--abbrev-ref", "HEAD"))}</code> at
<code>{e(git("log", "-1", "--format=%h %ad %s", "--date=short"))}</code>.</p>

<dl class="summary">{summary}</dl>
{f'<div class="bar stacked overall">{overall}</div>'
 f'<p class="legend">' + "".join(
   f'<span class="leg"><i class="sq sq-{k}"></i>{STATUS[k][0]} <b>{counts[k]}</b></span>'
   for k in STATUS_ORDER if counts.get(k)) + '</p>' if tracked else ''}

<div class="grid">{"".join(card(p, facts[p["slug"]], notes.get(p["slug"])) for p in projects)}</div>

<section class="repo-notes">
  <h3>Repository</h3>
  <ul>
    <li>Example notes follow <a href="CONVENTIONS.md">CONVENTIONS.md</a>. The three
      existing files each use their own format; the reading views read all of them,
      but new entries should be written to the convention.</li>
    <li>There is no <code>index.html</code> at the repository root, so
      <a href="{SITE}/">{SITE}/</a> serves nothing — every page is reachable only by
      its own URL.</li>
    <li>Working notes, R sources and the experiments these pages came from live in
      <a href="https://github.com/Niall-Roe/Simulating-Peirce">Simulating-Peirce</a>.
      This repository owns the live files; edit them here.</li>
    <li>This page is generated and gitignored; <code>build.py</code> is not.</li>
  </ul>
</section>

<p class="foot">Generated {e(datetime.now().strftime("%-d %B %Y, %H:%M"))} by
<code>_status/build.py</code>. Re-run after a session:
<code>python3 _status/build.py</code></p>
'''))
    print(f"wrote _status/index.html and {len(notes)} notes page(s)")
    if "--open" in sys.argv:
        subprocess.run(["open", str(HERE / "index.html")])


if __name__ == "__main__":
    main()
