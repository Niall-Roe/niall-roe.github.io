#!/usr/bin/env python3
"""
Emit src/02_article.html from the corrected text and the rebuilt tables.

The page is set to match the Probability of Induction edition: same measure,
same palette, same footnote apparatus. There are no interactive examples here,
so the article part is the whole of the body.

Usage:  python3 tools/render.py
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import tables as T  # noqa: E402

IN = os.path.join(ROOT, "build", "article.fixed.json")
OUT = os.path.join(ROOT, "src", "02_article.html")

BUF = []
def w(s=""):
    BUF.append(s)


def pmv(d):
    """A value with its probable error, as printed."""
    if d is None:
        return ""
    if isinstance(d, str):
        return d
    v, e = d.get("v", ""), d.get("pm")
    return "%s &plusmn; %s" % (v, e) if e else v


def cell(v):
    return "" if v is None else str(v)


def note(text):
    return '<p class="tbl-note">%s</p>' % text


def verify_flag(t):
    if not t.get("verify_note"):
        return ""
    cls = "tbl-warn" if t.get("unverified") else "tbl-note"
    return '<p class="%s">Unverified: %s.</p>' % (cls, t["verify_note"])


# --------------------------------------------------------------- the tables

def t_simple(t):
    w('<div class="table-scroll"><table class="tbl">')
    w("<thead><tr>%s</tr></thead>" % "".join("<th>%s</th>" % h for h in t["head"]))
    w("<tbody>")
    for r in t["rows"]:
        w("<tr>%s</tr>" % "".join("<td>%s</td>" % cell(c) for c in r))
    w("</tbody></table></div>")


def t_fn2(t):
    t_simple(t)


def t_confidence(t):
    w(verify_flag(t))
    w('<div class="table-scroll"><table class="tbl">')
    w("<thead><tr><th>Ratio of pressures</th>"
      "<th>Mean confidence, observed</th>"
      "<th>Mean confidence, calculated</th></tr></thead>")
    for ob in t["observers"]:
        w('<tbody><tr class="tbl-group"><td colspan="3">%s &nbsp;'
          '<span class="tbl-idx">c = %s</span></td></tr>' % (ob["who"], ob["c"]))
        for r in ob["rows"]:
            w("<tr>%s</tr>" % "".join("<td>%s</td>" % c for c in r))
        w("</tbody>")
    w("</table></div>")


def t_fn4(t):
    w('<div class="table-scroll"><table class="tbl">')
    w("<thead><tr>%s</tr></thead>" % "".join("<th>%s</th>" % h for h in t["head"]))
    for b in t["blocks"]:
        w('<tbody><tr class="tbl-group"><td colspan="3">[%s]</td></tr>'
          % b["subject"])
        for r in b["rows"]:
            w("<tr>%s</tr>" % "".join("<td>%s</td>" % c for c in r))
        w("</tbody>")
    w("</table></div>")


def t_marks(t):
    for b in t["blocks"]:
        w('<p class="tbl-caption">%s</p>' % b["caption"])
        if b.get("note"):
            w(note("[%s]" % b["note"]))
        w('<div class="table-scroll"><table class="tbl">')
        w("<thead><tr>%s</tr></thead>"
          % "".join("<th>%s</th>" % h for h in b["head"]))
        w("<tbody>")
        for r in b["rows"]:
            cells = ['<td>%s</td>' % r[0]]
            for pair in r[1:]:
                cells.append('<td><span class="rw">%s right</span>'
                             '<span class="rw">%s wrong</span></td>'
                             % (pair[0], pair[1]))
            w("<tr>%s</tr>" % "".join(cells))
        w("</tbody></table></div>")


def t_daily_peirce(t):
    ratios = t["ratios"]
    w('<p class="tbl-caption">%s</p>' % t["caption"])
    w('<div class="table-scroll"><table class="tbl tbl-daily">')
    w("<thead><tr><th>Date</th>%s</tr></thead>"
      % "".join("<th>%s</th>" % r for r in ratios))
    w("<tbody>")
    for i, d in enumerate(t["dates"]):
        cells = "".join("<td>%s</td>" % cell(t["cols"][r][i]) for r in ratios)
        w("<tr><td class='lbl'>%s</td>%s</tr>" % (d, cells))
    w('<tr class="tbl-rule"><td class="lbl">Means</td>%s</tr>'
      % "".join("<td>%s</td>" % pmv(t["means"][r]) for r in ratios))
    w('<tr><td class="lbl">%s</td>%s</tr>'
      % (t["calculated"]["label"],
         "".join("<td>%s</td>" % pmv(t["calculated"][r]) for r in ratios)))
    w('<tr class="tbl-rule"><td class="lbl">Average confidence, observed</td>%s</tr>'
      % "".join("<td>%s</td>" % t["confidence"]["observed"][r] for r in ratios))
    w('<tr><td class="lbl">Average confidence, calculated</td>%s</tr>'
      % "".join("<td>%s</td>" % t["confidence"]["calculated"][r] for r in ratios))
    w("</tbody></table></div>")


def t_daily_jastrow(t):
    """Printed as columns, since the value-to-date mapping is not yet settled."""
    ratios = t["ratios"]
    w('<p class="tbl-caption">%s</p>' % t["caption"])
    w(verify_flag(t))
    w('<div class="table-scroll"><table class="tbl">')
    w("<thead><tr><th>Ratio</th><th>Errors in fifty, in the printed order</th>"
      "<th>Mean</th></tr></thead><tbody>")
    for r in ratios:
        w("<tr><td>%s</td><td class='series'>%s</td><td>%s</td></tr>"
          % (r, "&nbsp; ".join(t["series"][r]), t["means"][r]))
    w("</tbody></table></div>")


def t_groups(t):
    for g in t["groups"]:
        w('<p class="tbl-caption">%s <span class="tbl-idx">'
          '[Probable error = %s]</span></p>' % (g["caption"], g["pe"]))
        w('<div class="table-scroll"><table class="tbl">')
        w("<thead><tr><th rowspan='2'>Ratios of pressures</th>"
          "<th rowspan='2'>Number of sets of 50</th>"
          "<th colspan='2'>Average number of errors</th>"
          "<th colspan='2'>Average confidence</th></tr>"
          "<tr><th>Observed</th><th>Calculated from probable error</th>"
          "<th>Observed</th><th>Calculated</th></tr></thead><tbody>")
        for r in g["rows"]:
            w("<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td>"
              "<td>%s</td><td>%s</td></tr>"
              % (r[0], r[1], pmv(r[2]), pmv(r[3]), r[4], r[5] or "&hellip;"))
        w("</tbody></table></div>")


def t_fn7(t):
    w('<p class="tbl-caption">%s</p>' % t["caption"])
    w('<div class="table-scroll"><table class="tbl">')
    w("<thead><tr>%s</tr></thead><tbody>"
      % "".join("<th>%s</th>" % h for h in t["head"]))
    for r in t["rows"]:
        cells = ['<td class="lbl">%s</td>' % r[0]]
        for a, b in r[1:]:
            cells.append("<td>%s, %s</td>" % (a, b))
        w("<tr>%s</tr>" % "".join(cells))
    w("</tbody></table></div>")


def t_fn8(t):
    w('<div class="table-scroll"><table class="tbl">')
    w("<thead><tr>%s</tr></thead><tbody>"
      % "".join("<th>%s</th>" % h for h in t["head"]))
    for r in t["rows"]:
        w("<tr><td class='lbl'>%s</td>%s</tr>"
          % (r[0], "".join("<td>%s</td>" % c for c in r[1:])))
    w("</tbody></table></div>")


RENDER = {
    "fn2-error-ratio": t_fn2,
    "confidence-groups-1-2": t_confidence,
    "fn4-variations": t_fn4,
    "marks-by-ratio": t_marks,
    "daily-peirce": t_daily_peirce,
    "daily-jastrow": t_daily_jastrow,
    "group-summaries": t_groups,
    "fn7-plus-minus": t_fn7,
    "fn8-color-sense": t_fn8,
}


def render_table(name):
    fn = RENDER.get(name)
    if not fn:
        w("<!-- no renderer for %s -->" % name)
        return
    w('<div class="tbl-block" id="tbl-%s">' % name)
    fn(T.TABLES[name])
    w("</div>")


# ---------------------------------------------------------------- the page

def main():
    with open(IN, encoding="utf-8") as fh:
        doc = json.load(fh)

    w("  <h3>%s</h3>" % doc["title"].upper())
    w('  <h4 class="read">%s</h4>' % doc["read"])
    w("  <h4>%s</h4>" % doc["byline"])
    w("")

    pending_page = None
    for b in doc["blocks"]:
        if b["type"] == "page":
            pending_page = b["n"]
            continue
        if b["type"] == "para":
            mark = ""
            if pending_page:
                mark = ('<span class="pg-num" aria-hidden="true">%s</span>'
                        % pending_page)
                pending_page = None
            w("  <p>%s%s</p>" % (mark, b["html"]))
            w("")
        elif b["type"] == "formula":
            w('  <div class="formula">%s</div>' % doc["formula_html"])
            w("")
        elif b["type"] == "scale":
            w('  <ul class="scale">')
            for s in doc["scale"]:
                w('    <li><span class="scale-mark">%s</span> %s</li>'
                  % (s["mark"], s["html"]))
            w("  </ul>")
            w("")
        elif b["type"] == "table":
            render_table(b["name"])
            w("")

    w('  <div class="footnotes">')
    for f in doc["footnotes"]:
        w('    <p id="fn%d"><a href="#fnref%d">%d.</a> %s</p>'
          % (f["n"], f["n"], f["n"], f["html"]))
        for name in f.get("tables", []):
            render_table(name)
    w("  </div>")
    w("")

    w('  <div class="footer">')
    w("    <p>Text: C. S. Peirce and J. Jastrow, &ldquo;On Small Differences of "
      "Sensation,&rdquo; <em>Memoirs of the National Academy of Sciences</em> 3 "
      "(1884), 75&ndash;83; set here from the text as printed in <em>Writings of "
      "Charles S. Peirce</em>, vol. 5. Page numbers in the margin are those of "
      "the <em>Writings</em>. The tables have been rebuilt from the printed "
      "figures; where a column does not reproduce its own printed mean, it is "
      "marked as unverified rather than silently reconciled.</p>")
    w("  </div>")
    w("</div>")

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(BUF) + "\n")
    print("wrote %s (%d lines)" % (os.path.relpath(OUT, ROOT), len(BUF)))


if __name__ == "__main__":
    main()
