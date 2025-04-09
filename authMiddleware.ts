import { NextRequest, NextResponse } from 'next/server';
import { jwtUtils } from './jwt';
import { userModel } from './userModel';
import { cookies } from 'next/headers';

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
  };
}

// Middleware to authenticate requests using JWT
export async function authMiddleware(
  request: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  try {
    // Get the token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    const cookieStore = cookies();
    const tokenFromCookie = cookieStore.get('access_token')?.value;

    // Extract the token
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenFromCookie) {
      token = tokenFromCookie;
    }

    // If no token is found, return unauthorized
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const payload = jwtUtils.verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get the user from database
    const user = userModel.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Add user to request
    const authRequest = request as AuthRequest;
    authRequest.user = {
      id: user.id,
      username: user.username,
    };

    // Proceed to the handler
    return handler(authRequest);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Higher-order function to create a protected route
export function withAuth(
  handler: (req: AuthRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest) => {
    return authMiddleware(request, handler);
  };
}
