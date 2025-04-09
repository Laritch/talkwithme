import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  BellAlertIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  BookmarkIcon,
  ArrowPathIcon,
  DocumentPlusIcon,
  UserPlusIcon,
  ChatBubbleLeftIcon,
  StarIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from './i18n';

// Mock notifications data
const MOCK_NOTIFICATIONS = [
  {
    id: 'notif1',
    type: 'resource_added',
    title: 'New resource added',
    description: 'Marketing Strategy 2023 has been added to the library',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    isRead: false,
    resourceId: 'res1',
    resourceTitle: 'Marketing Strategy 2023',
    userId: 'user1',
    userName: 'John Smith'
  },
  {
    id: 'notif2',
    type: 'resource_updated',
    title: 'Resource updated',
    description: 'Q2 Financial Report has been updated with new information',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    isRead: false,
    resourceId: 'res2',
    resourceTitle: 'Q2 Financial Report',
    userId: 'user2',
    userName: 'Sarah Johnson'
  },
  {
    id: 'notif3',
    type: 'comment_added',
    title: 'New comment',
    description: 'Michael Chen commented on Product Launch Plan',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    isRead: true,
    resourceId: 'res3',
    resourceTitle: 'Product Launch Plan',
    userId: 'user3',
    userName: 'Michael Chen',
    commentId: 'comment1',
    commentText: 'Great work on this! The timeline looks realistic.'
  },
  {
    id: 'notif4',
    type: 'shared_with_you',
    title: 'Resource shared with you',
    description: 'Jessica Williams shared Company Handbook with you',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
    resourceId: 'res4',
    resourceTitle: 'Company Handbook',
    userId: 'user4',
    userName: 'Jessica Williams'
  },
  {
    id: 'notif5',
    type: 'access_granted',
    title: 'Access granted',
    description: 'You now have editor access to Sales Training Video',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    isRead: true,
    resourceId: 'res5',
    resourceTitle: 'Sales Training Video',
    userId: 'user5',
    userName: 'David Kim'
  }
];

// Notification types and their icons
const NOTIFICATION_TYPES = {
  resource_added: {
    icon: <DocumentPlusIcon className="h-6 w-6 text-green-500" />,
    color: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  resource_updated: {
    icon: <ArrowPathIcon className="h-6 w-6 text-blue-500" />,
    color: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  comment_added: {
    icon: <ChatBubbleLeftIcon className="h-6 w-6 text-purple-500" />,
    color: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  shared_with_you: {
    icon: <UserPlusIcon className="h-6 w-6 text-indigo-500" />,
    color: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  access_granted: {
    icon: <BookmarkIcon className="h-6 w-6 text-amber-500" />,
    color: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  default: {
    icon: <BellIcon className="h-6 w-6 text-gray-500" />,
    color: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

const NotificationSystem = ({ onClose, onViewResource }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  // Get filtered notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      if (days === 1) {
        return 'Yesterday';
      } else if (days < 7) {
        return `${days} days ago`;
      } else {
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId ? { ...notification, isRead: true } : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
      setLoading(false);
    }, 500);
  };

  // Delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
  };

  // Delete all notifications
  const deleteAllNotifications = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setNotifications([]);
      setLoading(false);
    }, 500);
  };

  // Handle notification click (view resource)
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (onViewResource) {
      onViewResource(notification.resourceId);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <BellIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="border-b border-gray-200 px-6 py-2 bg-gray-50 flex flex-wrap justify-between items-center gap-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'unread'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'read'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Read
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={markAllAsRead}
              disabled={loading || unreadCount === 0}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                loading || unreadCount === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Mark all read
            </button>
            <button
              onClick={deleteAllNotifications}
              disabled={loading || notifications.length === 0}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                loading || notifications.length === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Clear all
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all'
                  ? 'You don\'t have any notifications yet.'
                  : filter === 'unread'
                    ? 'You don\'t have any unread notifications.'
                    : 'You don\'t have any read notifications.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => {
              const notifType = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.default;

              return (
                <div
                  key={notification.id}
                  className={`relative p-6 hover:bg-gray-50 ${!notification.isRead ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className={`h-12 w-12 rounded-full ${notifType.color} flex items-center justify-center`}>
                        {notifType.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                        <p className="mt-1 text-sm text-gray-500 truncate">{notification.description}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="mr-2 text-gray-400 hover:text-indigo-600"
                          title="Mark as read"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete notification"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;
