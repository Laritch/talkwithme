// Global variables
let messageThreading = null;
let messageQuoting = null;
let messageSharing = null;
let threadSummarizer = null;
let threadsTab = null;
let messageBookmarks = null;
let messageLabels = null;
let richTextEditor = null;
let attachmentViewer = null;
let typingIndicator = null; // Add TypingIndicator variable
let messageScheduler = null; // Add MessageScheduler variable

// Initialize all features when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Once the socket connection is established
  if (socket) {
    // Initialize status indicator
    initializeStatusIndicator();

    // Setup typing indicators
    setupPrivateTypingIndicator();
    setupGroupTypingIndicator();

    // Initialize sound system
    initSoundSystem();

    // Initialize message delivery tracker
    messageDeliveryTracker = new MessageDeliveryTracker(socket);

    // Initialize message reactions
    messageReactions = new MessageReactions(socket);

    // Initialize voice messages
    voiceMessageHandler = new VoiceMessageHandler(socket);

    // Initialize message threading
    messageThreading = new MessageThreading(socket);

    // Initialize message quoting
    messageQuoting = new MessageQuoting(socket);

    // Initialize message sharing
    messageSharing = new MessageSharing(socket);

    // Initialize thread summarizer
    threadSummarizer = new ThreadSummarizer(socket);

    // Initialize threads tab
    threadsTab = new ThreadsTab(socket);

    // Initialize message bookmarks
    messageBookmarks = new MessageBookmarks(socket);

    // Initialize message labels
    messageLabels = new MessageLabels(socket);

    // Initialize rich text editor
    richTextEditor = new RichTextEditor(socket);

    // Initialize attachment viewer
    attachmentViewer = new AttachmentViewer(socket);

    // Initialize enhanced typing indicator
    typingIndicator = new TypingIndicator(socket);

    // Initialize message scheduler
    messageScheduler = new MessageScheduler(socket);

    // Enhance the createMessageElement function with all features
    let enhancedCreateMessageElement = createMessageElement;
    enhancedCreateMessageElement = messageReactions.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = messageDeliveryTracker.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = voiceMessageHandler.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = messageThreading.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = messageQuoting.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = messageSharing.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = messageBookmarks.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = messageLabels.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = richTextEditor.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = attachmentViewer.enhanceCreateMessageElement(enhancedCreateMessageElement);
    enhancedCreateMessageElement = messageScheduler.enhanceCreateMessageElement ? messageScheduler.enhanceCreateMessageElement(enhancedCreateMessageElement) : enhancedCreateMessageElement;
    createMessageElement = enhancedCreateMessageElement;

    // Hook into the thread view creation
    const originalToggleThreadView = messageThreading.toggleThreadView;
    messageThreading.toggleThreadView = function(messageElement) {
      // First call the original method
      originalToggleThreadView.call(this, messageElement);

      // Then enhance the thread view with summarization
      setTimeout(() => {
        const threadView = document.querySelector(`.thread-view[data-parent-id="${messageElement.dataset.messageId}"]`);
        if (threadView) {
          threadSummarizer.enhanceThreadView(threadView);
        }
      }, 100);
    };
  }
});
