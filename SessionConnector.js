import React, { useState, useEffect, useRef } from 'react';

/**
 * SessionConnector - Provides a unified interface for experts and clients
 * to connect via video, audio, whiteboard, and chat during live sessions.
 */
const SessionConnector = ({
  sessionId,
  participantType, // 'expert' or 'client'
  features = { video: true, audio: true, chat: true, whiteboard: true },
  onEnd,
  onError
}) => {
  // State for various connection aspects
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [activeFeatures, setActiveFeatures] = useState({
    video: features.video,
    audio: features.audio,
    chat: features.chat,
    whiteboard: features.whiteboard
  });
  const [error, setError] = useState(null);
  const [layout, setLayout] = useState('default'); // 'default', 'videoFocus', 'whiteboardFocus', 'chatFocus'

  // References for media elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const whiteboardRef = useRef(null);

  // Mock connection objects (in a real app, these would be WebRTC connections)
  const [videoConnection, setVideoConnection] = useState(null);
  const [audioConnection, setAudioConnection] = useState(null);
  const [whiteboardConnection, setWhiteboardConnection] = useState(null);
  const [chatConnection, setChatConnection] = useState(null);

  // Chat messages
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Simulate connection setup
  useEffect(() => {
    const setupConnections = async () => {
      try {
        setLoading(true);

        // Simulate API calls to establish connections
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Set up mock connections
        setVideoConnection({ status: 'connected', quality: 'high' });
        setAudioConnection({ status: 'connected', quality: 'high' });
        setWhiteboardConnection({ status: 'connected' });
        setChatConnection({ status: 'connected' });

        setConnected(true);
        setLoading(false);
      } catch (err) {
        console.error('Failed to establish session connections:', err);
        setError('Failed to connect to the session. Please try again.');
        setLoading(false);
        if (onError) onError(err);
      }
    };

    setupConnections();

    // Cleanup connections when component unmounts
    return () => {
      // Close all connections
      if (videoConnection) {
        // videoConnection.close()
      }
      if (audioConnection) {
        // audioConnection.close()
      }
      if (whiteboardConnection) {
        // whiteboardConnection.close()
      }
      if (chatConnection) {
        // chatConnection.close()
      }
    };
  }, [sessionId, onError]);

  // Toggle a feature on/off
  const toggleFeature = (feature) => {
    setActiveFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));

    // Additional logic for when features are toggled
    // For example, stopping video stream when video is toggled off
  };

  // Send a chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: participantType,
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // In a real app, this would send the message through the chatConnection
  };

  // End the session
  const endSession = () => {
    // Close connections and clean up
    setConnected(false);

    if (onEnd) onEnd();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Connecting to session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top control bar */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900 dark:text-white">Live Session</span>
          {connected && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Connected
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Layout toggle */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setLayout('default')}
              className={`p-1 rounded ${layout === 'default' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setLayout('videoFocus')}
              className={`p-1 rounded ${layout === 'videoFocus' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setLayout('whiteboardFocus')}
              className={`p-1 rounded ${layout === 'whiteboardFocus' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </button>
          </div>

          {/* Feature toggles */}
          <div className="flex items-center space-x-2">
            {features.video && (
              <button
                onClick={() => toggleFeature('video')}
                className={`p-2 rounded-full ${activeFeatures.video ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}

            {features.audio && (
              <button
                onClick={() => toggleFeature('audio')}
                className={`p-2 rounded-full ${activeFeatures.audio ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}

            {features.chat && (
              <button
                onClick={() => toggleFeature('chat')}
                className={`p-2 rounded-full ${activeFeatures.chat ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            )}

            {features.whiteboard && (
              <button
                onClick={() => toggleFeature('whiteboard')}
                className={`p-2 rounded-full ${activeFeatures.whiteboard ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}
          </div>

          {/* End session button */}
          <button
            onClick={endSession}
            className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area - layout depends on the selected layout */}
      <div className="flex-grow flex overflow-hidden">
        {layout === 'default' && (
          <div className="flex flex-col md:flex-row w-full">
            {/* Video section - conditionally shown based on activeFeatures */}
            {activeFeatures.video && (
              <div className="w-full md:w-2/3 bg-black relative">
                {/* Remote video (the other participant) */}
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />

                {/* Local video (picture-in-picture) */}
                <div className="absolute bottom-4 right-4 w-1/4 h-1/4 border-2 border-white rounded overflow-hidden">
                  <video
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                </div>
              </div>
            )}

            {/* Side panel - contains whiteboard and/or chat */}
            <div className={`flex flex-col ${activeFeatures.video ? 'w-full md:w-1/3' : 'w-full'}`}>
              {/* Whiteboard area */}
              {activeFeatures.whiteboard && (
                <div className="h-1/2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div ref={whiteboardRef} className="w-full h-full">
                    {/* Whiteboard canvas would go here */}
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">Whiteboard area</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat area */}
              {activeFeatures.chat && (
                <div className={`${activeFeatures.whiteboard ? 'h-1/2' : 'h-full'} flex flex-col bg-gray-50 dark:bg-gray-800`}>
                  <div className="flex-grow overflow-y-auto p-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`mb-3 ${message.sender === participantType ? 'text-right' : 'text-left'}`}
                      >
                        <div
                          className={`inline-block rounded-lg px-4 py-2 max-w-xs ${
                            message.sender === participantType
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-grow py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video Focus Layout */}
        {layout === 'videoFocus' && activeFeatures.video && (
          <div className="w-full bg-black">
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
            />

            <div className="absolute bottom-4 right-4 w-1/5 h-1/5 border-2 border-white rounded overflow-hidden">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            </div>
          </div>
        )}

        {/* Whiteboard Focus Layout */}
        {layout === 'whiteboardFocus' && activeFeatures.whiteboard && (
          <div className="w-full bg-white dark:bg-gray-800">
            <div ref={whiteboardRef} className="w-full h-full">
              {/* Whiteboard canvas would go here */}
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">Whiteboard area (expanded)</span>
              </div>
            </div>

            {activeFeatures.video && (
              <div className="absolute bottom-4 right-4 w-1/5 h-1/5 border-2 border-white rounded overflow-hidden">
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionConnector;
