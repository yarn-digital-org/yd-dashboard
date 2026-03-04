import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Automation type definitions
export interface AutomationTrigger {
  type: 'new_contact' | 'new_lead' | 'invoice_overdue' | 'form_submission';
  config?: Record<string, any>;
}

export interface AutomationAction {
  type: 'send_email' | 'create_task' | 'update_status' | 'notify';
  config: {
    to?: string;
    subject?: string;
    body?: string;
    title?: string;
    assignee?: string;
    field?: string;
    value?: string;
    message?: string;
  };
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
  lastRun?: string;
  runCount: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// GET - List all automations
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled');

    let query: FirebaseFirestore.Query = adminDb.collection('automations').orderBy('createdAt', 'desc');

    if (enabled !== null && enabled !== '') {
      query = query.where('enabled', '==', enabled === 'true');
    }

    const snapshot = await query.get();
    const automations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Automation[];

    return NextResponse.json({
      automations,
      total: automations.length,
    });
  } catch (error: any) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new automation
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const data = await request.json();
    const { name, description, trigger, actions } = data;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!trigger || !trigger.type) {
      return NextResponse.json({ error: 'Trigger is required' }, { status: 400 });
    }

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ error: 'At least one action is required' }, { status: 400 });
    }

    // Validate trigger type
    const validTriggers = ['new_contact', 'new_lead', 'invoice_overdue', 'form_submission'];
    if (!validTriggers.includes(trigger.type)) {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 });
    }

    // Validate action types
    const validActions = ['send_email', 'create_task', 'update_status', 'notify'];
    for (const action of actions) {
      if (!validActions.includes(action.type)) {
        return NextResponse.json({ error: `Invalid action type: ${action.type}` }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    const automation: Omit<Automation, 'id'> = {
      name: name.trim(),
      description: description?.trim() || '',
      trigger,
      actions,
      enabled: true,
      runCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('automations').add(automation);

    return NextResponse.json(
      {
        id: docRef.id,
        ...automation,
        message: 'Automation created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating automation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
