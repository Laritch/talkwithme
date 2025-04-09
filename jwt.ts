import { SignJWT, jwtVerify } from 'jose';
import { User } from './userModel';

// In a production app, these would be environment variables
const JWT_SECRET = new TextEncoder().encode('your-super-secure-jwt-secret-key-change-in-production');
const JWT_EXPIRES_IN = '24h'; // 24 hours
const JWT_ISSUER = 'secure-payment-system';
const JWT_AUDIENCE = 'secure-payment-users';

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: string;
  region: string;
  iat: number; // Issued at
  exp: number; // Expires at
  iss: string; // Issuer
  aud: string; // Audience
  twoFactorVerified?: boolean;
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: User, twoFactorVerified = false): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 24 * 60 * 60; // 24 hours from now

  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    region: user.region,
    iat,
    exp,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  };

  // Only include twoFactorVerified flag if the user has 2FA enabled
  if (user.twoFactorEnabled) {
    payload.twoFactorVerified = twoFactorVerified;
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract JWT token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
}
