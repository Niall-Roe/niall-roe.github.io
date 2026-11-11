import {get, post} from "./api.js";
import {esc, on} from "./dom.js";
import {bytes} from "./fmt.js";
import {failNote} from "./state.js";
const BLOCKS = new Map();
const TECH = /settings\.html$/.test(location.pathname);
let M = null, POLL = 0;
const rowsOf = kind => (M?.models || []).filter(r => r.kind === kind);
const share = i => i.total ? Math.min(1, i.done / i.total) : 0;
export async function modelBlock(el, kind, {done = null} = {}) {
  if (!el) return;
  el.dataset.mg = kind; el.classList.add("mg");
  BLOCKS.set(el, {kind, done});
  if (!M) await refresh(); else draw(el);
}
export function mountAll(root = document, done = null) {
  root.querySelectorAll("[data-mgk]").forEach(el => { if (!BLOCKS.has(el)) modelBlock(el, el.dataset.mgk, {done: done && (() => done(el.dataset.mgk))}); });
}
export async function modelsFor(kind) { if (!M) await refresh(); return M?.managed ? rowsOf(kind) : null; }
async function refresh() {
  try { M = await get("/models"); M.err = null; } catch (e) { M = {...(M || {}), err: e}; }
  for (const el of [...BLOCKS.keys()]) if (!el.isConnected) BLOCKS.delete(el); else draw(el);
  clearTimeout(POLL);
  if (M?.install?.state === "running") POLL = setTimeout(refresh, 1000);
}
function draw(el) {
  const {kind, done} = BLOCKS.get(el), I = M?.install;
  if (M?.err && !M.models) { el.innerHTML = failNote(M.err, refresh, {what: "The models"}); return; }
  const rows = rowsOf(kind), need = rows.filter(r => !r.current && (!r.optional || !!M?.bundled?.roles.includes(r.role)));
  if (!M?.managed || (!need.length && "mgQuiet" in el.dataset && !el.dataset.mgWas)) {
    el.innerHTML = ""; el.closest("section.sec")?.toggleAttribute("hidden", !M?.managed); return;
  }
  if (need.length) el.dataset.mgWas = "1";
  const mine = I && (I.roles.some(r => rows.some(x => x.role === r)) || (I.source === "file" && !I.roles.length));
  const line = r => `<div class="mg-r"><b>${esc(r.label || r.display)}</b>${TECH && r.label && r.display && r.display.toLowerCase() !== r.label.toLowerCase() ? ` <span class="k">(${esc(r.display)})</span>` : ""} <span class="k">${esc(r.use || "")} · ${r.env ? `Python packages from ${esc(r.host || "pypi.org")}${r.current ? "" : ` · ${bytes(r.disk)} once installed`}` : bytes(r.bytes)}${r.current ? " · on this Mac" : ""}${TECH && r.engine ? ` · reads with ${esc(r.engine)}` : ""}</span></div>`;
  let html = `<div class="mg-rows">${(need.length ? need : rows).map(line).join("")}</div>`;
  if (I?.state === "running" && mine) {
    const verb = I.source === "download" ? `Downloading from ${esc(I.host)}` : M?.bundled ? "Installing" : "Copying from the file";
    const step = I.roles.includes("kraken_env") && /^(downloading|installing|checking|unpacking)/.test(I.now || "") ? esc(I.now[0].toUpperCase() + I.now.slice(1)) : "";
    html += `<div class="mg-run" role="status"><div class="bar"><span class="done" style="width:${(100 * share(I)).toFixed(1)}%"></span></div>
      <div class="k num">${step || `${verb}${I.now ? `: ${esc(I.now)}` : ""}`} · ${I.total ? `${bytes(I.done)} of ${bytes(I.total)}` : bytes(I.done)}</div></div>`;
  } else if (need.length) {
    const ms = need.filter(r => !r.env), env = need.find(r => r.env);
    const dl = ms.length && ms.every(r => r.host), total = ms.reduce((s, r) => s + r.bytes, 0), host = [...new Set(ms.map(r => r.host))].join(", ");
    const B = M?.bundled, withApp = !!B && need.every(r => B.roles.includes(r.role));
    const both = withApp && new Set((M?.models || []).filter(r => !r.env && B.roles.includes(r.role)).map(r => r.kind)).size > 1;
    const what = both ? "the readers and search models" : kind === "reading" ? "the readers" : "the search models";
    const file = TECH || (!withApp && !dl && !env?.host);
    html += `<div class="mg-go">` + (withApp ? `<button type="button" class="go" data-mg-app="${esc(kind)}">Install ${what} (${bytes(B.bytes)}) from this app</button> ` :
      (dl ? `<button type="button" class="go" data-mg-dl="${esc(kind)}">Download ${bytes(total)} from ${esc(host)}</button> ` : "") +
      (env?.host ? `<button type="button" class="go" data-mg-env>Download ${bytes(env.bytes)} from ${esc(env.host)}</button> ` : "")) +
      (file ? `<button type="button" class="${withApp || dl ? "quiet" : ""}" data-mg-file="${esc(kind)}">From a file you were given…</button>` : "") + `</div>`;
  }
  if (I?.state === "failed" && mine && need.length) {
    const again = I.roles.includes("kraken_env") && I.source === "download" ? () => start(el, "env") : I.source === "download" ? () => start(el, "dl") : M?.bundled ? () => start(el, "app") : () => start(el, "file");
    html += failNote(new Error(`Not installed: ${I.error}`), again);
  }
  el.innerHTML = html;
  if (!need.length && done && !el.dataset.mgDone) { el.dataset.mgDone = "1"; done(); }
}
async function start(el, how) {
  const {kind} = BLOCKS.get(el) || {};
  el.querySelectorAll("button").forEach(b => { b.disabled = true; });
  try {
    const r = how === "dl" ? await post("/models/download", {kind}) : how === "env" ? await post("/models/download", {roles: ["kraken_env"]}) : how === "app" ? await post("/models/from-app", {}) : await post("/models/from-file", {});
    if (how === "file" && r.chosen === false) { draw(el); return; }
    M = r;
  } catch (e) {
    el.insertAdjacentHTML("beforeend", failNote(e, () => start(el, how)));
    el.querySelectorAll("button:not(.stretry)").forEach(b => { b.disabled = false; });
    return;
  }
  await refresh();
}
on("click", "[data-mg-dl]", b => { const el = b.closest("[data-mg]"); if (el) start(el, "dl"); });
on("click", "[data-mg-file]", b => { const el = b.closest("[data-mg]"); if (el) start(el, "file"); });
on("click", "[data-mg-app]", b => { const el = b.closest("[data-mg]"); if (el) start(el, "app"); });
on("click", "[data-mg-env]", b => { const el = b.closest("[data-mg]"); if (el) start(el, "env"); });
