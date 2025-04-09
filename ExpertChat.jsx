import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { translateText, LANGUAGES } from '../i18n/TranslationService';
import errorHandler from '../errorHandler';
import './ExpertChat.css';

// Sample expert data (in a real app, this would come from props or an API)
const sampleExpert = {
  id: 'expert-1',
  name: 'Jan de Vries',
  languages: ['en', 'nl', 'de'],
  expertise: ['Resource Organization', 'Digital Assets'],
  avatar: '👨‍🚀',
  rating: 4.8,
  reviews: 103,
  availability: {
    status: 'online',
    nextAvailable: null
  },
  communication: {
    supportedChannels: ['chat', 'video', 'audio', 'whiteboard', 'webinar'],
    preferredChannel: 'chat'
  },
  payment: {
    rate: 75,
    currency: 'USD',
    per: 'hour',
    methods: ['credit', 'paypal', 'crypto']
  }
};

// Sample user data (in a real app, this would come from auth context)
const currentUser = {
  id: 'user-1',
  name: 'Alex Johnson',
  languages: ['en'],
  avatar: '👨‍💻'
};

/**
 * ExpertChat Component
 *
 * Provides a chat interface for communicating with experts
 * with automatic translation capabilities.
 */
const ExpertChat = ({ expertId }) => {
  const { currentLanguage, translate } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [isExpertTyping, setIsExpertTyping] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContentRef = useRef(null);

  // Add refs for timers
  const typingTimerRef = useRef();
  const responseTimerRef = useRef();

  // Add new states for communication features
  const [activeChannel, setActiveChannel] = useState('chat');
  const [showCommunicationOptions, setShowCommunicationOptions] = useState(false);
  const [callStatus, setCallStatus] = useState(null); // 'connecting', 'active', 'ended'
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);

  // In a real app, expert would be fetched from API based on expertId
  const expert = sampleExpert;

  // Check if expert speaks user's language
  const expertSpeaksUserLanguage = expert.languages.includes(currentLanguage);
  const userNeedsTranslation = !expertSpeaksUserLanguage && currentLanguage !== 'en';

  // Common language for communication (if they don't share a native language)
  const sharedLanguage = expertSpeaksUserLanguage ? currentLanguage : 'en';

  // Load chat history when component mounts
  useEffect(() => {
    let isMounted = true; // Flag to track if component is mounted

    // In a real app, this would fetch actual chat history from API
    const timer = setTimeout(() => {
      if (isMounted) {
        setMessages(getSampleMessages());
        setIsLoading(false);
        setChatStarted(true);
      }
    }, 1000);

    // Clean up function to prevent memory leaks
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [expertId]);

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Format timestamp to local time string
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for separators
  const formatDate = (timestamp) => {
    const today = new Date();
    const messageDate = new Date(timestamp);

    if (today.toDateString() === messageDate.toDateString()) {
      return 'Today';
    } else if (new Date(today - 86400000).toDateString() === messageDate.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  // Check if a new date separator is needed
  const needsDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;

    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();

    return currentDate !== prevDate;
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    // Create new message from user
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser,
      text: messageInput,
      timestamp: new Date(),
      translated: false
    };

    // If auto-translate is on and the expert doesn't speak user's language,
    // translate the message to the shared language
    if (userNeedsTranslation && autoTranslate && !expertSpeaksUserLanguage) {
      try {
        const translatedText = await translateText(
          messageInput,
          sharedLanguage, // Translate to the language the expert understands
          currentLanguage // From user's language
        );

        newMessage.translatedText = translatedText;
        newMessage.translated = true;
        newMessage.originalLanguage = currentLanguage;
        newMessage.showOriginal = false; // Initially show translation
      } catch (error) {
        // Use our error handler to log and diagnose the issue
        errorHandler.logError(error, {
          component: 'ExpertChat',
          action: 'handleSendMessage',
          sourceText: messageInput,
          sourceLang: currentLanguage,
          targetLang: sharedLanguage
        });

        // Continue with untranslated message
        newMessage.translationError = true;
        newMessage.translationErrorMessage = 'Could not translate your message.';
      }
    }

    setMessageInput('');
    setMessages(prevMessages => [...prevMessages, newMessage]);

    // Clear any existing timers
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
    }

    // Simulate expert typing response
    typingTimerRef.current = setTimeout(() => {
      setIsExpertTyping(true);

      // Simulate expert response after typing
      responseTimerRef.current = setTimeout(() => {
        setIsExpertTyping(false);
        receiveExpertMessage();
      }, 2000 + Math.random() * 1000);
    }, 1000);
  };

  // Handle key press in input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Receive a message from the expert
  const receiveExpertMessage = async () => {
    // Get a response appropriate to the conversation stage
    const responseText = getExpertResponse(messages.length);

    // Determine the language of the expert's response
    const responseLanguage = expertSpeaksUserLanguage ? currentLanguage : 'en';

    // Create response message object
    const message = {
      id: `msg-${Date.now()}`,
      sender: expert,
      text: responseText,
      timestamp: new Date(),
      translated: false,
      originalLanguage: responseLanguage
    };

    // If user needs translation and auto-translate is on, translate the message
    if (userNeedsTranslation && autoTranslate) {
      try {
        console.log(`Translating from ${responseLanguage} to ${currentLanguage}`);

        const translatedText = await translateText(
          responseText,
          currentLanguage, // Translate to user's language
          responseLanguage // From expert's language
        );

        console.log('Translation result:', translatedText);

        message.translatedText = translatedText;
        message.translated = true;
        message.showOriginal = false; // Initially show translation
      } catch (error) {
        console.error('Translation error when receiving:', error);

        // Use our error handler to log and diagnose the issue
        errorHandler.logError(error, {
          component: 'ExpertChat',
          action: 'receiveExpertMessage',
          sourceText: responseText,
          sourceLang: responseLanguage,
          targetLang: currentLanguage
        });

        // If translation fails, show original text
        message.translated = false;

        // Add a notification about translation failure
        message.translationError = true;
        message.translationErrorMessage = 'Translation failed. Showing original message.';
      }
    }

    setMessages(prevMessages => [...prevMessages, message]);
  };

  // Toggle translation for a specific message
  const toggleMessageTranslation = async (messageId) => {
    setMessages(messages.map(message => {
      if (message.id === messageId) {
        return {
          ...message,
          showOriginal: !message.showOriginal
        };
      }
      return message;
    }));
  };

  // Toggle automatic translation
  const toggleAutoTranslation = async () => {
    const newAutoTranslate = !autoTranslate;
    setAutoTranslate(newAutoTranslate);

    // If turning on auto-translate, translate all existing messages
    if (newAutoTranslate && userNeedsTranslation) {
      const updatedMessages = await Promise.all(
        messages.map(async (message) => {
          // Only translate messages that aren't already translated
          if (!message.translated) {
            // Determine direction of translation
            const isFromExpert = message.sender.id === expert.id;
            const sourceLang = isFromExpert ?
              (expertSpeaksUserLanguage ? currentLanguage : 'en') : currentLanguage;
            const targetLang = isFromExpert ? currentLanguage : sharedLanguage;

            // Skip if source and target are the same
            if (sourceLang === targetLang) {
              return message;
            }

            try {
              const translatedText = await translateText(
                message.text,
                targetLang,
                sourceLang
              );

              return {
                ...message,
                translatedText,
                translated: true,
                originalLanguage: sourceLang,
                showOriginal: false
              };
            } catch (error) {
              console.error('Translation error during toggle:', error);
              return message;
            }
          }
          return message;
        })
      );

      setMessages(updatedMessages);
    }
  };

  // Sample conversation flow based on message count
  const getExpertResponse = (messageCount) => {
    const responses = [
      "Hello! I'd be happy to help with your resource organization questions. What specific aspects are you working on?",
      "That's a great question. For digital asset management, I recommend starting with a clear tagging system that aligns with your workflow.",
      "You might want to consider a hierarchical folder structure with descriptive naming conventions. This has worked well for many of my clients.",
      "Exactly! Consistency is key. Let me know if you need any specific examples for your use case.",
      "I've worked on similar projects before. The main challenge is usually balancing organization with ease of access.",
      "Would you like me to review your current organization system and provide specific recommendations?",
      "I'd be happy to schedule a more in-depth consultation to go through this in detail if that would be helpful.",
      "Great! I'm looking forward to helping you implement these improvements.",
      "Feel free to reach out anytime if you have more questions about resource organization."
    ];

    // For Dutch responses (when expert speaks user's language)
    const dutchResponses = [
      "Hallo! Ik help je graag met je vragen over resourcebeheer. Aan welke specifieke aspecten werk je?",
      "Dat is een goede vraag. Voor digitaal assetbeheer raad ik aan te beginnen met een duidelijk tagsysteem dat aansluit bij je workflow.",
      "Je kunt overwegen om een hiërarchische mapstructuur te gebruiken met beschrijvende naamconventies. Dit heeft goed gewerkt voor veel van mijn klanten.",
      "Precies! Consistentie is essentieel. Laat me weten of je specifieke voorbeelden nodig hebt voor jouw situatie.",
      "Ik heb eerder aan vergelijkbare projecten gewerkt. De grootste uitdaging is meestal het vinden van de juiste balans tussen organisatie en toegankelijkheid.",
      "Wil je dat ik je huidige organisatiesysteem bekijk en specifieke aanbevelingen doe?",
      "Ik plan graag een uitgebreider overleg om dit in detail door te nemen als dat nuttig zou zijn.",
      "Geweldig! Ik kijk ernaar uit om je te helpen deze verbeteringen te implementeren.",
      "Voel je vrij om contact op te nemen als je meer vragen hebt over resourcebeheer."
    ];

    // Return Dutch responses if expert speaks Dutch and user's language is Dutch
    if (expert.languages.includes('nl') && currentLanguage === 'nl') {
      return dutchResponses[messageCount % dutchResponses.length];
    }

    return responses[messageCount % responses.length];
  };

  // Get sample messages for loading initial conversation
  const getSampleMessages = () => {
    const now = new Date();
    const yesterday = new Date(now - 86400000);

    return [
      {
        id: 'msg-1',
        sender: currentUser,
        text: 'Hi Jan, I need some help organizing my digital resources for a project.',
        timestamp: yesterday,
        translated: false
      },
      {
        id: 'msg-2',
        sender: expert,
        text: "Hello! I'd be happy to help with your resource organization questions. What specific aspects are you working on?",
        timestamp: new Date(yesterday.getTime() + 2 * 60000),
        translated: userNeedsTranslation,
        translatedText: "Hallo! Ik help je graag met je vragen over resourcebeheer. Aan welke specifieke aspecten werk je?",
        originalLanguage: 'en',
        showOriginal: false
      },
      {
        id: 'msg-3',
        sender: currentUser,
        text: "I'm managing a large collection of design assets and documents. I'm finding it hard to keep everything organized and easily accessible.",
        timestamp: new Date(yesterday.getTime() + 5 * 60000),
        translated: false
      },
      {
        id: 'msg-4',
        sender: expert,
        text: "That's a common challenge. For digital asset management, I recommend starting with a clear tagging system that aligns with your workflow.",
        timestamp: new Date(yesterday.getTime() + 8 * 60000),
        translated: userNeedsTranslation,
        translatedText: "Dat is een veelvoorkomende uitdaging. Voor digitaal assetbeheer raad ik aan te beginnen met een duidelijk tagsysteem dat aansluit bij je workflow.",
        originalLanguage: 'en',
        showOriginal: false
      },
      {
        id: 'msg-5',
        sender: currentUser,
        text: "That makes sense. Should I also think about folder structure or just rely on tags?",
        timestamp: now,
        translated: false
      }
    ];
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="expert-chat-container">
        <div className="chat-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading conversation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="expert-avatar">{expert.avatar}</div>
          <div className="expert-info">
            <div className="expert-name">{expert.name}</div>
            <div className="expert-languages">
              {expert.languages.map(lang => (
                <span
                  key={lang}
                  className={`expert-language ${lang === currentLanguage ? 'preferred' : ''}`}
                  title={LANGUAGES[lang]?.name}
                >
                  {LANGUAGES[lang]?.flag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="chat-options">
          {userNeedsTranslation && (
            <div className="language-indicator">
              <span className="language-indicator-flag">{LANGUAGES[sharedLanguage]?.flag}</span>
              <span>Speaking in {LANGUAGES[sharedLanguage]?.name}</span>
            </div>
          )}

          {/* Display expert status */}
          <div className="expert-status">
            <span className={`status-indicator ${expert.availability.status}`}></span>
            <span>{expert.availability.status === 'online' ? 'Online' : 'Offline'}</span>
          </div>

          {/* Communication buttons */}
          <button
            className={`chat-option-btn ${activeChannel === 'video' ? 'active' : ''}`}
            title="Video Call"
            onClick={() => {
              if (activeChannel !== 'video') {
                setActiveChannel('video');
                setCallStatus('connecting');
                // Simulate connection delay
                setTimeout(() => setCallStatus('active'), 2000);
              } else {
                setActiveChannel('chat');
                setCallStatus(null);
              }
            }}
          >
            <span role="img" aria-label="Video Call">📹</span>
          </button>

          <button
            className={`chat-option-btn ${activeChannel === 'audio' ? 'active' : ''}`}
            title="Audio Call"
            onClick={() => {
              if (activeChannel !== 'audio') {
                setActiveChannel('audio');
                setCallStatus('connecting');
                // Simulate connection delay
                setTimeout(() => setCallStatus('active'), 1500);
              } else {
                setActiveChannel('chat');
                setCallStatus(null);
              }
            }}
          >
            <span role="img" aria-label="Audio Call">🎧</span>
          </button>

          <button
            className={`chat-option-btn ${whiteboardActive ? 'active' : ''}`}
            title="Whiteboard"
            onClick={() => setWhiteboardActive(!whiteboardActive)}
          >
            <span role="img" aria-label="Whiteboard">🖌️</span>
          </button>

          <button
            className="chat-option-btn"
            title="Schedule Meeting"
            onClick={() => window.location.hash = '#scheduler'}
          >
            <span role="img" aria-label="Schedule">📅</span>
          </button>

          <button
            className={`chat-option-btn ${showPaymentPanel ? 'active' : ''}`}
            title="Payment Options"
            onClick={() => setShowPaymentPanel(!showPaymentPanel)}
          >
            <span role="img" aria-label="Payment">💳</span>
          </button>

          <button
            className={`chat-option-btn ${showCommunicationOptions ? 'active' : ''}`}
            title="More Options"
            onClick={() => setShowCommunicationOptions(!showCommunicationOptions)}
          >
            <span role="img" aria-label="More">⋯</span>
          </button>
        </div>
      </div>

      {/* Communication options dropdown */}
      {showCommunicationOptions && (
        <div className="communication-options-dropdown">
          <div className="communication-option" onClick={() => { setShowCommunicationOptions(false); }}>
            <span role="img" aria-label="Email">📧</span>
            <span>Send Email</span>
          </div>
          <div className="communication-option" onClick={() => { setShowCommunicationOptions(false); }}>
            <span role="img" aria-label="Webinar">👥</span>
            <span>Join Webinar</span>
          </div>
          <div className="communication-option" onClick={() => { setShowCommunicationOptions(false); }}>
            <span role="img" aria-label="File">📁</span>
            <span>Send Files</span>
          </div>
          <div className="communication-option" onClick={() => { setShowCommunicationOptions(false); }}>
            <span role="img" aria-label="Screen">🖥️</span>
            <span>Share Screen</span>
          </div>
        </div>
      )}

      {/* Payment panel */}
      {showPaymentPanel && (
        <div className="payment-panel">
          <div className="payment-header">
            <h3>Payment Options</h3>
            <button className="close-btn" onClick={() => setShowPaymentPanel(false)}>×</button>
          </div>
          <div className="payment-details">
            <div className="rate-info">
              <div>Rate: {expert.payment.rate} {expert.payment.currency}/{expert.payment.per}</div>
              <div>Estimated cost for this session: {expert.payment.rate} {expert.payment.currency}</div>
            </div>
            <div className="payment-methods">
              <div className="payment-method-label">Select payment method:</div>
              <div className="payment-method-options">
                {expert.payment.methods.map(method => (
                  <button key={method} className="payment-method-option">
                    {method === 'credit' && <span role="img" aria-label="Credit Card">💳 Credit Card</span>}
                    {method === 'paypal' && <span role="img" aria-label="PayPal">💰 PayPal</span>}
                    {method === 'crypto' && <span role="img" aria-label="Crypto">💎 Crypto</span>}
                  </button>
                ))}
              </div>
            </div>
            <button className="payment-submit-btn">Proceed to Payment</button>
          </div>
        </div>
      )}

      {/* Active call overlay */}
      {callStatus && (
        <div className={`call-overlay ${callStatus}`}>
          {callStatus === 'connecting' ? (
            <div className="call-connecting">
              <div className="call-spinner"></div>
              <div>Connecting {activeChannel === 'video' ? 'video' : 'audio'} call...</div>
            </div>
          ) : (
            <div className="active-call">
              <div className="call-participant">
                {activeChannel === 'video' ? (
                  <div className="video-placeholder">
                    <div className="expert-large-avatar">{expert.avatar}</div>
                  </div>
                ) : (
                  <div className="audio-indicator">
                    <div className="audio-wave">
                      <span></span><span></span><span></span><span></span><span></span>
                    </div>
                    <div className="expert-large-avatar">{expert.avatar}</div>
                  </div>
                )}
                <div className="participant-name">{expert.name}</div>
              </div>
              <div className="call-controls">
                <button className="call-control-btn mute">
                  <span role="img" aria-label="Mute">🔇</span>
                </button>
                {activeChannel === 'video' && (
                  <button className="call-control-btn camera">
                    <span role="img" aria-label="Camera">📷</span>
                  </button>
                )}
                <button
                  className="call-control-btn end-call"
                  onClick={() => {
                    setActiveChannel('chat');
                    setCallStatus(null);
                  }}
                >
                  <span role="img" aria-label="End Call">📞</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Whiteboard panel */}
      {whiteboardActive && (
        <div className="whiteboard-panel">
          <div className="whiteboard-header">
            <h3>Collaborative Whiteboard</h3>
            <button className="close-btn" onClick={() => setWhiteboardActive(false)}>×</button>
          </div>
          <div className="whiteboard-canvas">
            <div className="whiteboard-placeholder">
              <span role="img" aria-label="Drawing">🖌️</span>
              <p>Whiteboard would be displayed here</p>
            </div>
          </div>
          <div className="whiteboard-tools">
            <button className="tool-btn"><span role="img" aria-label="Pen">✏️</span></button>
            <button className="tool-btn"><span role="img" aria-label="Eraser">🧽</span></button>
            <button className="tool-btn"><span role="img" aria-label="Text">📝</span></button>
            <button className="tool-btn"><span role="img" aria-label="Shapes">⭕</span></button>
            <button className="clear-btn">Clear All</button>
          </div>
        </div>
      )}

      {/* Chat Content */}
      <div className="chat-content" ref={chatContentRef}>
        {!chatStarted ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">
              <span role="img" aria-label="Start chat">💬</span>
            </div>
            <h3 className="empty-chat-title">Start a conversation with {expert.name}</h3>
            <p className="empty-chat-description">
              {expert.name} speaks {expert.languages.map(lang => LANGUAGES[lang]?.name).join(', ')}.
              {!expertSpeaksUserLanguage && " Don't worry, we'll automatically translate messages for you."}
            </p>
          </div>
        ) : (
          <>
            {userNeedsTranslation && autoTranslate && (
              <div className="automatic-translation-indicator">
                <span role="img" aria-label="Translation">🔄</span>
                <span>Automatic translation is enabled</span>
              </div>
            )}

            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const needsSeparator = needsDateSeparator(message, prevMessage);

              return (
                <React.Fragment key={message.id}>
                  {needsSeparator && (
                    <div className="chat-day-divider">
                      {formatDate(message.timestamp)}
                    </div>
                  )}

                  <div className={`message ${message.sender.id === currentUser.id ? 'from-user' : 'from-expert'}`}>
                    <div className="message-avatar">
                      {message.sender.avatar}
                    </div>
                    <div className="message-bubble">
                      <div className="message-content">
                        {message.translated ? (
                          <>
                            {message.showOriginal ? (
                              <>
                                <div>{message.text}</div>
                                <div className="translation-indicator">
                                  Original in {LANGUAGES[message.originalLanguage]?.name}
                                </div>
                                <button
                                  onClick={() => toggleMessageTranslation(message.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#4a90e2',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: '4px 0'
                                  }}
                                >
                                  Show translation
                                </button>
                              </>
                            ) : (
                              <>
                                <div>{message.translatedText}</div>
                                <div className="translation-indicator">
                                  Translated from {LANGUAGES[message.originalLanguage]?.name}
                                </div>
                                <button
                                  onClick={() => toggleMessageTranslation(message.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#4a90e2',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: '4px 0'
                                  }}
                                >
                                  Show original
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div>{message.text}</div>
                            {message.translationError && (
                              <div className="translation-error-indicator">
                                {message.translationErrorMessage}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="message-meta">
                        <div className="message-time">{formatTime(message.timestamp)}</div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {isExpertTyping && (
              <div className="typing-indicator">
                <div className="message-avatar">
                  {expert.avatar}
                </div>
                <div className="typing-animation">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
          >
            <span role="img" aria-label="Send">➤</span>
          </button>
        </div>

        {userNeedsTranslation && (
          <div className="chat-translation-toggle">
            <label>
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={toggleAutoTranslation}
              />
              <span>Automatically translate messages ({LANGUAGES[currentLanguage]?.name} ↔ {LANGUAGES[sharedLanguage]?.name})</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertChat;
