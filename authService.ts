import apiClient from './api';
import { ApiResponse } from '../types/api';
import {
  AuthResponse,
  EmailVerificationData,
  LoginCredentials,
  OAuthCallback,
  OAuthProvider,
  OAuthRequest,
  PasswordResetConfirmation,
  PasswordResetRequest,
  RegistrationData,
  User,
  UserUpdateData
} from '../types/auth';

/**
 * Service for authentication operations
 */
export class AuthService {
  private baseUrl = '/auth';

  /**
   * Register a new user
   */
  public async register(data: RegistrationData): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse, RegistrationData>(`${this.baseUrl}/register`, data);
  }

  /**
   * Login with credentials
   */
  public async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse, LoginCredentials>(`${this.baseUrl}/login`, credentials);

    // Set token for future API calls if login is successful
    if (response.success && response.data?.session?.accessToken) {
      apiClient.setToken(response.data.session.accessToken);
    }

    return response;
  }

  /**
   * Logout the current user
   */
  public async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`${this.baseUrl}/logout`);

    // Clear token after logout
    apiClient.clearToken();

    return response;
  }

  /**
   * Get the currently authenticated user
   */
  public async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${this.baseUrl}/me`);
  }

  /**
   * Update the authenticated user's profile
   */
  public async updateProfile(data: UserUpdateData): Promise<ApiResponse<User>> {
    return apiClient.put<User, UserUpdateData>(`${this.baseUrl}/me`, data);
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(data: PasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }, PasswordResetRequest>(`${this.baseUrl}/password-reset`, data);
  }

  /**
   * Reset password with token
   */
  public async resetPassword(data: PasswordResetConfirmation): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }, PasswordResetConfirmation>(`${this.baseUrl}/password-reset/confirm`, data);
  }

  /**
   * Verify email address
   */
  public async verifyEmail(data: EmailVerificationData): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }, EmailVerificationData>(`${this.baseUrl}/verify-email`, data);
  }

  /**
   * Resend verification email
   */
  public async resendVerificationEmail(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/resend-verification`, { email });
  }

  /**
   * Initiate OAuth authentication
   */
  public async initiateOAuth(provider: OAuthProvider, redirectUri: string): Promise<ApiResponse<{ authUrl: string }>> {
    return apiClient.post<{ authUrl: string }, OAuthRequest>(`${this.baseUrl}/oauth/${provider}`, { provider, redirectUri });
  }

  /**
   * Complete OAuth authentication with callback
   */
  public async completeOAuth(provider: OAuthProvider, code: string, state?: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse, OAuthCallback>(
      `${this.baseUrl}/oauth/${provider}/callback`,
      { provider, code, state }
    );

    // Set token for future API calls if login is successful
    if (response.success && response.data?.session?.accessToken) {
      apiClient.setToken(response.data.session.accessToken);
    }

    return response;
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; expiresAt: number }>> {
    const response = await apiClient.post<{ accessToken: string; expiresAt: number }>(`${this.baseUrl}/refresh-token`, { refreshToken });

    // Update token if refresh was successful
    if (response.success && response.data?.accessToken) {
      apiClient.setToken(response.data.accessToken);
    }

    return response;
  }

  /**
   * Check if a user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.getCurrentUser();
      return response.success && !!response.data;
    } catch (error) {
      return false;
    }
  }
}

// Create and export a single instance
const authService = new AuthService();
export default authService;
