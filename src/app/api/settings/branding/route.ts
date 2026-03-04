import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
} from '@/lib/api-middleware';

const brandingSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF3300'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#111827'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF6633'),
  logoUrl: z.string().url().max(500).optional().or(z.literal('')),
  faviconUrl: z.string().url().max(500).optional().or(z.literal('')),
  fontFamily: z.string().max(100).default('Inter'),
  borderRadius: z.enum(['none', 'small', 'medium', 'large']).default('medium'),
  emailHeaderHtml: z.string().max(5000).optional().or(z.literal('')),
  emailFooterHtml: z.string().max(5000).optional().or(z.literal('')),
  portalWelcomeMessage: z.string().max(1000).optional().or(z.literal('')),
});

export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();
  const doc = await db.collection('brandingSettings').doc(user.userId).get();

  if (!doc.exists) {
    return successResponse({
      primaryColor: '#FF3300',
      secondaryColor: '#111827',
      accentColor: '#FF6633',
      logoUrl: '',
      faviconUrl: '',
      fontFamily: 'Inter',
      borderRadius: 'medium',
      emailHeaderHtml: '',
      emailFooterHtml: '',
      portalWelcomeMessage: '',
    });
  }

  return successResponse(doc.data());
});

export const PUT = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, brandingSettingsSchema);

  await db.collection('brandingSettings').doc(user.userId).set(
    {
      ...data,
      userId: user.userId,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return successResponse(data);
});
