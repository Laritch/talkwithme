import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer, { RootState } from './index';
import { setTheme, addToast } from './slices/uiSlice';
import { setCourses } from './slices/coursesSlice';
import { addMessage } from './slices/chatSlice';

describe('Redux Store Integration', () => {
  // Create a test store for each test
  function createTestStore() {
    return configureStore({
      reducer: rootReducer,
    });
  }

  it('should have the correct initial state', () => {
    const store = createTestStore();
    const state = store.getState();

    // Check UI state
    expect(state.ui.theme).toBe('light');
    expect(state.ui.sidebarOpen).toBe(true);
    expect(state.ui.notifications).toEqual([]);
    expect(state.ui.toasts).toEqual([]);

    // Check courses state
    expect(state.courses.courses).toEqual([]);
    expect(state.courses.featuredCourses).toEqual([]);
    expect(state.courses.loading).toBe(false);

    // Check chat state
    expect(state.chat.messages).toEqual([]);
    expect(state.chat.currentSession).toBe(null);
  });

  it('should handle UI actions', () => {
    const store = createTestStore();

    // Dispatch UI action
    store.dispatch(setTheme('dark'));

    // Check state was updated
    expect(store.getState().ui.theme).toBe('dark');

    // Dispatch toast action
    store.dispatch(addToast({
      message: 'Test toast',
      type: 'success',
      duration: 3000,
    }));

    // Check toast was added
    const toasts = store.getState().ui.toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Test toast');
    expect(toasts[0].type).toBe('success');
  });

  it('should handle courses actions', () => {
    const store = createTestStore();
    const mockCourses = [
      { id: '1', title: 'Course 1' },
      { id: '2', title: 'Course 2' },
    ];

    // Dispatch courses action
    store.dispatch(setCourses(mockCourses));

    // Check courses state was updated
    const coursesState = store.getState().courses;
    expect(coursesState.courses).toEqual(mockCourses);
    expect(coursesState.loading).toBe(false);
  });

  it('should handle chat actions', () => {
    const store = createTestStore();
    const message = {
      id: '1',
      text: 'Hello, world!',
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Dispatch chat action
    store.dispatch(addMessage(message));

    // Check chat state was updated
    const chatState = store.getState().chat;
    expect(chatState.messages.length).toBe(1);
    expect(chatState.messages[0].text).toBe('Hello, world!');
    expect(chatState.messages[0].sender).toBe('user');
  });

  it('should maintain correct state structure after multiple actions', () => {
    const store = createTestStore();

    // Dispatch multiple actions of different types
    store.dispatch(setTheme('dark'));
    store.dispatch(addToast({
      message: 'Test toast',
      type: 'info',
    }));
    store.dispatch(setCourses([{ id: '1', title: 'Course 1' }]));
    store.dispatch(addMessage({
      id: '1',
      text: 'Test message',
      sender: 'user',
      timestamp: new Date().toISOString(),
    }));

    // Get the final state
    const state = store.getState();

    // Check state structure is maintained
    expect(state.ui.theme).toBe('dark');
    expect(state.ui.toasts.length).toBe(1);
    expect(state.courses.courses.length).toBe(1);
    expect(state.chat.messages.length).toBe(1);
  });
});
