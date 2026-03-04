import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Form type definitions
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
}

export interface Form {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  status: 'active' | 'inactive';
  submissionCount: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// GET - List all forms
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

    let query: FirebaseFirestore.Query = adminDb.collection('forms').orderBy('createdAt', 'desc');

    // Filter by status
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    let forms = snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Form[];

    // Search filter (post-query for flexibility)
    if (search) {
      forms = forms.filter(f => 
        f.name?.toLowerCase().includes(search) ||
        f.description?.toLowerCase().includes(search)
      );
    }

    // Pagination
    const total = forms.length;
    forms = forms.slice(offset, offset + limit);

    return NextResponse.json({ 
      forms, 
      total,
      limit,
      offset,
      hasMore: offset + forms.length < total
    });
  } catch (error: unknown) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST - Create new form
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const data = await request.json();
    const { 
      name, 
      description,
      fields,
      status,
      userId
    } = data;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Form name is required' }, { status: 400 });
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    // Validate fields
    for (const field of fields) {
      if (!field.label || !field.type) {
        return NextResponse.json({ error: 'Each field must have a label and type' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    
    const form: Omit<Form, 'id'> = {
      name: name.trim(),
      description: description?.trim() || '',
      fields: fields.map((f: any, idx: number) => ({
        id: f.id || `field_${idx}_${Date.now()}`,
        label: f.label.trim(),
        type: f.type,
        required: f.required || false,
        placeholder: f.placeholder?.trim() || '',
        options: f.options || [],
      })),
      status: status || 'active',
      submissionCount: 0,
      userId: userId || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('forms').add(form);
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...form,
      message: 'Form created successfully'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
