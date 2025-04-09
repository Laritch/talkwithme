import React, { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BookmarkIcon,
  CalendarIcon,
  DocumentTextIcon,
  FolderIcon,
  TagIcon,
  UserIcon,
  CheckIcon,
  ChevronDownIcon,
  LightBulbIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from './i18n';

// Mock resources for demo
const MOCK_RESOURCES = [
  {
    id: 'res1',
    title: 'Marketing Strategy 2023',
    description: 'Comprehensive marketing strategy for the fiscal year 2023 with action plans for each quarter.',
    type: 'presentation',
    category: 'Marketing',
    tags: ['marketing', 'strategy', 'planning'],
    author: 'Sarah Johnson',
    createdAt: '2023-06-15T10:30:00Z',
    lastUpdated: '2023-07-20T14:15:00Z'
  },
  {
    id: 'res2',
    title: 'Q2 Financial Report',
    description: 'Detailed financial performance report for Q2 2023 including revenue, expenses, and profit analysis.',
    type: 'spreadsheet',
    category: 'Finance',
    tags: ['finance', 'quarterly', 'report'],
    author: 'Michael Chen',
    createdAt: '2023-07-10T09:45:00Z',
    lastUpdated: '2023-07-12T11:30:00Z'
  },
  {
    id: 'res3',
    title: 'Product Launch Plan',
    description: 'Step-by-step plan for launching our new product line in September, including marketing and distribution.',
    type: 'article',
    category: 'Product',
    tags: ['product', 'launch', 'planning'],
    author: 'Jessica Williams',
    createdAt: '2023-05-28T13:20:00Z',
    lastUpdated: '2023-06-14T10:05:00Z'
  },
  {
    id: 'res4',
    title: 'Company Handbook',
    description: 'Official company handbook with policies, procedures, and guidelines for all employees.',
    type: 'ebook',
    category: 'HR',
    tags: ['company', 'policies', 'handbook'],
    author: 'David Kim',
    createdAt: '2023-01-15T11:10:00Z',
    lastUpdated: '2023-04-30T16:20:00Z'
  },
  {
    id: 'res5',
    title: 'Sales Training Video',
    description: 'Training video for the sales team covering new techniques and best practices for customer engagement.',
    type: 'video',
    category: 'Sales',
    tags: ['sales', 'training', 'video'],
    author: 'John Smith',
    createdAt: '2023-03-20T14:30:00Z',
    lastUpdated: '2023-03-20T14:30:00Z'
  }
];

// Resource types
const RESOURCE_TYPES = [
  { id: 'all', name: 'All Types' },
  { id: 'article', name: 'Articles' },
  { id: 'video', name: 'Videos' },
  { id: 'presentation', name: 'Presentations' },
  { id: 'ebook', name: 'eBooks' },
  { id: 'spreadsheet', name: 'Spreadsheets' }
];

// Categories
const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'finance', name: 'Finance' },
  { id: 'hr', name: 'HR' },
  { id: 'product', name: 'Product' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'operations', name: 'Operations' }
];

// Time periods
const TIME_PERIODS = [
  { id: 'anytime', name: 'Anytime' },
  { id: 'today', name: 'Today' },
  { id: 'this_week', name: 'This Week' },
  { id: 'this_month', name: 'This Month' },
  { id: 'this_quarter', name: 'This Quarter' },
  { id: 'this_year', name: 'This Year' }
];

// Example NLP suggestions based on query
const NLP_SUGGESTIONS = {
  'marketing': [
    'Show me marketing documents from last quarter',
    'Find presentations about marketing strategy',
    'Recent marketing materials created by Sarah'
  ],
  'financial': [
    'Get all financial reports from this year',
    'Show me spreadsheets with quarterly financial data',
    'Find budget planning documents'
  ],
  'training': [
    'Find all training videos',
    'Show onboarding materials for new employees',
    'Get sales training documents'
  ],
  'product': [
    'Show product launch documents from this year',
    'Find product specifications and manuals',
    'Get product roadmap presentations'
  ]
};

const AdvancedSearchNLP = ({ onClose, onSearch }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    timeFrame: 'anytime',
    tags: []
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [highlightedTerms, setHighlightedTerms] = useState([]);
  const searchInputRef = useRef(null);

  // Get NLP suggestions based on query
  useEffect(() => {
    if (query.length > 3) {
      // Simple keyword matching for the demo
      const keywordMatch = Object.keys(NLP_SUGGESTIONS).find(keyword =>
        query.toLowerCase().includes(keyword)
      );

      if (keywordMatch) {
        setSuggestions(NLP_SUGGESTIONS[keywordMatch]);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  // Update filter
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Add tag to filters
  const addTag = (tag) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Remove tag from filters
  const removeTag = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      timeFrame: 'anytime',
      tags: []
    });
  };

  // Perform search with current query and filters
  const performSearch = () => {
    setLoading(true);
    setShowSuggestions(false);

    // Extract potential terms to highlight from the query
    const terms = query.toLowerCase().split(' ').filter(term => term.length > 3);
    setHighlightedTerms(terms);

    // Simulate NLP processing and filtering
    setTimeout(() => {
      let filteredResults = [...MOCK_RESOURCES];

      // Apply text search if query exists
      if (query) {
        const queryLower = query.toLowerCase();
        filteredResults = filteredResults.filter(resource =>
          resource.title.toLowerCase().includes(queryLower) ||
          resource.description.toLowerCase().includes(queryLower) ||
          resource.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
          resource.author.toLowerCase().includes(queryLower)
        );
      }

      // Apply type filter
      if (filters.type !== 'all') {
        filteredResults = filteredResults.filter(resource => resource.type === filters.type);
      }

      // Apply category filter
      if (filters.category !== 'all') {
        filteredResults = filteredResults.filter(resource =>
          resource.category.toLowerCase() === filters.category.toLowerCase()
        );
      }

      // Apply time filter
      if (filters.timeFrame !== 'anytime') {
        const now = new Date();
        let startDate;

        switch(filters.timeFrame) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'this_week':
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            break;
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'this_quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = null;
        }

        if (startDate) {
          filteredResults = filteredResults.filter(resource =>
            new Date(resource.createdAt) >= startDate
          );
        }
      }

      // Apply tag filters
      if (filters.tags.length > 0) {
        filteredResults = filteredResults.filter(resource =>
          filters.tags.some(tag => resource.tags.includes(tag))
        );
      }

      setResults(filteredResults);
      setLoading(false);

      // Notify parent component if provided
      if (onSearch) {
        onSearch(filteredResults);
      }
    }, 1000); // Simulate processing delay
  };

  // Apply suggestion as search query
  const applySuggestion = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    // Focus on the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Highlight search terms in text
  const highlightText = (text, terms) => {
    if (!terms.length) return text;

    let highlightedText = text;
    terms.forEach(term => {
      if (term.length < 3) return; // Skip very short terms

      const regex = new RegExp(term, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        match => `<span class="bg-yellow-100 font-medium">${match}</span>`
      );
    });

    return highlightedText;
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Advanced Search</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                ref={searchInputRef}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search using natural language (e.g., 'show me marketing documents from last quarter')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    performSearch();
                  }
                }}
              />
              {query && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setQuery('')}
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                </button>
              )}

              {/* NLP Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10 border border-gray-200">
                  <div className="p-2 border-b border-gray-200 flex items-center">
                    <SparklesIcon className="h-5 w-5 text-indigo-500 mr-1" />
                    <span className="text-xs font-medium text-gray-700">Suggestions</span>
                  </div>
                  <ul className="py-1 max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  showFilters
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1 text-gray-500" />
                Filters
              </button>
              <button
                onClick={performSearch}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-1" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Resource Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type
                </label>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  {RESOURCE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  {CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Time Frame Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.timeFrame}
                  onChange={(e) => handleFilterChange('timeFrame', e.target.value)}
                >
                  {TIME_PERIODS.map(period => (
                    <option key={period.id} value={period.id}>{period.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
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
              <div className="flex flex-wrap gap-2 mt-2">
                {['marketing', 'finance', 'product', 'sales', 'training', 'strategy', 'report', 'planning'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={filters.tags.includes(tag)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      filters.tags.includes(tag)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filters button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Search results */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-3"></div>
                <p className="text-sm text-gray-500">Analyzing your query and searching...</p>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {results.length} {results.length === 1 ? 'result' : 'results'} found
                </h3>
              </div>
              <div className="space-y-4">
                {results.map(resource => (
                  <div key={resource.id} className="bg-white shadow overflow-hidden rounded-md border border-gray-200 hover:border-indigo-300">
                    <div className="px-6 py-4">
                      <div className="flex justify-between">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                            {resource.type === 'article' && <DocumentTextIcon className="h-6 w-6" />}
                            {resource.type === 'video' && <DocumentTextIcon className="h-6 w-6" />}
                            {resource.type === 'presentation' && <DocumentTextIcon className="h-6 w-6" />}
                            {resource.type === 'ebook' && <DocumentTextIcon className="h-6 w-6" />}
                            {resource.type === 'spreadsheet' && <DocumentTextIcon className="h-6 w-6" />}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <h4 className="text-lg font-medium text-indigo-600 truncate">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(resource.title, highlightedTerms)
                                }}
                              />
                            </h4>
                            <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                              <span className="capitalize mr-3">{resource.type}</span>
                              <span className="mr-3">•</span>
                              <span className="mr-3">{resource.category}</span>
                              <span className="mr-3">•</span>
                              <span>By {resource.author}</span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(resource.description, highlightedTerms)
                                }}
                              />
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resource.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : query ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search query or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <LightBulbIcon className="mx-auto h-12 w-12 text-yellow-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Search using natural language</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try queries like "show me marketing presentations from last quarter" or "find budget reports created by Michael"
              </p>
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Example searches:</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'Show me recent marketing documents',
                    'Find financial reports from this year',
                    'Training videos created last month',
                    'Product launch plans'
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(example);
                        performSearch();
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchNLP;
