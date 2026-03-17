import { NextRequest, NextResponse } from 'next/server';
import { getMessage } from '@/lib/gmail';
import { cookies } from 'next/headers';
import { getJwtSecret } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };

    const { id } = await params;
    const message = await getMessage(decoded.userId, id);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Gmail message error:', error);
    const isAuthError = error.message?.includes('not connected') || error.message?.includes('invalid_grant');
    return NextResponse.json(
      { error: error.message || 'Failed to fetch message', notConnected: isAuthError },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
