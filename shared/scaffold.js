<script>
/* ==========================================================================
   Example scaffolding: click a highlighted passage to open its demonstration.
   Content is built lazily the first time a container is opened.

   SHARED. This file is assembled into every paper on the site from ../shared/,
   so there is one copy and the papers cannot drift apart. Nothing here may know
   about a particular example; anything paper-specific belongs in that paper's
   own part files.

   The one concession is #peirce-table-block in the live-number host selector:
   the Probability of Induction's granary table drives live figures from outside
   any example container. Other papers have no such element, so it costs them
   nothing.
   ========================================================================*/

const BUILDERS = {};
const BUILT = {};

function registerExample(id, builder) { BUILDERS[id] = builder; }

/* --------------------------------------------------------------------------
   Live numbers in the authors' own text.

   A figure in the prose carries data-live="<driver>:<key>", where <driver> is
   the id of the example whose controls move it. While that example is shut the
   span shows exactly what was printed in 1885; while it is open the span shows
   what the sliders say, in the colour of the slider saying it. Closing the
   example restores the memoir.
   ------------------------------------------------------------------------*/
const LIVE = {};
const LIVE_OPEN = new Set();

function registerLive(driverId, bindings, opts) {
  LIVE[driverId] = { get: bindings, opts: opts || {} };
  refreshLive(driverId);
}

function liveEngaged(driverId) {
  const rec = LIVE[driverId];
  if (!rec) return false;
  return rec.opts.engaged ? !!rec.opts.engaged() : LIVE_OPEN.has(driverId);
}

/* `also` lets one driver pull another along, for the case where two adjacent
   demonstrations are working the same pair of numbers and either may be the
   one being driven. The guard is because those relations are mutual. */
const REFRESHING = new Set();

function refreshLive(driverId) {
  const rec = LIVE[driverId];
  if (!rec || REFRESHING.has(driverId)) return;
  REFRESHING.add(driverId);
  try { refreshLiveInner(driverId, rec); (rec.opts.also || []).forEach(refreshLive); }
  finally { REFRESHING.delete(driverId); }
}

function refreshLiveInner(driverId, rec) {
  const on = liveEngaged(driverId);
  const prefix = driverId + ":";
  $$(`[data-live^="${prefix}"]`).forEach((el) => {
    if (el.dataset.printed === undefined) el.dataset.printed = el.innerHTML;
    const key = el.getAttribute("data-live").slice(prefix.length);
    let out = null;
    if (on && rec.get[key]) {
      try { out = rec.get[key](); } catch (e) { out = null; }
    }
    if (out === null || out === undefined) {
      if (el.innerHTML !== el.dataset.printed) el.innerHTML = el.dataset.printed;
      el.classList.remove("is-live");
      return;
    }
    const s = String(out);
    if (el.innerHTML !== s) el.innerHTML = s;
    el.classList.add("is-live");
  });
  if (rec.opts.onRefresh) rec.opts.onRefresh(on);
}

/* Any control touched inside a driver's container re-reads that driver's
   getters. Bubble phase, so the example's own handlers have already run. */
["input", "change", "click"].forEach((type) => {
  document.addEventListener(type, (ev) => {
    const t = ev.target;
    if (!t || !t.closest) return;
    const host = t.closest(".example-container[id], #peirce-table-block");
    if (host && LIVE[host.id]) refreshLive(host.id);
  });
});

/* --------------------------------------------------------------------------
   Clauses that own a stretch of a slider's travel. A paragraph marked up with
   data-band-for="<driver>" and data-band="lo,hi" lights while the driver's
   reported position is inside [lo, hi), so the prose reads as a running
   commentary on where the control is. The driver reports its position by
   calling bandPosition(id, x).
   ------------------------------------------------------------------------*/
function bandPosition(driverId, x) {
  $$(`[data-band-for="${driverId}"]`).forEach((el) => {
    const [lo, hi] = el.getAttribute("data-band").split(",").map(Number);
    el.classList.toggle("band-on", x >= lo && x < hi);
  });
}

function bandsOff(driverId) {
  $$(`[data-band-for="${driverId}"]`).forEach((el) => el.classList.remove("band-on"));
}

/* --------------------------------------------------------------------------
   Opening an example. The container is a one-row grid whose row goes 0fr ->
   1fr, which animates to the content's own height without measuring anything;
   .ex-inner does the clipping. The prose below is pushed down by the growth
   rather than being covered over, so the example takes its place in the column
   instead of arriving on top of it.
   ------------------------------------------------------------------------*/
function exInner(box) {
  let inner = box.querySelector(":scope > .ex-inner");
  if (!inner) {
    inner = document.createElement("div");
    inner.className = "ex-inner";
    box.appendChild(inner);
  }
  return inner;
}

document.addEventListener("click", (ev) => {
  const trg = ev.target.closest("[data-toggle]");
  if (!trg) return;
  const id = trg.getAttribute("data-toggle");
  const box = document.getElementById(id);
  if (!box) return;

  const inner = exInner(box);
  if (!BUILT[id] && BUILDERS[id]) { BUILDERS[id](inner); BUILT[id] = true; }

  const opening = !box.classList.contains("open");
  box.classList.toggle("open", opening);
  if (opening) box.removeAttribute("inert"); else box.setAttribute("inert", "");
  $$(`[data-toggle="${id}"]`).forEach((t) => t.classList.toggle("is-open", opening));

  $$(`[data-hl-for="${id}"]`).forEach((el) => el.classList.toggle("hl-on", opening));

  if (opening) { LIVE_OPEN.add(id); requestAnimationFrame(redrawAll); }
  else { LIVE_OPEN.delete(id); bandsOff(id); }
  refreshLive(id);
});

/* Plots are sized from clientWidth, so they want a redraw once the row has
   finished growing; and the example is nudged into view only if the growth
   left it hanging off the bottom. */
document.addEventListener("transitionend", (ev) => {
  if (ev.propertyName !== "grid-template-rows") return;
  const box = ev.target;
  if (!box.classList || !box.classList.contains("example-container")) return;
  if (!box.classList.contains("open")) return;
  redrawAll();
  const r = box.getBoundingClientRect();
  if (r.top < 0 || r.top > window.innerHeight * 0.75) {
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

$$(".example-container").forEach((box) => box.setAttribute("inert", ""));

/* Each example's number in the gutter beside the passage that opens it, taken
   from its own id so it matches the part files in src/. */
const NUMBERED = new Set();
$$("[data-toggle]").forEach((trg) => {
  const id = trg.getAttribute("data-toggle") || "";
  const m = /(\d+)$/.exec(id);
  // an example may be opened from several passages in a row; only the first of
  // them takes the number, or the gutter reads as several examples alike
  if (!m || NUMBERED.has(id) || $(".ex-num", trg)) return;
  NUMBERED.add(id);
  trg.insertBefore(h(`<span class="ex-num" aria-hidden="true">${m[1]}</span>`), trg.firstChild);
});

/* collapsible inner header */
function exHeader(title, contentId) {
  const el = h(`<div class="example-header">${esc(title)}</div>`);
  el.addEventListener("click", () => {
    el.classList.toggle("collapsed");
    const c = document.getElementById(contentId);
    c.style.display = c.style.display === "none" ? "block" : "none";
    redrawAll();
  });
  return el;
}
</script>
