import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { listInboxMessages } from '@/lib/gmail';

async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken') || undefined;
    const maxResults = searchParams.get('maxResults') ? parseInt(searchParams.get('maxResults')!) : 20;
    const q = searchParams.get('q') || undefined;

    const result = await listInboxMessages(userId, { pageToken, maxResults, q });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Gmail list error:', error);
    if (error.message?.includes('not connected') || error.message?.includes('not configured')) {
      return NextResponse.json({ error: 'Google not connected', code: 'NOT_CONNECTED' }, { status: 403 });
    }
    if (error.message?.includes('expired')) {
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
