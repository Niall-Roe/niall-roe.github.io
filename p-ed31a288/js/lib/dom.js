export const $ = id => document.getElementById(id);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
export function toast(msg, act = null) {
  let t = $("toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.id = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.append(t); }
  t.textContent = msg; t.classList.add("on"); t.classList.toggle("act", !!act);
  if (act) {
    const b = document.createElement("button"); b.type = "button"; b.className = "toastact"; b.textContent = act.label;
    b.addEventListener("click", () => { t.classList.remove("on", "act"); clearTimeout(toast._h); act.fn(); });
    t.append(" ", b);
  }
  clearTimeout(toast._h); toast._h = setTimeout(() => t.classList.remove("on", "act"), act ? 8000 : 3200);
}
export function on(type, selector, fn) {
  document.addEventListener(type, e => { const el = e.target.closest?.(selector); if (el) fn(el, e); });
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const qm = text => text ? `<span class="qm" tabindex="0" role="button" aria-label="${esc(text)}" title="${esc(text)}">?</span>` : "";
let QMT = null, QMAT = null;
function qmShow(el) {
  if (el.title) { el.dataset.qm = el.title; el.removeAttribute("title"); }
  const t = el.dataset.qm; if (!t) return;
  if (!el.hasAttribute("tabindex")) { el.tabIndex = 0; el.setAttribute("role", "button"); el.setAttribute("aria-label", t); }
  if (!QMT) { QMT = document.createElement("div"); QMT.className = "qmtip"; QMT.setAttribute("role", "tooltip"); document.body.append(QMT); }
  QMT.textContent = t; QMT.hidden = false; QMAT = el;
  const r = el.getBoundingClientRect(), w = QMT.offsetWidth, h = QMT.offsetHeight;
  QMT.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
  QMT.style.top = (r.bottom + 8 + h > innerHeight ? r.top - h - 8 : r.bottom + 8) + "px";
}
const qmHide = () => { if (QMT) QMT.hidden = true; QMAT = null; };
if (typeof document !== "undefined") {
document.addEventListener("mouseover", e => { const q = e.target.closest?.(".qm"); if (q) qmShow(q); else if (QMAT && !e.target.closest?.(".qmtip")) qmHide(); });
document.addEventListener("focusin", e => { const q = e.target.closest?.(".qm"); if (q) qmShow(q); else qmHide(); });
document.addEventListener("click", e => { const q = e.target.closest?.(".qm"); if (q) { e.preventDefault(); e.stopPropagation(); if (QMAT === q && !QMT.hidden) qmHide(); else qmShow(q); } else qmHide(); }, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && QMAT) qmHide(); if ((e.key === "Enter" || e.key === " ") && e.target.closest?.(".qm")) { e.preventDefault(); qmShow(e.target.closest(".qm")); } });
addEventListener("scroll", qmHide, {passive: true, capture: true});
}
export const shortSummary = t => { const head = String(t || "").split(" — ")[0]; const i = head.lastIndexOf(": "); return i >= 0 ? head.slice(i + 2) : head; };
