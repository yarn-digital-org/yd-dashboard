import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { executeAutomation } from '@/lib/automation-engine';
import { z } from 'zod';

const executeSchema = z.object({
  automationId: z.string().min(1, 'automationId is required'),
  triggerData: z.record(z.string(), z.unknown()).optional().default({}),
});

/**
 * POST /api/automations/execute
 * Manually test/trigger an automation
 * Body: { automationId, triggerData }
 */
export const POST = withAuth(async (request, { user }) => {
  const body = await request.json();
  const parsed = executeSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return errorResponse(firstError.message, 400, 'VALIDATION_ERROR');
  }

  const { automationId, triggerData } = parsed.data;

  const result = await executeAutomation(automationId, triggerData, user.userId);

  if (!result) {
    return errorResponse('Automation not found', 404, 'NOT_FOUND');
  }

  return successResponse(result);
});
