import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { fireAutomations } from '@/lib/automation-engine';

/**
 * Cron: fire time-based automation triggers every hour
 *
 * Handles:
 *  - invoice_overdue:     invoices where status !== 'paid' and dueDate < now
 *  - event_starting_soon: bookings starting within the next 24 hours
 *
 * Each trigger fires once per entity per day (tracked in automation_trigger_locks).
 * Protected by CRON_SECRET.
 *
 * vercel.json schedule: "0 * * * *" (hourly)
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    const results = {
      invoice_overdue: { fired: 0, skipped: 0 },
      event_starting_soon: { fired: 0, skipped: 0 },
    };

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // ── 1. Invoice overdue ──────────────────────────────────────────────────
    const overdueSnap = await adminDb
      .collection('invoices')
      .where('status', 'in', ['sent', 'draft'])
      .get();

    for (const doc of overdueSnap.docs) {
      const invoice = { id: doc.id, ...doc.data() } as any;
      if (!invoice.dueDate || !invoice.userId) continue;

      const dueDate = new Date(invoice.dueDate);
      if (dueDate >= now) continue; // Not overdue yet

      // Dedup: only fire once per invoice per day
      const lockKey = `invoice_overdue:${invoice.id}:${todayKey}`;
      const lockDoc = await adminDb.collection('automation_trigger_locks').doc(lockKey).get();
      if (lockDoc.exists) { results.invoice_overdue.skipped++; continue; }

      await fireAutomations('invoice_overdue', {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber || invoice.id,
        number: invoice.invoiceNumber || invoice.id,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        amount: invoice.total ? `£${Number(invoice.total).toFixed(2)}` : 'N/A',
        dueDate: dueDate.toLocaleDateString('en-GB'),
        _collection: 'invoices',
      }, invoice.userId);

      // Write lock (TTL: 2 days via createdAt — cleanup cron can remove old ones)
      await adminDb.collection('automation_trigger_locks').doc(lockKey).set({
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      });

      results.invoice_overdue.fired++;
    }

    // ── 2. Event starting soon (bookings in next 24h) ───────────────────────
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const bookingsSnap = await adminDb
      .collection('bookings')
      .where('status', 'in', ['confirmed', 'pending'])
      .get();

    for (const doc of bookingsSnap.docs) {
      const booking = { id: doc.id, ...doc.data() } as any;
      if (!booking.startTime || !booking.userId) continue;

      const startTime = new Date(booking.startTime);
      if (startTime < now || startTime > in24h) continue; // Not in window

      const lockKey = `event_starting_soon:${booking.id}:${todayKey}`;
      const lockDoc = await adminDb.collection('automation_trigger_locks').doc(lockKey).get();
      if (lockDoc.exists) { results.event_starting_soon.skipped++; continue; }

      await fireAutomations('event_starting_soon', {
        id: booking.id,
        title: booking.title || booking.appointmentType || 'Appointment',
        name: booking.clientName || booking.name,
        email: booking.clientEmail || booking.email,
        date: startTime.toLocaleDateString('en-GB'),
        time: startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        location: booking.location || booking.meetingLink || 'TBC',
        _collection: 'bookings',
      }, booking.userId);

      await adminDb.collection('automation_trigger_locks').doc(lockKey).set({
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      });

      results.event_starting_soon.fired++;
    }

    // ── Cleanup expired locks ───────────────────────────────────────────────
    try {
      const expiredLocks = await adminDb
        .collection('automation_trigger_locks')
        .where('expiresAt', '<', now.toISOString())
        .limit(100)
        .get();
      const batch = adminDb.batch();
      expiredLocks.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch {
      // Non-fatal
    }

    console.log('[automation-cron]', JSON.stringify(results));
    return NextResponse.json({ success: true, results, timestamp: now.toISOString() });
  } catch (error: any) {
    console.error('[automation-cron] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
