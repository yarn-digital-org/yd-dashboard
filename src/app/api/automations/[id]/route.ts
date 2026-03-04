import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - Get single automation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const doc = await adminDb.collection('automations').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: unknown) {
    console.error('Error fetching automation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PUT - Update automation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const data = await request.json();
    const { name, description, trigger, actions, enabled } = data;

    // Check if automation exists
    const docRef = adminDb.collection('automations').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Validation
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (trigger !== undefined && !trigger.type) {
      return NextResponse.json({ error: 'Trigger type is required' }, { status: 400 });
    }

    if (actions !== undefined && (!Array.isArray(actions) || actions.length === 0)) {
      return NextResponse.json({ error: 'At least one action is required' }, { status: 400 });
    }

    // Validate trigger type if provided
    if (trigger) {
      const validTriggers = ['new_contact', 'new_lead', 'invoice_overdue', 'form_submission'];
      if (!validTriggers.includes(trigger.type)) {
        return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 });
      }
    }

    // Validate action types if provided
    if (actions) {
      const validActions = ['send_email', 'create_task', 'update_status', 'notify'];
      for (const action of actions) {
        if (!validActions.includes(action.type)) {
          return NextResponse.json({ error: `Invalid action type: ${action.type}` }, { status: 400 });
        }
      }
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (trigger !== undefined) updateData.trigger = trigger;
    if (actions !== undefined) updateData.actions = actions;
    if (enabled !== undefined) updateData.enabled = enabled;

    await docRef.update(updateData);

    const updated = await docRef.get();

    return NextResponse.json({
      id: updated.id,
      ...updated.data(),
      message: 'Automation updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE - Delete automation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const docRef = adminDb.collection('automations').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({
      message: 'Automation deleted successfully',
      id,
    });
  } catch (error: unknown) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
