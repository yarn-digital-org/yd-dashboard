import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// PATCH /api/blog/[slug] - Update a post (authenticated)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const { slug } = await params;
    const body = await request.json();

    const snapshot = await adminDb
      .collection('blog_posts')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    // Allow updating specific fields
    const allowedFields = ['title', 'content', 'excerpt', 'author', 'tags', 'metaTitle', 'metaDescription', 'status', 'featuredImage', 'publishDate', 'framerSynced'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (body.status === 'published' && !doc.data().publishedAt) {
      updates.publishedAt = new Date().toISOString();
    }

    await adminDb.collection('blog_posts').doc(doc.id).update(updates);

    return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data(), ...updates } });
  } catch (error: any) {
    console.error('Blog update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 });
  }
}

// GET /api/blog/[slug] - Get single post by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const { slug } = await params;

    const snapshot = await adminDb
      .collection('blog_posts')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error: any) {
    console.error('Blog get error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch post' }, { status: 500 });
  }
}
