import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseCard, { Course } from './CourseCard';

// Mock react-router-dom's Link component
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  )
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, onLoadingComplete, className } = props;
    // Simulate image load event
    setTimeout(() => {
      if (onLoadingComplete) {
        onLoadingComplete({ naturalWidth: 1200, naturalHeight: 800 });
      }
    }, 0);
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        data-testid="next-image"
      />
    );
  }
}));

describe('CourseCard Component', () => {
  const mockCourse: Course = {
    id: '123',
    title: 'Introduction to TypeScript',
    instructor: 'Jane Doe',
    price: 49.99,
    thumbnail: '/images/typescript-course.jpg',
    rating: 4.7,
    ratingCount: 230,
    duration: '12h 30m',
    level: 'Intermediate',
    category: 'Programming',
    tags: ['TypeScript', 'JavaScript', 'Web Development'],
    discount: 15,
    enrolledCount: 1500,
  };

  it('renders basic course information correctly', () => {
    render(<CourseCard course={mockCourse} />);

    // Test that the main course information is displayed
    expect(screen.getByText('Introduction to TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('12h 30m')).toBeInTheDocument();
  });

  it('displays the correct price and discount', () => {
    render(<CourseCard course={mockCourse} />);

    // Calculate expected discounted price
    const originalPrice = mockCourse.price as number;
    const discount = mockCourse.discount as number;
    const discountedPrice = originalPrice - (originalPrice * (discount / 100));

    // Check that both prices are displayed correctly
    expect(screen.getByText(`$${discountedPrice.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`$${originalPrice.toFixed(2)}`)).toBeInTheDocument();
  });

  it('shows discount badge with correct percentage', () => {
    render(<CourseCard course={mockCourse} />);

    // Check that the discount badge shows correct percentage
    expect(screen.getByText('15% OFF')).toBeInTheDocument();
  });

  it('shows bestseller badge for courses with high enrollment', () => {
    render(<CourseCard course={mockCourse} />);

    // Check that bestseller badge is shown
    expect(screen.getByText('Bestseller')).toBeInTheDocument();
  });

  it('does not show bestseller badge for courses with low enrollment', () => {
    const lowEnrollmentCourse = {
      ...mockCourse,
      enrolledCount: 500, // Below the 1000 threshold
    };

    render(<CourseCard course={lowEnrollmentCourse} />);

    // Check that bestseller badge is not shown
    expect(screen.queryByText('Bestseller')).not.toBeInTheDocument();
  });

  it('formats student count appropriately', () => {
    render(<CourseCard course={mockCourse} />);

    // Check for formatted student count "1.5k students"
    expect(screen.getByText('1.5k students')).toBeInTheDocument();
  });

  it('renders the correct number of tags', () => {
    render(<CourseCard course={mockCourse} />);

    // Check that all tags are displayed
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
  });

  it('limits displayed tags and shows a count for remaining tags', () => {
    const courseWithManyTags = {
      ...mockCourse,
      tags: ['TypeScript', 'JavaScript', 'Web Development', 'React', 'NodeJS'],
    };

    render(<CourseCard course={courseWithManyTags} />);

    // Check that only first 3 tags are displayed and a +2 indicator is shown
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('links to the correct course detail page', () => {
    render(<CourseCard course={mockCourse} />);

    // Check that the link points to the correct course detail page
    const link = screen.getByText('View Course');
    expect(link.closest('a')).toHaveAttribute('href', '/courses/123');
  });

  it('uses default values for missing course information', () => {
    const minimalCourse: Course = {
      id: '456',
    };

    render(<CourseCard course={minimalCourse} />);

    // Check that default values are used for missing information
    expect(screen.getByText('Untitled Course')).toBeInTheDocument();
    expect(screen.getByText('Unknown Instructor')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    expect(screen.getByText('0h 0m')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
