# SEO-API Authentication

## Overview

All SEO-API endpoints require authentication via Bearer token (JWT) or API key. Unauthenticated requests return `401 Unauthorized`.

## Authentication Methods

### 1. Bearer Token (JWT)

Send your JWT token in the `Authorization` header:

```bash
curl -X POST https://api.example.com/api/seo/roi \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "searchVolume": 5000,
    "position": 3,
    "conversionRate": 0.05,
    "revenuePerConversion": 50,
    "monthlyInvestment": 1000,
    "timeframe": 12
  }'
```

**Token Requirements:**
- Must be a valid JWT (minimum 50 characters)
- Should include `exp` claim for expiry validation (not enforced yet)
- Format: `Bearer <token>`

**Example Response (Success):**
```json
{
  "success": true,
  "data": {
    "monthlyRevenue": 12500,
    "roi": 1150,
    "paybackMonths": 0.96
  }
}
```

**Example Response (No Auth):**
```json
{
  "error": "Missing authentication: provide Bearer token or X-API-Key header"
}
```

### 2. API Key

Send your API key in the `X-API-Key` header:

```bash
curl -X POST https://api.example.com/api/seo/roi \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Key Requirements:**
- Minimum 20 characters
- Alphanumeric plus hyphens and underscores
- Format: `X-API-Key: <key>`

## Protected Endpoints

All endpoints under `/api/seo/` and `/api/geo/` require authentication:

### SEO Endpoints
- `POST /api/seo/roi` — Calculate ROI from SEO metrics
- `POST /api/seo/keyword-density` — Analyze keyword density in content
- `POST /api/seo/meta-check` — Validate meta tags
- `POST /api/seo/page-speed` — Calculate page speed score
- `POST /api/seo/readability` — Analyze content readability
- `POST /api/seo/serp-preview` — Generate SERP preview

### GEO Endpoints
- `POST /api/geo/eeat-signals` — Analyze E-E-A-T signals
- `POST /api/geo/entity-density` — Analyze entity references
- `POST /api/geo/answer-structure` — Analyze answer structure
- `POST /api/geo/evaluation-prompt` — Generate evaluation prompts
- `POST /api/geo/quotability` — Analyze quotability score

## Implementation Details

### Authentication Flow

1. **Request Received:** Endpoint receives HTTP request
2. **Auth Check:** `validateAuth(req)` extracts Bearer token or API key
3. **Validation:** Token/key checked for format and validity
4. **Access:** If valid, request proceeds; if invalid, returns 401

### Code Pattern

Every endpoint follows this pattern:

```typescript
import { validateAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Auth check FIRST
  const auth = validateAuth(req);
  if (!auth.valid) return auth.response!;

  // Then process request
  try {
    const body = await req.json();
    // ... handler logic
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
```

### Auth Utility (`lib/auth.ts`)

The `validateAuth()` function:
- Checks for `Authorization: Bearer <token>` header
- Falls back to `X-API-Key: <key>` header
- Returns `{valid: boolean, response?: NextResponse, token?: string, userId?: string}`
- Returns proper 401 response if auth fails

### Extending the Auth System

#### Adding JWT Verification

Update `isValidToken()` in `lib/auth.ts`:

```typescript
import jwt from 'jsonwebtoken';

function isValidToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded && decoded.exp * 1000 > Date.now();
  } catch (err) {
    return false;
  }
}

function extractUserIdFromToken(token: string): string | undefined {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.user_id;
  } catch {
    return undefined;
  }
}
```

#### Adding API Key Database Lookup

Update `isValidApiKey()` in `lib/auth.ts`:

```typescript
import db from '@/lib/db'; // Your database client

function isValidApiKey(apiKey: string): boolean {
  const keyRecord = db.apiKeys.findUnique({
    where: { key: apiKey }
  });
  
  if (!keyRecord) return false;
  if (!keyRecord.active) return false;
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) return false;
  
  return true;
}

function extractUserIdFromApiKey(apiKey: string): string | undefined {
  const keyRecord = db.apiKeys.findUnique({
    where: { key: apiKey }
  });
  return keyRecord?.userId;
}
```

## Security Considerations

### Current Implementation

- ✓ All endpoints require authentication
- ✓ Proper 401 error responses
- ✓ Token/key extracted from headers
- ✓ Format validation for tokens and keys

### Recommended Enhancements

1. **JWT Signature Verification** (CRITICAL)
   - Implement JWT.verify() with your secret key
   - Check token expiry before accepting
   - See "Extending the Auth System" section above

2. **API Key Management** (HIGH)
   - Store API keys hashed in database
   - Implement key rotation mechanism
   - Add per-key rate limiting
   - Track key usage and revocation

3. **Rate Limiting** (HIGH)
   - Limit requests per API key per hour
   - Implement sliding window algorithm
   - Return `429 Too Many Requests` when limit exceeded

4. **Audit Logging** (MEDIUM)
   - Log all authentication attempts (success and failure)
   - Track which user/key accessed which endpoint
   - Store response status and timestamp

5. **CORS & Security Headers** (MEDIUM)
   - Set appropriate CORS headers for API
   - Add `X-Content-Type-Options: nosniff`
   - Add `X-Frame-Options: DENY`

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Missing authentication: provide Bearer token or X-API-Key header"
}
```

Returned when:
- No `Authorization` or `X-API-Key` header provided
- Token is empty or invalid format
- API key is empty or invalid format

### 400 Bad Request

```json
{
  "error": "Invalid JSON body"
}
```

Returned when:
- Request body is not valid JSON
- Required parameters missing or wrong type

## Testing

### Test with cURL

```bash
# Without auth (should fail with 401)
curl -X POST https://api.example.com/api/seo/roi \
  -H "Content-Type: application/json" \
  -d '{"searchVolume": 5000, "position": 3, "conversionRate": 0.05, "revenuePerConversion": 50, "monthlyInvestment": 1000, "timeframe": 12}'

# With Bearer token (should succeed if token is valid)
curl -X POST https://api.example.com/api/seo/roi \
  -H "Authorization: Bearer your-jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{"searchVolume": 5000, "position": 3, "conversionRate": 0.05, "revenuePerConversion": 50, "monthlyInvestment": 1000, "timeframe": 12}'

# With API key (should succeed if key is valid)
curl -X POST https://api.example.com/api/seo/roi \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"searchVolume": 5000, "position": 3, "conversionRate": 0.05, "revenuePerConversion": 50, "monthlyInvestment": 1000, "timeframe": 12}'
```

## Deployment

1. **Environment Variables** (add to `.env.local` or deployment config):
   ```
   JWT_SECRET=your-super-secret-key-for-signing-jwts
   DATABASE_URL=your-database-connection-string
   ```

2. **Database Migration** (create API keys table):
   ```sql
   CREATE TABLE api_keys (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     key VARCHAR(255) UNIQUE NOT NULL,
     user_id UUID NOT NULL REFERENCES users(id),
     active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT now(),
     expires_at TIMESTAMP,
     last_used_at TIMESTAMP
   );
   
   CREATE INDEX idx_api_keys_key ON api_keys(key);
   ```

3. **Implement JWT Verification** (see "Extending the Auth System" above)

4. **Test thoroughly** before production deployment

## Migration Guide (From No Auth to Auth)

If you're updating existing API consumers:

1. **Announce deprecation** — Notify users that authentication will be required
2. **Provide grace period** — Continue accepting unauthenticated requests for 30 days
3. **Issue tokens** — Generate JWT or API key for each user
4. **Update docs** — Point users to this AUTH.md guide
5. **Monitor** — Track which clients still use old endpoints
6. **Hard cutoff** — Enforce auth after grace period

## Support

For auth issues or to request token/key generation, contact: api-support@example.com
