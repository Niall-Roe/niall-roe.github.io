#!/usr/bin/env bash
# Assemble index.html from the parts in src/.
#
# Same contract as the other papers: the published page is a single
# self-contained file — no scripts, styles, fonts or data fetched at run time —
# so it works offline, over file://, and inside a sandboxed iframe.
#
# The page currently has no examples; lib.js and scaffold.js are included so
# that the first example part added to PARTS below finds the machinery ready.
#
# Usage:  ./build.sh          (writes index.html)
#         ./build.sh --check  (verifies index.html is up to date, writes nothing)

set -euo pipefail
cd "$(dirname "$0")"

PARTS=(
  src/01_head.html     # <head>, all CSS, opens .article-container
  src/02_article.html  # Peirce's text (CP 1.208-211), triggers, footnotes, colophon
  ../shared/lib.js       # SHARED maths, canvas renderer, DOM helpers
  ../shared/scaffold.js  # SHARED example framework — see shared/scaffold.js
  src/03_data.js       # verified datasets (generated from data/ — do not hand-edit)
  src/03b_images.js    # Niall's images (Petrie portrait, Delta map) as data URIs
  src/04_engine.js     # mixture-of-standards engine shared by the examples
  src/05_ex_intro.js   # ex1 (O and 0), ex2 (Petrie, the map), ex3 (the table)
  src/06_ex_sandbox.js # ex4 (copies of a standard), ex6 (Peirce's view, live table)
  src/07_ex_data.js    # ex7 (the no-gap check), ex8 (the 1926 register)
  src/08_ex_processes.js # ex9 (merge), ex12 (market), ex14 (methods), ex16 (final causes)
  src/09_ex_misc.js    # ex10 (Century), ex11 (towns), ex13 (assumption), ex15 (ToE)
  src/03c_ms_images.js # MS 427 First Attempt facsimiles (data URIs)
  src/10_ex_fa.js      # ex17 (the first attempt: tally, smooth, separate)
  src/99_close.html    # closes </body></html>
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
# The review overlay is injected at serve time and must never reach a built page.
if grep -q "review-overlay:injected-at-serve-time" index.html 2>/dev/null; then
  echo "REFUSING: review overlay code is in index.html" >&2
  exit 1
fi

echo "wrote index.html ($(wc -c < index.html | tr -d ' ') bytes)"
