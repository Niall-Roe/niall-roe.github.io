#!/usr/bin/env python3
"""Rank what is worth building next, and write the ranking to _status/assessment.md.

    python3 _status/assess.py

This is deliberately mechanical. It does not read the specs and decide whether
they are any good — that is a judgement, and it is the part a build session
brings. What it does is the counting that judgement should start from: which
entries are actionable at all, how completely each is specified, how much of it
already exists, which ones share a source file (so one build-and-check cycle
covers several), and how long each has been sitting.

Being a plain script and not a model, it is safe to run unattended on a timer:
it reads the notes and writes one file, and touches nothing else.

Run with --json to get the ranking as data instead of prose.
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE / "assessment.md"

# Roughly how specified an entry is, by the length of what is open on it. Short
# notes are usually a one-line tweak; very long ones are usually a new build.
SMALL, LARGE = 200, 1200


def open_text(ex):
    """The open instructions on an entry — Suggestions minus the placeholder."""
    for s in build.sections_of(ex.get("raw") or ""):
        if (s["title"] or "").strip().lower() == "suggestions":
            return build.SUG_PLACEHOLDER.sub("", s["text"]).strip()
    return ""


def source_files(paper_slug, ex):
    """Which src/ file an example lives in, so entries that would be built in
    the same file can be done in one pass. Matched on the container id."""
    cid = ex.get("container")
    if not cid:
        return None
    src = build.ROOT / paper_slug / "src"
    if not src.is_dir():
        return None
    for f in sorted(src.glob("*.js")):
        try:
            if cid in f.read_text(errors="replace"):
                return f.name
        except OSError:
            continue
    return None


def collect():
    rows = []
    for p in build.PROJECTS:
        loaded, _ = build.load_notes(p)
        if not loaded:
            continue
        for ex in build.all_examples(loaded[1]):
            if ex.get("blocked"):
                continue
            if ex["status"] not in ("building", "early", "blank"):
                continue
            spec = open_text(ex)
            if not spec:
                continue
            f = build.ROOT / ex["file"]
            mtime = f.stat().st_mtime if f.exists() else 0
            rows.append({
                "paper": p["title"],
                "slug": p["slug"],
                "file": ex["file"],
                "title": (f'{ex["num"]}. ' if ex.get("num") is not None else "")
                         + str(ex.get("title") or ex.get("heading") or ""),
                "status": ex["status"],
                "queued": bool(ex.get("queued")),
                "built": bool(ex.get("container")),
                "spec_chars": len(spec),
                "src": source_files(p["slug"], ex),
                "days_idle": round((datetime.now().timestamp() - mtime) / 86400, 1),
            })
    return rows


def score(r, src_counts):
    """Cheap and fresh first. Every term is stated in the report, so a ranking
    can be argued with rather than taken on faith."""
    s, why = 0, []
    if r["queued"]:
        s += 100
        why.append("you ticked it")
    if r["built"]:
        s += 25
        why.append("already built, so this is an edit not a new example")
    if r["spec_chars"] <= SMALL:
        s += 20
        why.append("short, self-contained note")
    elif r["spec_chars"] >= LARGE:
        s -= 10
        why.append("long spec — likely a whole build")
    n = src_counts.get((r["slug"], r["src"]), 0) if r["src"] else 0
    if n > 1:
        s += 8
        why.append(f"shares {r['src']} with {n - 1} other{'s' if n > 2 else ''}")
    if r["days_idle"] <= 2:
        s += 12
        why.append("commented on in the last couple of days")
    elif r["days_idle"] >= 30:
        s -= 5
        why.append(f"untouched for {int(r['days_idle'])} days")
    if r["status"] == "blank":
        s -= 15
        why.append("no spec written, only a heading")
    return s, why


def main():
    rows = collect()
    src_counts = {}
    for r in rows:
        if r["src"]:
            src_counts[(r["slug"], r["src"])] = src_counts.get((r["slug"], r["src"]), 0) + 1
    for r in rows:
        r["score"], r["why"] = score(r, src_counts)
    rows.sort(key=lambda r: (-r["score"], r["paper"], r["title"]))

    if "--json" in sys.argv:
        print(json.dumps(rows, indent=2))
        return

    now = datetime.now().strftime("%-d %B %Y, %H:%M")
    queued = [r for r in rows if r["queued"]]
    out = [f"# What to build next\n",
           f"Ranked {len(rows)} actionable entries. Generated {now} by "
           f"`_status/assess.py`.\n",
           "The ranking is mechanical — cheapness, freshness and batching. It does "
           "not judge whether a spec is good enough to build to; that is what a "
           "build session is for.\n"]

    if queued:
        out.append(f"## Ticked for the next build run — {len(queued)}\n")
        for r in queued:
            out.append(f"- **{r['title']}** — {r['paper']}  \n  `{r['file']}`")
        out.append("")

    out.append("## Ranked\n")
    out.append("| # | Entry | Paper | Status | Spec | Idle | Why |")
    out.append("|---|---|---|---|---|---|---|")
    for i, r in enumerate(rows[:40], 1):
        out.append(f"| {i} | {r['title']} | {r['paper']} | {r['status']} | "
                   f"{r['spec_chars']} ch | {r['days_idle']}d | {'; '.join(r['why'])} |")
    if len(rows) > 40:
        out.append(f"\n_{len(rows) - 40} further entries not shown._")

    batches = {k: v for k, v in src_counts.items() if v > 1}
    if batches:
        out.append("\n## Worth doing together\n")
        out.append("Entries sharing one source file — one build and one "
                   "`build.sh --check` covers the set.\n")
        for (slug, src), n in sorted(batches.items(), key=lambda kv: -kv[1]):
            names = [r["title"] for r in rows if r["slug"] == slug and r["src"] == src]
            out.append(f"- **{slug}/src/{src}** — {n}: {', '.join(names)}")

    OUT.write_text("\n".join(out) + "\n")
    write_html(rows, queued, batches, src_counts, now)
    print(f"wrote {OUT.relative_to(build.ROOT)} — {len(rows)} actionable, "
          f"{len(queued)} ticked")


def write_html(rows, queued, batches, src_counts, now):
    """The same ranking as a page, so it can be read from the dashboard rather
    than only in the repo."""
    e = build.e

    def link(r):
        key = None
        for p in build.PROJECTS:
            if p["slug"] != r["slug"]:
                continue
            loaded, _ = build.load_notes(p)
            for ex in build.all_examples(loaded[1]):
                if ex["file"] == r["file"]:
                    key = build.entry_key(ex)
        frag = ("#" + e(key)) if key else ""
        return (f'<a target="_blank" rel="noopener" '
                f'href="../{e(r["slug"])}/index.html{frag}">{e(r["title"])}</a>')

    body = [f'<p class="crumb"><a href="index.html">← Status</a></p>',
            "<h1>What to build next</h1>",
            f'<p class="sub">Ranked {len(rows)} actionable entries, {now}. The ranking '
            "is mechanical — cheapness, freshness and batching. Whether a spec is good "
            "enough to build to is a judgement, and that is what a build session brings.</p>"]
    if queued:
        body.append(f'<h3>Ticked for the next build run — {len(queued)}</h3><ul>')
        for r in queued:
            body.append(f'<li>{link(r)} <span class="dim">{e(r["paper"])}</span></li>')
        body.append("</ul>")
    body.append("<h3>Ranked</h3><table><thead><tr><th>#</th><th>Entry</th><th>Paper</th>"
                "<th>Status</th><th>Spec</th><th>Idle</th><th>Why</th></tr></thead><tbody>")
    for i, r in enumerate(rows, 1):
        body.append(f'<tr><td>{i}</td><td>{link(r)}</td><td>{e(r["paper"])}</td>'
                    f'<td>{e(r["status"])}</td><td>{r["spec_chars"]} ch</td>'
                    f'<td>{r["days_idle"]}d</td>'
                    f'<td class="dim">{e("; ".join(r["why"]))}</td></tr>')
    body.append("</tbody></table>")
    if batches:
        body.append("<h3>Worth doing together</h3><ul>")
        for (slug, src), n in sorted(batches.items(), key=lambda kv: -kv[1]):
            names = ", ".join(r["title"] for r in rows
                              if r["slug"] == slug and r["src"] == src)
            body.append(f'<li><code>{e(slug)}/src/{e(src)}</code> — {n}: {e(names)}</li>')
        body.append("</ul>")
    (HERE / "assessment.html").write_text(
        build.shell("What to build next", "\n".join(body)))


if __name__ == "__main__":
    main()
