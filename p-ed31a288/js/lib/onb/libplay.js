import {esc} from "../dom.js";
export const ROWS = 4;
export const OPEN = 2;
export function plan(ex) {
  if (!ex || !ex.question || !Array.isArray(ex.searches) || !ex.searches.length || !Array.isArray(ex.results) || !ex.results.length) return null;
  const results = [...ex.results].sort((a, b) => a.n - b.n), byN = new Map(results.map(r => [r.n, r]));
  const sentences = ex.sentences || [];
  const groups = (ex.groups || []).map(g => {
    const ss = sentences.filter(s => s.g === g.g && s.ok);
    const refs = [...new Set([...(g.refs || []), ...ss.flatMap(s => s.refs || [])])].sort((a, b) => a - b);
    return {name: g.name, ok: g.ok !== false, refs, off: g.off || [], ss};
  }).filter(g => g.refs.length);
  const lead = sentences.filter(s => s.g < 0 && s.ok);
  const named = [...groups.flatMap(g => g.refs), ...lead.flatMap(s => s.refs || [])];
  const order = [...new Set([...named, ...results.map(r => r.n)])];
  const picks = order.filter(n => byN.get(n)?.reading).slice(0, OPEN);
  const shownNs = new Set([...results.slice(0, ROWS).map(r => r.n), ...picks]);
  const rows = results.filter(r => shownNs.has(r.n));
  return {question: ex.question, searches: ex.searches, model: ex.model_name || ex.model || "", rows,
    more: results.length - rows.length, total: results.length, picks: picks.map(n => byN.get(n)),
    groups, lead, none: !!ex.none, error: ex.error || ""};
}
const root = w => w.replace(/(?:ing|ed|es|s)$/, m => w.length - m.length >= 4 ? "" : m);
export function marker(searches) {
  const stems = [...new Set(searches.flatMap(s => s.toLowerCase().split(/[^\p{L}’']+/u)).filter(w => w.length >= 4)
    .map(w => root(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))];
  if (!stems.length) return t => esc(t);
  const re = new RegExp(`(?<![\\p{L}])((?:${stems.join("|")})\\p{L}*)`, "giu");
  return t => esc(t).replace(re, "<mark>$1</mark>");
}
export function withRefs(text) {
  return esc(text).replace(/\s*\[(\d{1,3}(?:\s*[,–-]\s*\d{1,3})*)\]/g, (m, g) => {
    const ns = [];
    for (const part of g.split(",")) {
      const r = part.trim().match(/^(\d+)\s*[–-]\s*(\d+)$/);
      if (r && +r[2] - +r[1] > 0 && +r[2] - +r[1] <= 10) for (let i = +r[1]; i <= +r[2]; i++) ns.push(i);
      else if (/^\d+$/.test(part.trim())) ns.push(+part.trim());
    }
    return " " + ns.map(chip).join("");
  });
}
export const chip = n => `<span class="lbref">${n}</span>`;
