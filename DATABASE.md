# YD Dashboard - Database Schema

## Overview

This document describes the complete Firestore database schema for the YD Dashboard CRM application.

- **Database**: Firebase Firestore
- **Project**: kanban-yarndigital-db
- **TypeScript Types**: `src/types/database.ts`
- **Security Rules**: `firestore.rules`
- **Indexes**: `firestore.indexes.json`

---

## Collections Summary

| Collection | Description | Module |
|------------|-------------|--------|
| `users` | User accounts and auth | Auth |
| `contacts` | Client/contact records | Contacts |
| `tags` | Contact tags | Contacts |
| `customFieldDefinitions` | Custom field schemas | Contacts |
| `leads` | Lead records | Leads |
| `leadForms` | Lead capture forms | Leads |
| `proposals` | Lead proposals | Leads |
| `projects` | Project records | Projects |
| `projectFiles` | Project file attachments | Projects |
| `projectNotes` | Project notes | Projects |
| `conversations` | Message conversations | Messages |
| `messages` | Individual messages | Messages |
| `messageTemplates` | Message templates | Messages |
| `chatWidgetSettings` | Live chat config | Messages |
| `calendarEvents` | Calendar events | Calendar |
| `availabilitySettings` | Booking availability | Calendar |
| `appointmentTypes` | Bookable services | Calendar |
| `bookings` | Client bookings | Calendar |
| `googleCalendarTokens` | Google OAuth tokens | Calendar |
| `forms` | Form builder forms | Forms |
| `formSubmissions` | Form responses | Forms |
| `invoices` | Invoice records | Invoicing |
| `payments` | Payment records | Invoicing |
| `taxRates` | Tax rate configs | Invoicing |
| `stripeAccounts` | Stripe Connect accounts | Invoicing |
| `contractTemplates` | Contract templates | Contracts |
| `contracts` | Contract records | Contracts |
| `portalSettings` | Client portal config | Portal |
| `portalSessions` | Portal auth sessions | Portal |
| `portalActivity` | Portal activity logs | Portal |
| `workflowTemplates` | Workflow templates | Workflows |
| `taskLabels` | Task label colors | Workflows |
| `automations` | Automation rules | Automations |
| `automationRuns` | Automation run logs | Automations |
| `automationQueue` | Scheduled actions | Automations |
| `businessSettings` | Business info | Settings |
| `brandingSettings` | Branding config | Settings |
| `notificationSettings` | Notification prefs | Settings |
| `integrations` | OAuth integrations | Settings |
| `subscriptions` | Subscription plans | Settings |

---

## Data Ownership Model

All collections use a `userId` field to scope data to the owning user. Security rules enforce:

1. **Read**: Only owner can read their documents
2. **Create**: `userId` must match authenticated user
3. **Update**: Only owner can update
4. **Delete**: Only owner can delete (with exceptions)

### Collections that cannot be deleted:
- `payments` (audit trail)
- `portalActivity` (audit trail)
- `automationRuns` (audit trail)
- Settings collections (use update instead)

---

## Key Relationships

```
users
  └── contacts (userId)
        ├── projects (contactId)
        │     ├── projectFiles (projectId)
        │     ├── projectNotes (projectId)
        │     ├── invoices (projectId)
        │     └── contracts (projectId)
        ├── invoices (contactId)
        ├── contracts (contactId)
        └── conversations (contactId)
              └── messages (conversationId)

users
  └── leads (userId)
        ├── proposals (leadId)
        └── → converts to → contacts + projects

users
  └── forms (userId)
        └── formSubmissions (formId)

users
  └── calendarEvents (userId)
        └── bookings (calendarEventId)

users
  └── automations (userId)
        └── automationRuns (automationId)
              └── automationQueue (automationRunId)
```

---

## Collection Details

### users
Primary user account data.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| email | string | Unique email |
| password | string | Hashed password |
| name | string | Display name |
| role | 'user' \| 'admin' | User role |
| emailVerified | boolean | Email verified flag |
| passwordResetToken | string? | Hashed reset token |
| passwordResetExpires | timestamp? | Token expiry |
| createdAt | timestamp | Creation date |
| updatedAt | timestamp | Last update |

### contacts
Client and contact records.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| userId | string | Owner user ID |
| firstName | string | First name |
| lastName | string | Last name |
| email | string | Email address |
| phone | string? | Phone number |
| company | string? | Company name |
| type | enum | lead, client, past_client, vendor, other |
| tags | string[] | Tag names |
| lifetimeValue | number | Total paid invoices |
| projectCount | number | Number of projects |
| createdAt | timestamp | Creation date |
| updatedAt | timestamp | Last update |

### leads
Lead/prospect records.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| userId | string | Owner user ID |
| name | string | Lead name |
| email | string | Email address |
| status | enum | new, contacted, qualified, proposal_sent, won, lost |
| priority | enum | low, medium, high |
| tags | string[] | Tag names |
| notes | Note[] | Internal notes |
| convertedToProjectId | string? | Linked project after conversion |
| convertedToContactId | string? | Linked contact after conversion |
| createdAt | timestamp | Creation date |
| updatedAt | timestamp | Last update |

### projects
Project records.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| userId | string | Owner user ID |
| contactId | string | Client contact ID |
| name | string | Project name |
| status | enum | draft, active, on_hold, completed, cancelled, archived |
| quotedAmount | number? | Quoted price |
| currency | string | Currency code |
| workflowTasks | WorkflowTask[] | Task checklist |
| invoiceIds | string[] | Linked invoice IDs |
| contractIds | string[] | Linked contract IDs |
| createdAt | timestamp | Creation date |
| updatedAt | timestamp | Last update |

### invoices
Invoice records.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| userId | string | Owner user ID |
| contactId | string | Client contact ID |
| projectId | string? | Linked project ID |
| invoiceNumber | string | Invoice number |
| lineItems | LineItem[] | Invoice line items |
| subtotal | number | Subtotal amount |
| taxAmount | number | Tax amount |
| total | number | Total amount |
| amountPaid | number | Amount paid so far |
| balanceDue | number | Remaining balance |
| status | enum | draft, sent, viewed, partial, paid, overdue, void |
| dueDate | timestamp | Payment due date |
| createdAt | timestamp | Creation date |
| updatedAt | timestamp | Last update |

### contracts
Contract records.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| userId | string | Owner user ID |
| contactId | string | Client contact ID |
| name | string | Contract name |
| content | string | Contract HTML content |
| signers | ContractSigner[] | Signer details |
| status | enum | draft, sent, partially_signed, signed, declined, expired |
| signedPdfUrl | string? | Signed PDF URL |
| createdAt | timestamp | Creation date |
| updatedAt | timestamp | Last update |

---

## Indexing Strategy

Composite indexes are defined for common query patterns:

1. **User + Status + Date**: For filtered lists (leads, projects, invoices)
2. **User + Contact**: For contact-scoped queries
3. **Conversation + Date**: For message threading
4. **Form + Date**: For submission lists
5. **Automation + Date**: For run history

See `firestore.indexes.json` for complete index definitions.

---

## Security Rules

All rules follow the principle of least privilege:

```javascript
// Example: Only owner can access their contacts
match /contacts/{contactId} {
  allow read: if resource.data.userId == request.auth.uid;
  allow create: if request.resource.data.userId == request.auth.uid;
  allow update: if resource.data.userId == request.auth.uid;
  allow delete: if resource.data.userId == request.auth.uid;
}
```

See `firestore.rules` for complete security configuration.

---

## TypeScript Usage

Import types from `@/types`:

```typescript
import { Contact, Lead, Project, Invoice, COLLECTIONS } from '@/types';

// Use in API routes
const contact: Contact = {
  id: 'abc123',
  userId: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  type: 'client',
  tags: ['vip'],
  lifetimeValue: 5000,
  projectCount: 3,
  outstandingAmount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Use collection names
await db.collection(COLLECTIONS.CONTACTS).add(contact);
```

---

## Migration Notes

When adding new collections or fields:

1. Update `src/types/database.ts` with new types
2. Add security rules to `firestore.rules`
3. Add indexes to `firestore.indexes.json`
4. Update this documentation
5. Deploy rules: `firebase deploy --only firestore:rules`
6. Deploy indexes: `firebase deploy --only firestore:indexes`

---

*Last updated: 2026-02-07*
