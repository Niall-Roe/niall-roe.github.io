import {esc} from "./dom.js";
import {pref, setPref} from "./prefs.js";
const PDF = /^\/api\/v1\/reference\/printed-pdf\/[A-Za-z0-9_.-]{1,80}(#page=\d{1,5})?$/;
export const pdfOk = u => PDF.test(String(u || "")) ? String(u) : "";
export const withPdf = (href, url) => `${String(href).split("#")[0]}#pdf=${encodeURIComponent(url)}`;
export function pdfOf(hash) {
  const m = /^#pdf=([^&]*)$/.exec(String(hash || ""));
  if (!m) return "";
  try { return pdfOk(decodeURIComponent(m[1])); } catch (e) { return ""; }
}
let EL = null, OPENED = false;
function panel() {
  if (EL) return EL;
  EL = document.createElement("div");
  EL.className = "pdfview"; EL.id = "pdfview"; EL.hidden = true;
  EL.setAttribute("role", "dialog"); EL.setAttribute("aria-label", "your copy of the edition");
  document.body.append(EL);
  EL.addEventListener("click", e => {
    if (e.target.closest("[data-pdfback]")) { closePdf(); return; }
    const st = e.target.closest("[data-pdfstep]"); if (st) { turn(+st.dataset.pdfstep); return; }
    const z = e.target.closest("[data-pdfzoom]"); if (z) zoom(+z.dataset.pdfzoom);
  });
  new ResizeObserver(() => paint()).observe(EL);
  return EL;
}
export function pdfParts(url) {
  const m = /^\/api\/v1\/reference\/printed-pdf\/([0-9a-f]{12})(?:#page=(\d{1,5}))?$/.exec(String(url || ""));
  return m ? {id: m[1], page: Math.max(0, (parseInt(m[2] || "1", 10) || 1) - 1)} : null;
}
const pdfUrl = (id, page) => `/api/v1/reference/printed-pdf/${id}#page=${page + 1}`;
const ZOOMS = [50, 67, 80, 100, 125, 150, 200, 300];
let V = null;
function show(url, back, title) {
  const el = panel(), P = pdfParts(url);
  const t = esc(title || "your copy of the edition");
  el.innerHTML = `<div class="pdfh"><button type="button" class="navbtn" data-pdfback title="${esc(back && back !== "Back" ? `back to ${back}` : "back")} (Esc)">Close the PDF</button>` +
    `<span class="pdft">${t}</span>` +
    (P ? `<span class="turn" role="group" aria-label="the PDF's pages"><button type="button" class="turn-b" data-pdfstep="-1" title="the page before (←)" aria-label="the page before">◂</button>` +
      `<span class="turn-n" data-pdfn></span><button type="button" class="turn-b" data-pdfstep="1" title="the page after (→)" aria-label="the page after">▸</button></span>` +
      `<span class="turn pdfz" role="group" aria-label="zoom"><button type="button" class="turn-b" data-pdfzoom="-1" title="smaller (⌘−)" aria-label="smaller">−</button>` +
      `<span class="turn-n" data-pdfzl title="100%: the page's width fits the panel"></span><button type="button" class="turn-b" data-pdfzoom="1" title="larger (⌘+)" aria-label="larger">+</button></span>` : "") +
    `</div>` + (P ? `<div class="pdfb" tabindex="-1"><img class="pdfi" alt="${t}"></div>` : `<div class="pdfb"><p class="pdfe">This PDF cannot be shown here.</p></div>`);
  el.hidden = false; document.documentElement.classList.add("pdfopen");
  el.querySelector("[data-pdfback]").focus();
  if (!P) { V = null; return; }
  const zi = Math.max(0, Math.min(ZOOMS.length - 1, pref("pdf_zoom", ZOOMS.indexOf(100))));
  V = {id: P.id, page: P.page, n: V?.id === P.id ? V.n : null, zi, back, title};
  paint();
  if (V.n == null) {
    const id = V.id;
    fetch(`/api/v1/reference/printed-pdf/${id}/pages`, {headers: {Accept: "application/json"}}).then(r => r.ok ? r.json() : null)
      .then(d => { if (V?.id === id && Number.isInteger(d?.pages) && d.pages > 0) { V.n = d.pages; if (V.page > V.n - 1) V.page = V.n - 1; paint(); } }).catch(() => {});
  }
}
const want = css => Math.max(200, Math.min(2400, Math.ceil(css * (devicePixelRatio || 1) / 200) * 200));
let SHOWN = "";
function paint(turned = false) {
  if (!V || !EL || EL.hidden) return;
  const body = EL.querySelector(".pdfb"), img = EL.querySelector(".pdfi"); if (!body || !img) return;
  const fit = Math.max(200, body.clientWidth - 32), css = Math.round(fit * ZOOMS[V.zi] / 100);
  img.style.width = css + "px";
  EL.querySelector("[data-pdfn]").textContent = `PDF p. ${V.page + 1}${V.n ? ` of ${V.n}` : ""}`;
  EL.querySelector("[data-pdfzl]").textContent = ZOOMS[V.zi] + "%";
  EL.querySelector('[data-pdfstep="-1"]').disabled = V.page <= 0;
  EL.querySelector('[data-pdfstep="1"]').disabled = V.n != null && V.page >= V.n - 1;
  EL.querySelector('[data-pdfzoom="-1"]').disabled = V.zi <= 0;
  EL.querySelector('[data-pdfzoom="1"]').disabled = V.zi >= ZOOMS.length - 1;
  const src = `/api/v1/reference/printed-page/${V.id}/${V.page}.jpg?w=${want(css)}`;
  if (src === SHOWN) return;
  SHOWN = src; body.classList.add("pdfwait");
  const next = new Image(), id = V.id, page = V.page;
  next.onload = () => { if (SHOWN !== src) return; img.src = src; body.classList.remove("pdfwait"); body.querySelector(".pdfe")?.remove(); img.hidden = false; if (turned) body.scrollTo(0, 0);
    if (V && V.id === id && V.page === page && (V.n == null || page + 1 < V.n)) new Image().src = `/api/v1/reference/printed-page/${id}/${page + 1}.jpg?w=${want(css)}`; };
  next.onerror = () => { if (SHOWN !== src) return; body.classList.remove("pdfwait"); img.hidden = true;
    if (!body.querySelector(".pdfe")) body.insertAdjacentHTML("beforeend", `<p class="pdfe">PDF p. ${page + 1} could not be drawn. Try the page before or after, or close the PDF and open it again.</p>`); };
  next.src = src;
}
function turn(d) {
  if (!V) return;
  const p = Math.max(0, Math.min(V.n != null ? V.n - 1 : Infinity, V.page + d)); if (p === V.page) return;
  V.page = p;
  const url = pdfUrl(V.id, p), keepHash = !!location.hash && !pdfOf(location.hash);
  try { history.replaceState({...(history.state || {}), pdf: url}, "", keepHash ? location.href : withPdf(location.href, url)); } catch (e) {   }
  paint(true);
}
function zoom(d) {
  if (!V) return;
  const zi = Math.max(0, Math.min(ZOOMS.length - 1, V.zi + d)); if (zi === V.zi) return;
  const b = EL.querySelector(".pdfb"), at = b && b.scrollHeight ? (b.scrollTop + b.clientHeight / 2) / b.scrollHeight : 0;
  V.zi = zi; setPref("pdf_zoom", zi); paint();
  if (b) b.scrollTop = Math.max(0, at * b.scrollHeight - b.clientHeight / 2);
}
function hide() {
  if (!EL || EL.hidden) return;
  EL.hidden = true; EL.innerHTML = ""; SHOWN = ""; document.documentElement.classList.remove("pdfopen");
}
export function openPdf(url, back = "", title = "") {
  if (!pdfOk(url)) return false;
  const keepHash = !!location.hash && !pdfOf(location.hash);
  history.pushState({...(history.state || {}), pdf: url, pdfBack: back, pdfTitle: title}, "", keepHash ? location.href : withPdf(location.href, url));
  OPENED = true;
  show(url, back, title);
  return true;
}
export function closePdf() {
  if (history.state?.pdf && OPENED) { history.back(); return; }
  hide();
  if (pdfOf(location.hash)) history.replaceState({...(history.state || {}), pdf: null}, "", location.href.split("#")[0]);
}
if (typeof document !== "undefined") {
  addEventListener("popstate", () => {
    const u = history.state?.pdf || pdfOf(location.hash);
    if (u) show(u, history.state?.pdfBack, history.state?.pdfTitle); else { OPENED = false; hide(); }
  });
  document.addEventListener("keydown", e => {
    if (!EL || EL.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closePdf(); return; }
    if (!V) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === "=" || e.key === "+" || e.key === "-" || e.key === "_")) { e.preventDefault(); e.stopImmediatePropagation(); zoom(e.key === "-" || e.key === "_" ? -1 : 1); return; }
    if (!mod && !e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); e.stopImmediatePropagation(); turn(e.key === "ArrowLeft" ? -1 : 1); }
  }, true);
  const u = pdfOf(location.hash);
  if (u) addEventListener("DOMContentLoaded", () => show(u, history.state?.pdfBack || "Back", history.state?.pdfTitle), {once: true});
}
