#!/usr/bin/env bash
# Assemble index.html from the parts in src/.
#
# The published page is a single self-contained file: no scripts, styles, fonts
# or data are fetched at run time, so it works offline, over file://, and inside
# a sandboxed iframe. The parts exist only so the thing stays editable.
#
# Order matters. 01 opens <html><head><style>, the swirl symbol and
# .article-container; 03 defines the maths and plotting helpers every example
# depends on; 04 the example scaffolding and the shared laws of error; 99 closes
# </body></html>.
#
# Usage:  ./build.sh          (writes index.html)
#         ./build.sh --check  (verifies index.html is up to date, writes nothing)

set -euo pipefail
cd "$(dirname "$0")"

PARTS=(
  src/01_head.html     # <head>, all CSS, the peirce-swirl symbol, opens .article-container
  src/02_article.html  # Peirce's text, example containers, footnotes
  src/03_lib.js        # dnorm/pnorm/qnorm, the canvas renderer, DOM helpers
  src/04_scaffold.js   # example framework, live numbers, the shared laws of error
  src/05_ex1.js        # example 1 (the quantity observed and the quantity wanted)
  src/06_ex2.js        # example 2 (the law of the facility of errors)
  src/99_tail.html     # closes </div></body></html>
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
