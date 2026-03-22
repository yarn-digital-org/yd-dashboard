import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, AuthUser } from '@/lib/api-middleware';

// Temporary debug endpoint — returns Firestore state for outreach
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const { user } = context;
  
  if (!adminDb) {
    return NextResponse.json({ error: 'adminDb not configured' }, { status: 500 });
  }

  try {
    // Query all outreach prospects regardless of userId
    const all = await adminDb.collection('outreachProspects').limit(20).get();
    const byScope: Record<string, number> = {};
    all.docs.forEach(d => {
      const uid = d.data().userId || 'undefined';
      byScope[uid] = (byScope[uid] || 0) + 1;
    });

    // Query specifically for org_yarn_digital
    const orgSnap = await adminDb.collection('outreachProspects')
      .where('userId', '==', 'org_yarn_digital')
      .get();

    return NextResponse.json({
      jwtUser: { userId: user.userId, email: user.email, orgId: (user as any).orgId },
      totalProspects: all.size,
      prospectsByScope: byScope,
      orgScopedCount: orgSnap.size,
      orgScopedCompanies: orgSnap.docs.map(d => d.data().company),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack?.slice(0,500) }, { status: 500 });
  }
}

export const GET = withAuth(handleGet);
