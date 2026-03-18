import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET /api/blog - List published blog posts (public)
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'published';

    let snapshot;
    try {
      snapshot = await adminDb
        .collection('blog_posts')
        .where('status', '==', status)
        .orderBy('publishedAt', 'desc')
        .limit(limit)
        .get();
    } catch (indexErr: any) {
      // Fallback if composite index not yet built
      snapshot = await adminDb
        .collection('blog_posts')
        .where('status', '==', status)
        .limit(limit)
        .get();
    }

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    console.error('Blog list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/blog - Create a blog post (authenticated)
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { title, slug, content, excerpt, author, tags, metaTitle, metaDescription, status: postStatus, featuredImage } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ success: false, error: 'title, slug, and content are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const post: Record<string, unknown> = {
      title,
      slug,
      content,
      excerpt: excerpt || '',
      author: author || 'Yarn Digital',
      tags: tags || [],
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || '',
      status: postStatus || 'draft',
      createdAt: now,
      updatedAt: now,
    };

    if (featuredImage) post.featuredImage = featuredImage;
    if (postStatus === 'published') post.publishedAt = now;

    const docRef = await adminDb.collection('blog_posts').add(post);
    return NextResponse.json({ success: true, data: { id: docRef.id, ...post } }, { status: 201 });
  } catch (error: any) {
    console.error('Blog create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 });
  }
}
