import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Components
import Layout from '../../components/Layout';
import SearchFilters from '../../components/expert/SearchFilters';
import ExpertCard from '../../components/expert/ExpertCard';

// Services
import { expertAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { query } = router.query;

  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({});
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const resultsPerPage = 12;

  // Fetch search results when query or filters change
  useEffect(() => {
    const searchExperts = async () => {
      if (!router.isReady) return;

      setIsLoading(true);
      setError('');

      try {
        // Extract filter parameters from URL
        const {
          query,
          category,
          subcategory,
          priceRange,
          rating,
          expertise,
          availability,
          language,
          sortBy,
          page = 1
        } = router.query;

        // Build search parameters
        const searchParams = {
          ...(query && { query }),
          ...(category && { category }),
          ...(subcategory && { subcategory }),
          ...(priceRange && { priceRange }),
          ...(rating && { rating }),
          ...(expertise && { expertise }),
          ...(availability && { availability }),
          ...(language && { language }),
          ...(sortBy && { sortBy }),
          page: parseInt(page, 10),
          limit: resultsPerPage
        };

        // Update filters state
        setFilters({
          category,
          subcategory,
          priceRange,
          rating,
          expertise,
          availability,
          language,
          sortBy
        });

        // Update current page
        setCurrentPage(parseInt(page, 10) || 1);

        // Save search query to user history if authenticated
        if (query && isAuthenticated) {
          try {
            await userAPI.saveSearchHistory(query);
          } catch (err) {
            console.error('Error saving search history:', err);
          }
        }

        // Fetch search results
        const response = await expertAPI.searchExperts(searchParams);

        setSearchResults(response.data.experts);
        setTotalResults(response.data.total);
        setTotalPages(Math.ceil(response.data.total / resultsPerPage));
      } catch (err) {
        console.error('Error searching experts:', err);
        setError(
          err.response?.data?.message ||
          'Failed to search experts. Please try again.'
        );
        setSearchResults([]);
        setTotalResults(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    searchExperts();
  }, [router.isReady, router.query, isAuthenticated]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    // Filters are applied through the SearchFilters component
    // which updates the URL, triggering the useEffect above
    setFilters(newFilters);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;

    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set('page', page);

    router.push({
      pathname: router.pathname,
      search: queryParams.toString()
    }, undefined, { shallow: true });
  };

  return (
    <Layout>
      <div className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {query
              ? `Search Results for "${query}"`
              : 'Browse Programs'
            }
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalResults} {totalResults === 1 ? 'program' : 'programs'} found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <SearchFilters
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
          </div>

          {/* Search results */}
          <div className="flex-1">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              // Loading state
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="h-40 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              // No results
              <div className="py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No results found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {query
                    ? `We couldn't find any programs matching "${query}". Try different keywords or filters.`
                    : 'Try different filters to find programs.'}
                </p>
                <div className="mt-6">
                  <Link
                    href="/programs"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Browse all programs
                  </Link>
                </div>
              </div>
            ) : (
              // Search results
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map(program => (
                    <ExpertCard key={program.id} expert={program} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center space-x-2" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-md ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Page numbers - show limited page numbers with ellipsis */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first and last page
                          if (page === 1 || page === totalPages) return true;
                          // Show pages around current page
                          if (Math.abs(page - currentPage) <= 1) return true;
                          // Show one page after first if needed
                          if (page === 2 && currentPage <= 3) return true;
                          // Show one page before last if needed
                          if (page === totalPages - 1 && currentPage >= totalPages - 2) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          // Add ellipsis where needed
                          if (index > 0 && array[index] - array[index - 1] > 1) {
                            return (
                              <span key={`ellipsis-${page}`} className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                ...
                              </span>
                            );
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              aria-current={currentPage === page ? 'page' : undefined}
                              className={`px-3 py-2 rounded-md ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-md ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
