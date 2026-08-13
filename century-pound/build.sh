#!/usr/bin/env bash
# Assemble index.html from the parts in src/. Facsimile reference page — no
# scripts; the images are data URIs so the page stays self-contained.
set -euo pipefail
cd "$(dirname "$0")"
PARTS=( src/01_head.html src/02_article.html src/99_close.html )
for p in "${PARTS[@]}"; do [[ -f "$p" ]] || { echo "missing part: $p" >&2; exit 1; }; done
if [[ "${1:-}" == "--check" ]]; then
  cat "${PARTS[@]}" | diff -q - index.html >/dev/null 2>&1 \
    && echo "index.html is up to date" || { echo "index.html differs from src/ — run ./build.sh" >&2; exit 1; }
  exit 0
fi
cat "${PARTS[@]}" > index.html
echo "wrote index.html ($(wc -c < index.html | tr -d ' ') bytes)"
