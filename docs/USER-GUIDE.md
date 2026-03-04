# YD Dashboard - User Guide

Welcome to YD Dashboard! This guide will help you get the most out of your CRM.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Contacts Management](#contacts-management)
3. [Lead Management](#lead-management)
4. [Projects](#projects)
5. [Calendar & Scheduling](#calendar--scheduling)
6. [Invoicing](#invoicing)
7. [Automations](#automations)
8. [Forms](#forms)
9. [Client Portal](#client-portal)
10. [Settings](#settings)

---

## Getting Started

### Creating Your Account

1. Navigate to the registration page
2. Enter your email, password, and name
3. Click "Sign Up"
4. You'll receive a welcome email

### First Steps

After logging in:
1. Complete your profile in Settings → Profile
2. Set up your business information in Settings → Business
3. Configure your branding in Settings → Branding
4. Connect integrations (Google Calendar, Stripe) in Settings → Integrations

---

## Contacts Management

### Adding Contacts

**Manually:**
1. Go to Contacts
2. Click "New Contact"
3. Fill in contact details
4. Click "Save"

**Import from CSV:**
1. Go to Contacts
2. Click "Import"
3. Upload CSV file with columns: firstName, lastName, email, phone, company
4. Review and confirm import

### Organizing Contacts

**Tags:**
- Add tags to categorize contacts (VIP, Partner, etc.)
- Filter contacts by tags

**Custom Fields:**
1. Go to Settings → Custom Fields
2. Define custom fields for your needs
3. Use them when editing contacts

### Contact Types

- **Lead** - Potential customers
- **Client** - Active customers
- **Past Client** - Former customers
- **Vendor** - Service providers
- **Other** - Any other type

---

## Lead Management

### Lead Pipeline

Leads progress through these stages:
1. **New** - Just added
2. **Contacted** - Initial outreach made
3. **Qualified** - Confirmed interest
4. **Proposal Sent** - Waiting for decision
5. **Won** - Converted to client
6. **Lost** - Did not convert

### Converting Leads

When a lead becomes a client:
1. Open the lead
2. Click "Convert to Client"
3. Choose to create a contact and/or project
4. Lead status updates to "Won"

---

## Projects

### Creating Projects

1. Go to Projects
2. Click "New Project"
3. Select a client (contact)
4. Add project details
5. Set quoted amount
6. Choose status

### Project Statuses

- **Draft** - Planning phase
- **Active** - In progress
- **On Hold** - Paused
- **Completed** - Finished
- **Cancelled** - Not moving forward
- **Archived** - Historical record

### Workflow Tasks

Projects can have task checklists:
1. Edit a project
2. Add workflow tasks
3. Mark tasks complete as you progress
4. Set tasks to require client approval

### Project Files

Upload files to projects:
1. Open project
2. Go to Files tab
3. Click "Upload"
4. Choose to share with client via portal

### Project Notes

Add internal or shared notes:
1. Open project
2. Go to Notes tab
3. Add note
4. Toggle "Share with client" to make visible in portal

---

## Calendar & Scheduling

### Viewing Your Calendar

- Monthly, weekly, and daily views available
- Color-coded by event type
- Click events to view/edit details

### Creating Events

1. Click "New Event" or click on calendar
2. Fill in event details
3. Set start/end times
4. Link to contact or project (optional)
5. Add reminders
6. Save

### Google Calendar Integration

**Connect:**
1. Go to Settings → Integrations
2. Click "Connect Google Calendar"
3. Authorize access

**Sync:**
- Events sync automatically when connected
- Create events in either calendar
- Updates sync both ways

### Appointment Types

Configure bookable appointment types:

1. Go to Settings → Appointment Types
2. Click "New Type"
3. Set name, duration, description
4. Choose color for calendar
5. Set buffer time between appointments
6. Enable Google Meet auto-add (optional)
7. Add custom questions for booking form
8. Save

**Example Appointment Types:**
- Discovery Call (30 min)
- Strategy Session (60 min)
- Project Review (45 min)

### Availability Settings

Configure when clients can book:

1. Go to Settings → Availability
2. Select working days (Mon-Fri, etc.)
3. Set working hours (9am-5pm, etc.)
4. Add break times (lunch, etc.)
5. Set buffer time between appointments
6. Set minimum notice period (e.g., 24 hours)
7. Set maximum advance booking (e.g., 30 days)
8. Block specific dates (holidays, PTO)
9. Save

### Public Booking Links

Share your booking link with clients:

**Your booking URL:**
```
https://your-domain.com/book/[your-user-id]
```

**Booking Flow:**
1. Client visits your booking link
2. Chooses appointment type
3. Selects date from calendar
4. Picks available time slot
5. Enters their information
6. Confirms booking
7. Receives confirmation email

**Automatic Actions:**
- Event added to your calendar
- Confirmation email sent to client
- Notification email sent to you
- Automations triggered (if configured)

### Multi-Calendar Support

Manage multiple calendars:

1. Go to Settings → Calendars
2. Add calendars with names and colors
3. Enable/disable calendars
4. Set default calendar for new events
5. Events display with calendar color coding

---

## Invoicing

### Creating Invoices

1. Go to Invoicing
2. Click "New Invoice"
3. Select client
4. Link to project (optional)
5. Add line items
6. Set due date
7. Review totals
8. Save or send immediately

### Invoice Statuses

- **Draft** - Not yet sent
- **Sent** - Delivered to client
- **Viewed** - Client opened invoice
- **Partial** - Partially paid
- **Paid** - Fully paid
- **Overdue** - Past due date
- **Void** - Cancelled

### Payment Integration

**Stripe Setup:**
1. Go to Settings → Integrations
2. Click "Connect Stripe"
3. Complete Stripe onboarding
4. Clients can pay invoices online

### Tax Rates

Configure tax rates:
1. Go to Settings → Tax Rates
2. Add tax rate (name, percentage)
3. Apply to invoices as needed

---

## Automations

### What are Automations?

Automations execute actions when triggers occur.

### Available Triggers

- **New Contact** - When a contact is created
- **New Lead** - When a lead is created
- **Invoice Overdue** - When invoice passes due date
- **Form Submission** - When a form is submitted
- **New Booking** - When a client books an appointment
- **Event Starting Soon** - Before an event begins
- **Event Completed** - After an event ends

### Available Actions

- **Send Email** - Send templated email
- **Create Task** - Add task to project
- **Update Status** - Change record status
- **Notify** - Create in-app notification

### Creating Automations

1. Go to Automations
2. Click "New Automation"
3. Name your automation
4. Choose trigger type
5. Add one or more actions
6. Configure action details
7. Use template variables ({{email}}, {{name}}, etc.)
8. Enable automation
9. Save

**Example Automation:**
```
Trigger: New Booking
Actions:
  1. Send Email
     To: {{guestEmail}}
     Subject: Your appointment is confirmed!
     Body: Hi {{guestName}}, your {{appointmentType}} is scheduled for {{scheduledAt}}.

  2. Notify
     Message: New booking from {{guestName}}
```

### Testing Automations

1. Open automation
2. Click "Test"
3. Provide sample data
4. Review results

### Automation History

View automation runs:
1. Open automation
2. Click "History"
3. See execution logs, success/failure status

---

## Forms

### Creating Forms

1. Go to Forms
2. Click "New Form"
3. Name your form
4. Choose type (Lead Capture, Questionnaire, etc.)
5. Add fields
6. Configure settings
7. Customize styling
8. Publish

### Form Fields

Available field types:
- Short Text
- Long Text (textarea)
- Email
- Phone
- Number
- Dropdown
- Checkboxes
- Radio buttons
- Date/Time
- File upload
- Signature
- Rating
- Address

### Form Settings

- Custom submit button text
- Success message
- Redirect URL after submission
- Email notification on submission
- Auto-response to submitter

### Sharing Forms

**Embed Code:**
```html
<iframe src="https://your-domain.com/forms/[form-id]" width="100%" height="600"></iframe>
```

**Direct Link:**
```
https://your-domain.com/forms/[form-id]
```

---

## Client Portal

### Enabling Portal

1. Go to Settings → Portal
2. Enable client portal
3. Customize branding
4. Choose what clients can access

### Portal Features

Clients can:
- View projects and status
- Download shared files
- Read shared notes
- View invoices
- Make payments
- Sign contracts
- Send messages

### Inviting Clients

1. Open contact
2. Click "Send Portal Invite"
3. Client receives email with login link
4. They set their password
5. Access portal anytime

---

## Settings

### Profile Settings

Update your personal information:
- Name
- Email
- Phone
- Timezone
- Avatar

### Business Settings

Configure business details:
- Business name
- Address
- Phone/Email
- Website
- Logo

### Branding

Customize appearance:
- Primary color
- Logo
- Favicon
- Email templates

### Notifications

Choose notification preferences:
- Email notifications
- In-app notifications
- Notification types (new leads, invoices, etc.)

### Integrations

Connect third-party services:
- **Google Calendar** - Sync events
- **Stripe** - Accept payments
- **Resend** - Email delivery (auto-configured)

### Security

- Change password
- Enable two-factor authentication (future)
- View login history (future)

---

## Tips & Best Practices

### For New Users

1. Start by importing existing contacts
2. Set up your first project workflow template
3. Create a simple automation for new leads
4. Configure your availability and appointment types
5. Share your booking link

### Organization

- Use consistent naming conventions
- Tag contacts for easy filtering
- Archive completed projects to reduce clutter
- Review automations regularly

### Client Communication

- Enable portal for active clients
- Share project files and notes via portal
- Use message templates for common responses
- Set up booking automations for confirmations

### Reporting

- Export contact lists regularly
- Review automation history
- Monitor invoice aging
- Track project statuses

---

## Troubleshooting

### Can't log in?

1. Verify email address
2. Use "Forgot Password" to reset
3. Check spam folder for reset email

### Calendar not syncing?

1. Go to Settings → Integrations
2. Disconnect and reconnect Google Calendar
3. Check that sync is enabled

### Emails not sending?

1. Verify email service is configured
2. Check spam folder
3. Review automation logs

### Need Help?

- Check this guide
- Review API documentation
- Contact support

---

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + N` - New contact
- `Ctrl/Cmd + /` - Toggle sidebar

---

## Mobile Usage

YD Dashboard is responsive and works on mobile browsers. For best experience:
- Use landscape orientation for calendar
- Tap to edit fields
- Swipe to delete items

---

*Last updated: 2026-03-04*
