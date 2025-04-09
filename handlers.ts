import { http, HttpResponse } from 'msw';

// Define mock handlers for API endpoints
export const handlers = [
  // Auth endpoints
  http.post('/auth/register', async ({ request }) => {
    const body = await request.json();
    if (body.email && body.password && body.firstName && body.lastName) {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'mock-user-id',
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            createdAt: new Date().toISOString(),
            role: 'user',
          },
          session: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000,
          },
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid registration data',
          code: 'invalid_registration',
        },
      },
      { status: 400 }
    );
  }),

  http.post('/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'Password123!') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
          },
          session: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000,
          },
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'invalid_credentials',
        },
      },
      { status: 401 }
    );
  }),

  http.post('/auth/logout', () => {
    return HttpResponse.json({
      success: true,
    });
  }),

  http.get('/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        success: true,
        data: {
          id: 'mock-user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'unauthorized',
        },
      },
      { status: 401 }
    );
  }),

  // Courses endpoints
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

  // Chat endpoints
  http.get('/chats', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'chat-1',
          title: 'TypeScript Question',
          participantIds: ['mock-user-id', 'instructor-1'],
          lastMessage: {
            id: 'msg-1',
            text: 'Thanks for the explanation!',
            sender: 'mock-user-id',
            timestamp: new Date().toISOString(),
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'chat-2',
          title: 'React Hooks Question',
          participantIds: ['mock-user-id', 'instructor-2'],
          lastMessage: {
            id: 'msg-2',
            text: 'Let me know if you have more questions.',
            sender: 'instructor-2',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
          },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    });
  }),

  http.get('/chats/:id/messages', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'msg-1',
          chatId: params.id,
          text: 'Hi, I have a question about TypeScript interfaces.',
          sender: 'mock-user-id',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-2',
          chatId: params.id,
          text: 'Sure, what would you like to know?',
          sender: 'instructor-1',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: 'msg-3',
          chatId: params.id,
          text: 'How do I extend an interface?',
          sender: 'mock-user-id',
          timestamp: new Date(Date.now() - 3400000).toISOString(),
        },
        {
          id: 'msg-4',
          chatId: params.id,
          text: 'You can use the extends keyword, like: interface ChildInterface extends ParentInterface {}',
          sender: 'instructor-1',
          timestamp: new Date(Date.now() - 3300000).toISOString(),
        },
        {
          id: 'msg-5',
          chatId: params.id,
          text: 'Thanks for the explanation!',
          sender: 'mock-user-id',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }),

  http.post('/chats/:id/messages', async ({ request, params }) => {
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        id: `msg-${Date.now()}`,
        chatId: params.id,
        text: body.text,
        sender: 'mock-user-id',
        timestamp: new Date().toISOString(),
      },
    });
  }),
];
