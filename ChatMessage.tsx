'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MessageType,
  MessageStatus,
  Attachment as AttachmentType,
  MessageMetadata
} from '@/store/slices/chatSlice';
import { LockIcon, CheckIcon, Clock3Icon, AlertCircleIcon } from 'lucide-react';

/**
 * Properties for the ChatMessage component
 *
 * @property {string} id - Unique identifier for the message
 * @property {object} sender - Information about the message sender
 * @property {string} sender.id - Unique identifier for the sender
 * @property {string} sender.name - Display name of the sender
 * @property {string} [sender.avatar] - URL to the sender's avatar image
 * @property {string} sender.role - Role of the sender in the system
 * @property {string} content - The text content of the message
 * @property {Date} timestamp - When the message was sent
 * @property {MessageType} type - The type of message (text, image, etc.)
 * @property {MessageStatus} [status] - Delivery status of the message
 * @property {AttachmentType[]} [attachments] - Files attached to the message
 * @property {boolean} [isEncrypted] - Whether the message is encrypted
 * @property {MessageMetadata} [metadata] - Additional data about the message
 * @property {boolean} isCurrentUser - Whether this message was sent by the current user
 */
export interface ChatMessageProps {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: 'instructor' | 'student' | 'system' | 'client' | 'therapist' | 'legal_consultant';
  };
  content: string;
  timestamp: Date;
  type: MessageType;
  status?: MessageStatus;
  attachments?: AttachmentType[];
  isEncrypted?: boolean;
  metadata?: MessageMetadata;
  isCurrentUser: boolean;
}

/**
 * A component that renders a single message in a chat conversation.
 *
 * Displays the message with appropriate styling based on the sender,
 * shows attachments if present, and displays status indicators like
 * encryption and delivery status.
 *
 * @example
 * ```tsx
 * <ChatMessage
 *   id="msg1"
 *   sender={{
 *     id: "user1",
 *     name: "John Doe",
 *     role: "student"
 *   }}
 *   content="Hello, how are you?"
 *   timestamp={new Date()}
 *   type="text"
 *   isCurrentUser={true}
 * />
 * ```
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  sender,
  content,
  timestamp,
  type,
  status = 'sent',
  attachments = [],
  isEncrypted = false,
  isCurrentUser,
}) => {
  /**
   * Format timestamp to human-readable time
   * @returns Formatted time string
   */
  const formatTime = (): string => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Get status icon based on message delivery status
   * @returns React element with appropriate icon
   */
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock3Icon className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <CheckIcon className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckIcon className="h-3 w-3 text-blue-500" />;
      case 'read':
        return (
          <div className="flex">
            <CheckIcon className="h-3 w-3 text-green-500" />
            <CheckIcon className="h-3 w-3 text-green-500 -ml-1" />
          </div>
        );
      case 'failed':
        return <AlertCircleIcon className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  /**
   * Format file size to human-readable format
   * @param bytes Size in bytes
   * @returns Formatted size string (KB, MB, etc)
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  /**
   * Get file icon based on file type
   * @param fileType MIME type of the file
   * @returns React element with appropriate icon
   */
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <div className="h-4 w-4 text-blue-500">📷</div>;
    } else if (fileType.startsWith('video/')) {
      return <div className="h-4 w-4 text-red-500">🎥</div>;
    } else if (fileType.startsWith('audio/')) {
      return <div className="h-4 w-4 text-green-500">🎵</div>;
    } else if (fileType.includes('pdf')) {
      return <div className="h-4 w-4 text-red-700">📄</div>;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <div className="h-4 w-4 text-blue-700">📝</div>;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <div className="h-4 w-4 text-green-700">📊</div>;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <div className="h-4 w-4 text-orange-500">📊</div>;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <div className="h-4 w-4 text-yellow-700">📦</div>;
    } else {
      return <div className="h-4 w-4 text-gray-500">📄</div>;
    }
  };

  return (
    <div
      className={cn(
        'flex w-full gap-2',
        isCurrentUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} />
          <AvatarFallback className={sender.role === 'instructor' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
            {sender.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        'flex flex-col max-w-[75%]',
        isCurrentUser ? 'items-end' : 'items-start'
      )}>
        <div className={cn(
          'px-3 py-2 rounded-lg',
          isCurrentUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted rounded-bl-none'
        )}>
          {!isCurrentUser && (
            <div className="font-medium text-sm mb-1">{sender.name}</div>
          )}

          <div className="whitespace-pre-wrap break-words">
            {content}
          </div>

          {attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 rounded bg-background/80"
                >
                  {getFileIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">{attachment.name}</div>
                    <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <span>{formatTime()}</span>

          {isEncrypted && (
            <LockIcon className="h-3 w-3 text-green-600" />
          )}

          {isCurrentUser && (
            <span>
              {getStatusIcon()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
