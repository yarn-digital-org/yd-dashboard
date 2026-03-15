import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/free-audit',
  '/lp/',
  '/brand',
  '/web-design',
  '/grow',
  '/seo-audit',
  '/new-website',
  '/new-brand',
  '/shopify',
  '/get-quote',
  '/free-review',
  '/free-consultation',
  '/web-design-belfast',
  '/website-not-working',
  '/yarn-digital',
];

// API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/me', // Used to check session
  '/api/forms/', // Form submissions are public
  '/api/agents/', // Agent heartbeat, status, messaging endpoints
  '/api/tasks/', // Task CRUD for agents (auth handled in route)
  '/api/slack/', // Slack message feed for agents
  '/api/documents/upload', // Agent document upload (auto-publish to dashboard)
  '/api/public/leads', // Public lead capture from landing pages
];

// Static file patterns to skip
const staticPatterns = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (staticPatterns.some((pattern) => pathname.startsWith(pattern))) {
    return NextResponse.next();
  }

  // Check if it's a public route (exact match for '/', startsWith for others)
  const isPublicRoute = publicRoutes.some((route) => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth_token')?.value;

  // If no token and trying to access protected route
  if (!token) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Page routes redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists, let the request through
  // Full token validation happens in API routes via verifyAuth()
  return NextResponse.next();
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
