import { randomBytes, createHash } from 'crypto';

/**
 * Auth utilities
 */

// JWT Secret - MUST be set in environment
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  return secret;
}

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a token for storage (so we don't store plain tokens in DB)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Get token expiry time (1 hour from now)
 */
export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiryDate: Date | string): boolean {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  return expiry < new Date();
}
