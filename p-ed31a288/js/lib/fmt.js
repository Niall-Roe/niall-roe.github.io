const NF = new Intl.NumberFormat("en-GB");
export const UNKNOWN = "–";
export const UNKNOWN_HTML = `<span class="unknown" title="not known">–</span>`;
const known = v => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
export const num = v => known(v) ? NF.format(Number(v)) : UNKNOWN;
export const bytes = b => !known(b) ? UNKNOWN : b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${NF.format(Math.max(1, Math.round(b / 1e6)))} MB`;
export function pct(v, digits = 0) {
  if (!known(v)) return UNKNOWN;
  const k = 10 ** digits, x = Math.floor(Number(v) * 100 * k + 1e-9) / k;
  return `${x.toFixed(digits)}%`;
}
export const plural = (n, one, many) => `${num(n)} ${Number(n) === 1 ? one : many}`;
export const items = n => plural(n, "item", "items");
export const lookedAt = (n, total) => known(total) ? `${num(n)} of ${items(total)} looked at` : `${items(n)} looked at`;
const asDate = d => {
  if (d === null || d === undefined || d === "") return null;
  const x = d instanceof Date ? d : new Date(typeof d === "string" ? d.replace(/^(\d{4}-\d\d-\d\d) /, "$1T") : d);
  return isNaN(x) ? null : x;
};
const DAY = new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "short", year: "numeric"});
const DAYMONTH = new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "short"});
const CLOCK = new Intl.DateTimeFormat("en-GB", {hour: "2-digit", minute: "2-digit", hour12: false});
const WEEKDAY = new Intl.DateTimeFormat("en-GB", {weekday: "short"});
export const day = d => { const x = asDate(d); return x ? DAY.format(x) : ""; };
export const dayMonth = d => { const x = asDate(d); return x ? DAYMONTH.format(x) : ""; };
export const clock = d => { const x = asDate(d); return x ? CLOCK.format(x) : ""; };
export const dayTime = d => { const x = asDate(d); return x ? `${DAY.format(x)}, ${CLOCK.format(x)}` : ""; };
export const weekday = d => { const x = asDate(d); return x ? `${WEEKDAY.format(x)} ${DAYMONTH.format(x)}` : ""; };
export function ago(t) {
  const x = asDate(t); if (!x) return "";
  const m = Math.round((Date.now() - x.getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
}
