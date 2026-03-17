import { NextRequest, NextResponse } from 'next/server';
import { listInboxMessages } from '@/lib/gmail';
import { cookies } from 'next/headers';
import { getJwtSecret } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };

    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '25');
    const pageToken = searchParams.get('pageToken') || undefined;
    const q = searchParams.get('q') || undefined;

    const result = await listInboxMessages(decoded.userId, { maxResults, pageToken, q });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Gmail list error:', error);
    const isAuthError = error.message?.includes('not connected') || error.message?.includes('invalid_grant');
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails', notConnected: isAuthError },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
