/* AW_ImageFullscreen content script */

(function () {
  chrome.runtime.sendMessage({ type: "getSettings" }, function (settings) {
    if (!settings || !settings.enabled || !settings.httpImages) return;

    function isImageDoc() {
      try {
        if (document.contentType && document.contentType.indexOf("image/") === 0) return true;
      } catch (e) {}
      var imgs = document.getElementsByTagName("img");
      if (imgs.length === 1) {
        var body = document.body;
        if (!body) return false;
        if (body.children.length <= 2) return true;
        if (body.innerText && body.innerText.trim().length < 40) return true;
      }
      return false;
    }

    if (!isImageDoc()) return;
    var img = document.querySelector("img");
    if (!img) return;

    var toastEl = document.getElementById("aw-toast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "aw-toast";
      toastEl.style.cssText = "position:fixed;top:14px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.88);color:#39ff14;font:13px/1.4 system-ui,sans-serif;padding:8px 14px;border-radius:8px;border:1px solid #39ff14;z-index:999999;opacity:0;pointer-events:none;transition:opacity 0.2s;max-width:92vw;text-align:center;";
      (document.documentElement || document.body).appendChild(toastEl);
    }

    function toast(text, ms) {
      toastEl.textContent = text;
      toastEl.style.opacity = "1";
      clearTimeout(toastEl._t);
      toastEl._t = setTimeout(function () { toastEl.style.opacity = "0"; }, ms || 2000);
    }

    var MODES = ["none", "vertical", "fill", "horizontal"];
    var labels = {
      none: "1 original",
      vertical: "2 fit height",
      fill: "3 stretch",
      horizontal: "4 fit width"
    };
    var currentMode = settings.fitMode || "fill";
    if (MODES.indexOf(currentMode) === -1) currentMode = "fill";
    var bg = settings.background || "#000000";

    function applyMode(mode) {
      var root = document.documentElement;
      var body = document.body;

      root.style.setProperty("background", bg, "important");
      root.style.setProperty("margin", "0", "important");
      root.style.setProperty("padding", "0", "important");
      root.style.setProperty("width", "100%", "important");
      root.style.setProperty("height", "100%", "important");

      body.style.setProperty("background", bg, "important");
      body.style.setProperty("margin", "0", "important");
      body.style.setProperty("padding", "0", "important");

      img.style.setProperty("display", "block", "important");
      img.style.setProperty("border", "0", "important");
      img.style.setProperty("padding", "0", "important");
      img.style.setProperty("background", "transparent", "important");
      img.style.setProperty("cursor", "default", "important");
      img.removeAttribute("width");
      img.removeAttribute("height");

      if (mode === "none") {
        root.style.setProperty("overflow", "auto", "important");
        body.style.setProperty("overflow", "auto", "important");
        body.style.setProperty("min-height", "100vh", "important");
        body.style.setProperty("display", "flex", "important");
        body.style.setProperty("align-items", "center", "important");
        body.style.setProperty("justify-content", "center", "important");
        img.style.setProperty("width", "auto", "important");
        img.style.setProperty("height", "auto", "important");
        img.style.setProperty("max-width", "none", "important");
        img.style.setProperty("max-height", "none", "important");
      } else if (mode === "vertical") {
        root.style.setProperty("overflow", "auto", "important");
        body.style.setProperty("overflow", "auto", "important");
        body.style.setProperty("min-height", "100vh", "important");
        body.style.setProperty("display", "block", "important");
        img.style.setProperty("height", "100vh", "important");
        img.style.setProperty("width", "auto", "important");
        img.style.setProperty("min-height", "100vh", "important");
        img.style.setProperty("max-width", "none", "important");
        img.style.setProperty("max-height", "none", "important");
        img.style.setProperty("object-fit", "contain", "important");
        img.style.setProperty("margin-left", "auto", "important");
        img.style.setProperty("margin-right", "auto", "important");
      } else if (mode === "fill") {
        root.style.setProperty("overflow", "hidden", "important");
        body.style.setProperty("overflow", "hidden", "important");
        body.style.setProperty("width", "100vw", "important");
        body.style.setProperty("height", "100vh", "important");
        body.style.setProperty("display", "block", "important");
        img.style.setProperty("width", "100vw", "important");
        img.style.setProperty("height", "100vh", "important");
        img.style.setProperty("object-fit", "fill", "important");
        img.style.setProperty("margin", "0", "important");
      } else if (mode === "horizontal") {
        root.style.setProperty("overflow-x", "hidden", "important");
        root.style.setProperty("overflow-y", "auto", "important");
        body.style.setProperty("overflow-x", "hidden", "important");
        body.style.setProperty("overflow-y", "auto", "important");
        body.style.setProperty("width", "100vw", "important");
        body.style.setProperty("min-height", "100vh", "important");
        body.style.setProperty("display", "block", "important");
        img.style.setProperty("width", "100vw", "important");
        img.style.setProperty("height", "auto", "important");
        img.style.setProperty("min-width", "100vw", "important");
        img.style.setProperty("max-width", "none", "important");
        img.style.setProperty("max-height", "none", "important");
        img.style.setProperty("object-fit", "contain", "important");
        img.style.setProperty("margin-left", "auto", "important");
        img.style.setProperty("margin-right", "auto", "important");
      }

      toast((img.naturalWidth || "?") + "x" + (img.naturalHeight || "?") + " · " + labels[mode]);
    }

    function run() {
      applyMode(currentMode);
    }

    if (img.complete) run();
    else img.addEventListener("load", run);
    window.addEventListener("resize", run);
    setTimeout(run, 50);
    setTimeout(run, 300);
    setTimeout(run, 800);

    img.addEventListener("click", function () {
      var idx = MODES.indexOf(currentMode);
      idx = (idx + 1) % MODES.length;
      currentMode = MODES[idx];
      settings.fitMode = currentMode;
      applyMode(currentMode);
      chrome.storage.sync.set({ fitMode: currentMode });
    });

    chrome.runtime.onMessage.addListener(function (msg) {
      if (msg.type !== "saveImage") return;
      toast("Hotkey → save " + (msg.format || "original"));
      var src = img.currentSrc || img.src;
      if (!src) return;
      chrome.runtime.sendMessage({ type: "getSettings" }, function (s) {
        if (!s) s = {};
        var num = s.downloadCounter || 1;
        var ext = "png";
        if (/\.jpe?g/i.test(src) || src.indexOf("image/jpeg") !== -1) ext = "jpg";
        else if (/\.webp/i.test(src) || src.indexOf("image/webp") !== -1) ext = "webp";
        else if (/\.gif/i.test(src) || src.indexOf("image/gif") !== -1) ext = "gif";
        if (msg.format === "png") ext = "png";
        var filename;
        if (s.renameEnabled) {
          var base = (s.renameBase || "image").trim() || "image";
          var prefix = (s.renamePrefix || "").trim();
          filename = prefix ? prefix + "_" + base + "_" + num + "." + ext : base + "_" + num + "." + ext;
        } else {
          filename = "image_" + num + "." + ext;
        }
        chrome.downloads.download({
          url: src,
          filename: filename,
          saveAs: false
        }, function () {
          chrome.runtime.sendMessage({ type: "incCounter" });
          toast("Saved: " + filename, 2600);
        });
      });
    });
  });
})();
