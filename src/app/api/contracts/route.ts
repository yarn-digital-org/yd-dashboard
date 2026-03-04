import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createContractSchema } from '@/lib/validation-schemas';

export interface Contract {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  content: string;
  status: 'draft' | 'sent' | 'signed';
  signedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// GET - List all contracts with filtering
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

    let query: FirebaseFirestore.Query = adminDb.collection('contracts').orderBy('createdAt', 'desc');

    // Filter by status
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    let contracts = snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Contract[];

    // Search filter (post-query for flexibility)
    if (search) {
      contracts = contracts.filter(contract => 
        contract.title?.toLowerCase().includes(search) ||
        contract.clientName?.toLowerCase().includes(search) ||
        contract.clientEmail?.toLowerCase().includes(search)
      );
    }

    // Pagination
    const total = contracts.length;
    contracts = contracts.slice(offset, offset + limit);

    return NextResponse.json({ 
      contracts, 
      total,
      limit,
      offset,
      hasMore: offset + contracts.length < total
    });
  } catch (error: unknown) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST - Create new contract
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const result = createContractSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return NextResponse.json({ success: false, error: errors, code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const { title, clientName, clientEmail, content, status, notes } = result.data;

    const now = new Date().toISOString();
    
    const contract: Omit<Contract, 'id'> = {
      title: title.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.toLowerCase().trim(),
      content: content || '',
      status: status || 'draft',
      notes: notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('contracts').add(contract);
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...contract,
      message: 'Contract created successfully'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
