/**
 * Security Logging Utility
 * 
 * Provides structured logging for security events including:
 * - File upload attempts
 * - Validation failures
 * - API errors
 * - Suspicious activity
 */

export interface SecurityLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Security logger with structured output
 */
class SecurityLogger {
  private formatLog(entry: SecurityLogEntry): string {
    return JSON.stringify(entry);
  }

  info(category: string, message: string, details?: Record<string, any>): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      category,
      message,
      details,
    };
    console.log(`[SECURITY:${category}] INFO:`, this.formatLog(entry));
  }

  warn(category: string, message: string, details?: Record<string, any>): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      category,
      message,
      details,
    };
    console.warn(`[SECURITY:${category}] WARN:`, this.formatLog(entry));
  }

  error(category: string, message: string, details?: Record<string, any>): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      category,
      message,
      details,
    };
    console.error(`[SECURITY:${category}] ERROR:`, this.formatLog(entry));
  }
}

// Export singleton instance
export const securityLog = new SecurityLogger();

/**
 * Log file upload attempts
 */
export function logFileUpload(
  ip: string,
  filename: string,
  size: number,
  valid: boolean,
  error?: string
): void {
  const details = {
    ip,
    filename,
    size,
    valid,
    error,
  };

  if (valid) {
    securityLog.info('FILE_UPLOAD', 'File upload successful', details);
  } else {
    securityLog.warn('FILE_UPLOAD', 'File upload rejected', details);
  }
}

/**
 * Log validation failures
 */
export function logValidationFailure(
  endpoint: string,
  ip: string,
  error: string,
  input?: any
): void {
  securityLog.warn('VALIDATION', 'Input validation failed', {
    endpoint,
    ip,
    error,
    // Don't log full input to avoid logging sensitive data
    inputType: typeof input,
  });
}

/**
 * Log API errors
 */
export function logApiError(
  endpoint: string,
  method: string,
  error: string,
  statusCode: number
): void {
  securityLog.error('API_ERROR', 'API request failed', {
    endpoint,
    method,
    error,
    statusCode,
  });
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  category: string,
  ip: string,
  description: string,
  details?: Record<string, any>
): void {
  securityLog.warn('SUSPICIOUS', description, {
    category,
    ip,
    ...details,
  });
}

// Made with Bob
