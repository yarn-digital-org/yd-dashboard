import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - Get single contact by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const doc = await adminDb.collection('contacts').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: unknown) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PUT - Update contact
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
    
    const docRef = adminDb.collection('contacts').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // If email is being changed, check for duplicates
    if (data.email && data.email !== doc.data()?.email) {
      const existing = await adminDb.collection('contacts')
        .where('email', '==', data.email.toLowerCase().trim())
        .limit(1)
        .get();
      
      if (!existing.empty && existing.docs[0].id !== id) {
        return NextResponse.json({ 
          error: 'A contact with this email already exists',
          duplicateId: existing.docs[0].id 
        }, { status: 409 });
      }
    }

    // Build update object (only include provided fields)
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle',
      'address', 'website', 'socialLinks', 'avatarUrl', 'type', 'tags',
      'customFields', 'notes', 'lifetimeValue', 'projectCount', 
      'outstandingAmount', 'lastContactedAt'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'email') {
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
      message: 'Contact updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const docRef = adminDb.collection('contacts').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ 
      message: 'Contact deleted successfully',
      id 
    });
  } catch (error: unknown) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
