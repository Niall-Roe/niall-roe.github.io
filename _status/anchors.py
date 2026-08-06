#!/usr/bin/env python3
"""Record each notes entry's anchor passage in its frontmatter as `anchor:`.

Every entry quotes the sentence it hangs off — that is the convention already. This
lifts that quote into frontmatter so the review overlay can find the passage in the
article and put a marker beside it, including for examples that do not exist yet and
so have no container id to address.

Re-runnable. It reports, per entry, whether the recorded anchor can still be located
in the article, which is also how anchor drift shows up: edit the sentence and the
quote stops matching, and you get told rather than the marker silently moving.

Usage:  python3 _status/anchors.py [--write]
"""

import html as _html
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

ROOT = build.ROOT

# Fold the typography apart: the notes are typed with straight quotes and hyphens,
# the article is set with curly quotes and em dashes, and neither is wrong.
FOLD = {
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "-", "‑": "-", " ": " ",
    "…": "...",
}


def norm(s):
    for k, v in FOLD.items():
        s = s.replace(k, v)
    return re.sub(r"\s+", " ", s).strip()


def article_text(slug):
    f = ROOT / slug / "src" / "02_article.html"
    if not f.exists():
        return ""
    raw = f.read_text(errors="replace")
    raw = re.sub(r"<(script|style)\b.*?</\1>", " ", raw, flags=re.S | re.I)
    # Inline tags close up (sub/sup/spans sit inside words and formulas); block tags
    # become a space so words either side do not run together.
    raw = re.sub(r"</?(?:span|sub|sup|em|i|b|strong|a|mark|abbr)\b[^>]*>", "", raw, flags=re.I)
    txt = re.sub(r"<[^>]+>", " ", raw)
    return norm(_html.unescape(txt))


def candidate_quotes(body):
    """Every quotation in the entry that is long enough to identify a passage, in
    preference order: the `### Text` section first, since that is where the
    convention puts the anchor, then the rest of the body.

    All of them are returned rather than one being guessed at, because the caller
    can simply try each against the article and keep the first that is really there.
    That is more robust than any rule for picking the anchor out, and it costs a
    handful of string searches."""
    m = re.search(r"^###\s*Text\s*$(.*?)(?=^###|\Z)", body, re.M | re.S)
    scopes = ([m.group(1)] if m else []) + [body]

    seen, out = set(), []
    for scope in scopes:
        for q in re.findall(r'["\u201c]([^"\u201d]{30,})["\u201d]', scope, re.S):
            q = norm(q)
            if q and q not in seen:
                seen.add(q)
                out.append(q)
    return out


def locate(quote, haystack):
    """The longest prefix of the quote that appears in the article, or None. Notes
    quotes are often elided mid-sentence with an ellipsis, so a prefix match is the
    realistic test rather than the whole string."""
    if not quote:
        return None
    for n in (len(quote), 160, 120, 90, 60, 40):
        frag = quote[:n].rstrip(" .…")
        if len(frag) < 30:
            break
        if frag in haystack:
            return frag
    return None


def main():
    write = "--write" in sys.argv
    grand = [0, 0, 0]

    for p in build.PROJECTS:
        d = ROOT / p["slug"] / "notes"
        if not d.is_dir():
            continue
        hay = article_text(p["slug"])
        found = missing = noquote = 0
        misses = []

        for f in sorted(d.glob("*.md")):
            meta, body = build.read_front(f.read_text(errors="replace"))
            if meta.get("preamble") or meta.get("group_heading"):
                continue

            cands = candidate_quotes(body)
            if not cands:
                noquote += 1
                continue
            frag = next((r for r in (locate(c, hay) for c in cands) if r), None)
            if not frag:
                missing += 1
                misses.append((f.name, cands[0][:60]))
                continue
            found += 1

            if write and meta.get("anchor") != frag:
                text = f.read_text(errors="replace")
                line = 'anchor: "%s"' % frag.replace('"', "'")
                if re.search(r"^anchor: .*$", text, re.M):
                    text = re.sub(r"^anchor: .*$", line, text, count=1, flags=re.M)
                else:
                    text = re.sub(r"^(status: .*)$", r"\1\n" + line, text,
                                  count=1, flags=re.M)
                f.write_text(text)

        total = found + missing + noquote
        print(f"\n=== {p['title']}")
        print(f"    {found}/{total} anchors locate in the article"
              f"   ({missing} quoted but not found, {noquote} with no quote)")
        for name, q in misses[:4]:
            print(f"      not found: {name}  “{q}…”")
        grand[0] += found; grand[1] += missing; grand[2] += noquote

    print(f"\nTotal: {grand[0]} located, {grand[1]} quoted-but-missing, "
          f"{grand[2]} without a quote.")
    if not write:
        print("Dry run — re-run with --write to record them.")


if __name__ == "__main__":
    main()
