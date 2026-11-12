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
  var SMALL = "(max-width:520px)";
  var panel = null, button = null, open = false, scrollWas = null;

  function css(accent) {
    return (
      ".kc-btn{position:fixed;right:20px;bottom:20px;right:max(20px,env(safe-area-inset-right));" +
      "bottom:max(20px,env(safe-area-inset-bottom));z-index:2147483000;display:flex;align-items:center;justify-content:center;" +
      "gap:9px;height:52px;min-width:52px;margin:0;padding:0 20px 0 16px;font:600 15px/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
      "letter-spacing:0;text-transform:none;color:#fff;background:" + accent + ";border:0;border-radius:999px;cursor:pointer;" +
      "-webkit-tap-highlight-color:transparent;box-shadow:0 1px 2px rgba(0,0,0,.2),0 8px 24px rgba(0,0,0,.2);" +
      "opacity:0;transform:translateY(8px);transition:opacity .25s ease,transform .25s ease,box-shadow .15s ease}" +
      ".kc-btn.kc-ready{opacity:1;transform:none}" +
      ".kc-btn.kc-ready:hover{transform:translateY(-2px);box-shadow:0 1px 2px rgba(0,0,0,.2),0 12px 30px rgba(0,0,0,.26)}" +
      ".kc-btn:focus-visible{outline:3px solid #fff;outline-offset:2px;box-shadow:0 0 0 6px " + accent + "}" +
      ".kc-btn svg{width:22px;height:22px;flex:none;display:block}" +
      ".kc-btn .kc-x{display:none}" +
      ".kc-btn.kc-on{padding:0}" +
      ".kc-btn.kc-on .kc-chat,.kc-btn.kc-on .kc-label{display:none}" +
      ".kc-btn.kc-on .kc-x{display:block}" +
      ".kc-panel{position:fixed;right:20px;bottom:86px;z-index:2147483001;width:384px;max-width:calc(100vw - 40px);" +
      "height:min(640px,calc(100vh - 110px));background:#fff;border-radius:20px;overflow:hidden;" +
      "box-shadow:0 0 0 1px rgba(0,0,0,.06),0 16px 48px rgba(0,0,0,.24);opacity:0;visibility:hidden;pointer-events:none;" +
      "transform:translateY(12px) scale(.98);transform-origin:bottom right;" +
      "transition:opacity .18s ease,transform .18s ease,visibility 0s linear .18s}" +
      ".kc-panel.kc-open{opacity:1;visibility:visible;pointer-events:auto;transform:none;" +
      "transition:opacity .18s ease,transform .18s ease}" +
      ".kc-panel iframe{width:100%;height:100%;border:0;display:block;background:#fff}" +
      "@media " + SMALL + "{.kc-panel{top:0;right:0;bottom:0;left:0;width:auto;max-width:none;height:auto;border-radius:0;" +
      "box-shadow:none;transform:translateY(16px)}.kc-btn.kc-on{display:none}}" +
      "@media (prefers-reduced-motion:reduce){.kc-btn,.kc-panel,.kc-panel.kc-open{transition:none}}"
    );
  }

  // On a phone the chat fills the screen, so the page behind it is stopped from scrolling while it is open.
  function holdPage(on) {
    var root = document.documentElement;
    if (on && window.matchMedia(SMALL).matches) {
      if (scrollWas === null) { scrollWas = root.style.overflow; root.style.overflow = "hidden"; }
    } else if (scrollWas !== null) {
      root.style.overflow = scrollWas;
      scrollWas = null;
    }
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
      panel.offsetWidth; // lets the opening animation run the first time
    }
    if (panel) panel.classList.toggle("kc-open", open);
    button.classList.toggle("kc-on", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.setAttribute("aria-label", open ? "Close chat" : label);
    holdPage(open);
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
    button.setAttribute("aria-label", label);
    button.innerHTML =
      '<svg class="kc-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>' +
      '<svg class="kc-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ' +
      'aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var text = document.createElement("span");
    text.className = "kc-label";
    text.textContent = label;
    button.appendChild(text);
    button.addEventListener("click", function () { setOpen(!open); });
    document.body.appendChild(button);
    requestAnimationFrame(function () { button.classList.add("kc-ready"); });

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
