import type { Meta, StoryObj } from '@storybook/react';
import SecureMessageInput from './SecureMessageInput';
import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Create a wrapper component to provide session context
const SecureMessageInputWrapper = (props: any) => {
  // Mock session for Storybook
  const mockSession = {
    data: {
      user: {
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      },
      expires: '2099-01-01T00:00:00.000Z',
    },
    status: 'authenticated',
  };

  return (
    <SessionProvider session={mockSession.data}>
      <div className="max-w-3xl mx-auto p-4 border rounded-lg shadow-sm">
        <SecureMessageInput {...props} />
      </div>
    </SessionProvider>
  );
};

// Mock the e2eeService to avoid crypto errors in Storybook
jest.mock('../lib/encryption/e2eeService', () => ({
  e2eeService: {
    ensureUserHasKeys: () => ({
      publicKey: 'mock-public-key',
      privateKey: 'mock-private-key',
    }),
    encryptMessage: () => ({
      encryptedMessage: 'encrypted-message-content',
      nonce: 'mock-nonce',
    }),
    signMessage: () => 'mock-signature',
  },
}));

const meta: Meta<typeof SecureMessageInputWrapper> = {
  title: 'Components/Chat/SecureMessageInput',
  component: SecureMessageInputWrapper,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A secure message input component that encrypts messages with end-to-end encryption before sending.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSendMessage: { action: 'messageSent' },
    recipientId: { control: 'text' },
    recipientPublicKey: { control: 'text' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof SecureMessageInputWrapper>;

export const Default: Story = {
  args: {
    recipientId: 'recipient123',
    recipientPublicKey: 'recipient-public-key',
    placeholder: 'Type a secure message...',
  },
};

export const DisabledState: Story = {
  args: {
    recipientId: 'recipient123',
    recipientPublicKey: 'recipient-public-key',
    disabled: true,
    placeholder: 'Encryption unavailable...',
  },
};

export const CustomPlaceholder: Story = {
  args: {
    recipientId: 'recipient123',
    recipientPublicKey: 'recipient-public-key',
    placeholder: 'Send an encrypted message to John...',
  },
};

export const WithPrefilledMessage: Story = {
  args: {
    recipientId: 'recipient123',
    recipientPublicKey: 'recipient-public-key',
  },
  play: async ({ canvasElement }) => {
    const inputElement = canvasElement.querySelector('input[type="text"]');
    if (inputElement) {
      // @ts-ignore - synthetic events in play function
      inputElement.value = 'Hello, this is a secure message!';
      const event = new Event('change', { bubbles: true });
      inputElement.dispatchEvent(event);
    }
  },
};
