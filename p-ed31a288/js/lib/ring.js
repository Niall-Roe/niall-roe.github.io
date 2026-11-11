import {esc} from "./dom.js";
import {weekday, clock} from "./fmt.js";
export const TONIGHT = [23, 0, 1, 2, 3, 4, 5, 6];
export function fmtDur(s) {
  return s < 90 ? "about a minute" : s < 3600 ? `about ${Math.round(s / 60)} min` : s < 48 * 3600 ? `about ${Math.round(s / 3600)} h` : `about ${Math.round(s / 86400)} days`;
}
const pill = est => { const rough = est.kind !== "measured"; return `<span class="pill${rough ? " check" : ""}" title="${esc(est.source || "")}">${rough ? "rough" : "measured"}</span>`; };
export const unknown = reason => `not known yet${reason ? ` <span class="qm" tabindex="0" role="button" aria-label="${esc(reason)}" title="${esc(reason)}">?</span>` : ""}`;
export const fmtIso = iso => !String(iso).includes("T") ? weekday(iso + "T12:00") : `${weekday(iso)}, ${clock(iso)}`;
export function fmtLeft(est, suffix = "left", reason = "") {
  if (!est || est.seconds == null) return unknown(reason);
  return `${fmtDur(est.seconds)}${suffix ? " " + suffix : ""} ${pill(est)}`;
}
export function hoursOf(schedule) {
  if (!schedule || schedule.when === "now") return new Set(Array.from({length: 24}, (_, h) => h));
  return new Set(schedule.when === "tonight" ? TONIGHT : schedule.hours || []);
}
