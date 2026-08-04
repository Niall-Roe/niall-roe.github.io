#!/usr/bin/env python3
"""
The nine tables, rebuilt as structured data.

The scrape flattened every table column-major into one value per line, which
loses the row each value belonged to. So these are keyed back in by hand from
the 1884 printing and then CHECKED: where the original prints a column mean,
verify() recomputes it from the values above it and reports any column that
does not reconcile. Six of the nine carry no redundancy and are simply
transcribed; the two daily tables do, and that is what makes them trustworthy.

Numbers only — no prose passes through this file.

Usage:  python3 tools/tables.py --verify
"""

import sys

# Marks a value the original leaves blank.
X = None


def pm(v, e):
    """A value printed with its probable error, e.g. 10.4 ± 1.0."""
    return {"v": v, "pm": e}


# ---------------------------------------------------------------------------
# p. 76, footnote 2. Quotient of log(ratio of excitation) / probable error,
# against the proportion of erroneous judgments.
# ---------------------------------------------------------------------------
FN2_ERROR_RATIO = {
    "caption": "",
    "head": ["Quotient", "Proportion of erroneous judgments"],
    "rows": [["0.0", "0.50"], ["0.05", "0.49"], ["0.1", "0.47"],
             ["0.25", "0.43"], ["0.5", "0.37"], ["1.0", "0.25"]],
}

# ---------------------------------------------------------------------------
# p. 77. Mean confidence, observed against calculated, for each index c.
# The third index is printed small and takes ink badly; the scrape read it as
# "0.0" and the memoir setting reads "0.6". Flagged rather than silently
# chosen — every value in the column is legible, only the header is not.
# ---------------------------------------------------------------------------
CONFIDENCE_GROUPS = {
    "caption": "First group.",
    "verify_note": "index of the third column reads 0.6 in the memoir, 0.0 in the scrape",
    "observers": [
        {"who": "Peirce, observer.", "c": "1.25",
         "rows": [["1.015", "0.14", "0.10"],
                  ["1.030", "0.30", "0.35"],
                  ["1.060", "0.70", "0.70"]]},
        {"who": "Jastrow, observer.", "c": "1.5",
         "rows": [["1.015", "0.30", "0.2"],
                  ["1.030", "0.40", "0.42"],
                  ["1.060", "0.85", "0.87"]]},
        {"who": "Jastrow, observer.", "c": "0.6",
         "rows": [["1.015", "0.34", "0.27"],
                  ["1.030", "0.55", "0.56"],
                  ["1.060", "1.02", "1.22"]]},
        {"who": "Jastrow, observer.", "c": "0.25",
         "rows": [["1.005", "0.00", "0.03"],
                  ["1.010", "0.07", "0.06"],
                  ["1.020", "0.12", "0.12"]]},
        {"who": "Jastrow, observer.", "c": "0.4",
         "rows": [["1.005", "0.00", "0.06"],
                  ["1.010", "0.05", "0.12"],
                  ["1.020", "0.50", "0.39"]]},
    ],
}

# ---------------------------------------------------------------------------
# p. 78, footnote 4. Average confidence by size of variation.
# ---------------------------------------------------------------------------
FN4_VARIATIONS = {
    "head": ["Variations (grams)", "Average confidence", "Number of sets of 50"],
    "blocks": [
        {"subject": "Subject, Mr. Peirce.",
         "rows": [["60", ".67", "7"], ["30", ".28", "6"], ["15", ".15", "5"]]},
        {"subject": "Subject, Mr. Jastrow.",
         "rows": [["60", ".90", "13"], ["30", ".51", "12"], ["15", ".30", "12"],
                  ["20", ".11", "12"], ["10", ".06", "12"], ["5", ".00", "10"]]},
    ],
}

# ---------------------------------------------------------------------------
# pp. 78-79. Right and wrong answers under each confidence mark.
# ---------------------------------------------------------------------------
MARKS_BY_RATIO = {
    "blocks": [
        {"caption": "Second group.",
         "head": ["Ratio of weights", "Mark 0", "Mark 1", "Mark 2", "Mark 3"],
         "rows": [
             ["1.015", ("110", "66"), ("51", "17"), ("3", "2"), ("1", "0")],
             ["1.030", ("106", "35"), ("72", "11"), ("23", "1"), ("2", "0")],
             ["1.060", ("86", "8"), ("75", "1"), ("54", "2"), ("24", "0")]]},
        {"caption": "Third and fourth groups.",
         "note": "Marks 2 and 3 do not occur.",
         "head": ["Ratio of weights", "Mark 0", "Mark 1"],
         "rows": [
             ["1.005", ("294", "203"), ("2", "1")],
             ["1.010", ("366", "192"), ("32", "30")],
             ["1.020", ("395", "131"), ("68", "6")]]},
    ],
}

# ---------------------------------------------------------------------------
# p. 80. Errors in fifty experiments, Mr. Peirce as subject.
# Every column mean reconciles against the values above it.
# ---------------------------------------------------------------------------
DAILY_PEIRCE = {
    "caption": "Ratios of pressures. [Subject: Mr. Peirce.]",
    "dates": ["December 10", "December 13", "December 17", "December 20",
              "January 3", "January 15", "January 22", "January 24"],
    "ratios": ["1.100", "1.080", "1.060", "1.050", "1.040", "1.030", "1.015"],
    #            Dec10 Dec13 Dec17 Dec20 Jan3 Jan15 Jan22 Jan24
    "cols": {
        "1.100": [2,    X,    X,    X,    X,   X,    X,    X],
        "1.080": [X,    4,    X,    X,    X,   X,    X,    X],
        "1.060": [X,    8,    11,   7,    14,  15,   12,   6],
        "1.050": [13,   X,    X,    X,    X,   X,    X,    X],
        "1.040": [X,    15,   X,    X,    X,   X,    X,    X],
        "1.030": [X,    X,    20,   16,   20,  29,   16,   15],
        "1.015": [X,    X,    X,    21,   28,  17,   20,   22],
    },
    "means": {"1.100": pm("2", None), "1.080": pm("4", None),
              "1.060": pm("10.4", "1.0"), "1.050": pm("13", None),
              "1.040": pm("15", None), "1.030": pm("19.3", "1.4"),
              "1.015": pm("21.6", "1.1")},
    "calculated": {"label": "Calculated from probable error = 0.051",
                   "1.100": pm("4.6", "1.0"), "1.080": pm("7.2", "1.6"),
                   "1.060": pm("10.7", "0.8"), "1.050": pm("12.7", "2.1"),
                   "1.040": pm("14.9", "2.2"), "1.030": pm("17.2", "0.9"),
                   "1.015": pm("21.0", "1.1")},
    "confidence": {
        "observed":   {"1.100": "1.9", "1.080": "0.9", "1.060": "0.7",
                       "1.050": "0.8", "1.040": "0.3", "1.030": "0.3",
                       "1.015": "0.2"},
        "calculated": {"1.100": "1.3", "1.080": "1.0", "1.060": "0.7",
                       "1.050": "0.6", "1.040": "0.5", "1.030": "0.3",
                       "1.015": "0.2"}},
}

# ---------------------------------------------------------------------------
# p. 81. The same for Mr. Jastrow. NOT yet reconciled: the table is wide
# enough that the printing splits it, which collides four of the column
# headers in the scrape, and three columns do not reproduce their printed
# mean. Column CONTENTS are recovered in order; the assignment of values to
# dates is the part still to be checked against the scan.
# ---------------------------------------------------------------------------
DAILY_JASTROW = {
    "caption": "Ratios of pressures. [Subject: Mr. Jastrow.]",
    "verify_note": "row assignment unverified; 1.060, 1.030 and 1.005 do not "
                   "reproduce their printed means",
    "unverified": True,
    "dates": ["December 10", "December 13", "December 17", "December 20",
              "January 3", "January 10", "January 15", "January 22",
              "January 24", "February 11", "February 17", "February 18",
              "February 24", "March 4", "March 5", "March 18", "March 19",
              "March 23", "March 25", "March 30", "March 31", "April 2",
              "April 3", "April 6", "April 7"],
    "ratios": ["1.100", "1.080", "1.060", "1.050", "1.040", "1.030",
               "1.020", "1.015", "1.010", "1.005"],
    # values in printed order down each column, blanks not yet placed
    "series": {
        "1.100": ["5"],
        "1.080": ["9"],
        "1.060": ["15", "14", "10", "8", "7", "12", "11", "4", "1", "2", "2",
                  "2", "0"],
        "1.050": ["19"],
        "1.040": ["15"],
        "1.030": ["23", "17", "14", "13", "6", "10", "11", "7", "10", "11",
                  "8", "5"],
        "1.020": ["13", "13", "14", "11", "14", "12", "11", "10", "11", "9",
                  "12", "7"],
        "1.015": ["25", "24", "17", "22", "16", "18", "18", "17", "17", "15",
                  "14"],
        "1.010": ["16", "17", "19", "21", "17", "16", "16", "15", "17", "18",
                  "15", "15"],
        "1.005": ["29", "18", "18", "18", "21", "21", "21", "20", "21", "17"],
    },
    "means": {"1.100": "5", "1.080": "9", "1.060": "6.6", "1.050": "19",
              "1.040": "15.0", "1.030": "11.6", "1.020": "11.4",
              "1.015": "18.9", "1.010": "16.8", "1.005": "20.5"},
}

# ---------------------------------------------------------------------------
# pp. 81-82. Mean results by group.
# ---------------------------------------------------------------------------
GROUP_SUMMARIES = {
    "head": ["Ratios of pressures", "Number of sets of 50",
             "Observed", "Calculated from probable error",
             "Observed", "Calculated"],
    "groups": [
        {"caption": "First group.", "pe": "0.05", "rows": [
            ["1.100", "1", pm("5", None), pm("4.4", "1.4"), "0.9", "1.5"],
            ["1.080", "1", pm("9", None), pm("7.0", "1.7"), "0.9", "1.2"],
            ["1.060", "7", pm("11.0", "0.7"), pm("10.4", "0.7"), "0.85", "0.9"],
            ["1.050", "1", pm("19", None), pm("12.5", "2.1"), "0.35", "0.7"],
            ["1.040", "1", pm("15", None), pm("14.7", "2.2"), "0.3", "0.6"],
            ["1.030", "6", pm("13.8", "1.5"), pm("17.0", "0.9"), "0.5", "0.4"],
            ["1.015", "5", pm("20.8", "1.1"), pm("21.0", "1.1"), "0.3", "0.2"]]},
        {"caption": "Second group.", "pe": "0.0235", "rows": [
            ["1.060", "5", pm("2.2", "0.3"), pm("2.1", "0.4"), "1.0", "1.2"],
            ["1.030", "5", pm("9.4", "0.6"), pm("9.6", "0.8"), "0.55", "0.6"],
            ["1.015", "5", pm("17.0", "0.3"), pm("16.6", "1.0"), "0.3", "0.3"]]},
        {"caption": "Third group.", "pe": "0.02", "rows": [
            ["1.020", "6", pm("12.8", "0.3"), pm("12.5", "0.8"), "0.12", "0.12"],
            ["1.010", "6", pm("17.7", "0.6"), pm("18.3", "0.9"), "0.07", "0.06"],
            ["1.005", "4", pm("20.7", "1.7"), pm("21.6", "1.2"), "0.00", "0.03"]]},
        {"caption": "Fourth group.", "pe": "0.0155", "rows": [
            ["1.060", "1", pm("0", None), pm("0.8", "0.6"), "1.6", ""],
            ["1.030", "1", pm("5", None), pm("4.8", "1.4"), "0.5", "0.4"],
            ["1.020", "6", pm("10.0", "0.5"), pm("9.6", "0.8"), "0.1", "0.2"],
            ["1.015", "1", pm("14", None), pm("12.8", "2.1"), "0.1", "0.13"],
            ["1.010", "6", pm("16", None), pm("16.5", "0.9"), "0.05", "0.12"],
            ["1.005", "6", pm("20.8", "0.4"), pm("20.6", "1.0"), "0.00", "0.06"]]},
    ],
}

# ---------------------------------------------------------------------------
# p. 82, footnote 7. Plus and minus errors, fourth group.
# ---------------------------------------------------------------------------
FN7_PLUS_MINUS = {
    "caption": "Number of + and − errors.",
    "head": ["Date", "1.020", "1.010", "1.005"],
    "rows": [
        ["March 30", ("−4", "+7"),  ("−6", "+10"), ("−13", "+8")],
        ["March 31", ("−7", "+3"),  ("−5", "+10"), ("−6", "+15")],
        ["April 2",  ("−1", "+10"), ("−8", "+9"),  ("−8", "+13")],
        ["April 3",  ("−4", "+5"),  ("−4", "+14"), ("−10", "+10")],
        ["April 6",  ("−6", "+6"),  ("−8", "+7"),  ("−10", "+11")],
        ["April 7",  ("−5", "+9"),  ("−8", "+7"),  ("−8", "+9")]],
}

# ---------------------------------------------------------------------------
# p. 82, footnote 8. The colour-sense experiments.
# ---------------------------------------------------------------------------
FN8_COLOR_SENSE = {
    "head": ["", "1", "2", "3", "4", "5"],
    "rows": [["Observed", "199", "181", "217", "213", "190"],
             ["Calculated", "213", "197", "209", "181", "200"]],
}

TABLES = {
    "fn2-error-ratio": FN2_ERROR_RATIO,
    "confidence-groups-1-2": CONFIDENCE_GROUPS,
    "fn4-variations": FN4_VARIATIONS,
    "marks-by-ratio": MARKS_BY_RATIO,
    "daily-peirce": DAILY_PEIRCE,
    "daily-jastrow": DAILY_JASTROW,
    "group-summaries": GROUP_SUMMARIES,
    "fn7-plus-minus": FN7_PLUS_MINUS,
    "fn8-color-sense": FN8_COLOR_SENSE,
}


def verify():
    """Recompute every printed column mean we have the values for."""
    ok = True
    print("daily-peirce — column means vs. the values above them")
    for r in DAILY_PEIRCE["ratios"]:
        vals = [v for v in DAILY_PEIRCE["cols"][r] if v is not None]
        want = float(DAILY_PEIRCE["means"][r]["v"])
        got = sum(vals) / len(vals)
        good = abs(got - want) < 0.06
        ok &= good
        print("  %s %-6s n=%d  printed %-5s computed %.2f"
              % ("OK " if good else "!! ", r, len(vals), want, got))

    print("\ndaily-jastrow — same check (row assignment still open)")
    for r in DAILY_JASTROW["ratios"]:
        vals = [float(v) for v in DAILY_JASTROW["series"][r]]
        want = float(DAILY_JASTROW["means"][r])
        got = sum(vals) / len(vals)
        good = abs(got - want) < 0.06
        print("  %s %-6s n=%d  printed %-5s computed %.2f"
              % ("OK " if good else "!! ", r, len(vals), want, got))

    print("\ndaily-peirce reconciles: %s" % ok)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(verify() if "--verify" in sys.argv else 0)
