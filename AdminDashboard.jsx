import React, { useState, useEffect } from 'react';
import {
  getTranslationMemoryStats,
  getTranslationHistory,
  LANGUAGES,
  CONFIDENCE_LEVELS
} from '../i18n/TranslationService';
import './AdminDashboard.css';

/**
 * AdminDashboard Component
 *
 * Provides statistics and visualization of translation activity and user feedback
 * for administrators to monitor system performance and user engagement
 */
const AdminDashboard = () => {
  // State for memory stats
  const [memoryStats, setMemoryStats] = useState({
    totalEntries: 0,
    languagePairs: 0,
    mostUsedPair: null,
    averageConfidence: CONFIDENCE_LEVELS.UNKNOWN
  });

  // State for feedback stats
  const [feedbackStats, setFeedbackStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    neutralFeedback: 0
  });

  // State for translation history stats
  const [historyStats, setHistoryStats] = useState({
    totalTranslations: 0,
    todayTranslations: 0,
    topLanguages: [],
    translationsOverTime: []
  });

  // State for tab selection
  const [activeTab, setActiveTab] = useState('overview');

  // State for recent feedback
  const [recentFeedback, setRecentFeedback] = useState([]);

  // Load dashboard data
  useEffect(() => {
    loadStats();
  }, []);

  // Load all statistics
  const loadStats = () => {
    loadMemoryStats();
    loadFeedbackStats();
    loadHistoryStats();
    loadRecentFeedback();
  };

  // Load translation memory statistics
  const loadMemoryStats = () => {
    const stats = getTranslationMemoryStats();
    setMemoryStats(stats);
  };

  // Load feedback statistics
  const loadFeedbackStats = () => {
    try {
      const feedbackItems = JSON.parse(localStorage.getItem('translationFeedback')) || [];

      if (feedbackItems.length === 0) {
        setFeedbackStats({
          totalFeedback: 0,
          averageRating: 0,
          positiveFeedback: 0,
          negativeFeedback: 0,
          neutralFeedback: 0
        });
        return;
      }

      // Calculate statistics
      const totalRating = feedbackItems.reduce((sum, item) => sum + item.rating, 0);
      const avgRating = totalRating / feedbackItems.length;

      const positive = feedbackItems.filter(item => item.rating >= 4).length;
      const negative = feedbackItems.filter(item => item.rating <= 2).length;
      const neutral = feedbackItems.filter(item => item.rating === 3).length;

      setFeedbackStats({
        totalFeedback: feedbackItems.length,
        averageRating: avgRating,
        positiveFeedback: positive,
        negativeFeedback: negative,
        neutralFeedback: neutral
      });
    } catch (error) {
      console.error('Error loading feedback stats:', error);
    }
  };

  // Load translation history statistics
  const loadHistoryStats = () => {
    try {
      const history = getTranslationHistory();

      if (history.length === 0) {
        setHistoryStats({
          totalTranslations: 0,
          todayTranslations: 0,
          topLanguages: [],
          translationsOverTime: []
        });
        return;
      }

      // Calculate total translations
      const totalTranslations = history.length;

      // Calculate today's translations
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTranslations = history.filter(item =>
        new Date(item.timestamp) >= today
      ).length;

      // Calculate top language pairs
      const langPairs = {};
      history.forEach(item => {
        const pair = `${item.sourceLanguage}-${item.targetLanguage}`;
        langPairs[pair] = (langPairs[pair] || 0) + 1;
      });

      // Sort and get top 5
      const topLanguages = Object.entries(langPairs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pair, count]) => {
          const [source, target] = pair.split('-');
          return {
            pair,
            source,
            target,
            count
          };
        });

      // Calculate translations over time (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const count = history.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= date && itemDate < nextDate;
        }).length;

        last7Days.push({
          date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          count
        });
      }

      setHistoryStats({
        totalTranslations,
        todayTranslations,
        topLanguages,
        translationsOverTime: last7Days
      });
    } catch (error) {
      console.error('Error loading history stats:', error);
    }
  };

  // Load recent feedback for detailed view
  const loadRecentFeedback = () => {
    try {
      const feedbackItems = JSON.parse(localStorage.getItem('translationFeedback')) || [];

      // Sort by date, most recent first
      const sortedFeedback = [...feedbackItems].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 10); // Get 10 most recent

      setRecentFeedback(sortedFeedback);
    } catch (error) {
      console.error('Error loading recent feedback:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get star rating display
  const StarRating = ({ rating }) => {
    return (
      <div className="star-rating-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'active' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-title">Administrator Dashboard</h2>
      <p className="dashboard-description">
        Monitor translation activity, user feedback, and system performance
      </p>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          User Feedback
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Translation History
        </button>
        <button
          className={`tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          Translation Memory
        </button>
      </div>

      <div className="dashboard-content">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h3>System Overview</h3>

            <div className="stat-cards">
              <div className="stat-card">
                <div className="stat-title">Total Translations</div>
                <div className="stat-value">{historyStats.totalTranslations}</div>
                <div className="stat-subtitle">Today: {historyStats.todayTranslations}</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Feedback Rating</div>
                <div className="stat-value">{feedbackStats.averageRating.toFixed(1)}</div>
                <div className="stat-subtitle">From {feedbackStats.totalFeedback} reviews</div>
                <div className="mini-rating">
                  <StarRating rating={Math.round(feedbackStats.averageRating)} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Translation Memory</div>
                <div className="stat-value">{memoryStats.totalEntries}</div>
                <div className="stat-subtitle">Across {memoryStats.languagePairs} language pairs</div>
              </div>
            </div>

            <div className="chart-container">
              <h4>Translations Last 7 Days</h4>
              <div className="bar-chart">
                {historyStats.translationsOverTime.map((day, index) => (
                  <div className="chart-item" key={index}>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${Math.max(day.count * 10, 5)}px`,
                          backgroundColor: day.count > 0 ? '#385ae8' : '#e0e0e0'
                        }}
                      >
                        <span className="chart-value">{day.count}</span>
                      </div>
                    </div>
                    <div className="chart-label">{day.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="activity-feed">
              <h4>Recent Activity</h4>

              {recentFeedback.length > 0 ? (
                <div className="activity-list">
                  {recentFeedback.slice(0, 5).map((feedback, index) => (
                    <div className="activity-item" key={index}>
                      <div className="activity-icon">
                        {feedback.rating >= 4 ? '👍' : feedback.rating <= 2 ? '👎' : '✋'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="lang-pair">
                            {LANGUAGES[feedback.sourceLanguage]?.flag || '🌐'} →
                            {LANGUAGES[feedback.targetLanguage]?.flag || '🌐'}
                          </span>
                          <StarRating rating={feedback.rating} />
                          <span className="activity-time">
                            {formatDate(feedback.timestamp)}
                          </span>
                        </div>
                        <div className="activity-text">
                          {feedback.comment || (
                            feedback.rating >= 4
                              ? 'User liked this translation'
                              : feedback.rating <= 2
                                ? 'User had issues with this translation'
                                : 'User rated this translation as average'
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No recent activity to display</div>
              )}
            </div>
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div className="feedback-tab">
            <h3>User Feedback Analysis</h3>

            <div className="feedback-metrics">
              <div className="feedback-metric">
                <div className="metric-value">{feedbackStats.totalFeedback}</div>
                <div className="metric-label">Total Feedback</div>
              </div>

              <div className="feedback-metric">
                <div className="metric-value positive">{feedbackStats.positiveFeedback}</div>
                <div className="metric-label">Positive Feedback</div>
              </div>

              <div className="feedback-metric">
                <div className="metric-value neutral">{feedbackStats.neutralFeedback}</div>
                <div className="metric-label">Neutral Feedback</div>
              </div>

              <div className="feedback-metric">
                <div className="metric-value negative">{feedbackStats.negativeFeedback}</div>
                <div className="metric-label">Negative Feedback</div>
              </div>
            </div>

            <div className="feedback-chart">
              <h4>Feedback Distribution</h4>
              <div className="distribution-chart">
                {feedbackStats.totalFeedback > 0 ? (
                  <div className="distribution-bars">
                    <div
                      className="distribution-segment positive"
                      style={{
                        width: `${(feedbackStats.positiveFeedback / feedbackStats.totalFeedback) * 100}%`
                      }}
                    >
                      {Math.round((feedbackStats.positiveFeedback / feedbackStats.totalFeedback) * 100)}%
                    </div>
                    <div
                      className="distribution-segment neutral"
                      style={{
                        width: `${(feedbackStats.neutralFeedback / feedbackStats.totalFeedback) * 100}%`
                      }}
                    >
                      {Math.round((feedbackStats.neutralFeedback / feedbackStats.totalFeedback) * 100)}%
                    </div>
                    <div
                      className="distribution-segment negative"
                      style={{
                        width: `${(feedbackStats.negativeFeedback / feedbackStats.totalFeedback) * 100}%`
                      }}
                    >
                      {Math.round((feedbackStats.negativeFeedback / feedbackStats.totalFeedback) * 100)}%
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">No feedback data available</div>
                )}
              </div>
            </div>

            <div className="detailed-feedback">
              <h4>Recent Feedback</h4>
              {recentFeedback.length > 0 ? (
                <div className="feedback-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Languages</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Modified?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentFeedback.map((item, index) => (
                        <tr key={index} className={item.rating <= 2 ? 'negative-row' : item.rating >= 4 ? 'positive-row' : ''}>
                          <td>{formatDate(item.timestamp)}</td>
                          <td>
                            {LANGUAGES[item.sourceLanguage]?.flag || '🌐'} →
                            {LANGUAGES[item.targetLanguage]?.flag || '🌐'}
                          </td>
                          <td><StarRating rating={item.rating} /></td>
                          <td className="comment-cell">{item.comment || '-'}</td>
                          <td>{item.wasEdited ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">No feedback data available</div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="history-tab">
            <h3>Translation History</h3>

            <div className="history-summary">
              <div className="summary-metric">
                <div className="metric-value">{historyStats.totalTranslations}</div>
                <div className="metric-label">Total Translations</div>
              </div>

              <div className="summary-metric">
                <div className="metric-value highlight">{historyStats.todayTranslations}</div>
                <div className="metric-label">Today's Translations</div>
              </div>
            </div>

            <div className="top-languages">
              <h4>Top Language Pairs</h4>
              {historyStats.topLanguages.length > 0 ? (
                <div className="language-pairs">
                  {historyStats.topLanguages.map((lang, index) => (
                    <div className="language-pair-item" key={index}>
                      <div className="language-flags">
                        <span className="source-flag">
                          {LANGUAGES[lang.source]?.flag || '🌐'}
                        </span>
                        <span className="direction-arrow">→</span>
                        <span className="target-flag">
                          {LANGUAGES[lang.target]?.flag || '🌐'}
                        </span>
                      </div>
                      <div className="language-names">
                        {LANGUAGES[lang.source]?.name || lang.source} →&nbsp;
                        {LANGUAGES[lang.target]?.name || lang.target}
                      </div>
                      <div className="language-count">{lang.count} translations</div>
                      <div className="language-bar-container">
                        <div
                          className="language-bar"
                          style={{
                            width: `${(lang.count / historyStats.topLanguages[0].count) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No translation history available</div>
              )}
            </div>

            <div className="time-chart">
              <h4>Translation Volume Over Time</h4>
              <div className="bar-chart horizontal">
                {historyStats.translationsOverTime.map((day, index) => (
                  <div className="chart-row" key={index}>
                    <div className="chart-label">{day.date}</div>
                    <div className="chart-bar-container horizontal">
                      <div
                        className="chart-bar horizontal"
                        style={{
                          width: `${Math.min(day.count * 5, 100)}%`,
                          backgroundColor: day.count > 0 ? '#385ae8' : '#e0e0e0'
                        }}
                      >
                        <span className="chart-value horizontal">{day.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MEMORY TAB */}
        {activeTab === 'memory' && (
          <div className="memory-tab">
            <h3>Translation Memory Status</h3>

            <div className="memory-summary">
              <div className="memory-metric">
                <div className="metric-value highlight">{memoryStats.totalEntries}</div>
                <div className="metric-label">Total Memory Entries</div>
              </div>

              <div className="memory-metric">
                <div className="metric-value">{memoryStats.languagePairs}</div>
                <div className="metric-label">Language Pairs</div>
              </div>

              <div className="memory-metric">
                <div className="metric-value confidence">
                  {memoryStats.averageConfidence.charAt(0).toUpperCase() +
                   memoryStats.averageConfidence.slice(1)}
                </div>
                <div className="metric-label">Average Confidence</div>
              </div>
            </div>

            {memoryStats.mostUsedPair && (
              <div className="most-used-pair">
                <h4>Most Used Language Pair</h4>
                <div className="pair-stats">
                  <div className="pair-flags">
                    <span className="source-flag">
                      {LANGUAGES[memoryStats.mostUsedPair.pair.split('-')[0]]?.flag || '🌐'}
                    </span>
                    <span className="direction-arrow">→</span>
                    <span className="target-flag">
                      {LANGUAGES[memoryStats.mostUsedPair.pair.split('-')[1]]?.flag || '🌐'}
                    </span>
                  </div>
                  <div className="pair-names">
                    {LANGUAGES[memoryStats.mostUsedPair.pair.split('-')[0]]?.name ||
                     memoryStats.mostUsedPair.pair.split('-')[0]} →&nbsp;
                    {LANGUAGES[memoryStats.mostUsedPair.pair.split('-')[1]]?.name ||
                     memoryStats.mostUsedPair.pair.split('-')[1]}
                  </div>
                  <div className="pair-count">{memoryStats.mostUsedPair.count} entries</div>
                </div>
              </div>
            )}

            <div className="memory-actions">
              <button className="action-btn export">Export Translation Memory</button>
              <button className="action-btn clear">Clear Translation Memory</button>
              <button className="action-btn refresh" onClick={loadStats}>
                Refresh Statistics
              </button>
            </div>

            <div className="memory-health">
              <h4>Memory Health Status</h4>
              <div className="health-indicators">
                <div className="health-indicator">
                  <div className="indicator-label">Capacity</div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(memoryStats.totalEntries / 10, 100)}%`,
                        backgroundColor: memoryStats.totalEntries > 800 ? '#e74c3c' :
                                        memoryStats.totalEntries > 500 ? '#f39c12' : '#27ae60'
                      }}
                    ></div>
                  </div>
                  <div className="indicator-status">
                    {memoryStats.totalEntries > 800 ? 'High' :
                     memoryStats.totalEntries > 500 ? 'Medium' : 'Low'} Usage
                  </div>
                </div>

                <div className="health-indicator">
                  <div className="indicator-label">Confidence Level</div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${memoryStats.averageConfidence === CONFIDENCE_LEVELS.HIGH ? 90 :
                                memoryStats.averageConfidence === CONFIDENCE_LEVELS.MEDIUM ? 60 :
                                memoryStats.averageConfidence === CONFIDENCE_LEVELS.LOW ? 30 : 10}%`,
                        backgroundColor: memoryStats.averageConfidence === CONFIDENCE_LEVELS.HIGH ? '#27ae60' :
                                        memoryStats.averageConfidence === CONFIDENCE_LEVELS.MEDIUM ? '#f39c12' : '#e74c3c'
                      }}
                    ></div>
                  </div>
                  <div className="indicator-status">
                    {memoryStats.averageConfidence.charAt(0).toUpperCase() +
                     memoryStats.averageConfidence.slice(1)} Confidence
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
