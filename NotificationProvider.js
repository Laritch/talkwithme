import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { addNotification, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../store/slices/notificationsSlice';
import {
  experimentManager,
  timingExperiment,
  contentExperiment,
  EXPERIMENT_TYPES
} from '../../utils/ml/abTesting';

// Create notification context
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const dispatch = useDispatch();
  const userId = useSelector(state => state.user?.id || 'anonymous-user');
  const [activeExperiments, setActiveExperiments] = useState({
    timing: [],
    content: []
  });

  // Load active experiments on component mount
  useEffect(() => {
    // Get all experiments
    const experiments = experimentManager.getAllExperiments();

    // Filter to active experiments and categorize by type
    const active = {
      timing: [],
      content: []
    };

    Object.entries(experiments).forEach(([id, experiment]) => {
      if (experiment.status === 'active') {
        if (experiment.type === EXPERIMENT_TYPES.TIMING) {
          active.timing.push(id);
        } else if (experiment.type === EXPERIMENT_TYPES.CONTENT) {
          active.content.push(id);
        }
      }
    });

    setActiveExperiments(active);
  }, []);

  // Generate a unique notification ID
  const generateNotificationId = () => {
    return `not-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Core function to create and dispatch a notification with A/B testing applied
  const createNotification = useCallback((notificationData) => {
    const id = generateNotificationId();
    const timestamp = new Date().toISOString();

    // Create the base notification
    let notification = {
      id,
      timestamp,
      read: false,
      dismissed: false,
      ...notificationData
    };

    // Apply content experiments if applicable
    if (activeExperiments.content.length > 0) {
      // Apply only the first applicable content experiment for simplicity
      const contentExperimentId = activeExperiments.content[0];

      // Apply the experiment (this will format notification content based on experiment variation)
      notification = contentExperiment.formatNotification(
        contentExperimentId,
        userId,
        notification
      );
    }

    // Check if timing experiments should affect this notification
    if (activeExperiments.timing.length > 0) {
      // Get the first timing experiment for simplicity
      const timingExperimentId = activeExperiments.timing[0];

      // Check if we should send this notification now based on the experiment
      const shouldSendNow = timingExperiment.shouldSendNow(timingExperimentId, userId);

      if (!shouldSendNow) {
        // Log that we're delaying this notification due to timing experiment
        console.log(`Notification ${id} delayed due to timing experiment ${timingExperimentId}`);

        // Track impression for the experiment even though we're not actually delaying
        timingExperiment.trackImpression(timingExperimentId, userId, id);
      }
    }

    // Dispatch the notification to Redux
    dispatch(addNotification(notification));
    return id;
  }, [dispatch, userId, activeExperiments]);

  // Helper functions for specific notification types

  // Compliance notifications
  const notifyComplianceUpdate = useCallback((title, message, options = {}) => {
    return createNotification({
      type: NOTIFICATION_TYPES.COMPLIANCE_UPDATE,
      title,
      message,
      priority: options.priority || NOTIFICATION_PRIORITIES.MEDIUM,
      region: options.region || 'global',
      actionRequired: options.actionRequired || false,
      link: options.link || '/compliance'
    });
  }, [createNotification]);

  // License notifications
  const notifyLicenseExpiry = useCallback((title, message, options = {}) => {
    return createNotification({
      type: NOTIFICATION_TYPES.LICENSE_EXPIRY,
      title,
      message,
      priority: options.priority || NOTIFICATION_PRIORITIES.HIGH,
      region: options.region,
      actionRequired: options.actionRequired !== undefined ? options.actionRequired : true,
      link: options.link || '/compliance/licensing'
    });
  }, [createNotification]);

  // Regulatory change notifications
  const notifyRegulatoryChange = useCallback((title, message, options = {}) => {
    return createNotification({
      type: NOTIFICATION_TYPES.REGULATORY_CHANGE,
      title,
      message,
      priority: options.priority || NOTIFICATION_PRIORITIES.MEDIUM,
      region: options.region,
      actionRequired: options.actionRequired || false,
      link: options.link
    });
  }, [createNotification]);

  // GDPR specific notifications
  const notifyGDPRUpdate = useCallback((title, message, options = {}) => {
    return createNotification({
      type: NOTIFICATION_TYPES.GDPR_UPDATE,
      title,
      message,
      priority: options.priority || NOTIFICATION_PRIORITIES.MEDIUM,
      region: options.region || 'EU',
      actionRequired: options.actionRequired || false,
      link: options.link || '/compliance/gdpr'
    });
  }, [createNotification]);

  // HIPAA specific notifications
  const notifyHIPAAUpdate = useCallback((title, message, options = {}) => {
    return createNotification({
      type: NOTIFICATION_TYPES.HIPAA_UPDATE,
      title,
      message,
      priority: options.priority || NOTIFICATION_PRIORITIES.HIGH,
      region: options.region || 'US',
      actionRequired: options.actionRequired || true,
      link: options.link || '/compliance/hipaa'
    });
  }, [createNotification]);

  // Time zone conflict notifications
  const notifyTimeZoneConflict = useCallback((title, message, options = {}) => {
    return createNotification({
      type: NOTIFICATION_TYPES.TIMEZONE_CONFLICT,
      title,
      message,
      priority: options.priority || NOTIFICATION_PRIORITIES.MEDIUM,
      region: options.region || 'global',
      actionRequired: options.actionRequired || false,
      link: options.link || '/time-zone-demo'
    });
  }, [createNotification]);

  // Regional restriction notifications
  const notifyRegionalRestriction = useCallback((title, message, options = {}) => {
    return createNotification({
      type: NOTIFICATION_TYPES.REGIONAL_RESTRICTION,
      title,
      message,
      priority: options.priority || NOTIFICATION_PRIORITIES.HIGH,
      region: options.region,
      actionRequired: options.actionRequired !== undefined ? options.actionRequired : true,
      link: options.link || '/region-restricted'
    });
  }, [createNotification]);

  // System notifications
  const notifySystem = useCallback((title, message, options = {}) => {
    return createNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      title,
      message,
      priority: options.priority || NOTIFICATION_PRIORITIES.LOW,
      region: 'global',
      actionRequired: options.actionRequired || false,
      link: options.link
    });
  }, [createNotification]);

  // Create the context value
  const contextValue = {
    createNotification,
    notifyComplianceUpdate,
    notifyLicenseExpiry,
    notifyRegulatoryChange,
    notifyGDPRUpdate,
    notifyHIPAAUpdate,
    notifyTimeZoneConflict,
    notifyRegionalRestriction,
    notifySystem,
    activeExperiments
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
