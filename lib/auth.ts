import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth utility for SEO-API endpoints.
 * Supports Bearer token (JWT) and API key authentication.
 *
 * Usage:
 *   const auth = validateAuth(req);
 *   if (!auth.valid) return auth.response;
 */

type AuthResult = {
  valid: boolean;
  response?: NextResponse;
  token?: string;
  userId?: string;
};

/**
 * Validate incoming request has valid Bearer token or API key.
 * Returns error response if auth fails.
 */
export function validateAuth(req: NextRequest): AuthResult {
  const authHeader = req.headers.get('Authorization');

  // Check for Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token.length === 0) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid authorization header: empty token' },
          { status: 401 }
        ),
      };
    }

    // Validate token (basic length check; should be JWT in production)
    if (!isValidToken(token)) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        ),
      };
    }

    return {
      valid: true,
      token,
      userId: extractUserIdFromToken(token),
    };
  }

  // Check for API key (X-API-Key header)
  const apiKey = req.headers.get('X-API-Key');
  if (apiKey && apiKey.length > 0) {
    if (!isValidApiKey(apiKey)) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        ),
      };
    }

    return {
      valid: true,
      token: apiKey,
      userId: extractUserIdFromApiKey(apiKey),
    };
  }

  // No auth provided
  return {
    valid: false,
    response: NextResponse.json(
      { error: 'Missing authentication: provide Bearer token or X-API-Key header' },
      { status: 401 }
    ),
  };
}

/**
 * Check if Bearer token is valid.
 * In production, should verify JWT signature and expiry.
 */
function isValidToken(token: string): boolean {
  // TODO: Implement JWT verification
  // For now, basic validation: token should be at least 50 chars
  if (token.length < 50) {
    return false;
  }

  // TODO: Verify JWT signature against your key
  // TODO: Check expiry time in JWT payload
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // return decoded && decoded.exp > Date.now();

  // Placeholder: accept any token >50 chars
  return true;
}

/**
 * Check if API key is valid.
 * Should look up the key in your database.
 */
function isValidApiKey(apiKey: string): boolean {
  // TODO: Implement API key lookup
  // Should query database: SELECT * FROM api_keys WHERE key = ? AND active = true
  // and check expiry date

  // Placeholder: validate format (should be alphanumeric + hyphens)
  if (!/^[a-zA-Z0-9\-_]+$/.test(apiKey)) {
    return false;
  }

  // TODO: Check against stored keys in database
  // For now, accept any properly formatted key
  return apiKey.length >= 20;
}

/**
 * Extract user ID from JWT token.
 * Assumes token contains user_id in payload.
 */
function extractUserIdFromToken(token: string): string | undefined {
  try {
    // TODO: Properly decode JWT
    // const decoded = jwt.decode(token);
    // return decoded?.user_id;

    // Placeholder
    return 'user-from-jwt';
  } catch {
    return undefined;
  }
}

/**
 * Extract user ID from API key.
 * Should look up the key's owner in database.
 */
function extractUserIdFromApiKey(apiKey: string): string | undefined {
  // TODO: Implement API key → user lookup
  // const keyRecord = db.query('SELECT user_id FROM api_keys WHERE key = ?', [apiKey]);
  // return keyRecord?.user_id;

  // Placeholder
  return 'user-from-api-key';
}

/**
 * Middleware-style validator for API routes.
 * Usage in route.ts:
 *   export async function POST(req: NextRequest) {
 *     const auth = await requireAuth(req);
 *     if (!auth.valid) return auth.response;
 *     // Now safe to access req and auth.userId
 *   }
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  return validateAuth(req);
}
