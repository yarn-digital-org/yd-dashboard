import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// PUT - Update tag
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
    
    const docRef = adminDb.collection('tags').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (data.name !== undefined) {
      const normalizedName = data.name.trim().toLowerCase();
      
      // Check for duplicate
      const existing = await adminDb.collection('tags')
        .where('name', '==', normalizedName)
        .limit(1)
        .get();

      if (!existing.empty && existing.docs[0].id !== id) {
        return NextResponse.json({ 
          error: 'A tag with this name already exists'
        }, { status: 409 });
      }

      updates.name = normalizedName;
    }

    if (data.color !== undefined) {
      updates.color = data.color;
    }

    await docRef.update(updates);

    const updated = await docRef.get();
    return NextResponse.json({ 
      id: updated.id, 
      ...updated.data(),
      message: 'Tag updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const docRef = adminDb.collection('tags').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const tagData = doc.data();
    const tagName = tagData?.name;

    // Remove tag from all contacts that have it
    if (tagName) {
      const contactsWithTag = await adminDb.collection('contacts')
        .where('tags', 'array-contains', tagName)
        .get();

      const batch = adminDb.batch();
      
      contactsWithTag.docs.forEach((contactDoc) => {
        const contactTags = contactDoc.data().tags || [];
        const updatedTags = contactTags.filter((t: string) => t !== tagName);
        batch.update(contactDoc.ref, { tags: updatedTags });
      });

      batch.delete(docRef);
      await batch.commit();
    } else {
      await docRef.delete();
    }

    return NextResponse.json({ 
      message: 'Tag deleted successfully',
      id 
    });
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
