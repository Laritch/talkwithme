import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronRightIcon,
  CogIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from './i18n';

// Mock LMS platforms for demo
const LMS_PLATFORMS = [
  {
    id: 'canvas',
    name: 'Canvas LMS',
    logo: 'https://same-assets.com/logo/canvas_lms.png',
    description: 'Connect to Canvas to share resources and sync course materials.'
  },
  {
    id: 'moodle',
    name: 'Moodle',
    logo: 'https://same-assets.com/logo/moodle.png',
    description: 'Integrate with Moodle to manage learning materials and courses.'
  },
  {
    id: 'blackboard',
    name: 'Blackboard Learn',
    logo: 'https://same-assets.com/logo/blackboard.png',
    description: 'Sync content with Blackboard for seamless educational experiences.'
  },
  {
    id: 'docebo',
    name: 'Docebo',
    logo: 'https://same-assets.com/logo/docebo.png',
    description: 'Connect to Docebo for corporate training and learning management.'
  },
  {
    id: 'cornerstone',
    name: 'Cornerstone',
    logo: 'https://same-assets.com/logo/cornerstone.png',
    description: 'Integrate with Cornerstone OnDemand for talent management.'
  }
];

// Mock resources for demo
const MOCK_RESOURCES = [
  {
    id: 'res1',
    title: 'Marketing Strategy 2023',
    type: 'presentation',
    size: '4.2 MB',
    syncStatus: 'synced',
    lastSynced: '2023-07-20T14:15:00Z',
    connectedPlatforms: ['canvas', 'docebo']
  },
  {
    id: 'res2',
    title: 'Q2 Financial Report',
    type: 'spreadsheet',
    size: '1.8 MB',
    syncStatus: 'not_synced',
    lastSynced: null,
    connectedPlatforms: []
  },
  {
    id: 'res3',
    title: 'Product Launch Plan',
    type: 'article',
    size: '950 KB',
    syncStatus: 'syncing',
    lastSynced: null,
    connectedPlatforms: ['moodle']
  },
  {
    id: 'res4',
    title: 'Company Handbook',
    type: 'ebook',
    size: '3.5 MB',
    syncStatus: 'error',
    lastSynced: '2023-04-30T16:20:00Z',
    connectedPlatforms: ['blackboard'],
    error: 'File format not supported by platform'
  },
  {
    id: 'res5',
    title: 'Sales Training Video',
    type: 'video',
    size: '28.6 MB',
    syncStatus: 'synced',
    lastSynced: '2023-03-20T14:30:00Z',
    connectedPlatforms: ['canvas', 'cornerstone', 'docebo']
  }
];

// Mock courses for demo
const MOCK_COURSES = [
  {
    id: 'course1',
    name: 'Introduction to Marketing',
    platform: 'canvas',
    resourceCount: 12,
    lastSync: '2023-07-25T09:30:00Z'
  },
  {
    id: 'course2',
    name: 'Advanced Sales Techniques',
    platform: 'docebo',
    resourceCount: 18,
    lastSync: '2023-07-20T14:15:00Z'
  },
  {
    id: 'course3',
    name: 'Financial Planning Basics',
    platform: 'moodle',
    resourceCount: 8,
    lastSync: '2023-07-22T11:45:00Z'
  },
  {
    id: 'course4',
    name: 'New Employee Onboarding',
    platform: 'cornerstone',
    resourceCount: 15,
    lastSync: '2023-07-24T16:20:00Z'
  },
  {
    id: 'course5',
    name: 'Product Management Essentials',
    platform: 'blackboard',
    resourceCount: 10,
    lastSync: '2023-07-21T13:10:00Z'
  }
];

const LMSIntegration = ({ onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('platforms');
  const [connectedPlatforms, setConnectedPlatforms] = useState(['canvas', 'moodle']);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [syncedResources, setSyncedResources] = useState(MOCK_RESOURCES);
  const [availableCourses, setAvailableCourses] = useState(MOCK_COURSES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [platformCredentials, setPlatformCredentials] = useState({
    url: '',
    apiKey: '',
    username: '',
    password: ''
  });
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // Connect to a platform
  const handleConnect = async (platformId) => {
    setConnectingPlatform(platformId);
    setConnectionError(null);
    setSelectedPlatform(platformId);
    setShowConnectForm(true);
  };

  // Disconnect from a platform
  const handleDisconnect = async (platformId) => {
    setLoading(true);

    try {
      // Simulate API call to disconnect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update connected platforms
      setConnectedPlatforms(connectedPlatforms.filter(id => id !== platformId));

      // Update synced resources
      setSyncedResources(syncedResources.map(resource => ({
        ...resource,
        connectedPlatforms: resource.connectedPlatforms.filter(id => id !== platformId)
      })));
    } catch (error) {
      console.error('Error disconnecting platform:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit connection form
  const handleConnectSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPlatform) return;

    setLoading(true);
    setConnectionError(null);

    try {
      // Simulate API call to connect
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Random success (80% chance)
          if (Math.random() > 0.2) {
            resolve();
          } else {
            reject(new Error('Connection failed: Invalid credentials. Please check and try again.'));
          }
        }, 1500);
      });

      // Update connected platforms if not already connected
      if (!connectedPlatforms.includes(selectedPlatform)) {
        setConnectedPlatforms([...connectedPlatforms, selectedPlatform]);
      }

      // Reset form
      setPlatformCredentials({
        url: '',
        apiKey: '',
        username: '',
        password: ''
      });

      setShowConnectForm(false);
      setSelectedPlatform(null);
    } catch (error) {
      console.error('Error connecting platform:', error);
      setConnectionError(error.message || 'Failed to connect to platform. Please try again.');
    } finally {
      setLoading(false);
      setConnectingPlatform(null);
    }
  };

  // Close connection form
  const handleCloseForm = () => {
    setShowConnectForm(false);
    setSelectedPlatform(null);
    setConnectionError(null);
    setPlatformCredentials({
      url: '',
      apiKey: '',
      username: '',
      password: ''
    });
    setConnectingPlatform(null);
  };

  // Update form input
  const handleCredentialChange = (field, value) => {
    setPlatformCredentials({
      ...platformCredentials,
      [field]: value
    });
  };

  // Sync all platforms
  const handleSyncAll = async () => {
    if (connectedPlatforms.length === 0) return;

    setSyncInProgress(true);
    setSyncStatus({
      status: 'running',
      message: 'Syncing with connected platforms...',
      progress: 0
    });

    try {
      // Simulate sync progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSyncStatus({
          status: 'running',
          message: `Syncing with connected platforms (${i}%)...`,
          progress: i
        });
      }

      // Update sync status
      setSyncStatus({
        status: 'success',
        message: 'Successfully synced with all platforms',
        progress: 100
      });

      // Reset after a delay
      setTimeout(() => {
        setSyncStatus(null);
        setSyncInProgress(false);
      }, 3000);
    } catch (error) {
      console.error('Error syncing platforms:', error);
      setSyncStatus({
        status: 'error',
        message: 'Error syncing with platforms. Please try again.',
        progress: 0
      });

      // Reset after a delay
      setTimeout(() => {
        setSyncStatus(null);
        setSyncInProgress(false);
      }, 3000);
    }
  };

  // Find platform by ID
  const getPlatform = (platformId) => {
    return LMS_PLATFORMS.find(p => p.id === platformId);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <AcademicCapIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">LMS Integration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="px-6 flex -mb-px overflow-x-auto">
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === 'platforms'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('platforms')}
            >
              <CogIcon className="h-5 w-5 mr-2" />
              LMS Platforms
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === 'resources'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('resources')}
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Resource Sync
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === 'courses'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('courses')}
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Course Content
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {/* Platforms Tab */}
          {activeTab === 'platforms' && (
            <div className="p-6">
              {/* Sync Status */}
              {syncStatus && (
                <div className={`mb-6 p-4 rounded-md ${
                  syncStatus.status === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : syncStatus.status === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {syncStatus.status === 'error' && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      )}
                      {syncStatus.status === 'success' && (
                        <CheckIcon className="h-5 w-5 text-green-400" />
                      )}
                      {syncStatus.status === 'running' && (
                        <ArrowPathIcon className="h-5 w-5 text-blue-400 animate-spin" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${
                        syncStatus.status === 'error'
                          ? 'text-red-800'
                          : syncStatus.status === 'success'
                            ? 'text-green-800'
                            : 'text-blue-800'
                      }`}>
                        {syncStatus.message}
                      </h3>
                      {syncStatus.status === 'running' && (
                        <div className="mt-2 w-full bg-blue-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${syncStatus.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Connected Platforms Summary */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Connected Platforms</h3>
                  <button
                    onClick={handleSyncAll}
                    disabled={syncInProgress || connectedPlatforms.length === 0}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 ${
                      syncInProgress || connectedPlatforms.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
                    Sync All
                  </button>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                  {connectedPlatforms.length === 0 ? (
                    <div className="text-center py-6">
                      <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No connected platforms</h3>
                      <p className="mt-1 text-sm text-gray-500">Connect to an LMS platform to start syncing.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {connectedPlatforms.map(platformId => {
                        const platform = getPlatform(platformId);
                        return (
                          <li key={platformId}>
                            <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-white p-2 border border-gray-200 flex items-center justify-center">
                                  <img
                                    src={platform.logo}
                                    alt={platform.name}
                                    className="max-h-8 max-w-8"
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-indigo-600">{platform.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {syncedResources.filter(r => r.connectedPlatforms.includes(platformId)).length} resources synced
                                  </div>
                                </div>
                              </div>
                              <div>
                                <button
                                  onClick={() => handleDisconnect(platformId)}
                                  disabled={loading}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  Disconnect
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Available Platforms */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Platforms</h3>
                <div className="bg-white shadow sm:rounded-md border border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {LMS_PLATFORMS.map(platform => {
                      const isConnected = connectedPlatforms.includes(platform.id);
                      const isConnecting = connectingPlatform === platform.id;

                      return (
                        <li key={platform.id}>
                          <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 rounded-md bg-white p-2 border border-gray-200 flex items-center justify-center">
                                <img
                                  src={platform.logo}
                                  alt={platform.name}
                                  className="max-h-8 max-w-8"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{platform.name}</div>
                                <div className="text-sm text-gray-500">{platform.description}</div>
                              </div>
                            </div>
                            <div>
                              {isConnected ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  Connected
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleConnect(platform.id)}
                                  disabled={isConnecting || loading}
                                  className={`inline-flex items-center px-3 py-1.5 border border-indigo-500 shadow-sm text-xs leading-4 font-medium rounded-md ${
                                    isConnecting || loading
                                      ? 'text-indigo-300 bg-indigo-50 cursor-not-allowed'
                                      : 'text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                  }`}
                                >
                                  {isConnecting ? (
                                    <>
                                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <LinkIcon className="h-4 w-4 mr-1" />
                                      Connect
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Resource Sync and Course Content tabs will be implemented in subsequent parts */}

          {/* Connection Form Modal */}
          {showConnectForm && selectedPlatform && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Connect to {getPlatform(selectedPlatform)?.name}
                  </h3>
                  <button
                    onClick={handleCloseForm}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {connectionError && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{connectionError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleConnectSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="platform-url" className="block text-sm font-medium text-gray-700">LMS URL</label>
                      <input
                        type="url"
                        id="platform-url"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="https://yourlms.example.com"
                        value={platformCredentials.url}
                        onChange={(e) => handleCredentialChange('url', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="platform-username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                          type="text"
                          id="platform-username"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="admin"
                          value={platformCredentials.username}
                          onChange={(e) => handleCredentialChange('username', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="platform-password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          id="platform-password"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="••••••••"
                          value={platformCredentials.password}
                          onChange={(e) => handleCredentialChange('password', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="platform-apikey" className="block text-sm font-medium text-gray-700">API Key <span className="text-gray-400">(if required)</span></label>
                      <input
                        type="text"
                        id="platform-apikey"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="api_key_12345"
                        value={platformCredentials.apiKey}
                        onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {loading ? (
                        <>
                          <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LMSIntegration;
