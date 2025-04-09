import { configureStore } from '@reduxjs/toolkit';
import chatSlice, { sendMessage, fetchMessages, addMessage, deleteMessage, updateMessage } from './chatSlice';

// Test setup
const store = configureStore({ reducer: { chat: chatSlice } });

describe('chatSlice reducer and thunks', () => {
  it('should handle initial state', () => {
    const state = store.getState().chat;
    expect(state).toEqual({ messages: [], status: 'idle', error: null });
  });

  it('should handle sendMessage action', () => {
    store.dispatch(sendMessage({ id: 1, text: 'Hello' }));
    const state = store.getState().chat;
    expect(state.messages).toContainEqual({ id: 1, text: 'Hello' });
  });

  it('should handle fetchMessages thunk', async () => {
    await store.dispatch(fetchMessages());
    const state = store.getState().chat;
    expect(state.messages.length).toBeGreaterThan(0);
  });

  it('should handle error state in fetchMessages thunk', async () => {
    // Simulate an error scenario
    jest.spyOn(global, 'fetch').mockImplementation(() => Promise.reject('API is down'));
    await store.dispatch(fetchMessages());
    const state = store.getState().chat;
    expect(state.error).toBe('API is down');
    global.fetch.mockRestore();
  });

  it('should handle addMessage action', () => {
    const message = { id: 1, text: 'Hello World' };
    store.dispatch(addMessage(message));
    const state = store.getState().chat;
    expect(state.messages).toContainEqual(message);
  });

  it('should handle deleteMessage action', () => {
    const message = { id: 1, text: 'Hello World' };
    store.dispatch(addMessage(message));
    store.dispatch(deleteMessage(1));
    const state = store.getState().chat;
    expect(state.messages).not.toContainEqual(message);
  });

  it('should handle updateMessage action', () => {
    const message = { id: 1, text: 'Hello World' };
    const updatedMessage = { id: 1, text: 'Updated Text' };
    store.dispatch(addMessage(message));
    store.dispatch(updateMessage(updatedMessage));
    const state = store.getState().chat;
    expect(state.messages).toContainEqual(updatedMessage);
  });
});
