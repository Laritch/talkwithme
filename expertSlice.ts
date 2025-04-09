import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface for an expert/instructor profile
 */
export interface ExpertProfile {
  id: string;
  name: string;
  title: string;
  specialty: string[];
  bio: string;
  rating: number;
  totalReviews: number;
  totalStudents: number;
  avatar: string;
  availability: {
    [day: string]: { // 'monday', 'tuesday', etc.
      available: boolean;
      slots: {
        start: string; // HH:MM format
        end: string; // HH:MM format
      }[];
    };
  };
  courses: string[]; // IDs of courses taught by this expert
  languages: string[];
  pricing: {
    hourlyRate: number;
    currency: string;
  };
  joinedDate: string;
}

/**
 * Interface for expert stats
 */
export interface ExpertStats {
  totalSessions: number;
  totalSessionMinutes: number;
  averageRating: number;
  totalEarnings: number;
  studentsHelped: number;
  completionRate: number;
  responseRate: number;
  responseTime: number; // in minutes
}

/**
 * Interface for experts state
 */
export interface ExpertsState {
  experts: ExpertProfile[];
  filteredExperts: ExpertProfile[];
  currentExpert: ExpertProfile | null;
  expertStats: ExpertStats | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    specialty: string[];
    availability: string[];
    minRating: number;
    languages: string[];
    priceRange: [number, number];
  };
}

/**
 * Initial state for experts slice
 */
const initialState: ExpertsState = {
  experts: [],
  filteredExperts: [],
  currentExpert: null,
  expertStats: null,
  isLoading: false,
  error: null,
  filters: {
    specialty: [],
    availability: [],
    minRating: 0,
    languages: [],
    priceRange: [0, 1000],
  },
};

/**
 * Experts slice of the Redux store
 */
const expertsSlice = createSlice({
  name: 'experts',
  initialState,
  reducers: {
    fetchExpertsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchExpertsSuccess: (state, action: PayloadAction<ExpertProfile[]>) => {
      state.experts = action.payload;
      state.filteredExperts = action.payload;
      state.isLoading = false;
    },
    fetchExpertsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setCurrentExpert: (state, action: PayloadAction<ExpertProfile>) => {
      state.currentExpert = action.payload;
    },
    clearCurrentExpert: (state) => {
      state.currentExpert = null;
    },
    fetchExpertStatsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchExpertStatsSuccess: (state, action: PayloadAction<ExpertStats>) => {
      state.expertStats = action.payload;
      state.isLoading = false;
    },
    fetchExpertStatsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<ExpertsState['filters']>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };

      // Apply filters to experts
      state.filteredExperts = state.experts.filter((expert) => {
        // Filter by specialty if any specialties are selected
        if (state.filters.specialty.length > 0) {
          const hasSpecialty = expert.specialty.some(s =>
            state.filters.specialty.includes(s)
          );
          if (!hasSpecialty) return false;
        }

        // Filter by language if any languages are selected
        if (state.filters.languages.length > 0) {
          const hasLanguage = expert.languages.some(l =>
            state.filters.languages.includes(l)
          );
          if (!hasLanguage) return false;
        }

        // Filter by minimum rating
        if (expert.rating < state.filters.minRating) {
          return false;
        }

        // Filter by price range
        if (
          expert.pricing.hourlyRate < state.filters.priceRange[0] ||
          expert.pricing.hourlyRate > state.filters.priceRange[1]
        ) {
          return false;
        }

        return true;
      });
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredExperts = state.experts;
    },
  },
});

export const {
  fetchExpertsStart,
  fetchExpertsSuccess,
  fetchExpertsFailure,
  setCurrentExpert,
  clearCurrentExpert,
  fetchExpertStatsStart,
  fetchExpertStatsSuccess,
  fetchExpertStatsFailure,
  updateFilters,
  resetFilters,
} = expertsSlice.actions;

export default expertsSlice.reducer;
