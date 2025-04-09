/**
 * Background script for Instant Translator extension
 *
 * Handles context menu integration and manages settings
 */

// Default settings
const DEFAULT_SETTINGS = {
  sourceLanguage: 'auto',
  targetLanguage: 'en',
  apiPriority: ['deepl', 'google', 'amazon', 'microsoft', 'libre'],
  enableContextMenu: true,
  offlineMode: false,
  enableTTS: true,
  enableVoiceInput: true,
  enableHandwriting: true,
  enableLearning: true,
  saveHistory: true,
  maxHistoryItems: 50
};

// Create context menu items
function createContextMenus() {
  // Remove existing items
  chrome.contextMenus.removeAll(() => {
    // Get settings
    chrome.storage.sync.get(['enableContextMenu', 'targetLanguage'], (result) => {
      const settings = { ...DEFAULT_SETTINGS, ...result };

      if (settings.enableContextMenu) {
        // Create main context menu item
        chrome.contextMenus.create({
          id: 'translateSelection',
          title: 'Translate selection',
          contexts: ['selection']
        });

        // Create 'Translate to' submenu
        chrome.contextMenus.create({
          id: 'translateTo',
          title: 'Translate to',
          contexts: ['selection']
        });

        // Add common languages to submenu
        const languages = [
          { code: 'en', name: 'English' },
          { code: 'fr', name: 'French' },
          { code: 'es', name: 'Spanish' },
          { code: 'de', name: 'German' },
          { code: 'zh', name: 'Chinese' },
          { code: 'ja', name: 'Japanese' },
          { code: 'ru', name: 'Russian' }
        ];

        languages.forEach(lang => {
          chrome.contextMenus.create({
            id: `translateTo_${lang.code}`,
            title: lang.name,
            contexts: ['selection'],
            parentId: 'translateTo'
          });
        });
      }
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translateSelection') {
    // Translate using default target language
    chrome.storage.sync.get(['targetLanguage'], (result) => {
      const targetLang = result.targetLanguage || DEFAULT_SETTINGS.targetLanguage;
      translateSelectedText(info.selectionText, 'auto', targetLang, tab.id);
    });
  } else if (info.menuItemId.startsWith('translateTo_')) {
    // Extract target language from menu item ID
    const targetLang = info.menuItemId.replace('translateTo_', '');
    translateSelectedText(info.selectionText, 'auto', targetLang, tab.id);
  }
});

// Translate selected text
function translateSelectedText(text, sourceLang, targetLang, tabId) {
  // Show translation in a popup or inject into page
  chrome.tabs.sendMessage(tabId, {
    action: 'translateText',
    text,
    sourceLang,
    targetLang
  });
}

// Initialize extension
function initializeExtension() {
  // Check if settings exist, create defaults if not
  chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (result) => {
    // If no settings found, set defaults
    if (Object.keys(result).length === 0) {
      chrome.storage.sync.set(DEFAULT_SETTINGS);
    }

    // Create context menus
    createContextMenus();
  });
}

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // New installation
    chrome.storage.sync.set(DEFAULT_SETTINGS);
  } else if (details.reason === 'update') {
    // Update - more careful with existing settings
    chrome.storage.sync.get(null, (existingSettings) => {
      const updatedSettings = { ...DEFAULT_SETTINGS, ...existingSettings };
      chrome.storage.sync.set(updatedSettings);
    });
  }

  // Create context menus
  createContextMenus();
});

// Listen for changes to settings
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && (changes.enableContextMenu || changes.targetLanguage)) {
    createContextMenus();
  }
});

// Initialize on load
initializeExtension();
