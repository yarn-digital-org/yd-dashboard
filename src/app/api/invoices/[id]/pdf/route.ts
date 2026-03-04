import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateInvoicePDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get invoice
    const invoiceDoc = await adminDb.collection('invoices').doc(id).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceData = invoiceDoc.data()!;

    // Get contact details
    const contactDoc = await adminDb.collection('contacts').doc(invoiceData.contactId).get();
    if (!contactDoc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contactData = contactDoc.data()!;

    // Prepare invoice data for PDF generation
    const invoice = {
      ...invoiceData,
      id: invoiceDoc.id,
      clientName: contactData.name || contactData.email,
      clientEmail: contactData.email,
      clientAddress: contactData.address ?
        [contactData.address.street, contactData.address.city, contactData.address.state, contactData.address.zipCode, contactData.address.country]
          .filter(Boolean)
          .join(', ') : undefined,
    } as any;

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Return PDF response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}