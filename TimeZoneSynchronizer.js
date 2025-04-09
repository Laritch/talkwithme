import React, { useEffect, useState, createContext, useContext } from 'react';
import { DateTime } from 'luxon';
import {
  detectUserTimeZone,
  convertTimeZone,
  getTimeZoneDifference,
  getCurrentTimeInZone,
  getTimeZoneOffsetString
} from '../../utils/timeZone';
import { useSelector } from 'react-redux';
import { useNotifications } from '../notifications';

// Create a context for time zone information
const TimeZoneContext = createContext({
  clientTimeZone: '',
  expertTimeZone: '',
  timeZoneDifference: 0,
  currentClientTime: null,
  currentExpertTime: null,
  convertToClientTime: () => {},
  convertToExpertTime: () => {},
  formatInClientTimeZone: () => {},
  formatInExpertTimeZone: () => {},
  clientOffsetString: '',
  expertOffsetString: '',
  isCrossingMidnight: () => false,
  isCrossingDateBoundary: () => false,
  isCrossingBusinessHours: () => false
});

/**
 * TimeZoneSynchronizer component - provides time zone context to child components
 * and handles automatic time zone adjustments
 */
export const TimeZoneSynchronizer = ({
  children,
  expertTimeZone = 'UTC',
  businessHours = null,
  onTimeZoneChange = () => {}
}) => {
  const { userRegion } = useSelector(state => state.compliance);
  const { notifyTimeZoneConflict } = useNotifications();

  const [clientTimeZone, setClientTimeZone] = useState('');
  const [timeZoneDifference, setTimeZoneDifference] = useState(0);
  const [currentClientTime, setCurrentClientTime] = useState(null);
  const [currentExpertTime, setCurrentExpertTime] = useState(null);
  const [clientOffsetString, setClientOffsetString] = useState('');
  const [expertOffsetString, setExpertOffsetString] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [notifiedAboutTimeZoneConflict, setNotifiedAboutTimeZoneConflict] = useState(false);

  // Initialize time zones and calculate difference
  useEffect(() => {
    const initialize = async () => {
      // Detect the client's time zone
      const detectedTimeZone = await detectUserTimeZone();
      setClientTimeZone(detectedTimeZone);

      // Calculate the time difference
      const difference = getTimeZoneDifference(expertTimeZone, detectedTimeZone);
      setTimeZoneDifference(difference);

      // Update current times
      const clientTime = getCurrentTimeInZone(detectedTimeZone);
      const expertTime = getCurrentTimeInZone(expertTimeZone);
      setCurrentClientTime(clientTime);
      setCurrentExpertTime(expertTime);

      // Get human-readable offset strings
      setClientOffsetString(getTimeZoneOffsetString(detectedTimeZone));
      setExpertOffsetString(getTimeZoneOffsetString(expertTimeZone));

      // Notify parent component
      onTimeZoneChange({
        clientTimeZone: detectedTimeZone,
        expertTimeZone,
        timeZoneDifference: difference
      });

      // Check for significant time zone differences and notify
      if (Math.abs(difference) >= 6 && !notifiedAboutTimeZoneConflict) {
        notifyTimeZoneConflict(
          'Significant Time Zone Difference',
          `There is a ${Math.abs(difference)} hour time difference between you and the expert. This may affect appointment scheduling and availability.`,
          {
            priority: Math.abs(difference) >= 10 ? 'high' : 'medium',
            actionRequired: false,
            link: '/time-zone-demo'
          }
        );
        setNotifiedAboutTimeZoneConflict(true);
      }

      setIsInitialized(true);
    };

    initialize();

    // Set up an interval to keep the current times updated
    const intervalId = setInterval(() => {
      if (clientTimeZone) {
        setCurrentClientTime(getCurrentTimeInZone(clientTimeZone));
        setCurrentExpertTime(getCurrentTimeInZone(expertTimeZone));
      }
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [expertTimeZone, onTimeZoneChange, userRegion, notifyTimeZoneConflict, notifiedAboutTimeZoneConflict]);

  /**
   * Convert a time from expert's time zone to client's time zone
   * @param {string|Date|DateTime} dateTime - The time to convert
   * @returns {DateTime} - The time in client's time zone
   */
  const convertToClientTime = (dateTime) => {
    if (!clientTimeZone || !expertTimeZone) return null;

    let dt;
    // Handle different input types
    if (typeof dateTime === 'string') {
      dt = DateTime.fromISO(dateTime, { zone: expertTimeZone });
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime, { zone: expertTimeZone });
    } else if (dateTime && typeof dateTime.toISO === 'function') {
      // Already a Luxon DateTime object
      dt = dateTime.setZone(expertTimeZone);
    } else {
      return null;
    }

    return dt.setZone(clientTimeZone);
  };

  /**
   * Convert a time from client's time zone to expert's time zone
   * @param {string|Date|DateTime} dateTime - The time to convert
   * @returns {DateTime} - The time in expert's time zone
   */
  const convertToExpertTime = (dateTime) => {
    if (!clientTimeZone || !expertTimeZone) return null;

    let dt;
    // Handle different input types
    if (typeof dateTime === 'string') {
      dt = DateTime.fromISO(dateTime, { zone: clientTimeZone });
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime, { zone: clientTimeZone });
    } else if (dateTime && typeof dateTime.toISO === 'function') {
      // Already a Luxon DateTime object
      dt = dateTime.setZone(clientTimeZone);
    } else {
      return null;
    }

    return dt.setZone(expertTimeZone);
  };

  /**
   * Format a time in the client's time zone
   * @param {string|Date|DateTime} dateTime - The time to format
   * @param {string} format - The format string (Luxon format)
   * @returns {string} - Formatted date/time string
   */
  const formatInClientTimeZone = (dateTime, format = 'ccc, LLL dd, yyyy, t ZZZZ') => {
    const clientTime = convertToClientTime(dateTime);
    return clientTime ? clientTime.toFormat(format) : '';
  };

  /**
   * Format a time in the expert's time zone
   * @param {string|Date|DateTime} dateTime - The time to format
   * @param {string} format - The format string (Luxon format)
   * @returns {string} - Formatted date/time string
   */
  const formatInExpertTimeZone = (dateTime, format = 'ccc, LLL dd, yyyy, t ZZZZ') => {
    const expertTime = convertToExpertTime(dateTime);
    return expertTime ? expertTime.toFormat(format) : '';
  };

  /**
   * Check if a time slot crosses midnight in a specific time zone
   * @param {string|Date|DateTime} startTime - Start time
   * @param {string|Date|DateTime} endTime - End time
   * @param {string} timeZone - The time zone to check in (defaults to client's time zone)
   * @returns {boolean} - True if the slot crosses midnight
   */
  const isCrossingMidnight = (startTime, endTime, timeZone = clientTimeZone) => {
    let start, end;

    if (timeZone === clientTimeZone) {
      start = convertToClientTime(startTime);
      end = convertToClientTime(endTime);
    } else if (timeZone === expertTimeZone) {
      start = convertToExpertTime(startTime);
      end = convertToExpertTime(endTime);
    } else {
      // For any other time zone
      if (typeof startTime === 'string') {
        start = DateTime.fromISO(startTime).setZone(timeZone);
      } else if (startTime instanceof Date) {
        start = DateTime.fromJSDate(startTime).setZone(timeZone);
      } else if (startTime && typeof startTime.toISO === 'function') {
        start = startTime.setZone(timeZone);
      }

      if (typeof endTime === 'string') {
        end = DateTime.fromISO(endTime).setZone(timeZone);
      } else if (endTime instanceof Date) {
        end = DateTime.fromJSDate(endTime).setZone(timeZone);
      } else if (endTime && typeof endTime.toISO === 'function') {
        end = endTime.setZone(timeZone);
      }
    }

    if (!start || !end) return false;

    return start.day !== end.day;
  };

  /**
   * Check if a time slot crosses a date boundary between time zones
   * @param {string|Date|DateTime} dateTime - The time to check
   * @returns {boolean} - True if the date is different between time zones
   */
  const isCrossingDateBoundary = (dateTime) => {
    const clientTime = convertToClientTime(dateTime);
    const expertTime = convertToExpertTime(dateTime);

    if (!clientTime || !expertTime) return false;

    return (
      clientTime.day !== expertTime.day ||
      clientTime.month !== expertTime.month ||
      clientTime.year !== expertTime.year
    );
  };

  /**
   * Check if a time is outside business hours in the expert's time zone
   * @param {string|Date|DateTime} startTime - Start time
   * @param {number} durationMinutes - Duration in minutes
   * @returns {boolean} - True if the time is outside business hours
   */
  const isCrossingBusinessHours = (startTime, durationMinutes = 60) => {
    if (!businessHours) return false;

    const expertTime = convertToExpertTime(startTime);
    if (!expertTime) return false;

    const expertEndTime = expertTime.plus({ minutes: durationMinutes });

    // Get day of week (1-7, where 1 is Monday)
    const dayOfWeek = expertTime.weekday;

    // Find business hours for this day
    const dayHours = businessHours.find(h => h.day === dayOfWeek);
    if (!dayHours) {
      return true; // No business hours defined for this day
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

    return expertTime < businessStart || expertEndTime > businessEnd;
  };

  // Prepare context value
  const contextValue = {
    clientTimeZone,
    expertTimeZone,
    timeZoneDifference,
    currentClientTime,
    currentExpertTime,
    convertToClientTime,
    convertToExpertTime,
    formatInClientTimeZone,
    formatInExpertTimeZone,
    clientOffsetString,
    expertOffsetString,
    isCrossingMidnight,
    isCrossingDateBoundary,
    isCrossingBusinessHours,
    isInitialized
  };

  return (
    <TimeZoneContext.Provider value={contextValue}>
      <div className="time-zone-synchronizer">
        {isInitialized ? children : (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Initializing time zones...</p>
          </div>
        )}
      </div>
    </TimeZoneContext.Provider>
  );
};

/**
 * Custom hook to use the time zone context
 * @returns {Object} - Time zone context value
 */
export const useTimeZone = () => {
  const context = useContext(TimeZoneContext);
  if (context === undefined) {
    throw new Error('useTimeZone must be used within a TimeZoneSynchronizer');
  }
  return context;
};

export default TimeZoneSynchronizer;
