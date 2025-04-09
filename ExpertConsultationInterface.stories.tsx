import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse, delay } from 'msw';
import ExpertConsultationInterface from './ExpertConsultationInterface';
import chatReducer from '@/store/slices/chatSlice';
import coursesReducer from '@/store/slices/coursesSlice';

// Mock chat data
const mockChats = [
  {
    id: 'chat1',
    title: 'Anxiety & Stress Management',
    participants: [
      {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      {
        id: 'therapist1',
        name: 'Dr. Emily Chen',
        avatar: 'https://i.pravatar.cc/150?img=32',
        role: 'instructor',
      },
    ],
    lastMessage: {
      id: 'msg1',
      chatId: 'chat1',
      content: 'Let me know how the breathing exercises worked for you.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      sender: {
        id: 'therapist1',
        name: 'Dr. Emily Chen',
        avatar: 'https://i.pravatar.cc/150?img=32',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    unreadCount: 0,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'chat2',
    title: 'Contract Review - Software Licensing',
    participants: [
      {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      {
        id: 'legal1',
        name: 'James Wilson, Esq.',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'instructor',
      },
    ],
    lastMessage: {
      id: 'msg2',
      chatId: 'chat2',
      content: 'I've attached the revised contract with the changes we discussed.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      sender: {
        id: 'legal1',
        name: 'James Wilson, Esq.',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    unreadCount: 0,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

// Mock messages
const mockMessages = {
  chat1: [
    {
      id: 'msg1-1',
      chatId: 'chat1',
      content: 'Hello Dr. Chen, I've been experiencing increased anxiety lately.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      sender: {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    {
      id: 'msg1-2',
      chatId: 'chat1',
      content: 'I'm sorry to hear that, Michael. Can you tell me more about the situations that trigger your anxiety?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
      sender: {
        id: 'therapist1',
        name: 'Dr. Emily Chen',
        avatar: 'https://i.pravatar.cc/150?img=32',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    {
      id: 'msg1-3',
      chatId: 'chat1',
      content: 'Work has been particularly stressful, and I'm having trouble sleeping because of it.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.4).toISOString(),
      sender: {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    {
      id: 'msg1-4',
      chatId: 'chat1',
      content: `I understand. Let's try some breathing exercises to help manage the anxiety in the moment.

      1. Find a comfortable position
      2. Breathe in slowly through your nose for 4 counts
      3. Hold for 2 counts
      4. Exhale slowly through your mouth for 6 counts
      5. Repeat for 5 minutes, twice daily

      Would you be willing to try this before our next session?`,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.2).toISOString(),
      sender: {
        id: 'therapist1',
        name: 'Dr. Emily Chen',
        avatar: 'https://i.pravatar.cc/150?img=32',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    {
      id: 'msg1-5',
      chatId: 'chat1',
      content: 'Yes, I'll try it. Thank you.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.1).toISOString(),
      sender: {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    {
      id: 'msg1-6',
      chatId: 'chat1',
      content: 'Let me know how the breathing exercises worked for you.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      sender: {
        id: 'therapist1',
        name: 'Dr. Emily Chen',
        avatar: 'https://i.pravatar.cc/150?img=32',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
  ],
  chat2: [
    {
      id: 'msg2-1',
      chatId: 'chat2',
      content: 'Hello Mr. Wilson, I need help reviewing a software licensing agreement for my business.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      sender: {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    {
      id: 'msg2-2',
      chatId: 'chat2',
      content: 'I'd be happy to help with that, Michael. Could you share the agreement so I can review it?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.9).toISOString(),
      sender: {
        id: 'legal1',
        name: 'James Wilson, Esq.',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    {
      id: 'msg2-3',
      chatId: 'chat2',
      content: 'Here is the agreement. I'm particularly concerned about the liability clauses on page 4.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.8).toISOString(),
      sender: {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
      attachments: [
        {
          id: 'att1',
          name: 'licensing_agreement.pdf',
          type: 'application/pdf',
          size: 2500000,
          url: '#',
        },
      ],
    },
    {
      id: 'msg2-4',
      chatId: 'chat2',
      content: `I've reviewed the document and found several concerning items:

1. The liability clause is extremely one-sided
2. The termination terms are vague
3. There's no clear definition of what constitutes "proper use"

I've made some suggested revisions to the document. Let's schedule a call to discuss these in detail.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString(),
      sender: {
        id: 'legal1',
        name: 'James Wilson, Esq.',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
      attachments: [
        {
          id: 'att2',
          name: 'licensing_agreement_revised.pdf',
          type: 'application/pdf',
          size: 2600000,
          url: '#',
        },
      ],
    },
    {
      id: 'msg2-5',
      chatId: 'chat2',
      content: 'Thank you for the quick review. I'll look at your revisions and schedule a call tomorrow.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.2).toISOString(),
      sender: {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
    },
    {
      id: 'msg2-6',
      chatId: 'chat2',
      content: 'I've attached the revised contract with the changes we discussed.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      sender: {
        id: 'legal1',
        name: 'James Wilson, Esq.',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'instructor',
      },
      type: 'text',
      status: 'read',
      isEncrypted: true,
      attachments: [
        {
          id: 'att3',
          name: 'licensing_agreement_final.pdf',
          type: 'application/pdf',
          size: 2650000,
          url: '#',
        },
      ],
    },
  ],
};

// MSW Handlers for API mocking
export const handlers = [
  http.get('/api/chats', async () => {
    await delay(500);
    return HttpResponse.json(mockChats);
  }),

  http.get('/api/chats/:chatId', async ({ params }) => {
    const { chatId } = params;
    await delay(300);

    const chat = mockChats.find(c => c.id === chatId);
    if (!chat) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(chat);
  }),

  http.get('/api/chats/:chatId/messages', async ({ params }) => {
    const { chatId } = params;
    await delay(400);

    const messages = mockMessages[chatId as keyof typeof mockMessages] || [];
    return HttpResponse.json(messages);
  }),

  http.post('/api/chats/:chatId/messages', async ({ params, request }) => {
    const { chatId } = params;
    await delay(300);

    const body = await request.json();

    // Create a new message with server-generated data
    const newMessage = {
      id: `msg-${Date.now()}`,
      chatId: chatId,
      sender: body.sender,
      content: body.content,
      timestamp: new Date().toISOString(),
      type: body.type || 'text',
      status: 'sent',
      isEncrypted: body.isEncrypted || false,
    };

    return HttpResponse.json(newMessage);
  }),
];

// Create a mock Redux store with preloaded state
const createMockStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      courses: coursesReducer,
    },
    preloadedState: {
      chat: {
        chats: mockChats,
        activeChat: null,
        messages: mockMessages,
        loading: false,
        error: null,
      },
      courses: {
        courses: [],
        loading: false,
        error: null,
        filters: {
          searchQuery: '',
          categories: [],
          levels: [],
          sortBy: 'popularity',
        },
      },
      ...preloadedState,
    },
  });
};

// Wrapper component with Redux provider
const ExpertConsultationInterfaceWithProvider = (props: any) => {
  const store = createMockStore(props.preloadedState);

  return (
    <Provider store={store}>
      <ExpertConsultationInterface
        userId={props.userId || 'client1'}
        userRole={props.userRole || 'client'}
        userName={props.userName || 'Michael Brown'}
        userAvatar={props.userAvatar || 'https://i.pravatar.cc/150?img=19'}
        expertId={props.expertId}
        expertType={props.expertType}
      />
    </Provider>
  );
};

const meta: Meta<typeof ExpertConsultationInterfaceWithProvider> = {
  title: 'Components/Expert/ExpertConsultationInterface',
  component: ExpertConsultationInterfaceWithProvider,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: handlers,
    },
    docs: {
      description: {
        component: 'A specialized chat interface for professional consultations with experts, featuring end-to-end encryption, session management, and client notes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    userId: { control: 'text' },
    userRole: {
      control: 'radio',
      options: ['client', 'student', 'instructor'],
    },
    userName: { control: 'text' },
    userAvatar: { control: 'text' },
    expertId: { control: 'text' },
    expertType: {
      control: 'radio',
      options: ['therapist', 'legal_consultant'],
    },
    preloadedState: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof ExpertConsultationInterfaceWithProvider>;

export const Default: Story = {
  args: {
    userId: 'client1',
    userRole: 'client',
    userName: 'Michael Brown',
    userAvatar: 'https://i.pravatar.cc/150?img=19',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default consultation interface showing the list of chats.',
      },
    },
  },
};

export const TherapyConsultation: Story = {
  args: {
    userId: 'client1',
    userRole: 'client',
    userName: 'Michael Brown',
    userAvatar: 'https://i.pravatar.cc/150?img=19',
    expertId: 'therapist1',
    expertType: 'therapist',
    preloadedState: {
      chat: {
        activeChat: 'chat1',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Consultation interface for therapy sessions with active chat.',
      },
    },
  },
};

export const LegalConsultation: Story = {
  args: {
    userId: 'client1',
    userRole: 'client',
    userName: 'Michael Brown',
    userAvatar: 'https://i.pravatar.cc/150?img=19',
    expertId: 'legal1',
    expertType: 'legal_consultant',
    preloadedState: {
      chat: {
        activeChat: 'chat2',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Consultation interface for legal services with active chat.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    userId: 'client1',
    userRole: 'client',
    userName: 'Michael Brown',
    userAvatar: 'https://i.pravatar.cc/150?img=19',
    preloadedState: {
      chat: {
        chats: [],
        loading: true,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Consultation interface in loading state while fetching data.',
      },
    },
  },
};
