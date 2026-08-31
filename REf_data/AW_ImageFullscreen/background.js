/* AW_ImageFullscreen background */

const DEFAULTS = {
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

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(null, function (items) {
    if (!items || Object.keys(items).length === 0) {
      chrome.storage.sync.set(DEFAULTS);
    }
  });
});

var memoryStore = new Map();

function storeDataUrl(tabId, dataUrl) {
  var key = "img_" + tabId;
  try {
    chrome.storage.session.set({ [key]: dataUrl });
  } catch (e) {
    memoryStore.set(tabId, dataUrl);
  }
}

function getStoredDataUrl(tabId) {
  return new Promise(function (resolve) {
    var key = "img_" + tabId;
    chrome.storage.session.get(key, function (res) {
      if (res && res[key]) resolve(res[key]);
      else resolve(memoryStore.get(tabId) || null);
    });
  });
}

function clearStored(tabId) {
  try { chrome.storage.session.remove("img_" + tabId); } catch (e) {}
  memoryStore.delete(tabId);
}

chrome.webNavigation.onCommitted.addListener(function (details) {
  if (details.frameId !== 0) return;
  var url = details.url || "";
  if (url.indexOf("data:image/") !== 0) return;

  getSettings().then(function (settings) {
    if (!settings.enabled || !settings.dataUrls) return;
    storeDataUrl(details.tabId, url);
    var viewer = chrome.runtime.getURL("viewer.html") + "?tid=" + details.tabId;
    chrome.tabs.update(details.tabId, { url: viewer }).catch(function () {});
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  var url = changeInfo.url || (tab && tab.url) || "";
  if (url.indexOf("data:image/") !== 0) return;
  if (url.indexOf("viewer.html") !== -1) return;

  getSettings().then(function (settings) {
    if (!settings.enabled || !settings.dataUrls) return;
    storeDataUrl(tabId, url);
    var viewer = chrome.runtime.getURL("viewer.html") + "?tid=" + tabId;
    chrome.tabs.update(tabId, { url: viewer }).catch(function () {});
  });
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  clearStored(tabId);
});

chrome.commands.onCommand.addListener(function (command) {
  if (command !== "save-original" && command !== "save-png") return;
  var format = command === "save-png" ? "png" : "original";
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || !tabs[0]) return;
    var tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, { type: "saveImage", format: format }).catch(function () {
      if (tab.url && tab.url.indexOf("viewer.html") !== -1) {
        try {
          var tid = parseInt(new URL(tab.url).searchParams.get("tid") || "0", 10);
          if (tid) {
            getStoredDataUrl(tid).then(function (dataUrl) {
              if (dataUrl) {
                chrome.tabs.sendMessage(tab.id, { type: "saveImage", format: format, dataUrl: dataUrl }).catch(function () {});
              }
            });
          }
        } catch (e) {}
      }
    });
  });
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === "getDataUrl") {
    getStoredDataUrl(msg.tabId).then(function (d) {
      sendResponse({ dataUrl: d });
    });
    return true;
  }
  if (msg.type === "getSettings") {
    getSettings().then(sendResponse);
    return true;
  }
  if (msg.type === "openShortcuts") {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  }
  if (msg.type === "incCounter") {
    getSettings().then(function (s) {
      var next = (s.downloadCounter || 1) + 1;
      chrome.storage.sync.set({ downloadCounter: next });
      sendResponse({ next: next });
    });
    return true;
  }
  if (msg.type === "saveSettings") {
    chrome.storage.sync.set(msg.data || {}, function () {
      sendResponse({ ok: true });
    });
    return true;
  }
});

function getSettings() {
  return new Promise(function (resolve) {
    chrome.storage.sync.get(DEFAULTS, function (items) {
      resolve(Object.assign({}, DEFAULTS, items));
    });
  });
}
