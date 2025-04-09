'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Props for the ErrorBoundary component
 *
 * @property {ReactNode} children - Child components to be wrapped by the error boundary
 * @property {string} [fallbackText] - Custom text to display when an error occurs
 * @property {() => void} [onReset] - Optional callback to trigger when the user clicks reset
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackText?: string;
  onReset?: () => void;
}

/**
 * State for the ErrorBoundary component
 *
 * @property {Error | null} error - The error that was caught, if any
 * @property {boolean} hasError - Whether an error has been caught
 */
interface ErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
}

/**
 * A component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallbackText="Something went wrong with the chat">
 *   <ChatInterface userId="user1" />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * Update state when an error occurs
   * @param error The error that was thrown
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Log detailed error information
   * @param error The error that occurred
   * @param errorInfo Additional information about the component stack
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to an error reporting service
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // In a production app, you would send this to your error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  /**
   * Reset the error state
   */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallbackText } = this.props;

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-muted">
          <div className="bg-red-100 rounded-full p-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-center mb-4">
            {fallbackText || "We're having trouble loading this component."}
          </p>
          {error && (
            <div className="bg-background/80 p-3 rounded-md w-full max-w-md overflow-auto mb-4">
              <p className="text-sm font-mono text-red-500">{error.toString()}</p>
            </div>
          )}
          <Button onClick={this.handleReset}>Try Again</Button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
