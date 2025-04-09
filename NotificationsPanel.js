import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import {
  fetchNotifications,
  markNotificationAsRead,
  dismissNotification,
  selectAllNotifications,
  selectUnreadCount,
  selectHighPriorityCount,
  selectIsLoading,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
} from '../../store/slices/notificationsSlice';
import { eventTracker } from '../../utils/analytics';
import { NOTIFICATION_EVENTS, DATA_CATEGORIES } from '../../utils/analytics/eventSchema';
import {
  contentExperiment,
  timingExperiment
} from '../../utils/ml/abTesting';

const NotificationsPanel = ({ onClose, onNotificationInteraction }) => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const highPriorityCount = useSelector(selectHighPriorityCount);
  const isLoading = useSelector(selectIsLoading);
  const userId = useSelector(state => state.user?.id || 'anonymous-user');

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'high-priority', or by type
  const [viewedNotifications, setViewedNotifications] = useState(new Set());
  const [viewStartTimes, setViewStartTimes] = useState({});

  useEffect(() => {
    // Fetch notifications when component mounts
    dispatch(fetchNotifications());

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Track which notifications are visible in the panel
  useEffect(() => {
    const filteredNotifs = filteredNotifications();
    if (filteredNotifs.length === 0) return;

    // Record start time for newly visible notifications
    const startTimes = { ...viewStartTimes };
    const nowTime = Date.now();

    // Track notification_viewed events for notifications that became visible
    filteredNotifs.forEach((notification, index) => {
      if (!viewedNotifications.has(notification.id)) {
        // This is a newly visible notification
        eventTracker.track(NOTIFICATION_EVENTS.NOTIFICATION_VIEWED, {
          notification_id: notification.id,
          notification_type: notification.type,
          priority: notification.priority,
          is_read: notification.read,
          position_in_list: index,
          timestamp: new Date().toISOString(),
          view_duration: 0 // Initial view, duration will be updated when scrolled away
        }, DATA_CATEGORIES.FUNCTIONAL);

        // Track view for any experiment this notification is part of
        if (notification._experimentId) {
          if (notification._experimentType === 'content_experiment') {
            contentExperiment.trackView(notification._experimentId, userId, notification.id);
          } else if (notification._experimentType === 'timing_experiment') {
            timingExperiment.trackView(notification._experimentId, userId, notification.id);
          }
        }

        // Record view start time for duration tracking
        startTimes[notification.id] = nowTime;
      }
    });

    // Update view start times
    setViewStartTimes(startTimes);

    // Update viewed notifications set
    setViewedNotifications(new Set(filteredNotifs.map(n => n.id)));
  }, [filter, notifications]);

  const handleMarkAsRead = (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    // Track the read event
    const viewDuration = viewStartTimes[id] ? Date.now() - viewStartTimes[id] : 0;

    eventTracker.track(NOTIFICATION_EVENTS.NOTIFICATION_MARKED_READ, {
      notification_id: id,
      notification_type: notification.type,
      priority: notification.priority,
      time_to_read: viewDuration,
      position_in_list: filteredNotifications().findIndex(n => n.id === id),
      timestamp: new Date().toISOString()
    }, DATA_CATEGORIES.FUNCTIONAL);

    // Update interaction count
    if (onNotificationInteraction) {
      onNotificationInteraction();
    }

    dispatch(markNotificationAsRead(id));
  };

  const handleDismiss = (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    // Track the dismiss event
    const viewDuration = viewStartTimes[id] ? Date.now() - viewStartTimes[id] : 0;

    eventTracker.track(NOTIFICATION_EVENTS.NOTIFICATION_DISMISSED, {
      notification_id: id,
      notification_type: notification.type,
      priority: notification.priority,
      time_to_dismiss: viewDuration,
      is_read: notification.read,
      timestamp: new Date().toISOString(),
      reason: 'user_dismissed'
    }, DATA_CATEGORIES.FUNCTIONAL);

    // Update interaction count
    if (onNotificationInteraction) {
      onNotificationInteraction();
    }

    dispatch(dismissNotification(id));
  };

  const handleLinkClick = (notification) => {
    // Track the click event
    const viewDuration = viewStartTimes[notification.id] ? Date.now() - viewStartTimes[notification.id] : 0;

    eventTracker.track(NOTIFICATION_EVENTS.NOTIFICATION_CLICKED, {
      notification_id: notification.id,
      notification_type: notification.type,
      priority: notification.priority,
      time_to_click: viewDuration,
      is_read: notification.read,
      link: notification.link,
      timestamp: new Date().toISOString(),
      position_in_list: filteredNotifications().findIndex(n => n.id === notification.id)
    }, DATA_CATEGORIES.FUNCTIONAL);

    // Track click for any experiment this notification is part of
    if (notification._experimentId) {
      if (notification._experimentType === 'content_experiment') {
        contentExperiment.trackClick(notification._experimentId, userId, notification.id);
      } else if (notification._experimentType === 'timing_experiment') {
        timingExperiment.trackClick(notification._experimentId, userId, notification.id);
      }
    }

    // Also track as an action if the notification required action
    if (notification.actionRequired) {
      eventTracker.track(NOTIFICATION_EVENTS.ACTION_TAKEN, {
        notification_id: notification.id,
        notification_type: notification.type,
        action_type: 'link_click',
        time_to_action: viewDuration,
        success: true,
        timestamp: new Date().toISOString(),
        destination_page: notification.link
      }, DATA_CATEGORIES.FUNCTIONAL);

      // Track action for any experiment this notification is part of
      if (notification._experimentId) {
        if (notification._experimentType === 'content_experiment') {
          contentExperiment.trackAction(notification._experimentId, userId, notification.id);
        } else if (notification._experimentType === 'timing_experiment') {
          timingExperiment.trackAction(notification._experimentId, userId, notification.id);
        }
      }
    }

    // Update interaction count
    if (onNotificationInteraction) {
      onNotificationInteraction();
    }

    // Mark as read when clicking
    handleMarkAsRead(notification.id);
  };

  const handleFilterChange = (newFilter) => {
    // Track filter change
    eventTracker.track(NOTIFICATION_EVENTS.FILTER_CHANGED, {
      previous_filter: filter,
      new_filter: newFilter,
      visible_count: filteredNotifications(newFilter).length,
      timestamp: new Date().toISOString()
    }, DATA_CATEGORIES.FUNCTIONAL);

    setFilter(newFilter);
  };

  // Function to filter notifications based on current filter
  const filteredNotifications = (currentFilter = filter) => {
    switch (currentFilter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'high-priority':
        return notifications.filter(n =>
          (n.priority === NOTIFICATION_PRIORITIES.HIGH ||
           n.priority === NOTIFICATION_PRIORITIES.CRITICAL) &&
          !n.dismissed
        );
      case NOTIFICATION_TYPES.COMPLIANCE_UPDATE:
      case NOTIFICATION_TYPES.LICENSE_EXPIRY:
      case NOTIFICATION_TYPES.REGULATORY_CHANGE:
      case NOTIFICATION_TYPES.GDPR_UPDATE:
      case NOTIFICATION_TYPES.HIPAA_UPDATE:
      case NOTIFICATION_TYPES.REGIONAL_RESTRICTION:
      case NOTIFICATION_TYPES.TIMEZONE_CONFLICT:
        return notifications.filter(n => n.type === currentFilter && !n.dismissed);
      default:
        return notifications.filter(n => !n.dismissed);
    }
  };

  // Function to format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Function to get appropriate color based on notification priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case NOTIFICATION_PRIORITIES.CRITICAL:
        return 'bg-red-100 border-red-500';
      case NOTIFICATION_PRIORITIES.HIGH:
        return 'bg-orange-100 border-orange-500';
      case NOTIFICATION_PRIORITIES.MEDIUM:
        return 'bg-yellow-100 border-yellow-500';
      case NOTIFICATION_PRIORITIES.LOW:
      default:
        return 'bg-blue-100 border-blue-500';
    }
  };

  // Function to get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.COMPLIANCE_UPDATE:
        return '📋';
      case NOTIFICATION_TYPES.LICENSE_EXPIRY:
        return '🔔';
      case NOTIFICATION_TYPES.REGULATORY_CHANGE:
        return '📜';
      case NOTIFICATION_TYPES.GDPR_UPDATE:
        return '🇪🇺';
      case NOTIFICATION_TYPES.HIPAA_UPDATE:
        return '🏥';
      case NOTIFICATION_TYPES.REGIONAL_RESTRICTION:
        return '🌎';
      case NOTIFICATION_TYPES.CREDENTIAL_VERIFICATION:
        return '✅';
      case NOTIFICATION_TYPES.DATA_BREACH:
        return '⚠️';
      case NOTIFICATION_TYPES.PRIVACY_POLICY_UPDATE:
      case NOTIFICATION_TYPES.TERMS_UPDATE:
        return '📝';
      case NOTIFICATION_TYPES.TIMEZONE_CONFLICT:
        return '⏰';
      case NOTIFICATION_TYPES.AGE_VERIFICATION:
        return '🔞';
      case NOTIFICATION_TYPES.SYSTEM:
      default:
        return '💬';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="bg-black bg-opacity-25 absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white shadow-xl w-full max-w-md overflow-y-auto">
        <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="space-x-2">
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                {unreadCount} unread
              </span>
            )}
            {highPriorityCount > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                {highPriorityCount} high priority
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-2 bg-gray-50 flex flex-wrap gap-1 overflow-x-auto sticky top-16 z-10 border-b border-gray-200">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-2 py-1 rounded text-xs font-medium ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('unread')}
            className={`px-2 py-1 rounded text-xs font-medium ${filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Unread
          </button>
          <button
            onClick={() => handleFilterChange('high-priority')}
            className={`px-2 py-1 rounded text-xs font-medium ${filter === 'high-priority' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            High Priority
          </button>
          <button
            onClick={() => handleFilterChange(NOTIFICATION_TYPES.COMPLIANCE_UPDATE)}
            className={`px-2 py-1 rounded text-xs font-medium ${filter === NOTIFICATION_TYPES.COMPLIANCE_UPDATE ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Compliance
          </button>
          <button
            onClick={() => handleFilterChange(NOTIFICATION_TYPES.REGULATORY_CHANGE)}
            className={`px-2 py-1 rounded text-xs font-medium ${filter === NOTIFICATION_TYPES.REGULATORY_CHANGE ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Regulatory
          </button>
        </div>

        <div className="p-4">
          {isLoading && notifications.length === 0 ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications().length > 0 ? (
            <ul className="space-y-3">
              {filteredNotifications().map((notification) => (
                <li
                  key={notification.id}
                  className={`border-l-4 rounded p-3 ${getPriorityColor(notification.priority)} ${!notification.read ? 'font-medium' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-2">
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                      <div>
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500 space-x-2">
                          <span>{formatRelativeTime(notification.timestamp)}</span>
                          {notification.region && notification.region !== 'global' && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                              {notification.region}
                            </span>
                          )}
                          {notification.actionRequired && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                              Action required
                            </span>
                          )}
                          {notification._variation && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                              {notification._variation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  {notification.link && (
                    <div className="mt-2">
                      <Link href={notification.link} legacyBehavior>
                        <a
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          onClick={() => handleLinkClick(notification)}
                        >
                          View details →
                        </a>
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
