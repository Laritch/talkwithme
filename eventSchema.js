/**
 * Notification Analytics Event Schema
 *
 * This file defines the structure and types of events tracked for notification analytics.
 * These events form the foundation for future machine learning enhancements.
 */

// Notification event types
export const NOTIFICATION_EVENTS = {
  NOTIFICATION_RECEIVED: 'notification_received',    // When a notification is created and delivered
  NOTIFICATION_VIEWED: 'notification_viewed',        // When a notification is visible to the user
  NOTIFICATION_CLICKED: 'notification_clicked',      // When a user clicks on a notification
  NOTIFICATION_DISMISSED: 'notification_dismissed',  // When a user dismisses a notification
  NOTIFICATION_MARKED_READ: 'notification_marked_read', // When a user marks as read
  ACTION_TAKEN: 'notification_action_taken',         // When a user takes an action from notification
  PANEL_OPENED: 'notification_panel_opened',         // When notification panel is opened
  PANEL_CLOSED: 'notification_panel_closed',         // When notification panel is closed
  FILTER_CHANGED: 'notification_filter_changed',     // When notification filter is changed
  IMPRESSION: 'notification_impression'              // When notification button shows counters
};

// User context event types
export const USER_CONTEXT = {
  LOCATION: 'user_location',                 // User geographic location
  DEVICE: 'user_device',                     // User device information
  TIMEZONE: 'user_timezone',                 // User timezone
  SESSION_DURATION: 'session_duration',      // Length of user session
  ROLE: 'user_role',                         // User role in the system
  PROFESSIONAL_CATEGORY: 'professional_category', // User's professional category
  LANGUAGE: 'user_language',                 // User's preferred language
  LOGIN_STATE: 'login_state',                // User's login status
  LAST_ACTIVE: 'last_active'                 // Last user activity timestamp
};

// Event schemas for validation
export const eventSchema = {
  [NOTIFICATION_EVENTS.NOTIFICATION_RECEIVED]: {
    notification_id: 'string',       // Unique ID of the notification
    notification_type: 'string',     // Type of notification (compliance, license, etc.)
    priority: 'string',              // Priority level (low, medium, high, critical)
    timestamp: 'datetime',           // When the notification was created
    region: 'string',                // Targeted region of the notification
    user_id: 'string',               // ID of the user receiving the notification
    action_required: 'boolean',      // Whether the notification requires action
    has_link: 'boolean'              // Whether the notification has a link
  },

  [NOTIFICATION_EVENTS.NOTIFICATION_VIEWED]: {
    notification_id: 'string',       // Unique ID of the notification
    notification_type: 'string',     // Type of notification
    priority: 'string',              // Priority level
    timestamp: 'datetime',           // When the notification was viewed
    is_read: 'boolean',              // Whether the notification was already read
    position_in_list: 'number',      // Position in the notification list (for impression studies)
    view_duration: 'number'          // How long the notification was in view (milliseconds)
  },

  [NOTIFICATION_EVENTS.NOTIFICATION_CLICKED]: {
    notification_id: 'string',       // Unique ID of the notification
    notification_type: 'string',     // Type of notification
    timestamp: 'datetime',           // When the notification was clicked
    link: 'string',                  // The link that was clicked
    time_to_click: 'number',         // Time between view and click (milliseconds)
    is_read: 'boolean',              // Whether the notification was already read
    position_in_list: 'number'       // Position in the notification list
  },

  [NOTIFICATION_EVENTS.NOTIFICATION_DISMISSED]: {
    notification_id: 'string',       // Unique ID of the notification
    notification_type: 'string',     // Type of notification
    timestamp: 'datetime',           // When the notification was dismissed
    time_to_dismiss: 'number',       // Time between view and dismiss (milliseconds)
    is_read: 'boolean',              // Whether the notification was read before dismissal
    reason: 'string'                 // Optional reason for dismissal if provided
  },

  [NOTIFICATION_EVENTS.NOTIFICATION_MARKED_READ]: {
    notification_id: 'string',       // Unique ID of the notification
    notification_type: 'string',     // Type of notification
    timestamp: 'datetime',           // When the notification was marked as read
    time_to_read: 'number',          // Time between view and mark as read (milliseconds)
    position_in_list: 'number'       // Position in the notification list
  },

  [NOTIFICATION_EVENTS.ACTION_TAKEN]: {
    notification_id: 'string',       // Unique ID of the notification
    notification_type: 'string',     // Type of notification
    timestamp: 'datetime',           // When the action was taken
    action_type: 'string',           // Type of action taken
    time_to_action: 'number',        // Time between view and action (milliseconds)
    success: 'boolean',              // Whether the action was successful
    destination_page: 'string'       // Destination page after action
  },

  [NOTIFICATION_EVENTS.PANEL_OPENED]: {
    timestamp: 'datetime',           // When the panel was opened
    unread_count: 'number',          // Count of unread notifications
    total_notifications: 'number',   // Total count of notifications
    trigger_element: 'string'        // UI element that triggered the panel open
  },

  [NOTIFICATION_EVENTS.PANEL_CLOSED]: {
    timestamp: 'datetime',           // When the panel was closed
    duration_open: 'number',         // How long the panel was open (milliseconds)
    notifications_interacted: 'number' // Number of notifications interacted with
  },

  [NOTIFICATION_EVENTS.FILTER_CHANGED]: {
    timestamp: 'datetime',           // When the filter was changed
    previous_filter: 'string',       // Previous filter value
    new_filter: 'string',            // New filter value
    visible_count: 'number'          // Count of visible notifications after filter
  },

  [NOTIFICATION_EVENTS.IMPRESSION]: {
    timestamp: 'datetime',           // When the impression occurred
    notification_count: 'number',    // Count of notifications in the impression
    high_priority_count: 'number',   // Count of high priority notifications
    location: 'string'               // UI location of the impression
  },

  // User context event
  'user_context_updated': {
    timestamp: 'datetime',           // When the context was updated
    timezone: 'string',              // User's timezone
    device_type: 'string',           // User's device type
    screen_size: 'string',           // User's screen size
    session_duration: 'number',      // Current session duration (seconds)
    language: 'string',              // User's language
    region: 'string',                // User's geographic region
    last_notification_interaction: 'datetime', // When user last interacted with a notification
    browser: 'string'                // User's browser
  },

  // Expert matching event schemas
  'expert_search_initiated': {
    user_id: 'string',               // ID of the user initiating the search
    timestamp: 'datetime',           // When the search was initiated
    query: 'string',                 // Search query
    languages: 'array',              // Languages specified in the search
    expertise_areas: 'array',        // Areas of expertise specified in the search
    filters_applied: 'array'         // Filters applied during the search
  },

  'expert_results_viewed': {
    user_id: 'string',               // ID of the user viewing the results
    timestamp: 'datetime',           // When the results were viewed
    experts_shown: 'number',         // Number of experts shown in the results
    query: 'string',                 // The search query used
    page_number: 'number',           // Page number of the results viewed
    sort_order: 'string',            // Sort order of the results
    algorithm_used: 'string'         // Algorithm used for matching
  },

  'expert_selected': {
    user_id: 'string',               // ID of the user selecting the expert
    timestamp: 'datetime',           // When the expert was selected
    expert_id: 'string',             // ID of the selected expert
    position: 'number',              // Position of the expert in the results
    match_score: 'number',           // Match score for the selected expert
    expertise_areas: 'array',        // Areas of expertise of the selected expert
    search_query: 'string'           // The search query used
  },

  'expert_booking_completed': {
    user_id: 'string',               // ID of the user completing the booking
    timestamp: 'datetime',           // When the booking was completed
    expert_id: 'string',             // ID of the booked expert
    session_date: 'datetime',        // Date of the session
    session_duration: 'number',      // Duration of the session
    session_type: 'string',          // Type of session (e.g., video, in-person)
    price: 'number',                 // Price of the session
    currency: 'string'               // Currency of the price
  },

  'expert_session_completed': {
    user_id: 'string',               // ID of the user completing the session
    timestamp: 'datetime',           // When the session was completed
    expert_id: 'string',             // ID of the expert involved
    session_duration: 'number',      // Duration of the session
    rating: 'number',                // Rating given by the user
    feedback: 'string',              // Feedback provided by the user
    follow_up_requested: 'boolean'   // Whether a follow-up was requested
  }
};

// Data privacy categories for different types of analytics data
export const DATA_CATEGORIES = {
  ESSENTIAL: 'essential',      // Essential for app functioning
  FUNCTIONAL: 'functional',    // Improves functionality but not essential
  PERFORMANCE: 'performance',  // Performance and usage analytics
  TARGETING: 'targeting',      // Personalization and targeting
  ANALYTICS: 'analytics',      // Used for analytics and performance monitoring
  MARKETING: 'marketing',      // Used for marketing and personalization
  THIRD_PARTY: 'third_party'   // Shared with third parties
};

// Export validated event creator function
export function createEvent(eventType, eventData) {
  // Simple validation against schema
  const schema = eventSchema[eventType];
  if (!schema) {
    console.warn(`No schema defined for event type: ${eventType}`);
    return null;
  }

  // Check required fields
  for (const [field, type] of Object.entries(schema)) {
    if (!(field in eventData)) {
      console.warn(`Missing required field '${field}' for event type: ${eventType}`);
      return null;
    }

    // Simple type checking
    const actualType = typeof eventData[field];
    if (type === 'datetime' && !(typeof eventData[field] === 'string' || eventData[field] instanceof Date)) {
      console.warn(`Field '${field}' should be a datetime for event type: ${eventType}`);
      return null;
    } else if (type !== 'datetime' && actualType !== type) {
      console.warn(`Field '${field}' should be of type '${type}' but got '${actualType}' for event type: ${eventType}`);
      return null;
    }
  }

  return {
    event: eventType,
    data: eventData,
    timestamp: new Date().toISOString()
  };
}

// Helper function to validate an event against its schema
export const validateEvent = (eventName, eventData) => {
  // Skip validation if no schema exists
  if (!EVENT_SCHEMAS[eventName]) return true;

  // Check required fields
  const requiredFields = EVENT_SCHEMAS[eventName].required || [];
  const missingRequired = requiredFields.filter(field => !eventData.hasOwnProperty(field));

  if (missingRequired.length > 0) {
    console.warn(`Event ${eventName} missing required fields: ${missingRequired.join(', ')}`);
    return false;
  }

  return true;
};

export default {
  DATA_CATEGORIES,
  NOTIFICATION_EVENTS,
  EXPERT_MATCHING_EVENTS,
  USER_INTERACTION_EVENTS,
  AB_TESTING_EVENTS,
  EVENT_SCHEMAS,
  validateEvent
};
