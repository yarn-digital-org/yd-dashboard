import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireDb } from '@/lib/api-middleware';
import { generateInvoiceWithTemplate, InvoicePdfData, InvoiceTemplate } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;
    const db = requireDb();

    const invoiceDoc = await db.collection('invoices').doc(id).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceDoc.data() as Record<string, unknown>;

    if (invoice.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Load brand settings for this user
    let brandName = 'Yarn Digital';
    let brandEmail = '';
    let brandAddress = '';
    try {
      const brandDoc = await db.collection('users').doc(user.userId).collection('settings').doc('branding').get();
      if (brandDoc.exists) {
        const brandData = brandDoc.data();
        // Business info fields from branding settings
        if (brandData?.businessName) brandName = String(brandData.businessName);
        if (brandData?.businessEmail) brandEmail = String(brandData.businessEmail);
        if (brandData?.businessAddress) brandAddress = String(brandData.businessAddress);
      }
    } catch {
      // Use defaults
    }

    const items = (invoice.items as Array<Record<string, unknown>> || []).map((item) => ({
      description: String(item.description || ''),
      quantity: Number(item.quantity || 1),
      rate: Number(item.rate || item.unitPrice || 0),
      amount: Number(item.amount || item.total || 0),
    }));

    const pdfData: InvoicePdfData = {
      invoiceNumber: String(invoice.invoiceNumber || invoice.number || id),
      date: String(invoice.date || invoice.createdAt || new Date().toISOString()),
      dueDate: String(invoice.dueDate || ''),
      status: String(invoice.status || 'draft'),
      from: {
        name: String(invoice.fromName || invoice.businessName || brandName),
        email: String(invoice.fromEmail || brandEmail),
        address: String(invoice.fromAddress || brandAddress),
      },
      to: {
        name: String(invoice.clientName || invoice.toName || ''),
        email: String(invoice.clientEmail || invoice.toEmail || ''),
        address: String(invoice.clientAddress || invoice.toAddress || ''),
      },
      items,
      subtotal: Number(invoice.subtotal || 0),
      tax: invoice.tax !== undefined ? Number(invoice.tax) : undefined,
      taxRate: invoice.taxRate !== undefined ? Number(invoice.taxRate) : undefined,
      total: Number(invoice.total || invoice.amount || 0),
      notes: invoice.notes ? String(invoice.notes) : undefined,
      currency: String(invoice.currency || '£'),
    };

    const template = (invoice.template as InvoiceTemplate) || 'professional';
    const html = generateInvoiceWithTemplate(pdfData, template);

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
