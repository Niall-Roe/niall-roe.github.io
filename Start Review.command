#!/bin/bash
# Double-click this to start the local review server and open the dashboard.
#
# It serves this repository at http://127.0.0.1:8787 and injects the review overlay
# into the paper pages as they are sent — the files on disk are never modified.
# Bound to this machine only; nothing goes near GitHub.
#
# Close the Terminal window, or press Ctrl-C, to stop it.

cd "$(dirname "$0")" || exit 1

echo
echo "  niall-roe.github.io — review server"
echo "  $(pwd)"
echo

exec python3 _status/serve.py
