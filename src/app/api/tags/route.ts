import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - List all tags
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const snapshot = await adminDb.collection('tags')
      .orderBy('name')
      .get();
    
    const tags = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(tags);
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new tag
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Normalize tag name
    const normalizedName = data.name.trim().toLowerCase();

    // Check for duplicate
    const existing = await adminDb.collection('tags')
      .where('name', '==', normalizedName)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ 
        error: 'A tag with this name already exists'
      }, { status: 409 });
    }

    const tagData = {
      name: normalizedName,
      color: data.color || '#6B7280',
      contactCount: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('tags').add(tagData);

    return NextResponse.json({ 
      id: docRef.id, 
      ...tagData,
      message: 'Tag created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
