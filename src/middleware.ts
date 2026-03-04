import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/me', // Used to check session
];

// System admin routes - use regular auth, then API checks systemAdmins collection
const systemAdminRoutes = [
  '/api/system-admin',
  '/system-admin',
];

// Static file patterns to skip
const staticPatterns = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

// Security headers applied to all responses
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  return response;
}

// Rate limit config: stricter for auth endpoints
const AUTH_RATE_LIMIT = { limit: 10, windowSeconds: 60 };
const API_RATE_LIMIT = { limit: 60, windowSeconds: 60 };

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (staticPatterns.some((pattern) => pathname.startsWith(pattern))) {
    return NextResponse.next();
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const clientId = getClientId(request.headers);
    const isAuthRoute = pathname.startsWith('/api/auth/');
    const config = isAuthRoute ? AUTH_RATE_LIMIT : API_RATE_LIMIT;
    const result = checkRateLimit(`${clientId}:${isAuthRoute ? 'auth' : 'api'}`, config);

    if (!result.allowed) {
      const response = NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(Math.ceil((result.resetTime - Date.now()) / 1000)));
      return addSecurityHeaders(response);
    }
  }

  // Check if it's a public route (exact match for '/', startsWith for others)
  const isPublicRoute = publicRoutes.some((route) => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute || isPublicApiRoute) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check for auth token
  const token = request.cookies.get('auth_token')?.value;

  // If no token and trying to access protected route
  if (!token) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      );
    }

    // Page routes redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists, let the request through
  // Full token validation happens in API routes via verifyAuth()
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
