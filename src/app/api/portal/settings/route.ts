import { NextRequest } from 'next/server';
import { withAuth, successResponse, handleApiError, requireDb } from '@/lib/api-middleware';

// GET - Get portal settings
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();
  const snapshot = await db.collection('portalSettings').where('userId', '==', user.userId).limit(1).get();
  
  if (snapshot.empty) {
    return successResponse(null);
  }

  const doc = snapshot.docs[0];
  return successResponse({ id: doc.id, ...doc.data() });
});

// PUT - Update portal settings
export const PUT = withAuth(async (request, { user }) => {
  const db = requireDb();
  const body = await request.json();
  
  const settings = {
    userId: user.userId,
    enabled: body.enabled ?? false,
    subdomain: body.subdomain || '',
    customDomain: body.customDomain || '',
    welcomeMessage: body.welcomeMessage || '',
    footerText: body.footerText || '',
    primaryColor: body.primaryColor || '#2563eb',
    backgroundColor: body.backgroundColor || '#ffffff',
    logoUrl: body.logoUrl || '',
    showProjects: body.showProjects ?? true,
    showInvoices: body.showInvoices ?? true,
    showContracts: body.showContracts ?? true,
    showFiles: body.showFiles ?? true,
    showMessages: body.showMessages ?? true,
    showWorkflowProgress: body.showWorkflowProgress ?? true,
    hidePoweredBy: body.hidePoweredBy ?? false,
    updatedAt: new Date().toISOString(),
  };

  const snapshot = await db.collection('portalSettings').where('userId', '==', user.userId).limit(1).get();
  
  if (snapshot.empty) {
    const ref = await db.collection('portalSettings').add(settings);
    return successResponse({ id: ref.id, ...settings });
  } else {
    const docId = snapshot.docs[0].id;
    await db.collection('portalSettings').doc(docId).update(settings);
    return successResponse({ id: docId, ...settings });
  }
});
