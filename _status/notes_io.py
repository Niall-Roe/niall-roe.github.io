#!/usr/bin/env python3
"""Reading and editing one notes entry file.

Kept apart from build.py and serve.py because this is the only code in the project
that writes into your prose, and it should be possible to read it — and test it —
without a server running.

Three rules it keeps:

  * Sections stay in canonical order, and one is created only when something is
    actually being put in it.
  * Nothing is deleted. Approve and reject move text between sections; they never
    drop it.
  * Writes are atomic (temp file then rename) and guarded by the file's mtime, so a
    concurrent session editing the same entry gets a conflict rather than a silent
    overwrite.

Run directly to execute the self-test:  python3 _status/notes_io.py
"""

import os
import re
import tempfile
from pathlib import Path

CANON = ["Text", "Suggestions", "Awaiting approval", "Completed"]

# The line a Suggestions section carries when there is nothing in it. A new note
# replaces it rather than landing underneath it.
PLACEHOLDER = re.compile(r"^[ \t]*None open\.?[ \t]*$\n?", re.M | re.I)

FRONT = re.compile(r"\A(---\n.*?\n---\n)(.*)\Z", re.S)
SEC = re.compile(r"^###(?!#)\s*(.+?)\s*$", re.M)


class Conflict(Exception):
    """The file changed underneath us."""


# ---------------------------------------------------------------- structure

def split_front(text):
    m = FRONT.match(text)
    return (m.group(1), m.group(2)) if m else ("", text)


def sections(body):
    """[(title or None, text)] in file order. The leading chunk before any heading
    keeps title None so nothing is lost on a round trip."""
    out, pos, last = [], 0, None
    for m in SEC.finditer(body):
        out.append((last, body[pos:m.start()]))
        last, pos = m.group(1), m.end()
    out.append((last, body[pos:]))
    return [(t, s) for t, s in out if t is not None or s.strip()]


def render(secs):
    parts = []
    for title, text in secs:
        if title is not None:
            parts.append("### %s\n" % title)
        t = text.strip("\n")
        if t:
            parts.append("\n" + t + "\n")
        parts.append("\n")
    return re.sub(r"\n{3,}", "\n\n", "".join(parts)).strip("\n") + "\n"


def _insert_at(secs, title):
    """Position for a new section: canonical order where both are known, else last."""
    if title not in CANON:
        return len(secs)
    want = CANON.index(title)
    for i, (t, _s) in enumerate(secs):
        if t in CANON and CANON.index(t) > want:
            return i
    return len(secs)


def append_to(body, title, text):
    text = text.strip()
    if not text:
        return body
    secs = sections(body)
    for i, (t, s) in enumerate(secs):
        if t == title:
            secs[i] = (t, (s.rstrip("\n") + "\n\n" + text).strip("\n"))
            return render(secs)
    secs.insert(_insert_at(secs, title), (title, text))
    return render(secs)


def move_all(body, src, dst, note=None):
    """Move every line of `src` into `dst`. Returns (body, moved_text). `note` is
    prepended to the moved block — used to record why something was rejected."""
    secs = sections(body)
    moved = ""
    for i, (t, s) in enumerate(secs):
        if t == src:
            moved = s.strip("\n")
            secs[i] = (t, "")
            break
    if not moved.strip():
        return body, ""

    block = (note.strip() + "\n\n" + moved) if note else moved
    out = render([(t, s) for t, s in secs if not (t == src and not s.strip())])
    return append_to(out, dst, block), moved


def get_front(front, key):
    m = re.search(r"^%s:\s*(.*)$" % re.escape(key), front, re.M)
    return m.group(1).strip().strip('"') if m else None


def set_front(front, key, value):
    line = "%s: %s" % (key, value)
    if re.search(r"^%s:.*$" % re.escape(key), front, re.M):
        return re.sub(r"^%s:.*$" % re.escape(key), line, front, count=1, flags=re.M)
    return front.replace("---\n", "---\n" + line + "\n", 1) if front.startswith("---\n") \
        else front


# ------------------------------------------------------------------- files

def safe_path(root, rel):
    """Only ever `<paper>/notes/<name>.md` inside the repository. Anything with a
    traversal, a different suffix, or a different home is refused."""
    p = (Path(root) / rel).resolve()
    if not str(p).startswith(str(Path(root).resolve()) + os.sep):
        raise ValueError("outside the repository")
    if p.suffix != ".md" or p.parent.name != "notes":
        raise ValueError("not a notes entry")
    if not p.is_file():
        raise ValueError("no such entry")
    return p


def write_atomic(path, text, expect_mtime=None):
    path = Path(path)
    if expect_mtime is not None and abs(path.stat().st_mtime - float(expect_mtime)) > 1e-6:
        raise Conflict("the file changed since you opened it")
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as fh:
            fh.write(text)
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise
    return path.stat().st_mtime


# -------------------------------------------------------------- operations

def add_note(path, text, expect_mtime=None):
    raw = Path(path).read_text()
    front, body = split_front(raw)
    secs = sections(body)
    for i, (t, s) in enumerate(secs):
        if t == "Suggestions" and PLACEHOLDER.search(s):
            secs[i] = (t, PLACEHOLDER.sub("", s))
            body = render(secs)
            break
    body = append_to(body, "Suggestions", text)
    # An open suggestion means the entry is no longer settled: done goes back to
    # building so the marker reads yellow, not green. Other statuses already say
    # work is open (or deliberately parked) and are left alone.
    if get_front(front, "status") == "done":
        front = set_front(front, "status", "building")
    return write_atomic(path, front + body, expect_mtime)


def approve(path, expect_mtime=None):
    raw = Path(path).read_text()
    front, body = split_front(raw)
    body, moved = move_all(body, "Awaiting approval", "Completed")
    if not moved:
        raise ValueError("nothing is awaiting approval")
    front = set_front(front, "status", "done")
    return write_atomic(path, front + body, expect_mtime)


def reject(path, reason, expect_mtime=None):
    raw = Path(path).read_text()
    front, body = split_front(raw)
    note = "[rejected] " + reason.strip() if reason.strip() else "[rejected]"
    body, moved = move_all(body, "Awaiting approval", "Suggestions", note=note)
    if not moved:
        raise ValueError("nothing is awaiting approval")
    front = set_front(front, "status", "building")
    return write_atomic(path, front + body, expect_mtime)


# ------------------------------------------------------------------- test

def _selftest():
    src = """---
number: 12
status: awaiting
---

### Text

"the quoted passage"

### Suggestions

an older open item

### Awaiting approval

#### the table drives off the sliders
what was built this pass
"""
    front, body = split_front(src)
    assert get_front(front, "status") == "awaiting"

    b = append_to(body, "Suggestions", "a new note from the page")
    assert "an older open item" in b and "a new note from the page" in b
    assert b.index("an older open item") < b.index("a new note from the page")

    b2, moved = move_all(body, "Awaiting approval", "Completed")
    assert "what was built this pass" in moved
    assert "### Completed" in b2
    assert b2.index("### Suggestions") < b2.index("### Completed")
    assert "what was built this pass" in b2
    assert "### Awaiting approval" not in b2

    b3, _ = move_all(body, "Awaiting approval", "Suggestions", note="[rejected] wrong colour")
    assert "[rejected] wrong colour" in b3 and "what was built this pass" in b3

    # a section that does not exist yet lands in canonical order
    b4 = append_to("### Text\n\nx\n", "Completed", "done thing")
    assert b4.index("### Text") < b4.index("### Completed")
    b5 = append_to("### Completed\n\ny\n", "Suggestions", "s")
    assert b5.index("### Suggestions") < b5.index("### Completed")

    # round trip loses nothing
    assert "the quoted passage" in render(sections(body))

    f = set_front(front, "status", "done")
    assert get_front(f, "status") == "done"

    # a note replaces the "None open." placeholder instead of landing under it,
    # and flips a done entry back to building — end to end through add_note
    import shutil
    tmp = Path(tempfile.mkdtemp()) / "notes"
    tmp.mkdir()
    entry = tmp / "00-test.md"
    entry.write_text("---\nstatus: done\n---\n### Suggestions\n\nNone open.\n\n"
                     "### Completed\n\nold work\n")
    add_note(entry, "a fresh suggestion")
    out = entry.read_text()
    assert "None open" not in out
    assert "a fresh suggestion" in out and "old work" in out
    assert get_front(split_front(out)[0], "status") == "building"
    # a second note appends after the first, and a building entry stays building
    add_note(entry, "a second thought")
    out = entry.read_text()
    assert out.index("a fresh suggestion") < out.index("a second thought")
    assert get_front(split_front(out)[0], "status") == "building"
    shutil.rmtree(tmp.parent)

    print("notes_io self-test: all assertions passed")


if __name__ == "__main__":
    _selftest()
