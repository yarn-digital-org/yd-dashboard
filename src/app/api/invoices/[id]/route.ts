import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - Get single invoice by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const doc = await adminDb.collection('invoices').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: unknown) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PUT - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const data = await request.json();
    
    const docRef = adminDb.collection('invoices').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Build update object (only include provided fields)
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    const allowedFields = [
      'invoiceNumber', 'clientName', 'clientEmail', 'items',
      'subtotal', 'tax', 'total', 'status', 'dueDate', 'notes'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'clientEmail') {
          updates[field] = data[field].toLowerCase().trim();
        } else if (typeof data[field] === 'string') {
          updates[field] = data[field].trim();
        } else {
          updates[field] = data[field];
        }
      }
    }

    await docRef.update(updates);

    const updated = await docRef.get();
    return NextResponse.json({ 
      id: updated.id, 
      ...updated.data(),
      message: 'Invoice updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const docRef = adminDb.collection('invoices').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ 
      message: 'Invoice deleted successfully',
      id 
    });
  } catch (error: unknown) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
