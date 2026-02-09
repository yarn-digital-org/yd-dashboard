This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

### Required

```bash
# Firebase Configuration (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (Server-side)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
# or use base64 encoded version:
FIREBASE_CREDENTIALS_BASE64=

# JWT Authentication
JWT_SECRET=your-secure-secret-at-least-32-chars
```

### Google Calendar OAuth (Per-User Integration)

To enable per-user Google Calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Go to "APIs & Services" > "Credentials"
5. Create OAuth 2.0 Client ID (Web application)
6. Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback`
7. Copy the Client ID and Client Secret

```bash
# Google OAuth for Calendar Integration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Base URL for OAuth callbacks
NEXTAUTH_URL=https://your-domain.com
# or for local development:
NEXTAUTH_URL=http://localhost:3000
```

**Note:** Users connect their own Google Calendar through Settings > Integrations. Each user's tokens are stored securely in Firebase.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
