import { useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/userSlice';

const CourseCard = ({ course }) => {
  const dispatch = useDispatch();
  const [imageLoaded, setImageLoaded] = useState(false);
  const wishlist = useSelector(state => state.user.wishlist || []);
  const isInWishlist = wishlist.includes(course.id);

  // Check if the course has a discount
  const hasDiscount = course.originalPrice && course.originalPrice > course.price;
  const discountPercentage = hasDiscount
    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
    : 0;

  // Handle adding to cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart(course));
  };

  // Handle wishlist toggle
  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInWishlist) {
      dispatch(removeFromWishlist(course.id));
    } else {
      dispatch(addToWishlist(course.id));
    }
  };

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="course-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
        {/* Course Image */}
        <div className="relative aspect-video overflow-hidden bg-gray-200 dark:bg-gray-700">
          {/* Blur-up image loading pattern */}
          <div
            className={`absolute inset-0 bg-cover bg-center blur-sm scale-105 transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
            style={{ backgroundImage: `url(${course.thumbnail}?w=10)` }}
          />

          <img
            src={course.thumbnail}
            alt={course.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Bestseller Tag */}
          {course.bestseller && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-gray-800 text-xs font-bold py-1 px-2 rounded">
              Bestseller
            </div>
          )}

          {/* Difficulty Level */}
          {course.level && (
            <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-60 text-white text-xs py-1 px-2 rounded">
              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              className={`w-5 h-5 ${isInWishlist ? 'text-red-500' : 'text-gray-400'}`}
              fill={isInWishlist ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Course Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">
            {course.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {course.instructor || 'Unknown Instructor'}
          </p>

          {/* Rating */}
          <div className="flex items-center mb-2">
            <span className="text-yellow-500 font-bold">{course.rating?.toFixed(1) || '0.0'}</span>
            <div className="ml-1 flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(course.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              ({course.reviewCount || 0})
            </span>
          </div>

          {/* Meta Information */}
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-2">
            {course.totalHours && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {course.totalHours} hours
              </span>
            )}

            {course.lectureCount && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                {course.lectureCount} lectures
              </span>
            )}

            {course.language && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {course.language}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-800 dark:text-white">
                ${course.price?.toFixed(2) || '0.00'}
              </span>

              {hasDiscount && (
                <>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 line-through">
                    ${course.originalPrice.toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                    {discountPercentage}% off
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
