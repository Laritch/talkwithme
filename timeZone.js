/**
 * Time zone utilities for managing appointments across different time zones
 */

import { DateTime } from 'luxon';

/**
 * Convert a time from one time zone to another
 * @param {string|Date} dateTime - The date and time to convert
 * @param {string} fromTimeZone - The source time zone (IANA format, e.g., 'America/New_York')
 * @param {string} toTimeZone - The target time zone (IANA format)
 * @returns {DateTime} - Luxon DateTime object in the target time zone
 */
export function convertTimeZone(dateTime, fromTimeZone, toTimeZone) {
  // Handle different input types
  let dt;
  if (typeof dateTime === 'string') {
    // Assume ISO format if string
    dt = DateTime.fromISO(dateTime, { zone: fromTimeZone });
  } else if (dateTime instanceof Date) {
    // Convert JS Date to Luxon DateTime
    dt = DateTime.fromJSDate(dateTime, { zone: fromTimeZone });
  } else {
    throw new Error('dateTime must be a string in ISO format or a Date object');
  }

  // Convert to target time zone
  return dt.setZone(toTimeZone);
}

/**
 * Format a date time for display with time zone information
 * @param {DateTime} dateTime - Luxon DateTime object
 * @param {string} format - Format string (defaults to readable format with time zone)
 * @returns {string} - Formatted date time string
 */
export function formatTimeWithZone(dateTime, format = null) {
  if (!format) {
    // Default format: "Jan 12, 2023, 3:45 PM EDT"
    return dateTime.toFormat('LLL dd, yyyy, t ZZZZ');
  }
  return dateTime.toFormat(format);
}

/**
 * Get available time slots for a consultation, adjusted for client's time zone
 * @param {Array} expertAvailability - Array of available time slots in expert's time zone
 * @param {string} expertTimeZone - Expert's time zone (IANA format)
 * @param {string} clientTimeZone - Client's time zone (IANA format)
 * @param {number} durationMinutes - Duration of consultation in minutes
 * @returns {Array} - Available time slots with both time zones
 */
export function getAvailableTimeSlots(expertAvailability, expertTimeZone, clientTimeZone, durationMinutes = 60) {
  return expertAvailability.map(slot => {
    const expertTime = DateTime.fromISO(slot.startTime, { zone: expertTimeZone });
    const clientTime = expertTime.setZone(clientTimeZone);

    // Calculate end times
    const expertEndTime = expertTime.plus({ minutes: durationMinutes });
    const clientEndTime = clientTime.plus({ minutes: durationMinutes });

    return {
      id: slot.id,
      expertStartTime: expertTime,
      expertEndTime: expertEndTime,
      clientStartTime: clientTime,
      clientEndTime: clientEndTime,
      expertFormatted: formatTimeWithZone(expertTime, 'ccc, LLL dd, yyyy, t ZZZZ'),
      clientFormatted: formatTimeWithZone(clientTime, 'ccc, LLL dd, yyyy, t ZZZZ'),
      available: slot.available
    };
  });
}

/**
 * Detect the user's time zone from browser
 * @returns {string} - IANA time zone identifier
 */
export function detectUserTimeZone() {
  // Use Intl API to get the time zone if available
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.error('Error detecting time zone:', error);
    }
  }

  // Fallback to a default time zone if detection fails
  return 'UTC';
}

/**
 * Get all IANA time zones grouped by region
 * This is a simplified version - in production, you might use a library like moment-timezone
 * @returns {Object} - Time zones grouped by region
 */
export function getTimeZoneOptions() {
  // This is a simplified list - in production, use a complete list
  return {
    "Africa": [
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Lagos",
      "Africa/Nairobi"
    ],
    "America": [
      "America/Anchorage",
      "America/Bogota",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Mexico_City",
      "America/New_York",
      "America/Sao_Paulo",
      "America/Toronto"
    ],
    "Asia": [
      "Asia/Dhaka",
      "Asia/Dubai",
      "Asia/Hong_Kong",
      "Asia/Kolkata",
      "Asia/Shanghai",
      "Asia/Singapore",
      "Asia/Tokyo"
    ],
    "Australia": [
      "Australia/Melbourne",
      "Australia/Perth",
      "Australia/Sydney"
    ],
    "Europe": [
      "Europe/Berlin",
      "Europe/London",
      "Europe/Moscow",
      "Europe/Paris"
    ],
    "Pacific": [
      "Pacific/Auckland",
      "Pacific/Honolulu"
    ]
  };
}

/**
 * Get the current date and time in a specific time zone
 * @param {string} timeZone - IANA time zone
 * @returns {DateTime} - Current date and time in the specified time zone
 */
export function getCurrentTimeInZone(timeZone) {
  return DateTime.now().setZone(timeZone);
}

/**
 * Check if a time slot crosses midnight in the client's time zone
 * This is useful for displaying warnings
 * @param {DateTime} clientStartTime - Start time in client's time zone
 * @param {DateTime} clientEndTime - End time in client's time zone
 * @returns {boolean} - True if the slot crosses midnight
 */
export function doesSlotCrossMidnight(clientStartTime, clientEndTime) {
  return clientStartTime.day !== clientEndTime.day;
}

/**
 * Get a human-readable time zone offset string
 * @param {string} timeZone - IANA time zone
 * @returns {string} - Human-readable offset (e.g., "UTC+5:30")
 */
export function getTimeZoneOffsetString(timeZone) {
  const now = DateTime.now().setZone(timeZone);
  return now.toFormat('ZZZZ');
}

/**
 * Calculate the time difference between two time zones in hours
 * @param {string} timeZone1 - First time zone (IANA format)
 * @param {string} timeZone2 - Second time zone (IANA format)
 * @returns {number} - Difference in hours (can be decimal)
 */
export function getTimeZoneDifference(timeZone1, timeZone2) {
  const now = DateTime.now();
  const time1 = now.setZone(timeZone1);
  const time2 = now.setZone(timeZone2);

  // Calculate difference in minutes and convert to hours
  const diffMinutes = time1.offset - time2.offset;
  return diffMinutes / 60;
}

/**
 * Check if a booking window is within business hours in both time zones
 * @param {DateTime} startTime - Start time (in any time zone)
 * @param {number} durationMinutes - Duration in minutes
 * @param {string} expertTimeZone - Expert's time zone
 * @param {Array} businessHours - Array of business hours ranges in expert's time zone
 * @returns {boolean} - True if the booking is within business hours
 */
export function isWithinBusinessHours(startTime, durationMinutes, expertTimeZone, businessHours) {
  // Convert to expert's time zone
  const expertTime = startTime.setZone(expertTimeZone);
  const expertEndTime = expertTime.plus({ minutes: durationMinutes });

  // Get day of week (1-7, where 1 is Monday)
  const dayOfWeek = expertTime.weekday;

  // Find business hours for this day
  const dayHours = businessHours.find(h => h.day === dayOfWeek);
  if (!dayHours) {
    return false; // No business hours defined for this day
  }

  // Check if booking is within business hours
  const businessStart = DateTime.fromFormat(dayHours.start, 'HH:mm', { zone: expertTimeZone })
    .set({
      year: expertTime.year,
      month: expertTime.month,
      day: expertTime.day
    });

  const businessEnd = DateTime.fromFormat(dayHours.end, 'HH:mm', { zone: expertTimeZone })
    .set({
      year: expertTime.year,
      month: expertTime.month,
      day: expertTime.day
    });

  return expertTime >= businessStart && expertEndTime <= businessEnd;
}
