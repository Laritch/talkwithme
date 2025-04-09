import React, { useState, useEffect } from 'react';
import {
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  StarIcon as StarOutlineIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useTranslation } from './i18n';

// Mock feedback data
const MOCK_FEEDBACK = [
  {
    id: 'feedback1',
    userId: 'user1',
    userName: 'John Smith',
    userAvatar: 'https://same-assets.com/avatar/1.jpg',
    rating: 5,
    comment: 'Excellent resource! Exactly what our team needed for the upcoming project.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    helpful: 7,
    unhelpful: 1,
    userRole: 'Product Manager'
  },
  {
    id: 'feedback2',
    userId: 'user2',
    userName: 'Sarah Johnson',
    userAvatar: 'https://same-assets.com/avatar/2.jpg',
    rating: 4,
    comment: 'Very useful content, but could use more detailed examples in section 3.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    helpful: 4,
    unhelpful: 0,
    userRole: 'Marketing Specialist'
  },
  {
    id: 'feedback3',
    userId: 'user3',
    userName: 'Michael Chen',
    userAvatar: 'https://same-assets.com/avatar/3.jpg',
    rating: 3,
    comment: 'Good overview but missing some key points about implementation challenges.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), // 8 days ago
    helpful: 2,
    unhelpful: 1,
    userRole: 'Software Engineer'
  }
];

// Resource stats
const MOCK_RESOURCE_STATS = {
  averageRating: 4.1,
  totalRatings: 12,
  ratingDistribution: {
    5: 6,
    4: 3,
    3: 2,
    2: 1,
    1: 0
  }
};

const ResourceFeedback = ({
  resourceId,
  resourceTitle,
  resourceType,
  onClose
}) => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState(MOCK_FEEDBACK);
  const [stats, setStats] = useState(MOCK_RESOURCE_STATS);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest', 'helpful'
  const [filter, setFilter] = useState('all'); // 'all', 'positive', 'negative'

  // Sort and filter feedback
  const processedFeedback = feedback
    .filter(item => {
      if (filter === 'all') return true;
      if (filter === 'positive') return item.rating >= 4;
      if (filter === 'negative') return item.rating <= 2;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'helpful') return (b.helpful - b.unhelpful) - (a.helpful - a.unhelpful);
      return 0;
    });

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Submit feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (userRating === 0) return; // Require a rating

    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create new feedback
      const newFeedback = {
        id: `feedback${feedback.length + 1}`,
        userId: 'currentUser',
        userName: 'You',
        userAvatar: 'https://same-assets.com/avatar/default.jpg',
        rating: userRating,
        comment: userComment,
        createdAt: new Date().toISOString(),
        helpful: 0,
        unhelpful: 0,
        userRole: 'Current User'
      };

      // Add to feedback list
      setFeedback([newFeedback, ...feedback]);

      // Update stats
      const totalRatings = stats.totalRatings + 1;
      const totalRatingPoints = (stats.averageRating * stats.totalRatings) + userRating;
      const newAverage = totalRatingPoints / totalRatings;

      const newDistribution = { ...stats.ratingDistribution };
      newDistribution[userRating] = (newDistribution[userRating] || 0) + 1;

      setStats({
        averageRating: newAverage,
        totalRatings,
        ratingDistribution: newDistribution
      });

      // Reset form
      setUserRating(0);
      setUserComment('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Mark feedback as helpful/unhelpful
  const markFeedback = async (feedbackId, isHelpful) => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setFeedback(feedback.map(item => {
        if (item.id === feedbackId) {
          return {
            ...item,
            helpful: isHelpful ? item.helpful + 1 : item.helpful,
            unhelpful: !isHelpful ? item.unhelpful + 1 : item.unhelpful
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error marking feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Feedback & Ratings</h2>
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
          {resourceType && (
            <p className="text-sm text-gray-500 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {resourceType}
              </span>
            </p>
          )}
        </div>

        <div className="divide-y divide-gray-200">
          {/* Rating Summary */}
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Summary</h3>
            <div className="flex flex-col md:flex-row">
              <div className="flex-shrink-0 flex flex-col items-center mb-4 md:mb-0 md:mr-8">
                <div className="text-5xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                <div className="flex items-center mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarSolidIcon
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(stats.averageRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stats.totalRatings} ratings</div>
              </div>

              <div className="flex-grow">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats.ratingDistribution[rating] || 0;
                  const percentage = stats.totalRatings > 0
                    ? (count / stats.totalRatings) * 100
                    : 0;

                  return (
                    <div key={rating} className="flex items-center mb-2">
                      <div className="text-sm font-medium text-gray-700 w-6">{rating}</div>
                      <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-2" />
                      <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-500 ml-2 w-10 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Feedback */}
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rate & Review</h3>
            <form onSubmit={handleSubmitFeedback}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setUserRating(rating)}
                      onMouseEnter={() => setHoverRating(rating)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none"
                    >
                      {(hoverRating || userRating) >= rating ? (
                        <StarSolidIcon className="h-8 w-8 text-yellow-400" />
                      ) : (
                        <StarOutlineIcon className="h-8 w-8 text-gray-400 hover:text-yellow-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review (optional)
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Share your thoughts on this resource..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={userRating === 0 || submitting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 ${
                    userRating === 0 || submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Feedback List */}
          <div className="px-6 py-4">
            <div className="flex flex-wrap justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">User Reviews</h3>
              <div className="flex mt-2 sm:mt-0">
                <div className="mr-4">
                  <label htmlFor="sort" className="sr-only">Sort by</label>
                  <select
                    id="sort"
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter" className="sr-only">Filter</label>
                  <select
                    id="filter"
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Reviews</option>
                    <option value="positive">Positive Only</option>
                    <option value="negative">Critical Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reviews */}
            {processedFeedback.length === 0 ? (
              <div className="text-center py-8">
                <FaceSmileIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No reviews yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Be the first to share your thoughts on this resource.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {processedFeedback.map(item => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {item.userAvatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={item.userAvatar}
                              alt={item.userName}
                            />
                          ) : (
                            <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{item.userName}</p>
                          {item.userRole && (
                            <p className="text-xs text-gray-500">{item.userRole}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <StarSolidIcon
                              key={star}
                              className={`h-5 w-5 ${
                                star <= item.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="ml-2">
                          {item.rating >= 4 ? (
                            <span className="inline-flex items-center text-sm text-green-600">
                              <FaceSmileIcon className="h-4 w-4 mr-1" />
                              {item.rating === 5 ? 'Excellent' : 'Good'}
                            </span>
                          ) : item.rating <= 2 ? (
                            <span className="inline-flex items-center text-sm text-red-600">
                              <FaceFrownIcon className="h-4 w-4 mr-1" />
                              {item.rating === 1 ? 'Poor' : 'Needs Improvement'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-sm text-yellow-600">
                              Average
                            </span>
                          )}
                        </div>
                      </div>
                      {item.comment && (
                        <p className="text-gray-700 text-sm mt-2">{item.comment}</p>
                      )}

                      <div className="mt-4 flex space-x-4 text-sm">
                        <button
                          onClick={() => markFeedback(item.id, true)}
                          disabled={loading}
                          className={`flex items-center text-gray-500 hover:text-gray-700 ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <HandThumbUpIcon className="h-4 w-4 mr-1" />
                          Helpful ({item.helpful})
                        </button>
                        <button
                          onClick={() => markFeedback(item.id, false)}
                          disabled={loading}
                          className={`flex items-center text-gray-500 hover:text-gray-700 ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <HandThumbDownIcon className="h-4 w-4 mr-1" />
                          Not Helpful ({item.unhelpful})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceFeedback;
