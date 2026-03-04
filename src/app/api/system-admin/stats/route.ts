import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  requireDb,
  AuthUser,
  ForbiddenError,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';
import { isSystemAdmin } from '@/lib/rbac';

// GET - System-wide stats (system admin only)
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const isSA = await isSystemAdmin(user.userId);
  if (!isSA) throw new ForbiddenError('System admin access required');

  const [usersSnap, orgsSnap, projectsSnap, invoicesSnap, contactsSnap] = await Promise.all([
    db.collection(COLLECTIONS.USERS).get(),
    db.collection(COLLECTIONS.ORGANISATIONS).get(),
    db.collection(COLLECTIONS.PROJECTS).get(),
    db.collection(COLLECTIONS.INVOICES).get(),
    db.collection(COLLECTIONS.CONTACTS).get(),
  ]);

  // Calculate total revenue from paid invoices
  let totalRevenue = 0;
  invoicesSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.status === 'paid') {
      totalRevenue += data.total || 0;
    }
  });

  return successResponse({
    stats: {
      totalUsers: usersSnap.size,
      totalOrganisations: orgsSnap.size,
      totalProjects: projectsSnap.size,
      totalInvoices: invoicesSnap.size,
      totalContacts: contactsSnap.size,
      totalRevenue,
    },
  });
}

export const GET = withAuth(handleGet);
