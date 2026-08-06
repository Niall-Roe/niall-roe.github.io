#!/usr/bin/env bash
#
# Builds the site shell — home, teaching, CV, illustrations and the 404 page —
# from the parts in this directory.
#
#   ./build.sh          write the pages
#   ./build.sh --check   say whether the written pages are behind the parts
#
# Never hand-edit a built index.html. Edit common/ or pages/ and rebuild.

set -euo pipefail
cd "$(dirname "$0")"

check=0
[ "${1:-}" = "--check" ] && check=1

stale=0

# assemble <page> <output> <base> <canonical> <title> <description>
assemble() {
  local page=$1 out=$2 base=$3 canon=$4 title=$5 desc=$6
  local tmp
  tmp=$(mktemp)

  {
    sed -e "s|{{TITLE}}|$title|g" \
        -e "s|{{DESC}}|$desc|g" \
        -e "s|{{CANON}}|$canon|g" common/head.html
    sed -e "s|{{BASE}}|$base|g" common/nav.html \
      | sed -e "s|\(data-nav=\"$page\"\)|\1 aria-current=\"page\"|"
    sed -e "s|{{BASE}}|$base|g" "pages/$page.html"
    cat common/foot.html
  } > "$tmp"

  if [ "$check" = 1 ]; then
    if [ ! -f "../$out" ] || ! cmp -s "$tmp" "../$out"; then
      echo "  STALE  $out"
      stale=1
    else
      echo "  ok     $out"
    fi
    rm -f "$tmp"
  else
    mkdir -p "$(dirname "../$out")"
    mv "$tmp" "../$out"
    chmod 644 "../$out"
    echo "  wrote  $out"
  fi
}

DESC_HOME="Niall Roe is a PhD candidate in History and Philosophy of Science at the University of Cambridge, working on the philosophy of experimentation, pragmatism, and the philosophy of statistics."

assemble home          index.html               ""    ""                "Niall Roe"                       "$DESC_HOME"
assemble teaching      teaching/index.html      "../" "teaching/"       "Teaching — Niall Roe"            "Guest lectures, teaching assistantships and Cambridge supervision topics."
assemble cv            cv/index.html            "../" "cv/"             "CV — Niall Roe"                  "Curriculum vitae for Niall Roe, University of Cambridge."
assemble illustrations illustrations/index.html "../" "illustrations/"  "Illustrations — Niall Roe"       "Interactive editions of pre-1900 papers on probability, inference and psychophysics."
assemble 404           404.html                 ""    "404.html"        "Page not found — Niall Roe"      "Page not found."

if [ "$check" = 1 ] && [ "$stale" = 1 ]; then
  echo
  echo "Site shell is behind _site/. Run ./build.sh"
  exit 1
fi
