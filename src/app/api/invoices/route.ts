import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// GET - List all invoices with filtering
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query: FirebaseFirestore.Query = adminDb.collection('invoices').orderBy('createdAt', 'desc');

    // Filter by status
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    let invoices = snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Invoice[];

    // Search filter (post-query for flexibility)
    if (search) {
      invoices = invoices.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(search) ||
        inv.clientName?.toLowerCase().includes(search) ||
        inv.clientEmail?.toLowerCase().includes(search)
      );
    }

    // Pagination
    const total = invoices.length;
    invoices = invoices.slice(offset, offset + limit);

    return NextResponse.json({ 
      invoices, 
      total,
      limit,
      offset,
      hasMore: offset + invoices.length < total
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const data = await request.json();
    const { 
      invoiceNumber,
      clientName, 
      clientEmail, 
      items,
      subtotal,
      tax,
      total,
      status,
      dueDate,
      notes
    } = data;

    // Validation
    if (!clientName) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    if (!clientEmail) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 });
    }

    // Generate invoice number if not provided
    let finalInvoiceNumber = invoiceNumber;
    if (!finalInvoiceNumber) {
      const countSnapshot = await adminDb.collection('invoices').count().get();
      const count = countSnapshot.data().count;
      finalInvoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    }

    const now = new Date().toISOString();
    
    const invoice: Omit<Invoice, 'id'> = {
      invoiceNumber: finalInvoiceNumber,
      clientName: clientName.trim(),
      clientEmail: clientEmail.toLowerCase().trim(),
      items: items || [],
      subtotal: subtotal || 0,
      tax: tax || 0,
      total: total || 0,
      status: status || 'draft',
      dueDate: dueDate || '',
      notes: notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('invoices').add(invoice);
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...invoice,
      message: 'Invoice created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
