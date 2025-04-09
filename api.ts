import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';

/**
 * Configuration for the API client
 */
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Base API client for making HTTP requests
 */
export class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  /**
   * Create a new API client
   */
  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for consistent error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleRequestError(error)
    );
  }

  /**
   * Set the authentication token for subsequent requests
   */
  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear the authentication token
   */
  public clearToken(): void {
    this.token = null;
  }

  /**
   * Make a GET request
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.client.get(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: 'request_failed',
          },
        };
      }
      return {
        success: false,
        error: {
          message: 'Unknown error',
          code: 'unknown_error',
        },
      };
    }
  }

  /**
   * Make a POST request
   */
  public async post<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.client.post(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: 'request_failed',
          },
        };
      }
      return {
        success: false,
        error: {
          message: 'Unknown error',
          code: 'unknown_error',
        },
      };
    }
  }

  /**
   * Make a PUT request
   */
  public async put<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.client.put(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: 'request_failed',
          },
        };
      }
      return {
        success: false,
        error: {
          message: 'Unknown error',
          code: 'unknown_error',
        },
      };
    }
  }

  /**
   * Make a PATCH request
   */
  public async patch<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.client.patch(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: 'request_failed',
          },
        };
      }
      return {
        success: false,
        error: {
          message: 'Unknown error',
          code: 'unknown_error',
        },
      };
    }
  }

  /**
   * Make a DELETE request
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.client.delete(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: 'request_failed',
          },
        };
      }
      return {
        success: false,
        error: {
          message: 'Unknown error',
          code: 'unknown_error',
        },
      };
    }
  }

  /**
   * Handle response based on API structure
   */
  private handleResponse<T>(response: AxiosResponse): ApiResponse<T> {
    // Handle API-formatted responses
    if (response.data && typeof response.data === 'object') {
      if ('data' in response.data || 'success' in response.data) {
        return response.data as ApiResponse<T>;
      }
    }

    // Format as ApiResponse if the backend doesn't return in expected format
    return {
      success: true,
      data: response.data as T,
    };
  }

  /**
   * Handle request errors
   */
  private handleRequestError(error: AxiosError): Promise<never> {
    if (error.response) {
      // The request was made and the server responded with an error status
      const apiError: ApiResponse = {
        success: false,
        error: {
          message: error.message,
          code: `http_${error.response.status}`,
          details: error.response.data,
        },
      };
      return Promise.reject(apiError);
    } else if (error.request) {
      // The request was made but no response was received
      const apiError: ApiResponse = {
        success: false,
        error: {
          message: 'No response received from server',
          code: 'network_error',
        },
      };
      return Promise.reject(apiError);
    } else {
      // Something happened in setting up the request
      const apiError: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Request configuration error',
          code: 'request_error',
        },
      };
      return Promise.reject(apiError);
    }
  }
}

// Create and export the default API client instance
const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

export default apiClient;
