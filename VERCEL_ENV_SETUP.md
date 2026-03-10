# Vercel Environment Variables Setup

## URGENT: Documents page is showing 0 documents on production

The Documents API is failing to connect to Firestore on Vercel. Here's what needs to be set:

## Required Environment Variables on Vercel

### 1. FIREBASE_SERVICE_ACCOUNT
**Value:** (Copy exactly from .env.local)
```json
{"type":"service_account","project_id":"kanban-yarndigital-db","private_key_id":"88287bbdb2e8b263015c6595b4d2e3b091c4ba2c","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDzwKgLhqIwJ83m\nmOBng5QkCu8yqf9VlA6uOD2j/SWl41vUEhMFUy4a4cgfavRm7YQfULgnDAtcdJ/l\nFd9RBFbOI9+vHrEy8mdpgYa/4sT+3pFJyOaOHKgV9D2BQA6DP6qI+UTTi6AA8bOT\nAqqYITJhBMk+0OxumVcjeROYfZeOWDmF1vCM2ofA+5J9YwlswdfWygVnZorRTBZl\ncM9QLUjlq4L042sqer2xXUBgq3Q3PL6lQU5AIgDSdMVC7sN1XEOBOSngCllnKGiF\nlQukJCoKeC/sDzx5glGXnNVG9QB6RYu21aN4dhNoUR1eg0kwAbTV82s2CP5JJR4z\nuYaRlUBdAgMBAAECggEAOQnXWPEdkU6zLheOhXKDDycW36BrnTM69zY2aGIjteyc\nz6SWGlwjUQuN+JoezFoenXRWT17QZsdsph8G5Y6yIGVBIdm5Be6217fFWDAgwHJF\nBcLS/qTCiXagkNb0Pm6+wXQxEJ6e57Gnf4pzcItuHklQLViWxu+vdh/OP9P9y8Mw\n6y1NYH44a9vV5ijOmhm8/aegoUjUyCLg44NaFe/eLRwq0ir320h+x5JdX7+BsAoH\nOljF42r5w3BbE3uaC5YJADPD6dDZ9+qyBdM7zqF3qA6SBAEy7VzC0K6t94pJ6PBK\nUF/+32ApKeQ41wnj04C8VoB5SRTrL/NRFgm4SmePsQKBgQD/6GXKiMEx5LbjXjyL\ns7IJ0I4G+xckynpPsyOG5yaiBOvx3y/SqG29chQO7XYQQOFAj+DBT/sqnvcGsXmS\nhZdfJCO41ZLzDA0WBwSA2mc8ZZcxIBl9fySaC+5RX5xEQTWPtnJ/Vl6VFph/9ZoX\n+H1OoS4sPSkprHw1InV4zJbWLQKBgQDz1yNCCeXuP+vdUul3JKnXn+d2xu3KBteA\nXt/e99gJ9J6qe1YbJtjFiWeZtFR8ibHag80tK9Te92YD2NA0iPSYVvHTODNrzTrh\npBC8+DLNICpjnfzqsz4I6q13G+eNn+z4gXgf0wh3As+cHa0A7yB6O9n6ZGLyDnOv\nIe/i4hAg8QKBgQCTxssJMwGFY1LtZ1zFO6aDHmj1xQdvWnFZFtRcMZ1QkFED4mNG\nXbbJYFgO6rdz2VN6KdubJimfSh7SQag3oWdxLHhoYwSxz3K7FqBWHEjjSrMNTkEK\nBGLJhjw/x1uA2rsoWy4xNFn39A1qTxSF5RvPTSpRp5vekdlEAbseX952nQKBgQCf\nNOq6ZYgRBP9VZJs2xWN3e9o+/Seo7sqp8EgvZpdR+LvYB+tykuyaHVrdSpaXMbhE\nOiYuxh2Y7uNWw6s9geZhyPLfvCQm0LsPNHYRS+Svdb73h+How9tPKxrTWA7Zs3+f\nybjK3pj6S4WOIvogUAFejdGG4SCRdsoloPzloEBzoQKBgQDbUB3hVZEz5gqlyXw1\nBoOdbl/Xek++OswiudB3EfQwGc6BjabQM1d3z4+JyJJNspsGSjAbVJ+XoU9Lj3Xs\n+Of0QmHGibguGQE32IgB/qjxRiwdeKqfOe8qaXnFrTgXsV+NHv+0pFDxrzenH9my\np6++NUYGwc2RoVo/XB9HvAuc2w==\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@kanban-yarndigital-db.iam.gserviceaccount.com","client_id":"112596595260348387700","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40kanban-yarndigital-db.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

### 2. Other Firebase Variables (from .env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCwTjn7bo722PyS4epqvZNXzVeR7wdE_g8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kanban-yarndigital-db.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kanban-yarndigital-db
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kanban-yarndigital-db.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=838859203293
NEXT_PUBLIC_FIREBASE_APP_ID=1:838859203293:web:b183257b7626f75b3bb134
```

### 3. Other Required Variables
```
JWT_SECRET=f8bffa9aef24c00eac929dcb8f4efe0a3586cdf5e5f8eefbf2d8a8f696d63796
FEEDHIVE_API_KEY=fh_UMWGHyvMFxhnJ5ub_ZLlUamS60dvc50aGw8qlEom
GITHUB_TOKEN=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
GITHUB_SKILLS_REPO=yarn-digital/yd-skills
GITHUB_CLIENTS_REPO=yarn-digital/yd-clients
```

## Setup Instructions

1. Go to Vercel Dashboard → yd-dashboard project → Settings → Environment Variables
2. Add all variables above
3. Redeploy the project

## Current Issue
- Documents are in Firestore (confirmed: 10 documents)
- API fails to connect on Vercel (likely missing FIREBASE_SERVICE_ACCOUNT)
- Local works, production doesn't

## Files Affected
- `src/lib/firebase-admin.ts` - Firebase initialization
- `src/app/api/documents/route.ts` - Documents API
- `scripts/migrate-documents.js` - Migration script (ran successfully)