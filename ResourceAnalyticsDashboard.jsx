import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  XMarkIcon,
  PresentationChartLineIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  CalendarIcon,
  ChevronDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from './i18n';

// Mock data for analytics
const MOCK_RESOURCES_DATA = {
  totalResources: 143,
  totalViews: 2870,
  totalDownloads: 987,
  totalUsers: 76,
  avgTimeSpent: "5m 32s",
  resourcesByType: {
    article: 48,
    video: 35,
    presentation: 27,
    ebook: 18,
    spreadsheet: 15
  },
  mostViewedResources: [
    { id: 'res1', title: 'Marketing Strategy 2023', views: 245, type: 'presentation' },
    { id: 'res2', title: 'Q2 Financial Report', views: 189, type: 'spreadsheet' },
    { id: 'res3', title: 'Product Launch Plan', views: 156, type: 'article' },
    { id: 'res4', title: 'Company Handbook', views: 132, type: 'ebook' },
    { id: 'res5', title: 'Sales Training Video', views: 121, type: 'video' }
  ],
  mostDownloadedResources: [
    { id: 'res1', title: 'Marketing Strategy 2023', downloads: 87, type: 'presentation' },
    { id: 'res4', title: 'Company Handbook', downloads: 72, type: 'ebook' },
    { id: 'res2', title: 'Q2 Financial Report', downloads: 68, type: 'spreadsheet' },
    { id: 'res5', title: 'Sales Training Video', downloads: 54, type: 'video' },
    { id: 'res7', title: 'Customer Survey Results', downloads: 49, type: 'spreadsheet' }
  ],
  mostActiveUsers: [
    { id: 'user1', name: 'John Smith', views: 178, downloads: 42, avatar: 'https://same-assets.com/avatar/1.jpg' },
    { id: 'user2', name: 'Sarah Johnson', views: 156, downloads: 38, avatar: 'https://same-assets.com/avatar/2.jpg' },
    { id: 'user3', name: 'Michael Chen', views: 143, downloads: 31, avatar: 'https://same-assets.com/avatar/3.jpg' },
    { id: 'user4', name: 'Jessica Williams', views: 132, downloads: 29, avatar: 'https://same-assets.com/avatar/4.jpg' },
    { id: 'user5', name: 'David Kim', views: 124, downloads: 27, avatar: 'https://same-assets.com/avatar/5.jpg' }
  ]
};

// Mock resource activity over time
const MOCK_ACTIVITY_DATA = {
  timeRange: 'month', // 'week', 'month', 'quarter', 'year'
  views: [
    { date: '2023-08-01', count: 85 },
    { date: '2023-08-08', count: 93 },
    { date: '2023-08-15', count: 87 },
    { date: '2023-08-22', count: 105 },
    { date: '2023-08-29', count: 112 }
  ],
  downloads: [
    { date: '2023-08-01', count: 32 },
    { date: '2023-08-08', count: 38 },
    { date: '2023-08-15', count: 29 },
    { date: '2023-08-22', count: 42 },
    { date: '2023-08-29', count: 36 }
  ],
  creations: [
    { date: '2023-08-01', count: 5 },
    { date: '2023-08-08', count: 3 },
    { date: '2023-08-15', count: 7 },
    { date: '2023-08-22', count: 4 },
    { date: '2023-08-29', count: 6 }
  ]
};

// Resource usage by department
const MOCK_DEPARTMENT_DATA = [
  { name: 'Marketing', views: 845, downloads: 287, resources: 32 },
  { name: 'Sales', views: 723, downloads: 246, resources: 28 },
  { name: 'Engineering', views: 612, downloads: 198, resources: 36 },
  { name: 'Finance', views: 456, downloads: 165, resources: 22 },
  { name: 'HR', views: 320, downloads: 112, resources: 18 },
  { name: 'Executive', views: 214, downloads: 89, resources: 7 }
];

// Resource engagement metrics
const MOCK_ENGAGEMENT_DATA = {
  avgCompletionRate: 67, // percentage
  avgEngagementTime: "4m 12s",
  completionByType: {
    article: 72,
    video: 58,
    presentation: 69,
    ebook: 43,
    spreadsheet: 82
  },
  feedbackStats: {
    totalFeedbacks: 328,
    avgRating: 4.2,
    positivePercentage: 78
  }
};

// Additional mock data for detailed resource analytics
const MOCK_DETAILED_RESOURCES = [
  {
    id: 'res1',
    title: 'Marketing Strategy 2023',
    type: 'presentation',
    views: 245,
    downloads: 87,
    avgTimeSpent: '6m 42s',
    completionRate: 68,
    createdBy: 'Sarah Johnson',
    createdAt: '2023-06-15T10:30:00Z',
    lastUpdatedAt: '2023-07-20T14:15:00Z',
    tags: ['marketing', 'strategy', 'planning'],
    departments: ['Marketing', 'Sales'],
    rating: 4.7
  },
  {
    id: 'res2',
    title: 'Q2 Financial Report',
    type: 'spreadsheet',
    views: 189,
    downloads: 68,
    avgTimeSpent: '8m 12s',
    completionRate: 82,
    createdBy: 'Michael Chen',
    createdAt: '2023-07-10T09:45:00Z',
    lastUpdatedAt: '2023-07-12T11:30:00Z',
    tags: ['finance', 'quarterly', 'report'],
    departments: ['Finance', 'Executive'],
    rating: 4.2
  },
  {
    id: 'res3',
    title: 'Product Launch Plan',
    type: 'article',
    views: 156,
    downloads: 45,
    avgTimeSpent: '4m 36s',
    completionRate: 71,
    createdBy: 'Jessica Williams',
    createdAt: '2023-05-28T13:20:00Z',
    lastUpdatedAt: '2023-06-14T10:05:00Z',
    tags: ['product', 'launch', 'planning'],
    departments: ['Product', 'Marketing'],
    rating: 4.5
  },
  {
    id: 'res4',
    title: 'Company Handbook',
    type: 'ebook',
    views: 132,
    downloads: 72,
    avgTimeSpent: '12m 45s',
    completionRate: 43,
    createdBy: 'David Kim',
    createdAt: '2023-01-15T11:10:00Z',
    lastUpdatedAt: '2023-04-30T16:20:00Z',
    tags: ['company', 'policies', 'handbook'],
    departments: ['HR', 'All'],
    rating: 4.0
  },
  {
    id: 'res5',
    title: 'Sales Training Video',
    type: 'video',
    views: 121,
    downloads: 54,
    avgTimeSpent: '18m 32s',
    completionRate: 58,
    createdBy: 'John Smith',
    createdAt: '2023-03-20T14:30:00Z',
    lastUpdatedAt: '2023-03-20T14:30:00Z',
    tags: ['sales', 'training', 'video'],
    departments: ['Sales'],
    rating: 4.8
  },
  {
    id: 'res6',
    title: 'Engineering Best Practices',
    type: 'article',
    views: 108,
    downloads: 42,
    avgTimeSpent: '5m 23s',
    completionRate: 75,
    createdBy: 'Emily Liu',
    createdAt: '2023-02-28T09:15:00Z',
    lastUpdatedAt: '2023-05-17T11:45:00Z',
    tags: ['engineering', 'best practices', 'coding'],
    departments: ['Engineering'],
    rating: 4.6
  },
  {
    id: 'res7',
    title: 'Customer Survey Results',
    type: 'spreadsheet',
    views: 97,
    downloads: 49,
    avgTimeSpent: '7m 18s',
    completionRate: 79,
    createdBy: 'Robert Garcia',
    createdAt: '2023-06-05T15:40:00Z',
    lastUpdatedAt: '2023-06-07T10:25:00Z',
    tags: ['customer', 'survey', 'results'],
    departments: ['Marketing', 'Product'],
    rating: 3.9
  },
  {
    id: 'res8',
    title: 'Budget Planning Template',
    type: 'spreadsheet',
    views: 89,
    downloads: 62,
    avgTimeSpent: '9m 05s',
    completionRate: 84,
    createdBy: 'Michelle Wong',
    createdAt: '2023-04-12T13:50:00Z',
    lastUpdatedAt: '2023-04-14T16:35:00Z',
    tags: ['budget', 'planning', 'finance'],
    departments: ['Finance', 'All'],
    rating: 4.3
  }
];

const ResourceAnalyticsDashboard = ({ onClose }) => {
  const { t } = useTranslation();
  const [resourcesData, setResourcesData] = useState(MOCK_RESOURCES_DATA);
  const [activityData, setActivityData] = useState(MOCK_ACTIVITY_DATA);
  const [departmentData, setDepartmentData] = useState(MOCK_DEPARTMENT_DATA);
  const [engagementData, setEngagementData] = useState(MOCK_ENGAGEMENT_DATA);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [detailedResources, setDetailedResources] = useState(MOCK_DETAILED_RESOURCES);
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [resourceSortBy, setResourceSortBy] = useState('views');
  const [showFilters, setShowFilters] = useState(false);

  // Handle data refresh
  const refreshData = async () => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, this would fetch fresh data from the backend
      // For demo, we just re-use our mock data
      setResourcesData({ ...MOCK_RESOURCES_DATA });
      setActivityData({ ...MOCK_ACTIVITY_DATA, timeRange });
      setDepartmentData([...MOCK_DEPARTMENT_DATA]);
      setEngagementData({ ...MOCK_ENGAGEMENT_DATA });
      setDetailedResources([...MOCK_DETAILED_RESOURCES]);
    } catch (error) {
      console.error('Error refreshing analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Change time range
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setShowTimeRangeDropdown(false);

    // In a real app, this would trigger a data fetch
    // For demo, we'll just simulate it with a brief loading state
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setActivityData({ ...MOCK_ACTIVITY_DATA, timeRange: range });
    }, 500);
  };

  // Load data when component mounts
  useEffect(() => {
    refreshData();
  }, []);

  // Filter and sort resources
  const filteredResources = detailedResources
    .filter(resource => {
      // Search query filter
      const matchesSearch = resource.title.toLowerCase().includes(resourceSearchQuery.toLowerCase()) ||
                            resource.tags.some(tag => tag.toLowerCase().includes(resourceSearchQuery.toLowerCase())) ||
                            resource.createdBy.toLowerCase().includes(resourceSearchQuery.toLowerCase());

      // Type filter
      const matchesType = resourceTypeFilter === 'all' || resource.type === resourceTypeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (resourceSortBy === 'views') return b.views - a.views;
      if (resourceSortBy === 'downloads') return b.downloads - a.downloads;
      if (resourceSortBy === 'completion') return b.completionRate - a.completionRate;
      if (resourceSortBy === 'rating') return b.rating - a.rating;
      if (resourceSortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Handle search
  const handleResourceSearch = (e) => {
    e.preventDefault();
    // Search happens in real-time as the user types in the filteredResources computation
  };

  // Helper function to render a stat card
  const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-2 flex items-center text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="sr-only">{trend === 'up' ? 'Increased by' : 'Decreased by'}</span>
              {trendValue}
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 inline-flex items-center justify-center rounded-full p-3 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Helper function to render a resource type card
  const ResourceTypeCard = ({ type, count, color, icon }) => (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 capitalize">{type}</p>
        <p className="text-2xl font-semibold text-gray-900">{count}</p>
      </div>
    </div>
  );

  // Helper function to render a resource in list
  const ResourceListItem = ({ resource, metric, metricName, icon }) => (
    <li className="flex items-center py-3 border-b border-gray-200 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-indigo-600 truncate">{resource.title}</p>
        <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
      </div>
      <div className="flex items-center">
        <div className="flex items-center text-sm text-gray-900">
          {icon}
          <span className="ml-1 font-medium">{metric}</span>
        </div>
      </div>
    </li>
  );

  // Chart component (simplified representation)
  const SimpleBarChart = ({ data, maxValue }) => (
    <div className="flex items-end space-x-2 h-40">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
        return (
          <div key={index} className="group relative flex flex-col items-center">
            <div
              className="w-8 bg-indigo-200 rounded-t hover:bg-indigo-300 cursor-pointer"
              style={{ height: `${height}%` }}
              title={`${item.date}: ${item.count}`}
            ></div>
            <div className="text-xs text-gray-500 mt-1 truncate w-16 text-center">
              {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
            <div className="absolute bottom-full mb-2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none">
              {item.date}: {item.count}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Resource Analytics Dashboard</h2>
          </div>
          <div className="flex items-center">
            <button
              onClick={refreshData}
              disabled={loading}
              className={`mr-4 text-gray-500 hover:text-gray-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh data"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative mr-4">
              <button
                onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <CalendarIcon className="h-5 w-5 mr-1 text-gray-500" />
                <span>
                  {timeRange === 'week' ? 'Last 7 days' :
                   timeRange === 'month' ? 'Last 30 days' :
                   timeRange === 'quarter' ? 'Last 90 days' : 'Last 365 days'}
                </span>
                <ChevronDownIcon className="h-4 w-4 ml-1 text-gray-500" />
              </button>
              {showTimeRangeDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {['week', 'month', 'quarter', 'year'].map(range => (
                      <button
                        key={range}
                        onClick={() => handleTimeRangeChange(range)}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          timeRange === range ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {range === 'week' ? 'Last 7 days' :
                         range === 'month' ? 'Last 30 days' :
                         range === 'quarter' ? 'Last 90 days' : 'Last 365 days'}
                        {timeRange === range && (
                          <CheckIcon className="inline-block h-4 w-4 ml-2 text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="px-6 flex -mb-px overflow-x-auto">
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Overview
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === 'resources'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('resources')}
            >
              <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
              Resources
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Users
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === 'engagement'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('engagement')}
            >
              <PresentationChartLineIcon className="h-5 w-5 mr-2" />
              Engagement
            </button>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-3"></div>
                <p className="text-sm text-gray-500">Loading analytics data...</p>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              {/* Key metrics */}
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Total Resources"
                  value={resourcesData.totalResources}
                  icon={<DocumentDuplicateIcon className="h-6 w-6 text-indigo-500" />}
                  color="bg-indigo-100"
                  trend="up"
                  trendValue="8% from last month"
                />
                <StatCard
                  title="Total Views"
                  value={resourcesData.totalViews}
                  icon={<EyeIcon className="h-6 w-6 text-blue-500" />}
                  color="bg-blue-100"
                  trend="up"
                  trendValue="12% from last month"
                />
                <StatCard
                  title="Total Downloads"
                  value={resourcesData.totalDownloads}
                  icon={<ArrowDownTrayIcon className="h-6 w-6 text-green-500" />}
                  color="bg-green-100"
                  trend="up"
                  trendValue="5% from last month"
                />
                <StatCard
                  title="Average Time Spent"
                  value={resourcesData.avgTimeSpent}
                  icon={<ClockIcon className="h-6 w-6 text-purple-500" />}
                  color="bg-purple-100"
                  trend="down"
                  trendValue="3% from last month"
                />
              </div>

              {/* Resources by type */}
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resources by Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <ResourceTypeCard
                  type="articles"
                  count={resourcesData.resourcesByType.article}
                  color="bg-blue-100"
                  icon={<DocumentDuplicateIcon className="h-6 w-6 text-blue-500" />}
                />
                <ResourceTypeCard
                  type="videos"
                  count={resourcesData.resourcesByType.video}
                  color="bg-red-100"
                  icon={<DocumentDuplicateIcon className="h-6 w-6 text-red-500" />}
                />
                <ResourceTypeCard
                  type="presentations"
                  count={resourcesData.resourcesByType.presentation}
                  color="bg-amber-100"
                  icon={<DocumentDuplicateIcon className="h-6 w-6 text-amber-500" />}
                />
                <ResourceTypeCard
                  type="ebooks"
                  count={resourcesData.resourcesByType.ebook}
                  color="bg-green-100"
                  icon={<DocumentDuplicateIcon className="h-6 w-6 text-green-500" />}
                />
                <ResourceTypeCard
                  type="spreadsheets"
                  count={resourcesData.resourcesByType.spreadsheet}
                  color="bg-purple-100"
                  icon={<DocumentDuplicateIcon className="h-6 w-6 text-purple-500" />}
                />
              </div>

              {/* Activity trends */}
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Trends</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Views</h4>
                  <SimpleBarChart
                    data={activityData.views}
                    maxValue={Math.max(...activityData.views.map(item => item.count))}
                  />
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Downloads</h4>
                  <SimpleBarChart
                    data={activityData.downloads}
                    maxValue={Math.max(...activityData.downloads.map(item => item.count))}
                  />
                </div>
              </div>

              {/* Top resources and users */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h4 className="text-base font-medium text-gray-900">Most Viewed Resources</h4>
                  </div>
                  <div className="px-6 py-2">
                    <ul className="divide-y divide-gray-200">
                      {resourcesData.mostViewedResources.map(resource => (
                        <ResourceListItem
                          key={resource.id}
                          resource={resource}
                          metric={resource.views}
                          metricName="views"
                          icon={<EyeIcon className="h-4 w-4 text-blue-500" />}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h4 className="text-base font-medium text-gray-900">Most Active Users</h4>
                  </div>
                  <div className="px-6 py-2">
                    <ul className="divide-y divide-gray-200">
                      {resourcesData.mostActiveUsers.map(user => (
                        <li key={user.id} className="flex items-center py-3 border-b border-gray-200 last:border-0">
                          <div className="flex-shrink-0">
                            <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-xs text-gray-500">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              {user.views}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                              {user.downloads}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="p-6">
              {/* Search and filters */}
              <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <form onSubmit={handleResourceSearch} className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search resources by title, tag, or creator..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    value={resourceSearchQuery}
                    onChange={(e) => setResourceSearchQuery(e.target.value)}
                  />
                </form>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                    Filters
                  </button>

                  <div className="flex items-center">
                    <label htmlFor="resourceSort" className="block text-sm font-medium text-gray-700 mr-2">
                      Sort by:
                    </label>
                    <select
                      id="resourceSort"
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={resourceSortBy}
                      onChange={(e) => setResourceSortBy(e.target.value)}
                    >
                      <option value="views">Most Viewed</option>
                      <option value="downloads">Most Downloaded</option>
                      <option value="completion">Highest Completion</option>
                      <option value="rating">Highest Rated</option>
                      <option value="newest">Newest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Expanded filters */}
              {showFilters && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <label htmlFor="resourceTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                        Resource Type
                      </label>
                      <select
                        id="resourceTypeFilter"
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={resourceTypeFilter}
                        onChange={(e) => setResourceTypeFilter(e.target.value)}
                      >
                        <option value="all">All Types</option>
                        <option value="article">Articles</option>
                        <option value="video">Videos</option>
                        <option value="presentation">Presentations</option>
                        <option value="ebook">eBooks</option>
                        <option value="spreadsheet">Spreadsheets</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setResourceSearchQuery('');
                          setResourceTypeFilter('all');
                          setResourceSortBy('views');
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Clear Filters
                      </button>

                      <button
                        onClick={() => setShowFilters(false)}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources table */}
              <div className="bg-white shadow-sm overflow-hidden border border-gray-200 rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resource
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Downloads
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completion
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredResources.map(resource => (
                        <tr key={resource.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-gray-100">
                                {resource.type === 'article' && <DocumentDuplicateIcon className="h-6 w-6 text-blue-500" />}
                                {resource.type === 'video' && <DocumentDuplicateIcon className="h-6 w-6 text-red-500" />}
                                {resource.type === 'presentation' && <DocumentDuplicateIcon className="h-6 w-6 text-amber-500" />}
                                {resource.type === 'ebook' && <DocumentDuplicateIcon className="h-6 w-6 text-green-500" />}
                                {resource.type === 'spreadsheet' && <DocumentDuplicateIcon className="h-6 w-6 text-purple-500" />}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-indigo-600">{resource.title}</div>
                                <div className="text-xs text-gray-500">
                                  {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} · Created by {resource.createdBy} · {formatDate(resource.createdAt)}
                                </div>
                                <div className="flex flex-wrap mt-1">
                                  {resource.tags.map(tag => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1 mb-1"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-medium text-gray-900">{resource.views}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-medium text-gray-900">{resource.downloads}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-medium text-gray-900">{resource.avgTimeSpent}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div
                                  className="bg-indigo-600 h-2.5 rounded-full"
                                  style={{ width: `${resource.completionRate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{resource.completionRate}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <svg
                                    key={star}
                                    className={`h-4 w-4 ${star <= Math.round(resource.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    aria-hidden="true"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="ml-1 text-sm font-medium text-gray-900">{resource.rating.toFixed(1)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredResources.length === 0 && (
                  <div className="text-center py-12">
                    <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No resources found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users and Engagement tabs will be implemented in subsequent parts */}
        </div>
      </div>
    </div>
  );
};

export default ResourceAnalyticsDashboard;
