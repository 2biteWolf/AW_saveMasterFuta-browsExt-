console.log('AW_hotPin background script loading...');

// Проверяем доступность API
console.log('chrome.tabs:', typeof chrome.tabs);
console.log('chrome.commands:', typeof chrome.commands);

// Обработчик горячих клавиш
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  
  if (command === 'toggle-pin') {
    // Используем правильный запрос для активной вкладки
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('Query result:', tabs);
      
      if (chrome.runtime.lastError) {
        console.error('Query error:', chrome.runtime.lastError);
        return;
      }
      
      if (tabs && tabs.length > 0) {
        const currentTab = tabs[0];
        console.log('Current tab:', currentTab.id, currentTab.title, 'pinned:', currentTab.pinned);
        
        // Переключаем состояние закрепления
        const newPinnedState = !currentTab.pinned;
        console.log('Toggling to pinned:', newPinnedState);
        
        chrome.tabs.update(currentTab.id, { pinned: newPinnedState }, (updatedTab) => {
          if (chrome.runtime.lastError) {
            console.error('Update error:', chrome.runtime.lastError);
          } else {
            console.log('Successfully updated tab, new state:', updatedTab.pinned);
            
            // Визуальная обратная связь
            try {
              chrome.action.setBadgeText({
                text: newPinnedState ? '📌' : '🔓'
              });
              
              chrome.action.setBadgeBackgroundColor({
                color: newPinnedState ? '#4CAF50' : '#2196F3'
              });
              
              // Через 1 секунду убираем бейдж
              setTimeout(() => {
                chrome.action.setBadgeText({ text: '' });
              }, 1000);
            } catch (badgeError) {
              console.warn('Could not set badge:', badgeError);
            }
          }
        });
      } else {
        console.error('No active tab found');
      }
    });
  }
});

// Логируем доступные команды при установке
chrome.runtime.onInstalled.addListener(() => {
  console.log('AW_hotPin installed/updated');
  
  chrome.commands.getAll((commands) => {
    console.log('Available commands:', commands);
    
    // Сохраняем команды для popup
    if (commands && commands.length > 0) {
      const toggleCommand = commands.find(cmd => cmd.name === 'toggle-pin');
      if (toggleCommand) {
        chrome.storage.sync.set({ 
          hotkey: toggleCommand.shortcut || 'Alt+Z'
        });
      }
    }
  });
});

// Для отладки: проверяем доступность API
setTimeout(() => {
  console.log('Background script running...');
  
  // Проверяем текущие команды
  chrome.commands.getAll((commands) => {
    console.log('Current commands on load:', commands);
  });
}, 1000);