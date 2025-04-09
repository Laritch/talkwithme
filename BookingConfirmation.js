import React from 'react';
import { DateTime } from 'luxon';
import { doesSlotCrossMidnight, getTimeZoneDifference } from '../../utils/timeZone';

/**
 * Booking confirmation component with time zone information
 * @param {Object} props
 * @param {Object} props.booking - Booking details
 * @param {string} props.clientTimeZone - Client's time zone
 * @param {string} props.expertTimeZone - Expert's time zone
 * @param {boolean} props.showTimeZoneWarning - Whether to show time zone warnings
 */
const BookingConfirmation = ({
  booking,
  clientTimeZone,
  expertTimeZone,
  showTimeZoneWarning = true,
  expertName = 'Expert'
}) => {
  if (!booking) return null;

  // Get details from booking
  const {
    startTime,
    endTime,
    durationMinutes,
    consultationType,
    id: bookingId
  } = booking;

  // Convert booking times to DateTime objects in respective time zones
  const startInClientTZ = typeof startTime === 'string'
    ? DateTime.fromISO(startTime, { zone: clientTimeZone })
    : startTime;

  const endInClientTZ = typeof endTime === 'string'
    ? DateTime.fromISO(endTime, { zone: clientTimeZone })
    : endTime;

  const startInExpertTZ = startInClientTZ.setZone(expertTimeZone);
  const endInExpertTZ = endInClientTZ.setZone(expertTimeZone);

  const timeZoneDifference = getTimeZoneDifference(expertTimeZone, clientTimeZone);
  const crossesMidnight = doesSlotCrossMidnight(startInClientTZ, endInClientTZ);
  const expertCrossesMidnight = doesSlotCrossMidnight(startInExpertTZ, endInExpertTZ);

  // Add to calendar link (Google Calendar format)
  const generateGoogleCalendarLink = () => {
    const startISO = startInClientTZ.toISO({ suppressMilliseconds: true }).replace(/[:-]/g, '').replace(/\.\d{3}/, '');
    const endISO = endInClientTZ.toISO({ suppressMilliseconds: true }).replace(/[:-]/g, '').replace(/\.\d{3}/, '');

    const baseUrl = 'https://calendar.google.com/calendar/render';
    const eventParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Consultation with ${expertName}`,
      dates: `${startISO}/${endISO}`,
      details: `Your ${consultationType} consultation with ${expertName}.

Your time: ${startInClientTZ.toFormat('ccc, LLL dd, yyyy t ZZZZ')}
${expertName}'s time: ${startInExpertTZ.toFormat('ccc, LLL dd, yyyy t ZZZZ')}

Booking ID: ${bookingId}`,
      location: 'Online Session'
    });

    return `${baseUrl}?${eventParams.toString()}`;
  };

  // Add to calendar link (iCal format)
  const generateICalLink = () => {
    // In a real implementation, this would generate an iCal file or link to an endpoint that does
    return '#'; // Placeholder
  };

  // Add to calendar link (Outlook format)
  const generateOutlookLink = () => {
    // For Outlook Online, you can use the same format as Google Calendar
    return generateGoogleCalendarLink().replace('calendar.google.com/calendar/render', 'outlook.live.com/calendar/0/action/compose');
  };

  return (
    <div className="booking-confirmation bg-white rounded-lg shadow p-6">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Booking Confirmed</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your {consultationType} consultation with {expertName} has been booked.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>

          <div className="mt-2 bg-gray-50 p-4 rounded-md">
            <div className="flex flex-col space-y-2">
              <div>
                <span className="text-xs text-gray-500">Your Time ({clientTimeZone}):</span>
                <p className="text-base font-medium text-gray-900">
                  {startInClientTZ.toFormat('ccc, LLL dd, yyyy')}
                </p>
                <p className="text-base font-medium text-gray-900">
                  {startInClientTZ.toFormat('t')} - {endInClientTZ.toFormat('t ZZZZ')}
                </p>
                {crossesMidnight && (
                  <p className="text-xs text-amber-600 mt-1">
                    Note: This session crosses midnight in your time zone.
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">{expertName}'s Time ({expertTimeZone}):</span>
                <p className="text-sm text-gray-700">
                  {startInExpertTZ.toFormat('ccc, LLL dd, yyyy')}
                </p>
                <p className="text-sm text-gray-700">
                  {startInExpertTZ.toFormat('t')} - {endInExpertTZ.toFormat('t ZZZZ')}
                </p>
                {expertCrossesMidnight && (
                  <p className="text-xs text-amber-600 mt-1">
                    Note: This session crosses midnight in the expert's time zone.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {showTimeZoneWarning && timeZoneDifference !== 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Please note the time zone difference. {expertName} is {Math.abs(timeZoneDifference)} hours
                  {timeZoneDifference > 0 ? ' ahead of ' : ' behind '} your local time.
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Add to Calendar</h3>
          <div className="flex flex-wrap gap-2">
            <a
              href={generateGoogleCalendarLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              Google Calendar
            </a>
            <a
              href={generateOutlookLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              Outlook
            </a>
            <a
              href={generateICalLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              iCal (.ics)
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Booking Details</h3>
          <dl className="mt-2 divide-y divide-gray-200">
            <div className="py-2 flex justify-between">
              <dt className="text-sm text-gray-500">Booking ID</dt>
              <dd className="text-sm font-medium text-gray-900">{bookingId}</dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-sm text-gray-500">Session Type</dt>
              <dd className="text-sm font-medium text-gray-900">{consultationType}</dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-sm text-gray-500">Duration</dt>
              <dd className="text-sm font-medium text-gray-900">{durationMinutes} minutes</dd>
            </div>
          </dl>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Preparing for Your Session</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>You'll receive a confirmation email with session details and a calendar invitation.</li>
            <li>You'll receive a link to join the session 15 minutes before the scheduled time.</li>
            <li>Please ensure your device meets the technical requirements for the consultation.</li>
            <li>If you need to reschedule, please do so at least 24 hours in advance.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
