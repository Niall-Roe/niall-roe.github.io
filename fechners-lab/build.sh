#!/usr/bin/env bash
# Assemble the pages from the parts in src/.
#
# Every published page is a single self-contained file: no scripts, styles,
# fonts or data are fetched at run time, so they work offline and over file://.
# The parts exist so the shared head, library and navigation stay in one place.
#
# Usage:  ./build.sh          (writes the pages)
#         ./build.sh --check  (verifies they are up to date, writes nothing)

set -euo pipefail
cd "$(dirname "$0")"

# out-file | page id | <title> | content part | script part
PAGES=(
  "index.html|intro|Fechner's three methods|src/00_intro.html|src/00_intro.js"
  "right-and-wrong-cases.html|rw|The method of right and wrong cases|src/01_rw.html|src/01_rw.js"
  "just-noticeable-differences.html|jnd|The method of just noticeable differences|src/02_jnd.html|src/02_jnd.js"
  "average-error.html|ae|The method of average error|src/03_ae.html|src/03_ae.js"
  "results.html|res|The three methods together|src/04_results.html|src/04_results.js"
  "try-it-yourself.html|try|Try the three methods on yourself|src/05_try.html|src/05_try.js"
)

assemble () {                      # assemble <page-id> <title> <html> <js>
  sed -e "s|__TITLE__|$2|g" -e "s|__PAGE__|$1|g" src/_head.html
  cat "$3"
  cat src/_mid.html
  cat src/03_lib.js       # shared verbatim with the other papers
  cat src/04_subject.js   # the simulated subject, sheets, calculations, store
  cat "$4"
  cat src/_foot.html
}

for spec in "${PAGES[@]}"; do
  IFS='|' read -r out id title html js <<< "$spec"
  for p in "$html" "$js"; do
    [[ -f "$p" ]] || { echo "missing part: $p" >&2; exit 1; }
  done
  if [[ "${1:-}" == "--check" ]]; then
    if assemble "$id" "$title" "$html" "$js" | diff -q - "$out" >/dev/null 2>&1; then
      echo "  ok   $out"
    else
      echo "  differs from src/ — run ./build.sh: $out" >&2; exit 1
    fi
  else
    assemble "$id" "$title" "$html" "$js" > "$out"
    echo "wrote $out ($(wc -c < "$out" | tr -d ' ') bytes)"
  fi
done
