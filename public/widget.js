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
  var panel = null, scrim = null, button = null, open = false, scrollWas = null;

  // Motion. Entering starts fast and settles; leaving is quicker than arriving. The sheet uses the iOS drawer curve.
  var OUT = "cubic-bezier(.23,1,.32,1)", SHEET = "cubic-bezier(.32,.72,0,1)";

  function css(accent) {
    return (
      /* the button */
      ".kc-btn{position:fixed;right:20px;bottom:20px;right:max(20px,env(safe-area-inset-right));" +
      "bottom:max(20px,env(safe-area-inset-bottom));z-index:2147483000;display:flex;align-items:center;justify-content:center;" +
      "height:52px;min-width:52px;margin:0;padding:0 15px;font:600 15px/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
      "letter-spacing:0;text-transform:none;color:#fff;background:" + accent + ";border:0;border-radius:999px;cursor:pointer;" +
      "-webkit-tap-highlight-color:transparent;box-shadow:0 1px 2px rgba(0,0,0,.2),0 8px 24px rgba(0,0,0,.2);" +
      "touch-action:manipulation;-webkit-user-select:none;user-select:none;" +
      "opacity:0;transform:translateY(8px) scale(.96);transition:opacity .3s ease,transform .3s " + OUT + ",box-shadow .15s ease}" +
      ".kc-btn.kc-ready{opacity:1;transform:none}" +
      "@media (hover:hover) and (pointer:fine){.kc-btn.kc-ready:hover{transform:translateY(-2px);box-shadow:0 1px 2px rgba(0,0,0,.2),0 12px 30px rgba(0,0,0,.26)}}" +
      ".kc-btn.kc-ready:active{transform:scale(.96);transition:transform .12s " + OUT + "}" +
      ".kc-btn:focus-visible{outline:3px solid #fff;outline-offset:2px;box-shadow:0 0 0 6px " + accent + "}" +
      /* the two icons sit on top of each other and cross-fade, so the button changes rather than swaps */
      ".kc-ico{position:relative;width:22px;height:22px;flex:none;display:block}" +
      ".kc-ico svg{position:absolute;top:0;left:0;width:22px;height:22px;display:block;" +
      "transition:opacity .2s ease,transform .24s " + OUT + ",filter .2s ease}" +
      ".kc-ico .kc-x{opacity:0;transform:rotate(-45deg) scale(.8);filter:blur(2px)}" +
      ".kc-on .kc-ico .kc-chat{opacity:0;transform:rotate(45deg) scale(.8);filter:blur(2px)}" +
      ".kc-on .kc-ico .kc-x{opacity:1;transform:none;filter:none}" +
      ".kc-label{display:block;overflow:hidden;white-space:nowrap;max-width:260px;padding:0 5px 0 9px;opacity:1;" +
      "transition:max-width .28s " + SHEET + ",padding .28s " + SHEET + ",opacity .16s ease}" +
      ".kc-on .kc-label{max-width:0;padding:0;opacity:0}" +
      /* the pop-up, on a computer: grows out of the button's corner */
      ".kc-panel{position:fixed;right:20px;bottom:86px;z-index:2147483001;width:384px;max-width:calc(100vw - 40px);" +
      "height:min(640px,calc(100vh - 110px));background:#fff;border-radius:20px;overflow:hidden;" +
      "box-shadow:0 0 0 1px rgba(0,0,0,.06),0 16px 48px rgba(0,0,0,.24);opacity:0;visibility:hidden;pointer-events:none;" +
      "transform:translateY(10px) scale(.96);transform-origin:bottom right;" +
      "transition:opacity .15s ease,transform .18s " + OUT + ",visibility 0s linear .18s}" +
      ".kc-panel.kc-open{opacity:1;visibility:visible;pointer-events:auto;transform:none;" +
      "transition:opacity .2s ease,transform .3s " + OUT + "}" +
      ".kc-panel iframe{width:100%;height:100%;border:0;display:block;background:#fff}" +
      ".kc-scrim{display:none}" +
      /* on a phone: a sheet that slides up over a dimmed page, and can be dragged back down */
      "@media " + SMALL + "{" +
      ".kc-panel{top:10px;top:max(10px,env(safe-area-inset-top));right:0;bottom:0;left:0;width:auto;max-width:none;height:auto;" +
      "border-radius:16px 16px 0 0;box-shadow:0 -6px 30px rgba(0,0,0,.2),0 80px 0 #fff;opacity:1;transform:translateY(112%);" +
      "transition:transform .26s " + SHEET + ",visibility 0s linear .26s}" +
      ".kc-panel.kc-open{transition:transform .44s " + SHEET + "}" +
      ".kc-panel.kc-drag{transition:none}" +
      ".kc-scrim{display:block;position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483000;background:rgba(0,0,0,.42);" +
      "opacity:0;visibility:hidden;transition:opacity .26s ease,visibility 0s linear .26s}" +
      ".kc-scrim.kc-open{opacity:1;visibility:visible;transition:opacity .36s ease}" +
      ".kc-scrim.kc-drag{transition:none}" +
      ".kc-btn.kc-ready.kc-on{opacity:0;pointer-events:none}}" +
      /* closing with the keyboard is instant */
      ".kc-instant,.kc-instant.kc-open{transition:none!important}" +
      /* for people who have turned motion down: a short fade, nothing moves */
      "@media (prefers-reduced-motion:reduce){.kc-btn,.kc-btn.kc-ready:hover,.kc-btn.kc-ready:active{transform:none;transition:opacity .2s ease}" +
      ".kc-ico svg{transition:opacity .15s ease;transform:none!important;filter:none!important}.kc-label{transition:none}" +
      ".kc-panel,.kc-panel.kc-open{transform:none!important;opacity:0;transition:opacity .15s ease,visibility 0s linear .15s}" +
      ".kc-panel.kc-open{opacity:1;transition:opacity .15s ease}}"
    );
  }

  function isSheet() { return window.matchMedia(SMALL).matches; }

  // On a phone the chat covers the screen, so the page behind it is stopped from scrolling while it is open.
  function holdPage(on) {
    var root = document.documentElement;
    if (on && isSheet()) {
      if (scrollWas === null) { scrollWas = root.style.overflow; root.style.overflow = "hidden"; }
    } else if (scrollWas !== null) {
      root.style.overflow = scrollWas;
      scrollWas = null;
    }
  }

  function setOpen(next, instant) {
    open = next;
    if (open && !panel) {
      scrim = document.createElement("div");
      scrim.className = "kc-scrim";
      scrim.addEventListener("click", function () { setOpen(false); button.focus(); });
      panel = document.createElement("div");
      panel.className = "kc-panel";
      var frame = document.createElement("iframe");
      frame.title = "Chat with us";
      frame.src = base + "/?venue=" + encodeURIComponent(venue) + "&embed=1" + (isSheet() ? "&sheet=1" : "");
      panel.appendChild(frame);
      document.body.appendChild(scrim);
      document.body.appendChild(panel);
      panel.offsetWidth; // lets the opening animation run the first time
    }
    if (panel) {
      [panel, scrim].forEach(function (x) {
        x.classList.toggle("kc-instant", Boolean(instant));
        x.classList.remove("kc-drag");
        x.style.transform = "";
        x.style.opacity = "";
        x.classList.toggle("kc-open", open);
      });
    }
    button.classList.toggle("kc-on", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.setAttribute("aria-label", open ? "Close chat" : label);
    holdPage(open);
    try { sessionStorage.setItem(OPEN_KEY, open ? "1" : ""); } catch (e) {}
  }

  /* Dragging the sheet. The chat page reports how far the finger has moved; the sheet follows it exactly.
     Pulled upwards it resists more the further it goes, rather than stopping dead. */
  function rubber(over, size) { return (over * size * 0.55) / (size + 0.55 * Math.abs(over)); }
  function onDrag(dy) {
    if (!open || !panel || !isSheet()) return;
    var h = panel.offsetHeight || 1;
    var y = dy >= 0 ? dy : -rubber(-dy, h) * 0.2;
    panel.classList.add("kc-drag");
    scrim.classList.add("kc-drag");
    panel.style.transform = "translateY(" + y.toFixed(1) + "px)";
    scrim.style.opacity = String(Math.max(0, Math.min(1, 1 - y / h)));
  }
  function onDragEnd(dy, v) {
    if (!open || !panel || !isSheet()) return;
    // Let go while moving down quickly, or more than a third of the way down: it closes. Otherwise it settles back.
    var closing = dy > 0 && v > -0.05 && (v > 0.45 || dy > panel.offsetHeight * 0.33);
    if (closing) { setOpen(false); button.focus(); return; }
    [panel, scrim].forEach(function (x) { x.classList.remove("kc-drag"); x.style.transform = ""; x.style.opacity = ""; });
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
      '<span class="kc-ico" aria-hidden="true">' +
      '<svg class="kc-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>' +
      '<svg class="kc-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
      '<path d="M6 6l12 12M18 6L6 18"/></svg></span>';
    var text = document.createElement("span");
    text.className = "kc-label";
    text.textContent = label;
    button.appendChild(text);
    button.addEventListener("click", function () { setOpen(!open); });
    document.body.appendChild(button);
    requestAnimationFrame(function () { button.classList.add("kc-ready"); });

    window.addEventListener("message", function (e) {
      if (e.origin !== base || !e.data) return;
      if (e.data.type === "kc-close") { setOpen(false); button.focus(); }
      else if (e.data.type === "kc-drag") onDrag(Number(e.data.dy) || 0);
      else if (e.data.type === "kc-drag-end") onDragEnd(Number(e.data.dy) || 0, Number(e.data.v) || 0);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { setOpen(false, true); button.focus(); }
    });

    var wasOpen = false;
    try { wasOpen = sessionStorage.getItem(OPEN_KEY) === "1"; } catch (e) {}
    if (wasOpen) setOpen(true, true); // already open on the last page: put it back without replaying the entrance
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
