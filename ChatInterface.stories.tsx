import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatInterface from './ChatInterface';
import chatReducer from '@/store/slices/chatSlice';
import coursesReducer from '@/store/slices/coursesSlice';

// Create mock chat data
const mockChats = [
  {
    id: 'chat1',
    title: 'JavaScript Course Support',
    participants: [
      {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300?img=12',
        role: 'student',
      },
      {
        id: 'instructor1',
        name: 'Prof. Smith',
        avatar: 'https://i.pravatar.cc/300?img=3',
        role: 'instructor',
      },
    ],
    lastMessage: {
      id: 'msg5',
      chatId: 'chat1',
      content: 'Looking forward to seeing your progress!',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      sender: {
        id: 'instructor1',
        name: 'Prof. Smith',
        avatar: 'https://i.pravatar.cc/300?img=3',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
    },
    unreadCount: 0,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'chat2',
    title: 'Python Data Science',
    participants: [
      {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300?img=12',
        role: 'student',
      },
      {
        id: 'instructor2',
        name: 'Dr. Johnson',
        avatar: 'https://i.pravatar.cc/300?img=4',
        role: 'instructor',
      },
    ],
    lastMessage: {
      id: 'msg10',
      chatId: 'chat2',
      content: 'When is the next assignment due?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      sender: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300?img=12',
        role: 'student',
      },
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

// Create mock messages
const mockMessages = {
  chat1: [
    {
      id: 'msg1',
      chatId: 'chat1',
      content: 'Hello, I have a question about JavaScript promises.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      sender: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300?img=12',
        role: 'student',
      },
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg2',
      chatId: 'chat1',
      content: 'Hi John! What would you like to know about promises?',
      timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
      sender: {
        id: 'instructor1',
        name: 'Prof. Smith',
        avatar: 'https://i.pravatar.cc/300?img=3',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg3',
      chatId: 'chat1',
      content: 'I'm struggling with async/await syntax. Can you explain how it relates to promises?',
      timestamp: new Date(Date.now() - 1000 * 60 * 56).toISOString(),
      sender: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300?img=12',
        role: 'student',
      },
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg4',
      chatId: 'chat1',
      content: 'Sure! Async/await is syntactic sugar over promises. It makes asynchronous code look more like synchronous code.\n\nFor example, instead of using .then() chains, you can write:\n\nasync function fetchData() {\n  try {\n    const result = await fetch("/data");\n    const data = await result.json();\n    return data;\n  } catch (error) {\n    console.error(error);\n  }\n}',
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      sender: {
        id: 'instructor1',
        name: 'Prof. Smith',
        avatar: 'https://i.pravatar.cc/300?img=3',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg5',
      chatId: 'chat1',
      content: 'Looking forward to seeing your progress!',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      sender: {
        id: 'instructor1',
        name: 'Prof. Smith',
        avatar: 'https://i.pravatar.cc/300?img=3',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
    },
  ],
  chat2: [
    {
      id: 'msg6',
      chatId: 'chat2',
      content: 'Welcome to the Python Data Science course!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      sender: {
        id: 'instructor2',
        name: 'Dr. Johnson',
        avatar: 'https://i.pravatar.cc/300?img=4',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg7',
      chatId: 'chat2',
      content: 'Thanks! I'm excited to learn data visualization with Matplotlib.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
      sender: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300?img=12',
        role: 'student',
      },
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg8',
      chatId: 'chat2',
      content: 'Here are some resources for the pandas library that might help you.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      sender: {
        id: 'instructor2',
        name: 'Dr. Johnson',
        avatar: 'https://i.pravatar.cc/300?img=4',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg9',
      chatId: 'chat2',
      content: 'I've attached my first assignment. Please let me know if I'm on the right track.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      sender: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300?img=12',
        role: 'student',
      },
      type: 'text',
      status: 'read',
      attachments: [
        {
          id: 'att1',
          name: 'data_analysis.ipynb',
          type: 'application/json',
          size: 125000,
          url: '#',
        },
      ],
    },
    {
      id: 'msg10',
      chatId: 'chat2',
      content: 'When is the next assignment due?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      sender: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300?img=12',
        role: 'student',
      },
      type: 'text',
      status: 'delivered',
    },
  ],
};

// Create a mock store
const createMockStore = (isLoading = false, activeChat = null) => configureStore({
  reducer: {
    chat: chatReducer,
    courses: coursesReducer,
  },
  preloadedState: {
    chat: {
      chats: mockChats,
      activeChat: activeChat,
      messages: mockMessages,
      loading: isLoading,
      error: null,
    },
    courses: {
      courses: [],
      userEnrollments: [],
      featuredCourses: [],
      popularCourses: [],
      recommendedCourses: [],
      currentCourse: null,
      loading: false,
      error: null,
    }
  }
});

// Create a wrapper component with Redux provider
const ChatInterfaceWithProvider = (props: any) => {
  const store = createMockStore(props.isLoading, props.activeChat);

  return (
    <Provider store={store}>
      <ChatInterface
        userId={props.userId || 'user1'}
        userRole={props.userRole || 'student'}
        userName={props.userName || 'John Doe'}
        userAvatar={props.userAvatar || 'https://i.pravatar.cc/300?img=12'}
      />
    </Provider>
  );
};

const meta: Meta<typeof ChatInterfaceWithProvider> = {
  title: 'Components/Chat/ChatInterface',
  component: ChatInterfaceWithProvider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A full-featured chat interface with messaging capabilities and chat management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    activeChat: {
      control: 'select',
      options: [null, 'chat1', 'chat2'],
    },
    userId: { control: 'text' },
    userRole: {
      control: 'radio',
      options: ['student', 'instructor'],
    },
    userName: { control: 'text' },
    userAvatar: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ChatInterfaceWithProvider>;

export const Default: Story = {
  args: {
    activeChat: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default chat interface showing the list of available chats.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chat interface in loading state.',
      },
    },
  },
};

export const ActiveChat: Story = {
  args: {
    activeChat: 'chat1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Chat interface with an active conversation open.',
      },
    },
  },
};

export const AsInstructor: Story = {
  args: {
    userId: 'instructor1',
    userRole: 'instructor',
    userName: 'Prof. Smith',
    userAvatar: 'https://i.pravatar.cc/300?img=3',
    activeChat: 'chat1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Chat interface from the instructor perspective.',
      },
    },
  },
};
