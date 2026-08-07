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

# The line a section carries when there is nothing in it ("None open." in
# Suggestions, "None yet." in Completed). Content arriving in a section replaces
# its placeholder rather than landing underneath it.
PLACEHOLDER = re.compile(r"^[ \t]*None (?:open|yet)\.?[ \t]*$\n?", re.M | re.I)

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
            s = PLACEHOLDER.sub("", s)
            # Suggestions accumulates in plain prose with no structural markers
            # between one sitting and the next, so an old build question and a
            # fresh note read as one unbroken paragraph. A bare rule between them
            # gives the panel something to key "what's new" off, and reads as an
            # ordinary section break to anyone opening the file directly.
            sep = "\n\n---\n\n" if title == "Suggestions" and s.strip() else "\n\n"
            secs[i] = (t, (s.rstrip("\n") + sep + text).strip("\n"))
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


def drop_front(front, key):
    """Remove a frontmatter line entirely. Absent is the falsy state for flags,
    so clearing one means deleting the line rather than writing `false`."""
    return re.sub(r"^%s:.*\n?" % re.escape(key), "", front, count=1, flags=re.M)


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
    body = append_to(body, "Suggestions", text)
    # A note means the ball is back in the build's court, whatever it was doing
    # before: done was settled and no longer is; awaiting was sitting on your
    # desk for a sign-off you have now answered with more instructions instead.
    # Early/blank/parked already say nothing is built, and stay as they are.
    if get_front(front, "status") in ("done", "awaiting"):
        front = set_front(front, "status", "building")
    # A question was put to Niall and he has just answered it, so the entry is no
    # longer blocked on him — whatever he said is now mine to work to.
    front = drop_front(front, "blocked")
    return write_atomic(path, front + body, expect_mtime)


def set_queued(path, on, expect_mtime=None):
    """Tick or untick an entry for the next build run. A flag Niall sets while
    reviewing, so a build run has an explicit list rather than my guess at one."""
    raw = Path(path).read_text()
    front, body = split_front(raw)
    front = set_front(front, "queued", "true") if on else drop_front(front, "queued")
    return write_atomic(path, front + body, expect_mtime)


def approve(path, expect_mtime=None):
    raw = Path(path).read_text()
    front, body = split_front(raw)
    body, moved = move_all(body, "Awaiting approval", "Completed")
    if not moved:
        raise ValueError("nothing is awaiting approval")
    front = set_front(front, "status", "done")
    front = drop_front(front, "queued")        # built and signed off; nothing queued
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


def create_entry(notes_dir, anchor, title="", note=""):
    """A new example entry from a passage selected on the page. Named and shaped
    per CONVENTIONS.md: next reading position, Text section quoting the anchor,
    the note (if any) as the first suggestion. Returns the new file's Path."""
    d = Path(notes_dir)
    if not d.is_dir():
        raise ValueError("no notes directory for this paper")
    anchor = re.sub(r"\s+", " ", anchor).replace('"', "'").strip()
    if len(anchor) < 25:
        raise ValueError("select at least a full sentence to anchor on")
    title = re.sub(r"\s+", " ", title).strip()
    note = note.strip()

    positions = [int(m.group(1)) for f in d.glob("*.md")
                 if (m := re.match(r"^(\d+)", f.name))]
    nn = (max(positions) + 1) if positions else 0
    slug = re.sub(r"[^a-z0-9]+", "-", (title or anchor).lower()).strip("-")[:48] \
        or "example"
    path = d / ("%02d-new-example-%s.md" % (nn, slug))
    if path.exists():
        raise ValueError("an entry with that name already exists")

    heading = "New example — " + (title or slug.replace("-", " "))
    front = ['---', 'position: %d' % nn]
    if title:
        front.append('title: "%s"' % title.replace('"', "'"))
    front += ['status: %s' % ("early" if note else "blank"),
              'anchor: "%s"' % anchor,
              'heading: "%s"' % heading.replace('"', "'"), '---']
    body = "### Text\n\n\"%s\"\n\n### Suggestions\n\n%s\n" % (
        anchor, note or "None open.")
    write_atomic(path, "\n".join(front) + "\n" + body)
    return path


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

    # approving into a Completed that says "None yet." replaces the placeholder
    b2b, _ = move_all("### Awaiting approval\n\nbuilt thing\n\n### Completed\n\nNone yet.\n",
                      "Awaiting approval", "Completed")
    assert "None yet" not in b2b and "built thing" in b2b
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
    # a bare rule separates it from what was already open, so it never reads as
    # a continuation of the older text — but the very first note in an empty
    # section gets no leading divider, since there is nothing to separate from
    assert "\n\n---\n\n" in out
    assert not out.split("### Suggestions", 1)[1].lstrip().startswith("---")
    shutil.rmtree(tmp.parent)

    # a note on an awaiting entry also bumps it back to building — the ball is
    # back in the build's court, not still sitting on the reviewer's desk
    tmp3 = Path(tempfile.mkdtemp()) / "notes"
    tmp3.mkdir()
    entry3 = tmp3 / "00-test.md"
    entry3.write_text("---\nstatus: awaiting\n---\n### Suggestions\n\nNone open.\n\n"
                      "### Awaiting approval\n\nbuilt thing\n")
    add_note(entry3, "actually, one more change")
    assert get_front(split_front(entry3.read_text())[0], "status") == "building"
    shutil.rmtree(tmp3.parent)

    # answering a blocked entry unblocks it: the flag line goes entirely
    tmp4 = Path(tempfile.mkdtemp()) / "notes"
    tmp4.mkdir()
    entry4 = tmp4 / "00-test.md"
    entry4.write_text("---\nblocked: true\nstatus: early\n---\n### Suggestions\n\n"
                      "[from the build] which passage is this?\n")
    add_note(entry4, "the one about the tides")
    out4 = entry4.read_text()
    assert "blocked" not in out4.split("---")[1]
    assert "the one about the tides" in out4
    assert get_front(split_front(out4)[0], "status") == "early"

    # queued ticks on and off, and approving clears it
    set_queued(entry4, True)
    assert get_front(split_front(entry4.read_text())[0], "queued") == "true"
    set_queued(entry4, False)
    assert "queued" not in split_front(entry4.read_text())[0]
    entry4.write_text("---\nqueued: true\nstatus: awaiting\n---\n"
                      "### Awaiting approval\n\nbuilt thing\n")
    approve(entry4)
    front4 = split_front(entry4.read_text())[0]
    assert "queued" not in front4 and get_front(front4, "status") == "done"
    shutil.rmtree(tmp4.parent)

    # create_entry: numbered after the last, shaped per the convention
    tmp2 = Path(tempfile.mkdtemp()) / "notes"
    tmp2.mkdir()
    (tmp2 / "07-existing.md").write_text("---\nstatus: done\n---\n")
    p = create_entry(tmp2, 'A passage of "the article" long enough to anchor on.',
                     title="The new one", note="show the thing")
    assert p.name == "08-new-example-the-new-one.md"
    raw = p.read_text()
    front, body = split_front(raw)
    assert get_front(front, "status") == "early"
    assert get_front(front, "position") == "8"
    assert "'the article'" in get_front(front, "anchor")
    assert "### Text" in body and "### Suggestions" in body and "show the thing" in body
    p2 = create_entry(tmp2, "Another passage long enough to anchor an entry on.")
    assert p2.name.startswith("09-") and get_front(split_front(p2.read_text())[0],
                                                   "status") == "blank"
    try:
        create_entry(tmp2, "too short")
        assert False, "short anchor accepted"
    except ValueError:
        pass
    shutil.rmtree(tmp2.parent)

    print("notes_io self-test: all assertions passed")


if __name__ == "__main__":
    _selftest()
