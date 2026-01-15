# Security Implementation Guide

This document describes the security controls implemented in the OpenRAG Langflow App, following OWASP best practices for web application security.

## Overview

The application implements multiple layers of security controls to protect against common web vulnerabilities:

- ✅ **Input Validation** - Zod schemas prevent injection attacks
- ✅ **File Validation** - Multi-layer image verification
- ✅ **Security Headers** - CSP, HSTS, X-Frame-Options
- ✅ **Sanitization** - Database queries and user inputs
- ✅ **Logging** - Security event monitoring
- ✅ **Error Handling** - No sensitive data leakage

## Security Controls

### 1. Input Validation

All user inputs are validated using Zod schemas before processing.

**Location**: `lib/security/validation.ts`

**Features**:
- Type-safe validation with TypeScript
- Length limits on all string inputs
- Character restrictions (alphanumeric, etc.)
- URL validation (HTTPS only, allowed domains)
- Automatic sanitization

**Example Usage**:
```typescript
import { validateRequestBody, chatMessageSchema } from '@/lib/security';

export async function POST(request: NextRequest) {
  const validation = await validateRequestBody(request, chatMessageSchema);
  
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: validation.error }),
      { status: 400 }
    );
  }
  
  const { message } = validation.data; // Type-safe and validated
}
```

**Available Schemas**:
- `chatMessageSchema` - Chat messages (max 10,000 chars)
- `imagePromptSchema` - Image generation prompts (max 2,000 chars)
- `imageGenerationSchema` - Complete image generation requests
- `characterAnalysisSchema` - Character image analysis
- `monsterIdSchema` - Monster/character IDs
- `imageUrlSchema` - Image URLs (HTTPS, allowed domains)

### 2. File Upload Security

Multi-layer validation for file uploads to prevent malicious files.

**Location**: `lib/security/fileValidation.ts`

**Features**:
- File size limits (default: 5MB)
- MIME type validation (JPEG, PNG, WebP only)
- Content-based validation using Sharp
- Image dimension limits (prevents decompression bombs)
- Image sanitization (strips metadata)

**Configuration** (via environment variables):
```bash
MAX_FILE_SIZE_MB=5              # Maximum file size in MB
MAX_IMAGE_DIMENSION=10000       # Maximum width/height in pixels
IMAGE_RESIZE_DIMENSION=1024     # Resize dimension for sanitization
```

**Example Usage**:
```typescript
import { validateFormDataFile, sanitizeImage } from '@/lib/security';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const validation = await validateFormDataFile(formData, 'image');
  
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  // Sanitize the image
  const buffer = Buffer.from(await validation.file.arrayBuffer());
  const { buffer: sanitized, mimeType } = await sanitizeImage(buffer);
}
```

### 3. Security Headers

HTTP security headers are configured in `next.config.ts`.

**Headers Implemented**:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Restrictive policy | Prevents XSS attacks |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing |
| X-Frame-Options | DENY | Prevents clickjacking |
| Strict-Transport-Security | max-age=31536000 | Forces HTTPS |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer info |
| Permissions-Policy | Restrictive | Disables unnecessary features |

**Content Security Policy Details**:
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' data: https://*.everart.ai https://storage.googleapis.com
connect-src 'self' https://api.everart.ai
font-src 'self'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
```

### 4. Database Query Sanitization

All database queries are sanitized to prevent NoSQL injection.

**Location**: `lib/security/validation.ts`

**Features**:
- Removes special characters ($, {, })
- Strips quotes and backslashes
- Validates input format before sanitization

**Example Usage**:
```typescript
import { validateAndSanitizeId, sanitizeForDb } from '@/lib/security';

// Validate and sanitize an ID
const safeId = validateAndSanitizeId(userId);

// Sanitize a string
const safeString = sanitizeForDb(userInput);
```

### 5. Security Logging

Structured logging for security events and monitoring.

**Location**: `lib/security/logger.ts`

**Features**:
- Structured JSON logging
- Categorized security events
- IP address tracking
- Timestamp and severity levels

**Log Categories**:
- `FILE_UPLOAD` - File upload attempts
- `VALIDATION` - Input validation failures
- `API_ERROR` - API request errors
- `SUSPICIOUS` - Suspicious activity

**Example Usage**:
```typescript
import { logValidationFailure, logApiError, securityLog } from '@/lib/security';

// Log validation failure
logValidationFailure('/api/endpoint', clientIp, 'Invalid input');

// Log API error
logApiError('/api/endpoint', 'POST', 'Database error', 500);

// Custom security log
securityLog.warn('CUSTOM', 'Unusual activity detected', { details });
```

### 6. Error Handling

Proper error handling prevents sensitive information leakage.

**Best Practices**:
- Never expose stack traces to clients
- Use generic error messages for users
- Log detailed errors server-side only
- Return appropriate HTTP status codes

**Example**:
```typescript
try {
  // Operation
} catch (error) {
  console.error('Detailed error:', error); // Server-side only
  logApiError('/api/endpoint', 'POST', error.message, 500);
  
  return new Response(
    JSON.stringify({ error: 'Internal server error' }), // Generic message
    { status: 500 }
  );
}
```

## OWASP Top 10 Protection

### A01:2021 – Broken Access Control
- ✅ No authentication required (demo app)
- ✅ Input validation prevents unauthorized access
- ✅ File access restricted to allowed paths

### A02:2021 – Cryptographic Failures
- ✅ HTTPS enforced via HSTS header
- ✅ No sensitive data stored in client
- ✅ Environment variables for secrets

### A03:2021 – Injection
- ✅ Input validation with Zod schemas
- ✅ Database query sanitization
- ✅ Parameterized queries (via SDK)
- ✅ Content Security Policy

### A04:2021 – Insecure Design
- ✅ Security by design approach
- ✅ Principle of least privilege
- ✅ Defense in depth (multiple layers)

### A05:2021 – Security Misconfiguration
- ✅ Security headers configured
- ✅ Error messages don't leak info
- ✅ Unnecessary features disabled
- ✅ Dependencies kept up to date

### A06:2021 – Vulnerable Components
- ✅ Regular dependency updates
- ✅ Minimal dependencies
- ✅ Security-focused libraries (Zod, Sharp)

### A07:2021 – Authentication Failures
- N/A - No authentication (demo app)

### A08:2021 – Software and Data Integrity
- ✅ File validation and sanitization
- ✅ Content integrity via CSP
- ✅ Trusted sources only

### A09:2021 – Logging Failures
- ✅ Comprehensive security logging
- ✅ Structured log format
- ✅ Monitoring-ready output

### A10:2021 – Server-Side Request Forgery
- ✅ URL validation (allowed domains)
- ✅ HTTPS-only external requests
- ✅ No user-controlled URLs

## API Route Security Checklist

When creating or updating API routes, ensure:

- [ ] Input validation using Zod schemas
- [ ] Client IP logging for security events
- [ ] Proper error handling (no data leakage)
- [ ] Security logging for failures
- [ ] Sanitization of database queries
- [ ] File validation for uploads
- [ ] Appropriate HTTP status codes

**Example Secure API Route**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { 
  validateRequestBody, 
  getClientIp,
  logValidationFailure,
  logApiError,
  mySchema 
} from '@/lib/security';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  
  try {
    // 1. Validate input
    const validation = await validateRequestBody(request, mySchema);
    
    if (!validation.success) {
      logValidationFailure('/api/my-endpoint', clientIp, validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { data } = validation;
    
    // 2. Process request (with validated data)
    const result = await processRequest(data);
    
    // 3. Return success
    return NextResponse.json({ success: true, result });
    
  } catch (error) {
    // 4. Log and handle errors
    console.error('API error:', error);
    logApiError('/api/my-endpoint', 'POST', error.message, 500);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Security Controls

### Manual Testing

1. **Input Validation**:
   ```bash
   # Test with invalid input
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": ""}'  # Should fail: empty message
   
   # Test with oversized input
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "'$(python3 -c 'print("A"*10001)')'"}'  # Should fail: too long
   ```

2. **File Upload**:
   ```bash
   # Test with invalid file type
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@malicious.exe"  # Should fail: invalid type
   
   # Test with oversized file
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@large-image.jpg"  # Should fail if > 5MB
   ```

3. **Security Headers**:
   ```bash
   # Check security headers
   curl -I http://localhost:3000
   
   # Should see:
   # x-content-type-options: nosniff
   # x-frame-options: DENY
   # strict-transport-security: max-age=31536000
   ```

### Automated Testing

Create tests in `__tests__/security/`:

```typescript
import { validateRequestBody, chatMessageSchema } from '@/lib/security';

describe('Input Validation', () => {
  it('should reject empty messages', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: '' }),
    });
    
    const result = await validateRequestBody(request, chatMessageSchema);
    expect(result.success).toBe(false);
  });
  
  it('should reject oversized messages', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: 'A'.repeat(10001) }),
    });
    
    const result = await validateRequestBody(request, chatMessageSchema);
    expect(result.success).toBe(false);
  });
});
```

## Monitoring and Alerts

### Log Monitoring

Security logs are output to console in JSON format:

```json
{
  "timestamp": "2026-01-15T18:00:00.000Z",
  "level": "warn",
  "category": "VALIDATION",
  "message": "Input validation failed",
  "details": {
    "endpoint": "/api/chat",
    "ip": "192.168.1.1",
    "error": "Message too long"
  }
}
```

### Recommended Monitoring

1. **Validation Failures**: High rate may indicate attack
2. **File Upload Rejections**: Monitor for malicious uploads
3. **API Errors**: Track error rates and patterns
4. **Suspicious Activity**: Alert on unusual patterns

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Security headers verified
- [ ] HTTPS enforced
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] Dependencies updated
- [ ] Security testing completed

### Environment Variables

```bash
# Required
OPENRAG_API_KEY=your_key
OPENRAG_URL=https://your-openrag-instance

# Security (optional - with defaults)
MAX_FILE_SIZE_MB=5
MAX_IMAGE_DIMENSION=10000
IMAGE_RESIZE_DIMENSION=1024

# Optional services
EVERART_API_KEY=your_key
ASTRA_DB_APPLICATION_TOKEN=your_token
ASTRA_DB_ENDPOINT=your_endpoint
```

## Support and Updates

- Review security logs regularly
- Keep dependencies updated
- Monitor OWASP Top 10 changes
- Update security controls as needed

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Zod Documentation](https://zod.dev/)