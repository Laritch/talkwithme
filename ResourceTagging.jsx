import React, { useState, useEffect, useRef } from 'react';
import {
  TagIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from './i18n';

// Mock tags data
const MOCK_TAGS = [
  { id: 'tag1', name: 'Marketing', count: 12 },
  { id: 'tag2', name: 'Finance', count: 8 },
  { id: 'tag3', name: 'Sales', count: 15 },
  { id: 'tag4', name: 'Product', count: 10 },
  { id: 'tag5', name: 'Design', count: 7 },
  { id: 'tag6', name: 'Engineering', count: 9 },
  { id: 'tag7', name: 'HR', count: 5 },
  { id: 'tag8', name: 'Strategy', count: 11 },
  { id: 'tag9', name: 'Operations', count: 6 },
  { id: 'tag10', name: 'Research', count: 4 }
];

// Mock suggested tags based on resource content
const MOCK_SUGGESTED_TAGS = [
  { id: 'suggested1', name: 'Q2 Results', confidence: 0.92 },
  { id: 'suggested2', name: 'Revenue Growth', confidence: 0.87 },
  { id: 'suggested3', name: 'Financial Analysis', confidence: 0.85 },
  { id: 'suggested4', name: 'Quarterly Report', confidence: 0.82 },
  { id: 'suggested5', name: 'Projections', confidence: 0.78 }
];

const ResourceTagging = ({
  resourceId,
  initialTags = [],
  onClose,
  onTagsUpdate,
  resourceTitle,
  resourceType,
  resourceContent
}) => {
  const { t } = useTranslation();
  const [tags, setTags] = useState(MOCK_TAGS);
  const [resourceTags, setResourceTags] = useState(initialTags);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState(MOCK_SUGGESTED_TAGS);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const newTagInputRef = useRef(null);

  // Filter tags based on search query
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available tags (those not already added to the resource)
  const availableTags = filteredTags.filter(tag =>
    !resourceTags.some(rt => rt.id === tag.id)
  );

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Filter is handled by the filteredTags computed value
  };

  // Add a tag to the resource
  const addTagToResource = async (tagId) => {
    const tagToAdd = tags.find(t => t.id === tagId);
    if (!tagToAdd) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setResourceTags([...resourceTags, tagToAdd]);

      // Update parent component if needed
      if (onTagsUpdate) {
        onTagsUpdate([...resourceTags, tagToAdd]);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove a tag from the resource
  const removeTagFromResource = async (tagId) => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedTags = resourceTags.filter(tag => tag.id !== tagId);
      setResourceTags(updatedTags);

      // Update parent component if needed
      if (onTagsUpdate) {
        onTagsUpdate(updatedTags);
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new tag
  const createNewTag = async (e) => {
    e.preventDefault();

    if (!newTagName.trim()) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create new tag
      const newTag = {
        id: `tag${tags.length + 1}`,
        name: newTagName.trim(),
        count: 1
      };

      // Add to global tags
      setTags([...tags, newTag]);

      // Add to resource tags
      setResourceTags([...resourceTags, newTag]);

      // Update parent component if needed
      if (onTagsUpdate) {
        onTagsUpdate([...resourceTags, newTag]);
      }

      // Reset form
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate tag suggestions from content
  const generateTagSuggestions = async () => {
    setIsGeneratingSuggestions(true);

    try {
      // In a real app, this would call an AI API to analyze the content
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo, we'll just use our mock data
      // In a real app, this would return tags based on actual content analysis
      setSuggestedTags(MOCK_SUGGESTED_TAGS);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Apply a suggested tag
  const applySuggestedTag = (tag) => {
    // Check if we already have this tag (by name)
    const existingTag = tags.find(t =>
      t.name.toLowerCase() === tag.name.toLowerCase()
    );

    if (existingTag) {
      // If we have the tag but it's not on the resource yet, add it
      if (!resourceTags.some(rt => rt.id === existingTag.id)) {
        addTagToResource(existingTag.id);
      }
    } else {
      // Create and add the tag
      setNewTagName(tag.name);
      // Focus the input to make it easy to submit the form
      if (newTagInputRef.current) {
        newTagInputRef.current.focus();
      }
    }
  };

  // Apply all suggested tags at once
  const applyAllSuggestions = async () => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedResourceTags = [...resourceTags];
      let tagsAdded = false;

      for (const suggestedTag of suggestedTags) {
        // Check if we already have this tag (by name)
        const existingTag = tags.find(t =>
          t.name.toLowerCase() === suggestedTag.name.toLowerCase()
        );

        if (existingTag) {
          // If we have the tag but it's not on the resource yet, add it
          if (!updatedResourceTags.some(rt => rt.id === existingTag.id)) {
            updatedResourceTags.push(existingTag);
            tagsAdded = true;
          }
        } else {
          // Create new tag
          const newTag = {
            id: `tag${tags.length + updatedResourceTags.length + 1}`,
            name: suggestedTag.name,
            count: 1
          };

          // Add to resource tags
          updatedResourceTags.push(newTag);
          tagsAdded = true;
        }
      }

      if (tagsAdded) {
        setResourceTags(updatedResourceTags);

        // Update parent component if needed
        if (onTagsUpdate) {
          onTagsUpdate(updatedResourceTags);
        }
      }
    } catch (error) {
      console.error('Error applying suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load suggestions when component mounts
  useEffect(() => {
    generateTagSuggestions();
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <TagIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Manage Tags</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Resource Info */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{resourceTitle}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {resourceType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                {resourceType}
              </span>
            )}
            {resourceTags.length > 0 ? (
              <span>{resourceTags.length} tags applied</span>
            ) : (
              <span>No tags applied yet</span>
            )}
          </p>
        </div>

        <div className="p-6">
          {/* Current tags */}
          <div className="mb-6">
            <h4 className="text-base font-medium text-gray-900 mb-3">Current Tags</h4>
            {resourceTags.length === 0 ? (
              <p className="text-sm text-gray-500">No tags have been added to this resource yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {resourceTags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag.name}
                    <button
                      onClick={() => removeTagFromResource(tag.id)}
                      disabled={loading}
                      className={`ml-1.5 text-indigo-400 hover:text-indigo-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI-suggested tags */}
          <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-medium text-gray-900 flex items-center">
                <SparklesIcon className="h-5 w-5 text-blue-500 mr-1.5" />
                AI-Suggested Tags
              </h4>
              <button
                onClick={generateTagSuggestions}
                disabled={isGeneratingSuggestions}
                className={`text-xs flex items-center text-blue-600 hover:text-blue-800 ${
                  isGeneratingSuggestions ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 mr-1 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
                Refresh suggestions
              </button>
            </div>

            {isGeneratingSuggestions ? (
              <div className="flex justify-center items-center h-24">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-sm text-gray-500">Analyzing content...</p>
                </div>
              </div>
            ) : suggestedTags.length === 0 ? (
              <p className="text-sm text-gray-500">No suggestions available for this content.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestedTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => applySuggestedTag(tag)}
                      disabled={loading}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {tag.name}
                      <span className="ml-1.5 text-xs text-blue-400">
                        {Math.round(tag.confidence * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={applyAllSuggestions}
                  disabled={loading || suggestedTags.length === 0}
                  className={`text-sm flex items-center text-blue-700 hover:text-blue-900 font-medium ${
                    loading || suggestedTags.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Apply all suggestions
                </button>
              </>
            )}
          </div>

          {/* Add existing tag */}
          <div className="mb-6">
            <h4 className="text-base font-medium text-gray-900 mb-3">Add Existing Tag</h4>
            <form onSubmit={handleSearch} className="relative flex mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tags..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : availableTags.length === 0 ? (
              <p className="text-sm text-gray-500 py-3">
                {searchQuery ? 'No matching tags found.' : 'No additional tags available.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => addTagToResource(tag.id)}
                    disabled={loading}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {tag.name}
                    <span className="ml-1.5 text-xs text-gray-500">
                      {tag.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create new tag */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-3">Create New Tag</h4>
            <form onSubmit={createNewTag} className="flex">
              <div className="relative flex-1 mr-3">
                <input
                  type="text"
                  placeholder="Enter new tag name..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  ref={newTagInputRef}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={!newTagName.trim() || loading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 ${
                  !newTagName.trim() || loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create Tag
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceTagging;
