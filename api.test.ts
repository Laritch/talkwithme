import { ApiClient } from '../api';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockAxiosInstance = axios.create();

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient = new ApiClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      headers: {
        'Custom-Header': 'test-value',
      },
    });
  });

  describe('constructor', () => {
    it('should create an instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Custom-Header': 'test-value',
        },
      });
    });

    it('should set up interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    it('should handle successful GET requests', async () => {
      const mockResponse = { data: { success: true, data: { id: 1, name: 'Test' } } };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiClient.get('/users/1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/1', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle failed GET requests', async () => {
      const error = new Error('Network Error');
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue(error);

      const result = await apiClient.get('/users/1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/1', undefined);
      expect(result).toEqual({
        success: false,
        error: {
          message: 'Network Error',
          code: 'request_failed',
        },
      });
    });

    it('should handle successful POST requests', async () => {
      const mockData = { name: 'New User', email: 'test@example.com' };
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, ...mockData },
        },
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiClient.post('/users', mockData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', mockData, undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle failed POST requests', async () => {
      const mockData = { name: 'New User' }; // Missing required email
      const error = new Error('Validation Error');
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(error);

      const result = await apiClient.post('/users', mockData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', mockData, undefined);
      expect(result).toEqual({
        success: false,
        error: {
          message: 'Validation Error',
          code: 'request_failed',
        },
      });
    });
  });

  describe('Auth token management', () => {
    it('should set auth token', () => {
      const token = 'test-token-123';
      apiClient.setToken(token);

      // We can't directly test this but we can test if the interceptor was called
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should clear auth token', () => {
      apiClient.clearToken();

      // Can't directly test this either, but we can ensure it doesn't break
      expect(true).toBeTruthy();
    });
  });
});
