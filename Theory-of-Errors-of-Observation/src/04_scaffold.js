<script>
/* ==========================================================================
   Example scaffolding: click a highlighted passage to open its demonstration.
   Content is built lazily the first time a container is opened.

   Carried over unchanged in behaviour from the Probability of Induction page,
   so an example written for one paper drops into the other.
   ========================================================================*/

const BUILDERS = {};
const BUILT = {};

function registerExample(id, builder) { BUILDERS[id] = builder; }

/* --------------------------------------------------------------------------
   Live numbers in Peirce's own text.

   A figure in the prose carries data-live="<driver>:<key>", where <driver> is
   the id of the example whose controls move it. While that example is shut the
   span shows exactly what Peirce printed; while it is open the span shows what
   the sliders say, in the colour of the slider saying it. Closing the example
   restores his text — the document is his unless you are actively driving it.
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
    if (el.dataset.peirce === undefined) el.dataset.peirce = el.innerHTML;
    const key = el.getAttribute("data-live").slice(prefix.length);
    let out = null;
    if (on && rec.get[key]) {
      try { out = rec.get[key](); } catch (e) { out = null; }
    }
    if (out === null || out === undefined) {
      if (el.innerHTML !== el.dataset.peirce) el.innerHTML = el.dataset.peirce;
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
    const host = t.closest(".example-container[id]");
    if (host && LIVE[host.id]) refreshLive(host.id);
  });
});

/* --------------------------------------------------------------------------
   Opening an example. The container is a one-row grid whose row goes 0fr ->
   1fr, which animates to the content's own height without measuring anything;
   .ex-inner does the clipping.
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
  else LIVE_OPEN.delete(id);
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
$$("[data-toggle]").forEach((trg) => {
  const m = /(\d+)$/.exec(trg.getAttribute("data-toggle") || "");
  if (!m || $(".ex-num", trg)) return;
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

/* --------------------------------------------------------------------------
   Shared through the paper: one draw of an error from a named law of facility.
   The kinds are the ones Peirce himself names — transit observations, the
   chronograph key on an occultation, a coarse instrument, two observers whose
   series have been run together — and every later example that needs a law of
   error takes it from here, so the same four shapes recur throughout.
   ------------------------------------------------------------------------*/
function rnorm1(mean = 0, sd = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const ERROR_LAWS = {
  transit: {
    name: "Transit observations",
    gloss: "the error is compounded of a great many small independent ones",
    draw: (s) => rnorm1(0, s),
    dens: (e, s) => dnorm(e, 0, s),
  },
  occultation: {
    name: "A star out from behind the moon",
    gloss: "impossible to strike the key too early, possible to strike it indefinitely too late",
    // a shifted gamma: no mass to the left of the shift, a long right tail
    draw: (s) => {
      let g = 0;
      for (let i = 0; i < 3; i++) g += -Math.log(Math.random());
      return (g - 3) * s * 0.62;
    },
    dens: (e, s) => {
      const b = s * 0.62, x = e / b + 3;
      if (x <= 0) return 0;
      return (x * x * Math.exp(-x) / 2) / b;
    },
  },
  coarse: {
    name: "A coarse instrument",
    gloss: "the reading is carried to the nearest division and no further",
    draw: (s) => (Math.random() * 2 - 1) * s * 1.732,
    dens: (e, s) => (Math.abs(e) <= s * 1.732 ? 1 / (2 * s * 1.732) : 0),
  },
  twoObservers: {
    name: "Two observers run together",
    gloss: "one series, but taken under two sets of circumstances",
    draw: (s) => rnorm1(Math.random() < 0.5 ? -1.15 * s : 1.15 * s, s * 0.42),
    dens: (e, s) => 0.5 * dnorm(e, -1.15 * s, s * 0.42) + 0.5 * dnorm(e, 1.15 * s, s * 0.42),
  },
};
</script>
