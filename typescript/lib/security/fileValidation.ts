/**
 * File Validation Library
 * 
 * Multi-layer validation for file uploads to prevent:
 * - Malicious file uploads
 * - Decompression bombs
 * - MIME type spoofing
 * - Oversized files
 * 
 * Based on OWASP best practices for file upload security.
 */

import sharp from 'sharp';
import { securityLog, logFileUpload } from './logger';

// Configuration from environment variables with sensible defaults
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);
const MAX_IMAGE_DIMENSION = parseInt(process.env.MAX_IMAGE_DIMENSION || '10000', 10);
const IMAGE_RESIZE_DIMENSION = parseInt(process.env.IMAGE_RESIZE_DIMENSION || '1024', 10);

// Maximum file size in bytes
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

// Allowed MIME types for uploads
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

/**
 * Validation result for file uploads
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Validates an uploaded file for security
 * Checks file size, MIME type, and actual file content
 */
export async function validateUploadedFile(
  file: File
): Promise<FileValidationResult> {
  // Check 1: File size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      size: file.size,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
      size: 0,
    };
  }

  // Check 2: Declared MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      mimeType: file.type,
    };
  }

  // Check 3: Verify it's a valid image that Sharp can process
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        error: 'Invalid image: missing dimensions',
      };
    }

    // Additional check: reasonable dimensions (prevent decompression bombs)
    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      return {
        valid: false,
        error: `Image dimensions too large. Maximum: ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}`,
      };
    }

    return {
      valid: true,
      mimeType: file.type,
      size: file.size,
    };

  } catch (error) {
    return {
      valid: false,
      error: 'Invalid or corrupted image file',
    };
  }
}

/**
 * Sanitizes an image by re-encoding it through Sharp
 * This strips metadata and potential malicious payloads
 */
export async function sanitizeImage(
  buffer: Buffer,
  maxDimension: number = IMAGE_RESIZE_DIMENSION
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if needed
    let processedImage = image;
    if (metadata.width && metadata.height && 
        (metadata.width > maxDimension || metadata.height > maxDimension)) {
      processedImage = image.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Re-encode to PNG for consistency and safety
    const sanitizedBuffer = await processedImage
      .png({ quality: 90 })
      .toBuffer();

    return {
      buffer: sanitizedBuffer,
      mimeType: 'image/png',
    };
  } catch (error) {
    throw new Error('Failed to sanitize image');
  }
}

/**
 * Validate file from FormData
 */
export async function validateFormDataFile(
  formData: FormData,
  fieldName: string = 'file'
): Promise<{ valid: true; file: File } | { valid: false; error: string }> {
  const file = formData.get(fieldName);
  
  if (!file) {
    return {
      valid: false,
      error: `No file provided in field '${fieldName}'`,
    };
  }

  if (!(file instanceof File)) {
    return {
      valid: false,
      error: 'Invalid file format',
    };
  }

  const validation = await validateUploadedFile(file);
  
  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error || 'File validation failed',
    };
  }

  return {
    valid: true,
    file,
  };
}

/**
 * Log configuration on module load
 */
securityLog.info(
  'FILE_VALIDATION',
  'File validation configured',
  {
    maxFileSizeMB: MAX_FILE_SIZE_MB,
    maxImageDimension: MAX_IMAGE_DIMENSION,
    imageResizeDimension: IMAGE_RESIZE_DIMENSION,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  }
);

// Made with Bob
