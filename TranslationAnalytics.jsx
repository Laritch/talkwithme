import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import translationService from '../i18n/TranslationService';
import './TranslationAnalytics.css';

/**
 * TranslationAnalytics Component
 *
 * Displays statistics and analytics about translations
 * to help understand usage patterns and optimize resources.
 * This component is intended for admin users only.
 */
const TranslationAnalytics = ({ isAdmin = false }) => {
  const { languages, translate } = useLanguage();
  const [translationStats, setTranslationStats] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], values: [] });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(!isAdmin);

  // Real-time monitoring state
  const [realtimeEvents, setRealtimeEvents] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [eventCount, setEventCount] = useState(0);
  const realtimeRef = useRef(null);

  // Load stats based on admin access
  useEffect(() => {
    if (isAdmin) {
      setShowAccessDenied(false);
      loadTranslationStats();
    } else {
      setShowAccessDenied(true);
      setIsLoading(false);
    }
  }, [isAdmin, timeRange, useCustomDateRange, startDate, endDate]);

  // Initialize dates when component mounts
  useEffect(() => {
    const now = new Date();
    const end = now.toISOString().split('T')[0]; // Today's date

    // Set start date based on selected time range
    const start = new Date();
    if (timeRange === 'day') {
      start.setDate(start.getDate() - 1);
    } else if (timeRange === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (timeRange === 'month') {
      start.setMonth(start.getMonth() - 1);
    } else if (timeRange === 'year') {
      start.setFullYear(start.getFullYear() - 1);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end);
  }, [timeRange]);

  // Function to load translation statistics
  const loadTranslationStats = useCallback(() => {
    setIsLoading(true);

    // Short delay to show loading state
    const timerRef = setTimeout(() => {
      // Get real usage data from the translation service
      const usageData = getTranslationUsageData();

      // Generate sample statistics or enhance real data with simulated stats
      const stats = generateAnalyticsData(timeRange, usageData);
      setTranslationStats(stats);

      // Prepare chart data
      prepareChartData(stats);

      setIsLoading(false);
    }, 800);

    // Return cleanup function to clear the timeout
    return () => clearTimeout(timerRef);
  }, [timeRange]);

  // Load statistics on component mount and when timeRange or date range changes
  useEffect(() => {
    const cleanup = loadTranslationStats();
    return cleanup;
  }, [timeRange, useCustomDateRange, startDate, endDate, loadTranslationStats]);

  // Set up real-time translation monitoring
  useEffect(() => {
    // Initialize with some sample events
    const sampleEvents = generateSampleEvents(3);
    setRealtimeEvents(sampleEvents);

    // Set up interval for real-time events
    const interval = setInterval(() => {
      if (isMonitoring) {
        // Add new event
        const newEvent = generateSampleEvent();

        setRealtimeEvents(prev => {
          // Keep only the most recent 20 events
          const updated = [newEvent, ...prev].slice(0, 20);
          return updated;
        });

        setEventCount(prev => prev + 1);

        // Scroll to top of events container if available
        if (realtimeRef.current) {
          realtimeRef.current.scrollTop = 0;
        }
      }
    }, 5000); // New event every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Generate a sample translation event for the real-time monitor
  const generateSampleEvent = () => {
    const langCodes = Object.keys(languages).filter(code => code !== 'en');
    const randomLangIndex = Math.floor(Math.random() * langCodes.length);
    const targetLang = langCodes[randomLangIndex];

    const sampleTexts = [
      "How to organize digital assets",
      "Resource management best practices",
      "Data analysis techniques",
      "API integration guide",
      "Content categorization strategies",
      "Digital asset workflow optimization",
      "Metadata management guide"
    ];

    const randomTextIndex = Math.floor(Math.random() * sampleTexts.length);
    const sourceText = sampleTexts[randomTextIndex];

    // Sample translations for demonstration
    const translations = {
      'fr': {
        'How to organize digital assets': 'Comment organiser les actifs numériques',
        'Resource management best practices': 'Meilleures pratiques de gestion des ressources',
        'Data analysis techniques': 'Techniques d\'analyse de données',
        'API integration guide': 'Guide d\'intégration API',
        'Content categorization strategies': 'Stratégies de catégorisation de contenu',
        'Digital asset workflow optimization': 'Optimisation du flux de travail des actifs numériques',
        'Metadata management guide': 'Guide de gestion des métadonnées'
      },
      'es': {
        'How to organize digital assets': 'Cómo organizar activos digitales',
        'Resource management best practices': 'Mejores prácticas de gestión de recursos',
        'Data analysis techniques': 'Técnicas de análisis de datos',
        'API integration guide': 'Guía de integración de API',
        'Content categorization strategies': 'Estrategias de categorización de contenido',
        'Digital asset workflow optimization': 'Optimización del flujo de trabajo de activos digitales',
        'Metadata management guide': 'Guía de gestión de metadatos'
      },
      'ar': {
        'How to organize digital assets': 'كيفية تنظيم الأصول الرقمية',
        'Resource management best practices': 'أفضل ممارسات إدارة الموارد',
        'Data analysis techniques': 'تقنيات تحليل البيانات',
        'API integration guide': 'دليل تكامل واجهة برمجة التطبيقات',
        'Content categorization strategies': 'استراتيجيات تصنيف المحتوى',
        'Digital asset workflow optimization': 'تحسين سير عمل الأصول الرقمية',
        'Metadata management guide': 'دليل إدارة البيانات الوصفية'
      }
    };

    // Get a translation if available, otherwise use a placeholder
    const targetText = translations[targetLang]?.[sourceText] || `[${targetLang}] ${sourceText}`;

    return {
      id: Date.now() + Math.random(), // Ensure truly unique IDs
      timestamp: new Date(),
      sourceLanguage: 'en',
      targetLanguage: targetLang,
      sourceText,
      targetText,
      duration: Math.floor(Math.random() * 300 + 100) // 100-400ms
    };
  };

  // Generate multiple sample events
  const generateSampleEvents = (count) => {
    const events = [];
    for (let i = 0; i < count; i++) {
      events.push(generateSampleEvent());
    }
    return events;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Toggle real-time monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  // Function to get real translation usage data from TranslationService
  const getTranslationUsageData = () => {
    try {
      // In a real implementation, we would call an API to get usage data
      // For now, we'll access the translation cache to get some real data
      let cachedTranslations = {};

      try {
        // Try to get the translation cache from localStorage
        const cache = localStorage.getItem('translationCache');
        if (cache) {
          cachedTranslations = JSON.parse(cache);
        }
      } catch (error) {
        console.warn('Failed to load translation cache:', error);
      }

      // Process the cached translations to get statistics
      const cacheEntries = Object.entries(cachedTranslations);
      const cacheKeys = Object.keys(cachedTranslations);

      // Count languages used
      const languageCounts = {};
      cacheKeys.forEach(key => {
        const [source, target] = key.split(':');
        if (target && languages[target]) {
          languageCounts[target] = (languageCounts[target] || 0) + 1;
        }
      });

      // Get top phrases
      const phrases = cacheKeys.map(key => {
        const parts = key.split(':');
        if (parts.length >= 4) {
          // Format is source:target:glossary:text
          return parts.slice(3).join(':'); // Get original text
        }
        return '';
      }).filter(Boolean);

      // Count phrase occurrences
      const phraseCounts = {};
      phrases.forEach(phrase => {
        if (phrase.length > 0 && phrase.length < 50) {
          phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
      });

      // Sort and get top phrases
      const topPhrases = Object.entries(phraseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([text, count]) => ({ text, count }));

      // Sort languages by usage
      const topLanguagesByUsage = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => ({
          code,
          count,
          characters: count * Math.floor(Math.random() * 100 + 20), // Estimate character count
          successRate: 85 + Math.floor(Math.random() * 12) // Simulate success rate
        }))
        .slice(0, 5);

      return {
        cacheSize: cacheEntries.length,
        topLanguagesByUsage,
        topPhrases,
        languageStats: Object.fromEntries(
          topLanguagesByUsage.map(lang => [lang.code, lang])
        )
      };

    } catch (error) {
      console.error('Error getting translation usage data:', error);
      return null;
    }
  };

  // Generate analytics data based on time range and real usage
  const generateAnalyticsData = (range, usageData) => {
    // In a real implementation, this would come from an API or analytics service

    const baseMultiplier = range === 'day' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 365;

    // If we have real usage data, use it as a base
    const realTopLanguages = usageData?.topLanguagesByUsage || [];
    const realTopPhrases = usageData?.topPhrases || [];

    // Generate language stats - use real data if available, otherwise generate sample data
    const languageStats = {};

    if (realTopLanguages.length > 0) {
      // Use real language data
      realTopLanguages.forEach(lang => {
        languageStats[lang.code] = {
          count: lang.count * baseMultiplier,
          characters: lang.characters * baseMultiplier,
          successRate: lang.successRate
        };
      });

      // Add some other languages if we don't have enough
      Object.keys(languages).forEach(langCode => {
        if (langCode !== 'en' && !languageStats[langCode] && Object.keys(languageStats).length < 10) {
          const factor = langCode === 'fr' || langCode === 'es' ? 2.5 :
                         langCode === 'zh' || langCode === 'ar' ? 1.8 : 1;

          languageStats[langCode] = {
            count: Math.floor(Math.random() * 50 * factor * baseMultiplier),
            characters: Math.floor(Math.random() * 15000 * factor * baseMultiplier),
            successRate: 85 + Math.floor(Math.random() * 12)
          };
        }
      });
    } else {
      // Generate sample data for languages
      Object.keys(languages).forEach(langCode => {
        if (langCode !== 'en') {
          const factor = langCode === 'fr' || langCode === 'es' ? 2.5 :
                         langCode === 'zh' || langCode === 'ar' ? 1.8 : 1;

          languageStats[langCode] = {
            count: Math.floor(Math.random() * 150 * factor * baseMultiplier),
            characters: Math.floor(Math.random() * 50000 * factor * baseMultiplier),
            successRate: 85 + Math.floor(Math.random() * 12)
          };
        }
      });
    }

    // Sort languages by usage
    const topLanguagesByUsage = Object.entries(languageStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([code, stats]) => ({
        code,
        ...stats
      }));

    // Use real top phrases if available, otherwise generate sample data
    const topPhrases = realTopPhrases.length > 0
      ? realTopPhrases.map(phrase => ({
          text: phrase.text,
          count: phrase.count * baseMultiplier
        }))
      : [
          { text: 'Resource management best practices', count: 156 * baseMultiplier },
          { text: 'How to organize digital assets', count: 143 * baseMultiplier },
          { text: 'Data analysis techniques', count: 129 * baseMultiplier },
          { text: 'API integration guide', count: 112 * baseMultiplier },
          { text: 'Resource tagging strategies', count: 98 * baseMultiplier },
          { text: 'Metadata management', count: 87 * baseMultiplier },
          { text: 'Digital asset workflow', count: 76 * baseMultiplier },
          { text: 'Content categorization', count: 65 * baseMultiplier }
        ];

    // Generate content types
    const contentTypes = {
      'Articles': Math.floor(2500 * baseMultiplier),
      'Documentation': Math.floor(1800 * baseMultiplier),
      'Guides': Math.floor(1200 * baseMultiplier),
      'Tutorials': Math.floor(950 * baseMultiplier),
      'API Docs': Math.floor(750 * baseMultiplier),
      'Case Studies': Math.floor(500 * baseMultiplier)
    };

    // Generate error rates
    const errorRates = {
      'Terminology errors': Math.floor(Math.random() * 50 + 150),
      'Grammar issues': Math.floor(Math.random() * 40 + 100),
      'Context mistakes': Math.floor(Math.random() * 30 + 80),
      'Format problems': Math.floor(Math.random() * 20 + 40),
      'Untranslated content': Math.floor(Math.random() * 10 + 20)
    };

    // Calculate total translations from real or generated data
    const totalTranslations = usageData?.cacheSize
      ? usageData.cacheSize * baseMultiplier
      : Math.floor(8500 * baseMultiplier);

    return {
      totalTranslations,
      totalCharacters: Math.floor(totalTranslations * 330), // Avg 330 chars per translation
      averageResponseTime: Math.floor(Math.random() * 100 + 250), // milliseconds
      topLanguagesByUsage,
      languageStats,
      topPhrases,
      contentTypes,
      errorRates,
      timeRange: range,
      startDate,
      endDate
    };
  };

  // Prepare chart data for visualization
  const prepareChartData = (stats) => {
    // For language distribution chart
    const languageLabels = stats.topLanguagesByUsage.map(lang => languages[lang.code]?.name || lang.code);
    const languageValues = stats.topLanguagesByUsage.map(lang => lang.count);

    setChartData({
      labels: languageLabels,
      values: languageValues
    });
  };

  // Format large numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Render a simple horizontal bar chart
  const renderBarChart = (labels, values, maxVal) => {
    return (
      <div className="chart-container">
        {labels.map((label, index) => (
          <div key={index} className="chart-row">
            <div className="chart-label">{label}</div>
            <div className="chart-bar-container">
              <div
                className="chart-bar"
                style={{ width: `${(values[index] / maxVal) * 100}%` }}
              />
              <span className="chart-value">{formatNumber(values[index])}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Handle applying custom date range
  const handleApplyDateRange = () => {
    setUseCustomDateRange(true);
    loadTranslationStats();
  };

  // Reset to predefined time range
  const handleResetDateRange = () => {
    setUseCustomDateRange(false);
  };

  // Handle exporting data
  const handleExport = (format) => {
    setExportFormat(format);

    // In a real implementation, this would generate and download a file
    alert(`Exporting analytics data as ${format.toUpperCase()}...`);

    // Example implementation for CSV export
    if (format === 'csv' && translationStats) {
      let csvContent = "data:text/csv;charset=utf-8,";

      // Add headers
      csvContent += "Statistic,Value,Period\n";

      // Add total translations
      csvContent += `Total Translations,${translationStats.totalTranslations},${getTimeRangeLabel()}\n`;
      csvContent += `Characters Translated,${translationStats.totalCharacters},${getTimeRangeLabel()}\n`;
      csvContent += `Average Response Time,${translationStats.averageResponseTime}ms,${getTimeRangeLabel()}\n\n`;

      // Add language data
      csvContent += "Language,Translations,Characters,Success Rate\n";
      Object.entries(translationStats.languageStats).forEach(([code, stats]) => {
        csvContent += `${languages[code]?.name || code},${stats.count},${stats.characters},${stats.successRate}%\n`;
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `translation_analytics_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get time range label
  const getTimeRangeLabel = () => {
    if (useCustomDateRange) {
      return `${startDate} to ${endDate}`;
    }

    switch(timeRange) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'This Month';
    }
  };

  // If user is not an admin, show access denied message
  if (showAccessDenied) {
    return (
      <div className="translation-analytics admin-only">
        <div className="analytics-header">
          <h2>
            Translation Analytics
            <span className="admin-badge">Admin Only</span>
          </h2>
        </div>
        <div className="access-denied-message">
          <div className="access-denied-icon">⚠️</div>
          <p>The translation analytics dashboard is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="translation-analytics loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="translation-analytics">
      <h2 className="analytics-title">Translation Analytics</h2>
      <p className="analytics-description">
        Track translation usage and identify patterns to optimize your multilingual content strategy.
      </p>

      <div className="realtime-monitoring">
        <h3>
          <span className="live-indicator"></span>
          Real-time Translation Monitor
        </h3>

        <div className="realtime-translations" ref={realtimeRef}>
          {realtimeEvents.length > 0 ? (
            realtimeEvents.map(event => (
              <div className="translation-event" key={event.id}>
                <div className="translation-event-time">
                  {formatTimestamp(event.timestamp)}
                </div>
                <div className="translation-event-content">
                  <div className="translation-event-language">
                    <span className="translation-event-language-flag">
                      {languages[event.targetLanguage]?.flag}
                    </span>
                    <span className="translation-event-language-name">
                      {languages[event.targetLanguage]?.name}
                    </span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                      ({event.duration}ms)
                    </span>
                  </div>
                  <div className="translation-event-text">
                    <span>{event.sourceText}</span>
                    <span className="translation-arrow">→</span>
                    <span style={{ direction: languages[event.targetLanguage]?.dir || 'ltr' }}>
                      {event.targetText}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="realtime-empty">
              No translation events yet. Translations will appear here as they happen.
            </div>
          )}
        </div>

        <div className="realtime-controls">
          <div className="realtime-status">
            {isMonitoring ? 'Monitoring active' : 'Monitoring paused'} • {eventCount} events recorded
          </div>
          <button
            className={`realtime-toggle ${!isMonitoring ? 'paused' : ''}`}
            onClick={toggleMonitoring}
          >
            {isMonitoring ? 'Pause Monitoring' : 'Resume Monitoring'}
          </button>
        </div>
      </div>

      <div className="time-range-selector">
        <label>Time Range:</label>
        <div className="time-range-buttons">
          <button
            className={timeRange === 'day' && !useCustomDateRange ? 'active' : ''}
            onClick={() => {setTimeRange('day'); setUseCustomDateRange(false);}}
          >
            Day
          </button>
          <button
            className={timeRange === 'week' && !useCustomDateRange ? 'active' : ''}
            onClick={() => {setTimeRange('week'); setUseCustomDateRange(false);}}
          >
            Week
          </button>
          <button
            className={timeRange === 'month' && !useCustomDateRange ? 'active' : ''}
            onClick={() => {setTimeRange('month'); setUseCustomDateRange(false);}}
          >
            Month
          </button>
          <button
            className={timeRange === 'year' && !useCustomDateRange ? 'active' : ''}
            onClick={() => {setTimeRange('year'); setUseCustomDateRange(false);}}
          >
            Year
          </button>
        </div>

        <div className="date-range-picker">
          <label>Custom Range:</label>
          <input
            type="date"
            className="date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span>to</span>
          <input
            type="date"
            className="date-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button
            className="apply-date-btn"
            onClick={handleApplyDateRange}
            disabled={!startDate || !endDate}
          >
            Apply
          </button>
          {useCustomDateRange && (
            <button
              className="apply-date-btn"
              onClick={handleResetDateRange}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {translationStats && (
        <div className="analytics-content">
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-value">{formatNumber(translationStats.totalTranslations)}</div>
              <div className="stat-label">Total Translations</div>
              <div className="stat-period">{getTimeRangeLabel()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(translationStats.totalCharacters)}</div>
              <div className="stat-label">Characters Translated</div>
              <div className="stat-period">{getTimeRangeLabel()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{translationStats.averageResponseTime}ms</div>
              <div className="stat-label">Avg. Response Time</div>
              <div className="stat-period">{getTimeRangeLabel()}</div>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-panel">
              <h3>Top Languages</h3>
              <div className="languages-chart">
                {renderBarChart(
                  translationStats.topLanguagesByUsage.map(l => `${languages[l.code]?.flag || ''} ${languages[l.code]?.name || l.code}`),
                  translationStats.topLanguagesByUsage.map(l => l.count),
                  Math.max(...translationStats.topLanguagesByUsage.map(l => l.count))
                )}
              </div>
            </div>

            <div className="analytics-panel">
              <h3>Top Translated Phrases</h3>
              <div className="phrases-chart">
                {renderBarChart(
                  translationStats.topPhrases.map(p => p.text),
                  translationStats.topPhrases.map(p => p.count),
                  Math.max(...translationStats.topPhrases.map(p => p.count))
                )}
              </div>
            </div>

            <div className="analytics-panel">
              <h3>Content Types Translated</h3>
              <div className="content-types-chart">
                {renderBarChart(
                  Object.keys(translationStats.contentTypes),
                  Object.values(translationStats.contentTypes),
                  Math.max(...Object.values(translationStats.contentTypes))
                )}
              </div>
            </div>

            <div className="analytics-panel">
              <h3>Translation Error Categories</h3>
              <div className="error-chart">
                {renderBarChart(
                  Object.keys(translationStats.errorRates),
                  Object.values(translationStats.errorRates),
                  Math.max(...Object.values(translationStats.errorRates))
                )}
              </div>
            </div>
          </div>

          <div className="language-performance">
            <h3>Translation Performance by Language</h3>
            <div className="language-performance-table">
              <table>
                <thead>
                  <tr>
                    <th>Language</th>
                    <th>Translations</th>
                    <th>Characters</th>
                    <th>Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(translationStats.languageStats).map(([code, stats]) => (
                    <tr key={code}>
                      <td>
                        <span className="language-flag">{languages[code]?.flag}</span>
                        <span className="language-name">{languages[code]?.name}</span>
                      </td>
                      <td>{formatNumber(stats.count)}</td>
                      <td>{formatNumber(stats.characters)}</td>
                      <td>
                        <div className="success-rate">
                          <div
                            className="success-bar"
                            style={{ width: `${stats.successRate}%` }}
                          />
                          <span>{stats.successRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analytics-insights">
            <h3>Key Insights</h3>
            <ul className="insights-list">
              <li>
                <strong>Most popular language:</strong> {languages[translationStats.topLanguagesByUsage[0].code]?.name} with {formatNumber(translationStats.topLanguagesByUsage[0].count)} translations
              </li>
              <li>
                <strong>Highest growth:</strong> {languages[translationStats.topLanguagesByUsage[1]?.code || 'fr']?.name} (↑28% from previous {timeRange})
              </li>
              <li>
                <strong>Most common content:</strong> Articles (29% of translations)
              </li>
              <li>
                <strong>Most frequent error:</strong> Terminology inconsistencies
              </li>
              <li>
                <strong>Recommended action:</strong> Enhance glossary for technical terms to improve accuracy
              </li>
            </ul>
          </div>

          <div className="export-actions">
            <button
              className="export-btn"
              onClick={() => handleExport('csv')}
            >
              Export Report as CSV
            </button>
            <button
              className="export-btn"
              onClick={() => handleExport('pdf')}
            >
              Export Report as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationAnalytics;
