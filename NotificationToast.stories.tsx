import type { Meta, StoryObj } from '@storybook/react';
import NotificationToast from './NotificationToast';

const meta: Meta<typeof NotificationToast> = {
  title: 'Components/Notifications/NotificationToast',
  component: NotificationToast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    toast: {
      control: 'object',
    },
    onClose: { action: 'closed' },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
    },
    autoClose: {
      control: 'boolean',
    },
    autoCloseDelay: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationToast>;

export const Info: Story = {
  args: {
    toast: {
      id: 1,
      message: 'This is an info notification message',
      type: 'info',
      duration: 5000,
      title: 'Info Notification',
    },
    position: 'top-right',
    autoClose: true,
    autoCloseDelay: 5000,
  },
};

export const Success: Story = {
  args: {
    toast: {
      id: 2,
      message: 'Operation completed successfully!',
      type: 'success',
      duration: 5000,
      title: 'Success',
    },
    position: 'top-right',
    autoClose: true,
    autoCloseDelay: 5000,
  },
};

export const Warning: Story = {
  args: {
    toast: {
      id: 3,
      message: 'This action might cause problems',
      type: 'warning',
      duration: 5000,
      title: 'Warning',
    },
    position: 'top-right',
    autoClose: true,
    autoCloseDelay: 5000,
  },
};

export const Error: Story = {
  args: {
    toast: {
      id: 4,
      message: 'An error occurred while processing your request',
      type: 'error',
      duration: 5000,
      title: 'Error',
    },
    position: 'top-right',
    autoClose: true,
    autoCloseDelay: 5000,
  },
};

export const WithActions: Story = {
  args: {
    toast: {
      id: 5,
      message: 'Do you want to proceed with this action?',
      type: 'info',
      duration: 0, // Don't auto-close when there are actions
      title: 'Confirm Action',
      actions: [
        { label: 'Yes', onClick: () => console.log('Yes clicked') },
        { label: 'No', onClick: () => console.log('No clicked') },
      ],
    },
    position: 'top-right',
    autoClose: false,
  },
};

export const WithLink: Story = {
  args: {
    toast: {
      id: 6,
      message: 'New message received from John Doe',
      type: 'info',
      duration: 5000,
      title: 'New Message',
      link: '/messages/123',
    },
    position: 'top-right',
    autoClose: true,
    autoCloseDelay: 5000,
  },
};

export const TopLeft: Story = {
  args: {
    toast: {
      id: 7,
      message: 'This notification appears in the top-left corner',
      type: 'info',
      duration: 5000,
      title: 'Top Left',
    },
    position: 'top-left',
    autoClose: true,
    autoCloseDelay: 5000,
  },
};

export const BottomRight: Story = {
  args: {
    toast: {
      id: 8,
      message: 'This notification appears in the bottom-right corner',
      type: 'info',
      duration: 5000,
      title: 'Bottom Right',
    },
    position: 'bottom-right',
    autoClose: true,
    autoCloseDelay: 5000,
  },
};

export const BottomLeft: Story = {
  args: {
    toast: {
      id: 9,
      message: 'This notification appears in the bottom-left corner',
      type: 'info',
      duration: 5000,
      title: 'Bottom Left',
    },
    position: 'bottom-left',
    autoClose: true,
    autoCloseDelay: 5000,
  },
};
