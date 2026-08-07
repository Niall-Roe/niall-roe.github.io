#!/usr/bin/env python3
"""Local review server. Serves this repository and injects the review overlay into
paper pages as they are sent, so the files on disk are never modified.

    python3 _status/serve.py

Then open the URL it prints. Every relative link from the dashboard inherits this
origin, so the whole workspace is review-enabled without choosing per page.

Bound to 127.0.0.1 only. Nothing here is reachable from another machine, and none of
it goes near GitHub — publishing is still commit and push.

The overlay shows each example's notes entry beside the example and can write back
to it: leaving a suggestion, approving what is awaiting approval, or rejecting it with
a reason. Every write goes through notes_io, which keeps the sections in order, never
deletes anything, and refuses a write whose file has changed underneath it.
"""

import json
import sys
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import notes_io  # noqa: E402

ROOT = build.ROOT
HERE = Path(__file__).resolve().parent
PORT = 8787

# The marker build.sh greps for. If this string ever appears in a built index.html,
# the review overlay has leaked into a page that could be published.
MARKER = "<!-- review-overlay:injected-at-serve-time -->"


def inject_snippet():
    """The script tag carries review.js's mtime, so an edit to the overlay is a new
    URL and a browser's cached copy of the old one is never used."""
    v = int((HERE / "review.js").stat().st_mtime)
    return MARKER + '\n<script src="/_status/review.js?v=%d" defer></script>\n' % v

PAPERS = {p["slug"] for p in build.PROJECTS}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, fmt, *args):
        if "/_review/" in self.path or self.path.endswith(".html"):
            sys.stderr.write(f"  {self.command} {self.path}\n")

    def end_headers(self):
        # The overlay and dashboard must never be served stale: an old cached
        # review.js is invisible breakage, not a performance win.
        if self.path.startswith(("/_status/", "/_review/")):
            self.send_header("Cache-Control", "no-store")
        if self.path.startswith("/_review/ping"):
            # So a page on another local server can ask whether the review server
            # is up. The reply says {"ok": true} and nothing else, and the server
            # itself is loopback-bound.
            self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    # -- routes ------------------------------------------------------------

    def do_GET(self):
        path = urlparse(self.path).path

        if path.startswith("/_review/notes/"):
            return self.notes_json(path.rsplit("/", 1)[-1])
        if path == "/_review/ping":
            return self.send_json({"ok": True, "port": PORT})

        # The dashboard regenerates on request, so it is never stale while the
        # server is up — which is the whole point when several sessions are editing.
        if path in ("/_status/", "/_status/index.html") or path.startswith("/_status/notes-"):
            try:
                build.main()
            except Exception as exc:               # never let a build error 500 the page
                sys.stderr.write(f"  ! dashboard rebuild failed: {exc}\n")
        if path == "/_status/assessment.html":
            try:
                import assess
                assess.main()
            except Exception as exc:
                sys.stderr.write(f"  ! assessment rebuild failed: {exc}\n")

        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if not path.startswith("/_review/"):
            return self.send_error(404)
        try:
            n = int(self.headers.get("Content-Length") or 0)
            req = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self.send_json({"error": "bad request body"}, 400)

        action = path.rsplit("/", 1)[-1]

        # Creating an entry has no file yet, so it is handled before the lookup.
        if action == "add":
            slug = req.get("slug") or ""
            if slug not in PAPERS:
                return self.send_json({"error": "unknown paper"}, 404)
            try:
                p = notes_io.create_entry(ROOT / slug / "notes",
                                          req.get("anchor") or "",
                                          req.get("title") or "",
                                          req.get("note") or "")
            except ValueError as exc:
                return self.send_json({"error": str(exc)}, 400)
            except Exception as exc:
                sys.stderr.write("  ! create failed: %r\n" % (exc,))
                return self.send_json({"error": "create failed"}, 500)
            sys.stderr.write("  created %s\n" % p.name)
            return self.send_json({"ok": True,
                                   "file": str(p.relative_to(ROOT))})

        try:
            target = notes_io.safe_path(ROOT, req.get("file", ""))
            mtime = req.get("mtime")
            if action == "note":
                text = (req.get("text") or "").strip()
                if not text:
                    return self.send_json({"error": "empty note"}, 400)
                new_mtime = notes_io.add_note(target, text, mtime)
            elif action == "approve":
                new_mtime = notes_io.approve(target, mtime)
            elif action == "reject":
                new_mtime = notes_io.reject(target, req.get("reason") or "", mtime)
            elif action == "queue":
                new_mtime = notes_io.set_queued(target, bool(req.get("queued")), mtime)
            else:
                return self.send_json({"error": "unknown action"}, 404)
        except notes_io.Conflict as exc:
            # Another session wrote first. Say so rather than merging blind.
            return self.send_json({"error": str(exc), "conflict": True}, 409)
        except ValueError as exc:
            return self.send_json({"error": str(exc)}, 400)
        except Exception as exc:
            sys.stderr.write("  ! write failed: %r\n" % (exc,))
            return self.send_json({"error": "write failed"}, 500)

        sys.stderr.write("  wrote %s (%s)\n" % (req.get("file"), action))
        return self.send_json({"ok": True, "mtime": new_mtime})

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def notes_json(self, slug):
        """Everything the overlay needs for one paper: each entry keyed by the
        container id it belongs to."""
        p = next((x for x in build.PROJECTS if x["slug"] == slug), None)
        if not p:
            return self.send_json({"error": "unknown paper"}, 404)
        loaded, source = build.load_notes(p)
        if not loaded:
            return self.send_json({"entries": {}, "source": None})

        _pre, groups = loaded
        entries = {}
        for ex in build.all_examples(groups):
            # Addressable either by container id (exact, but only once the example is
            # built) or by the anchor passage — the `anchor:` frontmatter where it is
            # set, else the quote in the entry's Text section, which is the same
            # passage by convention.
            anchor = ex.get("anchor") or build.text_quote(ex["raw"])
            key = build.entry_key(ex)
            if not key:
                continue
            f = ROOT / ex["file"] if ex.get("file") else None
            entries[key] = {
                "container": ex.get("container"),
                "mtime": f.stat().st_mtime if f and f.exists() else None,
                "anchor": anchor,
                "number": ex.get("num"),
                "title": ex.get("title") or ex.get("heading"),
                "status": ex["status"],
                "statusLabel": build.STATUS[ex["status"]][0],
                "sections": build.sections_of(ex["raw"]),
                "hasSuggestion": has_open_suggestion(ex["raw"]),
                "blocked": bool(ex.get("blocked")),
                "queued": bool(ex.get("queued")),
                # only worth offering the tick where there is something to build
                "actionable": (not ex.get("blocked")
                               and ex["status"] in ("building", "early", "blank")
                               and build.has_instruction(ex)),
                "file": ex.get("file"),
            }
        return self.send_json({"entries": entries, "source": source,
                               "slug": slug, "title": p["title"]})

    # -- injection ---------------------------------------------------------

    def send_head(self):
        """Serve HTML with the overlay script appended. Everything else unchanged."""
        path = urlparse(self.path).path
        if not self.wants_overlay(path):
            return super().send_head()

        f = ROOT / path.lstrip("/")
        if path.endswith("/"):
            f = f / "index.html"
        if not f.is_file():
            return super().send_head()

        raw = f.read_bytes()
        inject = inject_snippet().encode()
        if MARKER.encode() in raw:                 # already there: serve unchanged
            body = raw
        elif b"</body>" in raw:
            body = raw.replace(b"</body>", inject + b"</body>", 1)
        else:
            body = raw + inject

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        import io
        return io.BytesIO(body)

    def wants_overlay(self, path):
        if not path.endswith((".html", "/")):
            return False
        first = path.lstrip("/").split("/")[0]
        return first in PAPERS


def has_open_suggestion(raw):
    """Whether this entry has anything actually open in Suggestions — so the
    margin marker can say "you have already commented here" while cruising, and
    not merely "this is unfinished"."""
    for s in build.sections_of(raw):
        if (s["title"] or "").strip().lower() == "suggestions":
            return bool(notes_io.PLACEHOLDER.sub("", s["text"]).strip())
    return False


def main():
    url = f"http://127.0.0.1:{PORT}/_status/index.html"
    try:
        httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError as exc:
        import errno
        if exc.errno != errno.EADDRINUSE:
            raise
        # The port is taken. If it is a review server from an earlier double-click,
        # there is nothing to fix — just open the dashboard on it.
        try:
            from urllib.request import urlopen
            with urlopen(f"http://127.0.0.1:{PORT}/_review/ping", timeout=2) as r:
                running = b'"ok"' in r.read()
        except Exception:
            running = False
        if running:
            print(f"\n  A review server is already running.\n\n    {url}\n")
            if "--no-open" not in sys.argv:
                webbrowser.open(url)
            return
        print(f"\n  Port {PORT} is in use by something that is not the review server.")
        print("  Quit whatever holds it (or restart the machine) and try again.\n")
        sys.exit(1)
    print(f"\n  Review server running.\n\n    {url}\n")
    print("  Bound to 127.0.0.1 — this machine only. Ctrl-C to stop.\n")
    if "--no-open" not in sys.argv:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.\n")


if __name__ == "__main__":
    main()
