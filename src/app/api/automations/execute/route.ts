import { NextRequest, NextResponse } from 'next/server';
import { executeAutomation } from '@/lib/automation-engine';

/**
 * POST /api/automations/execute
 * Manually test/trigger an automation
 * Body: { automationId, triggerData }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get userId from auth session
    const userId = 'demo-user';
    
    const body = await request.json();
    const { automationId, triggerData = {} } = body;

    if (!automationId) {
      return NextResponse.json(
        { success: false, error: 'automationId is required' },
        { status: 400 }
      );
    }

    const result = await executeAutomation(automationId, triggerData, userId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute automation' },
      { status: 500 }
    );
  }
}
