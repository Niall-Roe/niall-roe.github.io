/* Review overlay — injected by _status/serve.py, never assembled into a built page.
 *
 * Everything here lives in a shadow root inside a fixed-position host appended to
 * <body>, deliberately OUTSIDE the article. That matters: the page's scaffold uses
 * document-level delegated listeners that match on
 * `closest(".example-container[id]")` and `closest("[data-toggle]")`, so anything
 * rendered inside an example would re-run its live-number refresh on every keystroke
 * and could toggle the example shut on a click. Sitting outside the article means
 * those selectors return null for us and the scaffold ignores the overlay entirely.
 *
 * Markers are positioned against the page, not inserted into it, so nothing reflows
 * and the examples' canvas sizing is untouched.
 *
 * Writes go back through the server to the entry's own file: a suggestion is
 * appended to ### Suggestions, and anything under ### Awaiting approval can be
 * approved or rejected from here. The file's mtime is carried out and back, so if
 * another session wrote first you get told rather than clobbering it.
 */
(function () {
  "use strict";

  var slug = location.pathname.replace(/^\/+/, "").split("/")[0];
  if (!slug) return;

  var host = document.createElement("div");
  host.id = "review-overlay-host";
  host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483000";
  var root = host.attachShadow({ mode: "open" });
  root.innerHTML =
    '<style>' + CSS() + '</style>' +
    '<div id="markers"></div>' +
    '<aside id="panel" hidden><header><div><h2 id="p-title"></h2>' +
    '<div id="p-sub"></div></div>' +
    '<div class="nav"><button id="p-prev" title="Previous example">\u2039</button>' +
    '<button id="p-next" title="Next example">\u203a</button>' +
    '<button id="p-close" title="Close">\u00d7</button></div></header>' +
    '<div id="p-body"></div>' +
    '<div id="p-write">' +
    '  <div id="p-approve" hidden>' +
    '    <p class="hint">Built this pass, waiting on your sign-off. Approve moves the' +
    ' write-up above to Completed; Reject sends it back to Suggestions with your reason.</p>' +
    '    <div class="row">' +
    '      <button id="b-approve" class="act ok">Approve</button>' +
    '      <button id="b-reject" class="act no">Reject</button>' +
    '    </div>' +
    '    <div id="p-reject" hidden>' +
    '      <textarea id="p-why" rows="2" placeholder="What was wrong? This goes back into Suggestions."></textarea>' +
    '      <div class="row"><button id="b-reject-go" class="act no">Send back</button>' +
    '      <button id="b-reject-cancel" class="act">Cancel</button></div>' +
    '    </div>' +
    '  </div>' +
    '  <textarea id="p-note" rows="3" placeholder="Leave a suggestion on this example…"></textarea>' +
    '  <div class="row"><button id="b-save" class="act">Save note</button>' +
    '  <span id="p-msg"></span></div>' +
    '</div>' +
    '<footer><span id="p-file"></span></footer></aside>' +
    '<div id="badges">' +
    '  <a id="badge-home" href="/_status/index.html" title="Back to the dashboard">← All papers</a>' +
    '  <div id="badge">Review</div>' +
    '</div>';
  document.body.appendChild(host);

  var markersEl = root.getElementById("markers");
  var panel = root.getElementById("panel");
  var entries = {};
  var anchors = [];
  var BY_KEY = {};
  var ORDER = [];        // entry keys in reading order, for the prev/next arrows

  root.getElementById("p-close").addEventListener("click", closePanel);
  root.getElementById("p-prev").addEventListener("click", function () { step(-1); });
  root.getElementById("p-next").addEventListener("click", function () { step(1); });

  /* Walk the entries in reading order. Only markers that were actually placed are
     in ORDER, so this never lands on an entry with nothing to show. */
  function step(dir) {
    if (!ORDER.length) return;
    var i = ORDER.indexOf(CURRENT);
    var next = i < 0 ? (dir > 0 ? 0 : ORDER.length - 1)
                     : (i + dir + ORDER.length) % ORDER.length;
    openPanel(ORDER[next]);
  }
  root.getElementById("badge").addEventListener("click", function () {
    host.classList.toggle("hidden");
  });

  fetch("/_review/notes/" + encodeURIComponent(slug))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      entries = data.entries || {};
      build();
      place();
      updateBadge();
      // Arriving from the dashboard's "Waiting on you" queue: the hash names the
      // example's container, so open the panel straight onto it.
      var target = decodeURIComponent(location.hash.replace(/^#/, ""));
      if (target && entries[target]) {
        setTimeout(function () { openPanel(target); }, 150);
      }
    })
    .catch(function (e) { console.warn("[review] could not load notes:", e); });

  /* The badge says how many entries are waiting on a sign-off, so a page tells
     you on arrival whether there is anything here for you. */
  function updateBadge() {
    var n = Object.keys(entries).filter(function (k) {
      return entries[k].status === "awaiting";
    }).length;
    root.getElementById("badge").textContent = n ? "Review · " + n + " waiting" : "Review";
  }


  /* ------------------------------------------------- locating anchor text */

  /* Entries for examples that are not built yet have no container to hang on, but
     nearly all of them quote the passage they belong to. Anchoring by that quote is
     what makes the overlay reach the specs as well as the finished examples — most
     of the notes, on two of the three papers.

     The article's sentences carry markup inside them (.live spans, <em>, footnote
     refs), so a quote never sits in a single text node. This walks the text nodes
     once, building a normalised string plus a map back from each character to its
     node and offset, which lets a plain indexOf become a DOM Range. */

  var IDX = null;

  function foldChar(c) {
    return { "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
             "\u2013": "-", "\u2014": "-", "\u2011": "-", "\u00a0": " " }[c] || c;
  }

  function textIndex() {
    if (IDX) return IDX;
    var article = document.querySelector(".article-container") || document.body;
    var walk = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        // Skip anything inside an example: the anchor is in Peirce's prose, and
        // example content changes as controls move.
        if (n.parentElement && n.parentElement.closest(".example-container")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var text = "", map = [], space = true, n;
    while ((n = walk.nextNode())) {
      var v = n.nodeValue;
      for (var i = 0; i < v.length; i++) {
        var c = foldChar(v[i]);
        if (/\s/.test(c)) {
          if (space) continue;
          space = true;
        } else {
          space = false;
        }
        text += space ? " " : c;
        map.push([n, i]);
      }
    }
    IDX = { text: text, map: map };
    return IDX;
  }

  function rangeFor(anchor) {
    if (!anchor) return null;
    var idx = textIndex();
    var q = anchor.replace(/[\u2018\u2019\u201c\u201d\u2013\u2014\u2011\u00a0]/g, foldChar)
                  .replace(/\s+/g, " ").trim();
    var at = -1, used = q;
    // Longest prefix that is actually present — notes quotes are often elided.
    var lens = [q.length, 160, 120, 90, 60, 40, 30];
    for (var i = 0; i < lens.length; i++) {
      var frag = q.slice(0, lens[i]).replace(/[\s.\u2026]+$/, "");
      if (frag.length < 25) break;
      at = idx.text.indexOf(frag);
      if (at > -1) { used = frag; break; }
    }
    if (at < 0) return null;
    var a = idx.map[at], b = idx.map[Math.min(at + used.length - 1, idx.map.length - 1)];
    if (!a || !b) return null;
    try {
      var r = document.createRange();
      r.setStart(a[0], a[1]);
      r.setEnd(b[0], b[1] + 1);
      return r;
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------------------- markers */

  function build() {
    Object.keys(entries).forEach(function (key) {
      var e = entries[key];
      var cid = e.container;
      var container = cid && document.getElementById(cid);

      // Candidates in order of preference: the margin numeral the scaffold already
      // puts in the gutter, then the trigger, then the container. Which one is used
      // is decided at placement, because .ex-num is display:none under 720px and so
      // reports a zero rect rather than being absent.
      var trigger = cid && document.querySelector('[data-toggle="' + cid + '"]');
      var cands = [trigger && trigger.querySelector(".ex-num"), trigger, container]
        .filter(Boolean);

      // Not built yet: fall back to the passage the entry quotes.
      var range = null;
      if (!cands.length) {
        range = rangeFor(e.anchor);
        if (!range) return;                    // nothing to hang on; skip silently
      }

      var m = document.createElement("button");
      m.className = "marker s-" + e.status;
      m.textContent = e.number == null ? "·" : e.number;
      m.title = (e.number != null ? e.number + ". " : "") + e.title +
                " — " + e.statusLabel;
      if (!container) m.classList.add("unbuilt");
      m.addEventListener("click", function (ev) {
        ev.stopPropagation();
        openPanel(key);
      });
      markersEl.appendChild(m);
      var rec = { el: m, cands: cands, range: range };
      anchors.push(rec);
      BY_KEY[key] = rec;
      ORDER.push(key);
    });
  }

  function rectOf(cands) {
    for (var i = 0; i < cands.length; i++) {
      var r = cands[i].getBoundingClientRect();
      if (r.width + r.height > 0) return r;
    }
    return null;
  }

  function place() {
    anchors.forEach(function (a) {
      var r = a.range ? a.range.getBoundingClientRect() : rectOf(a.cands);
      var visible = !!r && r.bottom > -40 && r.top < innerHeight + 40;
      a.el.style.display = visible ? "block" : "none";
      if (!visible) return;
      a.el.style.top = Math.round(r.top + r.height / 2 - 9) + "px";
      // Just outside the numeral, in the page margin — never over the text.
      a.el.style.left = Math.max(4, Math.round(r.left - 30)) + "px";
    });
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; place(); });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  // Examples change height when they open, which moves everything below them.
  new MutationObserver(onScroll).observe(document.body,
    { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });

  /* ------------------------------------------------------------------ panel */

  function openPanel(key, quiet) {
    var e = entries[key];
    if (!e) return;
    CURRENT = key;
    root.getElementById("p-approve").hidden = e.status !== "awaiting";
    if (!quiet) {
      msg("");
      root.getElementById("p-note").value = "";
      root.getElementById("p-reject").hidden = true;
      root.getElementById("p-why").value = "";
    }
    root.getElementById("p-title").textContent =
      (e.number != null ? e.number + ". " : "") + e.title;
    root.getElementById("p-sub").innerHTML =
      '<span class="chip s-' + e.status + '">' + esc(e.statusLabel) + "</span>";
    root.getElementById("p-file").textContent = e.file || "";

    var body = root.getElementById("p-body");
    body.innerHTML = "";
    if (!e.sections.length) {
      body.innerHTML = '<p class="empty">No notes written for this example yet.</p>';
    }
    e.sections.forEach(function (s) {
      var d = document.createElement("div");
      d.className = "sec";
      d.innerHTML = para(s.text);
      // Completed write-ups are history and often long; fold them away so the
      // panel leads with what is live — suggestions and anything awaiting.
      if (s.title === "Completed" || s.title === "Built") {
        var det = document.createElement("details");
        det.className = "hist";
        var sum = document.createElement("summary");
        sum.textContent = s.title;
        det.appendChild(sum);
        det.appendChild(d);
        body.appendChild(det);
      } else {
        var h = document.createElement("h3");
        h.textContent = s.title || "Notes";
        body.appendChild(h);
        body.appendChild(d);
      }
    });

    panel.hidden = false;
    shiftArticle(true);
    if (quiet) return;

    // Bring the passage into view whether it is a built example or only a quote.
    var target = e.container && document.getElementById(e.container);
    if (target) {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      var rec = BY_KEY[key];
      if (rec && rec.range) {
        // Let the browser do the scrolling: which element actually scrolls varies,
        // and computing an offset against window assumes it is the document.
        var host2 = rec.range.startContainer;
        host2 = host2.nodeType === 1 ? host2 : host2.parentElement;
        if (host2) host2.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(function () { place(); flash(rec.range); }, 420);
      }
    }
  }

  /* A passage with no example yet has nothing to open, so say which sentence the
     entry is about by lighting it briefly. Drawn in the overlay, not the article,
     so the page's own DOM is still never touched. */
  function flash(range) {
    var rects = range.getClientRects();
    for (var i = 0; i < rects.length; i++) {
      var b = document.createElement("div");
      b.className = "flash";
      b.style.cssText = "top:" + rects[i].top + "px;left:" + rects[i].left +
        "px;width:" + rects[i].width + "px;height:" + rects[i].height + "px";
      markersEl.appendChild(b);
      (function (el) { setTimeout(function () { el.remove(); }, 1600); })(b);
    }
  }

  /* ------------------------------------------------------------------ writing */

  var CURRENT = null;

  function msg(text, kind) {
    var el = root.getElementById("p-msg");
    el.textContent = text || "";
    el.className = kind || "";
  }

  function post(action, payload, done) {
    var e = CURRENT && entries[CURRENT];
    if (!e || !e.file) return msg("this entry has no file", "bad");
    payload.file = e.file;
    payload.mtime = e.mtime;
    msg("saving…");
    fetch("/_review/" + action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      if (!res.ok) {
        if (res.j.conflict) {
          // Another session wrote first. Pull what is now on disk so the retry
          // works, rather than telling the reviewer to reload the page.
          refreshEntry();
          msg("changed elsewhere — refreshed, try again", "bad");
        } else {
          msg(res.j.error || "failed", "bad");
        }
        return;
      }
      e.mtime = res.j.mtime;
      msg("saved", "good");
      done && done();
    }).catch(function () { msg("could not reach the review server", "bad"); });
  }

  root.getElementById("b-save").addEventListener("click", function () {
    var box = root.getElementById("p-note");
    var text = box.value.trim();
    if (!text) return msg("nothing to save", "bad");
    post("note", { text: text }, function () {
      box.value = "";
      refreshEntry();
    });
  });

  root.getElementById("b-approve").addEventListener("click", function () {
    post("approve", {}, function () { setStatus("done"); refreshEntry(); });
  });

  root.getElementById("b-reject").addEventListener("click", function () {
    var box = root.getElementById("p-reject");
    box.hidden = !box.hidden;
    if (!box.hidden) root.getElementById("p-why").focus();
  });

  root.getElementById("b-reject-cancel").addEventListener("click", function () {
    root.getElementById("p-reject").hidden = true;
  });

  root.getElementById("b-reject-go").addEventListener("click", function () {
    var why = root.getElementById("p-why").value.trim();
    post("reject", { reason: why }, function () {
      root.getElementById("p-why").value = "";
      root.getElementById("p-reject").hidden = true;
      setStatus("building");
      refreshEntry();
    });
  });

  function setStatus(st) {
    var e = entries[CURRENT];
    if (!e) return;
    e.status = st;
    var rec = BY_KEY[CURRENT];
    if (rec) {
      rec.el.className = rec.el.className.replace(/s-[a-z]+/, "s-" + st);
    }
  }

  /* Re-read this paper's entries so the panel and the markers show what is now on
     disk, rather than what was there when the page loaded. Saving a note can change
     an entry's status (done goes back to building), so every marker's colour is
     re-read too, not just the open panel. */
  function refreshEntry() {
    fetch("/_review/notes/" + encodeURIComponent(slug))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        entries = d.entries || entries;
        Object.keys(BY_KEY).forEach(function (k) {
          if (entries[k]) {
            BY_KEY[k].el.className =
              BY_KEY[k].el.className.replace(/s-[a-z]+/, "s-" + entries[k].status);
          }
        });
        if (CURRENT && entries[CURRENT]) openPanel(CURRENT, true);
      });
  }

  /* The panel is 420px against a right margin of about 150, so it would sit over
     the last few words of every line. Rather than cover the text, slide the article
     left by however much is actually being overlapped.

     A transform, not a margin: the column keeps its width, so nothing reflows and
     the examples' canvases — which size themselves from clientWidth — are left
     alone. getBoundingClientRect reports transformed positions, so the markers
     follow without any special handling. */
  var SHIFT = 0;
  var SCALE = 1;
  var NATURAL = null;      // the article's untransformed geometry

  /* Measure with the transform off. Deriving the natural position as
     "current rect + SHIFT" looks equivalent but is not: while the slide is still
     animating the rect does not yet reflect SHIFT, so the next measurement reads
     as a fresh overlap and the article walks further left each time. */
  function naturalRect(a) {
    var t = a.style.transform, tr = a.style.transition;
    a.style.transition = "none";
    a.style.transform = "";
    var r = a.getBoundingClientRect();
    NATURAL = { left: r.left, right: r.right };
    a.style.transform = t;
    a.style.transition = tr;
    return NATURAL;
  }

  function shiftArticle(on) {
    var a = document.querySelector(".article-container");
    if (!a) return;

    var want = 0, scale = 1;
    if (on) {
      var nat = naturalRect(a);
      // Never slide so far that the margin markers run off the left edge.
      var maxShift = Math.max(0, nat.left - 50);
      // The panel and the paper must not overlap. Three concessions, in order:
      // the article slides left as far as it may; the panel gives up width, down
      // to a readable floor; and if the window still cannot hold both, the
      // article scales down. Scale is a transform like the slide, so nothing
      // reflows and the examples' canvases are untouched.
      var avail = innerWidth - (nat.right - maxShift) - 24;   // 24px of daylight
      var w = Math.max(240, Math.min(420, avail));
      panel.style.width = "min(" + w + "px, 92vw)";
      var panelLeft = innerWidth - Math.min(w, innerWidth * 0.92);
      var room = panelLeft - 24 - 50;
      scale = Math.max(0.5, Math.min(1, room / (nat.right - nat.left)));
      if (scale < 1) {
        want = maxShift;                       // park at the left margin
      } else {
        var overlap = nat.right - (panelLeft - 24);
        want = Math.max(0, Math.min(overlap, maxShift));
      }
    } else {
      panel.style.width = "";
    }
    if (Math.abs(want - SHIFT) < 1 && Math.abs(scale - SCALE) < 0.005) return;
    SHIFT = want;
    SCALE = scale;

    var css = (SHIFT || SCALE < 1)
      ? "translateX(" + -SHIFT + "px)" + (SCALE < 1 ? " scale(" + SCALE + ")" : "")
      : "";
    a.style.transformOrigin = "0 0";
    a.style.transition = "transform .25s ease";
    a.style.transform = css;

    var until = Date.now() + 320;
    (function follow() {
      place();
      if (Date.now() < until) requestAnimationFrame(follow);
    })();

    // The slide is decoration; the shift is not. Some embedded viewers freeze the
    // animation clock, which leaves the transition parked at its starting value and
    // the article still under the panel. Check that it actually moved, and if not,
    // put it where it belongs without one.
    setTimeout(function () {
      var gotX = 0, gotK = 1;
      try {
        var m = new DOMMatrixReadOnly(getComputedStyle(a).transform);
        gotX = m.m41; gotK = m.m11;
      } catch (e) {}
      if (Math.abs(gotX - -SHIFT) > 1 || Math.abs(gotK - SCALE) > 0.005) {
        a.style.transition = "none";
        a.style.transform = css;
        place();
      }
    }, 340);
  }

  // The column re-centres when the window changes, so the measurement is stale.
  addEventListener("resize", function () {
    NATURAL = null;
    if (!panel.hidden) { SHIFT = 0; SCALE = 1; shiftArticle(true); }
  });

  function closePanel() {
    panel.hidden = true;
    CURRENT = null;
    shiftArticle(false);
  }
  addEventListener("keydown", function (e) {
    if (panel.hidden) return;
    if (e.key === "Escape") return closePanel();
    // Left and right walk the examples — but never while typing in a field.
    var t = e.composedPath ? e.composedPath()[0] : e.target;
    if (t && /^(TEXTAREA|INPUT|SELECT)$/.test(t.tagName)) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });

  /* ------------------------------------------------------------------ utils */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function para(text) {
    return esc(text).split(/\n\s*\n/).map(function (p) {
      p = p.trim();
      if (!p) return "";
      // The author's own square-bracket marks, kept visible as they are in the file.
      p = p.replace(/\[([^\[\]]{1,300})\]/g, '<mark>[$1]</mark>');
      if (/^####\s/.test(p)) return "<h4>" + p.replace(/^####\s*/, "") + "</h4>";
      if (/^["“]/.test(p)) return "<blockquote>" + p + "</blockquote>";
      return "<p>" + p.replace(/\n/g, " ") + "</p>";
    }).join("");
  }

  function CSS() {
    return [
      ":host{all:initial}",
      "*{box-sizing:border-box;font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif}",
      ".hidden #markers,.hidden #panel{display:none}",
      "#markers{position:absolute;inset:0}",
      ".marker{position:absolute;width:18px;height:18px;border-radius:3px;border:0;",
      "  padding:0;cursor:pointer;pointer-events:auto;color:#fff;font-size:10px;",
      "  line-height:18px;text-align:center;opacity:.55;transition:opacity .12s,transform .12s;",
      "  font-family:ui-monospace,SFMono-Regular,Menlo,monospace}",
      ".marker:hover{opacity:1;transform:scale(1.15)}",
      // An entry with no example built yet reads as an outline, not a solid chip.
      ".marker.unbuilt{background:transparent!important;box-shadow:inset 0 0 0 1.5px currentColor}",
      ".marker.unbuilt.s-early{color:#8fa3b8}.marker.unbuilt.s-blank{color:#cdc7bb}",
      ".marker.unbuilt.s-building{color:#b8873f}.marker.unbuilt.s-awaiting{color:#c98a2e}",
      ".marker.unbuilt.s-done{color:#6b8f5e}.marker.unbuilt.s-parked{color:#a89a8c}",
      ".s-done{background:#6b8f5e}.s-awaiting{background:#c98a2e}",
      // What awaits sign-off is the reviewer's business: those markers get a halo
      // and full strength, so they read at a glance against the building ones.
      ".marker.s-awaiting{opacity:.95;box-shadow:0 0 0 3px rgba(201,138,46,.30)}",
      ".s-building{background:#b8873f}.s-early{background:#8fa3b8}",
      ".s-blank{background:#cdc7bb}.s-parked{background:#a89a8c}",
      // display:flex would otherwise override the hidden attribute's display:none,
      // leaving an empty panel parked over the article from page load.
      "#panel[hidden]{display:none}",
      "#panel{position:absolute;top:0;right:0;width:min(420px,92vw);height:100%;",
      "  background:#fff;border-left:1px solid #dbd6cb;box-shadow:-6px 0 24px rgba(0,0,0,.10);",
      "  pointer-events:auto;display:flex;flex-direction:column;color:#1f2328}",
      "#panel header{display:flex;justify-content:space-between;align-items:flex-start;",
      "  gap:12px;padding:18px 20px 12px;border-bottom:1px solid #ece8df}",
      "#p-title{margin:0 0 6px;font-size:17px;font-weight:600;line-height:1.3}",
      ".nav{display:flex;align-items:center;gap:2px;flex:none}",
      ".nav button{border:0;background:none;line-height:1;cursor:pointer;color:#8a9099;",
      "  padding:2px 6px;font-family:inherit}",
      ".nav button:hover{color:#1f2328}",
      "#p-prev,#p-next{font-size:22px}",
      "#p-close{font-size:24px;margin-left:4px}",
      ".chip{display:inline-block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;",
      "  padding:3px 8px;border-radius:99px;color:#fff}",
      "#p-body{overflow-y:auto;padding:4px 20px 20px;flex:1;font-size:14px;line-height:1.55;color:#575d66}",
      "#p-body h3{font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#8a9099;",
      "  margin:20px 0 6px;font-weight:600}",
      "#p-body h4{font-size:13.5px;color:#1f2328;margin:14px 0 4px}",
      "#p-body p{margin:0 0 10px}",
      "#p-body blockquote{margin:8px 0 12px;padding:4px 0 4px 14px;border-left:2px solid #dbd6cb;",
      "  color:#1f2328;font-style:italic}",
      "#p-body mark{background:#fbf0d4;color:#6b4c12;padding:1px 3px;border-radius:2px}",
      "#p-body .empty{color:#8a9099;font-style:italic}",
      "#p-body details.hist{margin:20px 0 6px}",
      "#p-body details.hist summary{cursor:pointer;font-size:10px;letter-spacing:.09em;",
      "  text-transform:uppercase;color:#8a9099;font-weight:600}",
      "#p-body details.hist[open] summary{margin-bottom:6px}",
      "#p-reject{margin-top:10px}",
      "#p-reject textarea{width:100%;font:inherit;font-size:13px;padding:8px 10px;",
      "  border:1px solid #b0563f;border-radius:4px;resize:vertical;background:#fff;color:#1f2328}",
      "#p-write{padding:12px 20px;border-top:1px solid #ece8df;background:#faf8f4}",
      "#p-write textarea{width:100%;font:inherit;font-size:13px;padding:8px 10px;",
      "  border:1px solid #dbd6cb;border-radius:4px;resize:vertical;background:#fff;color:#1f2328}",
      "#p-write textarea:focus{outline:none;border-color:#8a9099}",
      "#p-write .row{display:flex;align-items:center;gap:10px;margin-top:8px}",
      "#p-approve{margin-bottom:10px}",
      "#p-approve .hint{font-size:12px;line-height:1.45;color:#8a9099;margin:0}",
      "#p-approve .row{margin-top:6px;gap:8px}",
      ".act{font:inherit;font-size:12.5px;padding:5px 12px;border:1px solid #dbd6cb;",
      "  border-radius:4px;background:#fff;color:#575d66;cursor:pointer}",
      ".act:hover{border-color:#8a9099;color:#1f2328}",
      ".act.ok{border-color:#6b8f5e;color:#4a6b45}",
      ".act.ok:hover{background:#6b8f5e;color:#fff}",
      ".act.no{border-color:#b0563f;color:#8f3a25}",
      ".act.no:hover{background:#b0563f;color:#fff}",
      "#p-msg{font-size:12px;color:#8a9099}",
      "#p-msg.good{color:#4a6b45}#p-msg.bad{color:#8f3a25}",
      "#panel footer{padding:10px 20px;border-top:1px solid #ece8df;font-size:11px;",
      "  color:#8a9099;font-family:ui-monospace,monospace;overflow:hidden;text-overflow:ellipsis}",
      "#badges{position:absolute;left:12px;bottom:12px;display:flex;gap:8px;pointer-events:auto}",
      "#badge,#badge-home{cursor:pointer;background:#1f2328;color:#fff;font-size:11px;",
      "  letter-spacing:.07em;text-transform:uppercase;padding:6px 12px;border-radius:99px;",
      "  opacity:.75;text-decoration:none}",
      "#badge:hover,#badge-home:hover{opacity:1}",
      ".flash{position:absolute;background:#fbf0d4;mix-blend-mode:multiply;",
      "  border-radius:2px;pointer-events:none;animation:fade 1.6s ease-out forwards}",
      "@keyframes fade{0%{opacity:0}12%{opacity:1}70%{opacity:1}100%{opacity:0}}",
      "@media(max-width:720px){.marker{display:none!important}}"
    ].join("");
  }
})();
