import React, { useState, useEffect } from 'react';
import { getTimeZoneOptions, getTimeZoneOffsetString, detectUserTimeZone } from '../../utils/timeZone';

/**
 * Time zone selector component
 * @param {Object} props
 * @param {string} props.value - Currently selected time zone
 * @param {Function} props.onChange - Function called when time zone is changed
 * @param {boolean} props.autoDetect - Whether to auto-detect user's time zone (default: true)
 * @param {string} props.label - Label for the selector
 * @param {string} props.id - ID for the select element
 * @param {string} props.className - Additional CSS classes
 */
const TimeZoneSelector = ({
  value,
  onChange,
  autoDetect = true,
  label = 'Time Zone',
  id = 'time-zone-selector',
  className = ''
}) => {
  const [timeZones, setTimeZones] = useState({});
  const [selectedTimeZone, setSelectedTimeZone] = useState(value || '');

  // Initialize and possibly auto-detect time zone
  useEffect(() => {
    const tzOptions = getTimeZoneOptions();
    setTimeZones(tzOptions);

    if (autoDetect && !value) {
      const detectedTimeZone = detectUserTimeZone();
      setSelectedTimeZone(detectedTimeZone);
      onChange(detectedTimeZone);
    } else if (value) {
      setSelectedTimeZone(value);
    }
  }, [autoDetect, value, onChange]);

  const handleChange = (e) => {
    const newTimeZone = e.target.value;
    setSelectedTimeZone(newTimeZone);
    onChange(newTimeZone);
  };

  return (
    <div className={`time-zone-selector ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          value={selectedTimeZone}
          onChange={handleChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>Select a time zone</option>

          {Object.entries(timeZones).map(([region, zones]) => (
            <optgroup key={region} label={region}>
              {zones.map(zone => (
                <option key={zone} value={zone}>
                  {zone} ({getTimeZoneOffsetString(zone)})
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {selectedTimeZone && (
        <p className="mt-1 text-xs text-gray-500">
          Current time: {new Date().toLocaleTimeString([], {
            timeZone: selectedTimeZone,
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      )}
    </div>
  );
};

export default TimeZoneSelector;
