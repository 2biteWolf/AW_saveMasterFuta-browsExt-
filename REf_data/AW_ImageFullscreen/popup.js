/* AW_ImageFullscreen popup */

var DEFAULTS = {
  enabled: true,
  dataUrls: true,
  httpImages: true,
  fitMode: "fill",
  background: "#000000",
  renameEnabled: false,
  renameBase: "image",
  renamePrefix: "",
  downloadCounter: 1
};

function showStatus(text) {
  var el = document.getElementById("status");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(function () {
    el.classList.remove("show");
  }, 1800);
}

function load() {
  chrome.storage.sync.get(DEFAULTS, function (items) {
    document.getElementById("enabled").checked = !!items.enabled;
    document.getElementById("dataUrls").checked = !!items.dataUrls;
    document.getElementById("httpImages").checked = !!items.httpImages;
    document.getElementById("fitMode").value = items.fitMode || "fill";
    document.getElementById("background").value = items.background || "#000000";
    document.getElementById("renameEnabled").checked = !!items.renameEnabled;
    document.getElementById("renameBase").value = items.renameBase || "image";
    document.getElementById("renamePrefix").value = items.renamePrefix || "";
  });
}

document.getElementById("save").addEventListener("click", function () {
  var data = {
    enabled: document.getElementById("enabled").checked,
    dataUrls: document.getElementById("dataUrls").checked,
    httpImages: document.getElementById("httpImages").checked,
    fitMode: document.getElementById("fitMode").value,
    background: document.getElementById("background").value,
    renameEnabled: document.getElementById("renameEnabled").checked,
    renameBase: (document.getElementById("renameBase").value || "image").trim() || "image",
    renamePrefix: (document.getElementById("renamePrefix").value || "").trim()
  };
  chrome.storage.sync.set(data, function () {
    showStatus("Saved");
  });
});

document.getElementById("shortcuts").addEventListener("click", function () {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

load();
