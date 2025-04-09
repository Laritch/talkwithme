import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { e2eeService, EncryptedMessage } from '../lib/encryption/e2eeService';

interface SecureMessageDisplayProps {
  encryptedMessage: EncryptedMessage;
  isOutgoing?: boolean;
  className?: string;
}

const SecureMessageDisplay: React.FC<SecureMessageDisplayProps> = ({
  encryptedMessage,
  isOutgoing = false,
  className = '',
}) => {
  const { data: session } = useSession();
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const decryptMessage = async () => {
      if (!session?.user?.id) {
        setError('Not authenticated');
        setIsDecrypting(false);
        return;
      }

      try {
        setIsDecrypting(true);
        setError(null);

        // Skip decryption for file attachments in this demo
        if (encryptedMessage.metadata?.messageType !== 'text') {
          setDecryptedContent(`[${encryptedMessage.metadata?.messageType || 'File'}]: ${encryptedMessage.metadata?.fileName || 'Attachment'}`);
          setIsVerified(true);
          return;
        }

        // Get user's keypair
        const userKeyPair = e2eeService.retrieveKeys(session.user.id);
        if (!userKeyPair) {
          setError('Encryption keys not found');
          return;
        }

        // Verify signature first (authentication)
        const isSignatureValid = e2eeService.verifySignature(
          encryptedMessage.encryptedContent,
          encryptedMessage.signature,
          encryptedMessage.senderPublicKey
        );

        setIsVerified(isSignatureValid);

        if (!isSignatureValid) {
          setError('Message signature verification failed');
          return;
        }

        // Decrypt the message
        // For outgoing messages, we use our private key with the recipient's public key
        // For incoming messages, we use our private key with the sender's public key
        const decrypted = e2eeService.decryptMessage(
          encryptedMessage.encryptedContent,
          encryptedMessage.nonce,
          encryptedMessage.senderPublicKey,
          userKeyPair.privateKey
        );

        setDecryptedContent(decrypted);
      } catch (err) {
        console.error('Error decrypting message:', err);
        setError('Failed to decrypt message');
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptMessage();
  }, [encryptedMessage, session]);

  // Base message style
  const messageStyle = `p-3 rounded-lg max-w-[85%] ${isOutgoing ? 'ml-auto bg-primary-50' : 'bg-white'} ${className}`;

  // If still decrypting, show a loading state
  if (isDecrypting) {
    return (
      <div className={`${messageStyle} animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // If there was an error decrypting
  if (error) {
    return (
      <div className={`${messageStyle} border border-red-200`}>
        <div className="flex items-center text-red-500 text-sm mb-1">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Decryption Error</span>
        </div>
        <p className="text-gray-500 text-sm">{error}</p>
        <p className="text-gray-400 text-xs mt-1">
          The message could not be decrypted. You may not have the correct keys.
        </p>
      </div>
    );
  }

  // File message display
  if (encryptedMessage.metadata?.messageType === 'file' || encryptedMessage.metadata?.messageType === 'image') {
    return (
      <div className={messageStyle}>
        <div className="flex items-center mb-2">
          <div className="rounded-full w-8 h-8 bg-gray-200 flex items-center justify-center mr-2">
            {encryptedMessage.metadata?.messageType === 'image' ? (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm truncate">{encryptedMessage.metadata?.fileName || 'File attachment'}</div>
            <div className="text-xs text-gray-500">
              {encryptedMessage.metadata?.fileSize
                ? `${(encryptedMessage.metadata.fileSize / 1024).toFixed(1)} KB`
                : 'Unknown size'}
            </div>
          </div>
          <button className="ml-2 text-primary-600 hover:text-primary-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {new Date(encryptedMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center text-green-600">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  // Text message display
  return (
    <div className={messageStyle}>
      {!isVerified && (
        <div className="flex items-center text-yellow-500 text-xs mb-1">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Unverified</span>
        </div>
      )}

      <p className="text-gray-800 whitespace-pre-wrap break-words">
        {decryptedContent}
      </p>

      <div className="flex items-center justify-between text-xs mt-1">
        <span className="text-gray-500">
          {new Date(encryptedMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex items-center text-green-600">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default SecureMessageDisplay;
