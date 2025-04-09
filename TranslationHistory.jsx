import React, { useState, useEffect } from 'react';
import { getTranslationHistory, clearTranslationHistory, LANGUAGES } from '../i18n/TranslationService';
import './TranslationHistory.css';

/**
 * TranslationHistory Component
 *
 * Displays a history of past translations with filtering and sorting options.
 * Allows users to reuse past translations.
 */
const TranslationHistory = ({ onUseTranslation, onClose }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    searchTerm: '',
    sourceLang: '',
    targetLang: '',
    confidenceLevel: '',
    dateRange: 'all'
  });
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Load translation history
  useEffect(() => {
    setLoading(true);
    const historyData = getTranslationHistory();
    setHistory(historyData);
    setFilteredHistory(historyData);
    setLoading(false);
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...history];

    // Apply search term filter
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.sourceText.toLowerCase().includes(searchLower) ||
        (entry.result.text && entry.result.text.toLowerCase().includes(searchLower))
      );
    }

    // Apply language filters
    if (filter.sourceLang) {
      filtered = filtered.filter(entry => entry.sourceLanguage === filter.sourceLang);
    }

    if (filter.targetLang) {
      filtered = filtered.filter(entry => entry.targetLanguage === filter.targetLang);
    }

    // Apply confidence level filter
    if (filter.confidenceLevel) {
      filtered = filtered.filter(entry =>
        entry.confidence === filter.confidenceLevel ||
        entry.result.confidence === filter.confidenceLevel
      );
    }

    // Apply date range filter
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filter.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }

      filtered = filtered.filter(entry => new Date(entry.timestamp) >= cutoffDate);
    }

    // Apply sorting
    switch (sortOption) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case 'sourceLang':
        filtered.sort((a, b) => a.sourceLanguage.localeCompare(b.sourceLanguage));
        break;
      case 'targetLang':
        filtered.sort((a, b) => a.targetLanguage.localeCompare(b.targetLanguage));
        break;
      default:
        break;
    }

    setFilteredHistory(filtered);
    setPage(1); // Reset to first page when filters change
  }, [history, filter, sortOption]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  // Handle clear history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all translation history? This cannot be undone.')) {
      clearTranslationHistory();
      setHistory([]);
      setFilteredHistory([]);
    }
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredHistory.slice(startIndex, endIndex);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Create pagination controls
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="translation-history">
      <div className="history-header">
        <h2>Translation History</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="history-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search in translations..."
            value={filter.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>

        <div className="filters">
          <div className="filter-item">
            <label>Source Language</label>
            <select
              value={filter.sourceLang}
              onChange={(e) => handleFilterChange('sourceLang', e.target.value)}
            >
              <option value="">All</option>
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={`source-${code}`} value={code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Target Language</label>
            <select
              value={filter.targetLang}
              onChange={(e) => handleFilterChange('targetLang', e.target.value)}
            >
              <option value="">All</option>
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={`target-${code}`} value={code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Date Range</label>
            <select
              value={filter.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Sort By</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="sourceLang">Source Language</option>
              <option value="targetLang">Target Language</option>
            </select>
          </div>
        </div>

        <button
          className="clear-history-btn"
          onClick={handleClearHistory}
          disabled={history.length === 0}
        >
          Clear History
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading translation history...</div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-history">
          {history.length === 0
            ? 'No translation history found. Start translating to build your history.'
            : 'No translations match your current filters.'}
        </div>
      ) : (
        <>
          <div className="history-items">
            {getCurrentPageItems().map((item) => (
              <div className="history-item" key={item.id}>
                <div className="history-item-header">
                  <div className="language-info">
                    <span className="source-lang">
                      {LANGUAGES[item.sourceLanguage]?.flag || '🌐'} {LANGUAGES[item.sourceLanguage]?.name || item.sourceLanguage}
                    </span>
                    <span className="direction-arrow">→</span>
                    <span className="target-lang">
                      {LANGUAGES[item.targetLanguage]?.flag || '🌐'} {LANGUAGES[item.targetLanguage]?.name || item.targetLanguage}
                    </span>
                  </div>
                  <div className="timestamp">
                    {formatDate(item.timestamp)}
                  </div>
                </div>

                <div className="translation-content">
                  <div className="source-text">{item.sourceText}</div>
                  <div className="translation-arrow">↓</div>
                  <div className="translated-text">{item.result.text}</div>
                </div>

                <div className="history-item-footer">
                  <div className="translation-meta">
                    {item.wasFallback && <span className="meta-tag fallback">Fallback</span>}
                    {item.fromMemory && <span className="meta-tag memory">From Memory</span>}
                    {item.offlineMode && <span className="meta-tag offline">Offline</span>}
                    <span className={`meta-tag confidence-${(item.result.confidence || item.confidence || 'unknown').toLowerCase()}`}>
                      {(item.result.confidence || item.confidence || 'Unknown').replace(/^\w/, c => c.toUpperCase())} Confidence
                    </span>
                  </div>

                  <button
                    className="use-translation-btn"
                    onClick={() => onUseTranslation(item)}
                  >
                    Use This Translation
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                &laquo;
              </button>

              {pageNumbers.map(num => (
                <button
                  key={num}
                  className={`page-btn ${page === num ? 'active' : ''}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}

              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TranslationHistory;
