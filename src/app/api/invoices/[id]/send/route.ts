import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { sendInvoiceSentEmail } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const { id } = await params;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get the invoice
    const invoiceDoc = await adminDb.collection('invoices').doc(id).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceDoc.data();
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice data missing' }, { status: 404 });
    }

    // Verify ownership
    if (invoice.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get client email
    const clientEmail = invoice.clientEmail || invoice.to?.email;
    if (!clientEmail) {
      return NextResponse.json({ error: 'No client email address on this invoice' }, { status: 400 });
    }

    // Parse optional custom message from request body
    let customMessage = '';
    try {
      const body = await request.json();
      customMessage = body.message || '';
    } catch {
      // No body is fine
    }

    // Format amount
    const currency = invoice.currency || '£';
    const total = invoice.total || invoice.items?.reduce((sum: number, item: { amount?: number }) => sum + (item.amount || 0), 0) || 0;
    const amount = `${currency}${total.toFixed(2)}`;

    // Generate PDF download URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yd-dashboard.vercel.app';
    const downloadUrl = `${appUrl}/api/invoices/${id}/pdf`;

    // Send the email
    const result = await sendInvoiceSentEmail(
      clientEmail,
      invoice.invoiceNumber || 'N/A',
      amount,
      invoice.dueDate || 'N/A',
      downloadUrl
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
    }

    // Update invoice status to 'sent' and record sent date
    await adminDb.collection('invoices').doc(id).update({
      status: 'sent',
      sentAt: new Date().toISOString(),
      sentTo: clientEmail,
      lastSentAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      sentTo: clientEmail,
      fallback: result.fallback || false,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}
