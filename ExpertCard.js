import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const ExpertCard = ({ expert }) => {
  // Helper to format price
  const formatPrice = (price) => {
    if (price === 0) return 'Free Consultation';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price) + '/hour';
  };

  // Helper to determine if the expert offers free consultation
  const hasFreeConsultation = expert.freeConsultation;

  // Default image if no profile picture available
  const profileImageUrl = expert.profileImage || 'https://via.placeholder.com/300x300?text=No+Image+Available';

  // Create a display label for the expert type
  const getExpertTypeLabel = (type) => {
    switch (type) {
      case 'legal': return 'Legal Advisor';
      case 'therapy': return 'Therapist';
      case 'counseling': return 'Counselor';
      case 'nutrition': return 'Nutritionist';
      case 'finance': return 'Financial Advisor';
      case 'tutor': return 'Tutor';
      case 'career': return 'Career Coach';
      case 'fitness': return 'Fitness Trainer';
      case 'wellness': return 'Wellness Coach';
      default: return 'Expert';
    }
  };

  // Truncate text for display
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col transition-transform duration-200 hover:transform hover:scale-[1.02] hover:shadow-md">
      <div className="flex p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-shrink-0 mr-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden">
            <Image
              src={profileImageUrl}
              alt={expert.name}
              layout="fill"
              objectFit="cover"
              className="transition-opacity duration-300"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Error+Loading+Image';
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                <Link href={`/experts/${expert.id}`}>
                  {expert.name}
                </Link>
              </h3>

              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                {getExpertTypeLabel(expert.type)}
                {expert.specialization && <span> • {expert.specialization}</span>}
              </div>
            </div>

            {expert.topRated && (
              <div className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                Top Rated
              </div>
            )}
          </div>

          <div className="flex items-center mb-1">
            <div className="text-yellow-400 flex items-center">
              <span className="text-sm font-bold mr-1">{expert.rating?.toFixed(1) || '0.0'}</span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(expert.rating || 0)
                        ? 'text-yellow-400'
                        : i < Math.ceil(expert.rating || 0) && expert.rating % 1 !== 0
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                ))}
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              ({expert.reviewCount || '0'} reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">
          {truncateText(expert.bio || 'No bio available', 150)}
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center mb-1">
            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{expert.experience} years experience</span>
          </div>

          <div className="flex items-center mb-1">
            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{expert.sessionCount || 0} sessions completed</span>
          </div>

          {expert.languages && expert.languages.length > 0 && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{expert.languages.join(', ')}</span>
            </div>
          )}
        </div>

        <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-2 rounded mb-3">
          {expert.nextAvailability ? (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Next available: {expert.nextAvailability}</span>
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Check availability</span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(expert.hourlyRate)}
            </span>

            <Link
              href={`/experts/${expert.id}`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Profile
            </Link>
          </div>

          {hasFreeConsultation && (
            <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
              Offers free 15-minute consultation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertCard;
