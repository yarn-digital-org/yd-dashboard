import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const snapshot = await adminDb.collection('landingPages')
      .where('userId', '==', decoded.userId)
      .orderBy('createdAt', 'desc')
      .get();

    const pages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ data: pages });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch landing pages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const body = await request.json();
    const { slug, title, headline, subheadline, ctaText, ctaUrl, formFields, heroImage, template } = body;

    if (!slug || !title || !headline) {
      return NextResponse.json({ error: 'slug, title, and headline are required' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await adminDb.collection('landingPages')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json({ error: 'This URL slug is already taken' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const doc = await adminDb.collection('landingPages').add({
      userId: decoded.userId,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      title,
      headline,
      subheadline: subheadline || '',
      ctaText: ctaText || 'Get Started',
      ctaUrl: ctaUrl || '',
      formFields: formFields || ['name', 'email', 'phone', 'company'],
      heroImage: heroImage || '',
      template: template || 'standard',
      published: false,
      views: 0,
      leads: 0,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, id: doc.id });
  } catch {
    return NextResponse.json({ error: 'Failed to create landing page' }, { status: 500 });
  }
}
