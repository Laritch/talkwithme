import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCourses,
  fetchCourseDetails,
  setCurrentCourse,
  updateUserProgress
} from '../store/slices/coursesSlice';
import { Course, FetchCoursesParams } from '../types/api';
import { AppDispatch, RootState } from '../store';
import courseService from '../services/courseService';

/**
 * Hook return type
 */
interface UseCourses {
  courses: Course[];
  currentCourse: Course | null;
  loading: boolean;
  error: string | null;
  totalCourses: number;
  currentPage: number;
  totalPages: number;
  fetchAllCourses: (params?: FetchCoursesParams) => Promise<void>;
  fetchCourse: (id: string) => Promise<void>;
  updateProgress: (courseId: string, lessonId: string, progress: number, currentTime?: number) => Promise<void>;
  rateCourse: (courseId: string, rating: number, review?: string) => Promise<boolean>;
  enrollInCourse: (courseId: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Custom hook for course operations
 *
 * @returns Course-related data and operations
 */
export function useCourses(): UseCourses {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: courses,
    currentCourse,
    loading,
    error,
    totalCourses,
    currentPage,
    totalPages
  } = useSelector((state: RootState) => state.courses);

  // Local state to track additional loading states
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [isRating, setIsRating] = useState<boolean>(false);

  // Fetch all courses with optional parameters
  const fetchAllCourses = useCallback(async (params?: FetchCoursesParams) => {
    await dispatch(fetchCourses(params || {}));
  }, [dispatch]);

  // Fetch a specific course by ID
  const fetchCourse = useCallback(async (id: string) => {
    await dispatch(fetchCourseDetails(id));
  }, [dispatch]);

  // Update lesson progress
  const updateProgress = useCallback(async (
    courseId: string,
    lessonId: string,
    progress: number,
    currentTime?: number,
  ) => {
    // First update in Redux for immediate UI response
    dispatch(updateUserProgress({ courseId, lessonId, progress, currentTime }));

    // Then send to the server
    try {
      const userId = 'current'; // Usually you'd get this from auth context
      await courseService.updateLessonProgress(courseId, lessonId, userId, progress);
    } catch (error) {
      console.error('Failed to update progress on server:', error);
      // Could add logic to retry or revert the UI update if needed
    }
  }, [dispatch]);

  // Rate a course
  const rateCourse = useCallback(async (courseId: string, rating: number, review?: string): Promise<boolean> => {
    setIsRating(true);
    try {
      const userId = 'current'; // Usually you'd get this from auth context
      const response = await courseService.rateCourse(courseId, userId, rating, review);

      // If successful, refresh the course details to get updated ratings
      if (response.success) {
        await dispatch(fetchCourseDetails(courseId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error rating course:', error);
      return false;
    } finally {
      setIsRating(false);
    }
  }, [dispatch]);

  // Enroll in course
  const enrollInCourse = useCallback(async (courseId: string): Promise<boolean> => {
    setIsEnrolling(true);
    try {
      const userId = 'current'; // Usually you'd get this from auth context
      const response = await courseService.enrollInCourse(courseId, userId);

      // If successful, refresh the course details
      if (response.success) {
        await dispatch(fetchCourseDetails(courseId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      return false;
    } finally {
      setIsEnrolling(false);
    }
  }, [dispatch]);

  // Clear any error
  const clearError = useCallback(() => {
    dispatch(setCurrentCourse(null));
  }, [dispatch]);

  return {
    courses,
    currentCourse,
    loading: loading || isEnrolling || isRating,
    error,
    totalCourses,
    currentPage,
    totalPages,
    fetchAllCourses,
    fetchCourse,
    updateProgress,
    rateCourse,
    enrollInCourse,
    clearError,
  };
}
