import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface for a course
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  thumbnail: string;
  rating: number;
  ratingCount: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  tags: string[];
  discount: number | null;
  enrolledCount: number;
  featured: boolean;
  lessons?: Lesson[];
  syllabus?: {
    sections: CourseSectionType[];
  };
  requirements?: string[];
  objectives?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for a lesson
 */
export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  isPreview: boolean;
  resources?: {
    url: string;
    title: string;
    type: string;
  }[];
}

/**
 * Interface for a course section
 */
export interface CourseSectionType {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

/**
 * Interface for user progress
 */
export interface UserProgress {
  [courseId: string]: {
    [lessonId: string]: number;
  };
}

/**
 * Interface for the courses state
 */
export interface CoursesState {
  items: Course[];
  featuredCourses: Course[];
  totalCourses: number;
  currentPage: number;
  totalPages: number;
  currentCourse: Course | null;
  videoPlayer: HTMLVideoElement | null;
  userProgress: UserProgress;
  loading: boolean;
  error: string | null;
}

/**
 * Parameters for fetching courses
 */
export interface FetchCoursesParams {
  category?: string;
  search?: string;
  sortBy?: 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';
  page?: number;
  limit?: number;
}

/**
 * Response from fetching courses
 */
export interface FetchCoursesResponse {
  courses: Course[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Async thunk for fetching courses
 */
export const fetchCourses = createAsyncThunk<
  FetchCoursesResponse,
  FetchCoursesParams,
  { rejectValue: string }
>(
  'courses/fetchCourses',
  async ({ category, search, sortBy, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        category: category || '',
        search: search || '',
        sortBy: sortBy || 'popular',
        page: page.toString(),
        limit: limit.toString()
      }).toString();

      const response = await fetch(`/api/courses?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }
);

/**
 * Async thunk for fetching a single course
 */
export const fetchCourseDetails = createAsyncThunk<
  Course,
  string,
  { rejectValue: string }
>(
  'courses/fetchCourseDetails',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }
);

/**
 * Initial state for the courses slice
 */
const initialState: CoursesState = {
  items: [],
  featuredCourses: [],
  totalCourses: 0,
  currentPage: 1,
  totalPages: 1,
  currentCourse: null,
  videoPlayer: null,
  userProgress: {},
  loading: false,
  error: null,
};

/**
 * Progress update payload
 */
interface UpdateProgressPayload {
  courseId: string;
  lessonId: string;
  progress: number;
  currentTime?: number;
}

/**
 * Courses slice of the Redux store
 */
const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setCurrentCourse: (state, action: PayloadAction<Course | null>) => {
      state.currentCourse = action.payload;
    },
    setVideoPlayer: (state, action: PayloadAction<HTMLVideoElement | null>) => {
      state.videoPlayer = action.payload;
    },
    updateUserProgress: (state, action: PayloadAction<UpdateProgressPayload>) => {
      const { courseId, lessonId, progress } = action.payload;
      if (!state.userProgress[courseId]) {
        state.userProgress[courseId] = {};
      }
      state.userProgress[courseId][lessonId] = progress;
    },
    clearCourseError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handling fetchCourses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.courses;
        state.featuredCourses = action.payload.courses.filter(course => course.featured);
        state.totalCourses = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch courses';
      })

      // Handling fetchCourseDetails
      .addCase(fetchCourseDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch course details';
      });
  },
});

export const {
  setCurrentCourse,
  setVideoPlayer,
  updateUserProgress,
  clearCourseError
} = coursesSlice.actions;

export default coursesSlice.reducer;
