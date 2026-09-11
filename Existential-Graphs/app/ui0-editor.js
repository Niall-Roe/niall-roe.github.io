/* ============================================================================
   A SMALL EDITOR FOR THE FORMULA BOXES.
   Brackets close themselves, a closing bracket typed over one already there
   steps past it, backspace between a pair takes both, and the text is coloured
   as you type with the matching brackets picked out.
   ========================================================================== */

const PAIRS = { '(': ')', '[': ']' };
const CLOSERS = new Set([')', ']']);

function enhanceEditor(ta, opts){
  opts = opts || {};
  if (!ta || ta.dataset.enhanced) return;
  ta.dataset.enhanced = '1';

  const wrap = document.createElement('div');
  wrap.className = 'editor';
  ta.parentNode.insertBefore(wrap, ta);
  const pre = document.createElement('pre');
  pre.className = 'hl';
  pre.setAttribute('aria-hidden', 'true');
  wrap.appendChild(pre);
  wrap.appendChild(ta);
  ta.setAttribute('spellcheck', 'false');
  ta.setAttribute('autocapitalize', 'off');
  ta.setAttribute('autocomplete', 'off');

  if (opts.glyphs !== false){
    const bar = document.createElement('div');
    bar.className = 'glyphs';
    bar.innerHTML = GLYPHS.map(g =>
      `<button type="button" data-ins="${esc(g.ins)}" title="${esc(g.t)}">${esc(g.s)}</button>`).join('');
    bar.onmousedown = e => {                      // mousedown, so focus is not lost
      const b = e.target.closest('button'); if (!b) return;
      e.preventDefault();
      insertAt(ta, b.dataset.ins);
      fire(ta);
    };
    wrap.parentNode.insertBefore(bar, wrap.nextSibling);
  }

  const paint = () => {
    pre.innerHTML = highlight(ta.value, ta.selectionStart);
    pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft;
  };
  ta.addEventListener('input', paint);
  ta.addEventListener('keyup', paint);
  ta.addEventListener('click', paint);
  ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; });
  ta.addEventListener('blur', () => { pre.innerHTML = highlight(ta.value, -1); });

  ta.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const s = ta.selectionStart, t = ta.selectionEnd, v = ta.value;
    if (PAIRS[e.key]){
      e.preventDefault();
      const sel = v.slice(s, t);
      const ins = e.key + sel + PAIRS[e.key];
      ta.value = v.slice(0, s) + ins + v.slice(t);
      ta.selectionStart = ta.selectionEnd = sel ? s + ins.length : s + 1;
      fire(ta); return;
    }
    if (CLOSERS.has(e.key) && s === t && v[s] === e.key){
      e.preventDefault();
      ta.selectionStart = ta.selectionEnd = s + 1;
      paint(); return;
    }
    if (e.key === 'Backspace' && s === t && s > 0 && PAIRS[v[s-1]] === v[s]){
      e.preventDefault();
      ta.value = v.slice(0, s-1) + v.slice(s+1);
      ta.selectionStart = ta.selectionEnd = s - 1;
      fire(ta); return;
    }
    if (e.key === 'Tab' && s === t && CLOSERS.has(v[s])){
      e.preventDefault();
      ta.selectionStart = ta.selectionEnd = s + 1;
      paint(); return;
    }
  });
  paint();
}
function insertAt(ta, text){
  const s = ta.selectionStart, t = ta.selectionEnd;
  ta.value = ta.value.slice(0, s) + text + ta.value.slice(t);
  ta.selectionStart = ta.selectionEnd = s + text.length;
  ta.focus();
}
function fire(ta){ ta.dispatchEvent(new Event('input', { bubbles: true })); }

const GLYPHS = [
  { s:'¬', ins:'~',   t:'not' },
  { s:'∧', ins:' & ', t:'and' },
  { s:'∨', ins:' | ', t:'or' },
  { s:'⊃', ins:' -> ',t:'if … then (the scroll)' },
  { s:'≡', ins:' <-> ',t:'if and only if' },
  { s:'∀', ins:'Ax ', t:'for every x' },
  { s:'∃', ins:'Ex ', t:'for some x' },
  { s:'=', ins:'=',   t:'is identical with' },
  { s:'( )', ins:'()',t:'brackets' }
];

/* --- colouring ------------------------------------------------------------ */
const TOKRE = /(\s+)|(<->|<=>|->|=>|⊃|→|≡|↔)|([~¬!&∧∨|+·•])|([∀∃])|([()\[\]])|([A-Za-z_][A-Za-z0-9_']*)|(=)|(,)|([\s\S])/g;

function bracketMap(src){
  const st = [], m = {};
  for (let i = 0; i < src.length; i++){
    const c = src[i];
    if (c === '(' || c === '[') st.push(i);
    else if (c === ')' || c === ']'){
      if (st.length){ const j = st.pop(); m[i] = j; m[j] = i; }
      else m[i] = -1;                               // closes nothing
    }
  }
  for (const j of st) m[j] = -1;                    // never closed
  return m;
}
function highlight(src, caret){
  const bm = bracketMap(src);
  let hi = -1, hj = -1;
  if (caret >= 0){
    for (const k of [caret, caret-1]){
      if (k >= 0 && k < src.length && '()[]'.includes(src[k]) && bm[k] >= 0){
        hi = k; hj = bm[k]; break;
      }
    }
  }
  let out = '', m;
  TOKRE.lastIndex = 0;
  while ((m = TOKRE.exec(src)) !== null){
    const i = m.index, txt = m[0];
    if (m[1]) { out += esc(txt); continue; }
    let cls = '';
    if (m[2] || m[3]) cls = 'op';
    else if (m[4]) cls = 'qu';
    else if (m[5]){
      cls = 'par';
      if (bm[i] === -1) cls += ' bad';
      else if (i === hi || i === hj) cls += ' match';
    }
    else if (m[6]) cls = /^[AE][a-z][0-9]?'?$/.test(txt) ? 'qu'
                       : /^[A-Z]/.test(txt) ? 'pred' : 'var';
    else if (m[7]) cls = 'op';
    else if (m[8]) cls = 'punc';
    out += cls ? `<span class="${cls}">${esc(txt)}</span>` : esc(txt);
  }
  return out + '\n';     // a trailing line keeps the box from clipping
}
