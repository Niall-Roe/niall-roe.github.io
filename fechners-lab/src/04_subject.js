<script>
/* ==========================================================================
   Specific to these pages: the simulated subject, the protocol sheet and
   worked-calculation renderers, and the store that carries results to the
   summary page. Everything general — the maths, RPlot, mkCanvas, the control
   builders — comes from 03_lib.js and is shared with the other papers.
   ========================================================================*/

/* a standard normal deviate, from the shared quantile function */
const gauss = () => qnorm(Math.random());
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sdev = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };
/* the "average error" the third method is named after: how far a setting
   typically falls from the middle of the settings */
const mad = (a) => { const m = mean(a); return mean(a.map((v) => Math.abs(v - m))); };

/* Two summaries of one spread, and the number converting between them. The
   probable error is the half-range holding the middle half of a normal
   distribution; the mean absolute deviation is a different summary of the same
   spread. PE = 0.6745 sigma and MAD = 0.7979 sigma, so PE = 0.8454 x MAD.
   That is an identity of the normal curve, not a tuning constant. */
const PE_Z = 0.6745;
const MAD_TO_PE = PE_Z / Math.sqrt(2 / Math.PI);       /* 0.8454 */

/* least-squares probit line through (level, proportion) points */
function probitFit(pts) {
  let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
  pts.forEach(([L, pr]) => {
    const z = qnorm(Math.min(0.995, Math.max(0.005, pr)));
    sx += L; sy += z; sxx += L * L; sxy += L * z; n++;
  });
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx), icept = (sy - slope * sx) / n;
  return {
    slope, icept,
    sigma: 1 / slope,
    at: (p) => (qnorm(p) - icept) / slope,             /* level giving proportion p */
    p: (L) => pnorm(icept + slope * L)                 /* proportion at level L */
  };
}

/* -------------------------------------------------------------- the subject
   One man, used by all three methods, so the pages can be compared.

   Only WEBER and RL_SD are senses. The other two are not, and that matters:
   CAUTION is how large a felt difference has to be before he will commit to
   "greater" rather than "equal" — a matter of what he was told to do, not of
   what he can feel — and MOTOR is the unsteadiness of his hand, which only
   enters when he is the one moving the weight.

   So the three methods are not measuring quite the same thing, and their
   difference thresholds should not be expected to match. Nothing here is set
   to make them agree.                                                       */
const SUBJ = {
  RL:      3.0,      /* absolute threshold, grams resting on the palm */
  RL_SD:   0.9,      /* trial-to-trial noise on detection */
  WEBER:   0.0715,   /* sensory spread of a comparison = WEBER x standard */
  CE:      2.0,      /* constant error on comparisons, grams */
  CAUTION: 0.95,     /* he says "equal" until the difference exceeds this,
                        measured in units of the sensory spread */
  MOTOR:   3.0       /* extra grams of scatter when he works the dial himself */
};
const sigD = (S) => SUBJ.WEBER * S;                    /* 7.15 g at a 100 g standard */

/* What each method is in a position to recover, kept separate because they
   are different quantities. */
const PE_TRUE         = (S) => PE_Z * sigD(S);
const IU_HALF_TRUE    = (S) => SUBJ.CAUTION * sigD(S);
const SET_SPREAD_TRUE = (S) => Math.sqrt(sigD(S) ** 2 + SUBJ.MOTOR ** 2);
const SET_PE_TRUE     = (S) => PE_Z * SET_SPREAD_TRUE(S);
const PSE_TRUE        = (S) => S + SUBJ.CE;

/* does he feel a weight resting on the palm at all? */
function feels(w) { return (w + gauss() * SUBJ.RL_SD) > SUBJ.RL; }
/* two-way comparison: is the comparison heavier than the standard? */
function heavier(comp, std) { return (comp - std - SUBJ.CE) + gauss() * sigD(std) > 0; }
/* three-way comparison: less, equal or greater than the standard? */
function compare(comp, std, caution) {
  const c = (caution === undefined ? SUBJ.CAUTION : caution) * sigD(std);
  const e = (comp - std - SUBJ.CE) + gauss() * sigD(std);
  return e > c ? "greater" : (e < -c ? "less" : "equal");
}
/* where he leaves the dial, and a plausible path to get there */
function setting(target, spread) { return target + gauss() * spread; }
function settlePath(start, end, n) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), decay = Math.exp(-3.1 * t);
    p.push(end + (start - end) * decay * Math.cos(5.4 * t) + gauss() * 0.5 * decay);
  }
  p[p.length - 1] = end;
  return p;
}

/* ------------------------------------------------------------------ format */
const f1 = (v) => fmt(v, 1), f2 = (v) => fmt(v, 2);
const gram = (v) => fmt(v, 2) + " g";
const signed = (v) => (v >= 0 ? "+" : "") + fmt(v, 2);

/* ---------------------------------------------------------- protocol sheet
   head: array of header strings. rows: [{cls, cells:[{t,cls}|string]}].     */
function renderSheet(sel, head, rows, caption) {
  const el = $(sel);
  if (!el) return;
  if (!rows.length) { el.innerHTML = `<div class="sheet-empty">${caption || "no data yet"}</div>`; return; }
  let s = '<div class="sheet-wrap"><table class="sheet">';
  if (head && head.length) s += "<tr>" + head.map((x) => `<th>${x}</th>`).join("") + "</tr>";
  rows.forEach((r) => {
    s += "<tr" + (r.cls ? ` class="${r.cls}"` : "") + ">";
    r.cells.forEach((c) => {
      const t = (typeof c === "string") ? c : c.t;
      const cl = (typeof c === "string") ? "" : (c.cls || "");
      s += "<td" + (cl ? ` class="${cl}"` : "") + ">" + t + "</td>";
    });
    s += "</tr>";
  });
  s += "</table>";
  if (caption) s += `<div class="plot-cap">${caption}</div>`;
  el.innerHTML = s + "</div>";
}

/* ------------------------------------------------------ worked calculation
   lines: [{lbl, expr, res, k, sum}] — expr is the arithmetic with the actual
   numbers in it, res the answer.                                            */
function renderCalc(sel, lines) {
  const el = $(sel);
  if (!el) return;
  el.innerHTML = '<div class="calc">' + lines.map((l) =>
    `<div class="line${l.sum ? " sum" : ""}">` +
    `<div class="lbl">${l.lbl || ""}</div>` +
    `<div class="expr">${l.expr || ""}</div>` +
    `<div class="res${l.k ? " " + l.k : ""}">${l.res || ""}</div></div>`).join("") + "</div>";
}
/* "( a + b + c ) / n" written out, shortened in the middle when long */
function sumExpr(vals, dp) {
  const d = dp === undefined ? 1 : dp;
  const shown = vals.length <= 6
    ? vals.map((v) => fmt(v, d)).join(" + ")
    : vals.slice(0, 3).map((v) => fmt(v, d)).join(" + ") + " + … + " + fmt(vals[vals.length - 1], d);
  return "( " + shown + " ) / " + vals.length;
}

/* --------------------------------------------------------------- the store */
const STORE_KEY = "fechners-lab";
function loadStore() {
  try {
    const s = localStorage.getItem(STORE_KEY), d = s ? JSON.parse(s) : null;
    return (d && typeof d === "object") ? d : { sim: {}, you: {} };
  } catch (e) { return { sim: {}, you: {} }; }
}
function saveSim(method, obj) {
  const d = loadStore();
  d.sim = d.sim || {}; d.sim[method] = obj;
  /* what is actually in the subject, so the summary page can say what each
     method was in a position to recover rather than pretending to one number */
  d.truth = { RL: SUBJ.RL, sigma: sigD(100), PE: PE_TRUE(100),
              iuHalf: IU_HALF_TRUE(100), setPE: SET_PE_TRUE(100),
              PSE: PSE_TRUE(100), CE: SUBJ.CE };
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ }
}
function saveYou(method, obj) {
  const d = loadStore();
  d.you = d.you || {}; d.you[method] = obj;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ }
}
function clearStore() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } }

/* a canvas dropped straight into a container, the common case here */
function plotInto(sel, height, drawFn) {
  const el = $(sel);
  if (!el) return;
  el.innerHTML = "";
  el.appendChild(mkCanvas(height, drawFn));
}

/* -------------------------------------------------------------------- nav */
const PAGES = [
  ["index.html", "Introduction"],
  ["right-and-wrong-cases.html", "Right and wrong cases"],
  ["just-noticeable-differences.html", "Just noticeable differences"],
  ["average-error.html", "Average error"],
  ["results.html", "The three together"],
  ["try-it-yourself.html", "Try it yourself"]
];
(function markNav() {
  const page = document.body.getAttribute("data-page");
  const links = $$("nav.top a");
  let idx = -1;
  links.forEach((a, i) => { if (a.getAttribute("data-p") === page) { a.classList.add("here"); idx = i; } });
  const fn = $("#footnav");
  if (fn && idx >= 0) {
    const prev = idx > 0 ? PAGES[idx - 1] : null, next = idx < PAGES.length - 1 ? PAGES[idx + 1] : null;
    fn.innerHTML =
      (prev ? `<a href="${prev[0]}">&larr; ${prev[1]}</a>` : '<span class="sp"></span>') +
      (next ? `<a href="${next[0]}">${next[1]} &rarr;</a>` : '<span class="sp"></span>');
  }
})();
</script>
