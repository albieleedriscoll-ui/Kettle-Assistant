/* Kettle and Co chat widget.
   A restaurant adds ONE line to its website:

     <script src="https://YOUR-SITE.netlify.app/widget.js" data-venue="restaurant-id" async></script>

   That adds a chat button in the bottom-right corner. Clicking it opens the assistant.
   If the restaurant ID is wrong or the service is down, nothing is shown at all. */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script || window.__kcWidget) return;
  var venue = (script.getAttribute("data-venue") || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!venue) return;
  window.__kcWidget = true;

  var base = new URL(script.src, location.href).origin;
  var label = script.getAttribute("data-label") || "Ask us a question";
  var OPEN_KEY = "kc-open-" + venue;
  var panel = null, button = null, open = false;

  function css(accent) {
    return (
      ".kc-btn{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:8px;" +
      "font:600 15px/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#fff;background:" + accent + ";" +
      "border:0;border-radius:999px;padding:13px 18px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.22)}" +
      ".kc-btn:focus-visible{outline:3px solid #fff;outline-offset:2px;box-shadow:0 0 0 5px " + accent + "}" +
      ".kc-btn svg{width:18px;height:18px;flex:none}" +
      ".kc-panel{position:fixed;right:20px;bottom:84px;z-index:2147483001;width:380px;height:min(620px,calc(100vh - 110px));" +
      "background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.28);display:none}" +
      ".kc-panel.kc-open{display:block}" +
      ".kc-panel iframe{width:100%;height:100%;border:0;display:block}" +
      "@media (max-width:520px){.kc-panel{inset:0;width:auto;height:auto;border-radius:0;bottom:0;right:0}" +
      ".kc-btn.kc-hide{display:none}}"
    );
  }

  function setOpen(next) {
    open = next;
    if (open && !panel) {
      panel = document.createElement("div");
      panel.className = "kc-panel";
      var frame = document.createElement("iframe");
      frame.title = "Chat with us";
      frame.src = base + "/?venue=" + encodeURIComponent(venue) + "&embed=1";
      panel.appendChild(frame);
      document.body.appendChild(panel);
    }
    if (panel) panel.classList.toggle("kc-open", open);
    button.classList.toggle("kc-hide", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
    try { sessionStorage.setItem(OPEN_KEY, open ? "1" : ""); } catch (e) {}
  }

  function build(cfg) {
    var style = document.createElement("style");
    style.textContent = css(/^#[0-9a-f]{6}$/i.test(cfg.accent || "") ? cfg.accent : "#1C6A4F");
    document.head.appendChild(style);

    button = document.createElement("button");
    button.type = "button";
    button.className = "kc-btn";
    button.setAttribute("aria-expanded", "false");
    button.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
    var text = document.createElement("span");
    text.textContent = label;
    button.appendChild(text);
    button.addEventListener("click", function () { setOpen(!open); });
    document.body.appendChild(button);

    window.addEventListener("message", function (e) {
      if (e.origin === base && e.data && e.data.type === "kc-close") { setOpen(false); button.focus(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { setOpen(false); button.focus(); }
    });

    var wasOpen = false;
    try { wasOpen = sessionStorage.getItem(OPEN_KEY) === "1"; } catch (e) {}
    if (wasOpen) setOpen(true);
  }

  function ready(fn) {
    if (document.body) fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  fetch(base + "/venues/" + encodeURIComponent(venue) + ".json")
    .then(function (res) { if (!res.ok) throw new Error("no venue"); return res.json(); })
    .then(function (cfg) { ready(function () { build(cfg); }); })
    .catch(function () { window.__kcWidget = false; });
})();
