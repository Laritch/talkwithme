import { useMemo } from 'react';
import classNames from 'classnames';
import { Element, ModerationStatus } from '../types';
import useWhiteboardModeration from '../hooks/useWhiteboardModeration';

interface ModerationIndicatorProps {
  element: Element;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ModerationIndicator = ({
  element,
  position = 'top-right',
  showLabel = false,
  size = 'md',
}: ModerationIndicatorProps) => {
  const { moderationConfig } = useWhiteboardModeration();

  const statusConfig = useMemo(() => {
    switch (element.moderationStatus) {
      case ModerationStatus.Approved:
        return {
          icon: '✓',
          color: 'bg-green-500',
          label: 'Approved',
          show: false, // Don't show indicators for approved content by default
        };
      case ModerationStatus.Pending:
        return {
          icon: '⌛',
          color: 'bg-yellow-500',
          label: 'Pending',
          show: true,
        };
      case ModerationStatus.Flagged:
        return {
          icon: '⚠️',
          color: 'bg-orange-500',
          label: 'Flagged',
          show: true,
        };
      case ModerationStatus.Rejected:
        return {
          icon: '✖',
          color: 'bg-red-600',
          label: 'Rejected',
          show: true,
        };
      default:
        return {
          icon: '?',
          color: 'bg-gray-500',
          label: 'Unknown',
          show: false,
        };
    }
  }, [element.moderationStatus]);

  // Don't show anything if moderation is disabled or it's approved and we don't show approved
  if (!moderationConfig.enabled || (element.moderationStatus === ModerationStatus.Approved && !statusConfig.show)) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  return (
    <div
      className={classNames(
        'absolute rounded-full flex items-center justify-center text-white font-bold shadow-md z-10',
        statusConfig.color,
        positionClasses[position],
        sizeClasses[size],
        {
          'cursor-help': showLabel,
        }
      )}
      title={element.moderationReason ? `${statusConfig.label}: ${element.moderationReason}` : statusConfig.label}
    >
      <span>{statusConfig.icon}</span>

      {showLabel && (
        <span className="absolute whitespace-nowrap bg-white text-gray-800 text-xs font-medium px-2 py-1 rounded-md shadow-sm -mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
          {statusConfig.label}
        </span>
      )}
    </div>
  );
};

export default ModerationIndicator;
