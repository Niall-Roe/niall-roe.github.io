#!/usr/bin/env bash
# Assemble index.html from the parts in src/.
#
# The published page is a single self-contained file: no scripts, styles, fonts
# or data are fetched at run time, so it works offline, over file://, and inside
# a sandboxed iframe. The parts exist only so the thing stays editable.
#
# This memoir is set as text alone — no interactive examples — so unlike the
# Probability of Induction edition there is no JavaScript in the page at all.
# src/03_lib.js and src/04_scaffold.js are the plotting and example machinery,
# carried over but deliberately NOT assembled; add them back before 99 if the
# paper ever grows demonstrations.
#
# src/02_article.html is GENERATED. Do not hand-edit it — the edits will be
# overwritten. Change the pipeline instead:
#
#   tools/reflow.py       raw scrape -> build/article.json      (structure)
#   tools/corrections.py  -> build/article.fixed.json           (OCR repairs)
#   tools/tables.py       the nine tables, as data              (figures)
#   tools/render.py       -> src/02_article.html                (markup)
#
# Usage:  ./build.sh          (regenerates the article, writes index.html)
#         ./build.sh --check  (verifies index.html is up to date, writes nothing)
#         ./build.sh --skip-prose   (assemble only, leave 02_article.html alone)

set -euo pipefail
cd "$(dirname "$0")"

PARTS=(
  src/01_head.html     # <head>, all CSS, opens .article-container
  src/02_article.html  # GENERATED: the text, its tables, footnotes, colophon
  src/99_close.html    # </body></html>
)

if [[ "${1:-}" != "--skip-prose" && "${1:-}" != "--check" ]]; then
  python3 tools/reflow.py
  python3 tools/corrections.py
  python3 tools/render.py
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
echo "wrote index.html ($(wc -c < index.html | tr -d ' ') bytes)"
