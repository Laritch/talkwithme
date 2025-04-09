import React, { useState, useEffect } from 'react';
import {
  ArchiveBoxIcon,
  XMarkIcon,
  TrashIcon,
  TagIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
  PlusIcon,
  ChevronUpDownIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  ArrowDownOnSquareIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from './i18n';

// Mock resources data
const MOCK_RESOURCES = [
  {
    id: 'res1',
    title: 'Marketing Strategy 2023',
    type: 'presentation',
    tags: ['marketing', 'strategy', 'planning'],
    category: 'Marketing',
    createdAt: '2023-06-15T10:30:00Z',
    lastUpdatedAt: '2023-07-20T14:15:00Z',
    createdBy: 'Sarah Johnson',
    size: '4.2 MB',
    viewCount: 245,
    downloadCount: 87,
    permissions: 'all',
    description: 'Comprehensive marketing strategy for 2023 fiscal year',
    thumbnail: 'https://same-assets.com/thumbnails/presentation.jpg'
  },
  {
    id: 'res2',
    title: 'Q2 Financial Report',
    type: 'spreadsheet',
    tags: ['finance', 'quarterly', 'report'],
    category: 'Finance',
    createdAt: '2023-07-10T09:45:00Z',
    lastUpdatedAt: '2023-07-12T11:30:00Z',
    createdBy: 'Michael Chen',
    size: '1.8 MB',
    viewCount: 189,
    downloadCount: 68,
    permissions: 'team',
    description: 'Financial performance report for Q2 2023',
    thumbnail: 'https://same-assets.com/thumbnails/spreadsheet.jpg'
  },
  {
    id: 'res3',
    title: 'Product Launch Plan',
    type: 'article',
    tags: ['product', 'launch', 'planning'],
    category: 'Product',
    createdAt: '2023-05-28T13:20:00Z',
    lastUpdatedAt: '2023-06-14T10:05:00Z',
    createdBy: 'Jessica Williams',
    size: '950 KB',
    viewCount: 156,
    downloadCount: 45,
    permissions: 'all',
    description: 'Detailed plan for the upcoming product launch',
    thumbnail: 'https://same-assets.com/thumbnails/article.jpg'
  },
  {
    id: 'res4',
    title: 'Company Handbook',
    type: 'ebook',
    tags: ['company', 'policies', 'handbook'],
    category: 'HR',
    createdAt: '2023-01-15T11:10:00Z',
    lastUpdatedAt: '2023-04-30T16:20:00Z',
    createdBy: 'David Kim',
    size: '3.5 MB',
    viewCount: 132,
    downloadCount: 72,
    permissions: 'all',
    description: 'Official company handbook with policies and procedures',
    thumbnail: 'https://same-assets.com/thumbnails/ebook.jpg'
  },
  {
    id: 'res5',
    title: 'Sales Training Video',
    type: 'video',
    tags: ['sales', 'training', 'video'],
    category: 'Sales',
    createdAt: '2023-03-20T14:30:00Z',
    lastUpdatedAt: '2023-03-20T14:30:00Z',
    createdBy: 'John Smith',
    size: '28.6 MB',
    viewCount: 121,
    downloadCount: 54,
    permissions: 'team',
    description: 'Training video for the sales team on new techniques',
    thumbnail: 'https://same-assets.com/thumbnails/video.jpg'
  }
];

// Available categories
const CATEGORIES = [
  'Marketing',
  'Sales',
  'Product',
  'Engineering',
  'Finance',
  'HR',
  'Operations',
  'Legal',
  'Executive',
  'Other'
];

// Available tags
const TAGS = [
  'marketing',
  'strategy',
  'planning',
  'finance',
  'quarterly',
  'report',
  'product',
  'launch',
  'company',
  'policies',
  'handbook',
  'sales',
  'training',
  'video',
  'technical',
  'onboarding',
  'compliance',
  'research',
  'customer',
  'budget'
];

const BatchOperationsSystem = ({ onClose, onBatchUpdate }) => {
  const { t } = useTranslation();
  const [resources, setResources] = useState(MOCK_RESOURCES);
  const [selectedResources, setSelectedResources] = useState([]);
  const [activeOperation, setActiveOperation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    timeRange: 'all'
  });
  const [sortBy, setSortBy] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [newTags, setNewTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPermissions, setNewPermissions] = useState('');
  const [operationResults, setOperationResults] = useState(null);
  const [isApplyingOperations, setIsApplyingOperations] = useState(false);

  // Available operations
  const operations = [
    { id: 'tag', name: 'Add Tags', icon: <TagIcon className="h-5 w-5 text-indigo-600" /> },
    { id: 'categorize', name: 'Change Category', icon: <FolderIcon className="h-5 w-5 text-green-600" /> },
    { id: 'permission', name: 'Update Permissions', icon: <ShieldExclamationIcon className="h-5 w-5 text-amber-600" /> },
    { id: 'download', name: 'Download Resources', icon: <ArrowDownOnSquareIcon className="h-5 w-5 text-blue-600" /> },
    { id: 'duplicate', name: 'Duplicate Resources', icon: <DocumentDuplicateIcon className="h-5 w-5 text-purple-600" /> },
    { id: 'delete', name: 'Delete Resources', icon: <TrashIcon className="h-5 w-5 text-red-600" /> }
  ];

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      toggleSortDirection();
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      timeRange: 'all'
    });
    setSearchQuery('');
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Search happens in real-time as the user types in the processedResources computation
  };

  // Filter and sort resources
  const processedResources = resources
    .filter(resource => {
      // Apply search query
      const matchesSearch = searchQuery === '' ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Apply filters
      const matchesType = filters.type === '' || resource.type === filters.type;
      const matchesCategory = filters.category === '' || resource.category === filters.category;

      // Apply time filter
      let matchesTimeRange = true;
      if (filters.timeRange !== 'all') {
        const resourceDate = new Date(resource.createdAt);
        const now = new Date();
        const timeRangeMap = {
          'today': 1,
          'week': 7,
          'month': 30,
          'quarter': 90,
          'year': 365
        };
        const daysDiff = Math.floor((now - resourceDate) / (1000 * 60 * 60 * 24));
        matchesTimeRange = daysDiff <= timeRangeMap[filters.timeRange];
      }

      return matchesSearch && matchesType && matchesCategory && matchesTimeRange;
    })
    .sort((a, b) => {
      let comparison = 0;

      // Sort by the selected property
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === 'size') {
        const sizeA = parseFloat(a.size);
        const sizeB = parseFloat(b.size);
        comparison = sizeA - sizeB;
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'viewCount') {
        comparison = a.viewCount - b.viewCount;
      } else if (sortBy === 'downloadCount') {
        comparison = a.downloadCount - b.downloadCount;
      }

      // Apply direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Toggle resource selection
  const toggleResourceSelection = (resourceId) => {
    if (selectedResources.includes(resourceId)) {
      setSelectedResources(selectedResources.filter(id => id !== resourceId));
    } else {
      setSelectedResources([...selectedResources, resourceId]);
    }
  };

  // Select all resources
  const selectAllResources = () => {
    if (selectedResources.length === processedResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(processedResources.map(resource => resource.id));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Function to get an appropriate icon for resource type
  const getResourceTypeIcon = (type) => {
    switch(type) {
      case 'article':
        return <DocumentDuplicateIcon className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <DocumentDuplicateIcon className="h-5 w-5 text-red-500" />;
      case 'presentation':
        return <DocumentDuplicateIcon className="h-5 w-5 text-amber-500" />;
      case 'ebook':
        return <DocumentDuplicateIcon className="h-5 w-5 text-green-500" />;
      case 'spreadsheet':
        return <DocumentDuplicateIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Add a tag to the list of new tags
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !newTags.includes(tag)) {
      setNewTags([...newTags, tag]);
      setTagInput('');
    }
  };

  // Remove a tag from the list of new tags
  const removeTag = (tagToRemove) => {
    setNewTags(newTags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input keydown (to add tags on Enter)
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Apply operations to selected resources
  const applyOperations = async () => {
    if (selectedResources.length === 0 || !activeOperation) return;

    setIsApplyingOperations(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Apply the selected operation
      let updatedResources = [...resources];
      const affectedResourcesCount = selectedResources.length;

      switch (activeOperation) {
        case 'tag':
          if (newTags.length > 0) {
            updatedResources = resources.map(resource => {
              if (selectedResources.includes(resource.id)) {
                // Add new tags without duplicates
                const existingTags = resource.tags || [];
                const combinedTags = [...new Set([...existingTags, ...newTags])];
                return { ...resource, tags: combinedTags };
              }
              return resource;
            });

            setOperationResults({
              success: true,
              message: `Added ${newTags.length} tag(s) to ${affectedResourcesCount} resource(s)`,
              details: `Tags added: ${newTags.join(', ')}`
            });
          }
          break;

        case 'categorize':
          if (newCategory) {
            updatedResources = resources.map(resource => {
              if (selectedResources.includes(resource.id)) {
                return { ...resource, category: newCategory };
              }
              return resource;
            });

            setOperationResults({
              success: true,
              message: `Changed category to "${newCategory}" for ${affectedResourcesCount} resource(s)`
            });
          }
          break;

        case 'permission':
          if (newPermissions) {
            updatedResources = resources.map(resource => {
              if (selectedResources.includes(resource.id)) {
                return { ...resource, permissions: newPermissions };
              }
              return resource;
            });

            setOperationResults({
              success: true,
              message: `Updated permissions to "${newPermissions}" for ${affectedResourcesCount} resource(s)`
            });
          }
          break;

        case 'download':
          // In a real app, this would trigger downloads of the selected resources
          setOperationResults({
            success: true,
            message: `Started download of ${affectedResourcesCount} resource(s)`,
            details: "Downloads will begin shortly"
          });
          break;

        case 'duplicate':
          // Create duplicates of selected resources
          const duplicatedResources = [];

          selectedResources.forEach(id => {
            const original = resources.find(r => r.id === id);
            if (original) {
              const duplicate = {
                ...original,
                id: `${original.id}-copy-${Date.now()}`,
                title: `${original.title} (Copy)`,
                createdAt: new Date().toISOString(),
                lastUpdatedAt: new Date().toISOString(),
                viewCount: 0,
                downloadCount: 0
              };
              duplicatedResources.push(duplicate);
            }
          });

          updatedResources = [...resources, ...duplicatedResources];

          setOperationResults({
            success: true,
            message: `Duplicated ${affectedResourcesCount} resource(s)`,
            details: duplicatedResources.map(r => r.title).join(', ')
          });
          break;

        case 'delete':
          // Remove selected resources
          updatedResources = resources.filter(resource => !selectedResources.includes(resource.id));

          setOperationResults({
            success: true,
            message: `Deleted ${affectedResourcesCount} resource(s)`
          });
          break;

        default:
          break;
      }

      // Update state with the modified resources
      setResources(updatedResources);

      // Notify parent component of changes
      if (onBatchUpdate) {
        onBatchUpdate(updatedResources);
      }

      // Clear selection
      setSelectedResources([]);

    } catch (error) {
      console.error('Error applying operations:', error);
      setOperationResults({
        success: false,
        message: 'An error occurred while applying operations',
        details: error.message
      });
    } finally {
      setIsApplyingOperations(false);
    }
  };

  // Render the control panel for the active operation
  const renderOperationControls = () => {
    if (!activeOperation) return null;

    switch (activeOperation) {
      case 'tag':
        return (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-base font-medium text-gray-900 mb-3">Add Tags to Selected Resources</h3>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {newTags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:text-indigo-600 focus:outline-none focus:text-indigo-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-500">Common tags:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {TAGS.slice(0, 10).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!newTags.includes(tag)) {
                          setNewTags([...newTags, tag]);
                        }
                      }}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'categorize':
        return (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-base font-medium text-gray-900 mb-3">Change Category for Selected Resources</h3>
            <div className="max-w-md">
              <select
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'permission':
        return (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-base font-medium text-gray-900 mb-3">Update Permissions for Selected Resources</h3>
            <div className="max-w-md">
              <select
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newPermissions}
                onChange={(e) => setNewPermissions(e.target.value)}
              >
                <option value="">Select permission level</option>
                <option value="private">Private (Owner Only)</option>
                <option value="team">Team</option>
                <option value="department">Department</option>
                <option value="all">All Users</option>
              </select>
            </div>
          </div>
        );

      case 'download':
        return (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-base font-medium text-gray-900 mb-3">Download Selected Resources</h3>
            <p className="text-sm text-gray-500">
              {selectedResources.length} resources will be downloaded as a zip archive.
            </p>
          </div>
        );

      case 'duplicate':
        return (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-base font-medium text-gray-900 mb-3">Duplicate Selected Resources</h3>
            <p className="text-sm text-gray-500">
              {selectedResources.length} resource(s) will be duplicated with "(Copy)" added to the title.
            </p>
          </div>
        );

      case 'delete':
        return (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-base font-medium text-gray-900 mb-3 text-red-600">Delete Selected Resources</h3>
            <p className="text-sm text-gray-500">
              Warning: You are about to delete {selectedResources.length} resource(s). This action cannot be undone.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <ArchiveBoxIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Batch Operations</h2>
            {selectedResources.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {selectedResources.length} selected
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Operation selection bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {operations.map(op => (
              <button
                key={op.id}
                onClick={() => setActiveOperation(activeOperation === op.id ? null : op.id)}
                className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md ${
                  activeOperation === op.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <span className="mr-1.5">{op.icon}</span>
                {op.name}
              </button>
            ))}
          </div>
        </div>

        {/* Operation controls - rendered based on the active operation */}
        {renderOperationControls()}

        {/* Search and filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search resources..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              {/* Resource Type Filter */}
              <div>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="article">Articles</option>
                  <option value="video">Videos</option>
                  <option value="presentation">Presentations</option>
                  <option value="ebook">eBooks</option>
                  <option value="spreadsheet">Spreadsheets</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Time Range Filter */}
              <div>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.timeRange}
                  onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Resources list */}
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={selectedResources.length === processedResources.length && processedResources.length > 0}
                      onChange={selectAllResources}
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('title')}
                  >
                    <div className="flex items-center">
                      <span>Title</span>
                      {sortBy === 'title' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500 -rotate-180" />
                          ) : (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('type')}
                  >
                    <div className="flex items-center">
                      <span>Type</span>
                      {sortBy === 'type' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500 -rotate-180" />
                          ) : (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('size')}
                  >
                    <div className="flex items-center">
                      <span>Size</span>
                      {sortBy === 'size' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500 -rotate-180" />
                          ) : (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('createdAt')}
                  >
                    <div className="flex items-center">
                      <span>Created</span>
                      {sortBy === 'createdAt' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500 -rotate-180" />
                          ) : (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span>Category</span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('viewCount')}
                  >
                    <div className="flex items-center justify-center">
                      <span>Views</span>
                      {sortBy === 'viewCount' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500 -rotate-180" />
                          ) : (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedResources.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No resources found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filters to find resources.
                      </p>
                    </td>
                  </tr>
                ) : (
                  processedResources.map(resource => (
                    <tr
                      key={resource.id}
                      className={`hover:bg-gray-50 ${selectedResources.includes(resource.id) ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={selectedResources.includes(resource.id)}
                          onChange={() => toggleResourceSelection(resource.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-gray-100">
                            {getResourceTypeIcon(resource.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-indigo-600">{resource.title}</div>
                            <div className="text-xs text-gray-500">Created by {resource.createdBy}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                          {resource.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(resource.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {resource.viewCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results message */}
        {operationResults && (
          <div className={`px-6 py-3 border-t border-gray-200 ${
            operationResults.success ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {operationResults.success ? (
                  <CheckIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  operationResults.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {operationResults.message}
                </h3>
                {operationResults.details && (
                  <div className={`mt-2 text-sm ${
                    operationResults.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <p>{operationResults.details}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer with action buttons */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-between items-center">
          <div>
            <button
              onClick={selectAllResources}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50"
            >
              {selectedResources.length === processedResources.length && processedResources.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={applyOperations}
              disabled={selectedResources.length === 0 || !activeOperation || isApplyingOperations}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                selectedResources.length === 0 || !activeOperation || isApplyingOperations
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isApplyingOperations ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </>
              ) : (
                'Apply Operation'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchOperationsSystem;
