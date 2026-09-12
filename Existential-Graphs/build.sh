#!/bin/zsh
# Assemble the single-file page from src/ and app/.
# Regenerate src/10-library.js with tools/gen.js if the proof library changes.
set -e
cd "$(dirname "$0")"
{
  echo '<!doctype html>'
  echo '<html lang="en"><head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width,initial-scale=1">'
  echo '<title>The Existential Graphs of Charles S. Peirce</title>'
  echo '<style>'; cat app/style.css; echo '</style>'
  echo '</head><body>'
  cat app/body.html
  echo '<script>'
  echo '"use strict";'
  cat src/01-core.js src/02-parse.js src/03-compile.js src/04-read.js \
      src/05-semantics.js src/06-rules.js src/07-prove.js src/08-render.js src/09-egnotation.js src/11-anim.js
  echo '/* --- Peirce'"'"'s letterforms, cut from the manuscripts --- */'
  cat src/12-hand.js
  echo '/* --- the verified proof library --- */'
  cat src/10-library.js
  cat app/ui0-editor.js app/ui1.js app/ui2.js app/ui4-exercises.js app/ui5-writ.js app/ui6-puzzle.js app/ui7-prove.js app/ui8-rules.js app/ui3.js
  echo '</script>'
  echo '</body></html>'
} > index.html
echo "built index.html"
