import {esc} from "./dom.js";
export const COL = {ms: "#3a6fd8", lp: "#c08a3e", le: "#8f6bd1", other: "#6b6b66"};
export const FOLDER = `<svg viewBox="0 0 100 80" aria-hidden="true"><path class="back" d="M4 12a4 4 0 0 1 4-4h24l7 7h53a4 4 0 0 1 4 4v53a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/>` +
  [0, 1, 2].map(i => `<g class="sheet"><rect x="${16 + i * 5}" y="${8 + i * 3}" width="64" height="52" rx="2" transform="rotate(${[-4, 2, -1][i]} 50 40)"/><path d="M${24 + i * 5} ${18 + i * 3}h44M${24 + i * 5} ${24 + i * 3}h40M${24 + i * 5} ${30 + i * 3}h46" transform="rotate(${[-4, 2, -1][i]} 50 40)"/></g>`).join("") +
  `<path class="front" d="M2 32a3 3 0 0 1 3-3h90a3 3 0 0 1 3 3l-3 41a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/></svg>`;
export const ZMARK = `<svg viewBox="0 0 40 40" aria-hidden="true" class="zmark"><rect width="40" height="40" rx="8"/><path d="M11 11h18v4L17 26h12v4H11v-4l12-11H11z"/></svg>`;
export const ICON = {
  lens: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4.5 4.5"/></svg>`,
  lines: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12M2 7h10M2 10.5h12M2 14h7"/></svg>`,
  eye: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8z"/><circle cx="8" cy="8" r="2"/></svg>`,
  type: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3.5h10M8 3.5V14M5.5 14h5"/></svg>`,
  page: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.5h6l3 3v10h-9z"/><path d="M5.5 7h5M5.5 9.5h5M5.5 12h3"/></svg>`,
  box: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5l6-3 6 3v6l-6 3-6-3z"/><path d="M2 5l6 3 6-3M8 8v6"/></svg>`,
  clock: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.5V8l2.5 1.6"/></svg>`,
  gear: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></svg>`,
  book: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 9.5C13.2 7.6 9 7 4.5 7.5v16c4.5-.5 8.7.1 11.5 2 2.8-1.9 7-2.5 11.5-2v-16c-4.5-.5-8.7.1-11.5 2z"/><path d="M16 9.5v16"/><path class="q" d="M8.2 12.6a2.2 2.2 0 1 1 3 2.1c-.7.3-1 .8-1 1.5v.6"/><circle class="qd" cx="10.2" cy="19.4" r=".9"/></svg>`,
  learn: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 12.5h7"/><path d="M10.5 13.5l1-3 3.2-3.2a1.4 1.4 0 0 0-2-2L9.5 8.5l-1 3z"/><path d="M1.5 9h5M1.5 5.5h8"/></svg>`,
};
export const NODES = [
  {id: "src", type: "src", name: "Source library"},
  {id: "ms", type: "fold", name: "Manuscripts"},
  {id: "lp", type: "fold", name: "Lifetime publications"},
  {id: "le", type: "fold", name: "Later editions"},
  {id: "det", type: "box", icon: "lens", name: "Manuscript detector", sub: "sorting files by kind"},
  {id: "pre", type: "box", icon: "lines", name: "Preprocessor", sub: "line finding and cutting"},
  {id: "q", type: "chip", icon: "clock", name: "Reading", bar: "Queue"},
  {id: "r1", type: "box", icon: "eye", tag: "Reader 1"},
  {id: "r2", type: "box", icon: "eye", tag: "Reader 2"},
  {id: "tp", type: "box", icon: "type", tag: "Typed pages"},
  {id: "pdf", type: "box", icon: "page", name: "PDF clean-up"},
  {id: "cw", type: "box small", icon: "box", name: "Comes with the app", sub: "catalogue, Ketner's list, reel map, concordance"},
  {id: "lib", type: "lib", name: "Library"},
  {id: "lbn", type: "lbn", name: "Librarian"},
  {id: "learn", type: "box", icon: "learn", name: "Help it learn"},
];
export const WIRES = [["src", "ms", COL.ms], ["src", "lp", COL.lp], ["src", "le", COL.le],
  ["ms", "det", COL.ms], ["det", "pre", COL.ms], ["pre", "r1", COL.ms], ["pre", "r2", COL.ms], ["pre", "tp", COL.ms],
  ["r1", "lib", COL.ms], ["r2", "lib", COL.ms], ["tp", "lib", COL.ms],
  ["lp", "pdf", COL.lp], ["le", "pdf", COL.le], ["pdf", "lib", COL.le], ["cw", "lib", COL.other], ["lib", "lbn", COL.other, "down"], ["lib", "learn", COL.other]]
  .map(([a, b, col, side]) => ({id: `${a}-${b}`, a, b, col, side: side || "right"}));
export function nodeHTML(d, {asButton = true} = {}) {
  const inner = d.type === "src" ? `<span class="srcart">${FOLDER}${ZMARK}</span><span class="nm">${esc(d.name)}</span>`
    : d.type === "fold" ? `<i class="fi" style="--k:${COL[d.id]}"></i><span><span class="nm">${esc(d.name)}</span>`
    : d.type === "lib" ? `<span class="face"><img src="icon/peirce-source.jpg" alt=""></span><span class="nm">${esc(d.name)}</span>`
    : d.type === "lbn" ? `<span class="lbart">${ICON.book}</span><span><span class="nm">${esc(d.name)}</span>`
    : `<span class="hd">${ICON[d.icon] || ""}<span class="nm">${esc(d.tag || d.name)}</span></span>${d.sub ? `<span class="sub">${esc(d.sub)}</span>` : ""}`;
  const close = d.type === "fold" || d.type === "lbn" ? "</span>" : "";
  const cls = `nd t-${d.type.split(" ").join(" t-")}`, tail = `<i class="dot" aria-hidden="true"></i>${inner}<span class="live" data-live="${d.id}"></span>${close}`;
  return asButton ? `<div class="cell a-${d.id}"><button type="button" class="${cls}" data-n="${d.id}" aria-haspopup="dialog" aria-expanded="false">${tail}</button></div>`
    : `<div class="cell a-${d.id}"><div class="${cls}" data-n="${d.id}">${tail}</div></div>`;
}
