/* AW_ImageFullscreen viewer */

(function () {
  var params = new URLSearchParams(location.search);
  var tid = parseInt(params.get("tid"), 10);
  var img = document.getElementById("img");
  var toastEl = document.getElementById("toast");
  var dataUrl = null;
  var mode = "fill";
  var bg = "#000000";
  var MODES = ["none", "vertical", "fill", "horizontal"];
  var labels = {
    none: "1 original",
    vertical: "2 fit height",
    fill: "3 stretch",
    horizontal: "4 fit width"
  };

  function toast(text, ms) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () {
      toastEl.classList.remove("show");
    }, ms || 2000);
  }

  if (!tid) {
    toast("Error: no tab id");
    return;
  }

  function applyMode(m) {
    mode = m;
    var root = document.documentElement;
    var body = document.body;

    root.style.cssText = "margin:0;padding:0;width:100%;height:100%;background:" + bg + ";";
    body.style.cssText = "margin:0;padding:0;background:" + bg + ";";

    img.style.cssText = "display:block;border:0;padding:0;background:transparent;cursor:default;";

    if (m === "none") {
      root.style.overflow = "auto";
      body.style.overflow = "auto";
      body.style.minHeight = "100vh";
      body.style.display = "flex";
      body.style.alignItems = "center";
      body.style.justifyContent = "center";
      img.style.width = "auto";
      img.style.height = "auto";
      img.style.maxWidth = "none";
      img.style.maxHeight = "none";
      img.style.objectFit = "none";
    } else if (m === "vertical") {
      /* Fill viewport height, keep aspect, allow horizontal scroll */
      root.style.overflow = "auto";
      body.style.overflow = "auto";
      body.style.width = "auto";
      body.style.minHeight = "100vh";
      body.style.height = "auto";
      body.style.display = "block";
      img.style.height = "100vh";
      img.style.width = "auto";
      img.style.maxHeight = "none";
      img.style.maxWidth = "none";
      img.style.minHeight = "100vh";
      img.style.objectFit = "contain";
      img.style.margin = "0 auto";
    } else if (m === "fill") {
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.width = "100vw";
      body.style.height = "100vh";
      body.style.display = "block";
      img.style.width = "100vw";
      img.style.height = "100vh";
      img.style.maxWidth = "none";
      img.style.maxHeight = "none";
      img.style.objectFit = "fill";
      img.style.margin = "0";
    } else if (m === "horizontal") {
      /* Fill viewport width, keep aspect, allow vertical scroll */
      root.style.overflowX = "hidden";
      root.style.overflowY = "auto";
      body.style.overflowX = "hidden";
      body.style.overflowY = "auto";
      body.style.width = "100vw";
      body.style.minHeight = "100vh";
      body.style.height = "auto";
      body.style.display = "block";
      img.style.width = "100vw";
      img.style.height = "auto";
      img.style.maxWidth = "none";
      img.style.maxHeight = "none";
      img.style.minWidth = "100vw";
      img.style.objectFit = "contain";
      img.style.margin = "0 auto";
    }

    var w = img.naturalWidth || "?";
    var h = img.naturalHeight || "?";
    toast(w + "x" + h + " · " + labels[m]);
  }

  function saveImage(format) {
    chrome.runtime.sendMessage({ type: "getSettings" }, function (s) {
      if (!s) s = {};
      var outUrl = dataUrl;
      var ext = "png";
      var match = dataUrl && dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+)/);
      if (match) {
        var mime = match[1];
        if (mime === "image/jpeg") ext = "jpg";
        else if (mime === "image/png") ext = "png";
        else if (mime === "image/webp") ext = "webp";
        else if (mime === "image/gif") ext = "gif";
        else ext = (mime.split("/")[1] || "png");
      }
      if (format === "png") {
        ext = "png";
        if (dataUrl && dataUrl.indexOf("data:image/png") !== 0) {
          var c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext("2d").drawImage(img, 0, 0);
          outUrl = c.toDataURL("image/png");
        }
      }
      var num = s.downloadCounter || 1;
      var filename;
      if (s.renameEnabled) {
        var base = (s.renameBase || "image").trim() || "image";
        var prefix = (s.renamePrefix || "").trim();
        filename = prefix ? prefix + "_" + base + "_" + num + "." + ext : base + "_" + num + "." + ext;
      } else {
        filename = "image_" + num + "." + ext;
      }
      chrome.downloads.download({
        url: outUrl,
        filename: filename,
        saveAs: false
      }, function () {
        chrome.runtime.sendMessage({ type: "incCounter" });
        toast("Saved: " + filename, 2600);
      });
    });
  }

  Promise.all([
    new Promise(function (r) { chrome.runtime.sendMessage({ type: "getSettings" }, r); }),
    new Promise(function (r) { chrome.runtime.sendMessage({ type: "getDataUrl", tabId: tid }, r); })
  ]).then(function (results) {
    var settings = results[0] || {};
    var dataResp = results[1] || {};
    if (!dataResp.dataUrl) {
      toast("Error: image data missing");
      return;
    }
    dataUrl = dataResp.dataUrl;
    mode = settings.fitMode || "fill";
    if (MODES.indexOf(mode) === -1) mode = "fill";
    bg = settings.background || "#000000";

    img.onload = function () { applyMode(mode); };
    img.onerror = function () { toast("Load failed"); };
    img.src = dataUrl;

    img.addEventListener("click", function () {
      var idx = MODES.indexOf(mode);
      idx = (idx + 1) % MODES.length;
      var next = MODES[idx];
      applyMode(next);
      chrome.storage.sync.set({ fitMode: next });
    });
  });

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === "saveImage") {
      toast("Hotkey → save " + (msg.format || "original"));
      if (msg.dataUrl) dataUrl = msg.dataUrl;
      saveImage(msg.format || "original");
    }
  });

  window.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      toast("Ctrl+S → save original");
      saveImage("original");
    }
  }, true);
})();
