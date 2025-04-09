import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationToast from './NotificationToast';
import { Toast } from '../../store/slices/uiSlice';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: any) => {
    return React.createElement('a', { href, onClick }, children);
  }
}));

describe('NotificationToast Component', () => {
  // Mock timers
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // Mock the onClose handler
  const mockOnClose = vi.fn();

  // Common toast props
  const baseToast: Toast = {
    id: 123,
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test notification message',
    duration: 3000,
  };

  it('renders toast with correct content', async () => {
    render(
      <NotificationToast
        toast={baseToast}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Check that title and message are displayed
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification message')).toBeInTheDocument();
  });

  it('applies correct styling based on toast type', async () => {
    const successToast = { ...baseToast, type: 'success' as const };
    const { rerender } = render(
      <NotificationToast
        toast={successToast}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Check that success styling is applied
    const toastElement = screen.getByText('Test Notification').closest('div.max-w-sm');
    expect(toastElement).toHaveClass('border-l-4');
    expect(toastElement).toHaveClass('bg-green-50');
    expect(toastElement).toHaveClass('border-green-500');

    // Rerender with error type
    const errorToast = { ...baseToast, type: 'error' as const };
    rerender(
      <NotificationToast
        toast={errorToast}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Check that error styling is applied
    expect(toastElement).toHaveClass('bg-red-50');
    expect(toastElement).toHaveClass('border-red-500');
  });

  it('calls onClose when close button is clicked', async () => {
    render(
      <NotificationToast
        toast={baseToast}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Find close button and click it
    const closeButton = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(closeButton);
    });

    // Advance timers to complete the animation
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Check that onClose was called with the correct ID
    expect(mockOnClose).toHaveBeenCalledWith(baseToast.id);
  });

  it('shows progress bar when autoClose is true', async () => {
    render(
      <NotificationToast
        toast={baseToast}
        onClose={mockOnClose}
        autoClose={true}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Check that progress bar exists - use a more specific selector
    const progressBar = document.querySelector('div[class*="h-0.5"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('does not show progress bar when autoClose is false', async () => {
    render(
      <NotificationToast
        toast={baseToast}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Check that progress bar doesn't exist - use a more specific selector
    const progressBar = document.querySelector('div[class*="h-0.5"]');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('auto-closes after the specified duration', async () => {
    render(
      <NotificationToast
        toast={baseToast}
        onClose={mockOnClose}
        autoClose={true}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Fast-forward past the duration
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Advance timers to complete the animation
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalledWith(baseToast.id);
  });

  it('renders link if provided', async () => {
    const toastWithLink = {
      ...baseToast,
      link: '/notifications/123',
    };

    render(
      <NotificationToast
        toast={toastWithLink}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Check that link exists
    const link = screen.getByText('View details');
    expect(link).toHaveAttribute('href', '/notifications/123');
  });

  it('renders action buttons if provided', async () => {
    const mockActionClick = vi.fn();
    const action1 = { label: 'Confirm', onClick: mockActionClick };
    const action2 = { label: 'Cancel', onClick: vi.fn() };

    const toastWithActions = {
      ...baseToast,
      actions: [action1, action2],
    };

    render(
      <NotificationToast
        toast={toastWithActions}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Check that action buttons exist
    const confirmButton = screen.getByText('Confirm');
    const cancelButton = screen.getByText('Cancel');

    expect(confirmButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    // Click the confirm button
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Check that action handler was called
    expect(mockActionClick).toHaveBeenCalled();

    // Advance timers to complete the animation
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalledWith(baseToast.id);
  });

  it('applies correct position classes', async () => {
    const { rerender } = render(
      <NotificationToast
        toast={baseToast}
        onClose={mockOnClose}
        position="top-left"
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Check top-left position
    let toastContainer = screen.getByText('Test Notification').closest('div.fixed');
    expect(toastContainer).toHaveClass('top-4');
    expect(toastContainer).toHaveClass('left-4');

    // Check bottom-right position
    rerender(
      <NotificationToast
        toast={baseToast}
        onClose={mockOnClose}
        position="bottom-right"
        autoClose={false}
      />
    );

    // Act for the setTimeout effect to run
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(toastContainer).toHaveClass('bottom-4');
    expect(toastContainer).toHaveClass('right-4');
  });
});
