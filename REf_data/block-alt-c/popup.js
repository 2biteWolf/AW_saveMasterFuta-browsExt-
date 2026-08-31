const btn = document.getElementById('toggle');
const status = document.getElementById('status');

function updateUI(enabled) {
  status.textContent = enabled ? 'BLOCK ON' : 'BLOCK OFF';
  btn.style.background = enabled ? '#c83232' : '#333';
}

chrome.storage.local.get(['enabled'], (result) => {
  const enabled = result.enabled !== false;
  updateUI(enabled);
});

btn.addEventListener('click', () => {
  chrome.storage.local.get(['enabled'], (result) => {
    const current = result.enabled !== false;
    const next = !current;
    chrome.storage.local.set({ enabled: next }, () => {
      updateUI(next);
    });
  });
});
