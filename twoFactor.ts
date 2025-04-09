import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Service name for the 2FA app
const SERVICE_NAME = 'SecurePaymentSystem';

/**
 * Generate a new secret key for 2FA
 */
export function generateSecret(email: string): { secret: string; otpauth: string } {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, SERVICE_NAME, secret);

  return { secret, otpauth };
}

/**
 * Generate a QR code for 2FA setup
 */
export async function generateQRCode(otpauth: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauth);
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a 2FA token
 */
export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('2FA verification failed:', error);
    return false;
  }
}

/**
 * Determine if a transaction needs 2FA
 * Based on amount and user settings
 */
export function transactionRequires2FA(
  amount: number,
  currency: string,
  userHas2FAEnabled: boolean
): boolean {
  // If user has 2FA enabled, always require it for transactions
  if (userHas2FAEnabled) {
    return true;
  }

  // Otherwise, only require for high-value transactions
  const HIGH_VALUE_THRESHOLDS: Record<string, number> = {
    USD: 1000,
    EUR: 900,
    GBP: 800,
    KES: 100000,
    // Add other currencies as needed
    DEFAULT: 1000
  };

  const threshold = HIGH_VALUE_THRESHOLDS[currency] || HIGH_VALUE_THRESHOLDS.DEFAULT;
  return amount >= threshold;
}
