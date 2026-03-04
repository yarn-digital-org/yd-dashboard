import { NextRequest } from 'next/server';
import { executeAutomation } from '@/lib/automation-engine';
import { withAuth, successResponse, errorResponse } from '@/lib/api-middleware';

/**
 * POST /api/automations/execute
 * Manually test/trigger an automation
 * Body: { automationId, triggerData }
 */
export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { automationId, triggerData = {} } = body;

    if (!automationId) {
      return errorResponse('automationId is required', 400, 'VALIDATION_ERROR');
    }

    const result = await executeAutomation(automationId, triggerData, user.userId);

    if (!result) {
      return errorResponse('Automation not found', 404, 'NOT_FOUND');
    }

    return successResponse(result);
  } catch (error) {
    console.error('Error executing automation:', error);
    return errorResponse('Failed to execute automation', 500, 'INTERNAL_ERROR');
  }
});
