import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../store/slices/notificationsSlice';

/**
 * Simple analytics dashboard that shows notification metrics
 */
const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState({
    engagement: null,
    effectiveness: null,
    contextual: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setMetrics(prev => ({ ...prev, isLoading: true }));

        // Fetch metrics data from our API
        const response = await fetch('/api/analytics/metrics?days=30');

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        setMetrics({
          engagement: data.engagement || {},
          engagement_summary: data.engagement_summary || {},
          effectiveness: data.effectiveness || {},
          effectiveness_summary: data.effectiveness_summary || {},
          contextual: data.contextual || {},
          contextual_summary: data.contextual_summary || {},
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to load analytics metrics:', error);
        setMetrics(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load metrics'
        }));
      }
    }

    fetchMetrics();
  }, []);

  const refreshData = () => {
    // Logic to refresh the data can be added here
    fetchMetrics();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Analytics Dashboard | Expert Connect</title>
        <meta name="description" content="Analytics dashboard for compliance notifications" />
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <div className="flex space-x-4">
              <Link href="/admin/ab-testing-dashboard" legacyBehavior>
                <a className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  A/B Testing Dashboard
                </a>
              </Link>
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {metrics.isLoading ? (
          <div className="bg-white shadow rounded-lg p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading analytics data...</span>
          </div>
        ) : metrics.error ? (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading analytics data</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{metrics.error}</p>
                    <p className="mt-2">
                      Try generating some notification interactions by using the <Link href="/notifications-demo"><a className="underline">Notifications Demo</a></Link> page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Engagement Summary */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Notification Engagement Summary</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-blue-50 rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Notifications</dt>
                          <dd className="text-lg font-semibold text-gray-900">{metrics.engagement_summary?.total_sent || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">View Rate</dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {Math.round((metrics.engagement_summary?.view_rate || 0) * 100)}%
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Click-through Rate</dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {Math.round((metrics.engagement_summary?.click_through_rate || 0) * 100)}%
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Avg Time to Click</dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {Math.round((metrics.engagement_summary?.average_time_to_click || 0) / 1000)} sec
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Engagement by Notification Type</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Viewed</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clicked</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">View Rate</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Click Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {metrics.engagement_summary?.by_type && Object.entries(metrics.engagement_summary.by_type).map(([type, data]) => (
                          <tr key={type}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getNotificationTypeName(type)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.sent}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.viewed}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.clicked}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{Math.round((data.view_rate || 0) * 100)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{Math.round((data.click_rate || 0) * 100)}%</td>
                          </tr>
                        ))}
                        {(!metrics.engagement_summary?.by_type || Object.keys(metrics.engagement_summary.by_type).length === 0) && (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No notification data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Effectiveness Summary */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Action Effectiveness</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="bg-yellow-50 rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Actions Required</dt>
                          <dd className="text-lg font-semibold text-gray-900">{metrics.effectiveness_summary?.total_actions_required || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Actions Taken</dt>
                          <dd className="text-lg font-semibold text-gray-900">{metrics.effectiveness_summary?.total_actions_taken || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {Math.round((metrics.effectiveness_summary?.overall_conversion_rate || 0) * 100)}%
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Effectiveness by Priority</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taken</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {metrics.effectiveness_summary?.by_priority && Object.entries(metrics.effectiveness_summary.by_priority).map(([priority, data]) => (
                          <tr key={priority}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{priority.toUpperCase()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.required}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.taken}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{Math.round((data.rate || 0) * 100)}%</td>
                          </tr>
                        ))}
                        {(!metrics.effectiveness_summary?.by_priority || Object.keys(metrics.effectiveness_summary.by_priority).length === 0) && (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No priority data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Contextual Data */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">User Context Data</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Device Distribution</h3>
                    {metrics.contextual_summary?.device_counts && Object.keys(metrics.contextual_summary.device_counts).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(metrics.contextual_summary.device_counts).map(([device, count]) => (
                          <div key={device} className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 w-24">{device}</span>
                            <div className="flex-1 ml-4">
                              <div className="relative pt-1">
                                <div className="overflow-hidden h-4 text-xs flex rounded bg-blue-200">
                                  <div
                                    style={{
                                      width: `${getPercentage(count, getTotalCount(metrics.contextual_summary.device_counts))}%`
                                    }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <span className="ml-4 text-sm text-gray-600">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No device data available</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Browser Distribution</h3>
                    {metrics.contextual_summary?.browser_counts && Object.keys(metrics.contextual_summary.browser_counts).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(metrics.contextual_summary.browser_counts).map(([browser, count]) => (
                          <div key={browser} className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 w-24">{browser}</span>
                            <div className="flex-1 ml-4">
                              <div className="relative pt-1">
                                <div className="overflow-hidden h-4 text-xs flex rounded bg-indigo-200">
                                  <div
                                    style={{
                                      width: `${getPercentage(count, getTotalCount(metrics.contextual_summary.browser_counts))}%`
                                    }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <span className="ml-4 text-sm text-gray-600">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No browser data available</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Time of Day Activity</h3>
                    {metrics.contextual_summary?.time_of_day && Object.keys(metrics.contextual_summary.time_of_day).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(metrics.contextual_summary.time_of_day).map(([timeOfDay, count]) => (
                          <div key={timeOfDay} className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 w-24 capitalize">{timeOfDay}</span>
                            <div className="flex-1 ml-4">
                              <div className="relative pt-1">
                                <div className="overflow-hidden h-4 text-xs flex rounded bg-green-200">
                                  <div
                                    style={{
                                      width: `${getPercentage(count, getTotalCount(metrics.contextual_summary.time_of_day))}%`
                                    }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <span className="ml-4 text-sm text-gray-600">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No time of day data available</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Language Distribution</h3>
                    {metrics.contextual_summary?.language_counts && Object.keys(metrics.contextual_summary.language_counts).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(metrics.contextual_summary.language_counts).map(([language, count]) => (
                          <div key={language} className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 w-24">{language}</span>
                            <div className="flex-1 ml-4">
                              <div className="relative pt-1">
                                <div className="overflow-hidden h-4 text-xs flex rounded bg-purple-200">
                                  <div
                                    style={{
                                      width: `${getPercentage(count, getTotalCount(metrics.contextual_summary.language_counts))}%`
                                    }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <span className="ml-4 text-sm text-gray-600">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No language data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* A/B Testing Overview Card */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">A/B Testing Overview</h2>
                <Link href="/admin/ab-testing-dashboard" legacyBehavior>
                  <a className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View All Experiments →
                  </a>
                </Link>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  A/B testing helps optimize notification timing, content, and format to improve user engagement.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-1">Timing Experiments</h3>
                    <p className="text-sm text-gray-600">Test optimal send times to maximize engagement</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-1">Content Experiments</h3>
                    <p className="text-sm text-gray-600">Test different message formats and wording</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-1">Priority Experiments</h3>
                    <p className="text-sm text-gray-600">Test different priority algorithms</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-1">Statistical Analysis</h3>
                    <p className="text-sm text-gray-600">Significance testing for reliable results</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Link href="/admin/ab-testing-dashboard" legacyBehavior>
                  <a className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Create New Experiment
                  </a>
                </Link>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Link href="/notifications-demo" legacyBehavior>
                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                  Generate More Analytics Data →
                </a>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper function to get notification type display name
function getNotificationTypeName(type) {
  // Map from type codes to display names
  const typeMap = {
    [NOTIFICATION_TYPES.COMPLIANCE_UPDATE]: 'Compliance Update',
    [NOTIFICATION_TYPES.LICENSE_EXPIRY]: 'License Expiry',
    [NOTIFICATION_TYPES.REGULATORY_CHANGE]: 'Regulatory Change',
    [NOTIFICATION_TYPES.GDPR_UPDATE]: 'GDPR Update',
    [NOTIFICATION_TYPES.HIPAA_UPDATE]: 'HIPAA Update',
    [NOTIFICATION_TYPES.REGIONAL_RESTRICTION]: 'Regional Restriction',
    [NOTIFICATION_TYPES.CREDENTIAL_VERIFICATION]: 'Credential Verification',
    [NOTIFICATION_TYPES.DATA_BREACH]: 'Data Breach',
    [NOTIFICATION_TYPES.PRIVACY_POLICY_UPDATE]: 'Privacy Policy Update',
    [NOTIFICATION_TYPES.TERMS_UPDATE]: 'Terms Update',
    [NOTIFICATION_TYPES.TIMEZONE_CONFLICT]: 'Timezone Conflict',
    [NOTIFICATION_TYPES.AGE_VERIFICATION]: 'Age Verification',
    [NOTIFICATION_TYPES.SYSTEM]: 'System Message'
  };

  return typeMap[type] || type;
}

// Helper function to calculate percentage
function getPercentage(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

// Helper function to get total count
function getTotalCount(countObject) {
  return Object.values(countObject).reduce((sum, count) => sum + count, 0);
}

export default AnalyticsDashboard;
