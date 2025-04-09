import React, { useState, useEffect } from 'react';
import errorHandler from '../errorHandler';
import './ErrorDiagnostic.css';

/**
 * ErrorDiagnostic Component
 *
 * Tool to diagnose 502 Bad Gateway and other errors, show system health,
 * and provide options to recover from errors.
 * Only visible to admin users.
 */
const ErrorDiagnostic = ({ isAdmin = false }) => {
  const [networkStatus, setNetworkStatus] = useState('Checking...');
  const [errorLogs, setErrorLogs] = useState([]);
  const [systemInfo, setSystemInfo] = useState({});
  const [liveStats, setLiveStats] = useState({
    memoryUsage: 'Unknown',
    activeRequests: 0,
    responseTime: 'Unknown',
  });
  const [restartStatus, setRestartStatus] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAccessDenied, setShowAccessDenied] = useState(!isAdmin);

  useEffect(() => {
    // Only load data if user is an admin
    if (isAdmin) {
      setShowAccessDenied(false);

      // Load error logs
      const logs = errorHandler.getErrorLogs();
      setErrorLogs(logs);

      // Check network status
      checkNetworkStatus();

      // Collect system information
      collectSystemInfo();

      // Set up interval for live stats
      const interval = setInterval(() => {
        updateLiveStats();
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setShowAccessDenied(true);
    }
  }, [isAdmin]);

  const checkNetworkStatus = async () => {
    try {
      const isConnected = await errorHandler.checkNetworkConnectivity();
      setNetworkStatus(isConnected ? 'Connected' : 'Disconnected');
    } catch (error) {
      setNetworkStatus('Error checking connection');
    }
  };

  const collectSystemInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      referrer: document.referrer || 'None',
      timestamp: new Date().toISOString()
    };

    // Performance timings if available
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      info.pageLoad = `${timing.loadEventEnd - timing.navigationStart}ms`;
      info.domLoad = `${timing.domComplete - timing.domInteractive}ms`;
      info.networkLatency = `${timing.responseEnd - timing.fetchStart}ms`;
    }

    setSystemInfo(info);
  };

  const updateLiveStats = () => {
    // In a real app, you might get this from backend monitoring
    // For now, simulate random values
    setLiveStats({
      memoryUsage: `${Math.floor(Math.random() * 500 + 100)}MB`,
      activeRequests: Math.floor(Math.random() * 10),
      responseTime: `${Math.floor(Math.random() * 200 + 50)}ms`,
    });
  };

  const clearLogs = () => {
    errorHandler.clearErrorLogs();
    setErrorLogs([]);
    setRestartStatus('Logs cleared successfully.');
  };

  const restartApp = () => {
    setRestartStatus('Restarting application...');
    // Clear caches
    try {
      localStorage.removeItem('translationCache');
      sessionStorage.clear();

      if ('caches' in window) {
        // Clear fetch caches
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }

      // Wait a bit and reload the page
      setTimeout(() => {
        window.location.reload(true);
      }, 1500);
    } catch (error) {
      setRestartStatus('Error restarting: ' + error.message);
    }
  };

  const checkEndpoints = async () => {
    setRestartStatus('Checking endpoints...');

    try {
      // Test multiple endpoints to identify issues
      const tests = [
        { name: 'Static Resource', url: '/favicon.ico', method: 'HEAD' },
        { name: 'Main Page', url: '/', method: 'GET' },
        { name: 'Translation Cache', url: '/api/translations', method: 'HEAD' }
      ];

      const results = await Promise.all(tests.map(async test => {
        try {
          const start = Date.now();
          const response = await fetch(test.url, {
            method: test.method,
            cache: 'no-cache'
          });
          const time = Date.now() - start;

          return {
            name: test.name,
            status: response.status,
            ok: response.ok,
            time: `${time}ms`
          };
        } catch (error) {
          return {
            name: test.name,
            status: 'Error',
            ok: false,
            error: error.message
          };
        }
      }));

      setRestartStatus(`Endpoint check complete: ${results.filter(r => r.ok).length}/${tests.length} successful`);
      console.table(results);
    } catch (error) {
      setRestartStatus('Error checking endpoints: ' + error.message);
    }
  };

  // If user is not an admin, show access denied message
  if (showAccessDenied) {
    return (
      <div className="error-diagnostic admin-only">
        <div className="diagnostic-header">
          <h2>
            System Diagnostic
            <span className="admin-badge">Admin Only</span>
          </h2>
        </div>
        <div className="access-denied-message">
          <div className="access-denied-icon">⚠️</div>
          <p>This component is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="error-diagnostic">
      <div className="diagnostic-header">
        <h2>
          System Diagnostic
          <button
            className="toggle-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </h2>
        <div className="system-status">
          <span className={`status-indicator ${networkStatus === 'Connected' ? 'connected' : 'error'}`}></span>
          <span>Network: {networkStatus}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="diagnostic-content">
          <div className="diagnostic-section">
            <h3>System Information</h3>
            <div className="info-grid">
              {Object.entries(systemInfo).map(([key, value]) => (
                <div className="info-item" key={key}>
                  <span className="info-label">{key}:</span>
                  <span className="info-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="diagnostic-section">
            <h3>Live Statistics</h3>
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-label">Memory Usage:</span>
                <span className="stat-value">{liveStats.memoryUsage}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Requests:</span>
                <span className="stat-value">{liveStats.activeRequests}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Response Time:</span>
                <span className="stat-value">{liveStats.responseTime}</span>
              </div>
            </div>
          </div>

          <div className="diagnostic-section">
            <h3>Error Logs ({errorLogs.length})</h3>
            {errorLogs.length === 0 ? (
              <p>No errors logged</p>
            ) : (
              <div className="error-log-container">
                {errorLogs.slice(0, 5).map((log, index) => (
                  <div
                    className={`error-log ${log.message && log.message.includes('translation') ? 'translation-error' : ''}`}
                    key={index}
                  >
                    <div className="error-timestamp">{log.timestamp}</div>
                    <div className="error-message">{log.message}</div>
                    {log.statusCode && (
                      <div className="error-status">Status: {log.statusCode}</div>
                    )}
                    {log.component && (
                      <div className="error-component">Component: {log.component}</div>
                    )}
                    {log.action && (
                      <div className="error-action">Action: {log.action}</div>
                    )}
                  </div>
                ))}
                {errorLogs.length > 5 && (
                  <div className="more-errors">
                    + {errorLogs.length - 5} more errors
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="diagnostic-actions">
            <button onClick={checkNetworkStatus}>
              Check Network
            </button>
            <button onClick={checkEndpoints}>
              Test Endpoints
            </button>
            <button onClick={clearLogs}>
              Clear Error Logs
            </button>
            <button onClick={restartApp} className="restart-button">
              Restart Application
            </button>
          </div>

          {restartStatus && (
            <div className="restart-status">
              {restartStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorDiagnostic;
