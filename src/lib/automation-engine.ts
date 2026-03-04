/**
 * Automation Engine
 * Evaluates triggers and executes actions for automations
 */

import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email-service';

// Types
export type TriggerType =
  | 'new_contact'
  | 'new_lead'
  | 'invoice_overdue'
  | 'form_submission'
  | 'new_booking'
  | 'event_starting_soon'
  | 'event_completed';
export type ActionType = 'send_email' | 'create_task' | 'update_status' | 'notify';

export interface AutomationTrigger {
  type: TriggerType;
  config?: Record<string, any>;
}

export interface AutomationAction {
  type: ActionType;
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
  userId: string;
}

export interface AutomationRunLog {
  automationId: string;
  automationName: string;
  triggerType: TriggerType;
  triggerData: Record<string, any>;
  actionsExecuted: {
    type: ActionType;
    success: boolean;
    error?: string;
    result?: any;
  }[];
  status: 'success' | 'partial' | 'failed';
  executedAt: Date;
  userId: string;
}

/**
 * Replace template variables in a string like {{name}}, {{email}}, etc.
 */
function interpolate(template: string | undefined, data: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
  });
}

/**
 * Execute a single automation action
 */
async function executeAction(
  action: AutomationAction,
  triggerData: Record<string, any>,
  userId: string
): Promise<{ success: boolean; error?: string; result?: any }> {
  try {
    switch (action.type) {
      case 'send_email': {
        const to = interpolate(action.config.to, triggerData) || triggerData.email;
        const subject = interpolate(action.config.subject, triggerData);
        const body = interpolate(action.config.body, triggerData);

        if (!to) {
          return { success: false, error: 'No recipient email address' };
        }

        const result = await sendEmail({ to, subject, html: body });
        return { success: result.success, error: result.error, result: { to, subject } };
      }

      case 'create_task': {
        if (!adminDb) return { success: false, error: 'Database not available' };
        
        const title = interpolate(action.config.title, triggerData);
        const taskRef = await adminDb.collection('tasks').add({
          title: title || `Task from automation`,
          description: interpolate(action.config.body, triggerData),
          assignee: action.config.assignee || 'unassigned',
          status: 'backlog',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'automation',
        });
        return { success: true, result: { taskId: taskRef.id, title } };
      }

      case 'update_status': {
        if (!adminDb) return { success: false, error: 'Database not available' };
        
        const field = action.config.field || 'status';
        const value = interpolate(action.config.value, triggerData);
        const entityId = triggerData.id;
        const collection = triggerData._collection;

        if (!entityId || !collection) {
          return { success: false, error: 'No entity ID or collection for status update' };
        }

        await adminDb.collection(collection).doc(entityId).update({
          [field]: value,
          updatedAt: new Date(),
        });
        return { success: true, result: { entityId, field, value } };
      }

      case 'notify': {
        // Store notification in Firestore
        if (!adminDb) return { success: false, error: 'Database not available' };
        
        const message = interpolate(action.config.message || action.config.body, triggerData);
        const notifRef = await adminDb.collection('notifications').add({
          userId,
          message,
          title: interpolate(action.config.title, triggerData) || 'Automation Notification',
          read: false,
          createdAt: new Date(),
          source: 'automation',
        });
        return { success: true, result: { notificationId: notifRef.id } };
      }

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fire automations matching a trigger type
 * Call this from API routes when relevant events occur
 */
export async function fireAutomations(
  triggerType: TriggerType,
  triggerData: Record<string, any>,
  userId: string
): Promise<AutomationRunLog[]> {
  if (!adminDb) return [];

  try {
    // Find enabled automations matching this trigger type for this user
    const snapshot = await adminDb
      .collection('automations')
      .where('userId', '==', userId)
      .where('enabled', '==', true)
      .where('trigger.type', '==', triggerType)
      .get();

    if (snapshot.empty) return [];

    const logs: AutomationRunLog[] = [];

    for (const doc of snapshot.docs) {
      const automation = { id: doc.id, ...doc.data() } as Automation;

      // Execute all actions
      const actionResults = [];
      for (const action of automation.actions) {
        const result = await executeAction(action, triggerData, userId);
        actionResults.push({
          type: action.type,
          ...result,
        });
      }

      // Determine overall status
      const allSuccess = actionResults.every(r => r.success);
      const allFailed = actionResults.every(r => !r.success);
      const status = allSuccess ? 'success' : allFailed ? 'failed' : 'partial';

      // Log the run
      const runLog: AutomationRunLog = {
        automationId: automation.id,
        automationName: automation.name,
        triggerType,
        triggerData: { ...triggerData, _collection: undefined }, // Remove internal fields
        actionsExecuted: actionResults,
        status,
        executedAt: new Date(),
        userId,
      };

      await adminDb.collection('automation_runs').add(runLog);

      // Update automation stats
      await adminDb.collection('automations').doc(automation.id).update({
        lastRun: new Date(),
        runCount: (automation as any).runCount ? (automation as any).runCount + 1 : 1,
      });

      logs.push(runLog);
    }

    return logs;
  } catch (error) {
    console.error('Error firing automations:', error);
    return [];
  }
}

/**
 * Execute a specific automation by ID (for manual testing)
 */
export async function executeAutomation(
  automationId: string,
  triggerData: Record<string, any>,
  userId: string
): Promise<AutomationRunLog | null> {
  if (!adminDb) return null;

  try {
    const doc = await adminDb.collection('automations').doc(automationId).get();
    if (!doc.exists) return null;

    const automation = { id: doc.id, ...doc.data() } as Automation;

    // Execute all actions
    const actionResults = [];
    for (const action of automation.actions) {
      const result = await executeAction(action, triggerData, userId);
      actionResults.push({ type: action.type, ...result });
    }

    const allSuccess = actionResults.every(r => r.success);
    const allFailed = actionResults.every(r => !r.success);
    const status = allSuccess ? 'success' : allFailed ? 'failed' : 'partial';

    const runLog: AutomationRunLog = {
      automationId: automation.id,
      automationName: automation.name,
      triggerType: automation.trigger.type,
      triggerData,
      actionsExecuted: actionResults,
      status,
      executedAt: new Date(),
      userId,
    };

    await adminDb.collection('automation_runs').add(runLog);

    return runLog;
  } catch (error) {
    console.error('Error executing automation:', error);
    return null;
  }
}
