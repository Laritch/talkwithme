import React, { useState, useEffect, useRef } from 'react';
import {
  experimentManager,
  EXPERIMENT_TYPES,
  VARIATION_TYPES
} from '../../utils/ml/abTesting';

// Chart visualization component (simplified for demonstration)
const ExperimentChart = ({ data, metric }) => {
  // In a real application, this would use a charting library like Chart.js or D3
  // For simplicity, we're using a basic visualization

  if (!data || !data.variations || Object.keys(data.variations).length === 0) {
    return <div className="text-gray-500 text-center py-8">No data available for visualization</div>;
  }

  const getBarWidth = (value, maxValue) => {
    if (!value || !maxValue) return 0;
    return Math.max(5, (value / maxValue) * 100);
  };

  const getMetricValue = (variation, metricName) => {
    if (!variation || !metricName) return 0;

    switch (metricName) {
      case 'clickRate':
        return variation.clickRate || 0;
      case 'actionRate':
        return variation.actionRate || 0;
      case 'conversionRate':
        return variation.conversionRate || 0;
      case 'impressions':
        return variation.impressions || 0;
      default:
        return 0;
    }
  };

  const maxValue = Math.max(
    ...Object.values(data.variations).map(v => getMetricValue(v, metric))
  );

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-3">
        {metric === 'clickRate' ? 'Click Rate' :
         metric === 'actionRate' ? 'Action Rate' :
         metric === 'conversionRate' ? 'Conversion Rate' : 'Impressions'} by Variation
      </h4>

      <div className="space-y-4">
        {Object.entries(data.variations).map(([variation, metrics]) => {
          const value = getMetricValue(metrics, metric);
          const barWidth = getBarWidth(value, maxValue);

          const barColor =
            variation === 'control' ? 'bg-gray-500' :
            variation === 'treatment' ? 'bg-blue-500' :
            variation === 'treatment_1' ? 'bg-green-500' :
            variation === 'treatment_2' ? 'bg-purple-500' : 'bg-indigo-500';

          return (
            <div key={variation} className="relative">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium w-24">{variation}</span>
                <div className="flex-grow bg-gray-200 rounded-full h-4">
                  <div
                    className={`${barColor} h-4 rounded-full`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {(metric === 'clickRate' || metric === 'actionRate' || metric === 'conversionRate')
                    ? `${(value * 100).toFixed(2)}%`
                    : value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main component
const RealTimeABTestingDashboard = () => {
  // State management
  const [activeExperiments, setActiveExperiments] = useState({});
  const [experimentResults, setExperimentResults] = useState({});
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [realTimeData, setRealTimeData] = useState({});
  const [significanceThreshold, setSignificanceThreshold] = useState(95); // 95% confidence level
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

      // Update selected experiment if needed
      if (selectedExperiment === experimentId) {
        updateRealTimeData(experimentId, results[experimentId]);
      }
    });

    setExperimentResults(results);

    // Check for significant changes since last refresh
    checkForSignificantChanges(results);
  };

  // Update real-time data for the selected experiment
  const updateRealTimeData = (experimentId, results) => {
    if (!results) return;

    // Extract metrics for real-time display
    const experimentData = {
      metrics: {},
      variations: {},
      significance: results.significance || {}
    };

    // Process each variation's data
    Object.entries(results).forEach(([key, value]) => {
      if (key !== 'lift' && key !== 'significance' && typeof value === 'object') {
        experimentData.variations[key] = value;
      }
    });

    // Calculate aggregated metrics
    experimentData.metrics = {
      totalImpressions: Object.values(experimentData.variations).reduce((sum, v) => sum + v.impressions, 0),
      totalClicks: Object.values(experimentData.variations).reduce((sum, v) => sum + v.clicks, 0),
      totalActions: Object.values(experimentData.variations).reduce((sum, v) => sum + v.actions, 0),
      totalConversions: Object.values(experimentData.variations).reduce((sum, v) => sum + v.conversions, 0),
      avgClickRate: Object.values(experimentData.variations).reduce((sum, v) => sum + (v.clickRate || 0), 0) /
        Object.values(experimentData.variations).length,
      avgActionRate: Object.values(experimentData.variations).reduce((sum, v) => sum + (v.actionRate || 0), 0) /
        Object.values(experimentData.variations).length
    };

    setRealTimeData(experimentData);
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
          // Check all metrics for significance
          ['viewRate', 'clickRate', 'actionRate', 'conversionRate'].forEach(metricName => {
            if (metrics[metricName] &&
                metrics[metricName].significant &&
                metrics[metricName].confidenceLevel >= significanceThreshold) {

              // Check if we already have this notification
              const existingNotification = notifications.find(
                n => n.experimentId === experimentId &&
                     n.variation === variation &&
                     n.metric === metricName
              );

              if (!existingNotification) {
                setNotifications(prev => [
                  ...prev,
                  {
                    id: `${experimentId}-${variation}-${metricName}-${Date.now()}`,
                    experimentId,
                    experimentName: experiment.name,
                    variation,
                    metric: metricName,
                    significant: true,
                    confidenceLevel: metrics[metricName].confidenceLevel,
                    message: `${variation} achieved statistical significance for ${metricName.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
                    timestamp: new Date().toISOString()
                  }
                ]);
              }
            }
          });
        });
      }
    });
  };

  // Handle experiment selection
  const handleExperimentSelect = (experimentId) => {
    setSelectedExperiment(experimentId);

    if (experimentId && experimentResults[experimentId]) {
      updateRealTimeData(experimentId, experimentResults[experimentId]);
    }
  };

  // Dismiss a notification
  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Format number for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString();
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '-';
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Real-Time A/B Testing Dashboard</h1>

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

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Experiments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Active Experiments</h2>

          {Object.keys(activeExperiments).length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {Object.entries(activeExperiments).map(([id, experiment]) => (
                <li
                  key={id}
                  className={`py-3 cursor-pointer hover:bg-gray-50 ${selectedExperiment === id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleExperimentSelect(id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{experiment.name}</h3>
                      <p className="text-sm text-gray-600">{experiment.type}</p>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          experiment.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {experiment.status}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(experiment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2">
                      {experimentResults[id] && experimentResults[id].lift && (
                        <div className="text-xs">
                          {Object.entries(experimentResults[id].lift)
                            .filter(([variation, _]) => variation !== 'control')
                            .map(([variation, metrics]) => (
                              metrics.clickRate > 5 ? (
                                <span key={variation} className="block px-2 py-1 bg-green-100 text-green-800 rounded mt-1">
                                  {variation}: +{metrics.clickRate.toFixed(1)}%
                                </span>
                              ) : metrics.clickRate < -5 ? (
                                <span key={variation} className="block px-2 py-1 bg-red-100 text-red-800 rounded mt-1">
                                  {variation}: {metrics.clickRate.toFixed(1)}%
                                </span>
                              ) : null
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-center py-4">
              No active experiments
            </div>
          )}
        </div>

        {/* Middle Column - Real-Time Experiment Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Real-Time Experiment Data</h2>

          {selectedExperiment ? (
            <div>
              <h3 className="font-medium text-xl mb-2">
                {activeExperiments[selectedExperiment]?.name}
              </h3>

              {/* Aggregate Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-600 mb-1">Total Impressions</h4>
                  <p className="text-2xl font-bold">{formatNumber(realTimeData.metrics?.totalImpressions)}</p>
                  <div className="mt-1 text-xs text-blue-500">
                    Real-time data
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-green-600 mb-1">Conversion Rate</h4>
                  <p className="text-2xl font-bold">
                    {realTimeData.metrics?.totalConversions && realTimeData.metrics?.totalImpressions ?
                      formatPercentage(realTimeData.metrics.totalConversions / realTimeData.metrics.totalImpressions) : '-'}
                  </p>
                  <div className="mt-1 text-xs text-green-500">
                    Conversions: {formatNumber(realTimeData.metrics?.totalConversions)}
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-indigo-600 mb-1">Click Rate</h4>
                  <p className="text-2xl font-bold">{formatPercentage(realTimeData.metrics?.avgClickRate)}</p>
                  <div className="mt-1 text-xs text-indigo-500">
                    Clicks: {formatNumber(realTimeData.metrics?.totalClicks)}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-purple-600 mb-1">Action Rate</h4>
                  <p className="text-2xl font-bold">{formatPercentage(realTimeData.metrics?.avgActionRate)}</p>
                  <div className="mt-1 text-xs text-purple-500">
                    Actions: {formatNumber(realTimeData.metrics?.totalActions)}
                  </div>
                </div>
              </div>

              {/* Variation Performance */}
              <h4 className="font-medium mt-6 mb-3">Variation Performance</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variation</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {realTimeData.variations && Object.entries(realTimeData.variations).map(([variation, metrics]) => (
                      <tr key={variation} className={variation === 'control' ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                          {variation}
                          {variation === 'control' && <span className="ml-1 text-xs text-gray-500">(baseline)</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{formatNumber(metrics.impressions)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{formatPercentage(metrics.clickRate)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{formatNumber(metrics.actions)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{formatPercentage(metrics.conversionRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12">
              Select an experiment to view real-time data
            </div>
          )}
        </div>

        {/* Right Column - Statistical Significance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Statistical Significance</h2>

          {selectedExperiment ? (
            realTimeData.significance && Object.keys(realTimeData.significance).length > 0 ? (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence Threshold
                  </label>
                  <select
                    value={significanceThreshold}
                    onChange={(e) => setSignificanceThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="90">90% confidence</option>
                    <option value="95">95% confidence</option>
                    <option value="99">99% confidence</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {Object.entries(realTimeData.significance).map(([variation, metrics]) => {
                    // Check if any metric is significant
                    const hasSignificance = Object.values(metrics).some(
                      metric => metric.significant && metric.confidenceLevel >= significanceThreshold
                    );

                    return (
                      <div key={variation} className={`p-4 rounded-lg ${hasSignificance ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <h4 className="font-medium mb-2">{variation}</h4>
                        <div className="space-y-2">
                          {Object.entries(metrics).map(([metricName, significance]) => (
                            <div key={metricName} className="flex justify-between text-sm">
                              <span className="text-gray-600">{metricName.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                              {significance.significant && significance.confidenceLevel >= significanceThreshold ? (
                                <span className="font-medium text-green-600">
                                  {significance.confidenceLevel}% confidence
                                </span>
                              ) : (
                                <span className="text-gray-500">Not significant</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {hasSignificance && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <h5 className="text-sm font-medium text-green-700 mb-1">Decision Ready</h5>
                            <p className="text-xs text-green-600">
                              This variation has reached statistical significance.
                              Consider ending the experiment and implementing the winning variation.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                No significant results yet.
                <p className="mt-2 text-sm">
                  The experiment needs more data to reach statistical significance.
                </p>
              </div>
            )
          ) : (
            <div className="text-gray-500 text-center py-12">
              Select an experiment to view significance data
            </div>
          )}

          {/* Quick Decision Tools */}
          {selectedExperiment && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium mb-3">Quick Decision Tools</h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
                  onClick={() => {
                    // In a real app, this would implement the winning variation
                    alert('This would implement the winning variation in production');
                  }}
                >
                  Implement Winner
                </button>

                <button
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none"
                  onClick={() => {
                    // In a real app, this would end the experiment
                    alert('This would end the experiment without implementing changes');
                  }}
                >
                  End Experiment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Metrics Section */}
      {selectedExperiment && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Visual Metrics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ExperimentChart data={realTimeData} metric="clickRate" />
            </div>
            <div>
              <ExperimentChart data={realTimeData} metric="conversionRate" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ExperimentChart data={realTimeData} metric="actionRate" />
            </div>
            <div>
              <ExperimentChart data={realTimeData} metric="impressions" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium mb-3">Experiment Insights</h3>

            {realTimeData.variations && Object.keys(realTimeData.variations).length > 0 ? (
              <div className="prose">
                <p className="text-sm text-gray-600">
                  {(() => {
                    // Generate insights based on the data
                    const treatments = Object.entries(realTimeData.variations)
                      .filter(([key, _]) => key !== 'control');

                    const controlData = realTimeData.variations.control;
                    if (!controlData) return 'No control group data available.';

                    const bestTreatment = treatments.reduce((best, current) => {
                      if (!best[1]) return current;
                      return current[1].clickRate > best[1].clickRate ? current : best;
                    }, [null, null]);

                    if (!bestTreatment[0]) return 'No treatment variations available for comparison.';

                    const clickRateImprovement = bestTreatment[1].clickRate - controlData.clickRate;
                    const clickRatePercentImprovement = (clickRateImprovement / controlData.clickRate) * 100;

                    const convRateImprovement =
                      (bestTreatment[1].conversionRate || 0) - (controlData.conversionRate || 0);
                    const convRatePercentImprovement = controlData.conversionRate
                      ? (convRateImprovement / controlData.conversionRate) * 100
                      : 0;

                    if (clickRateImprovement > 0 || convRateImprovement > 0) {
                      return `The ${bestTreatment[0]} variation is outperforming the control. It shows a ${clickRatePercentImprovement.toFixed(1)}% improvement in click rate ${convRateImprovement > 0 ? `and a ${convRatePercentImprovement.toFixed(1)}% improvement in conversion rate` : ''}. Consider implementing this variation if statistical significance is reached.`;
                    } else {
                      return `No treatment variations are currently outperforming the control. The experiment should continue running to collect more data.`;
                    }
                  })()}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  <strong>Recommendation:</strong> {
                    Object.entries(realTimeData.significance || {}).some(([_, metrics]) =>
                      Object.values(metrics).some(m => m.significant && m.confidenceLevel >= significanceThreshold)
                    )
                    ? 'The experiment has reached statistical significance. Consider making a decision to implement the winning variation or end the experiment.'
                    : 'Continue running the experiment to gather more data for statistical significance.'
                  }
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No variation data available for insights.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeABTestingDashboard;
