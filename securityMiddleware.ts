/**
 * Security Middleware for Payment API Routes
 * Provides protection against common web attacks
 */

import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// CSRF token handling
export const csrfProtection = {
  // Generate a CSRF token
  generateToken: (): string => {
    return crypto.randomBytes(32).toString('hex');
  },

  // Set CSRF token in cookies and return it
  setToken: (): string => {
    const token = csrfProtection.generateToken();
    const cookieStore = cookies();

    // Set cookie with HttpOnly, Secure, and SameSite attributes
    cookieStore.set('csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    return token;
  },

  // Verify CSRF token
  verifyToken: (request: NextRequest): boolean => {
    try {
      const cookieStore = cookies();
      const cookieToken = cookieStore.get('csrf_token')?.value;
      const headerToken = request.headers.get('X-CSRF-Token');

      if (!cookieToken || !headerToken) {
        return false;
      }

      return cookieToken === headerToken;
    } catch (error) {
      console.error('CSRF verification error:', error);
      return false;
    }
  },
};

// Rate limiting
// Simple in-memory rate limiting (in production, use Redis or similar)
const ipRequests: Record<string, { count: number; resetTime: number }> = {};

export const rateLimiter = {
  limit: (request: NextRequest, maxRequests: number = 100, windowMs: number = 60000): boolean => {
    const ip = request.ip || 'unknown';
    const now = Date.now();

    // Initialize or reset if window expired
    if (!ipRequests[ip] || now > ipRequests[ip].resetTime) {
      ipRequests[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return true;
    }

    // Increment count
    ipRequests[ip].count += 1;

    // Check if over limit
    return ipRequests[ip].count <= maxRequests;
  },
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  // Basic sanitization - remove HTML tags and common script patterns
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .trim();
};

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Set security headers
  const headers = response.headers;

  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
  );

  // Other security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Only in production
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}

// Combined security middleware
export async function securityMiddleware(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  // Check rate limits - return 429 if exceeded
  if (!rateLimiter.limit(request)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // For mutating requests, check CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (!csrfProtection.verifyToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  // Process the request
  let response = await handler(request);

  // Add security headers to the response
  response = addSecurityHeaders(response);

  return response;
}
