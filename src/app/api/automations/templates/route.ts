import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-middleware';

/**
 * Pre-built automation templates.
 * GET  /api/automations/templates — list all templates
 * POST /api/automations/templates/[id]/use — clone a template into user's automations
 */

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'leads' | 'contacts' | 'invoices' | 'forms' | 'bookings';
  trigger: {
    type: string;
    config?: Record<string, unknown>;
  };
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  icon: string; // emoji
}

const TEMPLATES: AutomationTemplate[] = [
  // ─── Leads ──────────────────────────────────────────────────────────────────
  {
    id: 'new-lead-welcome',
    name: 'New Lead Welcome Email',
    description: 'Send a personalised welcome email when a new lead is created from any source.',
    category: 'leads',
    icon: '👋',
    trigger: { type: 'new_lead', config: {} },
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{lead.email}}',
          subject: "Thanks for getting in touch, {{lead.name}}!",
          body: "Hi {{lead.name}},\n\nThanks for reaching out to Yarn Digital. We'll be in touch within 1 business day.\n\nBest,\nThe Yarn Digital Team",
        },
      },
    ],
  },
  {
    id: 'new-lead-notify-team',
    name: 'New Lead — Notify Team',
    description: 'Send an internal Slack-style notification when a new lead comes in.',
    category: 'leads',
    icon: '🔔',
    trigger: { type: 'new_lead', config: {} },
    actions: [
      {
        type: 'notify',
        config: {
          message: '🆕 New lead: {{lead.name}} ({{lead.email}}) via {{lead.source}}',
        },
      },
    ],
  },
  {
    id: 'new-lead-create-task',
    name: 'New Lead → Follow-up Task',
    description: 'Automatically create a follow-up task when a new lead is captured.',
    category: 'leads',
    icon: '✅',
    trigger: { type: 'new_lead', config: {} },
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Follow up with {{lead.name}}',
          assignee: 'Bolt',
        },
      },
    ],
  },

  // ─── Contacts ──────────────────────────────────────────────────────────────
  {
    id: 'new-contact-onboard',
    name: 'New Contact Onboarding Email',
    description: 'Welcome new contacts with an introduction to Yarn Digital services.',
    category: 'contacts',
    icon: '🤝',
    trigger: { type: 'new_contact', config: {} },
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{contact.email}}',
          subject: 'Welcome to Yarn Digital',
          body: "Hi {{contact.firstName}},\n\nWelcome! We're excited to have you. Here's what we can help you with:\n\n• Brand Strategy\n• Web Design & Development\n• Digital Marketing\n\nFeel free to reach out anytime.\n\nThe Yarn Digital Team",
        },
      },
    ],
  },

  // ─── Invoices ──────────────────────────────────────────────────────────────
  {
    id: 'invoice-overdue-reminder',
    name: 'Invoice Overdue Reminder',
    description: 'Auto-send a polite payment reminder when an invoice becomes overdue.',
    category: 'invoices',
    icon: '💸',
    trigger: { type: 'invoice_overdue', config: {} },
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{invoice.clientEmail}}',
          subject: 'Friendly reminder: Invoice {{invoice.number}} is overdue',
          body: "Hi {{invoice.clientName}},\n\nThis is a friendly reminder that invoice {{invoice.number}} for {{invoice.amount}} was due on {{invoice.dueDate}}.\n\nPlease arrange payment at your earliest convenience.\n\nIf you have any questions, just reply to this email.\n\nThanks,\nYarn Digital",
        },
      },
    ],
  },
  {
    id: 'invoice-overdue-task',
    name: 'Invoice Overdue → Chase Task',
    description: 'Create an internal task to chase the client when an invoice is overdue.',
    category: 'invoices',
    icon: '📋',
    trigger: { type: 'invoice_overdue', config: {} },
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Chase invoice {{invoice.number}} — {{invoice.clientName}}',
          assignee: 'Jarvis',
        },
      },
      {
        type: 'notify',
        config: {
          message: '⚠️ Invoice {{invoice.number}} ({{invoice.clientName}}) is overdue — {{invoice.amount}}',
        },
      },
    ],
  },

  // ─── Forms ─────────────────────────────────────────────────────────────────
  {
    id: 'form-submission-confirm',
    name: 'Form Submission Confirmation',
    description: "Send an auto-reply to confirm you've received a contact form submission.",
    category: 'forms',
    icon: '📬',
    trigger: { type: 'form_submission', config: {} },
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{form.email}}',
          subject: "We've received your message!",
          body: "Hi {{form.name}},\n\nThanks for contacting Yarn Digital. We've received your message and will get back to you within 1 business day.\n\nBest,\nThe Yarn Digital Team",
        },
      },
    ],
  },
  {
    id: 'form-to-lead',
    name: 'Form Submission → Create Lead',
    description: 'Automatically create a lead and notify the team on every form submission.',
    category: 'forms',
    icon: '🎯',
    trigger: { type: 'form_submission', config: {} },
    actions: [
      {
        type: 'notify',
        config: {
          message: '📥 New form submission from {{form.name}} ({{form.email}})',
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Review form submission: {{form.name}}',
          assignee: 'Jarvis',
        },
      },
    ],
  },

  // ─── Bookings ──────────────────────────────────────────────────────────────
  {
    id: 'booking-confirmation',
    name: 'Booking Confirmation Email',
    description: 'Send a confirmation email when someone books an appointment.',
    category: 'bookings',
    icon: '📅',
    trigger: { type: 'new_booking', config: {} },
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{booking.email}}',
          subject: 'Booking confirmed: {{booking.title}}',
          body: "Hi {{booking.name}},\n\nYour booking is confirmed!\n\n📅 {{booking.date}} at {{booking.time}}\n📍 {{booking.location}}\n\nWe look forward to speaking with you.\n\nYarn Digital",
        },
      },
    ],
  },
  {
    id: 'booking-reminder',
    name: 'Booking Reminder (24h before)',
    description: 'Send a reminder email 24 hours before a scheduled appointment.',
    category: 'bookings',
    icon: '⏰',
    trigger: { type: 'event_starting_soon', config: { hoursBeforeEvent: 24 } },
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{booking.email}}',
          subject: 'Reminder: your appointment tomorrow',
          body: "Hi {{booking.name}},\n\nJust a reminder that you have an appointment tomorrow:\n\n📅 {{booking.date}} at {{booking.time}}\n\nSee you then!\n\nYarn Digital",
        },
      },
    ],
  },
];

// GET /api/automations/templates
export async function GET() {
  return NextResponse.json({ data: TEMPLATES, total: TEMPLATES.length });
}

// POST /api/automations/templates — use a template (clone into user's automations)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const { templateId } = await request.json();
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const now = new Date().toISOString();
    const automation = {
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      actions: template.actions,
      enabled: false, // start disabled — user enables when ready
      runCount: 0,
      userId: user.userId,
      fromTemplate: templateId,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb.collection('automations').add(automation);
    return NextResponse.json({ data: { id: ref.id, ...automation } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
