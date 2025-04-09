/**
 * Content script for Instant Translator extension
 *
 * Handles in-page translation UI and communicates with background script
 */

// Initialize translation service
let translationService = null;

// Inject the translation popup into the page
let translationPopup = null;
let selectionRange = null;

// Create the translation popup element
function createTranslationPopup() {
  // Remove any existing popup
  if (translationPopup) {
    document.body.removeChild(translationPopup);
  }

  // Create popup container
  translationPopup = document.createElement('div');
  translationPopup.className = 'instant-translator-popup';
  translationPopup.innerHTML = `
    <div class="translator-popup-header">
      <div class="translator-popup-title">Instant Translator</div>
      <div class="translator-popup-controls">
        <button class="translator-popup-close" title="Close">✕</button>
      </div>
    </div>
    <div class="translator-popup-content">
      <div class="translator-popup-translation"></div>
      <div class="translator-popup-info">
        <span class="translator-popup-api"></span>
        <span class="translator-popup-confidence"></span>
      </div>
    </div>
    <div class="translator-popup-footer">
      <button class="translator-popup-speak" title="Text to speech">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M5.889 16H2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3.889l5.294-4.332a.5.5 0 0 1 .817.387v15.89a.5.5 0 0 1-.817.387L5.89 16zm13.517 4.134l-1.416-1.416A8.978 8.978 0 0 0 21 12a8.982 8.982 0 0 0-3.304-6.968l1.42-1.42A10.976 10.976 0 0 1 23 12c0 3.223-1.386 6.122-3.594 8.134z" fill="currentColor"/></svg>
      </button>
      <button class="translator-popup-copy" title="Copy to clipboard">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4zm0 2H4v12h12v-3h-5a1 1 0 0 1-1-1v-3H8V8zm2-4v12h12V4H9z" fill="currentColor"/></svg>
      </button>
      <button class="translator-popup-open" title="Open in popup">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6zm11-3v8h-2V6.413l-7.793 7.794-1.414-1.414L17.585 5H13V3h8z" fill="currentColor"/></svg>
      </button>
    </div>
  `;

  // Add event listeners
  translationPopup.querySelector('.translator-popup-close').addEventListener('click', hideTranslationPopup);
  translationPopup.querySelector('.translator-popup-speak').addEventListener('click', speakTranslation);
  translationPopup.querySelector('.translator-popup-copy').addEventListener('click', copyTranslation);
  translationPopup.querySelector('.translator-popup-open').addEventListener('click', openInPopup);

  // Prevent popup from closing when clicking inside it
  translationPopup.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  // Add to page
  document.body.appendChild(translationPopup);

  // Hide popup when clicking outside
  document.addEventListener('mousedown', hideTranslationPopup);

  return translationPopup;
}

// Show the translation popup
function showTranslationPopup(text, translation, position, metadata = {}) {
  // Create popup if it doesn't exist
  if (!translationPopup) {
    translationPopup = createTranslationPopup();
  }

  // Set content
  const contentElement = translationPopup.querySelector('.translator-popup-translation');
  contentElement.textContent = translation;

  // Set metadata if available
  if (metadata.apiUsed) {
    translationPopup.querySelector('.translator-popup-api').textContent = `API: ${metadata.apiUsed}`;
  } else {
    translationPopup.querySelector('.translator-popup-api').textContent = '';
  }

  if (metadata.confidence) {
    const confidenceElement = translationPopup.querySelector('.translator-popup-confidence');
    confidenceElement.textContent = `Confidence: ${metadata.confidence}`;
    confidenceElement.className = 'translator-popup-confidence'; // Reset class
    confidenceElement.classList.add(`confidence-${metadata.confidence}`);
  } else {
    translationPopup.querySelector('.translator-popup-confidence').textContent = '';
  }

  // Position popup near the selection
  const popupWidth = 300;
  const popupHeight = 150;

  // Default position (centered on screen)
  let left = (window.innerWidth - popupWidth) / 2;
  let top = (window.innerHeight - popupHeight) / 2;

  // Use provided position if available
  if (position) {
    left = position.x + 10; // Offset from cursor
    top = position.y + 10;

    // Ensure popup stays within viewport
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }

    if (top + popupHeight > window.innerHeight) {
      top = window.innerHeight - popupHeight - 10;
    }
  }

  // Apply position
  translationPopup.style.left = `${left}px`;
  translationPopup.style.top = `${top}px`;

  // Show popup
  translationPopup.classList.add('visible');
}

// Hide the translation popup
function hideTranslationPopup() {
  if (translationPopup) {
    translationPopup.classList.remove('visible');
  }
}

// Speak the translation
function speakTranslation() {
  const translation = translationPopup.querySelector('.translator-popup-translation').textContent;

  if (translation) {
    chrome.runtime.sendMessage({
      action: 'speakText',
      text: translation
    });
  }
}

// Copy translation to clipboard
function copyTranslation() {
  const translation = translationPopup.querySelector('.translator-popup-translation').textContent;

  if (translation) {
    navigator.clipboard.writeText(translation)
      .then(() => {
        // Show success indicator
        const copyButton = translationPopup.querySelector('.translator-popup-copy');
        const originalHTML = copyButton.innerHTML;

        copyButton.innerHTML = '✓';
        setTimeout(() => {
          copyButton.innerHTML = originalHTML;
        }, 1000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  }
}

// Open in main popup
function openInPopup() {
  const originalText = selectionRange ? selectionRange.toString() : '';
  const translation = translationPopup.querySelector('.translator-popup-translation').textContent;

  if (originalText && translation) {
    chrome.runtime.sendMessage({
      action: 'openInPopup',
      originalText,
      translation
    });
  }
}

// Translate text through extension API
function translateText(text, sourceLang, targetLang) {
  // Get current selection position for popup placement
  const selectionPosition = getSelectionPosition();

  // Show loading state
  showTranslationPopup(text, 'Translating...', selectionPosition);

  // Send to background for translation
  chrome.runtime.sendMessage({
    action: 'translate',
    text,
    sourceLang,
    targetLang
  }, (response) => {
    if (response && response.translation) {
      // Update popup with translation
      showTranslationPopup(text, response.translation, selectionPosition, {
        apiUsed: response.apiUsed,
        confidence: response.confidence
      });
    } else {
      // Show error
      showTranslationPopup(text, 'Translation failed. Please try again.', selectionPosition);
    }
  });
}

// Get the position of the current selection
function getSelectionPosition() {
  const selection = window.getSelection();

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    selectionRange = range;

    const rect = range.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX + (rect.width / 2),
      y: rect.bottom + window.scrollY
    };
  }

  return null;
}

// Listen for translation requests from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translateText') {
    translateText(message.text, message.sourceLang, message.targetLang);
    sendResponse({ success: true });
    return true;
  }
});

// Add double-click translation
document.addEventListener('dblclick', (e) => {
  chrome.storage.sync.get(['enableDoubleClickTranslation', 'targetLanguage'], (result) => {
    if (result.enableDoubleClickTranslation) {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        const targetLang = result.targetLanguage || 'en';
        translateText(selectedText, 'auto', targetLang);
      }
    }
  });
});
