import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import TimeZoneSelector from './TimeZoneSelector';
import {
  getAvailableTimeSlots,
  detectUserTimeZone,
  doesSlotCrossMidnight,
  getTimeZoneDifference
} from '../../utils/timeZone';

/**
 * A calendar component that displays expert availability with time zone support
 * @param {Object} props
 * @param {Array} props.expertAvailability - Array of expert's available time slots
 * @param {string} props.expertTimeZone - Expert's time zone (IANA format)
 * @param {Function} props.onSelectTimeSlot - Callback when a time slot is selected
 * @param {number} props.consultationDuration - Duration in minutes
 */
const AvailabilityCalendar = ({
  expertAvailability,
  expertTimeZone,
  onSelectTimeSlot,
  consultationDuration = 60,
  expertName = 'Expert'
}) => {
  const [clientTimeZone, setClientTimeZone] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeZoneDifference, setTimeZoneDifference] = useState(0);
  const [groupedSlots, setGroupedSlots] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Initialize time zones and slots
  useEffect(() => {
    if (!clientTimeZone) {
      const detected = detectUserTimeZone();
      setClientTimeZone(detected);
    }
  }, [clientTimeZone]);

  // Calculate time zone difference and convert availability to client's time zone
  useEffect(() => {
    if (expertTimeZone && clientTimeZone && expertAvailability?.length > 0) {
      // Calculate the time difference between expert and client
      const difference = getTimeZoneDifference(expertTimeZone, clientTimeZone);
      setTimeZoneDifference(difference);

      // Convert time slots to client's time zone
      const slots = getAvailableTimeSlots(
        expertAvailability,
        expertTimeZone,
        clientTimeZone,
        consultationDuration
      );

      setAvailableSlots(slots);

      // Group slots by date in client's time zone
      const grouped = slots.reduce((acc, slot) => {
        const dateKey = slot.clientStartTime.toFormat('yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(slot);
        return acc;
      }, {});

      setGroupedSlots(grouped);

      // Set default selected date to first available date
      if (!selectedDate && Object.keys(grouped).length > 0) {
        setSelectedDate(Object.keys(grouped)[0]);
      }
    }
  }, [expertTimeZone, clientTimeZone, expertAvailability, consultationDuration, selectedDate]);

  const handleTimeZoneChange = (newTimeZone) => {
    setClientTimeZone(newTimeZone);
    setSelectedSlot(null); // Clear selection when time zone changes
  };

  const handleDateSelect = (dateKey) => {
    setSelectedDate(dateKey);
    setSelectedSlot(null); // Clear time slot selection when date changes
  };

  const handleSlotSelect = (slot) => {
    if (slot.available) {
      setSelectedSlot(slot);
      onSelectTimeSlot(slot);
    }
  };

  // Render available dates (tabs)
  const renderDateTabs = () => {
    return (
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto pb-2">
          {Object.keys(groupedSlots).map(dateKey => {
            const isSelected = dateKey === selectedDate;
            const date = DateTime.fromISO(dateKey);
            return (
              <button
                key={dateKey}
                onClick={() => handleDateSelect(dateKey)}
                className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  isSelected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {date.toFormat('ccc, LLL d')}
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  // Render time slots for selected date
  const renderTimeSlots = () => {
    if (!selectedDate || !groupedSlots[selectedDate]) {
      return (
        <div className="py-4 text-center text-gray-500">
          No available time slots for this date.
        </div>
      );
    }

    const slots = groupedSlots[selectedDate];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
        {slots.map(slot => {
          const isSelected = selectedSlot && selectedSlot.id === slot.id;
          const crossesMidnight = doesSlotCrossMidnight(slot.clientStartTime, slot.clientEndTime);

          return (
            <button
              key={slot.id}
              onClick={() => handleSlotSelect(slot)}
              disabled={!slot.available}
              className={`
                p-3 rounded-md border text-center flex flex-col items-center justify-center
                ${isSelected
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : slot.available
                    ? 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <span className="text-sm font-medium">
                {slot.clientStartTime.toFormat('t')}
              </span>
              {crossesMidnight && (
                <span className="text-xs text-amber-600 mt-1">
                  Crosses midnight
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="availability-calendar bg-white rounded-lg shadow p-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Book a Session with {expertName}</h3>

        <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-1/2">
            <TimeZoneSelector
              value={clientTimeZone}
              onChange={handleTimeZoneChange}
              label="Your Time Zone"
              autoDetect={true}
            />
          </div>

          {timeZoneDifference !== 0 && (
            <div className="text-sm text-gray-600">
              {expertName} is {Math.abs(timeZoneDifference)} hours
              {timeZoneDifference > 0 ? ' ahead of ' : ' behind '}
              your time zone.
            </div>
          )}
        </div>

        <div className="mt-3 bg-blue-50 p-3 rounded-md border border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Times are shown in your local time zone ({clientTimeZone}).
                The expert is in the {expertTimeZone} time zone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(groupedSlots).length > 0 ? (
        <>
          {renderDateTabs()}
          {renderTimeSlots()}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No availability</h3>
          <p className="mt-1 text-sm text-gray-500">
            {expertName} has no available time slots at the moment.
          </p>
        </div>
      )}

      {selectedSlot && (
        <div className="mt-6 bg-green-50 p-4 rounded-md border border-green-200">
          <h4 className="font-medium text-green-800">Selected Time Slot</h4>
          <p className="mt-1 text-sm text-green-700">
            {selectedSlot.clientFormatted}
          </p>
          <p className="mt-1 text-xs text-green-600">
            {expertName}'s time: {selectedSlot.expertFormatted}
          </p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
