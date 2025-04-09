import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Image from 'next/image';

/**
 * Interface representing a course in the system
 */
export interface Course {
  id: string | number;
  title?: string;
  instructor?: string;
  price?: number;
  thumbnail?: string;
  rating?: number;
  ratingCount?: number;
  duration?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  category?: string;
  tags?: string[];
  discount?: number | null;
  enrolledCount?: number;
}

/**
 * Props for the CourseCard component
 */
interface CourseCardProps {
  course: Course;
}

/**
 * CourseCard component displays a course in a card format
 *
 * @param {CourseCardProps} props - The component props
 * @returns {JSX.Element} The rendered component
 */
const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Extract course data with defaults to handle incomplete data
  const {
    id,
    title = 'Untitled Course',
    instructor = 'Unknown Instructor',
    price = 0,
    thumbnail = '/placeholders/course-thumbnail.jpg',
    rating = 0,
    ratingCount = 0,
    duration = '0h 0m',
    level = 'Beginner',
    category = 'Uncategorized',
    tags = [],
    discount = null,
    enrolledCount = 0,
  } = course || {};

  // Calculate discounted price
  const discountedPrice = discount ? price - (price * (discount / 100)) : price;

  // Handle image load completion
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="flex flex-col rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* Thumbnail with blur-up loading effect */}
      <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
        {/* Blur-up placeholder */}
        {!imageLoaded && (
          <div
            className="absolute inset-0 bg-gray-200"
            style={{
              backgroundImage: `url(${thumbnail}?w=20)`, // Very small image for blur effect
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(15px)',
            }}
          />
        )}

        {/* Main image using Next.js Image component */}
        <div className="absolute inset-0">
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoadingComplete={handleImageLoad}
            priority={false}
          />
        </div>

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {discount && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
              {discount}% OFF
            </span>
          )}
          {enrolledCount > 1000 && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
              Bestseller
            </span>
          )}
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10">
          {duration}
        </div>
      </div>

      {/* Course info */}
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs uppercase font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            {category}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {level}
          </span>
        </div>

        <h3 className="font-bold text-gray-800 mb-1 line-clamp-2" title={title}>
          {title}
        </h3>

        <p className="text-sm text-gray-600 mb-2">
          {instructor}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex mr-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500 ml-1">
            ({ratingCount > 1000
              ? `${(ratingCount / 1000).toFixed(1)}k`
              : ratingCount} ratings)
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Price and CTA */}
      <div className="p-4 pt-0 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-gray-800">
              ${discountedPrice.toFixed(2)}
            </span>
            {discount && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
          {enrolledCount > 0 && (
            <span className="text-xs text-gray-500">
              {enrolledCount > 1000
                ? `${(enrolledCount / 1000).toFixed(1)}k students`
                : `${enrolledCount} students`}
            </span>
          )}
        </div>

        <Link
          to={`/courses/${id}`}
          className="block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium rounded transition-colors duration-200"
        >
          View Course
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
