import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import courseService from './courseService';

// Setup MSW server
const server = setupServer(
  // GET all courses
  http.get('/courses', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'course-1',
          title: 'Introduction to TypeScript',
          instructor: 'Jane Doe',
          price: 49.99,
          thumbnail: '/images/typescript-course.jpg',
          rating: 4.7,
          ratingCount: 230,
          duration: '12h 30m',
          level: 'Intermediate',
          category: 'Programming',
          enrolledCount: 1500,
        },
        {
          id: 'course-2',
          title: 'Advanced React Patterns',
          instructor: 'John Smith',
          price: 69.99,
          thumbnail: '/images/react-course.jpg',
          rating: 4.9,
          ratingCount: 180,
          duration: '15h 45m',
          level: 'Advanced',
          category: 'Web Development',
          enrolledCount: 1200,
        },
      ],
    });
  }),

  // GET course by ID
  http.get('/courses/:id', ({ params }) => {
    const { id } = params;

    if (id === 'course-1') {
      return HttpResponse.json({
        success: true,
        data: {
          id: 'course-1',
          title: 'Introduction to TypeScript',
          instructor: 'Jane Doe',
          price: 49.99,
          thumbnail: '/images/typescript-course.jpg',
          rating: 4.7,
          ratingCount: 230,
          duration: '12h 30m',
          level: 'Intermediate',
          category: 'Programming',
          enrolledCount: 1500,
          description: 'Learn TypeScript from the ground up in this comprehensive course.',
          syllabus: [
            {
              title: 'Introduction',
              lessons: [
                { title: 'What is TypeScript?', duration: '10m' },
                { title: 'Setting up your environment', duration: '15m' },
              ],
            },
            {
              title: 'Basic Types',
              lessons: [
                { title: 'Primitive Types', duration: '20m' },
                { title: 'Arrays and Tuples', duration: '25m' },
              ],
            },
          ],
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          message: 'Course not found',
          code: 'not_found',
        },
      },
      { status: 404 }
    );
  }),

  // Enroll in a course
  http.post('/courses/:id/enroll', ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      success: true,
      data: {
        enrollmentId: `enrollment-${Date.now()}`,
        courseId: id,
        enrolledAt: new Date().toISOString(),
        status: 'active',
      },
    });
  }),

  // Rate a course
  http.post('/courses/:id/rate', async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        courseId: id,
        rating: body.rating,
        review: body.review || null,
        ratedAt: new Date().toISOString(),
      },
    });
  })
);

describe('Course Service', () => {
  // Start server before all tests
  beforeAll(() => server.listen());

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());

  // Close server after all tests
  afterAll(() => server.close());

  describe('getCourses', () => {
    it('should fetch all courses', async () => {
      const response = await courseService.getCourses();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].title).toBe('Introduction to TypeScript');
      expect(response.data[1].title).toBe('Advanced React Patterns');
    });

    it('should handle errors correctly', async () => {
      // Override the handler for this specific test to simulate an error
      server.use(
        http.get('/courses', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Failed to fetch courses',
                code: 'server_error',
              },
            },
            { status: 500 }
          );
        })
      );

      const response = await courseService.getCourses();

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Failed to fetch courses');
      expect(response.error?.code).toBe('server_error');
    });
  });

  describe('getCourse', () => {
    it('should fetch a specific course by ID', async () => {
      const response = await courseService.getCourse('course-1');

      expect(response.success).toBe(true);
      expect(response.data?.id).toBe('course-1');
      expect(response.data?.title).toBe('Introduction to TypeScript');
      expect(response.data?.syllabus).toHaveLength(2);
    });

    it('should return error for non-existent course', async () => {
      const response = await courseService.getCourse('non-existent-course');

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Course not found');
      expect(response.error?.code).toBe('not_found');
    });
  });

  describe('enrollInCourse', () => {
    it('should enroll user in a course', async () => {
      const response = await courseService.enrollInCourse('course-1');

      expect(response.success).toBe(true);
      expect(response.data?.courseId).toBe('course-1');
      expect(response.data?.status).toBe('active');
      expect(response.data?.enrollmentId).toMatch(/^enrollment-\d+$/);
    });
  });

  describe('rateCourse', () => {
    it('should submit a rating for a course', async () => {
      const rating = 5;
      const review = 'Great course, learned a lot!';

      const response = await courseService.rateCourse('course-1', { rating, review });

      expect(response.success).toBe(true);
      expect(response.data?.courseId).toBe('course-1');
      expect(response.data?.rating).toBe(rating);
      expect(response.data?.review).toBe(review);
    });
  });
});
