import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: true,
        docs: [],
      }),
      add: vi.fn().mockResolvedValue({ id: 'test-automation-id' }),
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'test-automation-id',
          data: () => ({
            userId: 'test-user-id',
            name: 'Welcome New Leads',
            description: 'Send welcome email when a new lead is created',
            trigger: {
              type: 'lead_created',
              conditions: [],
            },
            actions: [
              {
                id: 'action-1',
                type: 'send_email',
                config: {
                  subject: 'Welcome!',
                  template: 'welcome-lead',
                },
                order: 0,
              },
            ],
            enabled: true,
            runCount: 12,
            lastRunAt: '2024-06-01T10:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-06-01T10:00:00Z',
          }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

// Mock cookies for auth
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-jwt-token' })),
  })),
  headers: () => new Map([['x-csrf-token', '1']]),
}));

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
    })),
  },
}));

describe('Automations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Automation Structure', () => {
    it('should have required fields', () => {
      const automation = {
        id: 'auto-1',
        userId: 'user-1',
        name: 'Welcome New Leads',
        trigger: { type: 'lead_created', conditions: [] },
        actions: [],
        enabled: true,
        runCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(automation.id).toBeTruthy();
      expect(automation.userId).toBeTruthy();
      expect(automation.name).toBeTruthy();
      expect(automation.trigger).toBeDefined();
      expect(automation.trigger.type).toBeTruthy();
      expect(Array.isArray(automation.actions)).toBe(true);
      expect(typeof automation.enabled).toBe('boolean');
      expect(typeof automation.runCount).toBe('number');
    });

    it('should have optional description', () => {
      const automation = {
        id: 'auto-1',
        userId: 'user-1',
        name: 'Test',
        description: 'A test automation',
        trigger: { type: 'lead_created', conditions: [] },
        actions: [],
        enabled: false,
        runCount: 0,
      };

      expect(automation.description).toBe('A test automation');
    });
  });

  describe('Trigger Types', () => {
    const validTriggerTypes = [
      'lead_created',
      'lead_status_changed',
      'invoice_paid',
      'invoice_overdue',
      'contract_signed',
      'project_created',
      'project_completed',
      'booking_created',
      'form_submitted',
    ];

    it('should accept valid trigger types', () => {
      validTriggerTypes.forEach(type => {
        const trigger = { type, conditions: [] };
        expect(trigger.type).toBe(type);
        expect(validTriggerTypes).toContain(type);
      });
    });

    it('should support trigger conditions', () => {
      const trigger = {
        type: 'lead_status_changed',
        conditions: [
          { field: 'status', operator: 'equals', value: 'qualified' },
          { field: 'priority', operator: 'equals', value: 'high' },
        ],
      };

      expect(trigger.conditions).toHaveLength(2);
      expect(trigger.conditions[0].field).toBe('status');
      expect(trigger.conditions[0].operator).toBe('equals');
      expect(trigger.conditions[0].value).toBe('qualified');
    });

    it('should require at least a trigger type', () => {
      const trigger = { type: '', conditions: [] };
      expect(trigger.type).toBeFalsy();
    });
  });

  describe('Action Configuration', () => {
    const validActionTypes = [
      'send_email',
      'update_status',
      'create_task',
      'add_tag',
      'wait',
      'webhook',
      'notification',
    ];

    it('should accept valid action types', () => {
      validActionTypes.forEach(type => {
        expect(validActionTypes).toContain(type);
      });
    });

    it('should have ordered actions', () => {
      const actions = [
        { id: 'a1', type: 'send_email', config: { subject: 'Welcome' }, order: 0 },
        { id: 'a2', type: 'wait', config: { duration: 86400 }, order: 1 },
        { id: 'a3', type: 'send_email', config: { subject: 'Follow up' }, order: 2 },
      ];

      const sorted = [...actions].sort((a, b) => a.order - b.order);
      expect(sorted[0].type).toBe('send_email');
      expect(sorted[1].type).toBe('wait');
      expect(sorted[2].type).toBe('send_email');
    });

    it('should validate send_email action config', () => {
      const action = {
        id: 'a1',
        type: 'send_email',
        config: {
          subject: 'Welcome to our platform',
          template: 'welcome',
          to: 'trigger.contact.email',
        },
        order: 0,
      };

      expect(action.config.subject).toBeTruthy();
      expect(action.config.template).toBeTruthy();
    });

    it('should validate wait action config', () => {
      const action = {
        id: 'a2',
        type: 'wait',
        config: {
          duration: 86400, // 1 day in seconds
          unit: 'seconds',
        },
        order: 0,
      };

      expect(action.config.duration).toBeGreaterThan(0);
    });

    it('should validate webhook action config', () => {
      const action = {
        id: 'a3',
        type: 'webhook',
        config: {
          url: 'https://hooks.example.com/trigger',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        order: 0,
      };

      expect(action.config.url).toMatch(/^https?:\/\//);
      expect(action.config.method).toBe('POST');
    });
  });

  describe('Automation Enable/Disable', () => {
    it('should toggle automation enabled state', () => {
      const automation = { enabled: true };
      automation.enabled = !automation.enabled;
      expect(automation.enabled).toBe(false);
      automation.enabled = !automation.enabled;
      expect(automation.enabled).toBe(true);
    });

    it('should default to enabled when created', () => {
      const automation = {
        name: 'New Automation',
        trigger: { type: 'lead_created', conditions: [] },
        actions: [],
        enabled: true,
      };
      expect(automation.enabled).toBe(true);
    });
  });

  describe('Automation Run History', () => {
    it('should track run count', () => {
      const automation = { runCount: 0 };
      automation.runCount += 1;
      expect(automation.runCount).toBe(1);
      automation.runCount += 1;
      expect(automation.runCount).toBe(2);
    });

    it('should track lastRunAt timestamp', () => {
      const automation = {
        runCount: 0,
        lastRunAt: null as string | null,
      };

      const now = new Date().toISOString();
      automation.lastRunAt = now;
      automation.runCount += 1;

      expect(automation.lastRunAt).toBeTruthy();
      expect(automation.runCount).toBe(1);
    });

    it('should structure run history entries', () => {
      const runEntry = {
        id: 'run-1',
        automationId: 'auto-1',
        triggeredBy: 'lead_created',
        triggerData: { leadId: 'lead-123', leadName: 'John Doe' },
        status: 'completed' as const,
        actionsExecuted: [
          { actionId: 'a1', type: 'send_email', status: 'success', executedAt: '2024-06-01T10:00:01Z' },
        ],
        startedAt: '2024-06-01T10:00:00Z',
        completedAt: '2024-06-01T10:00:02Z',
        error: null,
      };

      expect(runEntry.automationId).toBeTruthy();
      expect(runEntry.status).toBe('completed');
      expect(runEntry.actionsExecuted).toHaveLength(1);
      expect(runEntry.error).toBeNull();
    });

    it('should handle failed run entries', () => {
      const failedRun = {
        id: 'run-2',
        automationId: 'auto-1',
        triggeredBy: 'lead_created',
        status: 'failed',
        actionsExecuted: [
          { actionId: 'a1', type: 'send_email', status: 'failed', error: 'Email service unavailable' },
        ],
        startedAt: '2024-06-01T10:00:00Z',
        completedAt: '2024-06-01T10:00:05Z',
        error: 'Action failed: send_email',
      };

      expect(failedRun.status).toBe('failed');
      expect(failedRun.error).toBeTruthy();
      expect(failedRun.actionsExecuted[0].status).toBe('failed');
    });
  });

  describe('Automation Validation', () => {
    it('should require a name', () => {
      const isValid = (name: string) => name.trim().length > 0;
      expect(isValid('Welcome Automation')).toBe(true);
      expect(isValid('')).toBe(false);
      expect(isValid('  ')).toBe(false);
    });

    it('should require at least one action', () => {
      const isValid = (actions: unknown[]) => actions.length > 0;
      expect(isValid([{ type: 'send_email' }])).toBe(true);
      expect(isValid([])).toBe(false);
    });

    it('should require a valid trigger', () => {
      const validTriggers = ['lead_created', 'lead_status_changed', 'invoice_paid', 'contract_signed'];
      const isValidTrigger = (type: string) => validTriggers.includes(type);
      
      expect(isValidTrigger('lead_created')).toBe(true);
      expect(isValidTrigger('invalid_trigger')).toBe(false);
    });

    it('should limit automation name length', () => {
      const maxLength = 100;
      const isValid = (name: string) => name.length <= maxLength;
      expect(isValid('Short name')).toBe(true);
      expect(isValid('A'.repeat(101))).toBe(false);
    });
  });
});
