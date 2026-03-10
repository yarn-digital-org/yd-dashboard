# Next.js Deployment Guide

A comprehensive guide for deploying Next.js applications to various platforms with best practices and optimization strategies.

## Overview

This skill covers the complete deployment workflow for Next.js applications, from build optimization to platform-specific deployment strategies. Learn how to deploy to Vercel, Netlify, AWS, and other platforms while ensuring optimal performance and reliability.

## Prerequisites

- Basic understanding of Next.js applications
- Familiarity with Git and version control
- Understanding of environment variables
- Basic knowledge of DNS and domains

## Deployment Platforms

### 1. Vercel (Recommended)

Vercel is the platform created by the Next.js team and offers the best integration.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from your project directory
vercel

# Production deployment
vercel --prod
```

**Vercel Configuration (`vercel.json`)**:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["lhr1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=out
```

**Netlify Configuration (`netlify.toml`)**:
```toml
[build]
  command = "npm run build"
  publish = "out"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. AWS (S3 + CloudFront)

```bash
# Build static export
npm run build

# Upload to S3
aws s3 sync out/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Build Configuration

### Static Export for Traditional Hosting

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### Server-Side Rendering (SSR)

```javascript
// next.config.js for platforms supporting Node.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  images: {
    domains: ['example.com', 'cdn.example.com'],
  },
}

module.exports = nextConfig
```

## Environment Variables

### Development vs Production

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=dev-secret-key

# .env.production (production)
NEXT_PUBLIC_API_URL=https://myapp.com/api
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/myapp
JWT_SECRET=super-secure-production-key
```

### Platform-Specific Environment Variables

**Vercel**:
- Set via Vercel Dashboard or CLI
- Supports preview and production environments
- Automatic HTTPS and custom domains

**Netlify**:
- Set via Netlify Dashboard
- Support for build hooks and deploy notifications

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})

# Run analysis
ANALYZE=true npm run build
```

### Image Optimization

```javascript
// Optimize images for deployment
import Image from 'next/image'

export default function MyComponent() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={800}
      height={600}
      priority // For above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

### Code Splitting

```javascript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(() => import('../components/Heavy'), {
  loading: () => <p>Loading...</p>,
  ssr: false // Disable SSR for heavy components
})

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <DynamicComponent />
    </div>
  )
}
```

## Deployment Workflow

### 1. Pre-Deployment Checklist

```bash
# Check for TypeScript errors
npm run type-check

# Run tests
npm run test

# Lint code
npm run lint

# Build locally to catch issues
npm run build
```

### 2. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
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
      run: npm run test
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### 3. Custom Domain Setup

**DNS Configuration**:
```
Type    Name    Value
CNAME   www     your-app.vercel.app
A       @       76.76.19.61 (Vercel's IP)
```

## Monitoring and Maintenance

### Error Tracking

```javascript
// pages/_app.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
})

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}
```

### Performance Monitoring

```javascript
// Performance monitoring with Web Vitals
export function reportWebVitals(metric) {
  console.log(metric)
  
  // Send to analytics
  if (process.env.NODE_ENV === 'production') {
    // gtag('event', metric.name, {
    //   value: Math.round(metric.value),
    //   event_label: metric.id,
    // })
  }
}
```

## Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Memory issues
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Clear cache
rm -rf .next
npm run build
```

**Environment Variables Not Loading**:
- Check variable names (must start with `NEXT_PUBLIC_` for client-side)
- Verify platform-specific environment variable settings
- Restart development server after adding new variables

**Static Export Issues**:
- Remove server-side features (API routes, `getServerSideProps`)
- Use `getStaticProps` and `getStaticPaths` instead
- Configure `next.config.js` for static export

## Best Practices

1. **Security**:
   - Never commit secrets to version control
   - Use platform environment variables for sensitive data
   - Implement proper CORS policies

2. **Performance**:
   - Enable compression and caching
   - Optimize images and fonts
   - Use CDN for static assets

3. **SEO**:
   - Configure proper meta tags
   - Use `next-sitemap` for sitemaps
   - Implement structured data

4. **Monitoring**:
   - Set up error tracking
   - Monitor Core Web Vitals
   - Implement health checks

## Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Next.js Performance Best Practices](https://nextjs.org/docs/advanced-features/measuring-performance)

## Related Skills

- [Firebase Patterns](./firebase-patterns.md)
- [Vercel Configuration](./vercel-config.md)
- React Performance Optimization
- TypeScript Best Practices