# YD Dashboard

Internal CRM dashboard for Yarn Digital. Built with Next.js 15, Firebase Firestore, and deployed on Vercel.

## Features

- **Auth**: JWT-based authentication with secure cookie handling
- **Dashboard**: Revenue metrics, activity feed, period comparison
- **Contacts**: Full CRM with CSV import/export, duplicate detection
- **Leads**: Pipeline management with status tracking
- **Projects**: Project management with file attachments and workflow integration
- **Workflows**: Customisable workflow templates with task automation
- **Invoices & Contracts**: Financial document management
- **Content Scheduler**: Content planning and scheduling
- **Calendar**: Google Calendar integration (OAuth)
- **Client Portal**: External-facing portal with branding customisation
- **Settings**: Full settings panel (profile, team, 2FA, billing, portal)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Firestore (via firebase-admin)
- **Auth**: JWT with httpOnly cookies
- **Validation**: Zod schemas on all API routes
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel

## Security

- Rate limiting on all API routes (stricter for auth endpoints)
- Security headers: X-Frame-Options, CSP, HSTS, nosniff, XSS protection
- JWT token validation with minimum secret length enforcement
- Input validation via Zod on all endpoints
- Error boundary for graceful client-side failure handling
- Consistent API error response format

## Development

```bash
npm install
npm run dev       # Start dev server (localhost:3000)
npm test          # Run tests
npm run build     # Production build
npm run lint      # ESLint
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Min 32 chars, used for auth tokens |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key |
| `GOOGLE_CLIENT_ID` | No | For Google Calendar OAuth |
| `GOOGLE_CLIENT_SECRET` | No | For Google Calendar OAuth |

## API

All API routes return consistent JSON:

```json
{
  "success": true|false,
  "data": { ... },
  "error": "message",
  "code": "ERROR_CODE"
}
```

Rate limits: 60 req/min for general API, 10 req/min for auth endpoints.
