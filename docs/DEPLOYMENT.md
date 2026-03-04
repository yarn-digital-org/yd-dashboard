# YD Dashboard - Deployment Guide

This guide covers deploying YD Dashboard to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Firebase Setup](#firebase-setup)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)

---

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- Firebase project created
- Vercel account (recommended) or other hosting platform
- Domain name (optional but recommended)
- Email service account (Resend recommended)
- Stripe account (for payments)

---

## Environment Variables

Create a `.env.production` file with these variables:

### Required Variables

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (Service Account)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@your-domain.com

# Google OAuth (for Calendar integration)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Optional Variables

```bash
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Feature Flags
NEXT_PUBLIC_ENABLE_PORTAL=true
NEXT_PUBLIC_ENABLE_AUTOMATIONS=true
```

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Follow setup wizard
4. Enable Firestore Database
5. Enable Storage
6. Enable Authentication (Email/Password provider)

### 2. Get Configuration

**Web App Config:**
1. Project Settings → General
2. Scroll to "Your apps"
3. Click web icon (</>)
4. Copy config values to `NEXT_PUBLIC_FIREBASE_*` env vars

**Service Account:**
1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Extract values to `FIREBASE_*` env vars

### 3. Set Up Firestore

**Security Rules:**
```bash
firebase deploy --only firestore:rules
```

**Indexes:**
```bash
firebase deploy --only firestore:indexes
```

### 4. Set Up Storage

**Security Rules:**
```bash
firebase deploy --only storage
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Built for Next.js
- Automatic deployments
- Edge functions
- Free SSL
- Global CDN

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables**
   - Go to Vercel dashboard
   - Select your project
   - Settings → Environment Variables
   - Add all variables from `.env.production`

5. **Configure Domain**
   - Domains tab
   - Add custom domain
   - Update DNS records as instructed

**Automatic Deployments:**
- Connect GitHub repository
- Auto-deploy on push to main branch
- Preview deployments for pull requests

### Option 2: Docker + Cloud Platform

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Build & Run:**
```bash
docker build -t yd-dashboard .
docker run -p 3000:3000 --env-file .env.production yd-dashboard
```

**Deploy to:**
- Google Cloud Run
- AWS ECS
- Azure Container Instances
- DigitalOcean App Platform

### Option 3: Traditional VPS

**Requirements:**
- Ubuntu 20.04+ or similar
- Nginx
- PM2
- Node.js 18+

**Steps:**

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/yd-dashboard.git
   cd yd-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm ci
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Configure PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "yd-dashboard" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Post-Deployment

### 1. Verify Deployment

- [ ] Visit your domain
- [ ] Create test account
- [ ] Test login/logout
- [ ] Create sample contact
- [ ] Test calendar sync
- [ ] Create test invoice
- [ ] Test booking flow
- [ ] Verify emails are sent

### 2. Create Admin Account

```bash
# Option 1: Through UI
- Register normally
- Update Firestore to set role='admin'

# Option 2: Firebase Console
- Authentication → Users → Add user
- Firestore → users → Add document with role='admin'
```

### 3. Configure DNS

Update DNS records:
```
Type    Name    Value
A       @       your-server-ip
CNAME   www     your-domain.com
```

### 4. Set Up Monitoring

**Health Check Endpoint:**
```http
GET https://your-domain.com/api/health
```

**Uptime Monitoring:**
- UptimeRobot
- Pingdom
- StatusCake

### 5. Configure Email Domain

For Resend:
1. Verify domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC)
3. Update `EMAIL_FROM` to use verified domain

### 6. Set Up Backups

**Firestore Backups:**
1. Go to Firebase Console
2. Firestore → Settings
3. Enable automatic backups
4. Choose backup location

**Storage Backups:**
- Use Firebase Storage export
- Set up scheduled exports to Cloud Storage

---

## Monitoring

### Application Monitoring

**Vercel Analytics:**
- Automatically enabled on Vercel
- View in Vercel dashboard

**Google Analytics:**
1. Create GA4 property
2. Add `NEXT_PUBLIC_GA_ID` env var
3. Deploy

**Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Database Monitoring

**Firestore Metrics:**
- Firebase Console → Firestore → Usage
- Monitor read/write operations
- Watch for quota limits

### Error Tracking

**Log Aggregation:**
- Use Vercel logs
- Or set up external service (Logtail, Papertrail)

**Error Alerts:**
- Configure Sentry alerts
- Set up email notifications

### Performance

**Lighthouse CI:**
```bash
npm install -D @lhci/cli
# Configure in .lighthouserc.json
```

**Web Vitals:**
- Monitor in Vercel dashboard
- Or use Google Search Console

---

## Scaling

### Firestore Scaling

- Firestore auto-scales
- Monitor quota usage
- Upgrade plan if needed

### Compute Scaling

**Vercel:**
- Auto-scales based on traffic
- Upgrade plan for higher limits

**Docker/VPS:**
- Use load balancer
- Add more instances
- Set up auto-scaling groups

### CDN

- Static assets served via Vercel CDN
- Or use Cloudflare for additional caching

---

## Security Checklist

- [ ] All env vars are set correctly
- [ ] JWT_SECRET is unique and secure
- [ ] Firebase security rules are deployed
- [ ] HTTPS is enabled
- [ ] CORS is configured properly
- [ ] Rate limiting is enabled (if applicable)
- [ ] Secrets are not in git history
- [ ] Dependencies are up to date
- [ ] Security headers are configured

---

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

- Verify Firebase credentials
- Check service account permissions
- Ensure Firestore is enabled

### Email Not Sending

- Verify Resend API key
- Check domain verification
- Review email logs in Resend dashboard

### Calendar Sync Issues

- Verify Google OAuth credentials
- Check redirect URIs match
- Ensure Calendar API is enabled

---

## Updates & Maintenance

### Deploying Updates

**Vercel:**
```bash
git push origin main
# Auto-deploys
```

**Manual:**
```bash
git pull
npm install
npm run build
pm2 restart yd-dashboard
```

### Database Migrations

1. Update schema in code
2. Deploy new version
3. Firestore migrations handled automatically
4. For breaking changes, create migration scripts

### Backup Strategy

- Automated daily Firestore backups
- Weekly full exports
- Keep 30 days of backups
- Test restore process quarterly

---

## Support

For deployment issues:
- Check troubleshooting section
- Review error logs
- Contact support team

---

*Last updated: 2026-03-04*
