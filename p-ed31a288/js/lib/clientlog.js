(function () {
  var MAX = 20, sent = 0, token = null;
  var KEEP = ["ms", "p", "stem", "line", "mode", "set", "tool"];
  var ORIGIN = location.origin;
  function screen() {
    var u = new URLSearchParams(location.search), out = [location.pathname.split("/").pop() || "index.html"];
    KEEP.forEach(function (k) { var v = u.get(k); if (v) out.push(k + "=" + v.slice(0, 40)); });
    return out.join(" ");
  }
  function local(s) { return String(s || "").split(ORIGIN).join(""); }
  function csrf() {
    if (!token) token = fetch("/api/v1/session").then(function (r) { return r.json(); }).then(function (s) { return s.csrf; });
    return token;
  }
  function send(o) {
    if (sent >= MAX) return;
    try { if (sessionStorage.getItem("pc_demo")) return; } catch (e) {   }
    sent++;
    o.screen = screen(); o.source = local(o.source); o.stack = local(o.stack).slice(0, 4000);
    o.message = String(o.message || "").slice(0, 2000);
    var body = JSON.stringify(o);
    function post(t) {
      return fetch("/api/v1/client-log", {method: "POST", body: body, keepalive: true,
        headers: {"Content-Type": "application/json", "X-CSRF-Token": t}});
    }
    csrf().then(post)
      .then(function (r) { if (r.status === 403) { token = null; return csrf().then(post); } })
      .catch(function () { token = null; });
  }
  function described(x) {
    if (x instanceof Error) return {message: (x.name || "Error") + ": " + x.message + (x.status ? " (status " + x.status + ")" : ""), stack: x.stack || ""};
    return {message: typeof x === "string" ? x : (function () { try { return JSON.stringify(x); } catch (e) { return String(x); } })(), stack: ""};
  }
  window.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t !== window && t.tagName) {
      var link = t.tagName === "LINK" && /stylesheet/.test(t.rel || "");
      if (t.tagName === "SCRIPT" || link) send({kind: "load", message: "did not load: " + t.tagName.toLowerCase(), source: t.src || t.href || ""});
      return;
    }
    var d = described(e.error || e.message);
    send({kind: "error", message: e.error ? d.message : String(e.message || "error"), source: e.filename || "",
      line: e.lineno || null, col: e.colno || null, stack: d.stack});
  }, true);
  window.addEventListener("unhandledrejection", function (e) {
    var d = described(e.reason);
    send({kind: "rejection", message: d.message, stack: d.stack});
  });
  window.pxLogError = function (where, err) {
    var d = described(err);
    send({kind: "caught", message: String(where || "") + ": " + d.message, stack: d.stack});
  };
})();
