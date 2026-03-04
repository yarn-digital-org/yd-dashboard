# YD Dashboard API Documentation

Complete API reference for the YD Dashboard CRM application.

## Base URL

```
http://localhost:3000/api
https://your-deployment.vercel.app/api
```

## Authentication

Most API endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Public endpoints (no auth required):
- `POST /api/bookings` - Create a booking
- `GET /api/bookings/available-slots` - Get available time slots
- `GET /api/appointment-types?userId=<userId>` - List public appointment types

---

## Auth Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": { ... }
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "userId": "...",
    "email": "...",
    "name": "..."
  }
}
```

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "password": "new-password"
}
```

---

## Contacts

### List Contacts
```http
GET /api/contacts
Authorization: Bearer <token>
```

### Create Contact
```http
POST /api/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "type": "client"
}
```

### Get Contact
```http
GET /api/contacts/{id}
Authorization: Bearer <token>
```

### Update Contact
```http
PUT /api/contacts/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "phone": "+0987654321"
}
```

### Delete Contact
```http
DELETE /api/contacts/{id}
Authorization: Bearer <token>
```

---

## Leads

### List Leads
```http
GET /api/leads
Authorization: Bearer <token>
```

### Create Lead
```http
POST /api/leads
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Potential Client",
  "email": "lead@example.com",
  "status": "new",
  "priority": "high"
}
```

### Update Lead
```http
PUT /api/leads/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "qualified",
  "notes": [...]
}
```

---

## Projects

### List Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Website Redesign",
  "contactId": "contact-id",
  "status": "active",
  "quotedAmount": 5000,
  "currency": "USD"
}
```

### Update Project
```http
PUT /api/projects/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

### Add Project Note
```http
POST /api/projects/{id}/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Project kickoff completed",
  "isShared": true
}
```

### Upload Project File
```http
POST /api/projects/{id}/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
folder: "designs"
isShared: true
```

---

## Invoices

### List Invoices
```http
GET /api/invoices
Authorization: Bearer <token>
```

### Create Invoice
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "contactId": "...",
  "projectId": "...",
  "lineItems": [
    {
      "description": "Web Design",
      "quantity": 1,
      "unitPrice": 2500,
      "amount": 2500
    }
  ],
  "dueDate": "2026-04-01T00:00:00.000Z"
}
```

### Update Invoice
```http
PUT /api/invoices/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "paid"
}
```

---

## Calendar

### List Calendar Events
```http
GET /api/calendar/events
Authorization: Bearer <token>
```

### Create Event
```http
POST /api/calendar/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Client Meeting",
  "startTime": "2026-03-10T14:00:00.000Z",
  "endTime": "2026-03-10T15:00:00.000Z",
  "type": "meeting",
  "contactId": "..."
}
```

### Sync with Google Calendar
```http
POST /api/calendar/sync
Authorization: Bearer <token>
```

---

## Appointment Types

### List Appointment Types (Authenticated)
```http
GET /api/appointment-types
Authorization: Bearer <token>
```

### List Appointment Types (Public)
```http
GET /api/appointment-types?userId=<userId>
```

### Create Appointment Type
```http
POST /api/appointment-types
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Discovery Call",
  "durationMinutes": 30,
  "description": "Initial consultation",
  "color": "#3B82F6",
  "bufferMinutes": 15,
  "addGoogleMeet": true,
  "customQuestions": [
    {
      "id": "q1",
      "question": "What is your budget?",
      "required": false,
      "type": "short_text"
    }
  ],
  "isActive": true
}
```

### Update Appointment Type
```http
PUT /api/appointment-types/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Strategy Session",
  "durationMinutes": 60
}
```

### Delete Appointment Type
```http
DELETE /api/appointment-types/{id}
Authorization: Bearer <token>
```

---

## Bookings

### Create Booking (Public)
```http
POST /api/bookings
Content-Type: application/json

{
  "userId": "owner-user-id",
  "appointmentTypeId": "...",
  "scheduledAt": "2026-03-15T14:00:00.000Z",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+1234567890",
  "customAnswers": {
    "q1": "Answer to custom question"
  }
}
```

### Get Available Slots (Public)
```http
GET /api/bookings/available-slots?userId=<userId>&appointmentTypeId=<id>&date=2026-03-15
```

### List Bookings (Authenticated)
```http
GET /api/bookings
Authorization: Bearer <token>
```

---

## Availability Settings

### Get Availability Settings
```http
GET /api/settings/availability
Authorization: Bearer <token>
```

### Update Availability Settings
```http
PUT /api/settings/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "workingDays": [1, 2, 3, 4, 5],
  "workingHours": {
    "start": "09:00",
    "end": "17:00"
  },
  "breakTimes": [
    {
      "start": "12:00",
      "end": "13:00"
    }
  ],
  "bufferMinutes": 15,
  "minNoticeHours": 24,
  "maxAdvanceDays": 30,
  "blockedDates": ["2026-12-25", "2026-01-01"]
}
```

---

## Calendar Settings

### Get Calendar Settings
```http
GET /api/settings/calendars
Authorization: Bearer <token>
```

### Update Calendar Settings
```http
PUT /api/settings/calendars
Authorization: Bearer <token>
Content-Type: application/json

{
  "selectedCalendars": [
    {
      "id": "cal-1",
      "name": "Work Calendar",
      "color": "#3B82F6",
      "enabled": true
    }
  ],
  "defaultCalendarId": "cal-1",
  "syncEnabled": true
}
```

---

## Automations

### List Automations
```http
GET /api/automations
Authorization: Bearer <token>
```

### Create Automation
```http
POST /api/automations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Welcome New Contacts",
  "description": "Send welcome email to new contacts",
  "trigger": {
    "type": "new_contact"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "to": "{{email}}",
        "subject": "Welcome!",
        "body": "Hi {{firstName}}, welcome to our CRM!"
      }
    }
  ],
  "enabled": true
}
```

### Execute Automation (Test)
```http
POST /api/automations/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "automationId": "...",
  "testData": {
    "email": "test@example.com",
    "firstName": "Test"
  }
}
```

### Get Automation History
```http
GET /api/automations/{id}/history
Authorization: Bearer <token>
```

---

## Forms

### List Forms
```http
GET /api/forms
Authorization: Bearer <token>
```

### Create Form
```http
POST /api/forms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Contact Form",
  "type": "lead_capture",
  "fields": [
    {
      "id": "f1",
      "type": "short_text",
      "label": "Name",
      "required": true,
      "order": 1
    }
  ],
  "settings": {
    "submitButtonText": "Submit",
    "successMessage": "Thank you!",
    "notifyOnSubmission": true
  }
}
```

### Submit Form (Public)
```http
POST /api/forms/{id}/submit
Content-Type: application/json

{
  "responses": {
    "f1": "John Doe",
    "f2": "john@example.com"
  }
}
```

---

## Workflows

### List Workflow Templates
```http
GET /api/workflows
Authorization: Bearer <token>
```

### Create Workflow Template
```http
POST /api/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Website Launch Process",
  "tasks": [
    {
      "id": "t1",
      "title": "Design mockups",
      "order": 1,
      "requiresApproval": false
    }
  ]
}
```

### Apply Workflow to Project
```http
POST /api/workflows/{id}/apply/{projectId}
Authorization: Bearer <token>
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is enforced. Future versions may implement:
- 100 requests per minute for authenticated users
- 20 requests per minute for public endpoints

---

## Pagination

List endpoints support pagination via query parameters:

```http
GET /api/contacts?limit=20&offset=0
```

---

*Last updated: 2026-03-04*
