/**
 * API Endpoint for Analytics Metrics
 *
 * This endpoint provides access to aggregated analytics metrics for dashboards.
 */

import { getEventStore } from './events';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get metric type from query
    const { type = 'all', days = 7 } = req.query;

    // Get metrics from store
    const metrics = await getMetrics(type, parseInt(days, 10));

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error retrieving analytics metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
}

/**
 * Get metrics from the store
 * @param {string} type Metric type ('engagement', 'effectiveness', 'contextual', or 'all')
 * @param {number} days Number of days to include
 * @returns {Promise<Object>} The metrics
 */
async function getMetrics(type, days) {
  // In a real application, this would query a database
  // For this demo, we'll use our in-memory store

  // Get the event store (only available in development)
  let eventStore;
  try {
    eventStore = getEventStore();
  } catch (error) {
    // For production or if getEventStore is not available
    return { error: 'Metrics not available in production' };
  }

  // Get dates for the requested range
  const dateRange = getDateRange(days);

  // Filter metrics by date range
  const filteredMetrics = {};

  if (type === 'all' || type === 'engagement') {
    filteredMetrics.engagement = filterMetricsByDate(
      eventStore.aggregatedMetrics.engagement,
      dateRange
    );
  }

  if (type === 'all' || type === 'effectiveness') {
    filteredMetrics.effectiveness = filterMetricsByDate(
      eventStore.aggregatedMetrics.effectiveness,
      dateRange
    );
  }

  if (type === 'all' || type === 'contextual') {
    filteredMetrics.contextual = filterMetricsByDate(
      eventStore.aggregatedMetrics.contextual,
      dateRange
    );
  }

  // Add summary metrics across the date range
  if (type === 'all' || type === 'engagement') {
    filteredMetrics.engagement_summary = summarizeEngagementMetrics(
      filteredMetrics.engagement
    );
  }

  if (type === 'all' || type === 'effectiveness') {
    filteredMetrics.effectiveness_summary = summarizeEffectivenessMetrics(
      filteredMetrics.effectiveness
    );
  }

  if (type === 'all' || type === 'contextual') {
    filteredMetrics.contextual_summary = summarizeContextualMetrics(
      filteredMetrics.contextual
    );
  }

  return filteredMetrics;
}

/**
 * Get date range array for the requested days
 * @param {number} days Number of days to include
 * @returns {Array<string>} Array of date strings
 */
function getDateRange(days) {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

/**
 * Filter metrics by date range
 * @param {Object} metrics Metrics object with dates as keys
 * @param {Array<string>} dateRange Array of date strings
 * @returns {Object} Filtered metrics
 */
function filterMetricsByDate(metrics, dateRange) {
  const filtered = {};

  for (const date of dateRange) {
    if (metrics[date]) {
      filtered[date] = metrics[date];
    } else {
      // Provide empty data structure for missing dates
      filtered[date] = {};
    }
  }

  return filtered;
}

/**
 * Summarize engagement metrics across dates
 * @param {Object} engagementMetrics Engagement metrics by date
 * @returns {Object} Summarized metrics
 */
function summarizeEngagementMetrics(engagementMetrics) {
  const summary = {
    total_sent: 0,
    total_viewed: 0,
    total_clicked: 0,
    total_read: 0,
    total_dismissed: 0,
    view_rate: 0,
    click_through_rate: 0,
    read_rate: 0,
    average_time_to_click: 0,
    by_type: {}
  };

  let clickTimeSum = 0;
  let clickTimeCount = 0;

  // Sum metrics across all dates
  Object.values(engagementMetrics).forEach(dayMetrics => {
    if (!dayMetrics) return;

    summary.total_sent += dayMetrics.notifications_sent || 0;
    summary.total_viewed += dayMetrics.notifications_viewed || 0;
    summary.total_clicked += dayMetrics.notifications_clicked || 0;
    summary.total_read += dayMetrics.notifications_read || 0;
    summary.total_dismissed += dayMetrics.notifications_dismissed || 0;

    // Accumulate click times for average
    if (dayMetrics.average_time_to_click) {
      clickTimeSum += dayMetrics.average_time_to_click * (dayMetrics.notifications_clicked || 0);
      clickTimeCount += dayMetrics.notifications_clicked || 0;
    }

    // Aggregate by type
    if (dayMetrics.by_type) {
      Object.entries(dayMetrics.by_type).forEach(([type, typeMetrics]) => {
        if (!summary.by_type[type]) {
          summary.by_type[type] = {
            sent: 0,
            viewed: 0,
            clicked: 0,
            read: 0,
            dismissed: 0,
            view_rate: 0,
            click_rate: 0,
            read_rate: 0
          };
        }

        summary.by_type[type].sent += typeMetrics.sent || 0;
        summary.by_type[type].viewed += typeMetrics.viewed || 0;
        summary.by_type[type].clicked += typeMetrics.clicked || 0;
        summary.by_type[type].read += typeMetrics.read || 0;
        summary.by_type[type].dismissed += typeMetrics.dismissed || 0;
      });
    }
  });

  // Calculate rates
  if (summary.total_sent > 0) {
    summary.view_rate = summary.total_viewed / summary.total_sent;
    summary.click_through_rate = summary.total_clicked / summary.total_sent;
    summary.read_rate = summary.total_read / summary.total_sent;
  }

  // Calculate average time to click
  if (clickTimeCount > 0) {
    summary.average_time_to_click = clickTimeSum / clickTimeCount;
  }

  // Calculate rates by type
  Object.keys(summary.by_type).forEach(type => {
    const typeSummary = summary.by_type[type];
    if (typeSummary.sent > 0) {
      typeSummary.view_rate = typeSummary.viewed / typeSummary.sent;
      typeSummary.click_rate = typeSummary.clicked / typeSummary.sent;
      typeSummary.read_rate = typeSummary.read / typeSummary.sent;
    }
  });

  return summary;
}

/**
 * Summarize effectiveness metrics across dates
 * @param {Object} effectivenessMetrics Effectiveness metrics by date
 * @returns {Object} Summarized metrics
 */
function summarizeEffectivenessMetrics(effectivenessMetrics) {
  const summary = {
    total_actions_required: 0,
    total_actions_taken: 0,
    overall_conversion_rate: 0,
    by_priority: {
      low: { required: 0, taken: 0, rate: 0 },
      medium: { required: 0, taken: 0, rate: 0 },
      high: { required: 0, taken: 0, rate: 0 },
      critical: { required: 0, taken: 0, rate: 0 }
    },
    by_type: {}
  };

  // Sum metrics across all dates
  Object.values(effectivenessMetrics).forEach(dayMetrics => {
    if (!dayMetrics) return;

    summary.total_actions_required += dayMetrics.actions_required || 0;
    summary.total_actions_taken += dayMetrics.actions_taken || 0;

    // Aggregate by priority
    if (dayMetrics.by_priority) {
      Object.entries(dayMetrics.by_priority).forEach(([priority, priorityMetrics]) => {
        if (summary.by_priority[priority]) {
          summary.by_priority[priority].required += priorityMetrics.required || 0;
          summary.by_priority[priority].taken += priorityMetrics.taken || 0;
        }
      });
    }

    // Aggregate by type
    if (dayMetrics.by_type) {
      Object.entries(dayMetrics.by_type).forEach(([type, typeMetrics]) => {
        if (!summary.by_type[type]) {
          summary.by_type[type] = { required: 0, taken: 0, rate: 0 };
        }

        summary.by_type[type].required += typeMetrics.required || 0;
        summary.by_type[type].taken += typeMetrics.taken || 0;
      });
    }
  });

  // Calculate overall conversion rate
  if (summary.total_actions_required > 0) {
    summary.overall_conversion_rate = summary.total_actions_taken / summary.total_actions_required;
  }

  // Calculate rates by priority
  Object.keys(summary.by_priority).forEach(priority => {
    const prioritySum = summary.by_priority[priority];
    if (prioritySum.required > 0) {
      prioritySum.rate = prioritySum.taken / prioritySum.required;
    }
  });

  // Calculate rates by type
  Object.keys(summary.by_type).forEach(type => {
    const typeSum = summary.by_type[type];
    if (typeSum.required > 0) {
      typeSum.rate = typeSum.taken / typeSum.required;
    }
  });

  return summary;
}

/**
 * Summarize contextual metrics across dates
 * @param {Object} contextualMetrics Contextual metrics by date
 * @returns {Object} Summarized metrics
 */
function summarizeContextualMetrics(contextualMetrics) {
  const summary = {
    device_counts: {},
    browser_counts: {},
    os_counts: {},
    timezone_counts: {},
    language_counts: {},
    time_of_day: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    }
  };

  // Sum metrics across all dates
  Object.values(contextualMetrics).forEach(dayMetrics => {
    if (!dayMetrics) return;

    // Aggregate device counts
    if (dayMetrics.device_counts) {
      Object.entries(dayMetrics.device_counts).forEach(([device, count]) => {
        summary.device_counts[device] = (summary.device_counts[device] || 0) + count;
      });
    }

    // Aggregate browser counts
    if (dayMetrics.browser_counts) {
      Object.entries(dayMetrics.browser_counts).forEach(([browser, count]) => {
        summary.browser_counts[browser] = (summary.browser_counts[browser] || 0) + count;
      });
    }

    // Aggregate OS counts
    if (dayMetrics.os_counts) {
      Object.entries(dayMetrics.os_counts).forEach(([os, count]) => {
        summary.os_counts[os] = (summary.os_counts[os] || 0) + count;
      });
    }

    // Aggregate timezone counts
    if (dayMetrics.timezone_counts) {
      Object.entries(dayMetrics.timezone_counts).forEach(([timezone, count]) => {
        summary.timezone_counts[timezone] = (summary.timezone_counts[timezone] || 0) + count;
      });
    }

    // Aggregate language counts
    if (dayMetrics.language_counts) {
      Object.entries(dayMetrics.language_counts).forEach(([language, count]) => {
        summary.language_counts[language] = (summary.language_counts[language] || 0) + count;
      });
    }

    // Aggregate time of day
    if (dayMetrics.by_time_of_day) {
      summary.time_of_day.morning += dayMetrics.by_time_of_day.morning || 0;
      summary.time_of_day.afternoon += dayMetrics.by_time_of_day.afternoon || 0;
      summary.time_of_day.evening += dayMetrics.by_time_of_day.evening || 0;
      summary.time_of_day.night += dayMetrics.by_time_of_day.night || 0;
    }
  });

  return summary;
}
