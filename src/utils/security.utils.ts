import crypto from 'crypto';

/**
 * Password validation rules
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password complexity
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate mobile number with country code
 * Format: +[country code][number]
 * Example: +919876543210 (India), +1234567890 (US)
 */
export function validateMobileNumber(mobileNumber: string): {
  isValid: boolean;
  error?: string;
  countryCode?: string;
  number?: string;
} {
  // Remove any spaces or dashes
  const cleaned = mobileNumber.replace(/[\s-]/g, '');

  // Check if it starts with +
  if (!cleaned.startsWith('+')) {
    return {
      isValid: false,
      error: 'Mobile number must include country code (e.g., +91 for India)',
    };
  }

  // Extract country code and number
  // Country code: 1-3 digits after +
  // Number: remaining digits (typically 7-15 digits)
  const match = cleaned.match(/^\+(\d{1,3})(\d{7,15})$/);

  if (!match) {
    return {
      isValid: false,
      error:
        'Invalid mobile number format. Expected: +[country code][number] (e.g., +919876543210)',
    };
  }

  const [, countryCode, number] = match;

  // Validate country code (common codes: 1, 91, 44, etc.)
  if (countryCode.length < 1 || countryCode.length > 3) {
    return {
      isValid: false,
      error: 'Invalid country code',
    };
  }

  // Validate number length (typically 7-15 digits)
  if (number.length < 7 || number.length > 15) {
    return {
      isValid: false,
      error: 'Invalid number length. Number should be 7-15 digits',
    };
  }

  return {
    isValid: true,
    countryCode,
    number,
  };
}

/**
 * Generate a secure random refresh token
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  // Check X-Forwarded-For header (for proxies/load balancers)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket remote address
  return request.ip || request.socket?.remoteAddress || 'unknown';
}

/**
 * Get device/user agent info from request
 */
export function getDeviceInfo(request: {
  headers: Record<string, string | string[] | undefined>;
}): string {
  const userAgent = request.headers['user-agent'];
  return userAgent ? (Array.isArray(userAgent) ? userAgent[0] : userAgent) : 'unknown';
}

/**
 * Account lockout configuration
 */
export const ACCOUNT_LOCKOUT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
} as const;
