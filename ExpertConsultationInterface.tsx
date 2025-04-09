'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchChats,
  fetchMessages,
  sendMessage,
  setActiveChat,
  selectChats,
  selectActiveChat,
  selectActiveChatData,
  selectChatMessages,
  selectIsLoading,
  addLocalMessage,
  MessageStatus,
  UserRole
} from '@/store/slices/chatSlice';
import ChatMessage from './ChatMessage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  PaperclipIcon,
  SendIcon,
  LockIcon,
  ClockIcon,
  CalendarIcon,
  FileTextIcon,
  ShieldIcon,
  InfoIcon
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { v4 as uuidv4 } from 'uuid';

/**
 * Props for the ExpertConsultationInterface component
 *
 * @property {string} userId - Unique identifier for the current user
 * @property {UserRole} userRole - Role of the current user in the system
 * @property {string} userName - Display name of the current user
 * @property {string} [userAvatar] - URL to the user's avatar image
 * @property {string} [expertId] - Unique identifier for the expert if this is a new consultation
 * @property {'therapist' | 'legal_consultant'} [expertType] - Type of expert for this consultation
 */
interface ExpertConsultationInterfaceProps {
  userId: string;
  userRole: 'student' | 'instructor' | 'client';
  userName: string;
  userAvatar?: string;
  expertId?: string; // The ID of the expert if this is a new consultation
  expertType?: 'therapist' | 'legal_consultant';
}

/**
 * A specialized chat interface for professional consultations with experts like therapists
 * and legal consultants. Features include end-to-end encryption, session management, and
 * private client notes.
 *
 * @example
 * ```tsx
 * <ExpertConsultationInterface
 *   userId="client1"
 *   userRole="client"
 *   userName="John Doe"
 *   expertId="therapist1"
 *   expertType="therapist"
 * />
 * ```
 */
export const ExpertConsultationInterface: React.FC<ExpertConsultationInterfaceProps> = ({
  userId,
  userRole,
  userName,
  userAvatar,
  expertId,
  expertType,
}) => {
  const dispatch = useAppDispatch();
  const chats = useAppSelector(selectChats);
  const activeChat = useAppSelector(selectActiveChat);
  const activeChatData = useAppSelector(selectActiveChatData);
  const messages = useAppSelector(activeChat ? selectChatMessages(activeChat) : () => []);
  const isLoading = useAppSelector(selectIsLoading);

  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Expert consultation specific states
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true);
  const [clientNotes, setClientNotes] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(50 * 60); // 50 minutes in seconds
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Fetch chats when the component mounts
   */
  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  /**
   * Fetch messages when the active chat changes
   */
  useEffect(() => {
    if (activeChat) {
      dispatch(fetchMessages(activeChat));
    }
  }, [dispatch, activeChat]);

  /**
   * Scroll to the bottom of the chat when messages change
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Manage the session timer for timed consultations
   */
  useEffect(() => {
    if (sessionStarted && sessionTimeRemaining > 0) {
      const timer = setInterval(() => {
        setSessionTimeRemaining(prev => prev - 1);
      }, 1000);
      setSessionTimer(timer);
      return () => clearInterval(timer);
    } else if (sessionTimeRemaining <= 0 && sessionTimer) {
      clearInterval(sessionTimer);
      setSessionTimer(null);
    }
  }, [sessionStarted, sessionTimeRemaining, sessionTimer]);

  /**
   * Format the remaining session time as MM:SS
   * @returns Formatted time string
   */
  const formatTimeRemaining = () => {
    const minutes = Math.floor(sessionTimeRemaining / 60);
    const seconds = sessionTimeRemaining % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  /**
   * Handle selecting a chat from the list
   * @param chatId ID of the selected chat
   */
  const handleChatSelect = (chatId: string) => {
    dispatch(setActiveChat(chatId));
  };

  /**
   * Handle sending a new message
   * @param e Form submission event
   */
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeChat || (!newMessage.trim() && !attachment)) return;

    const now = new Date();
    const messageId = uuidv4();

    // Create local message to display immediately
    const localMessage = {
      id: messageId,
      chatId: activeChat,
      sender: {
        id: userId,
        name: userName,
        avatar: userAvatar,
        role: userRole,
      },
      content: newMessage,
      timestamp: now.toISOString(),
      type: 'text' as const,
      status: 'sending' as MessageStatus,
      isEncrypted: isEncryptionEnabled,
      metadata: {},
      isCurrentUser: true,
    };

    // Add local message to the chat
    dispatch(addLocalMessage(localMessage));

    // Send message to the API
    dispatch(sendMessage({
      chatId: activeChat,
      sender: {
        id: userId,
        name: userName,
        avatar: userAvatar,
        role: userRole,
      },
      content: newMessage,
      type: 'text',
      isEncrypted: isEncryptionEnabled,
    }));

    // Clear input
    setNewMessage('');
    setAttachment(null);
  };

  /**
   * Trigger the file input dialog
   */
  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle file selection from the file dialog
   * @param e Change event from the file input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  /**
   * Remove the currently selected file attachment
   */
  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Format a timestamp for display in the chat list
   * @param timestamp ISO timestamp string
   * @returns Formatted date/time string
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  /**
   * Start a timed consultation session with billing
   */
  const startSession = () => {
    setSessionStarted(true);
    // In a real app, this would also notify the expert and possibly create a billing record
  };

  /**
   * End the current consultation session
   */
  const endSession = () => {
    setSessionStarted(false);
    if (sessionTimer) {
      clearInterval(sessionTimer);
      setSessionTimer(null);
    }
    // In a real app, this would also end the billing period and possibly trigger a feedback form
  };

  // Expert info (would come from API in a real app)
  const expertInfo = {
    id: expertId || 'expert1',
    name: expertType === 'therapist' ? 'Dr. Emily Chen' : 'James Wilson, Esq.',
    role: expertType || 'therapist',
    avatar: expertType === 'therapist'
      ? 'https://i.pravatar.cc/150?img=32'
      : 'https://i.pravatar.cc/150?img=8',
    specialization: expertType === 'therapist'
      ? 'Cognitive Behavioral Therapy'
      : 'Contract Law',
    price: expertType === 'therapist' ? 80 : 120,
    sessionLength: expertType === 'therapist' ? 50 : 60,
    verified: true,
  };

  // Loading state
  if (isLoading && chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading chats...</p>
        </div>
      </div>
    );
  }

  // No chats state
  if (chats.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium">No consultations yet</h3>
          <p className="text-muted-foreground">Start a new consultation with an expert</p>
          <Button className="mt-4">New Consultation</Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <Tabs defaultValue="chat" className="h-[700px] flex flex-col">
        <TabsList className="grid grid-cols-3 mb-0">
          <TabsTrigger value="chat">Consultation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="notes">Client Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[640px]">
            <div className="space-y-1 p-4">
              <h3 className="font-medium mb-4">Consultation History</h3>

              {chats.map((chat) => (
                <button
                  key={chat.id}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent text-left transition-colors ${
                    activeChat === chat.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => handleChatSelect(chat.id)}
                >
                  {/* Display avatar of the other participant */}
                  {chat.participants.map(participant => {
                    if (participant.id !== userId) {
                      return (
                        <Avatar key={participant.id}>
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {participant.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      );
                    }
                    return null;
                  })}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span className="font-medium truncate">
                        {chat.title}
                      </span>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(chat.updatedAt)}
                        </span>
                      )}
                    </div>

                    {chat.lastMessage && (
                      <div className="flex items-center gap-1">
                        {chat.lastMessage.isEncrypted && (
                          <LockIcon className="h-3 w-3 text-green-600" />
                        )}
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage.sender.name}: {chat.lastMessage.content}
                        </p>
                      </div>
                    )}
                  </div>

                  {chat.unreadCount > 0 && (
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[10px] font-medium text-primary-foreground">{chat.unreadCount}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
          {activeChat && activeChatData ? (
            <>
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeChatData.participants.map(participant => {
                      if (participant.id !== userId) {
                        return (
                          <Avatar key={participant.id}>
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {participant.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        );
                      }
                      return null;
                    })}

                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {activeChatData.title}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          <ShieldIcon className="h-3 w-3 mr-1" />
                          Verified Expert
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {activeChatData.participants.filter(p => p.id !== userId).map(p => (
                          <span key={p.id}>
                            {p.name} • {p.role === 'therapist' ? 'Therapist' : 'Legal Consultant'}
                          </span>
                        ))}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Session timer */}
                  <div className="flex items-center gap-2">
                    {sessionStarted ? (
                      <>
                        <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                          <ClockIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{formatTimeRemaining()}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={endSession}>
                          End Session
                        </Button>
                      </>
                    ) : (
                      <Button variant="default" size="sm" onClick={startSession}>
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Start Session
                      </Button>
                    )}
                  </div>
                </div>

                {/* Consultation info bar */}
                <div className="bg-muted/30 p-2 rounded-md mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>Session Length: {expertInfo.sessionLength} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-3.5 w-3.5" />
                    <span>Rate: ${expertInfo.price}/hour</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <LockIcon className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-600">End-to-End Encrypted</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80 text-xs">
                          All messages in expert consultations are end-to-end encrypted.
                          This means that only you and the expert can read the contents of your conversation.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-4">
                <ScrollArea className="h-[440px] pr-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md">
                          <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <InfoIcon className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-medium mb-2">Begin Your Consultation</h3>
                          <p className="text-muted-foreground text-sm">
                            Your conversation with the expert is private and secure.
                            All messages are end-to-end encrypted.
                          </p>
                          <Button className="mt-4" onClick={() => setNewMessage('Hello, I would like to discuss...')}>
                            Start Conversation
                          </Button>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          id={message.id}
                          sender={message.sender}
                          content={message.content}
                          timestamp={new Date(message.timestamp)}
                          type={message.type}
                          status={message.status}
                          attachments={message.attachments}
                          isEncrypted={message.isEncrypted}
                          isCurrentUser={message.sender.id === userId}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-4 pt-2 border-t flex-col gap-2">
                {/* Encryption toggle */}
                <div className="w-full bg-muted/30 p-2 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LockIcon className={`h-4 w-4 ${isEncryptionEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className="text-sm">End-to-End Encryption</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="encryption-mode"
                      checked={isEncryptionEnabled}
                      onCheckedChange={setIsEncryptionEnabled}
                    />
                    <Label htmlFor="encryption-mode" className="text-xs text-muted-foreground">
                      {isEncryptionEnabled ? 'On' : 'Off'}
                    </Label>
                  </div>
                </div>

                {attachment && (
                  <div className="bg-accent p-2 rounded-md mb-2 flex items-center justify-between w-full">
                    <span className="text-sm truncate">{attachment.name}</span>
                    <Button variant="ghost" size="sm" onClick={removeAttachment}>
                      Remove
                    </Button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleFileAttach}
                  >
                    <PaperclipIcon className="h-5 w-5" />
                  </Button>

                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />

                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() && !attachment}
                  >
                    <SendIcon className="h-5 w-5" />
                  </Button>
                </form>
              </CardFooter>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-medium">Select a consultation</h3>
                <p className="text-muted-foreground">Choose a consultation from the history to continue your conversation</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="flex-1 overflow-hidden">
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Client Notes</h3>
              <Badge variant="outline">Private to you</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              These notes are only visible to you. Use this space to record important information about your client.
            </p>
            <Textarea
              placeholder="Enter your private notes about this client here..."
              className="flex-1 resize-none"
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <Button>Save Notes</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ExpertConsultationInterface;
