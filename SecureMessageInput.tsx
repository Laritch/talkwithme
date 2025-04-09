import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { e2eeService } from '../lib/encryption/e2eeService';

interface SecureMessageInputProps {
  recipientId: string;
  recipientPublicKey: string;
  onSendMessage: (encryptedMessage: any) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SecureMessageInput: React.FC<SecureMessageInputProps> = ({
  recipientId,
  recipientPublicKey,
  onSendMessage,
  disabled = false,
  placeholder = 'Type a secure message...',
}) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && !selectedFile) return;
    if (!session?.user?.id) {
      setError('You must be logged in to send secure messages');
      return;
    }

    try {
      setIsEncrypting(true);
      setError(null);

      // Get the sender's keypair, generating if it doesn't exist
      const senderKeyPair = e2eeService.ensureUserHasKeys(session.user.id);

      // Create a unique message ID
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // For text messages
      if (message.trim()) {
        // Encrypt the message content
        const { encryptedMessage, nonce } = e2eeService.encryptMessage(
          message,
          recipientPublicKey,
          senderKeyPair.privateKey
        );

        // Sign the encrypted message for verification
        const signature = e2eeService.signMessage(
          encryptedMessage,
          senderKeyPair.privateKey
        );

        // Create the encrypted message object
        const secureMessage = {
          encryptedContent: encryptedMessage,
          nonce,
          signature,
          senderPublicKey: senderKeyPair.publicKey,
          recipientId,
          timestamp: Date.now(),
          metadata: {
            messageId,
            messageType: 'text',
            senderName: session.user.name || 'Anonymous',
            hasAttachments: !!selectedFile,
          },
        };

        // Send the encrypted message
        onSendMessage(secureMessage);

        // Clear the input
        setMessage('');
      }

      // For file attachments
      if (selectedFile) {
        // In a real implementation, you would:
        // 1. Read the file as ArrayBuffer
        // 2. Encrypt the file content
        // 3. Upload the encrypted file to storage
        // 4. Send a message with the file reference

        // For this demo, we'll just send a placeholder
        const fileMessage = {
          encryptedContent: 'File attachment (encrypted)', // Placeholder
          nonce: 'file-nonce', // Placeholder
          signature: 'file-signature', // Placeholder
          senderPublicKey: senderKeyPair.publicKey,
          recipientId,
          timestamp: Date.now(),
          metadata: {
            messageId: `file_${messageId}`,
            messageType: selectedFile.type.startsWith('image/') ? 'image' : 'file',
            senderName: session.user.name || 'Anonymous',
            hasAttachments: true,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
          },
        };

        // Send the file message
        onSendMessage(fileMessage);

        // Clear the file selection
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error('Error sending secure message:', err);
      setError('Failed to encrypt and send message');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-2 mb-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center bg-gray-50 p-2 mb-2 rounded-md">
          <div className="flex-1 text-sm truncate">
            <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="ml-2 text-gray-500 hover:text-red-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        />

        <button
          type="button"
          onClick={handleAttachFile}
          disabled={disabled || isEncrypting}
          className="inline-flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <div className="relative flex-1 mx-2">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled || isEncrypting}
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:opacity-75 disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || isEncrypting || (!message.trim() && !selectedFile)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEncrypting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Encrypting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </>
          )}
        </button>
      </form>

      <div className="mt-1 flex justify-end">
        <span className="text-xs text-green-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          End-to-end encrypted
        </span>
      </div>
    </div>
  );
};

export default SecureMessageInput;
