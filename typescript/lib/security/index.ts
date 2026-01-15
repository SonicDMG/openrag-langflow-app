/**
 * Security Library
 * 
 * Centralized exports for all security utilities including:
 * - Input validation (Zod schemas)
 * - File validation
 * - Security logging
 * 
 * Based on OWASP best practices for web application security.
 */

// Validation exports
export {
  // Schemas
  safeStringSchema,
  shortStringSchema,
  alphanumericSchema,
  imageUrlSchema,
  chatMessageSchema,
  imagePromptSchema,
  imageGenerationSchema,
  characterAnalysisSchema,
  monsterIdSchema,
  
  // Types
  type ChatMessageInput,
  type ImageGenerationInput,
  type CharacterAnalysisInput,
  
  // Functions
  sanitizeForDb,
  validateAndSanitizeId,
  safeValidate,
  validateRequestBody,
  getClientIp,
} from './validation';

// File validation exports
export {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  type AllowedMimeType,
  type FileValidationResult,
  validateUploadedFile,
  sanitizeImage,
  validateFormDataFile,
} from './fileValidation';

// Logging exports
export {
  securityLog,
  logFileUpload,
  logValidationFailure,
  logApiError,
  logSuspiciousActivity,
  type SecurityLogEntry,
} from './logger';

// Made with Bob
