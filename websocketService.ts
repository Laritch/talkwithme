import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../store/slices/chatSlice';
import { addNotification } from '../store/slices/uiSlice';
import { AppDispatch } from '../store';

/**
 * WebSocket event types
 */
export enum WebSocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  NEW_MESSAGE = 'new_message',
  USER_TYPING = 'user_typing',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  NOTIFICATION = 'notification',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
}

/**
 * Notification interface
 */
export interface WebSocketNotification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  source?: string;
  link?: string;
}

/**
 * WebSocket service for real-time communication
 */
export class WebSocketService {
  private socket: Socket | null = null;
  private dispatch: AppDispatch | null = null;
  private onMessageCallback?: (message: ChatMessage) => void;
  private onNotificationCallback?: (notification: WebSocketNotification) => void;
  private onUserTypingCallback?: (data: { userId: string; isTyping: boolean }) => void;
  private onUserStatusCallback?: (data: { userId: string; isOnline: boolean }) => void;

  /**
   * Initialize WebSocket connection
   */
  public initialize(
    dispatch: AppDispatch,
    token: string,
    callbacks?: {
      onMessage?: (message: ChatMessage) => void;
      onNotification?: (notification: WebSocketNotification) => void;
      onUserTyping?: (data: { userId: string; isTyping: boolean }) => void;
      onUserStatus?: (data: { userId: string; isOnline: boolean }) => void;
    }
  ): void {
    // Save dispatch for later use
    this.dispatch = dispatch;

    // Save callbacks
    this.onMessageCallback = callbacks?.onMessage;
    this.onNotificationCallback = callbacks?.onNotification;
    this.onUserTypingCallback = callbacks?.onUserTyping;
    this.onUserStatusCallback = callbacks?.onUserStatus;

    // Close any existing connection
    this.disconnect();

    // Create WebSocket connection
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Send a message
   */
  public sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    if (!this.socket) {
      console.error('WebSocket not initialized');
      return;
    }

    this.socket.emit(WebSocketEvent.NEW_MESSAGE, message);
  }

  /**
   * Join a chat room
   */
  public joinRoom(roomId: string): void {
    if (!this.socket) {
      console.error('WebSocket not initialized');
      return;
    }

    this.socket.emit(WebSocketEvent.JOIN_ROOM, { roomId });
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on(WebSocketEvent.CONNECT, () => {
      console.log('WebSocket connected');
    });

    this.socket.on(WebSocketEvent.DISCONNECT, (reason: string) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on(WebSocketEvent.ERROR, (error: string) => {
      console.error('WebSocket error:', error);
    });

    // Message events
    this.socket.on(WebSocketEvent.NEW_MESSAGE, (message: ChatMessage) => {
      console.log('New message received:', message);

      // Call the callback if provided
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    });

    this.socket.on(WebSocketEvent.NOTIFICATION, (notification: WebSocketNotification) => {
      console.log('Notification received:', notification);

      // Call the callback if provided
      if (this.onNotificationCallback) {
        this.onNotificationCallback(notification);
      }

      // Dispatch notification to Redux store if dispatch is available
      if (this.dispatch) {
        this.dispatch(addNotification({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          source: notification.source,
          link: notification.link,
        }));
      }
    });
  }
}

// Create and export a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
