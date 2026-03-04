/**
 * In-memory rate limiter for auth endpoints
 * Uses a Map with IP + timestamp tracking
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface LockoutEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

// Rate limit store: IP -> entry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Account lockout store: email -> entry  
const lockoutStore = new Map<string, LockoutEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }

  for (const [key, entry] of lockoutStore) {
    if (entry.lockedUntil && now > entry.lockedUntil && entry.failedAttempts === 0) {
      lockoutStore.delete(key);
    }
  }
}

/**
 * Check rate limit for an IP address
 * @returns { allowed: boolean, retryAfterMs?: number }
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; retryAfterMs?: number } {
  cleanup();
  const now = Date.now();
  const key = `rate:${ip}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Record a failed login attempt for account lockout
 */
export function recordFailedLogin(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const entry = lockoutStore.get(normalizedEmail);

  if (!entry) {
    lockoutStore.set(normalizedEmail, {
      failedAttempts: 1,
      lockedUntil: null,
      lastAttempt: now,
    });
    return;
  }

  // If previously locked but lockout expired, reset
  if (entry.lockedUntil && now > entry.lockedUntil) {
    entry.failedAttempts = 1;
    entry.lockedUntil = null;
    entry.lastAttempt = now;
    return;
  }

  entry.failedAttempts++;
  entry.lastAttempt = now;

  // Lock after 5 failed attempts (15 min cooldown)
  if (entry.failedAttempts >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000; // 15 minutes
  }
}

/**
 * Check if account is locked out
 */
export function isAccountLocked(email: string): { locked: boolean; retryAfterMs?: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = lockoutStore.get(normalizedEmail);

  if (!entry || !entry.lockedUntil) {
    return { locked: false };
  }

  const now = Date.now();
  if (now > entry.lockedUntil) {
    // Lockout expired, reset
    entry.failedAttempts = 0;
    entry.lockedUntil = null;
    return { locked: false };
  }

  return { locked: true, retryAfterMs: entry.lockedUntil - now };
}

/**
 * Record a successful login (resets failed attempts)
 */
export function recordSuccessfulLogin(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  lockoutStore.delete(normalizedEmail);
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
