import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - Get single form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const doc = await adminDb.collection('forms').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      id: doc.id, 
      ...doc.data() 
    });
  } catch (error: unknown) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PUT - Update form
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

    const docRef = adminDb.collection('forms').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const { name, description, fields, status } = data;

    // Validation
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Form name cannot be empty' }, { status: 400 });
    }

    if (fields !== undefined) {
      if (!Array.isArray(fields) || fields.length === 0) {
        return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
      }
      for (const field of fields) {
        if (!field.label || !field.type) {
          return NextResponse.json({ error: 'Each field must have a label and type' }, { status: 400 });
        }
      }
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (fields !== undefined) {
      updateData.fields = fields.map((f: any, idx: number) => ({
        id: f.id || `field_${idx}_${Date.now()}`,
        label: f.label.trim(),
        type: f.type,
        required: f.required || false,
        placeholder: f.placeholder?.trim() || '',
        options: f.options || [],
      }));
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    
    return NextResponse.json({ 
      id: updated.id, 
      ...updated.data(),
      message: 'Form updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE - Delete form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const docRef = adminDb.collection('forms').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Also delete all submissions for this form
    const submissions = await adminDb.collection('form_submissions')
      .where('formId', '==', id)
      .get();

    const batch = adminDb.batch();
    submissions.docs.forEach((subDoc) => {
      batch.delete(subDoc.ref);
    });
    batch.delete(docRef);
    await batch.commit();

    return NextResponse.json({ 
      message: 'Form and all submissions deleted successfully',
      deletedSubmissions: submissions.size
    });
  } catch (error: unknown) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
