<script>
/* ==========================================================================
   Section I — examples 1, 2 and 3.

   1: Forms I and II are one argument with one knob turned.
   2: the ratio need not be a number; it may be a set of numbers.
   3: the instance must be drawn at random, and drawn before you look.
   ========================================================================*/

/* ---------------------------------------------------------------- ex 1 ---
   One argument, one knob. The slider is the proportion rho; the form of the
   argument never changes as it moves, only the strength, so the argument is
   printed once and the same three lines are re-lettered in place.
   -----------------------------------------------------------------------*/
registerExample("example-ex1", (root) => {
  const S = { rho: 2, drawn: 0, recovered: 0 };

  /* a fixed scatter, so that "two per cent of persons" reads as two people
     here and there rather than as a bar filling from the left */
  const rnd = mulberry32(11);
  const ORDER = (() => {
    const a = Array.from({ length: 100 }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  })();
  const isP = (cell) => ORDER.indexOf(cell) < S.rho;

  root.appendChild(exHeader("The same argument, at every strength", "ex1-content"));
  const wrap = h('<div id="ex1-content" class="example-content"></div>');
  root.appendChild(wrap);

  wrap.appendChild(h(`<div class="row">
    <div class="col col-5">
      <div id="ex1-ctl"></div>
      <div id="ex1-presets"></div>
      <div class="pop-grid" id="ex1-grid"></div>
      <div class="help-text" id="ex1-legend"></div>
      <div class="ex-buttonbar" id="ex1-draw"></div>
      <div class="calc-output" id="ex1-tally"></div>
    </div>
    <div class="col col-7">
      <div class="arg" id="ex1-arg"></div>
      <div class="arg" id="ex1-arg2"></div>
      <div class="note-block" id="ex1-note"></div>
    </div>
  </div>`));

  $("#ex1-ctl", wrap).appendChild(
    slider("ex1_rho", "The proportion &rho; of the M&rsquo;s that are P&rsquo;s",
      0, 100, S.rho, 1, (v) => (v / 100).toFixed(2), "k1"));

  const presets = btnGroup([
    ["2", "the liver wound (2%)", "btn-primary"],
    ["50", "an even chance (50%)", "btn-secondary"],
    ["98", "recovery the rule (98%)", "btn-secondary"],
    ["100", "every man dies (100%)", "btn-success"]
  ], "2", (v) => { setSlider("ex1_rho", +v); });
  $("#ex1-presets", wrap).appendChild(presets);

  const grid = $("#ex1-grid", wrap);
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const c = h('<div class="pop-cell"></div>');
    grid.appendChild(c); cells.push(c);
  }

  $("#ex1-draw", wrap).appendChild(h('<button class="btn btn-primary" id="ex1_draw1">draw this man</button>'));
  $("#ex1-draw", wrap).appendChild(h('<button class="btn btn-secondary" id="ex1_draw50">draw fifty</button>'));
  $("#ex1-draw", wrap).appendChild(h('<button class="btn btn-secondary" id="ex1_reset">start again</button>'));

  function drawOne(mark) {
    const cell = sampleInt(100);
    S.drawn++;
    if (isP(cell)) S.recovered++;
    if (mark) {
      cells.forEach((c) => c.classList.remove("pick"));
      cells[cell].classList.add("pick");
    }
  }
  $("#ex1_draw1", wrap).addEventListener("click", () => { drawOne(true); render(); });
  $("#ex1_draw50", wrap).addEventListener("click", () => {
    for (let i = 0; i < 50; i++) drawOne(i === 49);
    render();
  });
  $("#ex1_reset", wrap).addEventListener("click", () => {
    S.drawn = 0; S.recovered = 0;
    cells.forEach((c) => c.classList.remove("pick"));
    render();
  });
  $("#ex1_rho", wrap).addEventListener("input", () => {
    S.rho = num("ex1_rho");
    S.drawn = 0; S.recovered = 0;
    presets._set(String(S.rho));
    render();
  });

  function render() {
    const rho = S.rho, p = rho / 100;
    cells.forEach((c, i) => c.classList.toggle("on", isP(i)));

    $("#ex1-legend", wrap).innerHTML =
      `<span style="color:var(--accent)">&#9632;</span> the ${bigmark(rho)} in a hundred who are P&rsquo;s` +
      `&nbsp;&nbsp;<span style="color:var(--rule)">&#9632;</span> the ${bigmark(100 - rho)} who are not`;

    /* The general form. At the ends of the travel the middle line of the
       major premise is the only thing that changes, and the argument is
       Barbara — which is the whole claim of the section. */
    const necessary = (rho === 100 || rho === 0);
    const major = rho === 100 ? "Every M is a P;"
                : rho === 0 ? "No M is a P;"
                : `The proportion <span class="live is-live k1">${p.toFixed(2)}</span> of the M&rsquo;s are P&rsquo;s;`;
    const concl = rho === 100 ? "Hence, S is a P."
                : rho === 0 ? "Hence, S is not a P."
                : `It follows, with probability <span class="live is-live k1">${p.toFixed(2)}</span>, that S is a P.`;
    const name = rho === 100 ? "Form I. &nbsp;Singular syllogism in Barbara"
               : rho === 0 ? "Form I. &nbsp;Barbara, negatively"
               : "Form II. &nbsp;Simple probable deduction";
    const arg = $("#ex1-arg", wrap);
    arg.classList.toggle("is-necessary", necessary);
    arg.innerHTML = `<div class="arg-name">${name}</div>
      <p>${major}</p><p>S is an M:</p><p class="concl">${concl}</p>`;

    /* Peirce's own instance, in the same three lines. */
    const pctWord = spellNumber(rho);
    const arg2 = $("#ex1-arg2", wrap);
    arg2.classList.toggle("is-necessary", necessary);
    arg2.innerHTML = `<div class="arg-name">the same argument, in his words</div>
      <p>${rho === 100 ? "Every person" : `About <span class="live is-live k1">${pctWord} per cent</span> of persons`} wounded in the liver ${rho === 100 ? "recovers" : "recover"};</p>
      <p>This man has been wounded in the liver:</p>
      <p class="concl">${rho === 100
        ? "Therefore, he will recover."
        : rho === 0
          ? "Therefore, he will not recover."
          : `Therefore, there are <span class="live is-live k1">${pctWord} chances out of a hundred</span> that he will recover.`}</p>`;

    $("#ex1-note", wrap).innerHTML = necessary
      ? "At the ends of the travel the second premise and the conclusion are exactly what they were in the middle. Only the major premise has stopped naming a proportion, and the argument has become a syllogism &mdash; &ldquo;the probable argument may approximate indefinitely to demonstration as the ratio named in the first premise approaches to unity or to zero.&rdquo;"
      : "Nothing in the shape of the argument has changed. The premises stand in the same relation, the conclusion follows in the same way. What the slider moves is how often reasoning like this carries truth with it.";

    const t = $("#ex1-tally", wrap);
    if (!S.drawn) {
      t.textContent = "Draw a man from the hundred and see whether he is one of the P's.\n"
        + "The argument is the same whichever he turns out to be; what the drawings\n"
        + "show is the rate at which arguments of this shape come out true.";
    } else {
      const obs = S.recovered / S.drawn;
      t.textContent =
        `men drawn      ${S.drawn}\n` +
        `of them P's    ${S.recovered}\n` +
        `observed rate  ${(obs * 100).toFixed(1)} per cent\n` +
        `rho says       ${rho} per cent`;
    }
  }

  const rhoWord = () => (S.rho === 100 ? "a hundred" : spellNumber(S.rho));
  registerLive("example-ex1", {
    pct: () => `${rhoWord()} per cent`,
    chances: () => `${rhoWord()} chances out of a hundred`,
    rho: () => (S.rho / 100).toFixed(2)
  });

  render();
});

/* ---------------------------------------------------------------- ex 2 ---
   The ratio need not be exactly specified. What a premise gives us is a set
   of admitted ratios; the conclusion it yields is a set too.
   -----------------------------------------------------------------------*/
registerExample("example-ex2", (root) => {
  const S = { lo: 0, hi: 2, invert: false, preset: "notmore" };
  let SETTING = false;

  const PRESETS = {
    exact:   { lo: 2,  hi: 2,  invert: false, cl: null,
               say: "the proportion &rho; of the M&rsquo;s are P&rsquo;s, and &rho; is exactly .02" },
    notmore: { lo: 0,  hi: 2,  invert: false, cl: "ex2-cl-notmore",
               say: "not more than two per cent of persons wounded in the liver recover" },
    notless: { lo: 30, hi: 100, invert: false, cl: "ex2-cl-notless",
               say: "not less than a certain proportion of the M&rsquo;s are P&rsquo;s" },
    novery:  { lo: 15, hi: 85, invert: false, cl: "ex2-cl-novery",
               say: "no very large nor very small proportion of the M&rsquo;s are P&rsquo;s" },
    excl:    { lo: 40, hi: 60, invert: true,  cl: null,
               say: "the proportion is anything but a middling one" }
  };

  root.appendChild(exHeader("A premise that names a set of ratios", "ex2-content"));
  const wrap = h('<div id="ex2-content" class="example-content"></div>');
  root.appendChild(wrap);

  wrap.appendChild(h(`<div>
    <div id="ex2-presets"></div>
    <div class="row">
      <div class="col col-6"><div id="ex2-ctl-lo"></div></div>
      <div class="col col-6"><div id="ex2-ctl-hi"></div></div>
    </div>
    <div id="ex2-ctl-inv"></div>
    <div class="ratio-bar" id="ex2-bar"></div>
    <div class="ratio-scale" id="ex2-scale"></div>
    <div class="arg" id="ex2-arg" style="margin-top:18px"></div>
    <div class="note-block" id="ex2-note"></div>
    </div>`));

  $("#ex2-presets", wrap).appendChild(btnGroup([
    ["exact",   "exactly two per cent", "btn-secondary"],
    ["notmore", "not more than two per cent", "btn-primary"],
    ["notless", "not less than…", "btn-primary"],
    ["novery",  "no very large nor very small", "btn-primary"],
    ["excl",    "anything but middling", "btn-warning"]
  ], "notmore", (v) => {
    const p = PRESETS[v];
    /* setSlider fires input, which the free-hand handler below reads as the
       reader taking the controls over; the flag keeps the preset named. */
    SETTING = true;
    S.invert = p.invert;
    $("#ex2_inv", wrap).checked = p.invert;
    setSlider("ex2_lo", p.lo); setSlider("ex2_hi", p.hi);
    SETTING = false;
    S.lo = p.lo; S.hi = p.hi; S.preset = v;
    render();
  }));

  $("#ex2-ctl-lo", wrap).appendChild(
    slider("ex2_lo", "from", 0, 100, S.lo, 1, (v) => (v / 100).toFixed(2), "k1"));
  $("#ex2-ctl-hi", wrap).appendChild(
    slider("ex2_hi", "to", 0, 100, S.hi, 1, (v) => (v / 100).toFixed(2), "k2"));
  $("#ex2-ctl-inv", wrap).appendChild(
    checkbox("ex2_inv", "the band is what the premise <em>excludes</em>", false));

  ["ex2_lo", "ex2_hi", "ex2_inv"].forEach((id) =>
    $("#" + id, wrap).addEventListener("input", () => {
      S.lo = num("ex2_lo"); S.hi = num("ex2_hi"); S.invert = chk("ex2_inv");
      if (!SETTING) S.preset = "free";
      render();
    }));

  const bar = $("#ex2-bar", wrap);
  $("#ex2-scale", wrap).innerHTML = [0, 0.25, 0.5, 0.75, 1]
    .map((v) => `<span style="left:${v * 100}%">${v.toFixed(2)}</span>`).join("");

  function bands() {
    const lo = Math.min(S.lo, S.hi), hi = Math.max(S.lo, S.hi);
    return S.invert
      ? [[0, lo], [hi, 100]].filter(([a, b]) => b > a)
      : [[lo, hi]];
  }

  function render() {
    const bs = bands();
    bar.innerHTML = bs.map(([a, b]) =>
      `<div class="band" style="left:${a}%;width:${Math.max(b - a, 0.6)}%"></div>`).join("");

    const say = bs.map(([a, b]) => a === b
      ? `exactly ${(a / 100).toFixed(2)}`
      : `between ${(a / 100).toFixed(2)} and ${(b / 100).toFixed(2)}`).join(", or ");
    const width = bs.reduce((t, [a, b]) => t + (b - a), 0);

    $("#ex2-arg", wrap).innerHTML =
      `<div class="arg-name">Form II, with the ratio left indeterminate</div>
       <p>The proportion <span class="live is-live k1">${say}</span> of the M&rsquo;s are P&rsquo;s;</p>
       <p>S is an M:</p>
       <p class="concl">It follows, with probability <span class="live is-live k1">${say}</span>, that S is a P.</p>`;

    $("#ex2-note", wrap).innerHTML = width >= 99.4
      ? "The premise now excludes nothing, and the conclusion is the whole of the interval &mdash; which is to say there is no conclusion. Every other setting of these handles says something, however loosely."
      : `The premise admits <strong>${rround(width, 0)}</strong> of the hundred possible ratios and excludes the other <strong>${rround(100 - width, 0)}</strong>. That is all a probable premise ever does: &ldquo;it simply excludes some ratios and admits the possibility of the rest.&rdquo; The conclusion is a region of the same bar, not a point on it.`;

    ["ex2-cl-notmore", "ex2-cl-notless", "ex2-cl-novery"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("hl-on", (PRESETS[S.preset] || {}).cl === id);
    });
  }

  registerLive("example-ex2", {}, {
    onRefresh: (on) => {
      if (!on) ["ex2-cl-notmore", "ex2-cl-notless", "ex2-cl-novery"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("hl-on");
      });
      else render();
    }
  });

  render();
});

/* ---------------------------------------------------------------- ex 3 ---
   "The instance must be drawn at random." Three sources for one card, and
   then the second condition: the conclusion must be drawn in advance of any
   other knowledge of the case.
   -----------------------------------------------------------------------*/
const SUIT_CH = { S: "♠", H: "♥", D: "♦", C: "♣" };
const PIQUET_RANKS = ["7", "8", "9", "10", "J", "Q", "K", "A"];
const FULL_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_VAL = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "10": 10, J: 11, Q: 12, K: 13, A: 14 };

function cardHTML(c, cls) {
  if (!c) return '<span class="card back"><span class="pip">?</span></span>';
  const red = (c.s === "H" || c.s === "D");
  return `<span class="card${red ? " red" : ""}${c.r === "A" ? " ace" : ""}${cls ? " " + cls : ""}">` +
    `<span>${c.r}</span><span class="pip">${SUIT_CH[c.s]}</span></span>`;
}
const makePack = (ranks) => {
  const out = [];
  ["S", "H", "D", "C"].forEach((s) => ranks.forEach((r) => out.push({ r: r, s: s })));
  return out;
};

registerExample("example-ex3", (root) => {
  const S = { src: "pack", card: null, faceUp: false, deal: null, care: 100 };

  root.appendChild(exHeader("Where the card came from, and when you looked", "ex3-content"));
  const wrap = h('<div id="ex3-content" class="example-content"></div>');
  root.appendChild(wrap);

  wrap.appendChild(h(`<div>
    <div id="ex3-src"></div>
    <div id="ex3-care"></div>
    <div id="ex3-pile"></div>
    <div class="row" style="margin-top:6px">
      <div class="col col-4" style="text-align:center">
        <div id="ex3-card"></div>
        <div class="ex-buttonbar" id="ex3-acts" style="justify-content:center"></div>
      </div>
      <div class="col col-8">
        <div class="arg" id="ex3-arg"></div>
        <div class="calc-output" id="ex3-calc"></div>
      </div>
    </div>
    <div class="note-block" id="ex3-note"></div>
    </div>`));

  $("#ex3-src", wrap).appendChild(btnGroup([
    ["pack",   "the whole piquet pack", "btn-primary"],
    ["piquet", "the cards discarded at piquet", "btn-warning"],
    ["euchre", "the cards discarded for euchre", "btn-warning"]
  ], "pack", (v) => { S.src = v; S.card = null; S.faceUp = false; if (v === "piquet") deal(); render(); }));

  $("#ex3-care", wrap).appendChild(
    slider("ex3_care", "How far the players choose what to throw out &mdash; at 0 they discard at random, at 1 they always throw the five lowest",
      0, 100, S.care, 1, (v) => (v / 100).toFixed(2), "k2"));
  $("#ex3_care", wrap).addEventListener("input", () => {
    S.care = num("ex3_care");
    if (S.src === "piquet") { deal(); S.card = null; S.faceUp = false; }
    render();
  });

  $("#ex3-acts", wrap).appendChild(h('<button class="btn btn-primary btn-sm" id="ex3_draw">draw a card</button>'));
  $("#ex3-acts", wrap).appendChild(h('<button class="btn btn-danger btn-sm" id="ex3_look">look at it</button>'));
  $("#ex3-acts", wrap).appendChild(h('<button class="btn btn-secondary btn-sm" id="ex3_again">deal again</button>'));

  /* Two hands of twelve, each player throwing out five — which is why the pile
     Peirce points at need not be a random part of the pack. `care` is how much
     of the choosing is judgment and how much is chance: at 0 the five go out at
     random and the pile is as good as the pack, at 1 the five lowest go every
     time and no ace ever reaches it. The maxim has a dial, not a switch. */
  function deal() {
    const pack = shuffle(makePack(PIQUET_RANKS));
    const h1 = pack.slice(0, 12), h2 = pack.slice(12, 24), talon = pack.slice(24);
    const care = S.care / 100;
    const throwOut = (hand) => {
      const left = hand.slice(), out = [];
      while (out.length < 5) {
        let i;
        if (Math.random() < care) {
          i = 0;
          for (let j = 1; j < left.length; j++) if (RANK_VAL[left[j].r] < RANK_VAL[left[i].r]) i = j;
        } else i = sampleInt(left.length);
        out.push(left.splice(i, 1)[0]);
      }
      return out;
    };
    const d1 = throwOut(h1), d2 = throwOut(h2);
    S.deal = { h1: h1, h2: h2, d1: d1, d2: d2, talon: talon, pile: d1.concat(d2) };
  }

  function source() {
    if (S.src === "pack") return { cards: makePack(PIQUET_RANKS), name: "the whole piquet pack" };
    if (S.src === "euchre") {
      return { cards: makePack(FULL_RANKS).filter((c) => RANK_VAL[c.r] < 9),
        name: "the cards thrown out of a full pack to make a euchre pack" };
    }
    if (!S.deal) deal();
    return { cards: S.deal.pile, name: "the two players&rsquo; discards at piquet" };
  }

  $("#ex3_draw", wrap).addEventListener("click", () => {
    const src = source();
    if (!src.cards.length) return;
    S.card = src.cards[sampleInt(src.cards.length)];
    S.faceUp = false;
    render();
  });
  $("#ex3_look", wrap).addEventListener("click", () => { if (S.card) { S.faceUp = true; render(); } });
  $("#ex3_again", wrap).addEventListener("click", () => {
    if (S.src === "piquet") deal();
    S.card = null; S.faceUp = false; render();
  });

  function render() {
    const src = source();
    const n = src.cards.length;
    const aces = src.cards.filter((c) => c.r === "A").length;

    /* the pack, or the hands it was dealt into */
    const pile = $("#ex3-pile", wrap);
    if (S.src === "pack") {
      pile.innerHTML = '<div class="pack-grid">' +
        src.cards.map((c) => cardHTML(c)).join("") + "</div>";
    } else if (S.src === "euchre") {
      const full = makePack(FULL_RANKS);
      pile.innerHTML = '<div class="pack-grid">' +
        full.map((c) => cardHTML(c, RANK_VAL[c.r] < 9 ? "" : "dim")).join("") + "</div>" +
        '<div class="help-text">The euchre pack is what is left after the twos to eights are thrown out. The pile to draw from is the bright half; every ace is in the other one.</div>';
    } else {
      const d = S.deal;
      const row = (lbl, hand, disc) => `<div class="card-row"><span class="hand-lbl">${lbl}</span>` +
        hand.map((c) => cardHTML(c, disc.includes(c) ? "" : "dim")).join("") + "</div>";
      pile.innerHTML =
        row("elder hand", d.h1, d.d1) +
        row("younger hand", d.h2, d.d2) +
        '<div class="card-row"><span class="hand-lbl">the discards</span>' +
        d.pile.map((c) => cardHTML(c)).join("") + "</div>" +
        '<div class="help-text">Each player throws out his five worst cards. Bright cards are the ones discarded; dimmed cards are kept.</div>';
    }

    $("#ex3-card", wrap).innerHTML = S.card
      ? (S.faceUp ? cardHTML(S.card, "big") : '<span class="card back big"><span class="pip">?</span></span>')
      : '<span class="card back big" style="opacity:.35"><span class="pip">&nbsp;</span></span>';

    const p = n ? aces / n : 0;
    const known = S.faceUp;
    const isAce = S.card && S.card.r === "A";

    $("#ex3-arg", wrap).innerHTML =
      `<div class="arg-name">${known ? "no longer an argument of this kind" : "Form II"}</div>
       <p>${aces === 0
          ? `<span class="live is-live k1">No</span> card in ${src.name} is an ace;`
          : `The proportion <span class="live is-live k1">${frac(aces, n)}</span> of the cards in ${src.name} are aces;`}</p>
       <p>This card has been drawn at random from ${src.name}:</p>
       <p class="concl">${known
          ? `<span style="color:var(--accent-2)">&mdash; but the card has been looked at. It is ${isAce ? "an ace" : "not an ace"}, so the chance that it is one is ${isAce ? "1" : "0"}, and the premises above have nothing left to do.</span>`
          : `It follows, with probability <span class="live is-live k1">${rround(p, 4)}</span>, that this card is an ace.`}</p>`;

    $("#ex3-calc", wrap).textContent =
      `source          ${src.name.replace(/&rsquo;/g, "'")}\n` +
      `cards in it     ${n}\n` +
      `aces among them ${aces}\n` +
      `chance          ${aces}/${n} = ${n ? rround(p, 4) : "—"}` +
      (S.card ? `\ncard drawn      ${known ? S.card.r + SUIT_CH[S.card.s] : "face down"}` : "");

    $("#ex3-note", wrap).innerHTML = known
      ? "This is the second half of the maxim, and it costs the argument everything: &ldquo;That the conclusion must be drawn in advance of any other knowledge on the subject is a rule that, however elementary, will be found in the sequel to have great importance.&rdquo; Turn the card back down &mdash; deal again &mdash; and the eighth returns."
      : S.src === "pack"
        ? "Four aces in thirty-two cards: the chance is one eighth, and it is one eighth only because the drawing was made from the whole pack, with the will of the drawer taking no part in which card came."
        : "The same card, the same question, a different precept of selection &mdash; and the answer is not one eighth. Nothing about the card has changed. What has changed is the class it was drawn from, and the fact that a person&rsquo;s judgment did the sorting.";
  }

  /* Peirce writes the chance as "one eighth", so a chance standing in for his
     is written the same way where it reduces, and "n in m" where it does not. */
  function chanceWords(aces, n) {
    if (!n) return null;
    if (aces === 0) return "nothing at all";
    const g = (a, b) => (b ? g(b, a % b) : a);
    const d = g(aces, n);
    const num = aces / d, den = n / d;
    if (num === 1 && den <= 20) return `one ${["", "", "half", "third", "fourth", "fifth", "sixth",
      "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth",
      "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth"][den]}`;
    return `${num} in ${den}`;
  }
  registerLive("example-ex3", {
    chance: () => {
      const src = source(), n = src.cards.length;
      const aces = src.cards.filter((c) => c.r === "A").length;
      if (!n) return null;
      if (S.faceUp) return S.card && S.card.r === "A" ? "certain" : "nothing at all";
      return chanceWords(aces, n);
    }
  });

  render();
});
</script>
