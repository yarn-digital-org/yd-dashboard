import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - List all leads
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query: any = adminDb.collection('leads').orderBy('createdAt', 'desc').limit(limit);
    
    if (status) {
      query = adminDb.collection('leads').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit);
    }

    const snapshot = await query.get();
    const leads = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new lead
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const data = await request.json();
    const { name, email, company, phone, source, notes, status } = data;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
    }

    const lead = {
      name,
      email,
      company: company || '',
      phone: phone || '',
      source: source || 'direct',
      notes: notes || '',
      status: status || 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('leads').add(lead);
    return NextResponse.json({ id: docRef.id, ...lead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
