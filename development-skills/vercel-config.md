# Vercel Configuration & Optimization

Complete guide to configuring and optimizing Vercel deployments for maximum performance, scalability, and developer experience.

## Overview

This skill covers advanced Vercel configuration techniques, from basic deployment settings to complex edge functions, middleware, and performance optimizations. Learn how to leverage Vercel's platform features for production-ready applications.

## Prerequisites

- Understanding of Next.js applications
- Basic knowledge of serverless functions
- Familiarity with build tools and CI/CD
- Understanding of web performance metrics

## Basic Configuration

### 1. Project Configuration (`vercel.json`)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "outputDirectory": ".next",
  "regions": ["lhr1", "iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024,
      "runtime": "nodejs18.x"
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 2. Environment Variables

**Development vs Production**:
```bash
# Local development (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=mongodb://localhost:27017/myapp
WEBHOOK_SECRET=dev-secret

# Vercel Environment Variables
NEXT_PUBLIC_API_URL=https://myapp.vercel.app
DATABASE_URL=mongodb+srv://...
WEBHOOK_SECRET=production-secret
```

**Environment-Specific Configuration**:
```javascript
// next.config.js
const isDevelopment = process.env.NODE_ENV === 'development'
const isPreview = process.env.VERCEL_ENV === 'preview'
const isProduction = process.env.VERCEL_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  images: {
    domains: isDevelopment 
      ? ['localhost'] 
      : ['myapp.vercel.app', 'cdn.example.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  redirects: async () => {
    if (isProduction) {
      return [
        {
          source: '/old-path',
          destination: '/new-path',
          permanent: true,
        },
      ]
    }
    return []
  },
}

module.exports = nextConfig
```

## Advanced Deployment Configuration

### 1. Build Settings

```json
{
  "build": {
    "env": {
      "NODE_VERSION": "18.x",
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  },
  "installCommand": "npm ci --production=false",
  "buildCommand": "npm run build && npm run postbuild",
  "outputDirectory": "out"
}
```

### 2. Custom Build Process

```javascript
// Custom build script (package.json)
{
  "scripts": {
    "build": "next build",
    "postbuild": "next-sitemap && npm run compress-assets",
    "compress-assets": "gzip -k -r public/static",
    "analyze": "ANALYZE=true next build"
  }
}
```

## Serverless Functions

### 1. API Route Configuration

```javascript
// app/api/users/route.ts
export const maxDuration = 30 // seconds
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs18'

export async function GET(request) {
  try {
    // Heavy computation
    const result = await processLargeDataset()
    
    return Response.json({ data: result })
  } catch (error) {
    return Response.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
```

### 2. Function-Specific Configuration

```json
{
  "functions": {
    "app/api/heavy-computation/route.ts": {
      "maxDuration": 60,
      "memory": 3008,
      "runtime": "nodejs18.x"
    },
    "app/api/quick-response/route.ts": {
      "maxDuration": 5,
      "memory": 128,
      "runtime": "nodejs18.x"
    }
  }
}
```

## Edge Functions & Middleware

### 1. Edge Runtime Configuration

```javascript
// app/api/edge/route.ts
export const runtime = 'edge'

export async function GET(request) {
  const geo = request.geo
  const ip = request.ip
  
  return Response.json({
    country: geo?.country,
    region: geo?.region,
    city: geo?.city,
    ip: ip
  })
}
```

### 2. Middleware Configuration

```javascript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Redirect based on country
  const country = request.geo?.country
  
  if (country === 'CN' && !request.url.includes('/cn')) {
    return NextResponse.redirect(new URL('/cn', request.url))
  }
  
  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
```

## Performance Optimization

### 1. Caching Configuration

```json
{
  "headers": [
    {
      "source": "/api/data/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=86400, stale-while-revalidate"
        }
      ]
    },
    {
      "source": "/(.*).jpg",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Image Optimization

```javascript
// next.config.js
const nextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    domains: ['example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
}
```

### 3. Bundle Analysis & Optimization

```javascript
// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack configuration
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
})
```

## Domain & DNS Configuration

### 1. Custom Domains

```json
{
  "domains": [
    "myapp.com",
    "www.myapp.com",
    "api.myapp.com"
  ],
  "redirects": [
    {
      "source": "https://www.myapp.com/:path*",
      "destination": "https://myapp.com/:path*",
      "permanent": true
    }
  ]
}
```

### 2. SSL Configuration

```javascript
// Automatic HTTPS redirect
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
]
```

## Monitoring & Analytics

### 1. Web Vitals Integration

```javascript
// pages/_app.js
export function reportWebVitals(metric) {
  if (process.env.NODE_ENV === 'production') {
    // Send to Vercel Analytics
    if (window.va) {
      window.va('track', 'Web Vital', {
        name: metric.name,
        value: metric.value,
        id: metric.id,
      })
    }
    
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', metric.name, {
        custom_map: { metric_value: 'value' },
        metric_value: metric.value,
        event_label: metric.id,
      })
    }
  }
}
```

### 2. Error Tracking

```javascript
// Error boundary with Sentry integration
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})

export default function MyApp({ Component, pageProps, err }) {
  return (
    <Sentry.ErrorBoundary fallback={() => <ErrorFallback />}>
      <Component {...pageProps} err={err} />
    </Sentry.ErrorBoundary>
  )
}
```

## CI/CD Integration

### 1. GitHub Actions

```yaml
# .github/workflows/vercel.yml
name: Vercel Deployment

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Build project
        run: npm run build
        env:
          NODE_OPTIONS: --max-old-space-size=4096
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

### 2. Preview Deployments

```json
{
  "github": {
    "enabled": true,
    "autoJobCancelation": true,
    "autoAlias": true,
    "silent": false
  },
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "devCommand": "npm run dev"
}
```

## Security Configuration

### 1. Content Security Policy

```javascript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com *.vercel.app;
  child-src *.youtube.com *.vimeo.com;
  style-src 'self' 'unsafe-inline' *.googleapis.com;
  img-src * blob: data:;
  media-src 'none';
  connect-src *;
  font-src 'self' *.gstatic.com;
`

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'false',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

### 2. Environment Variable Security

```bash
# Secure environment variable patterns
NEXT_PUBLIC_API_URL=https://api.myapp.com  # Client-side accessible
DATABASE_URL=mongodb://...                  # Server-side only
JWT_SECRET=super-secret-key                 # Server-side only
VERCEL_TOKEN=...                           # Build-time only
```

## Database Integration

### 1. Connection Pooling

```javascript
// lib/mongodb.js
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
```

### 2. Prisma Configuration

```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Troubleshooting

### Common Issues

**Build Timeouts**:
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

**Memory Issues**:
```javascript
// webpack.config.js optimization
module.exports = {
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all'
      config.optimization.splitChunks.cacheGroups = {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      }
    }
    return config
  },
}
```

**Cold Start Optimization**:
```javascript
// Keep connections warm
export async function keepWarm() {
  if (process.env.VERCEL_ENV === 'production') {
    // Initialize database connections
    await connectToDatabase()
    
    // Pre-load frequently used modules
    await import('../lib/utils')
  }
}
```

## Best Practices

1. **Performance**:
   - Use edge runtime for simple functions
   - Implement proper caching strategies
   - Optimize bundle size

2. **Security**:
   - Set appropriate headers
   - Use environment variables for secrets
   - Implement CSP policies

3. **Monitoring**:
   - Track Web Vitals
   - Implement error tracking
   - Monitor function performance

4. **Cost Optimization**:
   - Optimize function execution time
   - Use appropriate memory allocation
   - Implement efficient caching

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)

## Related Skills

- [Next.js Deployment](./next-js-deployment.md)
- [Firebase Patterns](./firebase-patterns.md)
- React Performance Optimization
- Web Performance Monitoring