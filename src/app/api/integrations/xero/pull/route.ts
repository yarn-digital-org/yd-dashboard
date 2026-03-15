import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { xeroApiRequest } from '@/lib/xero';

/**
 * Pull payment status from Xero for synced invoices
 * POST body: { invoiceId?: string } — if omitted, pulls all synced invoices
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    let body: { invoiceId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body is fine — pull all
    }

    // Get invoices that have been synced to Xero
    let query = adminDb.collection('invoices')
      .where('userId', '==', decoded.userId)
      .where('xeroInvoiceId', '!=', null);

    if (body.invoiceId) {
      // Single invoice
      const doc = await adminDb.collection('invoices').doc(body.invoiceId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      const inv = doc.data();
      if (!inv?.xeroInvoiceId) {
        return NextResponse.json({ error: 'Invoice not synced to Xero' }, { status: 400 });
      }
      if (inv.userId !== decoded.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Fetch from Xero
      const result = await xeroApiRequest(decoded.userId, `/Invoices/${inv.xeroInvoiceId}`);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      const xeroInvoice = (result.data as { Invoices?: Array<{ Status: string; AmountPaid: number; AmountDue: number; FullyPaidOnDate?: string }> })?.Invoices?.[0];
      if (xeroInvoice) {
        const updates: Record<string, unknown> = {
          xeroStatus: xeroInvoice.Status,
          xeroAmountPaid: xeroInvoice.AmountPaid,
          xeroAmountDue: xeroInvoice.AmountDue,
          xeroLastPulledAt: new Date().toISOString(),
        };

        // Update our status based on Xero's
        if (xeroInvoice.Status === 'PAID') {
          updates.status = 'paid';
          updates.paidDate = xeroInvoice.FullyPaidOnDate || new Date().toISOString();
        } else if (xeroInvoice.AmountPaid > 0) {
          updates.status = 'partial';
        }

        await adminDb.collection('invoices').doc(body.invoiceId).update(updates);
        return NextResponse.json({ success: true, updated: 1, status: xeroInvoice.Status });
      }

      return NextResponse.json({ success: true, updated: 0 });
    }

    // Bulk pull — all synced invoices
    const snapshot = await query.get();
    let updated = 0;

    for (const doc of snapshot.docs) {
      const inv = doc.data();
      if (!inv.xeroInvoiceId) continue;

      try {
        const result = await xeroApiRequest(decoded.userId, `/Invoices/${inv.xeroInvoiceId}`);
        if (!result.ok) continue;

        const xeroInvoice = (result.data as { Invoices?: Array<{ Status: string; AmountPaid: number; AmountDue: number; FullyPaidOnDate?: string }> })?.Invoices?.[0];
        if (!xeroInvoice) continue;

        const updates: Record<string, unknown> = {
          xeroStatus: xeroInvoice.Status,
          xeroAmountPaid: xeroInvoice.AmountPaid,
          xeroAmountDue: xeroInvoice.AmountDue,
          xeroLastPulledAt: new Date().toISOString(),
        };

        if (xeroInvoice.Status === 'PAID') {
          updates.status = 'paid';
          updates.paidDate = xeroInvoice.FullyPaidOnDate || new Date().toISOString();
        } else if (xeroInvoice.AmountPaid > 0) {
          updates.status = 'partial';
        }

        await doc.ref.update(updates);
        updated++;
      } catch (err) {
        console.error(`Failed to pull Xero status for ${doc.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, updated, total: snapshot.size });
  } catch (error) {
    console.error('Xero pull error:', error);
    return NextResponse.json({ error: 'Failed to pull from Xero' }, { status: 500 });
  }
}
