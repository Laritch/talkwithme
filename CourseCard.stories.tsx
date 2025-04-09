import type { Meta, StoryObj } from '@storybook/react';
import CourseCard, { Course } from './CourseCard';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Wrap component with necessary providers
const CourseCardWrapper = (props: { course: Course }) => {
  return (
    <BrowserRouter>
      <CourseCard course={props.course} />
    </BrowserRouter>
  );
};

const meta: Meta<typeof CourseCardWrapper> = {
  title: 'Components/Courses/CourseCard',
  component: CourseCardWrapper,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A card component for displaying course information with responsive design and dynamic content.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    course: {
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CourseCardWrapper>;

const defaultCourse: Course = {
  id: '1',
  title: 'Introduction to JavaScript Programming',
  instructor: 'John Doe',
  price: 49.99,
  thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
  rating: 4.5,
  ratingCount: 1250,
  duration: '6h 30m',
  level: 'Beginner',
  category: 'Web Development',
  tags: ['JavaScript', 'Programming', 'Web'],
  discount: null,
  enrolledCount: 3500,
};

export const Default: Story = {
  args: {
    course: defaultCourse,
  },
};

export const WithDiscount: Story = {
  args: {
    course: {
      ...defaultCourse,
      discount: 20,
    },
  },
};

export const BestsellerCourse: Story = {
  args: {
    course: {
      ...defaultCourse,
      enrolledCount: 15000,
      rating: 4.8,
      ratingCount: 4350,
    },
  },
};

export const AdvancedLevel: Story = {
  args: {
    course: {
      ...defaultCourse,
      title: 'Advanced React Patterns and Performance',
      level: 'Advanced',
      price: 89.99,
      category: 'Frontend',
      tags: ['React', 'JavaScript', 'Performance', 'Advanced'],
    },
  },
};

export const ManyTags: Story = {
  args: {
    course: {
      ...defaultCourse,
      tags: ['JavaScript', 'Web Development', 'ES6', 'Node.js', 'React', 'Programming'],
    },
  },
};

export const LongTitle: Story = {
  args: {
    course: {
      ...defaultCourse,
      title: 'Comprehensive JavaScript, React, and Node.js Full Stack Web Development Bootcamp 2025',
    },
  },
};

export const FreeCourse: Story = {
  args: {
    course: {
      ...defaultCourse,
      price: 0,
      title: 'HTML and CSS Basics',
      tags: ['HTML', 'CSS', 'Web Design'],
    },
  },
};

export const NewCourseLowEnrollment: Story = {
  args: {
    course: {
      ...defaultCourse,
      enrolledCount: 42,
      rating: 0,
      ratingCount: 0,
      title: 'Introduction to Web3 and Blockchain Development',
    },
  },
};

export const MinimalData: Story = {
  args: {
    course: {
      id: '9',
      title: 'Minimal Course Data',
    },
  },
};
