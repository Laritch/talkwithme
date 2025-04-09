import { useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import websocketService, { WebSocketNotification } from '../services/websocketService';
import { ChatMessage } from '../store/slices/chatSlice';

/**
 * Custom hook for WebSocket functionality
 */
export function useWebSocket(token: string | null) {
  const dispatch = useDispatch<AppDispatch>();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const [lastNotification, setLastNotification] = useState<WebSocketNotification | null>(null);

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback((message: ChatMessage) => {
    setLastMessage(message);
  }, []);

  /**
   * Handle incoming notifications
   */
  const handleNotification = useCallback((notification: WebSocketNotification) => {
    setLastNotification(notification);
  }, []);

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    if (!token) return;

    // Initialize WebSocket connection
    websocketService.initialize(
      dispatch,
      token,
      {
        onMessage: handleMessage,
        onNotification: handleNotification,
        onUserTyping: (data) => {
          console.log('User typing:', data);
        },
        onUserStatus: (data) => {
          console.log('User status:', data);
        },
      }
    );

    setIsConnected(true);

    // Clean up function to disconnect WebSocket when component unmounts
    return () => {
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [dispatch, token, handleMessage, handleNotification]);

  /**
   * Send a message
   */
  const sendMessage = useCallback((
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ) => {
    if (!isConnected) {
      console.error('WebSocket not connected');
      return false;
    }

    websocketService.sendMessage(message);
    return true;
  }, [isConnected]);

  /**
   * Join a room
   */
  const joinRoom = useCallback((roomId: string) => {
    if (!isConnected) {
      console.error('WebSocket not connected');
      return false;
    }

    websocketService.joinRoom(roomId);
    return true;
  }, [isConnected]);

  return {
    isConnected,
    lastMessage,
    lastNotification,
    sendMessage,
    joinRoom,
  };
}
