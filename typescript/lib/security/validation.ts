/**
 * Input Validation Library
 * 
 * Zod schemas for validating all user inputs to prevent injection attacks,
 * data corruption, and API abuse.
 * 
 * Based on OWASP best practices for input validation.
 */

import { z } from 'zod';

// ============================================================================
// STRING VALIDATION
// ============================================================================

/**
 * Safe string validation with length limits
 */
export const safeStringSchema = z
  .string()
  .min(1, 'String cannot be empty')
  .max(1000, 'String too long (max 1000 characters)')
  .trim();

/**
 * Short string for IDs, names, etc.
 */
export const shortStringSchema = z
  .string()
  .min(1, 'String cannot be empty')
  .max(100, 'String too long (max 100 characters)')
  .trim();

/**
 * Alphanumeric string (IDs, usernames, etc.)
 */
export const alphanumericSchema = z
  .string()
  .min(1, 'String cannot be empty')
  .max(100, 'String too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, hyphens, and underscores allowed');

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Image URL validation - must be HTTPS and from allowed domains
 */
export const imageUrlSchema = z
  .string()
  .url('Invalid URL format')
  .startsWith('https://', 'URL must use HTTPS')
  .max(2048, 'URL too long')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const allowedDomains = [
          'everart.ai',
          'storage.googleapis.com',
          'githubusercontent.com',
        ];
        return allowedDomains.some(domain => 
          parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
      } catch {
        return false;
      }
    },
    {
      message: 'URL must be from an allowed domain (everart.ai, googleapis.com, or githubusercontent.com)',
    }
  );

// ============================================================================
// CHAT/MESSAGE VALIDATION
// ============================================================================

/**
 * Chat message validation
 */
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long (max 10000 characters)')
    .trim(),
  previousResponseId: z.string().nullable().optional(),
  chatId: z.string().nullable().optional(),
  filterId: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  scoreThreshold: z.number().min(0).max(1).optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// ============================================================================
// IMAGE GENERATION VALIDATION
// ============================================================================

/**
 * Image generation prompt validation
 */
export const imagePromptSchema = z
  .string()
  .min(1, 'Prompt cannot be empty')
  .max(2000, 'Prompt too long (max 2000 characters)')
  .trim();

/**
 * Image generation request validation
 */
export const imageGenerationSchema = z.object({
  prompt: imagePromptSchema,
  seed: z.number().int().optional(),
  model: z.string().max(50).optional(),
  image_count: z.number().int().min(1).max(4).optional(),
  transparentBackground: z.boolean().optional(),
  aspectRatio: z.string().max(20).optional(),
  setting: z.string().max(50).optional(),
  pixelize: z.boolean().optional(),
  race: z.string().max(50).optional(),
  sex: z.string().max(20).optional(),
  skipPixelize: z.boolean().optional(),
});

export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>;

// ============================================================================
// CHARACTER/MONSTER VALIDATION
// ============================================================================

/**
 * Monster ID validation
 */
export const monsterIdSchema = z
  .string()
  .min(1, 'Monster ID cannot be empty')
  .max(100, 'Monster ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid monster ID format');

/**
 * Character analysis request validation
 */
export const characterAnalysisSchema = z.object({
  monsterId: monsterIdSchema,
  inputComponentId: z.string().max(100).optional(),
});

export type CharacterAnalysisInput = z.infer<typeof characterAnalysisSchema>;

// ============================================================================
// DATABASE QUERY SANITIZATION
// ============================================================================

/**
 * Sanitize string for database queries
 * Prevents NoSQL injection by escaping special characters
 */
export function sanitizeForDb(input: string): string {
  // Remove or escape characters that could be used in NoSQL injection
  return input
    .replace(/[\$\{\}]/g, '') // Remove $, {, }
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[\\]/g, '') // Remove backslashes
    .trim();
}

/**
 * Validate and sanitize ID for database operations
 */
export function validateAndSanitizeId(id: unknown): string {
  const validated = alphanumericSchema.parse(id);
  return sanitizeForDb(validated);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Validate request body and return typed data or error response
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  try {
    const body = await request.json();
    const result = safeValidate(schema, body);
    
    if (!result.success) {
      return { success: false, error: result.error, status: 400 };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON in request body',
      status: 400,
    };
  }
}

/**
 * Get client IP address from request headers
 * Handles various proxy headers (Cloudflare, Vercel, etc.)
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  
  // Try various headers in order of preference
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;
  
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  
  return "unknown";
}

// Made with Bob
