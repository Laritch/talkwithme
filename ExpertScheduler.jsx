import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/TranslationService';
import './ExpertScheduler.css';

// Sample expert data (in a real app, this would come from props or an API)
const sampleExpert = {
  id: 'expert-1',
  name: 'Jan de Vries',
  languages: ['en', 'nl', 'de'],
  expertise: ['Resource Organization', 'Digital Assets'],
  avatar: '👨‍🚀',
  rating: 4.8,
  reviews: 103,
  hourlyRate: 85,
  availableDays: [1, 2, 3, 4, 5] // Monday to Friday (0 = Sunday, 6 = Saturday)
};

/**
 * ExpertScheduler Component
 *
 * Allows users to schedule consultations with experts,
 * including timezone detection and management.
 */
const ExpertScheduler = ({ expertId }) => {
  const { currentLanguage, translate } = useLanguage();

  // State
  const [expert, setExpert] = useState(sampleExpert);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timezone, setTimezone] = useState('');
  const [detectedTimezone, setDetectedTimezone] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [meetingDetails, setMeetingDetails] = useState({
    topic: '',
    duration: 60,
    meetingType: 'video',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // When component mounts, detect timezone and load expert data
  useEffect(() => {
    // Detect user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(userTimezone);
    setTimezone(userTimezone);

    // In a real app, this would fetch the expert by ID
    // For now, just simulate loading
    setIsLoading(true);
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Set default topic based on expert's expertise
    setMeetingDetails(prev => ({
      ...prev,
      topic: `Consultation on ${expert.expertise[0]}`
    }));

    // Cleanup function to prevent memory leaks
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [expertId]);

  // Generate available time slots when date or timezone changes
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots(selectedDate);
    }
  }, [selectedDate, timezone]);

  // Generate available time slots for a given date
  const generateTimeSlots = (date) => {
    const dayOfWeek = date.getDay();

    // Check if the expert is available on this day of the week
    if (!expert.availableDays.includes(dayOfWeek)) {
      setAvailableTimeSlots([]);
      return;
    }

    // In a real app, this would call an API to get actual availability
    // For demonstration, generate time slots from 9 AM to 5 PM
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Simulate some random unavailability
        if (Math.random() > 0.7) continue;

        const time = new Date(date);
        time.setHours(hour, minute, 0, 0);

        // Add the time slot
        slots.push({
          time,
          available: true
        });
      }
    }

    setAvailableTimeSlots(slots);

    // Reset selected time if it's not in the new available slots
    if (selectedTime) {
      const timeExists = slots.some(slot =>
        slot.time.getHours() === selectedTime.getHours() &&
        slot.time.getMinutes() === selectedTime.getMinutes()
      );

      if (!timeExists) {
        setSelectedTime(null);
      }
    }
  };

  // Format time in user's locale
  const formatTime = (time) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date in user's locale
  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get the month name and year
  const getMonthYearString = () => {
    return currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setCurrentMonth(previousMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  // Check if a date is selectable
  const isDateSelectable = (date) => {
    // Don't allow dates in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return false;

    // Check if the expert is available on this day of the week
    return expert.availableDays.includes(date.getDay());
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    if (!isDateSelectable(date)) return;

    setSelectedDate(date);
    setSelectedTime(null); // Reset time selection
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // Handle timezone change
  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
  };

  // Handle meeting details update
  const handleMeetingDetailsChange = (e) => {
    const { name, value } = e.target;
    setMeetingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle next step
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleScheduleMeeting();
    }
  };

  // Handle back step
  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Schedule the meeting
  const handleScheduleMeeting = () => {
    // In a real app, this would send the meeting request to the server
    // For now, just show the confirmation
    setShowConfirmation(true);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarDays = [];

    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = getDaysInMonth(month - 1, year);

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);

      calendarDays.push({
        date,
        day,
        currentMonth: false,
        selectable: false
      });
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const selectable = isDateSelectable(date);

      calendarDays.push({
        date,
        day,
        currentMonth: true,
        selectable,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString()
      });
    }

    // Add days from next month to fill out the calendar grid
    const totalCells = Math.ceil(calendarDays.length / 7) * 7;
    const nextMonthDays = totalCells - calendarDays.length;

    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(year, month + 1, day);

      calendarDays.push({
        date,
        day,
        currentMonth: false,
        selectable: false
      });
    }

    return calendarDays;
  };

  // Render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const decimal = rating - fullStars;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`star-${i}`} className="star">★</span>);
    }

    // Add partial star if needed
    if (decimal >= 0.5) {
      stars.push(<span key="half-star" className="star">★</span>);
    }

    // Add empty stars
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-star-${i}`} className="empty-star">★</span>);
    }

    return stars;
  };

  // Get a list of major timezones
  const getTimezoneOptions = () => {
    // This is a simplified list, a real app would have a more comprehensive list
    return [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Amsterdam',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];
  };

  // Format timezone for display
  const formatTimezone = (tz) => {
    try {
      const date = new Date();
      const timeString = date.toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' });
      const match = timeString.match(/[A-Z]{3,4}$/);
      const abbr = match ? match[0] : '';

      // Get the offset
      const options = { timeZone: tz, timeZoneName: 'longOffset' };
      const longFormat = date.toLocaleString('en-US', options);
      const offsetMatch = longFormat.match(/GMT[+-]\d{1,2}(?::\d{2})?/);
      const offset = offsetMatch ? offsetMatch[0] : '';

      // Convert timezone path to readable name
      const name = tz.split('/').pop().replace(/_/g, ' ');

      return `${name} (${abbr}, ${offset})`;
    } catch (e) {
      return tz;
    }
  };

  // Get next step button label
  const getNextButtonLabel = () => {
    switch (currentStep) {
      case 1: return 'Select Time';
      case 2: return 'Continue to Details';
      case 3: return 'Schedule Meeting';
      default: return 'Next';
    }
  };

  // Check if current step is complete
  const isStepComplete = () => {
    switch (currentStep) {
      case 1: return !!selectedDate;
      case 2: return !!selectedTime;
      case 3: return !!meetingDetails.topic && !!meetingDetails.duration;
      default: return false;
    }
  };

  if (isLoading) {
    return (
      <div className="scheduler-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div className="loading-spinner"></div>
          <div style={{ marginLeft: '16px' }}>Loading scheduler...</div>
        </div>
      </div>
    );
  }

  // Show confirmation screen
  if (showConfirmation) {
    return (
      <div className="scheduler-container">
        <div className="confirmation-section">
          <div className="confirmation-icon">✓</div>
          <h2 className="confirmation-title">Meeting Scheduled!</h2>
          <p className="confirmation-message">
            Your meeting with {expert.name} has been scheduled for {selectedDate && formatDate(selectedDate)} at {selectedTime && formatTime(selectedTime)} {timezone}.
            You will receive a confirmation email with meeting details and a calendar invitation.
          </p>
          <div className="summary-card">
            <h3 className="summary-header">Meeting Details</h3>
            <div className="summary-item">
              <div className="summary-label">Expert:</div>
              <div className="summary-value">{expert.name}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Date:</div>
              <div className="summary-value">{selectedDate && formatDate(selectedDate)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Time:</div>
              <div className="summary-value">{selectedTime && formatTime(selectedTime)} ({timezone})</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Duration:</div>
              <div className="summary-value">{meetingDetails.duration} minutes</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Topic:</div>
              <div className="summary-value">{meetingDetails.topic}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Type:</div>
              <div className="summary-value">{meetingDetails.meetingType === 'video' ? 'Video Call' : 'Audio Call'}</div>
            </div>
          </div>
          <div className="confirmation-actions">
            <button className="confirmation-btn secondary">View in Calendar</button>
            <button className="confirmation-btn">Return to Expert Profile</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <h2 className="scheduler-title">Schedule a Meeting with {expert.name}</h2>
        <p className="scheduler-description">
          Select a date and time to schedule a consultation. All times are shown in your local timezone.
        </p>
      </div>

      <div className="scheduler-content">
        <div className="expert-details">
          <div className="expert-details-header">
            <div className="expert-avatar">{expert.avatar}</div>
            <div className="expert-info">
              <h3 className="expert-name">{expert.name}</h3>
              <div className="expert-languages">
                {expert.languages.map(lang => (
                  <span
                    key={lang}
                    className={`expert-language ${lang === currentLanguage ? 'preferred' : ''}`}
                    title={LANGUAGES[lang]?.name}
                  >
                    {LANGUAGES[lang]?.flag}
                  </span>
                ))}
              </div>
              <div className="expert-expertise">
                {expert.expertise.map((item, index) => (
                  <span key={index} className="expertise-tag">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="expert-details-section">
            <h4>Rating & Reviews</h4>
            <div className="expert-rating">
              <div className="rating-stars">
                {renderStarRating(expert.rating)}
              </div>
              <span className="rating-count">({expert.reviews} reviews)</span>
            </div>
          </div>

          <div className="expert-details-section">
            <h4>Availability</h4>
            <p className="availability-summary">
              {expert.name} is generally available on weekdays. Select a date to see specific available time slots.
            </p>
          </div>

          <div className="expert-details-section">
            <h4>Consultation Rate</h4>
            <p className="availability-summary">
              ${expert.hourlyRate} per hour
            </p>
          </div>

          <button className="connect-btn">Connect Now</button>
        </div>

        <div className="scheduler-main">
          <div className="scheduling-steps">
            <div className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Select Date</div>
            </div>
            <div className={`step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Select Time</div>
            </div>
            <div className={`step-item ${currentStep === 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Meeting Details</div>
            </div>
          </div>

          <div className="scheduler-step-content">
            {currentStep === 1 && (
              <>
                <h3 className="step-title">Select a Date</h3>

                <div className="timezone-selector">
                  <div>
                    <label className="timezone-selector-label">Timezone</label>
                    <select
                      className="timezone-select"
                      value={timezone}
                      onChange={handleTimezoneChange}
                    >
                      {getTimezoneOptions().map(tz => (
                        <option key={tz} value={tz}>
                          {formatTimezone(tz)}
                        </option>
                      ))}
                    </select>
                    <div className="timezone-info">This is your detected timezone. You can change it if needed.</div>
                  </div>

                  <div className="timezone-detected">
                    <span className="timezone-icon">🌍</span>
                    <span>Detected timezone: {formatTimezone(detectedTimezone)}</span>
                  </div>
                </div>

                <div className="date-picker">
                  <div className="date-picker-header">
                    <h4 className="month-title">{getMonthYearString()}</h4>
                    <div className="month-nav">
                      <button
                        className="month-nav-btn"
                        onClick={goToPreviousMonth}
                      >
                        ←
                      </button>
                      <button
                        className="month-nav-btn"
                        onClick={goToNextMonth}
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <div className="calendar">
                    <div className="calendar-header">
                      <div className="calendar-header-cell">Sun</div>
                      <div className="calendar-header-cell">Mon</div>
                      <div className="calendar-header-cell">Tue</div>
                      <div className="calendar-header-cell">Wed</div>
                      <div className="calendar-header-cell">Thu</div>
                      <div className="calendar-header-cell">Fri</div>
                      <div className="calendar-header-cell">Sat</div>
                    </div>

                    {generateCalendarDays().map((day, index) => (
                      <div
                        key={index}
                        className={`calendar-day
                          ${day.currentMonth ? '' : 'other-month'}
                          ${day.isToday ? 'current' : ''}
                          ${day.isSelected ? 'selected' : ''}
                          ${day.selectable ? 'available' : 'disabled'}
                        `}
                        onClick={() => day.selectable && handleDateSelect(day.date)}
                      >
                        {day.day}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <h3 className="step-title">Select a Time</h3>

                <div className="timezone-detected">
                  <span className="timezone-icon">📅</span>
                  <span>Selected date: {formatDate(selectedDate)}</span>
                </div>

                {availableTimeSlots.length > 0 ? (
                  <div className="time-slots">
                    {availableTimeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className={`time-slot ${selectedTime && selectedTime.getTime() === slot.time.getTime() ? 'selected' : ''}`}
                        onClick={() => handleTimeSelect(slot.time)}
                      >
                        {formatTime(slot.time)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-slots-message">
                    No available time slots for this date. Please select a different date.
                  </div>
                )}
              </>
            )}

            {currentStep === 3 && (
              <>
                <h3 className="step-title">Meeting Details</h3>

                <div className="summary-card">
                  <h4 className="summary-header">Appointment Summary</h4>
                  <div className="summary-item">
                    <div className="summary-label">Date:</div>
                    <div className="summary-value">{formatDate(selectedDate)}</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Time:</div>
                    <div className="summary-value">{formatTime(selectedTime)} ({timezone})</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Expert:</div>
                    <div className="summary-value">{expert.name}</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Rate:</div>
                    <div className="summary-value">${expert.hourlyRate} per hour</div>
                  </div>
                </div>

                <form className="meeting-form">
                  <div className="form-group">
                    <label className="form-label">Meeting Topic*</label>
                    <input
                      type="text"
                      name="topic"
                      className="form-input"
                      value={meetingDetails.topic}
                      onChange={handleMeetingDetailsChange}
                      placeholder="E.g., Resource Organization Consultation"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration*</label>
                    <select
                      name="duration"
                      className="form-select"
                      value={meetingDetails.duration}
                      onChange={handleMeetingDetailsChange}
                      required
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Meeting Type</label>
                    <div className="form-option-group">
                      <label className="form-option">
                        <input
                          type="radio"
                          name="meetingType"
                          value="video"
                          checked={meetingDetails.meetingType === 'video'}
                          onChange={handleMeetingDetailsChange}
                        />
                        Video Call
                      </label>
                      <label className="form-option">
                        <input
                          type="radio"
                          name="meetingType"
                          value="audio"
                          checked={meetingDetails.meetingType === 'audio'}
                          onChange={handleMeetingDetailsChange}
                        />
                        Audio Call
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes for the Expert</label>
                    <textarea
                      name="notes"
                      className="form-textarea"
                      value={meetingDetails.notes}
                      onChange={handleMeetingDetailsChange}
                      placeholder="Share any specific questions or topics you'd like to discuss..."
                    />
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="scheduler-actions">
            {currentStep > 1 && (
              <button
                className="back-btn"
                onClick={handleBackStep}
              >
                Back
              </button>
            )}
            <button
              className="next-btn"
              onClick={handleNextStep}
              disabled={!isStepComplete()}
            >
              {getNextButtonLabel()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertScheduler;
