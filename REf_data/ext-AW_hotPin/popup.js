document.addEventListener('DOMContentLoaded', () => {
  const configBtn = document.getElementById('configBtn');
  const currentHotkey = document.getElementById('currentHotkey');
  const statusMsg = document.getElementById('statusMsg');
  
  // Функция для получения и отображения текущей горячей клавиши
  function updateHotkeyDisplay() {
    if (chrome.commands && chrome.commands.getAll) {
      chrome.commands.getAll((commands) => {
        if (commands && commands.length > 0) {
          const toggleCommand = commands.find(cmd => cmd.name === 'toggle-pin');
          
          if (toggleCommand && toggleCommand.shortcut) {
            // Хоткей назначен
            currentHotkey.textContent = toggleCommand.shortcut;
            currentHotkey.className = 'hotkey-text active';
            statusMsg.textContent = 'Hotkey is active. Press ' + toggleCommand.shortcut + ' to pin/unpin tabs.';
            statusMsg.style.color = '#4CAF50';
          } else {
            // Хоткей НЕ назначен
            currentHotkey.textContent = 'NOT SET';
            currentHotkey.className = 'hotkey-text inactive';
            statusMsg.textContent = '⚠️ Hotkey is not assigned. Click button below to set it.';
            statusMsg.style.color = '#FF9800';
            
            // Сохраняем в storage статус
            chrome.storage.sync.set({ hotkey: null });
          }
          
          // Сохраняем в storage
          if (toggleCommand && toggleCommand.shortcut) {
            chrome.storage.sync.set({ hotkey: toggleCommand.shortcut });
          }
        }
      });
    }
  }
  
  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Открывает страницу настроек хоткеев
  function openShortcutsPage() {
    // Используем тот же подход, что и в примере из вложения
    // Для Opera GX нужно попробовать оба варианта
    const shortcutsUrls = [
      'chrome://extensions/shortcuts',
      'opera://extensions/shortcuts'
    ];
    
    // Пробуем открыть chrome://extensions/shortcuts (этот вариант часто работает)
    chrome.tabs.create({ url: shortcutsUrls[0] }, (tab) => {
      if (chrome.runtime.lastError) {
        console.log('chrome:// URL blocked, trying alternative...');
        
        // Если chrome:// заблокирован, показываем инструкцию
        showManualInstruction(shortcutsUrls[1]);
      } else {
        // Если открылось успешно
        statusMsg.textContent = 'Opening shortcuts page...';
        statusMsg.style.color = '#4CAF50';
        
        // Обновляем отображение хоткея через 2 секунды
        setTimeout(updateHotkeyDisplay, 2000);
      }
    });
  }
  
  // Функция для показа ручной инструкции
  function showManualInstruction(url) {
    statusMsg.innerHTML = `
      <div style="margin-bottom: 8px;">⚠️ Cannot open page automatically.</div>
      <div style="font-size: 11px; margin-bottom: 8px;">
        Copy URL and paste in address bar:
      </div>
      <div id="urlToCopy" style="
        background: #333; 
        padding: 8px; 
        border-radius: 4px; 
        font-family: monospace; 
        font-size: 12px;
        border: 1px solid #444;
        cursor: pointer;
        word-break: break-all;
        color: #9370db;
      ">
        ${url}
      </div>
      <div style="font-size: 10px; margin-top: 4px; color: #888;">
        Click URL to copy
      </div>
    `;
    statusMsg.style.color = '#FF9800';
    
    // Делаем URL кликабельным для копирования
    const urlElement = document.getElementById('urlToCopy');
    if (urlElement) {
      urlElement.addEventListener('click', function() {
        navigator.clipboard.writeText(url).then(() => {
          const originalText = this.textContent;
          this.textContent = '✅ Copied!';
          this.style.color = '#4CAF50';
          this.style.borderColor = '#4CAF50';
          
          setTimeout(() => {
            this.textContent = originalText;
            this.style.color = '#9370db';
            this.style.borderColor = '#444';
          }, 2000);
        });
      });
    }
  }
  
  // Обработчик клика на кнопку
  configBtn.addEventListener('click', openShortcutsPage);
  
  // Загружаем сохранённый хоткей при открытии
  chrome.storage.sync.get(['hotkey'], (result) => {
    if (result.hotkey) {
      currentHotkey.textContent = result.hotkey;
      currentHotkey.className = 'hotkey-text active';
    } else {
      currentHotkey.textContent = 'NOT SET';
      currentHotkey.className = 'hotkey-text inactive';
    }
  });
  
  // Получаем актуальную горячую клавишу из системы
  updateHotkeyDisplay();
  
  // Слушаем изменения в хранилище
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.hotkey) {
      if (changes.hotkey.newValue) {
        currentHotkey.textContent = changes.hotkey.newValue;
        currentHotkey.className = 'hotkey-text active';
      } else {
        currentHotkey.textContent = 'NOT SET';
        currentHotkey.className = 'hotkey-text inactive';
      }
    }
  });
  
  // Проверяем каждые 2 секунды
  const checkInterval = setInterval(updateHotkeyDisplay, 2000);
  
  // Очищаем интервал при закрытии popup
  window.addEventListener('beforeunload', () => {
    clearInterval(checkInterval);
  });
});