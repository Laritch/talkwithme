import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectUnreadCount,
  selectHighPriorityCount,
  selectAllNotifications,
  fetchNotifications
} from '../../store/slices/notificationsSlice';
import NotificationsPanel from './NotificationsPanel';
import { eventTracker } from '../../utils/analytics';
import { NOTIFICATION_EVENTS, DATA_CATEGORIES } from '../../utils/analytics/eventSchema';

const NotificationsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useSelector(selectUnreadCount);
  const highPriorityCount = useSelector(selectHighPriorityCount);
  const notifications = useSelector(selectAllNotifications);
  const dispatch = useDispatch();

  // Track when the button is mounted and the unread/high priority counts
  useEffect(() => {
    if (unreadCount > 0 || highPriorityCount > 0) {
      // Track notification impression
      eventTracker.track(NOTIFICATION_EVENTS.IMPRESSION, {
        notification_count: unreadCount,
        high_priority_count: highPriorityCount,
        location: 'header_button',
        timestamp: new Date().toISOString()
      }, DATA_CATEGORIES.FUNCTIONAL);
    }
  }, [unreadCount, highPriorityCount]);

  useEffect(() => {
    // Initial fetch of notifications
    dispatch(fetchNotifications());

    // Periodically check for new notifications (every 2 minutes)
    const interval = setInterval(() => {
      if (!isOpen) { // Only auto-fetch when panel is closed
        dispatch(fetchNotifications());
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [dispatch, isOpen]);

  const togglePanel = () => {
    if (!isOpen) {
      // Refresh notifications when opening panel
      dispatch(fetchNotifications());

      // Track panel open event
      eventTracker.track(NOTIFICATION_EVENTS.PANEL_OPENED, {
        unread_count: unreadCount,
        total_notifications: notifications.length,
        trigger_element: 'notification_button',
        timestamp: new Date().toISOString()
      }, DATA_CATEGORIES.FUNCTIONAL);
    } else {
      // Track panel close event
      eventTracker.track(NOTIFICATION_EVENTS.PANEL_CLOSED, {
        duration_open: getPanelOpenDuration(),
        notifications_interacted: getInteractedCount(),
        timestamp: new Date().toISOString()
      }, DATA_CATEGORIES.FUNCTIONAL);
    }

    setIsOpen(!isOpen);
  };

  // Track how long the panel has been open
  const [panelOpenTime, setPanelOpenTime] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPanelOpenTime(Date.now());
    } else {
      setPanelOpenTime(null);
    }
  }, [isOpen]);

  // Calculate how long the panel has been open
  const getPanelOpenDuration = () => {
    if (!panelOpenTime) return 0;
    return Math.floor((Date.now() - panelOpenTime) / 1000);
  };

  // Track how many notifications were interacted with
  // In a real implementation, this would track actual interactions
  const [interactedCount, setInteractedCount] = useState(0);

  const getInteractedCount = () => {
    return interactedCount;
  };

  // Handle panel close event from the panel itself
  const handlePanelClose = () => {
    // Track panel close event
    eventTracker.track(NOTIFICATION_EVENTS.PANEL_CLOSED, {
      duration_open: getPanelOpenDuration(),
      notifications_interacted: getInteractedCount(),
      timestamp: new Date().toISOString()
    }, DATA_CATEGORIES.FUNCTIONAL);

    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={togglePanel}
        className="relative inline-flex items-center justify-center p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification badges */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 text-white text-xs items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}

        {/* High priority indicator */}
        {highPriorityCount > 0 && (
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && <NotificationsPanel
        onClose={handlePanelClose}
        onNotificationInteraction={() => setInteractedCount(prev => prev + 1)}
      />}
    </>
  );
};

export default NotificationsButton;
