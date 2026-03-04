import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - List scheduled content
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query: any = adminDb.collection('scheduled_content').orderBy('scheduledAt', 'asc').limit(limit);

    const snapshot = await query.get();
    let content = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    // Filter in memory for multiple conditions
    if (status) content = content.filter((c: any) => c.status === status);
    if (platform) content = content.filter((c: any) => c.platform === platform);

    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Schedule new content
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const data = await request.json();
    const { title, content, platform, scheduledAt, mediaUrls, hashtags } = data;

    if (!content || !platform || !scheduledAt) {
      return NextResponse.json({ error: 'Content, platform, and scheduledAt required' }, { status: 400 });
    }

    const post = {
      title: title || '',
      content,
      platform,
      scheduledAt,
      mediaUrls: mediaUrls || [],
      hashtags: hashtags || [],
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('scheduled_content').add(post);
    return NextResponse.json({ id: docRef.id, ...post }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
