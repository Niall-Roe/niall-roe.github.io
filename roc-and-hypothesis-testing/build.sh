#!/usr/bin/env bash
# Assemble index.html from the parts in src/.
#
# The published page is a single self-contained file: no scripts, styles, fonts
# or data are fetched at run time, so it works offline, over file://, and inside
# a sandboxed iframe. The parts exist only so the thing stays editable.
#
# Order matters. 01 opens <html><head><style> and <body>; 07 closes </body></html>.
#
# Usage:  ./build.sh          (writes index.html)
#         ./build.sh --check  (verifies index.html is up to date, writes nothing)

set -euo pipefail
cd "$(dirname "$0")"

PARTS=(
  src/01_head.html    # <head>, all CSS, opens .article-container
  src/02_article.html # title, mode/tab switcher mounts, footer
  src/03_lib.js       # pnorm/qnorm/dnorm/rnorm, canvas renderer, DOM/control helpers
  src/04_core.js      # shared state + label tables + solver + metrics (the one engine)
  src/05_params.js    # Parameters tab
  src/06_sim.js       # Simulation tab (SDT trial stream / NP sampling + reality)
  src/07_severity.js  # Severity tab (after Mayo)
  src/08_compare.js   # Comparison mode: same numbers, both vocabularies
  src/09_close.js     # mode/tab wiring, initial mount, closes </body></html>
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
