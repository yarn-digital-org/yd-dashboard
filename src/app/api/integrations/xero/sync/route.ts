import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { xeroApiRequest, findOrCreateXeroContact } from '@/lib/xero';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get invoice
    const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceDoc.data();
    if (!invoice || invoice.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already synced
    if (invoice.xeroInvoiceId) {
      return NextResponse.json({ 
        error: 'Invoice already synced to Xero', 
        xeroInvoiceId: invoice.xeroInvoiceId 
      }, { status: 400 });
    }

    // Find or create Xero contact
    const clientEmail = invoice.clientEmail || '';
    const clientName = invoice.clientName || 'Unknown Client';

    let contactId: string | undefined;
    if (clientEmail) {
      const contactResult = await findOrCreateXeroContact(decoded.userId, clientName, clientEmail);
      if (contactResult.ok) {
        contactId = contactResult.contactId;
      }
    }

    // Map invoice items to Xero line items
    const lineItems = (invoice.items || []).map((item: { description: string; quantity: number; rate: number; amount: number }) => ({
      Description: item.description,
      Quantity: item.quantity,
      UnitAmount: item.rate,
      AccountCode: '200', // Default sales account
      TaxType: invoice.tax > 0 ? 'OUTPUT2' : 'NONE',
    }));

    // Map status
    const xeroStatus = invoice.status === 'draft' ? 'DRAFT' : 'AUTHORISED';

    // Create Xero invoice
    const xeroInvoice = {
      Type: 'ACCREC', // Accounts Receivable
      ...(contactId ? { Contact: { ContactID: contactId } } : { Contact: { Name: clientName } }),
      Date: invoice.date || new Date().toISOString().split('T')[0],
      DueDate: invoice.dueDate || undefined,
      LineItems: lineItems,
      Status: xeroStatus,
      InvoiceNumber: invoice.invoiceNumber,
      Reference: `YD-${invoice.invoiceNumber}`,
      CurrencyCode: invoice.currency === '$' ? 'USD' : invoice.currency === '€' ? 'EUR' : 'GBP',
    };

    const result = await xeroApiRequest(decoded.userId, '/Invoices', {
      method: 'POST',
      body: { Invoices: [xeroInvoice] },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Failed to sync to Xero' }, { status: 500 });
    }

    const xeroInvoices = (result.data as { Invoices?: Array<{ InvoiceID: string; InvoiceNumber: string }> })?.Invoices;
    const createdInvoice = xeroInvoices?.[0];

    if (createdInvoice) {
      // Store Xero invoice ID on our invoice
      await adminDb.collection('invoices').doc(invoiceId).update({
        xeroInvoiceId: createdInvoice.InvoiceID,
        xeroSyncedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      xeroInvoiceId: createdInvoice?.InvoiceID,
      xeroInvoiceNumber: createdInvoice?.InvoiceNumber,
    });
  } catch (error) {
    console.error('Xero sync error:', error);
    return NextResponse.json({ error: 'Failed to sync invoice to Xero' }, { status: 500 });
  }
}
