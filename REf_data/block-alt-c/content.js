let enabled = true;

chrome.storage.local.get(['enabled'], (result) => {
  enabled = result.enabled !== false;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue !== false;
  }
});

document.addEventListener('keydown', (e) => {
  if (
    enabled &&
    (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.metaKey
  ) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}, true);
