import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireDb } from '@/lib/api-middleware';
import { generateContractHtml, ContractPdfData } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;
    const db = requireDb();

    const contractDoc = await db.collection('contracts').doc(id).get();
    if (!contractDoc.exists) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contractDoc.data() as Record<string, unknown>;

    if (contract.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const sections = (contract.sections as Array<Record<string, unknown>> || []).map((s) => ({
      title: String(s.title || ''),
      content: String(s.content || ''),
    }));

    if (sections.length === 0 && contract.content) {
      sections.push({ title: 'Agreement', content: String(contract.content) });
    }

    const pdfData: ContractPdfData = {
      title: String(contract.title || contract.name || 'Contract'),
      date: String(contract.date || contract.createdAt || new Date().toISOString()),
      parties: {
        provider: {
          name: String(contract.providerName || contract.businessName || 'Yarn Digital'),
          address: contract.providerAddress ? String(contract.providerAddress) : undefined,
        },
        client: {
          name: String(contract.clientName || ''),
          address: contract.clientAddress ? String(contract.clientAddress) : undefined,
        },
      },
      sections,
    };

    const html = generateContractHtml(pdfData);

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
