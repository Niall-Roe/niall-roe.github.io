import {demoEnd, inDemo} from "./api.js";
import {on} from "./dom.js";
export const DEMO_FROM = "pc_demo_from";
const leave = () => { demoEnd(); try { sessionStorage.removeItem(DEMO_FROM); } catch (e) {   } location.href = "settings.html"; };
on("click", "[data-demo-leave]", leave);
if (typeof document !== "undefined" && /(^|\/)onboarding\.html$/.test(location.pathname)) {
  addEventListener("keydown", e => {
    if (e.key !== "Escape" || e.defaultPrevented || !inDemo()) return;
    if (e.target.closest?.("input, select, textarea, [role=dialog], [role=menu]") || document.querySelector("[role=dialog]:not([hidden]), [role=menu]:not([hidden])")) return;
    const back = document.getElementById("back");
    if (back && !back.hidden && back.offsetParent) { e.preventDefault(); back.click(); return; }
    leave();
  });
}
function backHome(persisted) {
  if (!inDemo()) return;
  let from = null; try { from = sessionStorage.getItem(DEMO_FROM); } catch (e) { from = null; }
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  if (!from || location.pathname.split("/").pop() !== from || !(persisted || nav?.type === "back_forward")) return;
  demoEnd(); try { sessionStorage.removeItem(DEMO_FROM); } catch (e) {   }
  document.querySelectorAll(".demomark").forEach(m => m.remove());
}
if (typeof location !== "undefined") { backHome(false); addEventListener("pageshow", e => { if (e.persisted) backHome(true); }); }
