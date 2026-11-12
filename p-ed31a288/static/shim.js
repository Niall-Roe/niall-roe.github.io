(function () {
  "use strict";
  var FILES = ["/librarian", "/library", "/manuscripts/1", "/models", "/preferences", "/reading", "/session", "/setup/demo", "/setup/librarian", "/setup/loops", "/setup/showcase", "/setup/topics", "/webstate"];
  var HAVE = {};
  FILES.forEach(function (p) { HAVE[p] = true; });
  var ROOT = new URL("../", document.currentScript.src).href;
  var PX = window.PX_STATIC = {sent: [], missing: []};
  var realFetch = window.fetch.bind(window);
  var fileOf = function (p) { return ROOT + "api/v1" + p + ".json"; };
  function api(u) {
    var url;
    try { url = new URL(String(u), location.href); } catch (e) { return null; }
    if (url.origin !== location.origin) return null;
    var i = url.pathname.indexOf("/api/v1/");
    return i < 0 ? null : {path: url.pathname.slice(i + 7), q: url.searchParams};
  }
  function json(body, status) {
    return new Response(JSON.stringify(body), {status: status || 200, headers: {"Content-Type": "application/json"}});
  }
  var TOPICS = null;
  function figures(q) {
    TOPICS = TOPICS || realFetch(fileOf("/setup/topics")).then(function (r) { return r.json(); });
    return TOPICS.then(function (T) {
      var keys = {}, ms = {}, pubs = {};
      String(q.get("keys") || "").split(",").filter(Boolean).slice(0, 400).forEach(function (k) { keys[k] = true; });
      (T.topics || []).concat(T.sections || []).forEach(function (t) {
        if (!keys[t.key]) return;
        ((t.touches && t.touches.length) ? t.touches : t.ms || []).forEach(function (m) { ms[String(m)] = true; });
        (t.pubs || []).forEach(function (p) { pubs[String(p)] = true; });
      });
      (T.works || []).forEach(function (w) { if (keys["work:" + w.id]) (w.ms || []).forEach(function (m) { ms[String(m)] = true; }); });
      return json({manuscripts: Object.keys(ms).length, publications: Object.keys(pubs).length, yours: 0, held: 0, pages: 0, first: null, reason: ""});
    });
  }
  window.fetch = function (input, init) {
    var a = api(typeof input === "string" ? input : input && input.url);
    if (!a) return realFetch(input, init);
    var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    if (method !== "GET") { PX.sent.push(method + " " + a.path); return Promise.resolve(json({})); }
    if (a.path === "/setup/topics/figures") return figures(a.q);
    if (HAVE[a.path]) return realFetch(fileOf(a.path), {headers: {Accept: "application/json"}});
    PX.missing.push(a.path);
    return Promise.resolve(json({error: "Not in this copy."}, 404));
  };
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    var args = Array.prototype.slice.call(arguments), a = api(args[1]);
    if (a) args[1] = HAVE[a.path] ? fileOf(a.path) : ROOT + "static/none.json";
    return open.apply(this, args);
  };
  if (!/[?&]demo=1\b/.test(location.search)) {
    try { history.replaceState(null, "", location.pathname + "?demo=1" + location.hash); } catch (e) {   }
  }
})();
