import { NextRequest, NextResponse } from 'next/server';
import { processInvoiceReminders } from '@/lib/email-notifications';

/**
 * Cron job for sending invoice reminder emails
 * Configure in vercel.json:
 * { "crons": [{ "path": "/api/cron/invoice-reminders", "schedule": "0 9 * * *" }] }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processInvoiceReminders();

    return NextResponse.json({
      success: true,
      sent: result.sent,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Invoice reminder cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error.message },
      { status: 500 }
    );
  }
}
