/* ============================================================================
   THE PROOF IN WRITING.
   A proof is a sequence of graphs; this sets that sequence down in the linear
   notation, in ordinary notation, or in both, so it can be read, copied and
   checked away from the drawings.

   Each line is verified as it is written: the notation is parsed back and
   compared with the graph it stands for. The linear form cannot always tell
   apart two points of one ligature lying on the same area, and where it cannot
   the line is marked rather than quietly given as exact.
   ========================================================================== */

function writLine(g0){
  // A point the line merely passes through is not a separate thing (C7), and a
  // transformation can leave a good many of them behind. They are dropped
  // before the graph is written down.
  let g = g0;
  try { g = normalizeLines(cloneGraph(g0)); } catch(e){ g = g0; }
  // always the plain form: whether a cut was laid down as a scroll is a fact
  // about how the graph was made, not about the graph, and mixing the two
  // forms in one record would only confuse. The conditional is legible enough
  // in the ordinary notation beside it.
  const raw = writeEG(g, true);
  let exact = true;
  try { exact = canonGraph(parseEG(raw)) === canonGraph(g); } catch(e){ exact = false; }
  const eg = raw || '(the blank sheet)';
  let formula;
  try { formula = fmtFull(sugar(readGraph(g))); } catch(e){ formula = '—'; }
  return { eg, raw, formula, exact };
}

function renderWrit(host, noteEl, graphs, steps, form, cur, onPick){
  if (!host) return;
  const rows = graphs.map((g, i) => {
    const w = writLine(g);
    const rule = steps[i] && steps[i].rule ? steps[i].rule : 'premiss';
    const why = steps[i] ? steps[i].why : '';
    return { w, rule, why, i };
  });
  const anyInexact = rows.some(r => !r.w.exact);
  host.innerHTML = '<table class="writ">' + rows.map(r => {
    const flag = r.w.exact ? '' :
      ' <span class="flag" title="The linear notation cannot express this graph exactly: it has a branch with a loose end on an area the line also leaves.">*</span>';
    let cell;
    if (form === 'formula') cell = esc(r.w.formula);
    else if (form === 'both') cell = esc(r.w.eg) + flag + '<span class="alt">' + esc(r.w.formula) + '</span>';
    else cell = esc(r.w.eg) + flag;
    return '<tr data-k="'+r.i+'"'+(r.i===cur?' class="cur"':'')+'>'+
      '<td class="n">'+(r.i+1)+'.</td>'+
      '<td class="g">'+cell+'</td>'+
      '<td class="r" title="'+esc(r.why)+'">'+esc(r.rule)+'</td></tr>';
  }).join('') + '</table>';
  if (noteEl) noteEl.innerHTML = anyInexact
    ? 'A line marked <span class="flag">*</span> is one the linear notation cannot set '+
      'down exactly; the drawing above is the graph itself.'
    : 'Every line here has been parsed back and checked against the graph it stands for.';
  if (onPick) host.onclick = e => {
    const tr = e.target.closest('tr[data-k]');
    if (tr) onPick(+tr.dataset.k);
  };
}

function writText(graphs, steps, form){
  const rows = graphs.map((g,i) => {
    const w = writLine(g);
    const rule = steps[i] && steps[i].rule ? steps[i].rule : 'premiss';
    return { w, rule, i };
  });
  const wid = Math.max(...rows.map(r => (form === 'formula' ? r.w.formula : r.w.eg).length));
  const out = [];
  for (const r of rows){
    const main = form === 'formula' ? r.w.formula : r.w.eg;
    out.push(String(r.i+1).padStart(3)+'.  '+main.padEnd(Math.min(wid, 70))+
             '   '+r.rule+(r.w.exact ? '' : '   [*]'));
    if (form === 'both') out.push('      '+r.w.formula);
  }
  if (rows.some(r => !r.w.exact))
    out.push('', '[*] the linear notation cannot set this graph down exactly.');
  return out.join('\n');
}

/* Wire one of these records to a player. */
function bindWrit(prefix, getState){
  const host = $('#'+prefix+'-writ'), note = $('#'+prefix+'-writnote');
  if (!host) return null;
  const segs = [...host.parentNode.querySelectorAll('button.seg')];
  const state = { form: 'linear' };
  const draw = () => {
    const s = getState();
    if (!s || !s.graphs) { host.innerHTML = ''; if (note) note.textContent = ''; return; }
    renderWrit(host, note, s.graphs, s.steps, state.form, s.i, s.onPick);
  };
  segs.forEach(b => b.onclick = () => {
    state.form = b.dataset.form;
    segs.forEach(o => o.classList.toggle('on', o === b));
    draw();
  });
  const copy = $('#'+prefix+'-copy');
  if (copy) copy.onclick = () => {
    const s = getState(); if (!s || !s.graphs) return;
    const txt = writText(s.graphs, s.steps, state.form);
    navigator.clipboard && navigator.clipboard.writeText(txt).then(
      () => { copy.textContent = 'Copied'; setTimeout(() => copy.textContent = 'Copy', 1400); },
      () => { copy.textContent = 'Copy failed'; setTimeout(() => copy.textContent = 'Copy', 1400); });
  };
  return draw;
}
