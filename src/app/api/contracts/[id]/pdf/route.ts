import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateContractPDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get contract
    const contractDoc = await adminDb.collection('contracts').doc(id).get();
    if (!contractDoc.exists) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contractData = contractDoc.data()!;

    // Get contact details
    const contactDoc = await adminDb.collection('contacts').doc(contractData.contactId).get();
    if (!contactDoc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contactData = contactDoc.data()!;

    // Prepare contract data for PDF generation
    const contract = {
      ...contractData,
      id: contractDoc.id,
      clientName: contactData.name || contactData.email,
      clientEmail: contactData.email,
    } as any;

    // Generate PDF
    const pdfBuffer = await generateContractPDF(contract);

    // Return PDF response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contract-${contractData.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`,
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