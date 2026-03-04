import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - Get single contract by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const doc = await adminDb.collection('contracts').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: unknown) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PUT - Update contract
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
    
    const docRef = adminDb.collection('contracts').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Build update object (only include provided fields)
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    const allowedFields = [
      'title', 'clientName', 'clientEmail', 'content',
      'status', 'signedAt', 'notes'
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

    // If status changes to signed, set signedAt
    if (data.status === 'signed' && !doc.data()?.signedAt) {
      updates.signedAt = new Date().toISOString();
    }

    await docRef.update(updates);

    const updated = await docRef.get();
    return NextResponse.json({ 
      id: updated.id, 
      ...updated.data(),
      message: 'Contract updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE - Delete contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const docRef = adminDb.collection('contracts').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ 
      message: 'Contract deleted successfully',
      id 
    });
  } catch (error: unknown) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
