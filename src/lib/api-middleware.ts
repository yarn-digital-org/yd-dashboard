import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { z, ZodSchema, ZodError } from 'zod';
import { adminDb } from './firebase-admin';

// Simple in-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// XSS sanitization function
function sanitizeString(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeString);
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeString(val);
    }
    return sanitized;
  }
  return value;
}

// JWT_SECRET - must be set in environment
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET environment variable is required (min 32 chars)');
  }
  return secret;
}

// ============================================
// Types
// ============================================

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser;
}

// ============================================
// Error Classes
// ============================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, 'BAD_REQUEST', message);
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public errors: Record<string, string[]> = {}
  ) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class DatabaseError extends ApiError {
  constructor(message = 'Database error') {
    super(500, 'DATABASE_ERROR', message);
  }
}

// ============================================
// Rate Limiting & Security Helpers
// ============================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

const defaultRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later',
};

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const { windowMs, maxRequests, message } = { ...defaultRateLimit, ...config };

  return async (request: NextRequest, identifier: string): Promise<void> => {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = `${identifier}:${windowStart}`;

    const current = rateLimitStore.get(key);

    if (!current) {
      rateLimitStore.set(key, { count: 1, resetTime: windowStart + windowMs });
      // Clean up old entries
      for (const [oldKey, data] of rateLimitStore.entries()) {
        if (data.resetTime < now) {
          rateLimitStore.delete(oldKey);
        }
      }
      return;
    }

    if (current.count >= maxRequests) {
      throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', message || 'Too many requests');
    }

    current.count++;
    rateLimitStore.set(key, current);
  };
}

// Simple CSRF protection for state-changing operations
export async function verifyCSRF(request: NextRequest): Promise<void> {
  const method = request.method.toUpperCase();

  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Check if origin matches host
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean);

  const isValidOrigin = origin && allowedOrigins.some(allowed =>
    allowed && new URL(allowed).origin === origin
  );

  const isValidReferer = referer && allowedOrigins.some(allowed =>
    allowed && referer.startsWith(allowed)
  );

  if (!isValidOrigin && !isValidReferer) {
    throw new ForbiddenError('Invalid origin - potential CSRF attack');
  }
}

// ============================================
// Response Helpers
// ============================================

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 500,
  code = 'ERROR',
  errors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: message, code, errors },
    { status }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return errorResponse(error.message, error.statusCode, error.code, error.errors);
  }

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.code);
  }

  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    });
    return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  if (error instanceof Error) {
    return errorResponse(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  return errorResponse('Unknown error', 500, 'UNKNOWN_ERROR');
}

// ============================================
// Auth Middleware
// ============================================

export async function verifyAuth(request: NextRequest): Promise<AuthUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    throw new UnauthorizedError('No authentication token');
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;
    return decoded;
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function verifyAuthWithUser(request: NextRequest): Promise<AuthUser & { userData: Record<string, unknown> }> {
  const user = await verifyAuth(request);
  
  if (!adminDb) {
    throw new DatabaseError('Database not configured');
  }

  const userDoc = await adminDb.collection('users').doc(user.userId).get();
  
  if (!userDoc.exists) {
    throw new UnauthorizedError('User not found');
  }

  const userData = userDoc.data() || {};
  const { password: _, ...safeUserData } = userData;

  return { ...user, userData: safeUserData };
}

// Optional auth - returns null if not authenticated instead of throwing
export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await verifyAuth(request);
  } catch {
    return null;
  }
}

// ============================================
// Validation Middleware
// ============================================

export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  options: { sanitize?: boolean } = {}
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }

  // Sanitize for XSS prevention by default
  if (options.sanitize !== false) {
    body = sanitizeString(body);
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.') || 'body';
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    });
    throw new ValidationError('Validation failed', errors);
  }

  return result.data;
}

export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.') || 'query';
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    });
    throw new ValidationError('Invalid query parameters', errors);
  }

  return result.data;
}

// ============================================
// Database Helpers
// ============================================

export function requireDb() {
  if (!adminDb) {
    throw new DatabaseError('Database not configured');
  }
  return adminDb;
}

// ============================================
// Organization Helpers
// ============================================

// In-memory cache for orgId lookups (per-request lifecycle)
const orgIdCache = new Map<string, string>();

/**
 * Resolves the organization ID for a given user.
 * - If the user has an orgId in their user doc, returns it
 * - Otherwise falls back to user.userId (backwards compat)
 * - Caches lookups in memory for the duration of the request
 */
export async function resolveOrgId(user: AuthUser): Promise<string> {
  const cacheKey = user.userId;

  // Check cache first
  if (orgIdCache.has(cacheKey)) {
    return orgIdCache.get(cacheKey)!;
  }

  const db = requireDb();

  try {
    const userDoc = await db.collection('users').doc(user.userId).get();

    if (!userDoc.exists) {
      // User doc doesn't exist, fall back to userId
      orgIdCache.set(cacheKey, user.userId);
      return user.userId;
    }

    const userData = userDoc.data();
    const orgId = userData?.orgId || user.userId;

    // Cache the result
    orgIdCache.set(cacheKey, orgId);

    return orgId;
  } catch (error) {
    console.error('Error resolving orgId:', error);
    // On error, fall back to userId for backwards compatibility
    return user.userId;
  }
}

// ============================================
// API Handler Wrapper
// ============================================

type ApiHandler<T = unknown> = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<ApiResponse<T>>>;

type AuthenticatedApiHandler<T = unknown> = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) => Promise<NextResponse<ApiResponse<T>>>;

// Wrap handler with error handling
export function withErrorHandler<T>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (request, context): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error) as NextResponse<ApiResponse<T>>;
    }
  };
}

// Enhanced wrapper with auth, rate limiting, and CSRF protection
export function withAuth<T>(
  handler: AuthenticatedApiHandler<T>,
  options: {
    rateLimit?: Partial<RateLimitConfig>;
    skipCSRF?: boolean;
    skipRateLimit?: boolean;
  } = {}
): ApiHandler<T> {
  return async (request, context): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      // CSRF protection for state-changing operations
      if (!options.skipCSRF) {
        await verifyCSRF(request);
      }

      const user = await verifyAuth(request);

      // Rate limiting based on user ID
      if (!options.skipRateLimit) {
        const rateLimitFn = rateLimit(options.rateLimit);
        await rateLimitFn(request, `user:${user.userId}`);
      }

      return await handler(request, { ...context, user });
    } catch (error) {
      return handleApiError(error) as NextResponse<ApiResponse<T>>;
    }
  };
}

// Public endpoint wrapper with basic rate limiting
export function withPublicRateLimit<T>(
  handler: ApiHandler<T>,
  options: { rateLimit?: Partial<RateLimitConfig> } = {}
): ApiHandler<T> {
  return async (request, context): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      // Rate limiting based on IP address for public endpoints
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 (request as any).ip ||
                 'unknown';

      const rateLimitFn = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 50, // Lower limit for public endpoints
        ...options.rateLimit,
      });
      await rateLimitFn(request, `ip:${ip}`);

      return await handler(request, context);
    } catch (error) {
      return handleApiError(error) as NextResponse<ApiResponse<T>>;
    }
  };
}

// ============================================
// Common Validation Schemas
// ============================================

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
