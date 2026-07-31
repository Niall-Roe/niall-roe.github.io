<script>
/* ============================================================================
   Wiring. Each scenario is built the first time it is shown and then left
   alone, so its sliders keep their positions when you switch away and back.
   The comparison panel is the exception: it reads the other four scenarios'
   current state, so it is re-rendered every time it is entered.
   ==========================================================================*/

const SCENARIO_TABS = [
  ['water',   'Water Plant Temperature'],
  ['tornado', 'Tornado Prediction (Finley)'],
  ['tea',     'Lady Tasting Tea'],
  ['custom',  'Custom Test'],
  ['compare', 'All Four Compared'],
];

function showScenario(key) {
  State.scenario = key;
  const entry = SCENARIOS[key];
  if (entry && !entry.built) { entry.build(); entry.built = true; }
  else if (key === 'compare') renderComparison();
  SCENARIO_TABS.forEach(([k]) => {
    $('#panel-' + k).classList.toggle('active', k === key);
  });
  $$('.mode-tab').forEach((b, i) => b.classList.toggle('active', SCENARIO_TABS[i][0] === key));
  // canvases in a hidden panel have no width to measure, so they are drawn
  // for the first time here, once the panel they live in is on screen
  pruneCanvases();
  redrawAll();
}

function buildScenarioSwitcher() {
  const el = $('#scenario-switcher');
  el.innerHTML = '';
  SCENARIO_TABS.forEach(([key, label]) => {
    const btn = h(`<button class="mode-tab">${label}</button>`);
    btn.addEventListener('click', () => showScenario(key));
    el.appendChild(btn);
  });
}

buildScenarioSwitcher();
showScenario('water');
</script>
</body>
</html>
