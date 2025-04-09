/**
 * Translation Module for Enhanced Chat System
 * Handles UI interactions for message translation
 */

// Cache for languages
let supportedLanguages = [];

// User translation preferences
const translationPreferences = {
  enabled: false,
  targetLanguage: 'en'
};

// Initialize translation features
export const initTranslation = async (socket) => {
  // Fetch supported languages
  try {
    const response = await fetch('/api/translation/languages');
    const languages = await response.json();
    supportedLanguages = languages;

    // Populate language dropdowns
    populateLanguageDropdowns(languages);

    // Get user preferences from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    if (userData.translationEnabled) {
      translationPreferences.enabled = userData.translationEnabled;
      translationPreferences.targetLanguage = userData.preferredLanguage || 'en';

      // Toggle the UI elements
      document.getElementById('auto-translate-toggle').checked = translationPreferences.enabled;

      const languageSelect = document.getElementById('translation-language');
      if (languageSelect) {
        languageSelect.value = translationPreferences.targetLanguage;
      }

      // Send preferences to the server
      if (socket && translationPreferences.enabled) {
        socket.emit('setAutoTranslate', {
          enabled: translationPreferences.enabled,
          targetLanguage: translationPreferences.targetLanguage
        });
      }
    }

    // Initialize event listeners
    initEventListeners(socket);

  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

// Populate language dropdown menus
const populateLanguageDropdowns = (languages) => {
  const dropdowns = document.querySelectorAll('.language-dropdown');

  dropdowns.forEach(dropdown => {
    // Clear existing options
    dropdown.innerHTML = '';

    // Add languages
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.language || lang.code;
      option.textContent = lang.name;
      dropdown.appendChild(option);
    });

    // Select preferred language
    dropdown.value = translationPreferences.targetLanguage;
  });
};

// Initialize event listeners for translation features
const initEventListeners = (socket) => {
  // Auto-translate toggle
  const autoTranslateToggle = document.getElementById('auto-translate-toggle');
  if (autoTranslateToggle) {
    autoTranslateToggle.addEventListener('change', (e) => {
      translationPreferences.enabled = e.target.checked;

      // Save preference to localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      userData.translationEnabled = translationPreferences.enabled;
      localStorage.setItem('userData', JSON.stringify(userData));

      // Send to server
      if (socket) {
        socket.emit('setAutoTranslate', {
          enabled: translationPreferences.enabled,
          targetLanguage: translationPreferences.targetLanguage
        });
      }

      // Show feedback
      const event = translationPreferences.enabled ? 'enabled' : 'disabled';
      showTranslationFeedback(`Auto-translation ${event}`);
    });
  }

  // Language selector
  const languageSelect = document.getElementById('translation-language');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      translationPreferences.targetLanguage = e.target.value;

      // Save preference to localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      userData.preferredLanguage = translationPreferences.targetLanguage;
      localStorage.setItem('userData', JSON.stringify(userData));

      // Send to server if auto-translate is enabled
      if (socket && translationPreferences.enabled) {
        socket.emit('setAutoTranslate', {
          enabled: translationPreferences.enabled,
          targetLanguage: translationPreferences.targetLanguage
        });
      }

      // Show feedback
      const languageName = supportedLanguages.find(
        l => l.language === translationPreferences.targetLanguage
      )?.name || translationPreferences.targetLanguage;

      showTranslationFeedback(`Language set to ${languageName}`);
    });
  }

  // Translate button click (for individual messages)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.translate-message-btn')) {
      const messageElement = e.target.closest('.message');
      if (messageElement) {
        const messageId = messageElement.dataset.messageId;
        translateMessage(messageId, socket);
      }
    }
  });

  // Handle translation response from server
  if (socket) {
    socket.on('messageTranslation', (data) => {
      displayTranslation(data.messageId, data.translation);
    });
  }
};

// Translate a specific message
const translateMessage = (messageId, socket) => {
  if (!socket) return;

  const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  // Show loading state
  const contentElement = messageElement.querySelector('.message-content');
  if (contentElement) {
    contentElement.classList.add('translating');

    // Add loading indicator if not already present
    if (!messageElement.querySelector('.translation-loading')) {
      const loadingEl = document.createElement('div');
      loadingEl.className = 'translation-loading';
      loadingEl.innerHTML = '<i class="fas fa-sync fa-spin"></i> Translating...';
      contentElement.appendChild(loadingEl);
    }
  }

  // Request translation from server
  socket.emit('translateMessage', {
    messageId,
    targetLanguage: translationPreferences.targetLanguage
  });
};

// Display a translation in the UI
const displayTranslation = (messageId, translation) => {
  const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  const contentElement = messageElement.querySelector('.message-content');
  if (!contentElement) return;

  // Remove loading state
  contentElement.classList.remove('translating');
  const loadingEl = messageElement.querySelector('.translation-loading');
  if (loadingEl) {
    loadingEl.remove();
  }

  // Add or update translation
  let translationEl = messageElement.querySelector('.message-translation');

  if (!translationEl) {
    translationEl = document.createElement('div');
    translationEl.className = 'message-translation';
    contentElement.appendChild(translationEl);
  }

  // Check if this is a rich content message
  const isRichContent = messageElement.classList.contains('rich-text-message');

  // If there was an error or no translation needed
  if (translation.error || !translation.plainText ||
     (translation.plainText === translation.originalText)) {
    if (translation.detectedSourceLanguage === translationPreferences.targetLanguage) {
      translationEl.innerHTML = '<em>Message is already in your preferred language</em>';
    } else if (translation.error) {
      translationEl.innerHTML = `<em>Translation failed: ${translation.error}</em>`;
    } else {
      translationEl.remove(); // No translation needed
    }
    return;
  }

  // Display the translation - use rich content if available
  translationEl.innerHTML = `
    <div class="translation-header">
      <small>Translated from ${getLanguageName(translation.detectedSourceLanguage)}</small>
    </div>
    <div class="translation-text">
      ${isRichContent && translation.richText ? translation.richText : translation.plainText}
    </div>
  `;
};

// Get language name from code
const getLanguageName = (languageCode) => {
  const language = supportedLanguages.find(l => l.language === languageCode);
  return language ? language.name : languageCode;
};

// Show translation feedback/toast
const showTranslationFeedback = (message) => {
  // Create or get toast container
  let toastContainer = document.getElementById('toast-container');

  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    // Add styles if not already in CSS
    const style = document.createElement('style');
    style.textContent = `
      #toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
      }
      .toast {
        background-color: #667eea;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        margin-top: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateY(20px);
        animation: showToast 0.3s ease forwards, hideToast 0.3s ease forwards 3s;
      }
      @keyframes showToast {
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes hideToast {
        to { opacity: 0; transform: translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Remove after animation completes
  setTimeout(() => {
    toast.remove();
  }, 3500);
};

// Process an incoming message with translation if needed
export const processIncomingMessage = (message, isAutoTranslate = false) => {
  // Only auto-translate if enabled and the message is text
  if (isAutoTranslate && translationPreferences.enabled &&
     (message.type === 'text' || message.richContent)) {
    // If message has a translation property, use it
    if (message.translation) {
      // For rich content, use richText if available
      const displayContent = message.richContent && message.translation.richText
        ? message.translation.richText
        : message.translation.plainText;

      return {
        ...message,
        displayContent,
        originalContent: message.richContent || message.content,
        wasTranslated: true,
        sourceLanguage: message.translation.detectedSourceLanguage
      };
    }
  }

  // Return original message if no translation
  return {
    ...message,
    displayContent: message.richContent || message.content,
    wasTranslated: false
  };
};

// Add translation UI to a message element
export const addTranslationUI = (messageElement, message) => {
  if (message.type !== 'text' && !message.richContent) return;

  // Add translate button
  const actionsElement = messageElement.querySelector('.message-actions');
  if (!actionsElement) return;

  const translateBtn = document.createElement('button');
  translateBtn.className = 'translate-message-btn';
  translateBtn.innerHTML = '<i class="fas fa-language"></i>';
  translateBtn.title = 'Translate message';
  actionsElement.appendChild(translateBtn);

  // If message was auto-translated, show translation
  if (message.wasTranslated) {
    const contentElement = messageElement.querySelector('.message-content');
    if (!contentElement) return;

    const translationEl = document.createElement('div');
    translationEl.className = 'message-translation';
    translationEl.innerHTML = `
      <div class="translation-header">
        <small>Translated from ${getLanguageName(message.sourceLanguage)}</small>
      </div>
      <div class="translation-text">${message.displayContent}</div>
    `;
    contentElement.appendChild(translationEl);
  }
};

export default {
  initTranslation,
  processIncomingMessage,
  addTranslationUI
};
