import {esc} from "./dom.js";
import {num} from "./fmt.js";
export const VENN_COLOURS = ["var(--vc0)", "var(--vc1)", "var(--vc2)", "var(--vc3)"];
export const grayOrder = s => s === 0 ? [0] : s === 1 ? [1, 0] : s === 2 ? [1, 3, 2, 0] : [1, 3, 2, 6, 7, 5, 4, 0];
const lab = (cls, x, y, html, style = "", title = "") =>
  `<div class="${cls}" style="left:${Math.round(x)}px;top:${Math.round(y)}px;${style}"${title ? ` title="${esc(title)}"` : ""}>${html}</div>`;
export function vennBlocks({items, sets, W, SQ = 17, est = false, bgName = "in none of them", say = null}) {
  const HH = say ? 32 : 14;
  const K = sets.length, cnt = n => (est ? "~" : "") + num(n);
  const inn = items.filter(it => it.mask), bg = items.filter(it => !it.mask);
  const rowS = [...Array(K).keys()].filter(j => j % 2 === 0), colS = [...Array(K).keys()].filter(j => j % 2 === 1);
  const bits = (it, S) => S.reduce((a, j, q) => a | (it.mask & (1 << j) ? 1 << q : 0), 0);
  const cells = {};
  inn.forEach(it => { (cells[bits(it, rowS) + "," + bits(it, colS)] ||= []).push(it); });
  let cols = grayOrder(colS.length);
  const rows = grayOrder(rowS.length).filter(r => cols.some(c => cells[r + "," + c]));
  cols = cols.filter(c => rows.some(r => cells[r + "," + c]));
  const setCount = j => inn.filter(it => it.mask & (1 << j)).length;
  const LM = K ? Math.max(110, ...rowS.map(j => Math.ceil(`${sets[j].name} · ${cnt(setCount(j))}`.length * 7) + 22)) : 0, TM = colS.length ? 30 + 20 * (colS.length - 1) : 6, G = 26;
  let cw = cols.map(c => Math.max(3, Math.ceil(Math.sqrt(Math.max(1, ...rows.map(r => (cells[r + "," + c] || []).length)) * 1.6))));
  const avail = Math.floor((W - LM - G * cols.length) / SQ), tot = cw.reduce((a, b) => a + b, 0);
  if (tot > avail) cw = cw.map(w => Math.max(2, Math.floor(w * avail / tot)));
  const rh = rows.map(r => Math.max(1, ...cols.map((c, j) => Math.ceil((cells[r + "," + c] || []).length / cw[j]))));
  const cx = []; let x = LM; cols.forEach((c, j) => { cx.push(x); x += cw[j] * SQ + G; }); const gridR = x - G;
  const ry = []; let y = TM; rows.forEach((r, i) => { ry.push(y); y += HH + rh[i] * SQ + G; }); const gridB = y - G;
  const pos = new Map();
  let regions = "", labels = "";
  const comboName = mask => { const s = sets.filter((_, j) => mask & (1 << j)).map(x => x.name), no = sets.filter((_, j) => !(mask & (1 << j))).map(x => x.name);
    return s.join(" + ") + (no.length ? ` (not ${no.join(", ")})` : ""); };
  rows.forEach((r, i) => cols.forEach((c, j) => {
    const L = cells[r + "," + c]; if (!L) return;
    labels += say ? lab("vb-n say", cx[j], ry[i], `<b>${cnt(L.length)}</b> ${esc(say(L[0].mask))}`, `width:${Math.max(60, cw[j] * SQ + G - 8)}px`, `${comboName(L[0].mask)}: ${cnt(L.length)}`)
      : lab("vb-n", cx[j], ry[i], cnt(L.length), "", `${comboName(L[0].mask)}: ${cnt(L.length)}`);
    L.forEach((it, k) => pos.set(it.vk, [cx[j] + (k % cw[j]) * SQ, ry[i] + HH + Math.floor(k / cw[j]) * SQ]));
  }));
  const runs = (list, q) => { const out = []; let cur = null; list.forEach((v, i) => { if (v & (1 << q)) { if (cur && cur[1] === i - 1) cur[1] = i; else { cur = [i, i]; out.push(cur); } } }); return out; };
  const region = (x, y, w, h, col) => `<div class="vb-r" style="left:${Math.round(x)}px;top:${Math.round(y)}px;width:${Math.round(w)}px;height:${Math.round(h)}px;--rc:${col}"></div>`;
  const badge = (j, x, y) => lab("vb-l", x, y, `${sets[j].name} · ${cnt(setCount(j))}`, `--rc:${VENN_COLOURS[j]}`, sets[j].title || "");
  rowS.forEach((b, q) => { const pad = 5 + 5 * q;
    runs(rows, q).forEach(([a, z], t) => { regions += region(LM - pad - 8, ry[a] - pad, gridR - LM + 2 * pad + 8, ry[z] + HH + rh[z] * SQ - ry[a] + 2 * pad, VENN_COLOURS[b]);
      if (t === 0) labels += badge(b, 0, ry[a] - pad); }); });
  colS.forEach((b, q) => { const pad = 5 + 5 * q;
    runs(cols, q).forEach(([a, z], t) => { regions += region(cx[a] - pad, TM - pad - 6, cx[z] + cw[z] * SQ - cx[a] + 2 * pad, gridB - TM + 2 * pad + 6, VENN_COLOURS[b]);
      if (t === 0) labels += badge(b, cx[a] - pad, TM - pad - 24 - 20 * (colS.length - 1 - q)); }); });
  y = inn.length ? gridB + 30 : 0;
  if (bg.length) {
    labels += lab("vb-g", 0, y, `<b>${esc(bgName)}</b> · ${cnt(bg.length)}`); y += 20;
    const bc = Math.max(10, Math.floor((W + 3) / SQ));
    bg.forEach((it, i) => pos.set(it.vk, [(i % bc) * SQ, y + Math.floor(i / bc) * SQ]));
    y += Math.ceil(bg.length / bc) * SQ;
  }
  return {pos, marks: regions + labels, h: y + 10, bg};
}
