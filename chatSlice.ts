import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface for a chat message
 */
export interface ChatMessage {
  id: string;
  sessionId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    imageWidth?: number;
    imageHeight?: number;
    [key: string]: any;
  };
}

/**
 * Interface for a conversation
 */
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: ChatMessage;
  unreadCount: number;
  name?: string;
  avatar?: string;
}

/**
 * Interface for the chat state
 */
export interface ChatState {
  activeConversations: Record<string, Conversation>;
  activeConversationId: string | null;
  messages: ChatMessage[];
  unreadCount: number;
  socket: WebSocket | null;
  isTyping: Record<string, Record<string, boolean>>;
  online: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  filters: {
    status: 'all' | 'unread' | 'read';
    searchTerm: string;
  };
}

/**
 * Params for fetching chat history
 */
interface FetchChatHistoryParams {
  userId?: string;
  expertId?: string;
  sessionId?: string;
}

/**
 * Response from chat history fetch
 */
interface ChatHistoryResponse {
  messages: ChatMessage[];
  userId: string;
  expertId: string;
  sessionId?: string;
}

/**
 * Async thunk for fetching chat history
 */
export const fetchChatHistory = createAsyncThunk<
  ChatHistoryResponse,
  FetchChatHistoryParams,
  { rejectValue: string }
>(
  'chat/fetchChatHistory',
  async ({ userId, expertId, sessionId }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId);
      if (expertId) queryParams.append('expertId', expertId);
      if (sessionId) queryParams.append('sessionId', sessionId);

      const response = await fetch(`/api/messages?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }
);

/**
 * Interface for sending a message
 */
export interface SendMessageData {
  senderId: string;
  receiverId: string;
  content: string;
  sessionId?: string;
  type?: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
}

/**
 * Async thunk for sending a message
 */
export const sendMessage = createAsyncThunk<
  ChatMessage,
  SendMessageData,
  { rejectValue: string }
>(
  'chat/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }
);

/**
 * Initial state for the chat slice
 */
const initialState: ChatState = {
  activeConversations: {},
  activeConversationId: null,
  messages: [],
  unreadCount: 0,
  socket: null,
  isTyping: {},
  online: {},
  loading: false,
  error: null,
  filters: {
    status: 'all',
    searchTerm: '',
  },
};

/**
 * Chat slice of the Redux store
 */
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<WebSocket | null>) => {
      state.socket = action.payload;
    },
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
      // Mark messages as read
      if (state.activeConversations[action.payload]) {
        state.activeConversations[action.payload].unreadCount = 0;
      }
    },
    addMessage: (state, action: PayloadAction<{ message: ChatMessage }>) => {
      const { message } = action.payload;

      // Add to messages array
      state.messages.push(message);

      // Update conversation if exists, or create new one
      const conversationId = message.sessionId || `${message.senderId}-${message.receiverId}`;
      if (!state.activeConversations[conversationId]) {
        state.activeConversations[conversationId] = {
          id: conversationId,
          participants: [message.senderId, message.receiverId],
          lastMessage: message,
          unreadCount: state.activeConversationId !== conversationId ? 1 : 0,
        };
      } else {
        state.activeConversations[conversationId].lastMessage = message;
        if (state.activeConversationId !== conversationId) {
          state.activeConversations[conversationId].unreadCount += 1;
          state.unreadCount += 1;
        }
      }
    },
    markAsRead: (state, action: PayloadAction<{ conversationId: string }>) => {
      const { conversationId } = action.payload;
      if (state.activeConversations[conversationId]) {
        const prevUnread = state.activeConversations[conversationId].unreadCount;
        state.activeConversations[conversationId].unreadCount = 0;
        state.unreadCount = Math.max(0, state.unreadCount - prevUnread);
      }
    },
    setTypingStatus: (state, action: PayloadAction<{ userId: string; conversationId: string; isTyping: boolean }>) => {
      const { userId, conversationId, isTyping } = action.payload;
      if (!state.isTyping[conversationId]) {
        state.isTyping[conversationId] = {};
      }
      state.isTyping[conversationId][userId] = isTyping;
    },
    setUserOnlineStatus: (state, action: PayloadAction<{ userId: string; status: boolean }>) => {
      const { userId, status } = action.payload;
      state.online[userId] = status;
    },
    clearChatError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<ChatState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetChat: (state) => {
      state.messages = [];
      state.activeConversationId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchChatHistory
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;

        // Set up conversation metadata
        const conversationId = action.payload.sessionId ||
          `${action.payload.userId}-${action.payload.expertId}`;

        state.activeConversationId = conversationId;

        if (action.payload.messages.length > 0) {
          state.activeConversations[conversationId] = {
            id: conversationId,
            participants: [action.payload.userId, action.payload.expertId],
            lastMessage: action.payload.messages[action.payload.messages.length - 1],
            unreadCount: 0,
          };
        }
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch chat history';
      })

      // Handle sendMessage
      .addCase(sendMessage.pending, (state) => {
        // Optimistic update could be added here
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // If needed, update local data with the confirmed message from server
        // This is optional because we're likely already handling this via addMessage
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload || 'Failed to send message';
        // Could mark failed messages here
      });
  },
});

export const {
  setSocket,
  setActiveConversation,
  addMessage,
  markAsRead,
  setTypingStatus,
  setUserOnlineStatus,
  clearChatError,
  setFilters,
  resetChat
} = chatSlice.actions;

export default chatSlice.reducer;
