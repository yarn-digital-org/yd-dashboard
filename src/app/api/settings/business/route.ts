import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
} from '@/lib/api-middleware';

// Validation schema for address
const addressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
});

// Validation schema for business settings
const businessSettingsSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(200),
  businessType: z.string().max(100).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  website: z.string().url().max(200).optional().or(z.literal('')),
  taxId: z.string().max(50).optional(),
  address: addressSchema.optional(),
  defaultCurrency: z.string().length(3).default('USD'),
});

// GET - Fetch business settings
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();

  const settingsDoc = await db.collection('businessSettings').doc(user.userId).get();

  if (!settingsDoc.exists) {
    // Return default settings if none exist
    return successResponse({
      businessName: '',
      businessType: '',
      email: '',
      phone: '',
      website: '',
      taxId: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
      },
      defaultCurrency: 'USD',
    });
  }

  return successResponse(settingsDoc.data());
});

// PUT - Update business settings
export const PUT = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, businessSettingsSchema);

  const settingsData = {
    ...data,
    userId: user.userId,
    updatedAt: new Date().toISOString(),
  };

  // Check if document exists to decide between set or create
  const existingDoc = await db.collection('businessSettings').doc(user.userId).get();
  
  if (existingDoc.exists) {
    await db.collection('businessSettings').doc(user.userId).update(settingsData);
  } else {
    await db.collection('businessSettings').doc(user.userId).set({
      ...settingsData,
      createdAt: new Date().toISOString(),
    });
  }

  return successResponse(settingsData);
});
