import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching courses
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async ({ category, search, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...(category && { category }),
        ...(search && { search })
      }).toString();

      const response = await fetch(`/api/courses?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching a single course
export const fetchCourseDetails = createAsyncThunk(
  'courses/fetchCourseDetails',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    items: [],
    featuredCourses: [],
    topRated: [],
    trending: [],
    currentCourse: null,
    totalCourses: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentCourse: (state, action) => {
      state.currentCourse = action.payload;
    },
    setCourseProgress: (state, action) => {
      const { courseId, progress, lastPosition } = action.payload;

      // If we have the current course loaded and it matches
      if (state.currentCourse && state.currentCourse.id === courseId) {
        state.currentCourse.progress = progress;
        state.currentCourse.lastPosition = lastPosition;
      }

      // Also update in the course list if exists
      const courseIndex = state.items.findIndex(course => course.id === courseId);
      if (courseIndex !== -1) {
        state.items[courseIndex].progress = progress;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchCourses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.courses;
        state.totalCourses = action.payload.total;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;

        // Extract featured courses
        state.featuredCourses = action.payload.courses.filter(course => course.featured);

        // Extract top rated courses (if rating field exists)
        state.topRated = [...action.payload.courses]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 8);

        // Trending courses might be determined by server or we could use enrollment count
        state.trending = [...action.payload.courses]
          .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
          .slice(0, 8);
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Handle fetchCourseDetails
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
        state.error = action.payload;
      });
  },
});

export const { setCurrentCourse, setCourseProgress } = coursesSlice.actions;
export default coursesSlice.reducer;
