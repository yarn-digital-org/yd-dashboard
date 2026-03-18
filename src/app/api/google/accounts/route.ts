import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthUser } from '@/lib/api-middleware';
import { listGoogleAccounts, removeGoogleAccount } from '@/lib/google-accounts';

// GET /api/google/accounts — list all connected Google accounts
async function handleGet(request: NextRequest, context: { user: AuthUser }) {
  const accounts = await listGoogleAccounts(context.user.userId);
  const safeAccounts = accounts.map(a => ({
    email: a.email,
    displayName: a.displayName,
    picture: a.picture,
    connectedAt: a.connectedAt,
    scopes: a.scopes,
  }));
  return NextResponse.json({ success: true, data: { accounts: safeAccounts, total: accounts.length } });
}

// DELETE /api/google/accounts?email=... — disconnect a Google account
async function handleDelete(request: NextRequest, context: { user: AuthUser }) {
  const email = new URL(request.url).searchParams.get('email');
  if (!email) return NextResponse.json({ success: false, error: 'email required' }, { status: 400 });
  await removeGoogleAccount(context.user.userId, email);
  return NextResponse.json({ success: true, data: null });
}

export const GET = withAuth(handleGet);
export const DELETE = withAuth(handleDelete);
