import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './FeedbackSystem.css';

/**
 * FeedbackSystem Component
 *
 * Allows users to provide feedback on expert consultations and translation quality
 */
const FeedbackSystem = () => {
  const { currentLanguage, translate } = useLanguage();

  // State
  const [activeTab, setActiveTab] = useState('give-feedback');
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackStep, setFeedbackStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [historyFeedback, setHistoryFeedback] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Form state
  const [expertRating, setExpertRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [helpfulnessRating, setHelpfulnessRating] = useState(0);
  const [translationRating, setTranslationRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [selectedExpert, setSelectedExpert] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  // Load feedback history when component mounts
  useEffect(() => {
    // In a real app, this would fetch feedback history from an API
    // For now, simulate loading delay
    setIsLoading(true);
    setTimeout(() => {
      setHistoryFeedback(getSampleFeedbackHistory());
      setIsLoading(false);
    }, 1000);
  }, []);

  // Sample experts data
  const sampleExperts = [
    { id: 'expert-1', name: 'Jan de Vries', languages: ['en', 'nl', 'de'] },
    { id: 'expert-2', name: 'Elena García', languages: ['en', 'es'] },
    { id: 'expert-3', name: 'Mohammed Al-Farsi', languages: ['en', 'ar'] },
    { id: 'expert-4', name: 'Li Wei', languages: ['en', 'zh'] }
  ];

  // Sample session data
  const sampleSessions = [
    { id: 'session-1', expertId: 'expert-1', date: '2023-04-01', topic: 'Resource Organization Consultation' },
    { id: 'session-2', expertId: 'expert-1', date: '2023-04-15', topic: 'Follow-up on Digital Asset Management' },
    { id: 'session-3', expertId: 'expert-2', date: '2023-03-28', topic: 'Documentation Strategy Discussion' },
    { id: 'session-4', expertId: 'expert-3', date: '2023-04-05', topic: 'API Integration Planning' }
  ];

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Reset state when changing tabs
    if (tab === 'give-feedback') {
      resetFeedbackForm();
    } else if (tab === 'my-feedback') {
      setSelectedFeedback(null);
    }
  };

  // Reset feedback form
  const resetFeedbackForm = () => {
    setFeedbackType('');
    setFeedbackStep(1);
    setExpertRating(0);
    setCommunicationRating(0);
    setHelpfulnessRating(0);
    setTranslationRating(0);
    setAccuracyRating(0);
    setCommentText('');
    setSelectedExpert('');
    setSelectedSession('');
    setShowSuccess(false);
  };

  // Handle feedback type selection
  const handleFeedbackTypeSelect = (type) => {
    setFeedbackType(type);
    setFeedbackStep(2);
  };

  // Handle rating change
  const handleRatingChange = (ratingType, value) => {
    switch (ratingType) {
      case 'expert':
        setExpertRating(value);
        break;
      case 'communication':
        setCommunicationRating(value);
        break;
      case 'helpfulness':
        setHelpfulnessRating(value);
        break;
      case 'translation':
        setTranslationRating(value);
        break;
      case 'accuracy':
        setAccuracyRating(value);
        break;
      default:
        break;
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case 'comment':
        setCommentText(value);
        break;
      case 'expert':
        setSelectedExpert(value);
        break;
      case 'session':
        setSelectedSession(value);
        break;
      default:
        break;
    }
  };

  // Handle next step
  const handleNextStep = () => {
    if (feedbackStep < 3) {
      setFeedbackStep(feedbackStep + 1);
    } else {
      handleSubmitFeedback();
    }
  };

  // Handle back step
  const handleBackStep = () => {
    if (feedbackStep > 1) {
      setFeedbackStep(feedbackStep - 1);
    } else {
      setFeedbackType('');
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = () => {
    // In a real app, this would submit feedback to an API
    // For now, just show success message
    setIsLoading(true);

    setTimeout(() => {
      // Add the new feedback to history (in a real app, this would come from the API response)
      const newFeedback = {
        id: `feedback-${Date.now()}`,
        type: feedbackType,
        date: new Date().toISOString(),
        ratings: {
          expert: expertRating,
          communication: communicationRating,
          helpfulness: helpfulnessRating,
          translation: translationRating,
          accuracy: accuracyRating
        },
        comment: commentText,
        expert: sampleExperts.find(e => e.id === selectedExpert),
        session: sampleSessions.find(s => s.id === selectedSession)
      };

      setHistoryFeedback([newFeedback, ...historyFeedback]);
      setIsLoading(false);
      setShowSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        resetFeedbackForm();
      }, 3000);
    }, 1000);
  };

  // Check if current step is complete
  const isStepComplete = () => {
    switch (feedbackStep) {
      case 1:
        return !!feedbackType;
      case 2:
        if (feedbackType === 'expert') {
          return !!selectedExpert && !!selectedSession;
        } else {
          return true; // No selection needed for translation feedback
        }
      case 3:
        if (feedbackType === 'expert') {
          return expertRating > 0 && communicationRating > 0 && helpfulnessRating > 0;
        } else {
          return translationRating > 0 && accuracyRating > 0;
        }
      default:
        return false;
    }
  };

  // View feedback details
  const handleViewFeedbackDetails = (feedback) => {
    setSelectedFeedback(feedback);
  };

  // Go back to feedback list
  const handleBackToList = () => {
    setSelectedFeedback(null);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get average rating
  const getAverageRating = (ratings) => {
    if (ratings.expert) {
      // Expert feedback
      return ((ratings.expert + ratings.communication + ratings.helpfulness) / 3).toFixed(1);
    } else {
      // Translation feedback
      return ((ratings.translation + ratings.accuracy) / 2).toFixed(1);
    }
  };

  // Render stars for rating display
  const renderStars = (count) => {
    return '★'.repeat(count);
  };

  // Get sample feedback history
  const getSampleFeedbackHistory = () => {
    return [
      {
        id: 'feedback-1',
        type: 'expert',
        date: '2023-04-02T14:30:00Z',
        ratings: {
          expert: 5,
          communication: 4,
          helpfulness: 5
        },
        comment: 'Jan was extremely helpful in organizing our digital asset structure. His suggestions have already improved our workflow significantly.',
        expert: sampleExperts[0],
        session: sampleSessions[0]
      },
      {
        id: 'feedback-2',
        type: 'translation',
        date: '2023-04-10T09:15:00Z',
        ratings: {
          translation: 4,
          accuracy: 4
        },
        comment: 'The translations were very good, especially for technical terms. A few nuances were missed but overall quite accurate.'
      },
      {
        id: 'feedback-3',
        type: 'expert',
        date: '2023-03-29T11:00:00Z',
        ratings: {
          expert: 5,
          communication: 5,
          helpfulness: 5
        },
        comment: 'Elena was amazing! She explained everything clearly and provided exactly the documentation strategy we needed.',
        expert: sampleExperts[1],
        session: sampleSessions[2]
      }
    ];
  };

  // Render star rating input
  const renderStarRatingInput = (name, value, onChange) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= value ? 'active' : ''}`}
            onClick={() => onChange(name, star)}
          >
            ★
          </button>
        ))}
        <span className="rating-value">{value > 0 ? value : ''}</span>
      </div>
    );
  };

  // Render feedback form based on current step
  const renderFeedbackForm = () => {
    if (showSuccess) {
      return (
        <div className="success-message">
          <div className="success-icon">✓</div>
          <div className="success-content">
            <div className="success-title">Feedback Submitted Successfully!</div>
            <p>Thank you for your feedback. Your input helps us improve our services.</p>
          </div>
        </div>
      );
    }

    switch (feedbackStep) {
      case 1:
        return (
          <div className="feedback-category-selector">
            <div
              className={`category-card ${feedbackType === 'expert' ? 'selected' : ''}`}
              onClick={() => handleFeedbackTypeSelect('expert')}
            >
              <div className="category-icon">👨‍🚀</div>
              <div className="category-title">Expert Consultation</div>
              <div className="category-description">
                Rate your experience with our expert consultants
              </div>
            </div>

            <div
              className={`category-card ${feedbackType === 'translation' ? 'selected' : ''}`}
              onClick={() => handleFeedbackTypeSelect('translation')}
            >
              <div className="category-icon">🌐</div>
              <div className="category-title">Translation Quality</div>
              <div className="category-description">
                Rate the quality of automated translations
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="feedback-form">
            {feedbackType === 'expert' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Select Expert</label>
                  <select
                    name="expert"
                    className="form-select"
                    value={selectedExpert}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select an expert</option>
                    {sampleExperts.map(expert => (
                      <option key={expert.id} value={expert.id}>
                        {expert.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Consultation Session</label>
                  <select
                    name="session"
                    className="form-select"
                    value={selectedSession}
                    onChange={handleInputChange}
                    required
                    disabled={!selectedExpert}
                  >
                    <option value="">Select a session</option>
                    {sampleSessions
                      .filter(session => !selectedExpert || session.expertId === selectedExpert)
                      .map(session => (
                        <option key={session.id} value={session.id}>
                          {session.topic} - {session.date}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Which translation features have you used?</label>
                <div className="form-options">
                  <label className="form-option">
                    <input type="checkbox" checked readOnly /> Resource content translation
                  </label>
                  <label className="form-option">
                    <input type="checkbox" checked readOnly /> Chat translation
                  </label>
                  <label className="form-option">
                    <input type="checkbox" checked readOnly /> Document translation
                  </label>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="feedback-form">
            <div className="rating-container">
              {feedbackType === 'expert' ? (
                <>
                  <div className="rating-group">
                    <label className="rating-label">Overall Expert Rating</label>
                    {renderStarRatingInput('expert', expertRating, handleRatingChange)}
                  </div>

                  <div className="rating-group">
                    <label className="rating-label">Communication Quality</label>
                    {renderStarRatingInput('communication', communicationRating, handleRatingChange)}
                  </div>

                  <div className="rating-group">
                    <label className="rating-label">Helpfulness</label>
                    {renderStarRatingInput('helpfulness', helpfulnessRating, handleRatingChange)}
                  </div>
                </>
              ) : (
                <>
                  <div className="rating-group">
                    <label className="rating-label">Overall Translation Quality</label>
                    {renderStarRatingInput('translation', translationRating, handleRatingChange)}
                  </div>

                  <div className="rating-group">
                    <label className="rating-label">Accuracy</label>
                    {renderStarRatingInput('accuracy', accuracyRating, handleRatingChange)}
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Comments (Optional)</label>
              <textarea
                name="comment"
                className="form-textarea"
                value={commentText}
                onChange={handleInputChange}
                placeholder={feedbackType === 'expert' ?
                  "Share your experience with this expert..." :
                  "Tell us about your experience with the translation features..."
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render feedback history
  const renderFeedbackHistory = () => {
    if (selectedFeedback) {
      return (
        <div>
          <button className="back-to-list-btn" onClick={handleBackToList}>
            ← Back to feedback list
          </button>

          <div className="feedback-details-card">
            <div className="details-header">
              <div className="details-title">
                {selectedFeedback.type === 'expert' ? 'Expert Consultation Feedback' : 'Translation Quality Feedback'}
              </div>
              <div className="details-date">{formatDate(selectedFeedback.date)}</div>
            </div>

            {selectedFeedback.type === 'expert' && (
              <>
                <div className="details-row">
                  <div className="details-label">Expert:</div>
                  <div className="details-value">{selectedFeedback.expert.name}</div>
                </div>

                <div className="details-row">
                  <div className="details-label">Session:</div>
                  <div className="details-value">{selectedFeedback.session.topic}</div>
                </div>

                <div className="details-row">
                  <div className="details-label">Date:</div>
                  <div className="details-value">{formatDate(selectedFeedback.session.date)}</div>
                </div>
              </>
            )}

            <div className="details-row">
              <div className="details-label">Ratings:</div>
              <div className="details-value">
                {selectedFeedback.type === 'expert' ? (
                  <>
                    <div>Expert: {renderStars(selectedFeedback.ratings.expert)} ({selectedFeedback.ratings.expert}/5)</div>
                    <div>Communication: {renderStars(selectedFeedback.ratings.communication)} ({selectedFeedback.ratings.communication}/5)</div>
                    <div>Helpfulness: {renderStars(selectedFeedback.ratings.helpfulness)} ({selectedFeedback.ratings.helpfulness}/5)</div>
                  </>
                ) : (
                  <>
                    <div>Translation: {renderStars(selectedFeedback.ratings.translation)} ({selectedFeedback.ratings.translation}/5)</div>
                    <div>Accuracy: {renderStars(selectedFeedback.ratings.accuracy)} ({selectedFeedback.ratings.accuracy}/5)</div>
                  </>
                )}
              </div>
            </div>

            {selectedFeedback.comment && (
              <div className="details-comments">
                <div className="details-comments-title">Your Comments:</div>
                <div className="details-value">{selectedFeedback.comment}</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (historyFeedback.length === 0) {
      return (
        <div className="empty-feedback">
          You haven't provided any feedback yet.
        </div>
      );
    }

    return (
      <table className="feedback-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Date</th>
            <th>Rating</th>
            <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {historyFeedback.map(feedback => (
            <tr key={feedback.id}>
              <td>
                <span className={`feedback-type ${feedback.type}`}>
                  {feedback.type === 'expert' ? 'Expert' : 'Translation'}
                </span>
              </td>
              <td>
                <span className="feedback-date">{formatDate(feedback.date)}</span>
              </td>
              <td>
                <span className="table-rating">{renderStars(Math.round(getAverageRating(feedback.ratings)))}</span>
                <span>{getAverageRating(feedback.ratings)}</span>
              </td>
              <td>
                {feedback.type === 'expert' ? feedback.expert.name : 'Translation Services'}
              </td>
              <td>
                <button
                  className="view-details-btn"
                  onClick={() => handleViewFeedbackDetails(feedback)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="feedback-container">
        <div className="feedback-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading feedback system...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h2 className="feedback-title">Feedback System</h2>
        <p className="feedback-description">
          Help us improve our services by sharing your experience with expert consultations and translations.
        </p>
      </div>

      <div className="feedback-tabs">
        <button
          className={`feedback-tab ${activeTab === 'give-feedback' ? 'active' : ''}`}
          onClick={() => handleTabChange('give-feedback')}
        >
          Give Feedback
        </button>
        <button
          className={`feedback-tab ${activeTab === 'my-feedback' ? 'active' : ''}`}
          onClick={() => handleTabChange('my-feedback')}
        >
          My Feedback History
        </button>
      </div>

      <div className="feedback-content">
        {activeTab === 'give-feedback' ? (
          <>
            {renderFeedbackForm()}

            {!showSuccess && (
              <div className="feedback-actions">
                {feedbackStep > 1 && (
                  <button
                    className="cancel-btn"
                    onClick={handleBackStep}
                  >
                    Back
                  </button>
                )}

                <button
                  className="submit-btn"
                  onClick={handleNextStep}
                  disabled={!isStepComplete()}
                >
                  {feedbackStep === 3 ? 'Submit Feedback' : 'Next'}
                </button>
              </div>
            )}
          </>
        ) : (
          renderFeedbackHistory()
        )}
      </div>
    </div>
  );
};

export default FeedbackSystem;
