/**
 * Email notifications system
 * Handles all transactional and notification emails
 */
import { sendEmail, SendEmailResult } from './email-service';
import { adminDb } from './firebase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yd-dashboard.vercel.app';

// ============================================
// Branding helpers
// ============================================

interface BrandingSettings {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
}

async function getBranding(): Promise<BrandingSettings> {
  const defaults: BrandingSettings = {
    companyName: 'Yarn Digital',
    logoUrl: '',
    primaryColor: '#FF3300',
  };

  if (!adminDb) return defaults;

  try {
    const doc = await adminDb.collection('settings').doc('branding').get();
    if (doc.exists) {
      const data = doc.data()!;
      return {
        companyName: data.companyName || defaults.companyName,
        logoUrl: data.logoUrl || defaults.logoUrl,
        primaryColor: data.primaryColor || defaults.primaryColor,
      };
    }
  } catch {}
  return defaults;
}

function emailWrapper(branding: BrandingSettings, content: string, unsubscribeUrl?: string): string {
  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${branding.companyName}" style="max-height: 40px; margin-bottom: 16px;" />`
    : `<h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
        ${branding.companyName.split(' ')[0]}<span style="color: ${branding.primaryColor};">.</span> ${branding.companyName.split(' ').slice(1).join(' ')}
      </h1>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        ${logoHtml}
        ${content}
        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #7A7A7A;">
          © ${new Date().getFullYear()} ${branding.companyName}. All rights reserved.
        </p>
        ${unsubscribeUrl ? `<p style="margin: 8px 0 0; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #7A7A7A;">Unsubscribe from these emails</a></p>` : ''}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// Check notification preferences
// ============================================

async function shouldSendNotification(userId: string, type: string): Promise<boolean> {
  if (!adminDb) return true;
  try {
    const doc = await adminDb.collection('users').doc(userId).collection('settings').doc('notifications').get();
    if (!doc.exists) return true;
    const prefs = doc.data()!;
    // Check specific type toggle
    if (prefs[type] === false) return false;
    // Check global email toggle
    if (prefs.emailNotifications === false) return false;
    return true;
  } catch {
    return true;
  }
}

// ============================================
// Email types
// ============================================

/**
 * Invoice reminder emails
 */
export async function sendInvoiceReminderEmail(
  userId: string,
  email: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  reminderType: 'before_due' | 'due_today' | 'overdue'
): Promise<SendEmailResult> {
  if (!(await shouldSendNotification(userId, 'invoiceReminders'))) {
    return { success: true };
  }

  const branding = await getBranding();

  const messages = {
    before_due: {
      subject: `Reminder: Invoice ${invoiceNumber} due in 3 days`,
      heading: 'Payment Reminder',
      body: `Invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> is due on <strong>${dueDate}</strong>.`,
    },
    due_today: {
      subject: `Invoice ${invoiceNumber} is due today`,
      heading: 'Invoice Due Today',
      body: `Invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> is due today.`,
    },
    overdue: {
      subject: `Overdue: Invoice ${invoiceNumber}`,
      heading: 'Invoice Overdue',
      body: `Invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> was due on <strong>${dueDate}</strong> and is now overdue.`,
    },
  };

  const msg = messages[reminderType];
  const unsubscribeUrl = `${APP_URL}/settings/notifications?unsubscribe=invoiceReminders`;

  const html = emailWrapper(branding, `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0A0A0A;">${msg.heading}</h2>
    <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">${msg.body}</p>
    <a href="${APP_URL}/invoices" style="display: inline-block; background-color: ${branding.primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
      View Invoice
    </a>
  `, unsubscribeUrl);

  return sendEmail({ to: email, subject: msg.subject, html });
}

/**
 * Contract signing notification
 */
export async function sendContractSignedEmail(
  userId: string,
  email: string,
  contractTitle: string,
  signerName: string
): Promise<SendEmailResult> {
  if (!(await shouldSendNotification(userId, 'contractNotifications'))) {
    return { success: true };
  }

  const branding = await getBranding();
  const unsubscribeUrl = `${APP_URL}/settings/notifications?unsubscribe=contractNotifications`;

  const html = emailWrapper(branding, `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0A0A0A;">Contract Signed!</h2>
    <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
      <strong>${signerName}</strong> has signed the contract: <strong>${contractTitle}</strong>.
    </p>
    <a href="${APP_URL}/contracts" style="display: inline-block; background-color: ${branding.primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
      View Contract
    </a>
  `, unsubscribeUrl);

  return sendEmail({
    to: email,
    subject: `Contract Signed: ${contractTitle}`,
    html,
  });
}

/**
 * Project status update email
 */
export async function sendProjectStatusEmail(
  userId: string,
  email: string,
  projectName: string,
  oldStatus: string,
  newStatus: string
): Promise<SendEmailResult> {
  if (!(await shouldSendNotification(userId, 'projectUpdates'))) {
    return { success: true };
  }

  const branding = await getBranding();
  const unsubscribeUrl = `${APP_URL}/settings/notifications?unsubscribe=projectUpdates`;

  const html = emailWrapper(branding, `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0A0A0A;">Project Update</h2>
    <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
      Project <strong>${projectName}</strong> status changed from 
      <strong>${oldStatus}</strong> → <strong>${newStatus}</strong>.
    </p>
    <a href="${APP_URL}/projects" style="display: inline-block; background-color: ${branding.primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
      View Project
    </a>
  `, unsubscribeUrl);

  return sendEmail({
    to: email,
    subject: `Project Update: ${projectName} — ${newStatus}`,
    html,
  });
}

/**
 * Weekly summary digest
 */
export async function sendWeeklySummaryEmail(
  userId: string,
  email: string,
  summary: {
    newLeads: number;
    newProjects: number;
    invoicesPaid: number;
    totalRevenue: string;
    upcomingEvents: number;
    pendingTasks: number;
  }
): Promise<SendEmailResult> {
  if (!(await shouldSendNotification(userId, 'weeklyDigest'))) {
    return { success: true };
  }

  const branding = await getBranding();
  const unsubscribeUrl = `${APP_URL}/settings/notifications?unsubscribe=weeklyDigest`;

  const statRow = (label: string, value: string | number) =>
    `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #F3F4F6; font-size: 14px; color: #6B7280;">${label}</td>
      <td style="padding: 12px; border-bottom: 1px solid #F3F4F6; font-size: 16px; font-weight: 600; color: #111827; text-align: right;">${value}</td>
    </tr>`;

  const html = emailWrapper(branding, `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0A0A0A;">Your Weekly Summary</h2>
    <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
      Here&apos;s what happened this week:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      ${statRow('New Leads', summary.newLeads)}
      ${statRow('New Projects', summary.newProjects)}
      ${statRow('Invoices Paid', summary.invoicesPaid)}
      ${statRow('Revenue', summary.totalRevenue)}
      ${statRow('Upcoming Events', summary.upcomingEvents)}
      ${statRow('Pending Tasks', summary.pendingTasks)}
    </table>
    <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: ${branding.primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
      Go to Dashboard
    </a>
  `, unsubscribeUrl);

  return sendEmail({
    to: email,
    subject: `Weekly Summary — ${branding.companyName}`,
    html,
  });
}

/**
 * Cron job handler for invoice reminders
 * Call this from a cron API route (e.g. Vercel Cron)
 */
export async function processInvoiceReminders(): Promise<{ sent: number; errors: number }> {
  if (!adminDb) return { sent: 0, errors: 0 };

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  let sent = 0;
  let errors = 0;

  // Get all unpaid invoices
  const snapshot = await adminDb.collection('invoices')
    .where('status', 'in', ['sent', 'overdue'])
    .get();

  for (const doc of snapshot.docs) {
    const invoice = doc.data();
    const dueDate = new Date(invoice.dueDate);
    const email = invoice.clientEmail;
    const userId = invoice.userId || 'system';

    if (!email || !invoice.dueDate) continue;

    let reminderType: 'before_due' | 'due_today' | 'overdue' | null = null;

    // 3 days before due
    if (dueDate.toDateString() === threeDaysFromNow.toDateString()) {
      reminderType = 'before_due';
    }
    // Due today
    else if (dueDate.toDateString() === now.toDateString()) {
      reminderType = 'due_today';
    }
    // 3 days overdue
    else if (dueDate.toDateString() === threeDaysAgo.toDateString()) {
      reminderType = 'overdue';
    }

    if (reminderType) {
      // Check if reminder already sent
      const reminderKey = `${doc.id}_${reminderType}_${now.toISOString().split('T')[0]}`;
      const existingReminder = await adminDb.collection('sentReminders').doc(reminderKey).get();
      if (existingReminder.exists) continue;

      const result = await sendInvoiceReminderEmail(
        userId,
        email,
        invoice.invoiceNumber,
        `£${invoice.total?.toFixed(2) || '0.00'}`,
        invoice.dueDate,
        reminderType
      );

      if (result.success) {
        sent++;
        await adminDb.collection('sentReminders').doc(reminderKey).set({
          invoiceId: doc.id,
          type: reminderType,
          sentAt: new Date().toISOString(),
        });
      } else {
        errors++;
      }
    }
  }

  return { sent, errors };
}
