import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CourseList from './CourseList';
import coursesReducer from '@/store/slices/coursesSlice';
import chatReducer from '@/store/slices/chatSlice';
import { Course } from './CourseCard';

// Create a mock store with initial state for Storybook
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to JavaScript',
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
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    instructor: 'Jane Smith',
    price: 79.99,
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2',
    rating: 4.8,
    ratingCount: 850,
    duration: '8h 15m',
    level: 'Advanced',
    category: 'Web Development',
    tags: ['React', 'JavaScript', 'Frontend'],
    discount: 20,
    enrolledCount: 1800,
  },
  {
    id: '3',
    title: 'Python for Data Science',
    instructor: 'Robert Johnson',
    price: 69.99,
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935',
    rating: 4.6,
    ratingCount: 2100,
    duration: '10h 45m',
    level: 'Intermediate',
    category: 'Data Science',
    tags: ['Python', 'Data Analysis', 'Machine Learning'],
    discount: null,
    enrolledCount: 5200,
  },
  {
    id: '4',
    title: 'UI/UX Design Fundamentals',
    instructor: 'Sarah Williams',
    price: 59.99,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
    rating: 4.7,
    ratingCount: 1800,
    duration: '7h 20m',
    level: 'Beginner',
    category: 'Design',
    tags: ['UI/UX', 'Design', 'Figma'],
    discount: 15,
    enrolledCount: 2900,
  },
  {
    id: '5',
    title: 'Full Stack Web Development',
    instructor: 'Michael Brown',
    price: 89.99,
    thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159',
    rating: 4.9,
    ratingCount: 3200,
    duration: '15h 30m',
    level: 'Intermediate',
    category: 'Web Development',
    tags: ['Node.js', 'React', 'MongoDB', 'Full Stack'],
    discount: null,
    enrolledCount: 7800,
  },
  {
    id: '6',
    title: 'iOS App Development with Swift',
    instructor: 'David Miller',
    price: 79.99,
    thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890',
    rating: 4.5,
    ratingCount: 980,
    duration: '9h 15m',
    level: 'Intermediate',
    category: 'Mobile Development',
    tags: ['iOS', 'Swift', 'Mobile'],
    discount: null,
    enrolledCount: 1500,
  }
];

// Create a mock store
const createMockStore = (loading = false) => configureStore({
  reducer: {
    courses: coursesReducer,
    chat: chatReducer,
  },
  preloadedState: {
    courses: {
      courses: mockCourses,
      userEnrollments: ['1', '3'],
      featuredCourses: ['1', '2', '4'],
      popularCourses: ['3', '5'],
      recommendedCourses: ['2', '4', '6'],
      currentCourse: null,
      loading: loading,
      error: null,
    },
    chat: {
      chats: [],
      activeChat: null,
      messages: {},
      loading: false,
      error: null,
    }
  }
});

// Create a wrapper component with Redux provider
const CourseListWithProvider = (props: any) => {
  const store = createMockStore(props.isLoading);

  return (
    <Provider store={store}>
      <CourseList {...props} />
    </Provider>
  );
};

const meta: Meta<typeof CourseListWithProvider> = {
  title: 'Components/Courses/CourseList',
  component: CourseListWithProvider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A course listing component with filtering, sorting, and search capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    showFilters: { control: 'boolean' },
    initialCategory: {
      control: 'select',
      options: ['', 'Web Development', 'Data Science', 'Design', 'Mobile Development'],
    },
    limit: { control: 'number' },
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof CourseListWithProvider>;

export const Default: Story = {
  args: {
    title: 'All Courses',
    showFilters: true,
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading Courses',
    showFilters: true,
    isLoading: true,
  },
};

export const LimitedCourses: Story = {
  args: {
    title: 'Featured Courses',
    showFilters: false,
    limit: 3,
  },
};

export const FilteredByCategory: Story = {
  args: {
    title: 'Web Development Courses',
    showFilters: true,
    initialCategory: 'Web Development',
  },
};

export const NoFilters: Story = {
  args: {
    title: 'Popular Courses',
    showFilters: false,
    limit: 4,
  },
};
