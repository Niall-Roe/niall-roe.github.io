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
  src/04_scaffold.js   # example framework and live numbers — SHARED VERBATIM with
                       #   the other papers on this site; do not fork it here
  src/05_laws.js       # this paper's four laws of facility, used by every example
  src/06_ex1.js        # example 1 (the quantity observed and the quantity wanted)
  src/07_ex2.js        # example 2 (the law of the facility of errors)
  src/08_data.js       # the 24 days of reaction times, from Koenker's transcription
  src/09_ex3.js        # the twenty-four days: tables, plate, one day (always open)
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
