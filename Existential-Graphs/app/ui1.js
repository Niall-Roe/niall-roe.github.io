/* ============================================================================
   THE APPLICATION
   ========================================================================== */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---- tabs ---------------------------------------------------------------- */
$$('nav.tabs button').forEach(b => b.onclick = () => {
  $$('nav.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
  $$('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-'+b.dataset.tab));
  refresh(b.dataset.tab);
});
// a panel that was hidden had no width to size its drawing to
function refresh(tab){
  if (tab === 'translate') translate();
  else if (tab === 'proofs' && PF.proof) pfShow(PF.i);
  else if (tab === 'draw') drawRender();
  else if (tab === 'prove' && VV.steps) vShow(VV.i);
}
let __rz;
window.addEventListener('resize', () => {
  clearTimeout(__rz);
  __rz = setTimeout(() => {
    const b = $('nav.tabs button[aria-selected="true"]');
    if (b) refresh(b.dataset.tab);
  }, 150);
});

/* ---- shared rendering helpers -------------------------------------------- */
function stageSvg(el, g, opts){
  el.innerHTML = svgDoc(g, Object.assign({ pad: 12, scale: 1 }, opts||{}));
  const svg = el.querySelector('svg');
  if (svg){
    const w = parseFloat(svg.getAttribute('width'));
    const h = parseFloat(svg.getAttribute('height'));
    const availW = Math.max(80, el.clientWidth - 34);
    const availH = (opts && opts.maxH) || 420;
    const k = Math.min(availW / w, availH / h, 2.4);
    svg.setAttribute('width', w * k);
    svg.setAttribute('height', h * k);
  }
  return svg;
}
// three readings of one graph, as Peirce gives three of his Fig. 5 (Roberts p. 39-40)
function readings(g){
  const raw = readGraph(g);
  return { plain: fmtFull(sugar(raw)), literal: fmtFull(raw), gloss: gloss(sugar(raw)) };
}
function valuationBadge(g){
  if (!isAlpha(g)) return '<span class="pill mid">Beta — a finite check only</span>';
  const tt = truthTable(g, 12);
  if (tt.tooBig) return '<span class="pill mid">too many spots to tabulate</span>';
  if (tt.tautology) return '<span class="pill ok">a theorem — true on every assignment</span>';
  if (tt.contradiction) return '<span class="pill bad">absurd — false on every assignment</span>';
  return '<span class="pill mid">contingent</span>';
}

/* ============================ TRANSLATE ==================================== */
const T_EXAMPLES = [
  ['P -> Q', 'if P then Q'],
  ['~(P & ~Q)', 'the same, denied'],
  ['P | Q', 'either P or Q'],
  ['(P -> (Q -> R)) -> ((P->Q)->(P->R))', 'self-distribution'],
  ['Ex Fx', 'something is F'],
  ['Ax Fx', 'everything is F'],
  ['Ax (Fx -> Gx)', 'all F is G'],
  ['Ex (Gx & ~Ux)', 'some good thing is not ugly'],
  ['Ax Ey (Cx -> (Axy & Wy))', 'every catholic adores some woman'],
  ['Ey Ax (Wy & (Cx -> Axy))', 'some woman is adored by every catholic'],
  ['Ex Ey ~(x=y)', 'there are two things'],
  ['Ax Ay Az ~(x=y & y=z & x=z)', 'three things are not all identical'],
  ['Ex Ay (Mxy -> Lxy)', 'every mother loves some child of hers'],
  ['~Ex (Px)', 'it is false that there is a phoenix'],
  ['Ax (Mx -> Dx)', 'every man will die'],
  ['Ex (Mx & ~Dx)', 'there is a man who will not die'],
  ['Ex Ey (Mx & My & Exy)', 'some man eats a man']
];
function tOpts(){ return { shade: $('#t-shade').checked, wobble: $('#t-wobble').checked,
                           hookNumbers: $('#t-hooks').checked }; }
function translate(){
  const src = $('#t-in').value.trim();
  $('#t-err').textContent = '';
  if (!src){ $('#t-stage').innerHTML = '<em style="color:var(--ink3)">the blank sheet</em>';
    $('#t-read').textContent = ''; $('#t-gloss').textContent = '';
    $('#t-lin').textContent = ''; $('#t-alt').innerHTML=''; $('#t-val').innerHTML=''; return; }
  let ast, r;
  try { ast = parseFormula(src); r = compileFormula(ast); }
  catch (e){
    $('#t-err').textContent = e.message + (e.at !== undefined ? '\n' + ' '.repeat(e.at) + '↑' : '');
    return;
  }
  const g = r.graph;
  stageSvg($('#t-stage'), g, tOpts());
  const rd = readings(g);
  $('#t-read').textContent = rd.plain;
  $('#t-gloss').textContent = rd.gloss;
  $('#t-alt').innerHTML = rd.literal !== rd.plain
    ? '<p class="note" style="margin-top:2px">Taking every cut as a bare denial: '+
      '<span class="mono">'+esc(rd.literal)+'</span></p>' : '';
  $('#t-lin').textContent = writeEG(g);
  $('#t-notes').innerHTML = r.notes.map(n => '<div>'+esc(n)+'</div>').join('');
  $('#t-val').innerHTML = valuationBadge(g);
}
$('#t-in').addEventListener('input', translate);
['#t-shade','#t-wobble','#t-hooks'].forEach(s => $(s).addEventListener('change', translate));
$('#t-ex').innerHTML = T_EXAMPLES.map((e,i) =>
  '<button data-i="'+i+'" title="'+esc(e[0])+'">'+esc(e[1])+'</button>').join('');
$('#t-ex').onclick = ev => {
  const b = ev.target.closest('button'); if (!b) return;
  $('#t-in').value = T_EXAMPLES[+b.dataset.i][0]; translate();
};

/* ============================== PROOFS ===================================== */
const PF = { proof: null, i: 0, timer: null };
$('#pf-sel').innerHTML = PROOFS.map((p,i) => '<option value="'+i+'">'+esc(p.title)+'</option>').join('');
function pfLoad(i){
  const p = PROOFS[i];
  PF.proof = p; PF.i = 0;
  PF.graphs = p.steps.map(s => parseEG(s.eg));
  $('#pf-cite').innerHTML = p.cite ? '<b>'+esc(p.cite)+'</b>' : '';
  $('#pf-note').textContent = p.note || '';
  $('#pf-kv').innerHTML =
    (p.prem.length ? '<dt>premisses</dt><dd>'+p.prem.map(x=>esc(fmtSrc(x))).join('<br>')+'</dd>'
                   : '<dt>from</dt><dd>the blank sheet of assertion</dd>') +
    '<dt>conclusion</dt><dd>'+esc(fmtSrc(p.goal))+'</dd>' +
    '<dt>steps</dt><dd>'+(p.steps.length-1)+'</dd>';
  $('#pf-prov').textContent = p.found === 'book'
    ? 'Each step here is the one printed in the source, and each has been checked against the rules.'
    : 'This sequence was found by the proof finder in this page, and each step checked against the rules.';
  $('#pf-steps').innerHTML = p.steps.map((s,k) =>
    '<li data-k="'+k+'"><span class="n">'+(k+1)+'</span><span class="r">'+
    esc(s.rule||'premiss')+'</span><span class="w">'+esc(s.why)+'</span></li>').join('');
  pfShow(0);
}
function fmtSrc(s){ try { return fmt(parseFormula(s), 0); } catch(e){ return s; } }
function pfShow(i){
  const p = PF.proof; if (!p) return;
  PF.i = Math.max(0, Math.min(p.steps.length-1, i));
  const g = PF.graphs[PF.i];
  const hl = {};
  stageSvg($('#pf-stage'), g, { shade:true, wobble:true, highlight: hl });
  const s = p.steps[PF.i];
  $('#pf-why').innerHTML = '<b>'+esc(s.rule ? s.rule : 'Premiss')+'</b> — '+esc(s.why)+
    '<br><span class="mono" style="font-size:12px;color:var(--ink3)">'+
    esc(fmtFull(sugar(readGraph(g))))+'</span>';
  $$('#pf-steps li').forEach(li => li.classList.toggle('cur', +li.dataset.k === PF.i));
  const cur = $('#pf-steps li.cur'); if (cur) cur.scrollIntoView({block:'nearest'});
}
$('#pf-sel').onchange = e => { pfStop(); pfLoad(+e.target.value); };
$('#pf-steps').onclick = e => { const li = e.target.closest('li'); if (li){ pfStop(); pfShow(+li.dataset.k); } };
$('#pf-next').onclick = () => { pfStop(); pfShow(PF.i+1); };
$('#pf-prev').onclick = () => { pfStop(); pfShow(PF.i-1); };
$('#pf-first').onclick = () => { pfStop(); pfShow(0); };
function pfStop(){ if (PF.timer){ clearInterval(PF.timer); PF.timer = null; $('#pf-play').textContent = '▶ play'; } }
$('#pf-play').onclick = () => {
  if (PF.timer){ pfStop(); return; }
  if (PF.i >= PF.proof.steps.length-1) PF.i = -1;
  $('#pf-play').textContent = '❚❚ pause';
  const tick = () => {
    if (PF.i >= PF.proof.steps.length-1){ pfStop(); return; }
    pfShow(PF.i+1);
  };
  PF.timer = setInterval(tick, +$('#pf-speed').value);
  tick();
};
$('#pf-speed').oninput = () => { if (PF.timer){ clearInterval(PF.timer);
  PF.timer = setInterval(() => { if (PF.i >= PF.proof.steps.length-1){ pfStop(); return; }
    pfShow(PF.i+1); }, +$('#pf-speed').value); } };
