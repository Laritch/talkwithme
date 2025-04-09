import { NextRequest, NextResponse } from 'next/server';
import { AuthRequest, withAuth } from '@/lib/auth/authMiddleware';
import { processPayment, getPaymentMethodById } from '@/lib/paymentMethods';
import { twoFactorUtils, isHighValueTransaction } from '@/lib/auth/twoFactor';
import { userModel } from '@/lib/auth/userModel';
import { encryptionUtils } from '@/lib/encryption';
import { sanitizeInput } from '@/lib/securityMiddleware';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for payment validation
const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1).max(5),
  paymentMethodId: z.string().min(1),
  details: z.record(z.string().optional()).optional(),
  twoFactorToken: z.string().optional(),
});

// Handler for payment processing
async function handler(request: AuthRequest) {
  try {
    // Ensure user is authenticated
    if (!request.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Basic sanitization
    const sanitizedBody = {
      amount: body.amount,
      currency: sanitizeInput(body.currency || ''),
      paymentMethodId: sanitizeInput(body.paymentMethodId || ''),
      details: Object.keys(body.details || {}).reduce((acc, key) => {
        acc[sanitizeInput(key)] = typeof body.details[key] === 'string'
          ? sanitizeInput(body.details[key])
          : body.details[key];
        return acc;
      }, {} as Record<string, any>),
      twoFactorToken: body.twoFactorToken ? sanitizeInput(body.twoFactorToken) : undefined,
    };

    // Validate inputs
    const result = paymentSchema.safeParse(sanitizedBody);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    // Get the user
    const userId = request.user.id;
    const user = userModel.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if payment method exists
    const paymentMethod = getPaymentMethodById(sanitizedBody.paymentMethodId);
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Check if this is a high-value transaction
    const isHighValue = isHighValueTransaction(sanitizedBody.amount, sanitizedBody.currency);

    // If high-value and user has 2FA enabled, require token
    if (isHighValue && user.twoFactorEnabled) {
      // If no token provided, ask for 2FA
      if (!sanitizedBody.twoFactorToken) {
        return NextResponse.json(
          {
            requiresAdditionalVerification: true,
            message: 'This transaction requires two-factor authentication',
          },
          { status: 403 }
        );
      }

      // Verify the token
      const isValid = twoFactorUtils.verifyToken(
        sanitizedBody.twoFactorToken,
        user.twoFactorSecret || ''
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 401 }
        );
      }
    }

    // Process the payment
    const paymentResult = await processPayment(
      sanitizedBody.paymentMethodId,
      sanitizedBody.amount,
      sanitizedBody.currency,
      {
        ...sanitizedBody.details,
        userId: user.id,
        userEmail: user.email,
      }
    );

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment processing failed' },
        { status: 400 }
      );
    }

    // Encrypt sensitive data for the receipt
    if (paymentResult.receipt) {
      // In a real app, you would only encrypt truly sensitive fields
      // Here we're encrypting the whole receipt as an example
      const encryptedReceipt = encryptionUtils.encrypt(
        JSON.stringify(paymentResult.receipt)
      );

      paymentResult.receipt = {
        ...paymentResult.receipt,
        encrypted: true,
        raw: encryptedReceipt,
      };
    }

    // Return payment result
    return NextResponse.json(paymentResult);
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Use the withAuth middleware
export const POST = (request: NextRequest) => withAuth(handler)(request);
