import React, { useState, useEffect } from 'react';
import { getAPIMetrics, getAPIPriority, setAPIPriority, resetAPIMetrics } from '../i18n/APIMonitoring';
import './APIStatsDashboard.css';

/**
 * API Statistics Dashboard
 *
 * Displays performance metrics for translation APIs and allows manual control
 * of API priority for admin purposes.
 */
const APIStatsDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [priority, setPriority] = useState([]);
  const [expandedAPI, setExpandedAPI] = useState(null);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [customPriority, setCustomPriority] = useState([]);

  // Refresh metrics on load and periodically
  useEffect(() => {
    // Initial load
    refreshData();

    // Set up periodic refresh
    const interval = setInterval(refreshData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh data from the monitoring service
  const refreshData = () => {
    setMetrics(getAPIMetrics());
    setPriority(getAPIPriority());
  };

  // Toggle expanded view for an API
  const toggleExpand = (apiName) => {
    setExpandedAPI(expandedAPI === apiName ? null : apiName);
  };

  // Start editing priority
  const startEditPriority = () => {
    setCustomPriority([...priority]);
    setIsEditingPriority(true);
  };

  // Cancel priority editing
  const cancelEditPriority = () => {
    setIsEditingPriority(false);
  };

  // Save new priority order
  const savePriorityOrder = () => {
    setAPIPriority(customPriority);
    setPriority(customPriority);
    setIsEditingPriority(false);

    // Refresh to see updated data
    setTimeout(refreshData, 100);
  };

  // Handle drag-and-drop reordering
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('index', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newIndex) => {
    const oldIndex = parseInt(e.dataTransfer.getData('index'));
    const newOrder = [...customPriority];

    // Remove from old position and insert at new position
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);

    setCustomPriority(newOrder);
  };

  // Reset metrics for a specific API
  const handleResetAPI = (apiName) => {
    if (window.confirm(`Reset statistics for ${apiName} API?`)) {
      resetAPIMetrics(apiName);
      refreshData();
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Calculate time since last failure
  const timeSinceFailure = (timestamp) => {
    if (!timestamp) return 'N/A';

    const elapsed = Date.now() - timestamp;
    const minutes = Math.floor(elapsed / 60000);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  // Render health indicator based on metrics
  const renderHealthIndicator = (apiMetrics) => {
    if (!apiMetrics) return null;

    let healthStatus = 'unknown';
    let healthLabel = 'Unknown';

    if (apiMetrics.successRate > 0.9 && apiMetrics.availability > 0.9) {
      healthStatus = 'healthy';
      healthLabel = 'Healthy';
    } else if (apiMetrics.successRate > 0.7 && apiMetrics.availability > 0.7) {
      healthStatus = 'warning';
      healthLabel = 'Degraded';
    } else if (apiMetrics.consecutiveFailures > 3 || apiMetrics.availability < 0.5) {
      healthStatus = 'critical';
      healthLabel = 'Critical';
    } else if (apiMetrics.usageCount === 0) {
      healthStatus = 'unknown';
      healthLabel = 'No Data';
    } else {
      healthStatus = 'unhealthy';
      healthLabel = 'Unhealthy';
    }

    return (
      <div className={`api-health-indicator ${healthStatus}`} title={healthLabel}>
        {healthLabel}
      </div>
    );
  };

  return (
    <div className="api-stats-dashboard">
      <header className="api-stats-header">
        <h2>Translation API Performance</h2>
        <div className="api-stats-actions">
          <button onClick={refreshData} className="api-stats-button refresh">
            Refresh
          </button>
          {isEditingPriority ? (
            <>
              <button onClick={savePriorityOrder} className="api-stats-button save">
                Save Order
              </button>
              <button onClick={cancelEditPriority} className="api-stats-button cancel">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={startEditPriority} className="api-stats-button edit">
              Edit Priority
            </button>
          )}
        </div>
      </header>

      <div className="api-priority-order">
        <h3>Current API Priority Order</h3>
        <ol className="priority-list">
          {priority.map((apiName, index) => (
            <li key={apiName}>
              <strong>{apiName}</strong>
              {metrics[apiName] && renderHealthIndicator(metrics[apiName])}
            </li>
          ))}
        </ol>
      </div>

      {isEditingPriority && (
        <div className="api-priority-editor">
          <h3>Edit Priority Order</h3>
          <p className="instructions">Drag and drop APIs to reorder them. APIs at the top will be tried first.</p>
          <ul className="priority-editor-list">
            {customPriority.map((apiName, index) => (
              <li
                key={apiName}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="draggable-item"
              >
                <span className="drag-handle">☰</span>
                <span className="api-name">{apiName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="api-metrics-grid">
        {Object.entries(metrics).map(([apiName, apiMetrics]) => (
          <div
            key={apiName}
            className={`api-metrics-card ${expandedAPI === apiName ? 'expanded' : ''}`}
            onClick={() => toggleExpand(apiName)}
          >
            <div className="api-card-header">
              <h4>{apiName}</h4>
              {renderHealthIndicator(apiMetrics)}
            </div>

            <div className="api-metrics-summary">
              <div className="metric">
                <span className="metric-label">Success Rate:</span>
                <span className="metric-value">{(apiMetrics.successRate * 100).toFixed(1)}%</span>
              </div>

              <div className="metric">
                <span className="metric-label">Response Time:</span>
                <span className="metric-value">{apiMetrics.avgResponseTime.toFixed(0)} ms</span>
              </div>

              <div className="metric">
                <span className="metric-label">Usage:</span>
                <span className="metric-value">{apiMetrics.usageCount} calls</span>
              </div>
            </div>

            {expandedAPI === apiName && (
              <div className="api-metrics-details">
                <div className="metric-group">
                  <div className="metric">
                    <span className="metric-label">Availability:</span>
                    <span className="metric-value">{(apiMetrics.availability * 100).toFixed(1)}%</span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Error Count:</span>
                    <span className="metric-value">{apiMetrics.errorCount}</span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Consecutive Failures:</span>
                    <span className="metric-value">{apiMetrics.consecutiveFailures}</span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Last Failure:</span>
                    <span className="metric-value">
                      {apiMetrics.lastFailure ? timeSinceFailure(apiMetrics.lastFailure) : 'Never'}
                    </span>
                  </div>
                </div>

                <button
                  className="api-stats-button reset"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetAPI(apiName);
                  }}
                >
                  Reset Metrics
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default APIStatsDashboard;
