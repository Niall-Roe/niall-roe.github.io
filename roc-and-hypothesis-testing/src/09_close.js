<script>
/* ============================================================================
   Wiring. Switching between SDT and Neyman-Pearson rebuilds the panels
   against the SAME State, so the distributions stay exactly where they were
   and only the captions change.
   ==========================================================================*/

const MODES = [
  ['sdt', 'Signal Detection Theory'],
  ['np', 'Neyman–Pearson'],
  ['compare', 'Comparison'],
];
// Severity is a Neyman-Pearson idea about what a particular result licenses;
// it has no natural home in the signal-detection view, so that mode gets two
// tabs rather than three.
const tabsFor = (mode) => (mode === 'np'
  ? ['Parameters', 'Simulation', 'Severity']
  : ['Parameters', 'Simulation']);

function rebuildAll() {
  if (State.tab > tabsFor(State.mode).length) State.tab = 1;
  if (State.mode === 'compare') {
    buildCompareTab();
  } else {
    buildParamsTab();
    buildSimTab();
    if (State.mode === 'np') buildSeverityTab(); else $('#tab3').innerHTML = '';
  }
  buildTabSwitcher();
  pruneCanvases();
  updateFinleyNote();
  updateVisibility();
}

// The Finley provenance note only means anything once that preset is loaded.
function updateFinleyNote() {
  const el = $('#finley-note');
  if (el) el.style.display = (State.mode === 'sdt' && State.preset.sdt === 'finley') ? '' : 'none';
}

function setMode(mode) {
  if (State.mode === mode) return;
  // Leaving a running simulation behind would keep repainting a detached canvas.
  clearInterval(State.simSdt.timer); clearInterval(State.simNp.timer);
  State.simSdt.running = false; State.simNp.running = false;
  State.mode = mode;
  $$('.mode-tab').forEach((b, i) => b.classList.toggle('active', MODES[i][0] === mode));
  rebuildAll();
}

/* Rebuild the panel being entered. Its controls are built from State, and
   State may have moved since (a preset loaded on the Parameters tab changes
   the trial count and base rate the Simulation tab shows). Rebuilding on
   entry keeps every panel honest without wiring cross-tab updates. */
function setTab(n) {
  State.tab = n;
  if (State.mode !== 'compare') {
    if (n === 2) buildSimTab();
    else if (n === 3 && State.mode === 'np') buildSeverityTab();
  }
  pruneCanvases();
  updateVisibility();
  redrawAll();
}

function updateVisibility() {
  const isCompare = State.mode === 'compare';
  $('#tab-switcher').style.display = isCompare ? 'none' : '';
  $('#tab-compare').classList.toggle('active', isCompare);
  ['#tab1', '#tab2', '#tab3'].forEach((sel, i) => {
    $(sel).classList.toggle('active', !isCompare && State.tab === i + 1);
  });
  $$('.tab-btn').forEach((b, i) => b.classList.toggle('active', State.tab === i + 1));
}

function buildSwitchers() {
  const modeEl = $('#mode-switcher');
  modeEl.innerHTML = '';
  MODES.forEach(([key, label]) => {
    const btn = h(`<button class="mode-tab">${label}</button>`);
    btn.addEventListener('click', () => setMode(key));
    modeEl.appendChild(btn);
  });
  $$('.mode-tab').forEach((b, i) => b.classList.toggle('active', MODES[i][0] === State.mode));
  buildTabSwitcher();
}

function buildTabSwitcher() {
  const tabEl = $('#tab-switcher');
  tabEl.innerHTML = '';
  tabsFor(State.mode).forEach((label, i) => {
    const btn = h(`<button class="tab-btn">${label}</button>`);
    btn.addEventListener('click', () => setTab(i + 1));
    tabEl.appendChild(btn);
  });
}

buildSwitchers();
computeCore();
rebuildAll();
</script>
</body>
</html>
