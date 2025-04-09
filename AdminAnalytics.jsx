import React, { useState, useEffect } from 'react';
import './AdminAnalytics.css';

/**
 * AdminAnalytics Component
 *
 * Provides detailed analytics about translation usage, performance, and errors.
 * This component is intended for admin users only.
 */
const AdminAnalytics = ({ isAdmin = false }) => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [dateRange, setDateRange] = useState('week');
  const [showAccessDenied, setShowAccessDenied] = useState(!isAdmin);

  // Load analytics data
  useEffect(() => {
    if (isAdmin) {
      setShowAccessDenied(false);
      fetchAnalyticsData();
    } else {
      setShowAccessDenied(true);
    }
  }, [isAdmin, dateRange]);

  // Fetch analytics data (simulated)
  const fetchAnalyticsData = () => {
    setLoading(true);

    // In a real app, this would make an API call to get actual analytics data
    setTimeout(() => {
      setAnalyticsData(getSimulatedData(dateRange));
      setLoading(false);
    }, 1000);
  };

  // Generate simulated analytics data
  const getSimulatedData = (range) => {
    const multiplier = range === 'day' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 365;

    // Generate sample data based on the selected date range
    return {
      overview: {
        totalTranslations: Math.floor(1250 * multiplier),
        charactersTranslated: Math.floor(78500 * multiplier),
        averageResponseTime: 0.34,
        successRate: 98.2,
        activeUsers: Math.floor(45 * (range === 'day' ? 1 : range === 'week' ? 0.8 : 0.6)),
        errorRate: 1.8
      },
      languages: {
        topSourceLanguages: [
          { language: 'en', count: Math.floor(950 * multiplier), percentage: 76 },
          { language: 'es', count: Math.floor(125 * multiplier), percentage: 10 },
          { language: 'fr', count: Math.floor(87.5 * multiplier), percentage: 7 },
          { language: 'de', count: Math.floor(62.5 * multiplier), percentage: 5 },
          { language: 'ru', count: Math.floor(25 * multiplier), percentage: 2 }
        ],
        topTargetLanguages: [
          { language: 'es', count: Math.floor(375 * multiplier), percentage: 30 },
          { language: 'fr', count: Math.floor(312.5 * multiplier), percentage: 25 },
          { language: 'de', count: Math.floor(250 * multiplier), percentage: 20 },
          { language: 'zh', count: Math.floor(187.5 * multiplier), percentage: 15 },
          { language: 'ru', count: Math.floor(125 * multiplier), percentage: 10 }
        ]
      },
      contentTypes: [
        { type: 'Chat Messages', count: Math.floor(875 * multiplier), percentage: 70 },
        { type: 'UI Elements', count: Math.floor(187.5 * multiplier), percentage: 15 },
        { type: 'Documentation', count: Math.floor(125 * multiplier), percentage: 10 },
        { type: 'User Profiles', count: Math.floor(62.5 * multiplier), percentage: 5 }
      ],
      errors: {
        categories: [
          { category: 'Network Issues', count: Math.floor(13.75 * multiplier), percentage: 61 },
          { category: 'Invalid Input', count: Math.floor(4.5 * multiplier), percentage: 20 },
          { category: 'Server Timeout', count: Math.floor(2.7 * multiplier), percentage: 12 },
          { category: 'Unknown Error', count: Math.floor(1.575 * multiplier), percentage: 7 }
        ],
        byLanguage: [
          { language: 'zh', count: Math.floor(9 * multiplier), percentage: 40 },
          { language: 'ru', count: Math.floor(6.75 * multiplier), percentage: 30 },
          { language: 'ar', count: Math.floor(4.5 * multiplier), percentage: 20 },
          { language: 'ja', count: Math.floor(2.25 * multiplier), percentage: 10 }
        ]
      },
      performance: {
        byLanguage: [
          { language: 'en', responseTime: 0.18 },
          { language: 'es', responseTime: 0.25 },
          { language: 'fr', responseTime: 0.22 },
          { language: 'de', responseTime: 0.28 },
          { language: 'zh', responseTime: 0.45 },
          { language: 'ru', responseTime: 0.42 },
          { language: 'ar', responseTime: 0.51 },
          { language: 'ja', responseTime: 0.48 }
        ]
      },
      trends: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString(),
          translations: Math.floor(Math.random() * 250 + 1000)
        })),
        hourly: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          translations: Math.floor(Math.random() * 30 + 40)
        }))
      }
    };
  };

  // Render language name with flag
  const renderLanguage = (code) => {
    const languages = {
      en: { name: 'English', flag: '🇺🇸' },
      es: { name: 'Spanish', flag: '🇪🇸' },
      fr: { name: 'French', flag: '🇫🇷' },
      de: { name: 'German', flag: '🇩🇪' },
      zh: { name: 'Chinese', flag: '🇨🇳' },
      ru: { name: 'Russian', flag: '🇷🇺' },
      ar: { name: 'Arabic', flag: '🇦🇪' },
      ja: { name: 'Japanese', flag: '🇯🇵' }
    };

    const lang = languages[code] || { name: code, flag: '🌐' };
    return (
      <span className="language-item">
        <span className="language-flag">{lang.flag}</span>
        <span className="language-name">{lang.name}</span>
      </span>
    );
  };

  // Export report as CSV
  const exportCsv = () => {
    if (!analyticsData) return;

    // Generate CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add header
    csvContent += "Category,Metric,Value\n";

    // Add overview data
    Object.entries(analyticsData.overview).forEach(([key, value]) => {
      let formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      csvContent += `Overview,${formattedKey},${value}\n`;
    });

    // Add language data
    analyticsData.languages.topSourceLanguages.forEach(lang => {
      csvContent += `Top Source Languages,${lang.language},${lang.count}\n`;
    });

    analyticsData.languages.topTargetLanguages.forEach(lang => {
      csvContent += `Top Target Languages,${lang.language},${lang.count}\n`;
    });

    // Add content types
    analyticsData.contentTypes.forEach(content => {
      csvContent += `Content Types,${content.type},${content.count}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `translation_analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user is not an admin, show access denied message
  if (showAccessDenied) {
    return (
      <div className="admin-analytics admin-only">
        <div className="analytics-header">
          <h2>
            Translation Analytics
            <span className="admin-badge">Admin Only</span>
          </h2>
        </div>
        <div className="access-denied-message">
          <div className="access-denied-icon">⚠️</div>
          <p>The detailed analytics dashboard is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h2>Translation Analytics Dashboard</h2>
        <div className="analytics-controls">
          <div className="date-range-selector">
            <label>Time Period:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div className="analytics-actions">
            <button className="export-btn" onClick={exportCsv}>
              Export Report
            </button>
            <button className="refresh-btn" onClick={fetchAnalyticsData}>
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="analytics-nav">
        <button
          className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-btn ${activeView === 'languages' ? 'active' : ''}`}
          onClick={() => setActiveView('languages')}
        >
          Languages
        </button>
        <button
          className={`nav-btn ${activeView === 'content' ? 'active' : ''}`}
          onClick={() => setActiveView('content')}
        >
          Content Types
        </button>
        <button
          className={`nav-btn ${activeView === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveView('errors')}
        >
          Error Analysis
        </button>
        <button
          className={`nav-btn ${activeView === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveView('performance')}
        >
          Performance
        </button>
        <button
          className={`nav-btn ${activeView === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveView('trends')}
        >
          Trends
        </button>
      </div>

      <div className="analytics-content">
        {loading ? (
          <div className="analytics-loading">
            <div className="loading-spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : analyticsData ? (
          <>
            {activeView === 'overview' && (
              <div className="analytics-overview">
                <h3>Translation Overview</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-title">Total Translations</div>
                    <div className="stat-value">{analyticsData.overview.totalTranslations.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">Characters Translated</div>
                    <div className="stat-value">{analyticsData.overview.charactersTranslated.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">Avg. Response Time</div>
                    <div className="stat-value">{analyticsData.overview.averageResponseTime.toFixed(2)}s</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">Success Rate</div>
                    <div className="stat-value">{analyticsData.overview.successRate}%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">Active Users</div>
                    <div className="stat-value">{analyticsData.overview.activeUsers}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">Error Rate</div>
                    <div className="stat-value">{analyticsData.overview.errorRate}%</div>
                  </div>
                </div>

                <div className="insights-section">
                  <h3>Key Insights</h3>
                  <ul className="insights-list">
                    <li>Most translations occur during business hours (9 AM - 5 PM).</li>
                    <li>Spanish is the most requested target language.</li>
                    <li>Average response time has improved by 18% compared to last period.</li>
                    <li>Chat messages are the most commonly translated content type.</li>
                    <li>Chinese translations have the highest error rate at 2.3%.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeView === 'languages' && (
              <div className="languages-analysis">
                <div className="language-section">
                  <h3>Top Source Languages</h3>
                  <div className="language-list">
                    {analyticsData.languages.topSourceLanguages.map((lang, i) => (
                      <div className="language-stat" key={i}>
                        <div className="language-info">
                          <span className="language-rank">{i + 1}</span>
                          {renderLanguage(lang.language)}
                        </div>
                        <div className="language-count">
                          <div className="count-value">{lang.count.toLocaleString()}</div>
                          <div className="percentage-bar">
                            <div className="percentage-fill" style={{ width: `${lang.percentage}%` }}></div>
                          </div>
                          <div className="percentage-value">{lang.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="language-section">
                  <h3>Top Target Languages</h3>
                  <div className="language-list">
                    {analyticsData.languages.topTargetLanguages.map((lang, i) => (
                      <div className="language-stat" key={i}>
                        <div className="language-info">
                          <span className="language-rank">{i + 1}</span>
                          {renderLanguage(lang.language)}
                        </div>
                        <div className="language-count">
                          <div className="count-value">{lang.count.toLocaleString()}</div>
                          <div className="percentage-bar">
                            <div className="percentage-fill" style={{ width: `${lang.percentage}%` }}></div>
                          </div>
                          <div className="percentage-value">{lang.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'content' && (
              <div className="content-analysis">
                <h3>Content Types Translated</h3>
                <div className="content-list">
                  {analyticsData.contentTypes.map((content, i) => (
                    <div className="content-stat" key={i}>
                      <div className="content-info">
                        <span className="content-icon">
                          {content.type === 'Chat Messages' ? '💬' :
                           content.type === 'UI Elements' ? '🖥️' :
                           content.type === 'Documentation' ? '📄' : '👤'}
                        </span>
                        <span className="content-type">{content.type}</span>
                      </div>
                      <div className="content-count">
                        <div className="count-value">{content.count.toLocaleString()}</div>
                        <div className="percentage-bar">
                          <div className="percentage-fill" style={{ width: `${content.percentage}%` }}></div>
                        </div>
                        <div className="percentage-value">{content.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'errors' && (
              <div className="errors-analysis">
                <div className="error-section">
                  <h3>Error Categories</h3>
                  <div className="error-list">
                    {analyticsData.errors.categories.map((error, i) => (
                      <div className="error-stat" key={i}>
                        <div className="error-info">
                          <span className="error-category">{error.category}</span>
                        </div>
                        <div className="error-count">
                          <div className="count-value">{error.count.toLocaleString()}</div>
                          <div className="percentage-bar">
                            <div className="percentage-fill" style={{ width: `${error.percentage}%` }}></div>
                          </div>
                          <div className="percentage-value">{error.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="error-section">
                  <h3>Errors by Language</h3>
                  <div className="error-list">
                    {analyticsData.errors.byLanguage.map((error, i) => (
                      <div className="error-stat" key={i}>
                        <div className="error-info">
                          {renderLanguage(error.language)}
                        </div>
                        <div className="error-count">
                          <div className="count-value">{error.count.toLocaleString()}</div>
                          <div className="percentage-bar">
                            <div className="percentage-fill" style={{ width: `${error.percentage}%` }}></div>
                          </div>
                          <div className="percentage-value">{error.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'performance' && (
              <div className="performance-analysis">
                <h3>Translation Performance by Language</h3>
                <div className="performance-list">
                  {analyticsData.performance.byLanguage.map((perf, i) => (
                    <div className="performance-stat" key={i}>
                      <div className="performance-info">
                        {renderLanguage(perf.language)}
                      </div>
                      <div className="performance-time">
                        <div className="time-value">{perf.responseTime.toFixed(2)}s</div>
                        <div className="time-bar-container">
                          <div
                            className="time-bar"
                            style={{
                              width: `${Math.min(100, perf.responseTime * 200)}%`,
                              backgroundColor: perf.responseTime > 0.4 ? '#e53e3e' : perf.responseTime > 0.3 ? '#f6ad55' : '#38a169'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'trends' && (
              <div className="trends-analysis">
                <div className="trend-section">
                  <h3>Daily Translation Trends</h3>
                  <div className="chart-container">
                    <div className="bar-chart">
                      {analyticsData.trends.daily.map((day, i) => (
                        <div className="chart-bar-container" key={i}>
                          <div
                            className="chart-bar"
                            style={{
                              height: `${(day.translations / 1500) * 100}%`
                            }}
                          >
                            <div className="bar-value">{day.translations}</div>
                          </div>
                          <div className="bar-label">{day.date.split('/').slice(0, 2).join('/')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="trend-section">
                  <h3>Hourly Translation Distribution</h3>
                  <div className="chart-container">
                    <div className="bar-chart hourly">
                      {analyticsData.trends.hourly.map((hour, i) => (
                        <div className="chart-bar-container" key={i}>
                          <div
                            className="chart-bar"
                            style={{
                              height: `${(hour.translations / 100) * 100}%`
                            }}
                          >
                            <div className="bar-value">{hour.translations}</div>
                          </div>
                          <div className="bar-label">{hour.hour}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="analytics-error">
            <p>Failed to load analytics data. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
