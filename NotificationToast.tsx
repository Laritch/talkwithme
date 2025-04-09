import React, { useEffect, useState } from 'react';
import { Toast } from '../../store/slices/uiSlice';
import Link from 'next/link';

/**
 * Props for the NotificationToast component
 */
interface NotificationToastProps {
  toast: Toast;
  onClose: (id: number) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoClose?: boolean;
  autoCloseDelay?: number;
}

/**
 * Notification toast component for displaying alerts and messages
 */
const NotificationToast: React.FC<NotificationToastProps> = ({
  toast,
  onClose,
  position = 'top-right',
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Set up initial animation and auto-close behavior
  useEffect(() => {
    // Start entrance animation
    setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // Set up auto-close if enabled
    if (autoClose) {
      const startTime = Date.now();
      const endTime = startTime + (toast.duration || autoCloseDelay);

      // Update progress bar
      const id = setInterval(() => {
        const now = Date.now();
        const remaining = endTime - now;
        const newProgress = 100 - (remaining / (toast.duration || autoCloseDelay)) * 100;

        setProgress(newProgress);

        if (newProgress >= 100) {
          clearInterval(id);
          handleClose();
        }
      }, 16);

      setIntervalId(id);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [toast, autoClose, autoCloseDelay]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);

    // Clean up interval
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Wait for exit animation to complete
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  // Get toast type classes
  const getTypeClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-500 text-blue-800';
    }
  };

  // Get progress bar color
  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`fixed ${getPositionClasses()} z-50 transition-transform duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div
        className={`max-w-sm w-full overflow-hidden shadow-lg rounded-lg pointer-events-auto border-l-4 ${getTypeClasses()}`}
      >
        <div className="relative">
          {/* Progress bar */}
          {autoClose && (
            <div
              className={`absolute bottom-0 left-0 h-0.5 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            ></div>
          )}

          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>

              <div className="ml-3 w-0 flex-1">
                {toast.title && (
                  <p className="font-medium text-sm">{toast.title}</p>
                )}

                <p className={`${toast.title ? 'mt-1' : ''} text-sm opacity-90`}>
                  {toast.message}
                </p>

                {/* Action buttons */}
                {toast.actions && toast.actions.length > 0 && (
                  <div className="mt-3 flex space-x-4">
                    {toast.actions.map((action, index) => (
                      <button
                        key={index}
                        className="inline-flex text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => {
                          action.onClick();
                          handleClose();
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Link to notification source */}
                {toast.link && (
                  <div className="mt-2">
                    <Link
                      href={toast.link}
                      className="text-sm font-medium underline hover:opacity-80"
                      onClick={handleClose}
                    >
                      View details
                    </Link>
                  </div>
                )}
              </div>

              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-gray-400 focus:outline-none hover:text-gray-500"
                  onClick={handleClose}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
