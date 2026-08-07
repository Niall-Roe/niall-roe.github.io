#!/usr/bin/env bash
# Assemble index.html from the parts in src/.
#
# The published page is a single self-contained file: no scripts, styles, fonts
# or data are fetched at run time, so it works offline, over file://, and inside
# a sandboxed iframe. The parts exist only so the thing stays editable.
#
# src/02_article.html is GENERATED. Do not hand-edit it — the edits will be
# overwritten. Change the pipeline instead:
#
#   tools/reflow.py       raw scrape -> build/article.json      (structure)
#   tools/corrections.py  -> build/article.fixed.json           (OCR repairs)
#   tools/tables.py       the nine tables, as data              (figures)
#   tools/render.py       -> src/02_article.html                (markup)
#   tools/examples.py     triggers and containers, from ../notes/ anchors
#
# That last step is why an example's trigger is not typed into the article: the
# article is rewritten on every build, so the triggers are re-inserted each time
# from the `anchor:` and `container:` in each notes entry.
#
# Usage:  ./build.sh          (regenerates the article, writes index.html)
#         ./build.sh --check  (verifies index.html is up to date, writes nothing)
#         ./build.sh --skip-prose   (assemble only, leave 02_article.html alone)

set -euo pipefail
cd "$(dirname "$0")"

PARTS=(
  src/01_head.html     # <head>, all CSS, opens .article-container
  src/02_article.html  # GENERATED: the text, its tables, footnotes, colophon
  ../shared/lib.js       # SHARED maths, canvas renderer, DOM helpers
  ../shared/scaffold.js  # SHARED example framework — see shared/scaffold.js
  src/10_examples.js   # this paper's examples
  src/99_close.html    # </body></html>
)

if [[ "${1:-}" != "--skip-prose" && "${1:-}" != "--check" ]]; then
  python3 tools/reflow.py
  python3 tools/corrections.py
  python3 tools/render.py
  # Triggers and containers, put back after every render from the anchors in
  # ../notes/. See tools/examples.py — 02_article.html is generated, so they
  # cannot live in it.
  python3 tools/examples.py
fi

for p in "${PARTS[@]}"; do
  [[ -f "$p" ]] || { echo "missing part: $p" >&2; exit 1; }
done

if [[ "${1:-}" == "--check" ]]; then
  if cat "${PARTS[@]}" | diff -q - index.html >/dev/null 2>&1; then
    echo "index.html is up to date"
  else
    echo "index.html differs from src/ — run ./build.sh" >&2
    exit 1
  fi
  exit 0
fi

cat "${PARTS[@]}" > index.html
# Belt as well as braces on the review overlay: it is injected at serve time and
# must never reach a built page. --check would catch it, but this refuses to write
# one in the first place.
if grep -q "review-overlay:injected-at-serve-time" index.html 2>/dev/null; then
  echo "REFUSING: review overlay code is in index.html" >&2
  exit 1
fi

echo "wrote index.html ($(wc -c < index.html | tr -d ' ') bytes)"
