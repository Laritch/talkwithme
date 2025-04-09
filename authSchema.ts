import { z } from 'zod';

/**
 * User role schema
 */
export const userRoleSchema = z.enum(['student', 'instructor', 'expert', 'admin']);

/**
 * User schema
 */
export const userSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email address is required'),
  name: z.string().min(1, 'Name is required'),
  role: userRoleSchema,
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isEmailVerified: z.boolean().default(false),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    emailNotifications: z.boolean().default(true),
    pushNotifications: z.boolean().default(true),
    language: z.string().default('en'),
    timezone: z.string().default('UTC'),
    contentFilter: z.enum(['none', 'low', 'medium', 'high']).default('low'),
    accessibility: z.object({
      captionsEnabled: z.boolean().default(false),
      highContrast: z.boolean().default(false),
      fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    }),
  }).optional(),
  lastLoginAt: z.string().datetime().optional(),
  lastSeenAt: z.string().datetime().optional(),
  enrolledCourses: z.array(z.string()).optional(),
  badges: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    icon: z.string(),
    awardedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
  })).optional(),
  credentials: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    issuedBy: z.string().min(1),
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    verificationUrl: z.string().url().optional(),
    credentialType: z.enum(['certificate', 'degree', 'badge', 'award']),
  })).optional(),
  favoriteCourses: z.array(z.string()).optional(),
  notification: z.object({
    email: z.object({
      courseUpdates: z.boolean().default(true),
      newMessages: z.boolean().default(true),
      promotions: z.boolean().default(false),
      accountAlerts: z.boolean().default(true),
    }),
    push: z.object({
      courseUpdates: z.boolean().default(true),
      newMessages: z.boolean().default(true),
      promotions: z.boolean().default(false),
      accountAlerts: z.boolean().default(true),
    }),
    inApp: z.object({
      courseUpdates: z.boolean().default(true),
      newMessages: z.boolean().default(true),
      promotions: z.boolean().default(false),
      accountAlerts: z.boolean().default(true),
    }),
  }).optional(),
});

/**
 * User preferences schema
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  contentFilter: z.enum(['none', 'low', 'medium', 'high']).default('low'),
  accessibility: z.object({
    captionsEnabled: z.boolean().default(false),
    highContrast: z.boolean().default(false),
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  }),
});

/**
 * Registration schema
 */
export const registrationSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(1, 'Name is required'),
  role: userRoleSchema.optional().default('student'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * OAuth request schema
 */
export const oAuthRequestSchema = z.object({
  provider: z.enum(['google', 'github', 'facebook', 'twitter', 'linkedin']),
  redirectUri: z.string().url('Valid redirect URI is required'),
});

/**
 * OAuth callback schema
 */
export const oAuthCallbackSchema = z.object({
  provider: z.enum(['google', 'github', 'facebook', 'twitter', 'linkedin']),
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

/**
 * Session schema
 */
export const sessionSchema = z.object({
  user: userSchema,
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  expiresAt: z.number().int().positive('Expiration time is required'),
});

/**
 * Auth response schema
 */
export const authResponseSchema = z.object({
  user: userSchema,
  session: z.object({
    accessToken: z.string().min(1, 'Access token is required'),
    refreshToken: z.string().optional(),
    expiresAt: z.number().int().positive('Expiration time is required'),
  }),
});

/**
 * User update schema
 */
export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  avatar: z.string().url('Valid avatar URL is required').optional(),
  bio: z.string().optional(),
  preferences: userPreferencesSchema.partial().optional(),
  credentials: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    issuedBy: z.string().min(1, 'Issuer is required'),
    issuedAt: z.string().datetime('Valid date is required'),
    expiresAt: z.string().datetime('Valid date is required').optional(),
    verificationUrl: z.string().url('Valid URL is required').optional(),
    credentialType: z.enum(['certificate', 'degree', 'badge', 'award']),
  })).optional(),
  password: z.object({
    current: z.string().min(1, 'Current password is required'),
    new: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirm: z.string().min(1, 'Confirm password is required'),
  }).optional().refine(data =>
    data ? data.new === data.confirm : true, {
    message: 'Passwords do not match',
    path: ['confirm'],
  }),
});

// Export types derived from schemas
export type User = z.infer<typeof userSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type Registration = z.infer<typeof registrationSchema>;
export type Login = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmation = z.infer<typeof passwordResetConfirmationSchema>;
export type EmailVerification = z.infer<typeof emailVerificationSchema>;
export type OAuthRequest = z.infer<typeof oAuthRequestSchema>;
export type OAuthCallback = z.infer<typeof oAuthCallbackSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
