import React, { useState, useEffect, useRef } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession, signIn } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import ChatExportButton from '../components/ChatExportButton';
import NotificationSettings from '../components/NotificationSettings';
import SecureMessageInput from '../components/SecureMessageInput';
import SecureMessageDisplay from '../components/SecureMessageDisplay';
import { EncryptedMessage } from '../lib/encryption/e2eeService';
import { e2eeService } from '../lib/encryption/e2eeService';

// Demo recipient for encrypted messages
const DEMO_RECIPIENT = {
  id: 'recipient-123',
  name: 'Demo Recipient',
  publicKey: e2eeService.generateKeyPair().publicKey, // Generate a demo public key
};

export default function Chat() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [encryptedMessages, setEncryptedMessages] = useState<EncryptedMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check if the screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on initial load
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Clean up event listener
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [encryptedMessages]);

  // Handle sending an encrypted message
  const handleSendSecureMessage = (encryptedMessage: EncryptedMessage) => {
    // In a real app, you would send this to your API
    console.log('Sending encrypted message:', encryptedMessage);

    // For demo, just add to local state
    setEncryptedMessages(prev => [...prev, encryptedMessage]);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary-500 rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <Head>
          <title>Sign In Required | Instructor Chat System</title>
        </Head>
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo"
              width={64}
              height={64}
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to access the secure chat.
          </p>
          <button
            onClick={() => signIn(undefined, { callbackUrl: '/chat' })}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Secure Chat | Instructor Chat System</title>
        <meta name="description" content="End-to-end encrypted chat for instructors and students" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/icons/icon-192x192.png"
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              {!isMobile && (
                <span className="text-xl font-bold text-gray-900 ml-2">Instructor Chat</span>
              )}
            </Link>
          </div>
          <nav>
            <ul className="flex items-center space-x-4">
              <li>
                <Link
                  href="/"
                  className={`text-gray-600 hover:text-gray-900 ${isMobile ? 'p-2' : ''}`}
                >
                  {isMobile ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
                    </svg>
                  ) : (
                    'Home'
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className={`text-primary-600 font-medium ${isMobile ? 'p-2' : ''}`}
                >
                  {isMobile ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  ) : (
                    'Chat'
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/analytics"
                  className={`text-gray-600 hover:text-gray-900 ${isMobile ? 'p-2' : ''}`}
                >
                  {isMobile ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ) : (
                    'Analytics'
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className={`text-gray-600 hover:text-gray-900 ${isMobile ? 'p-2' : ''}`}
                >
                  {isMobile ? (
                    <div className="relative">
                      <Image
                        src={session.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || '')}&background=3b82f6&color=fff`}
                        alt={session.user.name || ''}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full"
                      />
                    </div>
                  ) : (
                    'Profile'
                  )}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  aria-label="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996-.608 2.296-.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col bg-white md:border-r border-gray-200">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white">
            <div className="flex items-center">
              <div className="mr-3 relative">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold">
                  {DEMO_RECIPIENT.name.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{DEMO_RECIPIENT.name}</h2>
                <div className="flex items-center">
                  <span className="flex h-2 w-2 rounded-full bg-green-400 mr-1.5"></span>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ChatExportButton
                messages={[]} // This would be your actual messages
                title="Secure Chat - Transcript"
                subtitle={`With ${DEMO_RECIPIENT.name}`}
                className="hidden md:inline-flex"
              />
              <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 md:hidden">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {encryptedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">End-to-End Encrypted Chat</h3>
                <p className="text-gray-500 max-w-sm">
                  Messages in this chat are secured with end-to-end encryption. Only you and {DEMO_RECIPIENT.name} can read them.
                </p>
                <div className="mt-6 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => {
                      // Generate a demo welcome message from recipient
                      const welcomeMessage: EncryptedMessage = {
                        encryptedContent: 'Welcome message (encrypted)',
                        nonce: 'welcome-nonce',
                        signature: 'welcome-signature',
                        senderPublicKey: DEMO_RECIPIENT.publicKey,
                        recipientId: session.user.id,
                        timestamp: Date.now(),
                        metadata: {
                          messageId: `welcome_${Date.now()}`,
                          messageType: 'text',
                          senderName: DEMO_RECIPIENT.name,
                          hasAttachments: false,
                        },
                      };
                      setEncryptedMessages([welcomeMessage]);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Start Conversation
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996-.608 2.296-.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {encryptedMessages.map((msg, index) => (
                  <div key={msg.metadata?.messageId || index} className="flex flex-col">
                    <SecureMessageDisplay
                      encryptedMessage={msg}
                      isOutgoing={msg.senderPublicKey !== DEMO_RECIPIENT.publicKey}
                      className="shadow-sm"
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <SecureMessageInput
              recipientId={DEMO_RECIPIENT.id}
              recipientPublicKey={DEMO_RECIPIENT.publicKey}
              onSendMessage={handleSendSecureMessage}
            />
          </div>
        </div>

        {/* Settings Panel - hidden on mobile unless toggled */}
        {showSettings && (
          <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 md:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <NotificationSettings
                className="mb-6"
                onStatusChange={(status) => console.log('Notification status:', status)}
              />

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">Privacy & Security</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span>End-to-End Encryption</span>
                    </div>
                    <span className="text-green-600 font-medium">Enabled</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Message Verification</span>
                    </div>
                    <span className="text-green-600 font-medium">Enabled</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <span>Chat Export</span>
                    </div>
                    <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                      Export
                    </button>
                  </div>

                  <div className="pt-3">
                    <button className="flex items-center text-red-600 hover:text-red-800">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Chat History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  return {
    props: {
      session,
    },
  };
};
