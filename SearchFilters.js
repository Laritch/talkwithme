import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter, resetFilters, setSortOption } from '../../store/slices/uiSlice';

const SearchFilters = ({ totalResults, activeCategory = null }) => {
  const dispatch = useDispatch();
  const filters = useSelector(state => state.ui.filters);
  const sortOption = useSelector(state => state.ui.sortOption);

  const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 1000]);
  const [expandedSections, setExpandedSections] = useState({
    ratings: true,
    price: true,
    duration: true,
    level: true,
    language: true,
  });

  // Reset local state when global filters change
  useEffect(() => {
    setPriceRange(filters.priceRange || [0, 1000]);
  }, [filters.priceRange]);

  // Rating options
  const ratingOptions = [
    { value: 4.5, label: '4.5 & up' },
    { value: 4.0, label: '4.0 & up' },
    { value: 3.5, label: '3.5 & up' },
    { value: 3.0, label: '3.0 & up' },
  ];

  // Duration options
  const durationOptions = [
    { value: 'short', label: 'Short (0-3 hours)' },
    { value: 'medium', label: 'Medium (3-6 hours)' },
    { value: 'long', label: 'Long (6-17 hours)' },
    { value: 'extra_long', label: 'Extra Long (17+ hours)' },
  ];

  // Level options
  const levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'all_levels', label: 'All Levels' },
  ];

  // Language options
  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'chinese', label: 'Chinese' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'ratings', label: 'Highest Rated' },
  ];

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle price range change
  const handlePriceRangeChange = (index, value) => {
    const newRange = [...priceRange];
    newRange[index] = Number(value);
    setPriceRange(newRange);
  };

  // Apply price range filter
  const applyPriceRangeFilter = () => {
    dispatch(setFilter({ filterName: 'priceRange', value: priceRange }));
  };

  // Handle rating selection
  const handleRatingSelect = (rating) => {
    dispatch(setFilter({ filterName: 'ratings', value: rating }));
  };

  // Handle duration selection
  const handleDurationSelect = (duration) => {
    dispatch(setFilter({ filterName: 'duration', value: duration }));
  };

  // Handle level selection
  const handleLevelSelect = (level) => {
    dispatch(setFilter({ filterName: 'level', value: level }));
  };

  // Handle language selection
  const handleLanguageSelect = (language) => {
    dispatch(setFilter({ filterName: 'language', value: language }));
  };

  // Handle sort change
  const handleSortChange = (e) => {
    dispatch(setSortOption(e.target.value));
  };

  // Reset all filters
  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.ratings) count++;
    if (filters.duration) count++;
    if (filters.level) count++;
    if (filters.language) count++;
    if (filters.priceRange &&
        (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000)) count++;
    return count;
  };

  const activeFiltersCount = countActiveFilters();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Filter Results
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalResults} {totalResults === 1 ? 'result' : 'results'}
            {activeCategory && ` in "${activeCategory}"`}
          </p>
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear filters ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Sort Options */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <label htmlFor="sort-options" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sort By
        </label>
        <select
          id="sort-options"
          value={sortOption}
          onChange={handleSortChange}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 dark:text-gray-300"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Rating Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => toggleSection('ratings')}
          className="flex justify-between items-center w-full mb-2"
        >
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ratings
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.ratings ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.ratings && (
          <div className="mt-2 space-y-2">
            {ratingOptions.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`rating-${option.value}`}
                  name="rating"
                  value={option.value}
                  checked={filters.ratings === option.value}
                  onChange={() => handleRatingSelect(option.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`rating-${option.value}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <div className="flex items-center">
                    <span className="mr-1">{option.value}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= option.value ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </label>
              </div>
            ))}
            {filters.ratings && (
              <button
                onClick={() => handleRatingSelect(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear rating filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => toggleSection('price')}
          className="flex justify-between items-center w-full mb-2"
        >
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Price
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.price ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.price && (
          <div className="mt-2 space-y-4">
            <div className="flex space-x-2">
              <div>
                <label htmlFor="price-min" className="block text-xs text-gray-500 dark:text-gray-400">
                  Min Price
                </label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    id="price-min"
                    value={priceRange[0]}
                    min={0}
                    max={priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(0, e.target.value)}
                    className="pl-6 block w-full py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="price-max" className="block text-xs text-gray-500 dark:text-gray-400">
                  Max Price
                </label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    id="price-max"
                    value={priceRange[1]}
                    min={priceRange[0]}
                    onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                    className="pl-6 block w-full py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={applyPriceRangeFilter}
              className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Apply
            </button>

            {(filters.priceRange &&
              (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000)) && (
              <button
                onClick={() => {
                  setPriceRange([0, 1000]);
                  dispatch(setFilter({ filterName: 'priceRange', value: [0, 1000] }));
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear price filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Duration Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => toggleSection('duration')}
          className="flex justify-between items-center w-full mb-2"
        >
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Course Length
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.duration ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.duration && (
          <div className="mt-2 space-y-2">
            {durationOptions.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`duration-${option.value}`}
                  name="duration"
                  value={option.value}
                  checked={filters.duration === option.value}
                  onChange={() => handleDurationSelect(option.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`duration-${option.value}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
              </div>
            ))}
            {filters.duration && (
              <button
                onClick={() => handleDurationSelect(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear duration filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Level Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => toggleSection('level')}
          className="flex justify-between items-center w-full mb-2"
        >
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Level
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.level ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.level && (
          <div className="mt-2 space-y-2">
            {levelOptions.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`level-${option.value}`}
                  name="level"
                  value={option.value}
                  checked={filters.level === option.value}
                  onChange={() => handleLevelSelect(option.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`level-${option.value}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
              </div>
            ))}
            {filters.level && (
              <button
                onClick={() => handleLevelSelect(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear level filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Language Filter */}
      <div className="p-4">
        <button
          onClick={() => toggleSection('language')}
          className="flex justify-between items-center w-full mb-2"
        >
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Language
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.language ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.language && (
          <div className="mt-2 space-y-2">
            {languageOptions.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`language-${option.value}`}
                  name="language"
                  value={option.value}
                  checked={filters.language === option.value}
                  onChange={() => handleLanguageSelect(option.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`language-${option.value}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
              </div>
            ))}
            {filters.language && (
              <button
                onClick={() => handleLanguageSelect(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear language filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;
