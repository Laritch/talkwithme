import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Conversation, Message, Participant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Paperclip, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ConversationList from './ConversationList';
import MessageList from './MessageList';

// Mock data for demo purposes
const MOCK_CONVERSATIONS: Record<string, Conversation> = {
  'conv-1': {
    id: 'conv-1',
    title: 'John Doe',
    participants: [
      {
        userId: 'usr-1',
        username: 'John Doe',
        avatar: '/uploads/default-avatar.png',
        role: 'client',
        isActive: true,
        status: 'online'
      },
      {
        userId: 'usr-2',
        username: 'You',
        avatar: '/uploads/default-avatar.png',
        role: 'expert',
        isActive: true,
        status: 'online'
      }
    ],
    unreadCount: 2,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isGroupChat: false,
    category: 'client'
  },
  'conv-2': {
    id: 'conv-2',
    title: 'Sarah Williams',
    participants: [
      {
        userId: 'usr-3',
        username: 'Sarah Williams',
        avatar: '/uploads/default-avatar.png',
        role: 'client',
        isActive: true,
        status: 'away'
      },
      {
        userId: 'usr-2',
        username: 'You',
        avatar: '/uploads/default-avatar.png',
        role: 'expert',
        isActive: true,
        status: 'online'
      }
    ],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isGroupChat: false,
    category: 'client'
  },
  'conv-3': {
    id: 'conv-3',
    title: 'Tax Consultation Experts',
    participants: [
      {
        userId: 'usr-4',
        username: 'Michael Chen',
        avatar: '/uploads/default-avatar.png',
        role: 'expert',
        isActive: true,
        status: 'online'
      },
      {
        userId: 'usr-5',
        username: 'Amanda Rodriguez',
        avatar: '/uploads/default-avatar.png',
        role: 'expert',
        isActive: true,
        status: 'offline'
      },
      {
        userId: 'usr-2',
        username: 'You',
        avatar: '/uploads/default-avatar.png',
        role: 'expert',
        isActive: true,
        status: 'online'
      }
    ],
    unreadCount: 5,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    isGroupChat: true,
    category: 'expert'
  }
};

// Mock messages for demo purposes
const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'usr-1',
      senderName: 'John Doe',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'Hello! I need some help with my tax return. Do you have availability to discuss?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'usr-2',
      senderName: 'You',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'Hi John! Yes, I would be happy to help you with your tax return. What specific questions do you have?',
      timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'usr-1',
      senderName: 'John Doe',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'I have some questions about deductions for my home office. I started working remotely this year and I'm not sure what expenses I can claim.',
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-4',
      conversationId: 'conv-1',
      senderId: 'usr-2',
      senderName: 'You',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'That's a great question! For home office deductions, you can generally deduct expenses that are directly related to the business use of your home. This includes a portion of your rent or mortgage, utilities, internet, and office supplies. Would you like to schedule a consultation to go through the details?',
      timestamp: new Date(Date.now() - 1.2 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-5',
      conversationId: 'conv-1',
      senderId: 'usr-1',
      senderName: 'John Doe',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'That would be helpful. When are you available next week?',
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      isRead: false
    }
  ],
  'conv-2': [
    {
      id: 'msg-6',
      conversationId: 'conv-2',
      senderId: 'usr-3',
      senderName: 'Sarah Williams',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'I just received a notice from the IRS about an audit. Can you help me prepare?',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-7',
      conversationId: 'conv-2',
      senderId: 'usr-2',
      senderName: 'You',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'I specialize in handling IRS audits. Let me help you navigate this process. Can you share more details about the notice?',
      timestamp: new Date(Date.now() - 4.8 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-8',
      conversationId: 'conv-2',
      senderId: 'usr-3',
      senderName: 'Sarah Williams',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'It's regarding my 2022 tax return. They're questioning some of my business deductions.',
      timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-9',
      conversationId: 'conv-2',
      senderId: 'usr-2',
      senderName: 'You',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'I understand how stressful this can be. Let's schedule a video call to go over the notice and I'll help you prepare all the necessary documentation.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    }
  ],
  'conv-3': [
    {
      id: 'msg-10',
      conversationId: 'conv-3',
      senderId: 'usr-4',
      senderName: 'Michael Chen',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'Team, has anyone dealt with the new Section 199A deduction rules for pass-through entities?',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-11',
      conversationId: 'conv-3',
      senderId: 'usr-2',
      senderName: 'You',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'Yes, I've been working with several clients on this. The rules have some nuances depending on the business structure and income thresholds.',
      timestamp: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-12',
      conversationId: 'conv-3',
      senderId: 'usr-5',
      senderName: 'Amanda Rodriguez',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'I've also created a worksheet that helps calculate the deduction based on different scenarios. I can share it with the team.',
      timestamp: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-13',
      conversationId: 'conv-3',
      senderId: 'usr-4',
      senderName: 'Michael Chen',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'That would be extremely helpful, Amanda. I have a client who could benefit from that analysis.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-14',
      conversationId: 'conv-3',
      senderId: 'usr-5',
      senderName: 'Amanda Rodriguez',
      senderAvatar: '/uploads/default-avatar.png',
      text: 'Here's the worksheet I mentioned. Let me know if you have any questions!',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      isRead: false,
      attachments: [
        {
          id: 'att-1',
          name: 'Section_199A_Analysis_Worksheet.xlsx',
          type: 'document',
          url: '#',
          size: 2500000
        }
      ]
    }
  ]
};

export function ChatInterface() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Record<string, Conversation>>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages when conversation changes or new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversationId, messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversationId && conversations[selectedConversationId]?.unreadCount > 0) {
      // Simulate marking messages as read
      setConversations(prev => ({
        ...prev,
        [selectedConversationId]: {
          ...prev[selectedConversationId],
          unreadCount: 0
        }
      }));

      // Also update the isRead flag on messages
      setMessages(prev => {
        if (!prev[selectedConversationId]) return prev;

        return {
          ...prev,
          [selectedConversationId]: prev[selectedConversationId].map(message => ({
            ...message,
            isRead: true
          }))
        };
      });
    }
  }, [selectedConversationId, conversations]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId || !user) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversationId,
      senderId: user.id,
      senderName: user.username,
      senderAvatar: user.profilePicture,
      text: messageInput.trim(),
      timestamp: new Date().toISOString(),
      isRead: true
    };

    // Add the new message to the conversation
    setMessages(prev => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage]
    }));

    // Update the conversation's last message and time
    setConversations(prev => ({
      ...prev,
      [selectedConversationId]: {
        ...prev[selectedConversationId],
        updatedAt: new Date().toISOString(),
        lastMessage: newMessage
      }
    }));

    // Clear the input
    setMessageInput('');

    // Simulate receiving a response after a delay
    simReceiveTypingIndicator(selectedConversationId);
  };

  const simReceiveTypingIndicator = (conversationId: string) => {
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Show typing indicator after a delay
    setTimeout(() => {
      setIsTyping(true);

      // Simulate response time (between 2-5 seconds)
      const responseTime = Math.floor(Math.random() * 3000) + 2000;
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        simReceiveResponse(conversationId);
      }, responseTime);
    }, 1000);
  };

  const simReceiveResponse = (conversationId: string) => {
    // Get the conversation details
    const conversation = conversations[conversationId];
    if (!conversation) return;

    // Find a participant other than the current user
    const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
    if (!otherParticipant) return;

    const responseOptions = [
      "Thank you for your message. Let me check on that for you.",
      "I appreciate you getting in touch. Can you provide more details?",
      "That's a great question! I'll prepare some information for our next session.",
      "I understand your concern. Let's schedule a call to discuss this further.",
      "I've made a note of this and will include it in our consultation agenda.",
      "Thanks for sharing. This will help me better prepare for our next meeting."
    ];

    const randomResponse = responseOptions[Math.floor(Math.random() * responseOptions.length)];

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conversationId,
      senderId: otherParticipant.userId,
      senderName: otherParticipant.username,
      senderAvatar: otherParticipant.avatar,
      text: randomResponse,
      timestamp: new Date().toISOString(),
      isRead: true
    };

    // Add the new message
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    // Update the conversation's last message and time
    setConversations(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        updatedAt: new Date().toISOString(),
        lastMessage: newMessage
      }
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const selectedConversation = selectedConversationId
    ? conversations[selectedConversationId]
    : null;

  const conversationMessages = selectedConversationId && messages[selectedConversationId]
    ? messages[selectedConversationId]
    : [];

  // Group messages by date for display
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {};

    for (const message of messages) {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    }

    return Object.entries(groups);
  };

  const messageGroups = groupMessagesByDate(conversationMessages);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Sidebar with conversations */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>

        {/* List of conversations */}
        <div className="overflow-y-auto flex-grow">
          {Object.values(conversations).map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 border-b cursor-pointer hover:bg-accent/50 transition-colors ${
                selectedConversationId === conversation.id ? 'bg-accent' : ''
              }`}
              onClick={() => handleSelectConversation(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={conversation.participants.find(p => p.userId !== user?.id)?.avatar || '/uploads/default-avatar.png'}
                      alt={conversation.title}
                    />
                    <AvatarFallback>{conversation.title.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  {conversation.participants.find(p => p.userId !== user?.id)?.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">{conversation.title}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage?.text || 'Start a conversation'}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="flex-shrink-0 ml-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage
                    src={selectedConversation.participants.find(p => p.userId !== user?.id)?.avatar || '/uploads/default-avatar.png'}
                    alt={selectedConversation.title}
                  />
                  <AvatarFallback>{selectedConversation.title.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedConversation.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.participants.find(p => p.userId !== user?.id)?.status === 'online'
                      ? 'Online'
                      : 'Last seen recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" title="Audio call">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" title="Video call">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" title="More options">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messageGroups.map(([date, groupMessages]) => (
                <div key={date} className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t"></span>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-2 text-xs text-muted-foreground">
                        {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {groupMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] flex ${message.senderId === user?.id ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                        {message.senderId !== user?.id && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage
                              src={message.senderAvatar || '/uploads/default-avatar.png'}
                              alt={message.senderName}
                            />
                            <AvatarFallback>{message.senderName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg p-3 ${
                            message.senderId === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.text}
                          {message.attachments?.map(attachment => (
                            <div key={attachment.id} className="mt-2 bg-background/20 rounded p-2 text-xs flex items-center">
                              <Paperclip className="h-3 w-3 mr-1" />
                              <span className="truncate">{attachment.name}</span>
                              <span className="ml-2">({Math.round(attachment.size / 1024)} KB)</span>
                            </div>
                          ))}
                          <div className={`text-xs mt-1 ${message.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatMessageTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex flex-row items-end gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={selectedConversation.participants.find(p => p.userId !== user?.id)?.avatar || '/uploads/default-avatar.png'}
                        alt={selectedConversation.title}
                      />
                      <AvatarFallback>{selectedConversation.title.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;
