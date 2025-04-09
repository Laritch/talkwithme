import type { Meta, StoryObj } from '@storybook/react';
import ChatMessage, { ChatMessageProps } from './ChatMessage';

const meta: Meta<typeof ChatMessage> = {
  title: 'Components/Chat/ChatMessage',
  component: ChatMessage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A chat message component that displays text, images, and attachments with status indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sender: { control: 'object' },
    content: { control: 'text' },
    timestamp: { control: 'date' },
    type: {
      control: { type: 'select' },
      options: ['text', 'image', 'file', 'system'],
    },
    status: {
      control: { type: 'select' },
      options: ['sending', 'sent', 'delivered', 'read', 'failed'],
    },
    attachments: { control: 'object' },
    isEncrypted: { control: 'boolean' },
    isCurrentUser: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

const defaultProps: Partial<ChatMessageProps> = {
  id: '1',
  sender: {
    id: 'user1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/300?img=12',
    role: 'student',
  },
  content: 'Hello! How can I help you with your coursework today?',
  timestamp: new Date(),
  type: 'text',
  status: 'sent',
  isCurrentUser: false,
};

export const StudentMessage: Story = {
  args: {
    ...defaultProps,
    id: '1',
  },
};

export const InstructorMessage: Story = {
  args: {
    ...defaultProps,
    id: '2',
    sender: {
      id: 'instructor1',
      name: 'Prof. Smith',
      avatar: 'https://i.pravatar.cc/300?img=3',
      role: 'instructor',
    },
    content: 'I've reviewed your assignment. There are some improvements you could make to the algorithm complexity.',
  },
};

export const CurrentUserMessage: Story = {
  args: {
    ...defaultProps,
    id: '3',
    isCurrentUser: true,
    content: 'Thank you for your feedback. I'll work on improving those sections.',
  },
};

export const ImageMessage: Story = {
  args: {
    ...defaultProps,
    id: '4',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=500&auto=format',
    sender: {
      id: 'instructor1',
      name: 'Prof. Smith',
      avatar: 'https://i.pravatar.cc/300?img=3',
      role: 'instructor',
    },
  },
};

export const WithAttachments: Story = {
  args: {
    ...defaultProps,
    id: '5',
    content: 'Here are the lecture notes and a sample project.',
    attachments: [
      {
        id: 'attachment1',
        name: 'Lecture_Notes_Week3.pdf',
        type: 'application/pdf',
        size: 2048576, // 2MB
        url: '#',
      },
      {
        id: 'attachment2',
        name: 'Sample_Project.zip',
        type: 'application/zip',
        size: 3145728, // 3MB
        url: '#',
      },
    ],
  },
};

export const EncryptedMessage: Story = {
  args: {
    ...defaultProps,
    id: '6',
    isEncrypted: true,
    content: 'This message is encrypted end-to-end.',
  },
};

export const SystemMessage: Story = {
  args: {
    ...defaultProps,
    id: '7',
    type: 'system',
    content: 'John Doe joined the chat',
    sender: {
      id: 'system',
      name: 'System',
      role: 'system',
    },
  },
};

export const MessageWithDifferentStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      <ChatMessage
        {...defaultProps}
        id="status1"
        isCurrentUser={true}
        content="This message is sending..."
        status="sending"
      />
      <ChatMessage
        {...defaultProps}
        id="status2"
        isCurrentUser={true}
        content="This message was sent"
        status="sent"
      />
      <ChatMessage
        {...defaultProps}
        id="status3"
        isCurrentUser={true}
        content="This message was delivered"
        status="delivered"
      />
      <ChatMessage
        {...defaultProps}
        id="status4"
        isCurrentUser={true}
        content="This message was read"
        status="read"
      />
      <ChatMessage
        {...defaultProps}
        id="status5"
        isCurrentUser={true}
        content="This message failed to send"
        status="failed"
      />
    </div>
  ),
};
