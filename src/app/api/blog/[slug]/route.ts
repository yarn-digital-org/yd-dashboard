import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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
