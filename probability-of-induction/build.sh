#!/usr/bin/env bash
# Assemble index.html from the parts in src/.
#
# The published page is a single self-contained file: no scripts, styles, fonts
# or data are fetched at run time, so it works offline, over file://, and inside
# a sandboxed iframe. The parts exist only so the thing stays editable.
#
# Order matters. 01 opens <html><head><style> and <body>; 03 defines the maths
# and plotting helpers every example depends on; 10 closes </body></html>.
#
# Usage:  ./build.sh          (writes index.html)
#         ./build.sh --check  (verifies index.html is up to date, writes nothing)

set -euo pipefail
cd "$(dirname "$0")"

PARTS=(
  src/01_head.html     # <head>, all CSS, opens .article-container
  src/02_article.html  # Peirce's text, example containers, footnotes, colophon
  ../shared/lib.js       # SHARED maths, canvas renderer, DOM helpers
  ../shared/scaffold.js  # SHARED example framework — see shared/scaffold.js
  src/04_ex1234.js     # card-deck framework, granary numeral, examples 1-4
  src/05_ex56.js       # examples 5-6 (dice, two friends and a metal box)
  src/06_ex1418.js     # examples 14-18 (binomial expansion, urns, census)
  src/07_ex912.js      # examples 9, 12 (balancing reasons, its refutation) and 27
  src/08_ex78.js       # examples 7-8 (agreement, chance) and 26 (its logarithm)
  src/09_ex1011.js     # examples 10-11 (bag of beans, two numbers not one)
  src/10_ex1920.js     # examples 19-20 (Epimenides; the induction from five or six)
  src/11_ex21.js       # example 21 (indifference), 28 and 30 (urns), 29 (the tide)
  src/12_ex22.js       # example 22 (which bag did this coin come from)
  src/13_ex23.js       # example 23 (insisting on the shuffle)
  src/14_ex24.js       # example 24 (which way round)
  src/15_ex25.js       # example 25 (the conclusion, or the proceeding)
  src/16_ex13.js       # example 13 (colour chart), closes </body></html>
)

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
