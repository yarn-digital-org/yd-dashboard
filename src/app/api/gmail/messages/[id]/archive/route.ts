import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { archiveMessage } from '@/lib/gmail';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await archiveMessage(userId, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Gmail archive error:', error);
    return NextResponse.json({ error: 'Failed to archive message' }, { status: 500 });
  }
}
