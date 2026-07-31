<script>
/* ==========================================================================
   EXAMPLE 21 — Sciential and Ignorantical probability

   Not a demonstration but a remark, and it opens the way the demonstrations do,
   so that the page carries only Peirce until it is asked to carry more. No
   header: there is nothing to collapse, and calling it an interactive example
   would promise something it does not do.
   ========================================================================*/
registerExample("example-ex21", (box) => {
  box.appendChild(h(`<div class="example-content" style="padding-top:2px;">
    <p class="ed-note" style="margin-bottom:0;">Peirce once dubbed his frequentist, materialist notion of
      probability &ldquo;Sciential Probability&rdquo;, while deeming a brand of conceptualist probability
      &ldquo;pure Ignorantical Probability&rdquo; (R 647, 18). This makes it clear which he preferred, and
      why. Sciential Probability is based on known frequencies. Ignorantial is based on assumptions about
      those frequencies (we will see some of these assumptions later in this paper). Some might suggest you
      could mix these two notions, taking a Bayesian approach so long as you intermingle it with some
      frequentism in the right ways. Peirce comments on this approach as well, noting that: &ldquo;The result
      of a calculation that mingles these two kinds of probability, indiscriminately, may be called, out of
      justice to the great mathematician whose worship keeps up its prevalent employment, Laplacian
      Probability&rdquo; (MS 647, 19). Similar examples could be multiplied endlessly. It is worth noting that
      his apparent reverence for Laplace in the above passage is mocking at best. In 1909, the previous year,
      Peirce stated that the inverse view of probability was first &ldquo;set forth by a certain Rev. Mr.
      Bayes, otherwise unknown to science. It was taken up by Laplace in his work on the subject, which is as
      weak on the logical side as it is strong on the mathematical side&rdquo; (MS 625:5).</p>
  </div>`));
});

/* ==========================================================================
   NEW EXAMPLE (28) — the row of urns

   "One urn contains all white balls, another one black and the rest white, a
    third two black and the rest white, and so on, one urn for each proportion,
    until an urn is reached containing only black balls."

   Nothing is calculated here. The passage describes an arrangement, and the
   arrangement is worth seeing before anything is said about drawing from it:
   set the number of balls and the whole row is there, one urn per proportion.
   ========================================================================*/
/* --------------------------------------------------------------------------
   28 and 30 show the same row of urns — the arrangement as it is supposed to
   be, and the arrangement as drawing at random gives it — so they share how
   many urns there are. 28 counts balls, and has one more urn than balls; 30
   counts urns, and puts one fewer ball in each. Whichever is built later takes
   the count as it stands.
   ------------------------------------------------------------------------*/
const URNS = { n: 5, syncing: false };          // 5 urns, 4 balls apiece

function urnsMirror(id) {
  if (URNS.syncing) return;
  const el = document.getElementById(id);
  if (!el) return;
  if (id === "ex28_n") URNS.n = Math.round(+el.value) + 1;
  else return;
  urnsAdopt();
}

function urnsAdopt() {
  URNS.syncing = true;
  [["ex28_n", URNS.n - 1]].forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el && Math.round(+el.value) !== v) {
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  URNS.syncing = false;
}

document.addEventListener("input", (ev) => {
  if (ev.target && ev.target.id) urnsMirror(ev.target.id);
}, true);

registerExample("example-ex28", (box) => {
  box.appendChild(exHeader("Interactive Example: One Urn for Each Proportion", "ex28-content"));
  const content = h(`<div id="ex28-content" class="example-content">
    <div id="ex28-view"></div>
    <div id="ex28-balls">
      <div id="ex28-control" style="max-width:340px;"></div>
      <div class="urn-row" id="ex28-urns"></div>
      <p class="help-text" id="ex28-note"></p>
    </div>
    <div id="ex28-letters" style="display:none;">
      <p>Imagine there are a hundred and one urns, the <em>k</em>th holding letters of which <em>k</em> in a
        hundred are consonants. Pretend that this paper is written in just consonants and vowels, without
        worrying about the specific consonant or vowel. We will proceed like the conceptualist. Read some of
        the paper and try to determine the probability that it was drawn from a given urn.</p>
      <div class="ex-buttonbar">
        <button class="btn btn-primary" data-act="ten">Read ten letters</button>
        <button class="btn btn-primary" data-act="hundred">Read a hundred</button>
        <button class="btn btn-primary" data-act="thousand">Read a thousand</button>
        <button class="btn btn-sm" data-act="here">Read up to the paragraph in view</button>
        <button class="btn btn-warning btn-sm" data-act="reset">Read nothing yet</button>
      </div>
      <div class="plot-container" id="ex28-post" style="margin-bottom:0;"></div>
      <div class="plot-container" id="ex28-urnstrip" style="margin-top:0;"></div>
      <div id="ex28-say"></div>
    </div>
  </div>`);
  box.appendChild(content);

  $("#ex28-view", content).appendChild(radios("ex28_view", "Show:",
    [["balls", "Peirce's urns, one for each proportion"],
     ["letters", "Which urn was this paper drawn from?"]], "balls"));
  $("#ex28-control", content).appendChild(
    slider("ex28_n", "Balls in each urn:", 1, 6, 4, 1, null, "k1"));
  urnsAdopt();
  vcBuild();

  const NURN = 101;

  content.addEventListener("input", () => { view(); render(); });
  content.addEventListener("change", () => { view(); render(); });

  function lettersOn() { return radioVal("ex28_view") === "letters"; }

  /* the paper is rewritten in v and c only while this view is on screen and
     asking for it — see vcBindVisibility */
  let syncEx28 = () => {};

  function view() {
    const on = lettersOn();
    $("#ex28-balls", content).style.display = on ? "none" : "";
    $("#ex28-letters", content).style.display = on ? "" : "none";
    syncEx28();
    if (on) requestAnimationFrame(redrawAll);
  }

  /* the posterior over the hundred and one urns, on a flat prior — the same
     arithmetic as the bags of 22, with letters for coins */
  function posterior() {
    const n = VC.head;
    let cons = 0;
    for (let i = 0; i < n; i++) if (!isVowel(VC.letters[i])) cons++;
    const lg = [];
    let max = -Infinity;
    for (let k = 0; k < NURN; k++) {
      const p = k / (NURN - 1);
      let l;
      if (!n) l = 0;
      else if ((p === 0 && cons > 0) || (p === 1 && cons < n)) l = -Infinity;
      else l = (cons ? cons * Math.log(p) : 0) + (n - cons ? (n - cons) * Math.log(1 - p) : 0);
      lg.push(l);
      if (l > max) max = l;
    }
    const w = lg.map((l) => (Number.isFinite(l) ? Math.exp(l - max) : 0));
    const tot = w.reduce((a, b) => a + b, 0) || 1;
    const post = w.map((x) => x / tot);
    /* the estimate the urns give: the mean of the weight over them, which is
       the urn the reading actually points at */
    const mean = post.reduce((s, p, k) => s + p * k, 0);
    return { n: n, cons: cons, post: post, mean: mean, pick: Math.round(mean) };
  }

  const PICK = "#7a6a94";

  /* The two charts share xlim and their left and right margins, so bar k of one
     stands directly over bar k of the other: the weight above, the urn it
     belongs to below. Only the lower one carries the axis title. */
  const XMAR = [5, 2];
  const XAT = [0, 20, 40, 60, 80, 100];

  const postCanvas = mkCanvas(240, (pl) => {
    const st = posterior();
    pl.setup({ xlim: [0, 100], ylim: [0, Math.max(0.02, Math.max(...st.post) * 1.15)],
      mar: [1.6, XMAR[0], 3, XMAR[1]] });
    pl.axes({ xat: XAT, xlabels: XAT.map(() => ""), yat: [] });
    pl.box();
    pl.axisLabels(null, "How probable this urn is");
    pl.title(st.n ? `After ${bigmark(st.n)} letters` : "Before a letter has been read", { cex: 0.95 });
    pl.clip(true);
    st.post.forEach((v, k) => {
      if (v <= 0) return;
      pl.rect(k - 0.5, 0, k + 0.5, v, { col: "rgba(47,111,159,0.55)", border: null });
    });
    if (VC.total) {
      const trueP = (VC.total - VC.vowels) / VC.total;
      pl.abline({ v: trueP * 100, col: "#b0563f", lwd: 2 });
    }
    if (st.n) pl.abline({ v: st.mean, col: PICK, lwd: 2, lty: 2 });
    pl.clip(false);
    pl.legend("topleft", {
      legend: st.n ? [`The urns say urn ${st.pick}`, "The paper's own proportion"]
        : ["The paper's own proportion"],
      col: st.n ? [PICK, "#b0563f"] : ["#b0563f"],
      lwd: [2, 2], lty: st.n ? [2, 1] : [1], cex: 0.7
    });
  });
  $("#ex28-post", content).appendChild(postCanvas);

  /* the same hundred and one urns, each one shown as what it holds */
  const urnCanvas = mkCanvas(110, (pl) => {
    pl.setup({ xlim: [0, 100], ylim: [0, 1], mar: [3.2, XMAR[0], 1.6, XMAR[1]] });
    pl.axes({ xat: XAT, yat: [] });
    pl.box();
    pl.axisLabels("Urn — consonants in a hundred", null);
    pl.clip(true);
    for (let k = 0; k < NURN; k++) {
      const c = k / (NURN - 1);
      if (c > 0) pl.rect(k - 0.5, 0, k + 0.5, c, { col: "rgba(47,111,159,0.6)", border: null });
      if (c < 1) pl.rect(k - 0.5, c, k + 0.5, 1, { col: "rgba(201,169,97,0.65)", border: null });
    }
    if (VC.total) {
      const trueP = (VC.total - VC.vowels) / VC.total;
      pl.abline({ v: trueP * 100, col: "#b0563f", lwd: 2 });
    }
    /* the one urn the reading picks out, ringed here and marked by the same
       line in the chart above, so the estimate and the thing it estimates are
       one glance apart */
    const st = posterior();
    if (st.n) {
      pl.abline({ v: st.mean, col: PICK, lwd: 2, lty: 2 });
      pl.rect(st.pick - 0.6, 0, st.pick + 0.6, 1, { col: null, border: PICK, lwd: 2 });
    }
    /* the ends say what the ends are, which a legend box would only cover up
       on a strip this shallow */
    pl.text(3, 0.5, "all vowel", { adj: 0, cex: 0.72, col: "#8a6d2f", font: 2 });
    pl.text(97, 0.5, "all consonant", { adj: 1, cex: 0.72, col: "#e8eef4", font: 2 });
    pl.clip(false);
  });
  $("#ex28-urnstrip", content).appendChild(urnCanvas);

  function render() {
    const n = Math.round(num("ex28_n"));
    let html = "";
    for (let black = 0; black <= n; black++) {
      let balls = "";
      for (let k = 0; k < n; k++) {
        balls += `<span class="urn-ball ${k < n - black ? "w" : "b"}"></span>`;
      }
      html += `<div class="urn"><div class="urn-balls">${balls}</div>
        <div class="urn-lab">${n - black}&nbsp;:&nbsp;${black}</div></div>`;
    }
    $("#ex28-urns", content).innerHTML = html;
    $("#ex28-note", content).textContent =
      `${bigmark(n + 1)} urns for ${bigmark(n)} balls — one for every proportion of white to black, ` +
      `from all white to all black.`;

    if (!lettersOn()) return;
    const st = posterior();
    const trueP = VC.total ? (VC.total - VC.vowels) / VC.total : 0;
    $("#ex28-say", content).innerHTML = `<div class="note-block">${st.n === 0
      ? `Nothing has been read, so by the principle of indifference (or rule of succession) every urn is as
         likely as every other and the distribution is flat. This reflects an assumption and is the result of
         ignorance. Later findings built on this flat distribution are only as good as their foundation.`
      : `<strong>${bigmark(st.cons)}</strong> consonants in <strong>${bigmark(st.n)}</strong> letters. The
         weight has a mean at <strong>${fmt(st.mean, 1)}</strong>, so the urns say this paper came from urn
         <strong style="color:${PICK};">${st.pick}</strong> &mdash; ringed below. The paper's own proportion
         is <strong>${fmt(trueP * 100, 1)}</strong> in a hundred. Read more and the pile narrows onto it.
         <p style="margin-bottom:0;margin-top:8px;">Which is all very well for a paper drawn from an urn.
         Nobody drew it. The urns were supposed at the outset, one for every proportion and each as likely as
         the next, and the answer is only ever as good as that supposition.</p>`}</div>`;
    drawCanvas(postCanvas);
    drawCanvas(urnCanvas);
  }

  vcOnMove(render);

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "ten") VC.head = Math.min(VC.total, VC.head + 10);
    else if (a === "hundred") VC.head = Math.min(VC.total, VC.head + 100);
    else if (a === "thousand") VC.head = Math.min(VC.total, VC.head + 1000);
    else if (a === "here") { const bl = vcBlockInView(); VC.head = bl ? bl.end : VC.head; }
    else if (a === "reset") VC.head = 0;
    else return;
    vcMoved();
  });

  /* v and c replace the paper's own letters, so this one does give them back
     on scrolling away, and takes them again when it comes back into view */
  syncEx28 = vcBindVisibility("example-ex28", "ex28", () => (lettersOn() ? "vc" : null), true);
  new MutationObserver(() => render())
    .observe(document.getElementById("example-ex28"), { attributes: true, attributeFilter: ["class"] });

  view();
  render();
});

/* ==========================================================================
   THE PAPER READ AS VOWELS AND CONSONANTS

   29 and 28 both want this article treated as a sequence of letters: 29 to put
   the rule of succession on the next one, 28 to ask which urn a text of this
   composition was drawn from. Shared machinery, since both need the same index
   and the same shading.

   Only the prose paragraphs are indexed — headings, the apparatus inside the
   examples, the granary table and the footnotes are not Peirce writing — and
   text inside a data-live span is skipped, because a driven value would change
   the letter count under us and put every later index out.

   Shading is done a block at a time as blocks come into view. Wrapping thirty
   thousand letters in spans on a click is not something the page would forgive,
   and the effect only has to exist where the eye is. A block is restored from
   its own snapshot when the mode goes off; the paper's own listeners are all
   delegated, so replacing a paragraph's innerHTML costs nothing but the live
   values, which are refreshed afterwards.
   ========================================================================*/
const VC = {
  built: false, blocks: [], total: 0, vowels: 0,
  letters: "", raw: "", pos: [],     // pos[i] = index into raw of the i-th letter
  head: 0, mode: null, io: null, users: new Map()
};

const isVowel = (ch) => "aeiouAEIOU".indexOf(ch) >= 0;
const isLetter = (ch) => /[A-Za-z]/.test(ch);

function vcTextNodes(el) {
  const out = [];
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && n.parentElement.closest("[data-live]"))
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  let n;
  while ((n = w.nextNode())) out.push(n);
  return out;
}

function vcBuild() {
  if (VC.built) return;
  const root = $(".article-container");
  if (!root) return;
  const paras = $$("p", root).filter((p) => !p.closest(".example-container")
    && !p.closest(".footnotes") && !p.closest(".granary-table"));
  const letters = [], raw = [], pos = [];
  paras.forEach((el) => {
    const start = letters.length;
    vcTextNodes(el).forEach((n) => {
      for (const ch of n.nodeValue) {
        raw.push(ch);
        if (isLetter(ch)) {
          pos.push(raw.length - 1);
          letters.push(ch);
          if (isVowel(ch)) VC.vowels++;
        }
      }
    });
    if (letters.length === start) return;      // nothing of Peirce's in it
    raw.push(" ");
    VC.blocks.push({ el: el, start: start, end: letters.length, wrapped: false, orig: undefined });
  });
  VC.letters = letters.join("");
  VC.raw = raw.join("");
  VC.pos = pos;
  VC.total = letters.length;
  VC.built = true;
}

/* one block's letters wrapped, each carrying its own index so the reading head
   can be drawn without touching anything else */
function vcWrap(b) {
  if (b.wrapped) return;
  if (b.orig === undefined) b.orig = b.el.innerHTML;
  let i = b.start;
  vcTextNodes(b.el).forEach((node) => {
    if (!/[A-Za-z]/.test(node.nodeValue)) return;
    const frag = document.createDocumentFragment();
    let buf = "";
    for (const ch of node.nodeValue) {
      if (isLetter(ch)) {
        if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ""; }
        const sp = document.createElement("span");
        sp.className = "vc " + (isVowel(ch) ? "vc-v" : "vc-c");
        sp.setAttribute("data-i", i);
        sp.textContent = VC.mode === "vc" ? (isVowel(ch) ? "v" : "c") : ch;
        frag.appendChild(sp);
        i++;
      } else buf += ch;
    }
    if (buf) frag.appendChild(document.createTextNode(buf));
    node.parentNode.replaceChild(frag, node);
  });
  b.wrapped = true;
  vcMarkBlock(b);
}

function vcUnwrap(b) {
  if (!b.wrapped) return;
  b.el.innerHTML = b.orig;
  b.wrapped = false;
}

/* Only blocks straddling the head need per-letter marking; whole blocks behind
   it get one class, so stepping stays cheap however far the reading has gone. */
function vcMarkBlock(b) {
  if (!b.wrapped) return;
  const spans = $$(".vc", b.el);
  if (VC.head >= b.end) {
    spans.forEach((sp) => { sp.classList.add("vc-seen"); sp.classList.remove("vc-head"); });
    return;
  }
  if (VC.head <= b.start) {
    spans.forEach((sp) => sp.classList.remove("vc-seen", "vc-head"));
    return;
  }
  spans.forEach((sp) => {
    const i = +sp.getAttribute("data-i");
    sp.classList.toggle("vc-seen", i < VC.head);
    sp.classList.toggle("vc-head", i === VC.head);
  });
}

function vcMarkAll() { VC.blocks.forEach(vcMarkBlock); }

function vcObserve() {
  if (VC.io) return;
  VC.io = new IntersectionObserver((entries) => {
    if (!VC.mode) return;
    entries.forEach((en) => {
      const b = VC.blocks.find((x) => x.el === en.target);
      if (b && en.isIntersecting) vcWrap(b);
    });
  }, { rootMargin: "300px 0px" });
}

/* Each example that wants the article's letters says which way it wants them.
   Replacing the letters outright is the stronger claim, so it wins while any
   example is asking for it; the last one to let go puts the article back as it
   was and gives the live spans a refresh. */
function vcSetMode(user, mode) {
  vcBuild();
  vcObserve();
  if (mode) VC.users.set(user, mode); else VC.users.delete(user);
  const wanted = Array.from(VC.users.values());
  const want = wanted.indexOf("vc") >= 0 ? "vc" : (wanted.length ? "shade" : null);
  if (!want) {
    VC.mode = null;
    VC.io.disconnect();
    VC.blocks.forEach(vcUnwrap);
    Object.keys(LIVE).forEach(refreshLive);
    return;
  }
  if (want !== VC.mode) {                     // switching between shade and v/c
    VC.blocks.forEach(vcUnwrap);
    VC.mode = want;
  }
  VC.blocks.forEach((b) => {
    const r = b.el.getBoundingClientRect();
    if (r.bottom > -300 && r.top < window.innerHeight + 300) vcWrap(b);
    VC.io.observe(b.el);
  });
}

/* the examples that share the reading tell each other when it moves */
const VC_LISTENERS = [];
function vcOnMove(fn) { VC_LISTENERS.push(fn); }
function vcMoved() { vcMarkAll(); VC_LISTENERS.forEach((f) => { try { f(); } catch (e) { /* */ } }); }

/* --------------------------------------------------------------------------
   Giving the article back.

   An example only gets to touch the paper's letters while it is actually there
   to be used. Shut is not the only way to stop using one: the inner header
   collapses the content without touching the container's class, so watching
   for `open` alone left the page in v and c with nothing on screen to explain
   it. Rewriting the paper behind the reader's back is worse than not doing it,
   so the test is: open, not collapsed, and — for the modes that replace the
   text outright — still on screen.

   ------------------------------------------------------------------------*/
function vcBindVisibility(hostId, user, modeFn, dropWhenOffScreen) {
  const host = document.getElementById(hostId);
  if (!host) return () => {};
  const showing = () => {
    if (!host.classList.contains("open")) return false;
    const inner = host.querySelector(".example-content");
    if (inner && inner.style.display === "none") return false;
    if (!dropWhenOffScreen) return true;
    const r = host.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };
  const sync = () => {
    const m = showing() ? modeFn() : null;
    vcSetMode(user, m);
  };
  new MutationObserver(sync).observe(host, { attributes: true, attributeFilter: ["class"] });
  if (dropWhenOffScreen) new IntersectionObserver(sync).observe(host);
  /* the collapsing header is a plain click with no attribute to watch */
  host.addEventListener("click", (ev) => {
    if (ev.target.closest(".example-header")) requestAnimationFrame(sync);
  });
  return sync;
}

/* the paragraph the reader is looking at, for "read up to here" */
function vcBlockInView() {
  const mid = window.innerHeight * 0.35;
  let best = null, bestD = Infinity;
  VC.blocks.forEach((b) => {
    const r = b.el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const d = Math.abs(r.top - mid);
    if (d < bestD) { bestD = d; best = b; }
  });
  return best;
}

/* ==========================================================================
   EXAMPLE 29 — the rule that answers before it has seen anything

   "But this solution betrays its origin if we apply it to the case in which the
    man has never seen the tide rise at all; that is, if we put m = 0. In this
    case, the probability that it will rise the next time comes out 1/2."

   The tide was a fair illustration but an invented one. This article is to
   hand, it has a definite proportion of consonants, and nobody knows it before
   looking. So: is the next letter a consonant? At m = 0 the rule answers a half
   without having read a letter, and the true proportion is nothing like a half.
   Read some and the same rule walks over to the truth — the objection is not
   that the rule is useless, it is that it answers when it has nothing to answer
   from.
   ========================================================================*/
registerExample("example-ex29", (box) => {
  box.appendChild(exHeader("Interactive Example: Is the Next Letter a Consonant?", "ex29-content"));
  const content = h(`<div id="ex29-content" class="example-content">
    <div class="ex-buttonbar">
      <button class="btn btn-primary" data-act="one">Read one letter</button>
      <button class="btn btn-primary" data-act="ten">Read ten</button>
      <button class="btn btn-primary" data-act="hundred">Read a hundred</button>
      <button class="btn btn-sm" data-act="here">Read up to the paragraph in view</button>
      <button class="btn btn-warning btn-sm" data-act="reset">Read nothing yet</button>
    </div>
    <div id="ex29-bar"></div>
    <div id="ex29-say"></div>
    <div id="ex29-read"></div>
  </div>`);
  box.appendChild(content);

  vcBuild();

  const trueP = VC.total ? (VC.total - VC.vowels) / VC.total : 0.5;

  function step(k) { VC.head = Math.min(VC.total, VC.head + k); }

  function seen() {
    const n = VC.head;
    let cons = 0;
    for (let i = 0; i < n; i++) if (!isVowel(VC.letters[i])) cons++;
    return { n: n, cons: cons };
  }

  /* the reading so far: the opening as Peirce set it, then the last stretch, so
     the panel shows both where the reading started and where it has got to */
  function readHTML() {
    if (!VC.head) return "";
    const end = VC.pos[VC.head - 1] + 1;
    const head = VC.raw.slice(0, Math.min(end, 150));
    const tail = end > 260 ? VC.raw.slice(Math.max(150, end - 90), end) : VC.raw.slice(150, end);
    const paint = (s) => s.replace(/[A-Za-z]/g, (ch) =>
      `<span class="vc ${isVowel(ch) ? "vc-v" : "vc-c"}">${ch}</span>`);
    return `<div class="vc-read">${paint(head)}${end > 260 ? " &hellip; " : ""}${paint(tail)}</div>`;
  }

  function render() {
    const st = seen();
    const rule = (st.cons + 1) / (st.n + 2);
    const obs = st.n ? st.cons / st.n : null;

    /* The rule's answer above the bar, the paper's own proportion below, and
       the fill is what has actually been counted. At the start the first is at
       a half, the second at 0.62 and the third is not there at all. */
    const mark = (p, col, lab, up) => `
      <div class="vc-mark" style="left:${p * 100}%;background:${col};"></div>
      <div class="vc-mark-lab" style="left:${p * 100}%;${up ? "top:-23px" : "bottom:-21px"};color:${col};">
        ${lab}</div>`;
    $("#ex29-bar", content).innerHTML = `
      <div class="vc-bar" style="margin-top:27px;">
        <div class="vc-bar-fill" style="width:${(obs === null ? 0 : obs) * 100}%;"></div>
        ${obs === null ? "" : `<div class="vc-mark-lab" style="left:${obs * 100}%;top:11px;
          transform:translateX(-100%);padding-right:7px;color:#234f72;font-weight:700;">
          ${fmt(obs, 3)} counted</div>`}
        ${mark(rule, "#4a7c59", `the rule says ${fmt(rule, 3)}`, true)}
        ${mark(trueP, "#b0563f", `the paper is ${fmt(trueP, 3)} consonant`, false)}
      </div>
      <div class="vc-scale" style="margin-top:23px;">
        <span style="left:0;transform:none;">0</span>
        <span style="left:50%;">&frac12;</span>
        <span style="right:0;left:auto;transform:none;">1</span></div>`;

    $("#ex29-say", content).innerHTML = `<div class="note-block">${st.n === 0
      ? `You have read no letters, so the rule of succession says: <strong>&frac12;</strong> &mdash;
         <span class="math">(0 + 1) / (0 + 2)</span>. It would answer the same of any question whatever. The
         paper is in fact <strong>${fmt(trueP, 3)}</strong> consonant.`
      : `<strong>${bigmark(st.cons)}</strong> consonants in <strong>${bigmark(st.n)}</strong> letters, an
         observed proportion of <strong>${fmt(obs, 4)}</strong>. The rule puts the next letter at
         <strong>${fmt(rule, 4)}</strong> &mdash; ${frac(`${bigmark(st.cons)} + 1`, `${bigmark(st.n)} + 2`)}
         &mdash; against the paper's own <strong>${fmt(trueP, 3)}</strong>. Read on and the two close up.
         Press <em>Read nothing yet</em> and it goes back to a half, having unlearned everything.`}</div>`;

    $("#ex29-read", content).innerHTML = readHTML();
  }

  vcOnMove(render);

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (a === "one") step(1);
    else if (a === "ten") step(10);
    else if (a === "hundred") step(100);
    else if (a === "here") { const bl = vcBlockInView(); VC.head = bl ? bl.end : VC.head; }
    else if (a === "reset") VC.head = 0;
    else return;
    vcMoved();
  });

  /* the article shows its letters only while this is open, not collapsed, and
     on screen; scrolling away gives them straight back */
  const syncEx29 = vcBindVisibility("example-ex29", "ex29", () => "shade", true);
  syncEx29();
  render();
});

/* ==========================================================================
   NEW EXAMPLE (30) — filling the urns from the granary

   "Suppose we had an immense granary filled with black and white balls well
    mixed up; and suppose each urn were filled by taking a fixed number of
    balls from this granary quite at random."

   The arrangement in 28 was stipulated: one urn for every proportion, exactly
   once. Here the same urns are filled at random out of a granary of a stated
   composition, and the point of sorting them at the end is that what comes out
   is not that tidy row but a lumpy distribution over it — which is what the
   table further down counts.

   The number of urns is shared with 28, and each urn holds one ball fewer than
   there are urns, so the two rows are directly comparable: 28 shows what the
   arrangement is supposed to be, this shows what drawing at random gives you.
   ========================================================================*/
registerExample("example-ex30", (box) => {
  box.appendChild(exHeader("Interactive Example: Filling the Urns from the Granary", "ex30-content"));
  const content = h(`<div id="ex30-content" class="example-content">
    <div class="row">
      <div class="col col-6" id="ex30-ctl-r"></div>
      <div class="col col-6" id="ex30-ctl-u"></div>
    </div>

    <div class="granary-bar" id="ex30-granary"></div>
    <p class="help-text" id="ex30-granary-note"></p>

    <div class="ex-buttonbar">
      <button class="btn btn-primary btn-sm" data-act="one">Put one ball in each urn</button>
      <button class="btn btn-primary btn-sm" data-act="fill">Fill the urns</button>
      <button class="btn btn-sm" data-act="sort">Sort them, whitest first</button>
      <button class="btn btn-warning btn-sm" data-act="empty">Empty them</button>
      <button class="btn btn-sm" data-act="peirce">Peirce&rsquo;s own case</button>
    </div>

    <div class="urn-row urn-row-tight" id="ex30-urns"></div>
    <p class="help-text" id="ex30-note"></p>
  </div>`);
  box.appendChild(content);

  $("#ex30-ctl-r", content).appendChild(
    slider("ex30_r", "White to black in the granary:", 1, 10, 2, 1, (v) => `1 : ${v}`, "k1"));
  $("#ex30-ctl-u", content).appendChild(
    slider("ex30_balls", "Balls in each urn:", 1, 6, 4, 1, null, "k2"));

  /* Peirce's own case is not a sample. He supposes the granary shared out
     exactly: one white to two black, four balls an urn, and every one of the
     3^4 = 81 ways it can fall occurring once. So in that mode the urns are
     dealt from a prepared pack rather than drawn at random, and the sorted row
     comes out at 1, 8, 24, 32, 16 — the table further down, exactly. */
  /* The granary is shared out exactly rather than sampled, so the number of
     urns is not free: with one white in r+1 and n balls to an urn it takes
     (r+1)^n of them to hold every way the balls can fall, once each. So the
     slider counts balls and the urns follow — 9, 27, 81 for two, three and
     four balls at one white in three. Past a point there are more urns than
     can be set out, and the panel says how many it would take. */
  const SHOWABLE = 130;
  let pack = null;

  const RATIO = () => Math.round(num("ex30_r"));
  const CAP = () => Math.round(num("ex30_balls"));
  const NURNS = () => Math.pow(1 + RATIO(), CAP());
  const tooMany = () => NURNS() > SHOWABLE;
  const pWhite = () => 1 / (1 + RATIO());

  /* Every way the balls can fall, each way once: count in base r+1 and call a
     ball white when its digit is the one white slot. Shuffled, so the row fills
     in no particular order. */
  function makePack() {
    const base = 1 + RATIO(), n = CAP(), total = Math.pow(base, n);
    const out = [];
    for (let i = 0; i < total; i++) {
      const u = [];
      let x = i;
      for (let k = 0; k < n; k++) { u.push(x % base === 0); x = Math.floor(x / base); }
      out.push(u);
    }
    return shuffle(out);
  }

  let urns = [];
  const reset = () => { urns = Array.from({ length: NURNS() }, () => []); };
  reset();

  /* The paragraph after this one states the granary's composition in words —
     "say one in three ... one-third ... two-thirds" — so it follows this
     slider, spelled the way Peirce spells it. */
  registerLive("example-ex30", {
    oneIn: () => `one in ${spellNumber(1 + RATIO())}`,
    white: () => fracWord(1, 1 + RATIO()),
    black: () => fracWord(RATIO(), 1 + RATIO())
  });

  content.addEventListener("input", (ev) => {
    if (ev.target.id === "ex30_balls" || ev.target.id === "ex30_r") { pack = null; reset(); }
    render();
  });

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const a = b.getAttribute("data-act");
    if (urns.length !== NURNS()) reset();
    if (a === "peirce") { setSlider("ex30_r", 2); setSlider("ex30_balls", 4); pack = null; reset(); render(); return; }
    if (tooMany()) return;
    if (!pack) pack = makePack();
    const ball = (i, k) => pack[i][k];
    if (a === "one") urns.forEach((u, i) => { if (u.length < CAP()) u.push(ball(i, u.length)); });
    else if (a === "fill") urns.forEach((u, i) => { while (u.length < CAP()) u.push(ball(i, u.length)); });
    else if (a === "sort") {
      /* The table lists its sets by number of blacks, and within a group with
         the whites leading — wwwb, wwbw, wbww, bwww. Sort the urns the same
         way, so the row and the table read in the same order. */
      // 0 for white, 1 for black: "w" sorts after "b", which is backwards
      const key = (u) => u.map((ball) => (ball ? "0" : "1")).join("");
      urns.sort((x, y) => (x.filter((v) => !v).length - y.filter((v) => !v).length)
        || (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));
    }
    else if (a === "empty") { pack = null; reset(); }
    render();
  });

  function render() {
    const cap = CAP(), w = pWhite();

    $("#ex30-granary", content).innerHTML =
      `<div class="granary-white" style="flex:${w};"></div>
       <div class="granary-black" style="flex:${1 - w};"></div>`;
    $("#ex30-granary-note", content).textContent =
      `The granary: ${fracWord(1, 1 + RATIO())} of the balls white, ` +
      `${fracWord(RATIO(), 1 + RATIO())} black, and no end of them.`;

    if (tooMany()) {
      $("#ex30-urns", content).innerHTML = "";
      const fits = Math.floor(Math.log(SHOWABLE) / Math.log(1 + RATIO()));
      $("#ex30-note", content).innerHTML = `<div class="note-block" style="margin-top:0;">
        Sharing the granary out exactly over <strong>${bigmark(cap)}</strong> balls an urn would take
        ${bigmark(1 + RATIO())}<sup>${bigmark(cap)}</sup> = <strong>${bigmark(NURNS())}</strong> urns
        &mdash; more than can be set out here. Come back to
        ${bigmark(fits)} ${fits === 1 ? "ball" : "balls"} or fewer.</div>`;
      return;
    }

    if (urns.length !== NURNS()) reset();

    $("#ex30-urns", content).innerHTML = urns.map((u) => {
      let balls = "";
      for (let k = 0; k < cap; k++) {
        balls += k < u.length
          ? `<span class="urn-ball ${u[k] ? "w" : "b"}"></span>`
          : `<span class="urn-ball empty"></span>`;
      }
      const nw = u.filter(Boolean).length;
      return `<div class="urn"><div class="urn-balls">${balls}</div>
        <div class="urn-lab">${u.length === cap ? `${nw}&nbsp;:&nbsp;${cap - nw}` : "&mdash;"}</div></div>`;
    }).join("");

    const done = urns.every((u) => u.length === cap);
    const drawn = urns.length ? urns[0].length : 0;
    $("#ex30-note", content).innerHTML = !done
      ? `${bigmark(drawn)} of ${bigmark(cap)} balls put in each of ${bigmark(urns.length)} urns.`
      : Array.from({ length: cap + 1 }, (_, k) =>
          `<strong>${bigmark(urns.filter((u) => u.filter(Boolean).length === cap - k).length)}</strong> ` +
          `with ${k === 0 ? "no b" : `${spellNumber(k)} b`}`).join(" &middot; ") +
        ` &mdash; ${bigmark(urns.length)} urns in all, the granary shared out exactly.`;
  }

  render();
});

/* ==========================================================================
   NEW EXAMPLE (31) — the balls already drawn tell you nothing

   "just the same proportion of urns has the third ball white among those which
    have the first two white-white, white-black, black-white, and black-black."

   Same eighty-one urns as 30's Peirce case. Choosing what the first two balls
   were keeps only the urns that agree, and the question is what proportion of
   those have a white third ball. The four groups are wildly different sizes —
   9, 18, 18, 36 — and every one of them is a third white, which is the whole
   of the argument.
   ========================================================================*/
registerExample("example-ex31", (box) => {
  box.appendChild(exHeader("Interactive Example: What the First Two Balls Tell You", "ex31-content"));
  const content = h(`<div id="ex31-content" class="example-content">
    <div class="ex-buttonbar">
      <button class="btn btn-primary btn-sm" data-act="draw">Draw two at random</button>
      <span class="ex27-lead">or set them:</span>
      <button class="btn btn-sm" data-first="ww">white, white</button>
      <button class="btn btn-sm" data-first="wb">white, black</button>
      <button class="btn btn-sm" data-first="bw">black, white</button>
      <button class="btn btn-sm" data-first="bb">black, black</button>
    </div>

    <div class="draw-row" id="ex31-drawn"></div>
    <div class="urn-row urn-row-tight" id="ex31-urns"></div>
    <div id="ex31-thirds"></div>
  </div>`);
  box.appendChild(content);

  /* one white slot in three, four balls to an urn, every way once — the same
     eighty-one urns the table counts */
  const PACK = (() => {
    const out = [];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++)
        out.push([a === 0, b === 0, c === 0, d === 0]);
    return out;
  })();

  const PATTERNS = [
    { k: "ww", a: true,  b: true,  lab: "white, white" },
    { k: "wb", a: true,  b: false, lab: "white, black" },
    { k: "bw", a: false, b: true,  lab: "black, white" },
    { k: "bb", a: false, b: false, lab: "black, black" }
  ];

  let first = "ww";
  const pat = () => PATTERNS.find((x) => x.k === first);
  const matches = (u) => u[0] === pat().a && u[1] === pat().b;
  const groupOf = (k) => {
    const q = PATTERNS.find((x) => x.k === k);
    const inGroup = PACK.filter((u) => u[0] === q.a && u[1] === q.b);
    return { n: inGroup.length, white: inGroup.filter((u) => u[2]).length };
  };

  content.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-first],[data-act]");
    if (!b) return;
    if (b.hasAttribute("data-first")) first = b.getAttribute("data-first");
    else {
      // a genuine draw: any of the eighty-one, and whatever its first two are
      const u = PACK[sampleInt(PACK.length)];
      first = (u[0] ? "w" : "b") + (u[1] ? "w" : "b");
    }
    render();
  });


  function render() {
    const q = pat(), g = groupOf(first);

    const slot = (cls, lab) =>
      `<div class="draw-slot"><div class="draw-ball ${cls}"></div><div class="draw-lab">${lab}</div></div>`;
    $("#ex31-drawn", content).innerHTML =
      slot(q.a ? "w" : "b", "first drawn") +
      slot(q.b ? "w" : "b", "second drawn") +
      slot("q", "third drawn");

    $("#ex31-urns", content).innerHTML = PACK.map((u) => {
      const on = matches(u);
      const balls = u.map((ball, k) =>
        `<span class="urn-ball ${ball ? "w" : "b"}${on && k === 2 ? " ringed" : ""}"></span>`).join("");
      return `<div class="urn${on ? "" : " dim"}"><div class="urn-balls">${balls}</div></div>`;
    }).join("");

    /* Every third ball still in play, gathered out of the urns above and set
       in a row: whites first, so what fraction of them there are can be seen
       rather than worked out. */
    const thirds = PACK.filter(matches).map((u) => u[2]).sort((x, y) => (y ? 1 : 0) - (x ? 1 : 0));
    $("#ex31-thirds", content).innerHTML = `
      <p class="help-text" style="text-align:center;margin-bottom:4px;">Every third ball still in play:</p>
      <div class="thirds-row">${thirds.map((w) =>
        `<span class="urn-ball ${w ? "w" : "b"}${w ? " ringed" : ""}"></span>`).join("")}</div>
      <p class="help-text" style="text-align:center;">
        <strong>${bigmark(g.white)}</strong> white of <strong>${bigmark(g.n)}</strong> &mdash;
        <strong>${fmt(g.white / g.n, 4)}</strong></p>`;

  }
  render();
});

</script>
