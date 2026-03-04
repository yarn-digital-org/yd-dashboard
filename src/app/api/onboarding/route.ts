import { withAuth, successResponse, errorResponse, requireDb } from '@/lib/api-middleware';
import { z } from 'zod';

const onboardingSchema = z.object({
  currentStep: z.number().min(1).max(5).optional(),
  businessName: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  logoUrl: z.string().max(500).optional(),
  contactsImported: z.boolean().optional(),
  googleConnected: z.boolean().optional(),
  emailConnected: z.boolean().optional(),
  teamInvites: z.array(z.string().max(255)).max(20).optional(),
  completed: z.boolean().optional(),
});

// GET - Get onboarding progress
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();

  const doc = await db.collection('users').doc(user.userId).get();
  const userData = doc.data();

  return successResponse({
    currentStep: userData?.onboardingStep || 1,
    businessName: userData?.businessName || '',
    industry: userData?.industry || '',
    logoUrl: userData?.logoUrl || '',
    contactsImported: userData?.contactsImported || false,
    googleConnected: userData?.googleConnected || false,
    emailConnected: userData?.emailConnected || false,
    teamInvites: userData?.teamInvites || [],
    completed: userData?.onboardingCompleted || false,
  });
});

// POST - Save onboarding progress
export const POST = withAuth(async (request, { user }) => {
  const db = requireDb();

  const body = await request.json();
  const result = onboardingSchema.safeParse(body);
  if (!result.success) {
    return errorResponse('Invalid input', 400, 'VALIDATION_ERROR');
  }

  const data = result.data;
  const updates: Record<string, unknown> = {};

  if (data.currentStep !== undefined) updates.onboardingStep = data.currentStep;
  if (data.businessName !== undefined) updates.businessName = data.businessName;
  if (data.industry !== undefined) updates.industry = data.industry;
  if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
  if (data.contactsImported !== undefined) updates.contactsImported = data.contactsImported;
  if (data.googleConnected !== undefined) updates.googleConnected = data.googleConnected;
  if (data.emailConnected !== undefined) updates.emailConnected = data.emailConnected;
  if (data.teamInvites !== undefined) updates.teamInvites = data.teamInvites;
  if (data.completed !== undefined) updates.onboardingCompleted = data.completed;

  updates.updatedAt = new Date().toISOString();

  await db.collection('users').doc(user.userId).update(updates);

  // If completing, also update business settings
  if (data.completed && data.businessName) {
    try {
      await db.collection('settings').doc('business').set({
        name: data.businessName,
        industry: data.industry || '',
        logoUrl: data.logoUrl || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch {}
  }

  return successResponse({ saved: true });
});
