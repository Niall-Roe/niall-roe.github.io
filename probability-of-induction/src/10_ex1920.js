<script>
/* Liars and truth-tellers, the same two colours in 19 and 20, so the hundred
   Cretans read as one population across the pair. Muted, since a grid of a
   hundred of them at full strength is a lot of colour on the page. */
const CRETAN_LIAR = "#b0705e";
const CRETAN_TRUE = "#7ea08a";
const CRETAN_UNSEEN = "#e2e0d9";     // pale, so an uncovered Cretan is the thing that shows
const CRETAN_LIAR_INK = "#8a4331";
const CRETAN_TRUE_INK = "#547c62";
const EST_COL = "#7a6a94";           // our own estimate, distinct from either

/* A hundred Cretans by name, so that the sample in the boxes is the same thing
   as the list of names in Peirce's sentence. His own five come first, in his
   own order, because they are the ones the sentence prints when it is shut and
   the ones a reader will look for; the rest are ancient Greek, women and men
   alternating through the roll so that neither sex belongs to one end of it.
   The roll is fixed: which of them lies is decided separately, and moves. */
const CRETAN_NAMES = [
  "Minos", "Sarpedon", "Rhadamanthus", "Deucalion", "Epimenides",
  "Ariadne", "Idomeneus", "Pasiphaë", "Catreus", "Phaedra",
  "Androgeus", "Europa", "Talos", "Britomartis", "Glaucus",
  "Acacallis", "Asterion", "Dictynna", "Xenodice", "Meriones",
  "Aerope", "Lycastus", "Clymene", "Deiphobus", "Eurymedon",
  "Althaea", "Nauplius", "Kydon", "Melissa", "Iasus",
  "Amaltheia", "Cleitus", "Arsinoe", "Doreus", "Chryseis",
  "Ampelos", "Nikaia", "Kleoboulos", "Thessala", "Antiphates",
  "Erigone", "Kritias", "Praxilla", "Oenopion", "Timandra",
  "Lykomedes", "Aglaia", "Diomedes", "Kalliste", "Hipparchus",
  "Theano", "Alkaios", "Melantho", "Pyrrhos", "Iphianassa",
  "Straton", "Korinna", "Neoptolemus", "Damaris", "Charilaus",
  "Eupraxia", "Phoinix", "Anthousa", "Kleisthenes", "Myrrhine",
  "Archelaus", "Zenodora", "Philemon", "Hegesippe", "Menandros",
  "Alkmene", "Xanthippos", "Berenike", "Polydorus", "Lysandra",
  "Nikias", "Phanessa", "Gorgias", "Melitta", "Aristarchos",
  "Isidora", "Kallias", "Sostrate", "Demetrios", "Eirene",
  "Prokles", "Thaleia", "Timaeus", "Glykera", "Aristides",
  "Herais", "Leontios", "Kleopatra", "Sosthenes", "Aspasia",
  "Euthymios", "Danae", "Onesimos", "Rhodanthe", "Theophrastos"
];

/* ==========================================================================
   EXAMPLE 19 — Epimenides. Deduction from a known proportion.
   "Ninety-nine Cretans in a hundred are liars; But Epimenides is a Cretan;
    Therefore, Epimenides is a liar."
   The proportion is given, so this is the dice calculation again.
   ========================================================================*/
registerExample("example-ex19", (box) => {
  box.appendChild(exHeader("Interactive Example: Epimenides the Cretan", "ex19-content"));
  /* Boxes on top, the reading in the middle, the chart below: the same
     sandwich as 20, so the pair reads alike. */
  const content = h(`<div id="ex19-content" class="example-content">
    <div class="row">
      <div class="col col-5"><div id="ex19-controls"></div></div>
      <div class="col col-7"><div class="ex-buttonbar">
        <button class="btn btn-primary" data-act="one">Find Epimenides</button>
        <button class="btn btn-primary" data-act="hundred">Sample 100 times</button>
        <button class="btn btn-warning btn-sm" data-act="reset">Reset</button>
      </div></div>
    </div>
    <div id="ex19-population"></div>
    <div id="ex19-verdict"></div>
    <div class="plot-container" id="ex19-run-plot"></div>
  </div>`);
  box.appendChild(content);

  $("#ex19-controls", content).appendChild(
    slider("ex19_liars", "Liars in a hundred Cretans:", 1, 99, 99, 1, (v) => `${v} in 100`, "k1"));

  /* Peirce spells the premise out ("Ninety-nine Cretans in a hundred"), so the
     live version has to be spelled too, and capitalised: it opens the clause. */
  registerLive("example-ex19", {
    word: () => capitalise(spellNumber(num("ex19_liars"))),
    n:    () => Math.round(num("ex19_liars"))
  });

  let picks = 0, right = 0, lastIdx = -1, lastLiar = true;
  let path = [];                       // running proportion right, for the chart

  function pick(k) {
    const liars = num("ex19_liars");
    for (let i = 0; i < k; i++) {
      lastIdx = sampleInt(100);
      lastLiar = lastIdx < liars;      // first `liars` of the hundred are liars
      picks++;
      if (lastLiar) right++;
      path.push({ n: picks, p: right / picks });
    }
  }

  /* Epimenides is a Cretan and nothing more; the rate at which the rule carries
     truth is settled before he is picked. The chart is that claim watched: the
     tally wandering in at the start and closing on a line that never moved. */
  const runCanvas = mkCanvas(260, (pl) => {
    const truth = num("ex19_liars") / 100;
    if (!picks) { blankPlot(pl, "Sample some Cretans to begin"); return; }
    const nMax = Math.max(20, picks * 1.05);
    pl.setup({ xlim: [0, Math.log10(nMax)], ylim: [0, 1], mar: [4, 5, 2.5, 2] });
    const decades = [];
    for (let e = 0; e <= Math.ceil(Math.log10(nMax)); e++) {
      [1, 2, 5].forEach((m) => { const v = m * Math.pow(10, e); if (v <= nMax) decades.push(v); });
    }
    pl.axes({ xat: decades.map(Math.log10), xlabels: decades.map((v) => bigmark(v)) });
    pl.box();
    pl.axisLabels("Cretans picked (log scale)", "Proportion right");
    pl.clip(true);
    pl.abline({ h: truth, col: PAL.accent3, lwd: 2.5 });
    pl.lines(path.map((d) => Math.log10(d.n)), path.map((d) => d.p), { col: PAL.accent, lwd: 2 });
    pl.clip(false);
    pl.text(Math.log10(nMax) * 0.99, truth + 0.05,
      `the rule's rate, ${fmt(truth, 2)}`, { adj: 1, cex: 0.78, col: PAL.accent3 });
  });
  $("#ex19-run-plot", content).appendChild(runCanvas);

  function update() {
    const liars = num("ex19_liars");
    const p = liars / 100;

    // the hundred Cretans, the picked one ringed
    let cells = "";
    for (let i = 0; i < 100; i++) {
      const isLiar = i < liars;
      const ring = (i === lastIdx) ? "box-shadow:0 0 0 3px #b0563f;" : "";
      cells += `<span style="display:inline-block;width:20px;height:20px;margin:2px;border-radius:3px;
        border:1px solid #a8adb4;${ring}background:${isLiar ? CRETAN_LIAR : CRETAN_TRUE};"></span>`;
    }
    $("#ex19-population", content).innerHTML = `
      <p style="font-size:0.9em;margin-bottom:4px;color:#575d66;">A hundred Cretans
        &mdash; <span style="color:${CRETAN_LIAR_INK};font-weight:700;">liars</span> and
        <span style="color:${CRETAN_TRUE_INK};font-weight:700;">truth-tellers</span>:</p>
      <div style="line-height:1;">${cells}</div>`;

    const last = lastIdx < 0 ? "" :
      `The Cretan just picked was <strong>${lastLiar ? "a liar" : "not a liar"}</strong>, so the inference was
       <strong>${lastLiar ? "right" : "wrong"}</strong> that time. `;
    const tally = picks
      ? `Over <strong>${bigmark(picks)}</strong> Cretans picked it has been right
         <strong>${bigmark(right)}</strong> times, a proportion of <strong>${fmt(right / picks, 4)}</strong>. `
      : "";
    $("#ex19-verdict", content).innerHTML = `<div class="note-block">
      <p>The proportion of liars is given in the premise. Picking a Cretan and calling him a liar is the same
      kind of calculation as throwing a die: the rule is right as often as the proportion says, and no argument
      about Epimenides in particular is needed. Nothing is known of him beyond his being a Cretan, so
      <em>finding Epimenides is drawing a Cretan at random</em>, and the rate at which the rule carries truth
      is his rate too.</p>
      <p style="margin-bottom:0;">${last}${tally}The rule &ldquo;call any Cretan a liar&rdquo; carries truth
      ${frac(String(liars), "100")} = <strong>${fmt(p, 2)}</strong> of the time. That number is known before
      any Cretan is picked, and picking more of them only brings the tally towards it.</p></div>`;
    drawCanvas(runCanvas);
  }

  content.addEventListener("input", update);
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "one") pick(1);
    else if (a === "hundred") pick(100);
    else if (a === "reset") { picks = 0; right = 0; lastIdx = -1; path = []; }
    else return;
    update();
  });
  update();
});

/* ==========================================================================
   EXAMPLE 20 — The induction from five or six instances.
   "this proportion can be probably approximated to by an induction from five
    or six instances. Even in the worst case ... that in which about half the
    Cretans are liars, the ratio so obtained would probably not be in error by
    more than 1/6."

   A hundred Cretans, each of them a liar or not, the proportion hidden as the
   bag's is in ex10. A sample uncovers that many of them and nothing else, so
   the estimate has to be made from them. Two things are shown at once.

   What "probably" means. Peirce's bound is a rate, not a claim about the
   sample in hand: the cascade of ex17 rebuilt on these Cretans, every sample
   carrying the bound around it, and — once the proportion is uncovered — the
   rate at which those bands caught it. The confidence slider drives the word
   "probably" in his sentence, so moving it from half the time to 99 times in
   100 widens the bands in the plot and turns the misses green. That rate is
   the trustworthiness of the proceeding. It is not the probability of the
   conclusion, and nothing here ever offers one.

   What the bound rests on. Peirce's own five were the five he could think of,
   and the Cretans anyone can think of are the memorable ones, which is to say
   the liars: the roll is laid out with them at the front. The mixing slider
   is that objection made movable. Unmixed, the same five come up every sample
   and every band misses; mixed, the identical arithmetic works. Randomising
   is not a nicety of the calculation, it is what the calculation assumed.
   ========================================================================*/
registerExample("example-ex20", (box) => {
  box.appendChild(exHeader("Interactive Example: Five or Six Cretans", "ex20-content"));
  const content = h(`<div id="ex20-content" class="example-content">
    <div class="ex-buttonbar">
      <button class="btn btn-primary" data-act="one">Take a sample</button>
      <button class="btn btn-primary" data-act="five">Take five samples</button>
      <button class="btn btn-primary" data-act="many">Take a hundred samples</button>
      <button class="btn btn-primary" data-act="lots">Take a thousand</button>
      <button class="btn btn-warning btn-sm" data-act="clear">Clear the samples</button>
      <button class="btn btn-warning btn-sm" data-act="newpop">New Cretans</button>
      <button class="btn btn-sm" data-act="reveal">Reveal the proportion</button>
    </div>
    <div class="row">
      <div class="col col-4" id="ex20-ctl-s"></div>
      <div class="col col-4" id="ex20-ctl-conf"></div>
      <div class="col col-4" id="ex20-ctl-mix"></div>
    </div>
    <div id="ex20-population"></div>
    <div id="ex20-last"></div>
    <div class="row">
      <div class="col col-6"><div class="plot-container" id="ex20-cascade"></div></div>
      <div class="col col-6"><div class="plot-container" id="ex20-hist"></div></div>
    </div>
  </div>`);
  box.appendChild(content);

  const N = 100;                       // the roll of Cretans, so a proportion is a count

  /* The names in his sentence are this slider: "five or six instances" is the
     length of the list above, not the number of times one draws. How many times
     one draws is what the buttons do. */
  $("#ex20-ctl-s", content).appendChild(
    slider("ex20_s", "Cretans named in each sample:", 2, 20, 5, 1, (v) => v, "k2"));
  /* The confidence level is the word "probably" in Peirce's sentence, so the
     slider carrying it is the one his word is coloured for. Its two ends are
     the first and third rows of the table above: 0.477 and 1.821. */
  $("#ex20-ctl-conf", content).appendChild(
    slider("ex20_conf", "Confidence level:", 50, 99, 50, 1,
      (v) => (v <= 50 ? "50% — the probable error"
        : v === 95 ? "95% — standard today" : `${Math.round(v)}%`), "k3"));
  /* The mixing slider says at its two ends what the two ends are: the five one
     happens to remember, and five drawn fairly. The wording carries the sample
     size, so update() rewrites it whenever that changes. */
  $("#ex20-ctl-mix", content).appendChild(
    slider("ex20_mix", "Mixing before the draw:", 0, 1, 1, 0.01, (v) => v.toFixed(2)));

  const cFor = (conf) => qnorm((1 + conf / 100) / 2) / Math.SQRT2;
  /* Peirce's bound is stated for the worst case, p = 1/2, and the worst case is
     the only bound available while the proportion is still hidden — which is
     exactly why he states it that way. */
  const boundAt = (conf, s) => (s > 0 ? cFor(conf) * Math.sqrt(2 * 0.25 / s) : 0);
  const bound = () => boundAt(num("ex20_conf"), Math.round(num("ex20_s")));
  /* the same formula at a proportion one actually knows — the bound that would
     be caught at the claimed rate, and so the measure of how much the worst
     case is giving away */
  const boundAtP = (conf, s, p) => (s > 0 ? cFor(conf) * Math.sqrt(2 * p * (1 - p) / s) : 0);

  /* Everything the reading sentence and the boxes both need, in one place.

     `last` and `mean` are kept apart on purpose. One induction from s instances
     is what the bound describes, and that is `last`. The average of n such
     inductions is a far better estimate — its own probable error is e/root(n) —
     so pinning ±e to it would claim the bound for a number the bound was never
     about, and would make the catch rate look inexplicably poor beside it. */
  function state() {
    const s = Math.round(num("ex20_s")), m = num("ex20_mix"), conf = num("ex20_conf");
    const e = bound(), n = estimates.length;
    const nIn = estimates.filter((p) => caught(p, e)).length;
    return {
      s: s, m: m, conf: conf, e: e, n: n, nIn: nIn,
      last: n ? estimates[n - 1] : null,
      mean: n ? estimates.reduce((a, b) => a + b, 0) / n : null,
      rate: n ? nIn / n : null,
      level: `${Math.round(conf)} in 100`,
      notRandom: m < 0.02, fair: m > 0.98
    };
  }

  /* the colours of the controls, so a figure in the sentence wears the colour
     of the slider that moves it: sample size k2, bound and level k3, and the
     truth in the gold its line takes in both charts */
  const tint = (col, s) => `<span style="color:${col};">${s}</span>`;
  const K2 = "#b0563f", K3 = "#4a7c59", GOLD = "#9a7b3f";

  /* --------------------------------------------------------------------------
     Peirce's five names are the sample.

     His list is the sample size, so the two are one control: move the slider
     and the list lengthens, take a sample and the list is who was drawn. Which
     of them lies is settled behind the boxes and nowhere else, so a name is
     coloured only once its box has been uncovered — the sentence and the
     hundred boxes can never disagree, being the same fact read twice.

     Unmixed, the draw is the front of the roll, and the front of the roll is
     Minos, Sarpedon, Rhadamanthus, Deucalion and Epimenides, all of them liars.
     So at the setting his own paragraph describes the sentence comes out
     exactly as he printed it, and it is the mixing slider that takes it away
     from him.
     ------------------------------------------------------------------------*/
  function drawn() {
    const s = Math.round(num("ex20_s"));
    /* before anything is drawn, the front of the roll — which is what "all the
       Cretans I can think of" means, and prints his own five at five */
    return sample.length ? sample.slice(0, s) : Array.from({ length: s }, (_, i) => i);
  }
  function nameList() {
    const idx = drawn(), uncovered = sample.length > 0;
    const parts = idx.map((i) => {
      const nm = CRETAN_NAMES[i % CRETAN_NAMES.length];
      if (!uncovered) return nm;
      return tint(pop[i] ? CRETAN_LIAR_INK : CRETAN_TRUE_INK, nm);
    });
    if (parts.length <= 1) return parts.join("");
    return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  }
  const liarsDrawn = () => drawn().filter((i) => pop[i]).length;

  registerLive("example-ex20", {
    instances: () => {
      const s = Math.round(num("ex20_s"));
      return `${spellNumber(s)} or ${spellNumber(s + 1)}`;
    },
    /* What "approximated" comes to, in the units the example is already
       counting in. His adverb is left alone: "probably" is a modal about how
       often the bound holds, which the confidence slider governs three clauses
       later, and the closeness is a different quantity — so it is added rather
       than swapped for. A hundred Cretans makes whole Cretans the natural unit,
       and it is his worst case throughout, since that is what his sentence is
       about and, until the reveal, the only bound there is. */
    within: () => ` within ${spellNumber(Math.max(1, Math.round(bound() * 100)))} in a hundred`,
    names: () => nameList(),
    /* the mixing slider, said in his own clause: at one end they are the ones
       that come to mind, at the other they are a fair draw */
    howGot: () => {
      const st = state();
      const s = st.s;
      /* until a sample is taken the list is the front of the roll, which is
         what his clause says it is; the draw is what can make it something
         else */
      if (!sample.length) return null;
      if (st.fair) return `are ${tint(K2, spellNumber(s))} Cretans drawn at random`;
      if (st.notRandom) return `are all the Cretans I can think of`;
      return `are ${tint(K2, spellNumber(s))} Cretans, the roll only partly mixed`;
    },
    allLiars: () => {
      if (!sample.length) return null;             // his sentence, until there is a draw
      const k = liarsDrawn(), s = drawn().length;
      if (k === s) return "these were all atrocious liars";
      if (k === 0) return `not one of these ${spellNumber(s)} was a liar`;
      return `${spellNumber(k)} of these ${spellNumber(s)} were atrocious liars`;
    },
    conclusion: () => {
      if (!sample.length) return null;
      const k = liarsDrawn(), s = drawn().length;
      if (k === s) return "pretty much all Cretans must have been liars";
      if (k === 0) return "pretty much no Cretan can have been a liar";
      return `about ${tint(EST_COL, fracWord(k, s))} of the Cretans must have been liars`;
    },
    /* "Probably" is a rate and nothing else, so the slider that sets the rate
       rewrites the word. At the probable error it is his own. */
    probably: () => {
      const c = Math.round(num("ex20_conf"));
      return c <= 50 ? "probably" : `${spellNumber(c)} times out of a hundred`;
    },
    err: () => {
      const e = bound();
      return e > 0 ? `1/${fmt(1 / e, 1)}` : "0";
    },
    /* his fraction worked out, so the bound is a number on the page and not a
       thing to be looked up in a panel */
    bounded: () => `, meaning an error bound of &plusmn;${fmt(bound(), 4)}`,

    /* Where the run stands, in the sentence rather than in a box beside it.
       Before the reveal it can only report the estimate and whether the draw
       earned its bound; after it, how far out we were and how often the bound
       held. */
    reading: () => {
      const st = state();
      if (!st.n) return null;
      /* tinted, so a reader can see at a glance that this sentence is the
         apparatus reporting and not Peirce carrying on */
      const said = (s) => `<span class="ex-reading">${s}</span>`;
      const from = tint(K2, spellNumber(st.s));
      const one = `${tint(EST_COL, fmt(st.last, 3))} &plusmn; ${tint(K3, fmt(st.e, 4))}`;
      const many = `${bigmark(st.n)} such ${st.n === 1 ? "induction" : "inductions"}`;
      const avg = tint(EST_COL, fmt(st.mean, 3));

      if (!revealed) {
        const trust = st.fair
          ? "and since the sample was drawn at random we can rely on that bound"
          : st.notRandom
          ? `though the ${from} were taken as they came rather than drawn at random, so the bound has not
             been earned`
          : "though the hundred were only partly mixed, so the bound has not quite been earned";
        return said(`Our last induction from ${from} gave ${one}, ${trust}. Over ${many} the estimates
          average ${avg}.`);
      }
      const d = Math.abs(st.last - truth);
      const off = d < 0.0005 ? "which it hit exactly"
        : `out by ${tint(EST_COL, fmt(d, 3))}, ${d <= st.e ? "inside the bound"
          : d <= 2 * st.e ? "outside it" : "far outside it"}`;

      /* Why a fair draw still misses the claimed rate, in the two ways it can.
         First and usually larger: the bound is worked out at p = 1/2, where the
         spread is widest, so at any other proportion the window is wider than
         that proportion warrants and catches more often than claimed. The
         bound that would be caught at the claimed rate is calculable — it is
         the same formula at the real p — so both are given, and the difference
         between the two rates is the price of not knowing p. Second: the
         estimate has only s + 1 places to land, so the window catches one of
         them at some proportions and two at others, which moves the rate
         either way and is what is left once the first is accounted for. */
      const eFit = boundAtP(st.conf, st.s, truth);
      const slack = st.e > eFit * 1.02;
      /* "Even in the worst case" cuts the other way too, and this is the half
         of it his sentence leaves implicit: away from a half the same bound is
         bought with fewer instances. Setting 0.477 root(2q(1-q)/n) equal to the
         worst case at s gives n = 4 s q(1-q) — at nine liars in ten, two
         Cretans do what five do at a half. */
      const nEquiv = Math.max(1, Math.round(4 * st.s * truth * (1 - truth)));
      const fewer = nEquiv < st.s
        ? ` At that proportion ${tint(K2, spellNumber(nEquiv))}
            ${nEquiv === 1 ? "instance" : "instances"} would buy the bound that
            ${tint(K2, spellNumber(st.s))} do at a half, which is the other half of
            &ldquo;even in the worst case&rdquo;.`
        : "";
      const why = st.fair
        ? `A fair draw of ${from} from a hundred puts that rate at ${tint(K3, fmt(exactRate(st.e), 3))}. `
          + (slack
            ? `Peirce's bound is the worst case, p = &frac12;, so it is wider than this proportion warrants:
               at ${tint(GOLD, fmt(truth, 2))} the probable error is ${tint(K3, "&plusmn;" + fmt(eFit, 4))},
               and a bound that size would be caught ${tint(K3, fmt(exactRate(eFit) * 100, 1))} in 100.${fewer}
               What is left over is the lattice &mdash; `
            : `The bound already fits this proportion, so what moves the rate off the claim is the lattice
               &mdash; `)
          + `an induction from ${from} can land on only ${tint(K2, spellNumber(st.s + 1))} values, and the
             window round the truth catches one of them at some proportions and two at others.`
        : st.notRandom
        ? `The ${from} were remembered rather than drawn, and the bound says nothing about a sample got that
           way.`
        : "The hundred were only partly mixed, so the draw was not fair and this rate is not the one the "
          + "bound promises.";
      return said(`Our last induction from ${from} gave ${one}, and the real proportion is
        ${tint(GOLD, fmt(truth, 2))} &mdash; ${off}. Over ${many} the estimates average ${avg}, and the bound
        caught the truth ${tint(K3, bigmark(st.nIn))} times in ${bigmark(st.n)}, or
        ${tint(K3, fmt(st.rate * 100, 1))} in 100 where ${tint(K3, st.level)} was claimed. ${why}`);
    }
  });

  let truth = 0.5;            // the hidden proportion, as a count out of a hundred
  let pop = [];               // the roll: liars at the front, where memory finds them
  let sample = [];            // indices uncovered by the last sample
  let estimates = [];         // one proportion per sample taken
  let revealed = false;

  function newCretans(p) {
    const liars = Math.max(1, Math.min(N - 1,
      Math.round((p === undefined ? 0.08 + Math.random() * 0.84 : p) * N)));
    truth = liars / N;
    pop = Array.from({ length: N }, (_, i) => i < liars);
    sample = []; estimates = []; revealed = false;
  }
  newCretans();

  function clearSamples() { sample = []; estimates = []; }

  /* Mixing, as something one does or fails to do. Each Cretan is picked up with
     probability m and the picked-up ones are dropped back in a shuffled order,
     so m = 0 leaves the roll exactly as it stands and m = 1 is a fair shuffle.
     The sample is then the first s of the roll: "all the Cretans I can think
     of" and "a random five" are the same act performed on different rolls. */
  function presentedOrder(m) {
    const idx = Array.from({ length: N }, (_, i) => i);
    const picked = [];
    for (let i = 0; i < N; i++) if (Math.random() < m) picked.push(i);
    const vals = shuffle(picked.map((i) => idx[i]));
    picked.forEach((i, j) => { idx[i] = vals[j]; });
    return idx;
  }

  function takeSamples(k) {
    const s = Math.round(num("ex20_s")), m = num("ex20_mix");
    for (let i = 0; i < k; i++) {
      const idx = presentedOrder(m).slice(0, s);
      estimates.push(idx.filter((j) => pop[j]).length / s);
      sample = idx;
    }
    if (estimates.length > 5000) estimates = estimates.slice(-5000);
  }

  const caught = (p, e) => Math.abs(p - truth) <= e + 1e-12;

  /* What the rate ought to come to, exactly, for a fair draw of s from these
     hundred. Hypergeometric rather than binomial because the sample is s
     distinct Cretans out of a hundred, not s throws at Crete. Worth having on
     the page: at five instances the estimate can land on only six values, so
     the realised rate sits wherever the lattice puts it — sometimes well under
     a half, sometimes well over — and the counted rate agreeing with this
     number is what shows the sampling is behaving. */
  function exactRate(e) {
    const s = Math.round(num("ex20_s")), K = Math.round(truth * N);
    let tot = 0;
    for (let k = 0; k <= s; k++) {
      if (k > K || s - k > N - K) continue;
      if (Math.abs(k / s - truth) <= e + 1e-12) {
        tot += Math.exp(lchoose(K, k) + lchoose(N - K, s - k) - lchoose(N, s));
      }
    }
    return tot;
  }

  /* ---- the cascade: every sample with its bound, coloured once the
     proportion is uncovered. Before then there is nothing to colour by, which
     is the position an enquirer is actually in. --------------------------- */
  const cascade = mkCanvas(300, (pl) => {
    if (!estimates.length) { blankPlot(pl, "Take a sample to begin"); return; }
    const e = bound();
    const df = estimates.slice(-60);
    const nIn = df.filter((p) => caught(p, e)).length;
    pl.setup({ xlim: [0.5, df.length + 0.5], ylim: [0, 1], mar: [4, 5, 3, 1.5] });
    pl.axes({ ny: 5 });
    pl.box();
    pl.axisLabels("Sample", "Proportion of liars");
    pl.title(revealed ? `${nIn} of these ${df.length} catch the truth`
      : `Each sample, ±${fmt(e, 4)} allowed`, { cex: 0.95 });
    pl.clip(true);
    if (revealed) pl.abline({ h: truth, col: "#c79a45", lwd: 2 });
    df.forEach((p, i) => {
      const col = revealed ? (caught(p, e) ? "#4a7c59" : "#b0563f") : "#8a9099";
      pl.segments(i + 1, Math.max(0, p - e), i + 1, Math.min(1, p + e), { col: col, lwd: 1.6 });
      pl.points([i + 1], [p], { cex: 0.6, col: revealed ? col : "#2f6f9f" });
    });
    pl.clip(false);
    /* nothing to key on before the reveal — the title has already said what a
       band is, and an extra box would only sit on top of the record */
    if (revealed) {
      pl.legend("bottomright", {
        legend: ["The truth", "Caught it", "Missed"],
        col: ["#c79a45", "#4a7c59", "#b0563f"], lwd: [2, 2, 2], cex: 0.7
      });
    }
  });
  $("#ex20-cascade", content).appendChild(cascade);

  /* ---- where the estimates pile up, and where their average settles ----- */
  const hist = mkCanvas(300, (pl) => {
    if (!estimates.length) { blankPlot(pl, "Take a sample to begin"); return; }
    const s = Math.round(num("ex20_s")), e = bound();
    const counts = new Array(s + 1).fill(0);
    estimates.forEach((p) => counts[Math.round(p * s)]++);
    const maxC = Math.max(1, ...counts);
    pl.setup({ xlim: [0, 1], ylim: [0, 1.3], mar: [4, 4, 3, 2] });
    pl.axes({ nx: 5, yat: [] });
    pl.box();
    pl.axisLabels("Proportion of liars in the sample", "How often obtained");
    pl.title(`Estimates from samples of ${s}`, { cex: 0.95 });
    pl.clip(true);
    const halfW = 0.5 / s;
    counts.forEach((c, i) => {
      if (!c) return;
      const x = i / s;
      pl.rect(x - halfW, 0, x + halfW, c / maxC, { col: "rgba(44,127,184,0.5)", border: "#2f6f9f", lwd: 0.8 });
    });
    if (revealed) {
      pl.rect(Math.max(0, truth - e), 0, Math.min(1, truth + e), 1.02,
        { col: "rgba(199,154,69,0.16)", border: null });
      pl.abline({ v: truth, col: "#c79a45", lwd: 2.5 });
    }
    /* the two numbers of ex11, on the one induction the sentence reports: the
       proportion it gave, and the probable error that says what it is worth.
       The band either covers the gold line or it does not, which is the single
       case behind the rate counted in the cascade. */
    const last = estimates[estimates.length - 1];
    pl.abline({ v: last, col: EST_COL, lwd: 2, lty: 2 });
    const lo = Math.max(0, last - e), hi = Math.min(1, last + e);
    pl.segments(lo, 1.12, hi, 1.12, { col: EST_COL, lwd: 2 });
    pl.segments(lo, 1.07, lo, 1.17, { col: EST_COL, lwd: 2 });
    pl.segments(hi, 1.07, hi, 1.17, { col: EST_COL, lwd: 2 });
    pl.points([last], [1.12], { cex: 1.1, col: EST_COL });
    pl.clip(false);
    /* the proportion is named in the sentence above; the line only has to be
       findable, not labelled */
    pl.legend("topleft", {
      legend: revealed
        ? [`Last induction ${fmt(last, 3)} ± ${fmt(e, 3)}`, "The truth"]
        : [`Last induction ${fmt(last, 3)} ± ${fmt(e, 3)}`],
      col: revealed ? [EST_COL, "#c79a45"] : [EST_COL],
      lwd: revealed ? [2, 2.5] : [2], lty: revealed ? [2, 1] : [2], cex: 0.68
    });
  });
  $("#ex20-hist", content).appendChild(hist);

  function update() {
    const st = state(), s = st.s, e = st.e;
    const inSample = new Set(sample);

    /* the wording at the ends of the mixing slider, kept in step with the
       sample size, which is where the two named cases live now */
    const mixVal = $("#ex20_mix_val", content);
    if (mixVal) {
      mixVal.textContent = st.m < 0.005 ? `the ${spellNumber(s)} that come to mind`
        : st.m > 0.995 ? `a random ${spellNumber(s)}` : st.m.toFixed(2);
    }

    /* the hundred, question marks until a sample uncovers them */
    let cells = "";
    for (let i = 0; i < N; i++) {
      const shown = revealed || inSample.has(i);
      const bg = shown ? (pop[i] ? CRETAN_LIAR : CRETAN_TRUE) : CRETAN_UNSEEN;
      const ring = inSample.has(i) ? "box-shadow:0 0 0 2px #2c3138;" : "";
      /* every box is somebody, and the five in the sentence above are five of
         these: the name is on the box so the two can be matched by hand */
      cells += `<span title="${CRETAN_NAMES[i % CRETAN_NAMES.length]}"
        style="display:inline-block;width:20px;height:20px;margin:2px;border-radius:3px;
        border:1px solid #a8adb4;${ring}background:${bg};color:#8a9099;font-size:0.72em;line-height:20px;
        text-align:center;vertical-align:top;">${shown ? "" : "?"}</span>`;
    }
    $("#ex20-population", content).innerHTML = `
      <p style="font-size:0.9em;margin-bottom:4px;color:#575d66;">The hundred Cretans
        &mdash; <span style="color:${CRETAN_LIAR_INK};font-weight:700;">liars</span>,
        <span style="color:${CRETAN_TRUE_INK};font-weight:700;">truth-tellers</span>, and those not looked
        at:</p>
      <div style="line-height:1;">${cells}</div>`;

    /* the running estimate is reported in the sentence above, so this line has
       only to say what the last draw turned up */
    const lastEst = estimates.length ? estimates[estimates.length - 1] : null;
    $("#ex20-last", content).innerHTML = sample.length
      ? `<p style="margin-top:8px;margin-bottom:0;font-size:0.9em;color:#575d66;">The ${spellNumber(s)} just
         uncovered gave <strong>${fmt(lastEst, 3)}</strong>.</p>`
      : `<p class="help-text" style="margin-top:8px;">Nothing uncovered yet.</p>`;

    drawCanvas(cascade);
    drawCanvas(hist);
  }

  /* The estimates do not depend on the confidence level — only the bound drawn
     around them does — so moving that slider recolours the record rather than
     discarding it. Changing the sample or the mixing makes a different record. */
  content.addEventListener("input", (ev) => {
    const id = ev.target && ev.target.id;
    if (id === "ex20_s" || id === "ex20_mix") clearSamples();
    update();
  });
  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "one") takeSamples(1);
    else if (a === "five") takeSamples(5);
    else if (a === "many") takeSamples(100);
    else if (a === "lots") takeSamples(1000);
    else if (a === "clear") clearSamples();
    else if (a === "newpop") newCretans();
    else if (a === "reveal") revealed = true;
    else return;
    update();
  });
  update();
});
</script>
