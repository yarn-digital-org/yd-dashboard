/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for a given key (usually IP or user ID).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 60, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    store.set(key, {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    });
    return { allowed: true, remaining: config.limit - 1, resetTime: now + config.windowSeconds * 1000 };
  }

  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);

  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  return { allowed: true, remaining, resetTime: entry.resetTime };
}

/**
 * Get client identifier from request headers.
 */
export function getClientId(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
