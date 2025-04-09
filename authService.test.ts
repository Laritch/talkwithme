import { describe, expect, it, beforeAll, afterAll, afterEach } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import 'whatwg-fetch'; // Polyfill for fetch API
import { AuthService } from '../authService';

// Define mock responses for API endpoints
const server = setupServer(
  // Register endpoint
  http.post('/auth/register', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'Password123!') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          session: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000,
          },
        },
      });
    } else {
      return HttpResponse.json({
        success: false,
        error: {
          message: 'Password does not meet complexity requirements',
          code: 'validation_error',
        },
      }, { status: 400 });
    }
  }),

  // Login endpoint
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'Password123!') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          session: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000,
          },
        },
      });
    } else {
      return HttpResponse.json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'auth_error',
        },
      }, { status: 401 });
    }
  }),

  // Logout endpoint
  http.post('/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Get current user endpoint
  http.get('/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      },
    });
  }),

  // Update profile endpoint
  http.put('/auth/me', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: '123',
        email: 'test@example.com',
        ...body,
      },
    });
  })
);

describe('AuthService', () => {
  let authService: AuthService;

  // Start the MSW server before tests
  beforeAll(() => server.listen());

  // Reset request handlers after each test
  afterEach(() => server.resetHandlers());

  // Close server after all tests
  afterAll(() => server.close());

  // Create a new instance of AuthService for each test
  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registrationData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await authService.register(registrationData);

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.data?.session.accessToken).toBe('mock-access-token');
    });

    it('should handle registration error', async () => {
      const registrationData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await authService.register(registrationData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('validation_error');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.data?.session.accessToken).toBe('mock-access-token');
    });

    it('should handle login failure', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('auth_error');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const result = await authService.logout();

      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch the current user', async () => {
      const result = await authService.getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
      expect(result.data?.id).toBe('123');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Johnny',
        lastName: 'Doe',
        bio: 'Software Developer',
      };

      const result = await authService.updateProfile(updateData);

      expect(result.success).toBe(true);
      expect(result.data?.firstName).toBe('Johnny');
      expect(result.data?.bio).toBe('Software Developer');
    });
  });
});
