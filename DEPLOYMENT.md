# Deployment Guide — Yarn Digital Dashboard

## Prerequisites

- Node.js 18+ (recommended: 20+)
- A Firebase project with Firestore and Storage enabled
- A Vercel account (recommended) or any Node.js hosting platform

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing JWT tokens. **Minimum 32 characters.** Generate with: `openssl rand -hex 32` |
| `FIREBASE_CREDENTIALS_BASE64` | Base64-encoded Firebase service account JSON. See [Firebase Setup](#firebase-setup). Alternatively use `FIREBASE_SERVICE_ACCOUNT`. |
| `FIREBASE_SERVICE_ACCOUNT` | Raw JSON string of Firebase service account credentials. Use this **or** `FIREBASE_CREDENTIALS_BASE64` (not both). |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) for sending transactional emails. If not set, emails are logged to console. | _(none — emails logged)_ |
| `EMAIL_FROM` | Sender email address for outgoing emails | `noreply@yarndigital.co.uk` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (used in email links) | `https://yd-dashboard.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for Calendar integration | _(none — Calendar disabled)_ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret for Calendar integration | _(none — Calendar disabled)_ |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | `{APP_URL}/api/auth/google/callback` |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name | `{project_id}.appspot.com` |

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Create a project**
3. Enable **Firestore Database** (start in production mode)
4. Enable **Firebase Storage**

### 2. Generate Service Account Credentials

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save the downloaded JSON file

### 3. Encode Credentials

```bash
# Option A: Base64 encode (recommended for environment variables)
cat path/to/serviceAccountKey.json | base64 -w0

# Set as FIREBASE_CREDENTIALS_BASE64

# Option B: Use the raw JSON directly
# Set as FIREBASE_SERVICE_ACCOUNT (escape quotes for your shell/platform)
```

### 4. Firestore Indexes

The app creates indexes automatically on first use. If you encounter index errors, the error message will include a link to create the required index.

### 5. Storage Rules

Set Firebase Storage rules to allow authenticated uploads:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Resend Email Setup

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your domain (or use the sandbox domain for testing)
3. Generate an API key
4. Set `RESEND_API_KEY` in your environment

**Note:** If `RESEND_API_KEY` is not configured, all emails (verification, password reset, notifications) will be logged to the server console instead. The app will function normally — users just won't receive emails.

## Google Calendar OAuth Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Calendar API**
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback`
7. Copy the Client ID and Client Secret

### 2. Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Set user type (External for public, Internal for workspace-only)
3. Add scopes: `https://www.googleapis.com/auth/calendar`
4. Add test users if using External type in testing mode

### 3. Set Environment Variables

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

**Note:** If Google Calendar is not configured, the Calendar page shows a friendly prompt to configure it in Settings, rather than breaking.

## Deploy to Vercel

### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your Git repository directly in the Vercel dashboard.

### 2. Set Environment Variables

In the Vercel dashboard, go to **Settings** → **Environment Variables** and add all required variables.

### 3. Custom Domain

1. Go to **Settings** → **Domains** in Vercel
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` to match your custom domain
5. Update `GOOGLE_REDIRECT_URI` if using Google Calendar

## Deploy to Other Platforms

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Manual

```bash
npm ci
npm run build
npm start
```

## Post-Deployment Checklist

- [ ] All required environment variables are set
- [ ] Firebase Firestore and Storage are enabled
- [ ] JWT_SECRET is at least 32 characters and unique per environment
- [ ] Test user registration and login
- [ ] Test email sending (or verify console fallback)
- [ ] If using Google Calendar, test OAuth flow end-to-end
- [ ] Verify HTTPS is enabled (required for secure cookies)
- [ ] Test PDF generation (invoice/contract print view)
- [ ] Review Firestore security rules

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Database not configured" | Check `FIREBASE_CREDENTIALS_BASE64` or `FIREBASE_SERVICE_ACCOUNT` is set correctly |
| "JWT_SECRET environment variable is required" | Set `JWT_SECRET` (minimum 32 characters) |
| Emails not sending | Check `RESEND_API_KEY` is set and valid. Check server logs for fallback messages. |
| Google Calendar shows "not connected" | Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. Check redirect URI matches. |
| Cookies not working | Ensure HTTPS is enabled in production (required for secure cookies) |
| Avatar upload fails | Check Firebase Storage is enabled and bucket is correctly configured |
