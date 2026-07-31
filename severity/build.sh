#!/usr/bin/env bash
# Assemble index.html from the parts in src/.
#
# The published page is a single self-contained file: no scripts, styles, fonts
# or data are fetched at run time, so it works offline, over file://, and inside
# a sandboxed iframe. The parts exist only so the thing stays editable.
#
# Order matters. 01 opens <html><head><style> and <body>; 09 closes </body></html>.
#
# Usage:  ./build.sh          (writes index.html)
#         ./build.sh --check  (verifies index.html is up to date, writes nothing)

set -euo pipefail
cd "$(dirname "$0")"

PARTS=(
  src/01_head.html     # <head>, all CSS, opens .article-container
  src/02_article.html  # title, lede, scenario switcher mount, panels, footer
  src/03_lib.js        # dnorm/pnorm/qnorm + dhyper/pbinom, canvas renderer, drag, DOM helpers
  src/04_core.js       # shared state, severity thresholds, colours, scenario registry
  src/05_continuous.js # water plant + custom test (one-sided z test)
  src/06_tornado.js    # Finley's tornado forecasts, the two rates, ROC space
  src/07_tea.js        # Fisher's lady tasting tea
  src/08_compare.js    # all four scenarios on one standardized axis
  src/09_close.js      # scenario switcher wiring, initial mount, closes </body></html>
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
echo "wrote index.html ($(wc -c < index.html | tr -d ' ') bytes)"
