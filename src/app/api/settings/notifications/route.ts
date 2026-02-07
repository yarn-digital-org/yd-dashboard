import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
} from '@/lib/api-middleware';

// Email notification preferences schema
const emailPrefsSchema = z.object({
  newLead: z.boolean().default(true),
  newMessage: z.boolean().default(true),
  invoicePaid: z.boolean().default(true),
  invoiceOverdue: z.boolean().default(true),
  contractSigned: z.boolean().default(true),
  dailyDigest: z.boolean().default(false),
  weeklyReport: z.boolean().default(true),
});

// Push notification preferences schema
const pushPrefsSchema = z.object({
  newLead: z.boolean().default(true),
  newMessage: z.boolean().default(true),
  invoicePaid: z.boolean().default(true),
});

// Full notification settings schema
const notificationSettingsSchema = z.object({
  email: emailPrefsSchema.optional(),
  push: pushPrefsSchema.optional(),
});

// Default notification settings
const defaultSettings = {
  email: {
    newLead: true,
    newMessage: true,
    invoicePaid: true,
    invoiceOverdue: true,
    contractSigned: true,
    dailyDigest: false,
    weeklyReport: true,
  },
  push: {
    newLead: true,
    newMessage: true,
    invoicePaid: true,
  },
};

// GET - Fetch notification settings
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();

  const settingsDoc = await db.collection('notificationSettings').doc(user.userId).get();

  if (!settingsDoc.exists) {
    // Return default settings if none exist
    return successResponse(defaultSettings);
  }

  // Merge with defaults to ensure all keys exist
  const data = settingsDoc.data() || {};
  return successResponse({
    email: { ...defaultSettings.email, ...data.email },
    push: { ...defaultSettings.push, ...data.push },
  });
});

// PUT - Update notification settings
export const PUT = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, notificationSettingsSchema);

  const settingsData = {
    email: { ...defaultSettings.email, ...data.email },
    push: { ...defaultSettings.push, ...data.push },
    userId: user.userId,
    updatedAt: new Date().toISOString(),
  };

  // Check if document exists to decide between set or update
  const existingDoc = await db.collection('notificationSettings').doc(user.userId).get();
  
  if (existingDoc.exists) {
    await db.collection('notificationSettings').doc(user.userId).update(settingsData);
  } else {
    await db.collection('notificationSettings').doc(user.userId).set({
      ...settingsData,
      createdAt: new Date().toISOString(),
    });
  }

  return successResponse(settingsData);
});
