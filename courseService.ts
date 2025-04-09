import apiClient from './api';
import { ApiResponse, CourseCreateData, CourseUpdateData, QueryParams } from '../types/api';
import { Course, Lesson } from '../store/slices/coursesSlice';

/**
 * Service for managing courses
 */
export class CourseService {
  private baseUrl = '/courses';

  /**
   * Get all courses with pagination and filtering
   */
  public async getCourses(params?: QueryParams): Promise<ApiResponse<Course[]>> {
    return apiClient.get<Course[]>(this.baseUrl, { params });
  }

  /**
   * Get a specific course by ID
   */
  public async getCourse(id: string): Promise<ApiResponse<Course>> {
    return apiClient.get<Course>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new course
   */
  public async createCourse(data: CourseCreateData): Promise<ApiResponse<Course>> {
    return apiClient.post<Course, CourseCreateData>(this.baseUrl, data);
  }

  /**
   * Update an existing course
   */
  public async updateCourse(id: string, data: CourseUpdateData): Promise<ApiResponse<Course>> {
    return apiClient.put<Course, CourseUpdateData>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete a course
   */
  public async deleteCourse(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get lessons for a course
   */
  public async getCourseLessons(courseId: string): Promise<ApiResponse<Lesson[]>> {
    return apiClient.get<Lesson[]>(`${this.baseUrl}/${courseId}/lessons`);
  }

  /**
   * Get a specific lesson
   */
  public async getLesson(courseId: string, lessonId: string): Promise<ApiResponse<Lesson>> {
    return apiClient.get<Lesson>(`${this.baseUrl}/${courseId}/lessons/${lessonId}`);
  }

  /**
   * Enroll a user in a course
   */
  public async enrollInCourse(courseId: string, userId: string): Promise<ApiResponse<{ enrollmentId: string }>> {
    return apiClient.post<{ enrollmentId: string }>(`${this.baseUrl}/${courseId}/enroll`, { userId });
  }

  /**
   * Get user progress for a course
   */
  public async getUserProgress(courseId: string, userId: string): Promise<ApiResponse<{ progress: number; completedLessons: string[] }>> {
    return apiClient.get<{ progress: number; completedLessons: string[] }>(
      `${this.baseUrl}/${courseId}/progress/${userId}`
    );
  }

  /**
   * Update user progress for a lesson
   */
  public async updateLessonProgress(
    courseId: string,
    lessonId: string,
    userId: string,
    progress: number
  ): Promise<ApiResponse<{ progress: number }>> {
    return apiClient.post<{ progress: number }, { userId: string; progress: number }>(
      `${this.baseUrl}/${courseId}/lessons/${lessonId}/progress`,
      { userId, progress }
    );
  }

  /**
   * Rate a course
   */
  public async rateCourse(
    courseId: string,
    userId: string,
    rating: number,
    review?: string
  ): Promise<ApiResponse<{ rating: number }>> {
    return apiClient.post<{ rating: number }>(`${this.baseUrl}/${courseId}/rate`, {
      userId,
      rating,
      review,
    });
  }

  /**
   * Get course reviews
   */
  public async getCourseReviews(courseId: string, page = 1, limit = 10): Promise<ApiResponse<{ reviews: any[]; totalCount: number }>> {
    return apiClient.get<{ reviews: any[]; totalCount: number }>(
      `${this.baseUrl}/${courseId}/reviews`,
      { params: { page, limit } }
    );
  }
}

// Create and export a single instance
const courseService = new CourseService();
export default courseService;
