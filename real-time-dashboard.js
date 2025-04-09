import React, { useState, useEffect, useRef } from 'react';
import {
  experimentManager,
  EXPERIMENT_TYPES
} from '../../utils/ml/abTesting';

const RealTimeDashboard = () => {
  const [activeExperiments, setActiveExperiments] = useState({});
  const [experimentResults, setExperimentResults] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const timerRef = useRef(null);

  // Load experiments on component mount
  useEffect(() => {
    loadExperiments();

    // Set up polling for real-time updates
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        loadExperiments();
        setLastRefreshed(new Date());
      }, refreshInterval * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [refreshInterval, autoRefresh]);

  // Load active experiments and their results
  const loadExperiments = () => {
    const experiments = experimentManager.getAllExperiments();
    setActiveExperiments(experiments);

    // Get results for each experiment
    const results = {};
    Object.keys(experiments).forEach(experimentId => {
      results[experimentId] = experimentManager.getExperimentResults(experimentId);
    });

    setExperimentResults(results);

    // Check for significant changes since last refresh
    checkForSignificantChanges(results);
  };

  // Manually refresh data
  const handleRefresh = () => {
    loadExperiments();
    setLastRefreshed(new Date());
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    const newState = !autoRefresh;
    setAutoRefresh(newState);

    if (newState) {
      timerRef.current = setInterval(() => {
        loadExperiments();
        setLastRefreshed(new Date());
      }, refreshInterval * 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Check for significant changes in experiment results
  const checkForSignificantChanges = (newResults) => {
    Object.entries(newResults).forEach(([experimentId, result]) => {
      const experiment = activeExperiments[experimentId];
      if (!experiment) return;

      // Look for newly significant variations
      if (result.significance) {
        Object.entries(result.significance).forEach(([variation, metrics]) => {
          // Check view rate significance
          if (metrics.viewRate && metrics.viewRate.significant) {
            const currentNotifications = [...notifications];
            const existingNotification = currentNotifications.find(
              n => n.experimentId === experimentId &&
                   n.variation === variation &&
                   n.metric === 'viewRate'
            );

            if (!existingNotification) {
              setNotifications(prev => [
                ...prev,
                {
                  id: `${experimentId}-${variation}-viewRate-${Date.now()}`,
                  experimentId,
                  experimentName: experiment.name,
                  variation,
                  metric: 'viewRate',
                  significant: true,
                  confidenceLevel: metrics.viewRate.confidenceLevel,
                  message: `${variation} achieved statistical significance for view rate`,
                  timestamp: new Date().toISOString()
                }
              ]);
            }
          }

          // Check click rate significance
          if (metrics.clickRate && metrics.clickRate.significant) {
            const existingNotification = notifications.find(
              n => n.experimentId === experimentId &&
                   n.variation === variation &&
                   n.metric === 'clickRate'
            );

            if (!existingNotification) {
              setNotifications(prev => [
                ...prev,
                {
                  id: `${experimentId}-${variation}-clickRate-${Date.now()}`,
                  experimentId,
                  experimentName: experiment.name,
                  variation,
                  metric: 'clickRate',
                  significant: true,
                  confidenceLevel: metrics.clickRate.confidenceLevel,
                  message: `${variation} achieved statistical significance for click rate`,
                  timestamp: new Date().toISOString()
                }
              ]);
            }
          }
        });
      }
    });
  };

  // Dismiss a notification
  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Format metrics for display
  const formatMetric = (value) => {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'number') {
      if (Math.abs(value) < 0.01) return '0';
      return value.toFixed(2);
    }
    return value.toString();
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '-';
    return `${(value * 100).toFixed(2)}%`;
  };

  // Helper function to get experiment type label
  const getExperimentTypeLabel = (type) => {
    switch (type) {
      case EXPERIMENT_TYPES.EXPERT_MATCHING:
        return 'Expert Matching';
      case EXPERIMENT_TYPES.EXPERT_PRESENTATION:
        return 'Expert Presentation';
      case EXPERIMENT_TYPES.GEOGRAPHIC_MATCHING:
        return 'Geographic Matching';
      case EXPERIMENT_TYPES.CONTENT:
        return 'Content';
      case EXPERIMENT_TYPES.TIMING:
        return 'Timing';
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Real-Time Experiment Dashboard</h1>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Auto-refresh:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1 mr-2"
              disabled={!autoRefresh}
            >
              <option value="5">5s</option>
              <option value="10">10s</option>
              <option value="30">30s</option>
              <option value="60">1m</option>
            </select>

            <button
              onClick={toggleAutoRefresh}
              className={`px-3 py-1 text-sm rounded ${
                autoRefresh
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Notification area */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.map(notification => (
            <div key={notification.id} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-yellow-800">{notification.experimentName}</h3>
                <p className="text-sm text-yellow-700">{notification.message} ({notification.confidenceLevel}% confidence)</p>
                <span className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</span>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`mr-4 py-2 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`mr-4 py-2 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'expert-matching'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('expert-matching')}
          >
            Expert Matching
          </button>
          <button
            className={`mr-4 py-2 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'geographic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('geographic')}
          >
            Geographic
          </button>
          <button
            className={`mr-4 py-2 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
        </nav>
      </div>

      {/* Overview tab content */}
      {activeTab === 'overview' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">All Active Experiments</h2>

          {Object.keys(activeExperiments).length === 0 ? (
            <p className="text-gray-500">No active experiments found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(activeExperiments).map(([experimentId, experiment]) => (
                <div key={experimentId} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{experiment.name}</h3>
                      <p className="text-sm text-gray-600">{getExperimentTypeLabel(experiment.type)}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      experiment.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {experiment.status}
                    </span>
                  </div>

                  {experimentResults[experimentId] && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Quick Stats</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">Impressions</span>
                          <div className="font-medium">
                            {Object.values(experimentResults[experimentId])
                              .filter(v => typeof v === 'object' && v !== null && 'impressions' in v)
                              .reduce((sum, v) => sum + v.impressions, 0)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">Conversions</span>
                          <div className="font-medium">
                            {Object.values(experimentResults[experimentId])
                              .filter(v => typeof v === 'object' && v !== null && 'conversions' in v)
                              .reduce((sum, v) => sum + v.conversions, 0)}
                          </div>
                        </div>
                      </div>

                      {/* Show any significant variations */}
                      {experimentResults[experimentId].significance && (
                        <div className="mt-3">
                          {Object.entries(experimentResults[experimentId].significance).map(([variation, metrics]) => {
                            const hasSignificance =
                              (metrics.viewRate && metrics.viewRate.significant) ||
                              (metrics.clickRate && metrics.clickRate.significant) ||
                              (metrics.actionRate && metrics.actionRate.significant) ||
                              (metrics.conversionRate && metrics.conversionRate.significant);

                            if (hasSignificance) {
                              return (
                                <div key={variation} className="mt-2 bg-blue-50 p-2 rounded text-xs">
                                  <span className="font-medium">{variation}</span> has statistical significance
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expert Matching tab content */}
      {activeTab === 'expert-matching' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Expert Matching Experiments</h2>

          {Object.entries(activeExperiments)
            .filter(([_, exp]) => exp.type === EXPERIMENT_TYPES.EXPERT_MATCHING)
            .length === 0 ? (
            <p className="text-gray-500">No active expert matching experiments found.</p>
          ) : (
            <div className="space-y-8">
              {Object.entries(activeExperiments)
                .filter(([_, exp]) => exp.type === EXPERIMENT_TYPES.EXPERT_MATCHING)
                .map(([experimentId, experiment]) => {
                  const results = experimentResults[experimentId];
                  if (!results) return null;

                  return (
                    <div key={experimentId} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-medium text-lg">{experiment.name}</h3>
                        <p className="text-sm text-gray-600">{experiment.description}</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Variation
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Impressions
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Click Rate
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action Rate
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Lift
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Significance
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(results)
                              .filter(([key, _]) => (
                                key !== 'lift' && key !== 'significance' && typeof results[key] === 'object'
                              ))
                              .map(([variation, metrics]) => {
                                const lift = variation !== 'control' ?
                                  results.lift && results.lift[variation] : null;
                                const significance = variation !== 'control' ?
                                  results.significance && results.significance[variation] : null;

                                return (
                                  <tr key={variation}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {variation}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {metrics.impressions}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatPercentage(metrics.clickRate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatPercentage(metrics.actionRate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {variation === 'control' ? '-' : (
                                        <span className={
                                          lift && lift.clickRate > 0 ? 'text-green-600' :
                                          lift && lift.clickRate < 0 ? 'text-red-600' : ''
                                        }>
                                          {lift ? `${lift.clickRate > 0 ? '+' : ''}${formatMetric(lift.clickRate)}%` : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {variation === 'control' ? '-' : (
                                        significance && significance.clickRate ? (
                                          significance.clickRate.significant ? (
                                            <span className="text-green-600">
                                              {significance.clickRate.confidenceLevel}% confidence
                                            </span>
                                          ) : (
                                            <span className="text-gray-500">Not significant</span>
                                          )
                                        ) : '-'
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Geographic tab content */}
      {activeTab === 'geographic' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Geographic Matching Experiments</h2>

          {Object.entries(activeExperiments)
            .filter(([_, exp]) => exp.type === EXPERIMENT_TYPES.GEOGRAPHIC_MATCHING)
            .length === 0 ? (
            <p className="text-gray-500">No active geographic matching experiments found.</p>
          ) : (
            <div className="space-y-8">
              {Object.entries(activeExperiments)
                .filter(([_, exp]) => exp.type === EXPERIMENT_TYPES.GEOGRAPHIC_MATCHING)
                .map(([experimentId, experiment]) => {
                  const results = experimentResults[experimentId];
                  if (!results) return null;

                  return (
                    <div key={experimentId} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-medium text-lg">{experiment.name}</h3>
                        <p className="text-sm text-gray-600">{experiment.description}</p>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-sm mb-3">Performance by Variation</h4>
                          <div className="space-y-4">
                            {Object.entries(results)
                              .filter(([key, _]) => (
                                key !== 'lift' && key !== 'significance' && typeof results[key] === 'object'
                              ))
                              .map(([variation, metrics]) => (
                                <div key={variation} className="bg-gray-50 p-3 rounded">
                                  <h5 className="font-medium text-sm mb-2">{variation}</h5>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">Impressions:</span>
                                      <span className="ml-1 font-medium">{metrics.impressions}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Clicks:</span>
                                      <span className="ml-1 font-medium">{metrics.clicks}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Actions:</span>
                                      <span className="ml-1 font-medium">{metrics.actions}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Click Rate:</span>
                                      <span className="ml-1 font-medium">{formatPercentage(metrics.clickRate)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-3">Lift vs Control</h4>
                          <div className="space-y-4">
                            {Object.entries(results.lift || {}).map(([variation, liftValues]) => (
                              <div key={variation} className="bg-gray-50 p-3 rounded">
                                <h5 className="font-medium text-sm mb-2">{variation}</h5>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">View Rate Lift:</span>
                                    <span className={
                                      liftValues.viewRate > 0 ? 'text-green-600 font-medium' :
                                      liftValues.viewRate < 0 ? 'text-red-600 font-medium' : ''
                                    }>
                                      {liftValues.viewRate > 0 ? '+' : ''}{formatMetric(liftValues.viewRate)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Click Rate Lift:</span>
                                    <span className={
                                      liftValues.clickRate > 0 ? 'text-green-600 font-medium' :
                                      liftValues.clickRate < 0 ? 'text-red-600 font-medium' : ''
                                    }>
                                      {liftValues.clickRate > 0 ? '+' : ''}{formatMetric(liftValues.clickRate)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Action Rate Lift:</span>
                                    <span className={
                                      liftValues.actionRate > 0 ? 'text-green-600 font-medium' :
                                      liftValues.actionRate < 0 ? 'text-red-600 font-medium' : ''
                                    }>
                                      {liftValues.actionRate > 0 ? '+' : ''}{formatMetric(liftValues.actionRate)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Notifications tab content */}
      {activeTab === 'notifications' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Experiment Notifications</h2>

          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications available.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div key={notification.id} className="bg-white border rounded-lg shadow-sm p-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{notification.experimentName}</h3>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mt-1 text-sm">{notification.message}</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      {notification.confidenceLevel}% confidence
                    </span>
                    <span className="ml-2">{new Date(notification.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeDashboard;
