#!/usr/bin/env python3
"""Turn the harvested manuscript letterforms into a table the page can draw.

Reads the manifest produced by the harvest, keeps only marks that were looked
at and found to be the right letter AND whose writing line was measured with
confidence, normalises each one so that its baseline sits at y=0, and writes a
compact JavaScript table.

The table is scan-derived. Redistribution rights for the Houghton digitisations
are unresolved, so this writes wherever it is told and nothing is put into src/
or into index.html until that is settled. Run:

    python3 tools/hand-glyphs.py <manifest.json> <out.js> [max-variants]
"""
import json, os, re, sys, collections

# every character the page ever draws inside a graph
# Every letter and digit. An earlier version of this listed only the
# characters the page happened to draw at the time, and silently dropped U and
# W when the example wall grew.
WANTED = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ") | set("abcdefghijklmnopqrstuvwxyz") | set("0123456789")
NUM = re.compile(r'-?\d+(?:\.\d+)?')


def short(v):
    """Two decimals at most, and no trailing .0 — the table is embedded."""
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return s if s not in ('', '-0') else '0'


def shift_path(d, dy):
    """Move a path up so the writing line is y=0. Coordinates alternate x,y."""
    out, i = [], 0
    for tok in re.split(r'([MLQCZmlqczHhVv])', d):
        if not tok:
            continue
        if tok.strip() in 'MLQCZmlqczHhVv':
            out.append(tok)
            i = 0
            continue
        nums = NUM.findall(tok)
        moved = []
        for k, n in enumerate(nums):
            v = float(n)
            moved.append(short(v if (i + k) % 2 == 0 else v - dy))
        out.append(' '.join(moved) if moved else tok)
        i += len(nums)
    return ''.join(out).replace('  ', ' ').strip()


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    man_path, out_path = sys.argv[1], sys.argv[2]
    cap = int(sys.argv[3]) if len(sys.argv) > 3 else 3
    root = os.path.dirname(os.path.abspath(man_path))
    man = json.load(open(man_path))

    by = collections.defaultdict(list)
    for gl in man['glyphs']:
        if gl['char'] not in WANTED:
            continue
        if gl.get('eye_check') != 'good' or not gl.get('baseline_confident'):
            continue
        by[gl['char']].append(gl)

    # A capital has no descender, so ink sitting well below the writing line
    # means the baseline was mismeasured; and a mark far from the height its
    # case implies is usually a joined pair taken for one letter. Both are
    # rejected here rather than drawn, and both are reported.
    # Which letters drop below the writing line is a fact about the hand, not
    # about type: Peirce's capital G swings a tail under the line, and so do
    # his J and Q. The harvest decides this per character and says so in
    # baseline_source, so that judgement is used here rather than a second,
    # conflicting one of my own.
    # Which letters drop below the line in this hand, for marks whose entry
    # does not say. Peirce's capital G, J, Q, Y and Z all carry a tail under
    # the writing line, and his Q carries a long one.
    DROPS = set('GJQYZgjpqy9')

    def descends(gl, ch):
        note = gl.get('baseline_source') or ''
        if 'can descend' in note:
            return True
        if 'no de' in note:            # the entry says this one does not
            return False
        return ch in DROPS

    def extent(d):
        ys, k = [], 0
        for t in re.split(r'([A-Za-z])', d):
            if not t or t.strip() in 'MLQCZmlqczHhVv':
                k = 0
                continue
            ns = NUM.findall(t)
            for j, n in enumerate(ns):
                if (k + j) % 2 == 1:
                    ys.append(float(n))
            k += len(ns)
        return (min(ys), max(ys)) if ys else (0.0, 0.0)

    # How tall the letter should stand above the writing line, as a fraction
    # of an em. Not every mark could be scaled by the harvest — a letter with
    # no measurable x-height has none to scale by — so each is set to its own
    # proper height here, measured from the writing line to the top of its ink.
    ASCEND = set('bdfhklt')
    def target_height(ch):
        if ch.isupper() or ch.isdigit():
            return 0.70
        return 0.72 if ch in ASCEND else 0.48

    def sane(ch, d, em, drops):
        top, bot = extent(d)
        if top == bot == 0:
            return 'no outline'
        # A Q tail runs long; and even a letter that does not descend will
        # dip a little, since the foot of an R or a K is a pen stroke and not
        # a typographer's line. What this catches is a baseline in the wrong
        # place, which showed as 25 to 87 units, not as a flick of 11.
        below = em * (0.45 if drops else 0.14)
        if bot > below:
            return f'{bot:.0f} units below the writing line'
        if -top < 1:
            return 'no ink above the writing line'
        return None

    def subpaths(d):
        """A traced mark is one path with one subpath per blob of ink."""
        out, cur = [], ''
        for tok in re.split(r'(?=[Mm])', d):
            if tok.strip():
                out.append(tok)
        return out or [d]

    def deblob(d, em, drops):
        """Drop ink that is not part of the letter.

        A crop often catches a fragment of the line above or below — a comma,
        the top of an ascender, a stray dot. Those trace as their own detached
        subpath, and a blob lying wholly outside the band the letter occupies
        is not the letter. Only whole detached pieces are removed; nothing that
        touches the letter's own band is touched.
        """
        parts = subpaths(d)
        if len(parts) < 2:
            return d, 0
        # the letter is the tallest piece of ink; anything lying wholly below
        # it, or wholly above it, came off a neighbouring line
        spans = [extent(sp) for sp in parts]
        main = max(range(len(parts)), key=lambda i: spans[i][1] - spans[i][0])
        mtop, mbot = spans[main]
        floor = mbot + (em * 0.45 if drops else 1.0)
        ceiling = mtop - 1.0
        keep, dropped = [], 0
        for i, sp in enumerate(parts):
            top, bot = spans[i]
            if i != main and (top > floor or bot < ceiling):
                dropped += 1
                continue
            keep.append(sp)
        if not keep:
            return d, 0
        return ''.join(keep), dropped

    def normalise(d, ch, em):
        """Scale the mark so it stands at its proper height on the line."""
        top, _ = extent(d)
        k = (em * target_height(ch)) / -top
        out, i = [], 0
        for tok in re.split(r'([MLQCZmlqczHhVv])', d):
            if not tok:
                continue
            if tok.strip() in 'MLQCZmlqczHhVv':
                out.append(tok); i = 0; continue
            ns = NUM.findall(tok)
            out.append(' '.join(short(float(n) * k) for n in ns) if ns else tok)
            i += len(ns)
        return ''.join(out).replace('  ', ' ').strip(), k

    def shaped(ch, d, em):
        """A mark far wider than it is tall is usually two letters joined."""
        top, bot = extent(d)
        xs, i = [], 0
        for tok in re.split(r'([MLQCZmlqczHhVv])', d):
            if not tok or tok.strip() in 'MLQCZmlqczHhVv':
                i = 0; continue
            ns = NUM.findall(tok)
            for j, n in enumerate(ns):
                if (i + j) % 2 == 0:
                    xs.append(float(n))
            i += len(ns)
        if not xs:
            return 'no outline'
        w = max(xs) - min(xs)
        # Calibrated on Peirce's capital E, which carries a long horizontal
        # flourish through it and runs 1.81 em wide as one letter. A rule of
        # thumb set below that refuses a good letter; a joined pair on these
        # lines runs well past two ems, so there is room for both facts.
        if w > em * 1.90:
            return f'{w/em:.2f} em wide — too wide for one letter'
        return None

    # One em in the units the paths are drawn in. Every mark was scaled to a
    # common x-height by the harvest, so one factor serves the whole table.
    # xHeight in the manifest is the y of the x-height LINE, not a height, so
    # the height itself is the distance from it down to the baseline.
    xh = [float(g['baseline']) - float(g['xHeight']) for g in man['glyphs']
          if g.get('xHeight') and g.get('xHeight_confident') and g.get('baseline')]
    xh = [v for v in xh if v > 1]
    xheight = sorted(xh)[len(xh) // 2] if xh else 58.0
    em = round(xheight / 0.45, 1)      # a serif x-height is about 0.45 em

    table, kept, skipped = {}, 0, []
    for ch in sorted(by):
        variants = []
        for gl in by[ch]:
            svg_path = os.path.join(root, gl['svg'])
            if not os.path.exists(svg_path):
                skipped.append(f'{ch}: no file {gl["svg"]}')
                continue
            svg = open(svg_path).read()
            ds = re.findall(r'\bd="([^"]+)"', svg)
            if not ds:
                skipped.append(f'{ch}: no path in {gl["svg"]}')
                continue
            base = float(gl['baseline'])
            d = ' '.join(shift_path(x, base) for x in ds)
            d, blobs = deblob(d, em, descends(gl, ch))
            why = sane(ch, d, em, descends(gl, ch))
            if not why:
                d, k = normalise(d, ch, em)
                why = shaped(ch, d, em)
            if why:
                skipped.append(f'{ch} from {gl.get("source") or "?"}: {why}')
                continue
            if len(variants) >= cap: break
            adv = round(float(gl['width']) * k * 1.16, 1)
            variants.append({'d': d, 'w': round(float(gl['width']) * k, 1),
                             'a': adv,
                             'src': gl.get('ms') or '', 'f': gl.get('source') or ''})
            kept += 1
        if variants:
            table[ch] = variants

    with open(out_path, 'w') as f:
        f.write('/* Peirce\'s letterforms, taken from the manuscripts.\n'
                '   Generated by tools/hand-glyphs.py — do not edit by hand.\n'
                '   Each path has its baseline at y=0; EM says what one em is\n'
                '   in these units, so the page scales by fontSize/EM. */\n')
        f.write('const PEIRCE_HAND = ' + json.dumps(
            {'em': em, 'glyphs': table}, separators=(',', ':')) + ';\n')

    size = os.path.getsize(out_path)
    have = ''.join(sorted(table))
    missing = ''.join(sorted(c for c in WANTED if c not in table))
    print(f'{kept} marks over {len(table)} characters -> {out_path} ({size/1024:.1f} KB)')
    print(f'  one em = {em} units')
    print(f'  have:    {have}')
    print(f'  missing: {missing}')
    print(f'  rejected {len(skipped)} marks that failed the geometry check:')
    for s in skipped:
        print('    ', s)
    return 0


if __name__ == '__main__':
    sys.exit(main())
