(function () {
  var MARK = "pc__kept", PRE = "ls:", SS, TOKEN = null, timer = 0;
  try { SS = window.sessionStorage; SS.getItem(MARK); } catch (e) { return; }
  function keys() {
    var out = [];
    for (var i = 0; i < SS.length; i++) { var k = SS.key(i); if (k && k.indexOf(PRE) === 0) out.push(k.slice(PRE.length)); }
    return out;
  }
  function later() { if (!timer) timer = setTimeout(send, 3000); }
  var store = {
    getItem: function (k) { return SS.getItem(PRE + k); },
    setItem: function (k, v) { SS.setItem(PRE + k, String(v)); later(); },
    removeItem: function (k) { SS.removeItem(PRE + k); later(); },
    clear: function () { keys().forEach(function (k) { SS.removeItem(PRE + k); }); later(); },
    key: function (i) { var k = keys(); return i >= 0 && i < k.length ? k[i] : null; },
    get length() { return keys().length; },
  };
  try {
    var old = window.localStorage;
    Object.defineProperty(window, "localStorage", { configurable: true, enumerable: true, get: function () { return store; } });
    if (window.localStorage !== store) return;
    try { if (old && old.length) old.clear(); } catch (e) {   }
  } catch (e) { return; }
  try {
    if (SS.getItem(MARK) === null) {
      var x = new XMLHttpRequest();
      x.open("GET", "/api/v1/webstate", false); x.setRequestHeader("Accept", "application/json"); x.send();
      if (x.status === 200) {
        var d = JSON.parse(x.responseText) || {};
        for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k) && SS.getItem(PRE + k) === null) SS.setItem(PRE + k, String(d[k]));
        SS.setItem(MARK, "1");
      }
    }
  } catch (e) {   }
  function demo() { try { return !!SS.getItem("pc_demo"); } catch (e) { return false; } }
  function token() {
    return TOKEN ? Promise.resolve(TOKEN) : fetch("/api/v1/session", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); }).then(function (j) { TOKEN = j.csrf; return TOKEN; });
  }
  function send(retry) {
    clearTimeout(timer); timer = 0;
    if (demo() || !window.fetch) return;
    var all = {};
    keys().forEach(function (k) { all[k] = SS.getItem(PRE + k); });
    var body = JSON.stringify(all);
    token().then(function (t) {
      return fetch("/api/v1/webstate", { method: "POST", keepalive: true, body: body,
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-Token": t } });
    }).then(function (r) { if (r.status === 403 && !retry) { TOKEN = null; send(true); } })
      .catch(function () {   });
  }
  token().catch(function () {   });
  addEventListener("pagehide", function () { if (timer) send(); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden" && timer) send(); });
})();
(function () {
  var KEY = "pc_theme", root = document.documentElement;
  var mq = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  function valid(t) { return t === "light" || t === "dark" ? t : null; }
  function cached() { try { return valid(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function keep(t) { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {   } }
  function apply(t) {
    t = valid(t);
    if (t) root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
    return t;
  }
  function changed() { window.dispatchEvent(new Event("pxtheme")); }
  function dark() { var a = root.getAttribute("data-theme"); return a ? a === "dark" : !!mq.matches; }
  apply(cached());
  try {
    var f = localStorage.getItem("pc_lbar_fold");
    if (f === "true" || (window.matchMedia && matchMedia("(max-width: 820px)").matches)) root.classList.add("lbf");
  } catch (e) {   }
  var T =window.PXTHEME = {
    set: function (t) { t = valid(t); keep(t); apply(t); changed(); },
    get: function () { return root.getAttribute("data-theme") || "system"; },
  };
  window.PXDARK = {
    get matches() { return dark(); },
    addEventListener: function (type, fn) { if (type === "change") window.addEventListener("pxtheme", fn); },
  };
  var onMac = function () { if (!root.hasAttribute("data-theme")) changed(); };
  if (mq.addEventListener) mq.addEventListener("change", onMac); else if (mq.addListener) mq.addListener(onMac);
  if (window.fetch) {
    fetch("/api/v1/preferences", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (p) {
        if (!p) return;
        var t = valid(p.theme);
        if (t !== cached() || t !== valid(root.getAttribute("data-theme"))) { keep(t); apply(t); changed(); }
      })
      .catch(function () {   });
  }
})();
