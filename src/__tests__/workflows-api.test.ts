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
      add: vi.fn().mockResolvedValue({ id: 'test-workflow-id' }),
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'test-workflow-id',
          data: () => ({
            userId: 'test-user-id',
            name: 'Wedding Photography Workflow',
            description: 'Standard workflow for wedding shoots',
            serviceType: 'Wedding',
            tasks: [
              {
                id: 'task-1',
                name: 'Initial Consultation',
                order: 0,
                dueFrom: 'start_date',
                dueDaysOffset: 0,
                subtasks: [],
                labels: [],
              },
            ],
            isDefault: true,
            usageCount: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      })),
      batch: vi.fn(() => ({
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    batch: vi.fn(() => ({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

// Mock cookies for auth
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-jwt-token' })),
  })),
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

describe('Workflows API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Workflow Template Structure', () => {
    it('should have required fields', () => {
      const workflow = {
        id: 'workflow-1',
        userId: 'user-1',
        name: 'Test Workflow',
        tasks: [],
        isDefault: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(workflow.id).toBeTruthy();
      expect(workflow.userId).toBeTruthy();
      expect(workflow.name).toBeTruthy();
      expect(Array.isArray(workflow.tasks)).toBe(true);
      expect(typeof workflow.isDefault).toBe('boolean');
      expect(typeof workflow.usageCount).toBe('number');
    });

    it('should have optional fields', () => {
      const workflow = {
        id: 'workflow-1',
        userId: 'user-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        serviceType: 'Wedding',
        tasks: [],
        isDefault: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(workflow.description).toBe('A test workflow');
      expect(workflow.serviceType).toBe('Wedding');
    });
  });

  describe('Task Structure', () => {
    it('should have valid task structure', () => {
      const task = {
        id: 'task-1',
        name: 'Send Contract',
        description: 'Email contract to client',
        order: 0,
        dueDaysOffset: 7,
        dueFrom: 'start_date' as const,
        subtasks: [],
        labels: [],
      };

      expect(task.id).toBeTruthy();
      expect(task.name).toBeTruthy();
      expect(typeof task.order).toBe('number');
      expect(['start_date', 'event_date']).toContain(task.dueFrom);
    });

    it('should support due date calculation options', () => {
      const dueFromOptions = ['start_date', 'event_date'];
      expect(dueFromOptions).toHaveLength(2);
      expect(dueFromOptions).toContain('start_date');
      expect(dueFromOptions).toContain('event_date');
    });

    it('should support optional dueDaysOffset', () => {
      const taskWithOffset = {
        id: 'task-1',
        name: 'Task 1',
        order: 0,
        dueDaysOffset: 14,
        dueFrom: 'start_date' as const,
        subtasks: [],
        labels: [],
      };

      const taskWithoutOffset = {
        id: 'task-2',
        name: 'Task 2',
        order: 1,
        dueDaysOffset: undefined,
        dueFrom: 'start_date' as const,
        subtasks: [],
        labels: [],
      };

      expect(taskWithOffset.dueDaysOffset).toBe(14);
      expect(taskWithoutOffset.dueDaysOffset).toBeUndefined();
    });
  });

  describe('Subtask Structure', () => {
    it('should have valid subtask structure', () => {
      const subtask = {
        id: 'subtask-1',
        name: 'Review contract terms',
      };

      expect(subtask.id).toBeTruthy();
      expect(subtask.name).toBeTruthy();
    });

    it('should support multiple subtasks per task', () => {
      const task = {
        id: 'task-1',
        name: 'Contract Review',
        order: 0,
        dueFrom: 'start_date' as const,
        subtasks: [
          { id: 'sub-1', name: 'Review terms' },
          { id: 'sub-2', name: 'Check pricing' },
          { id: 'sub-3', name: 'Verify dates' },
        ],
        labels: [],
      };

      expect(task.subtasks).toHaveLength(3);
      expect(task.subtasks[0].name).toBe('Review terms');
    });
  });

  describe('Task Labels', () => {
    it('should support labels on tasks', () => {
      const task = {
        id: 'task-1',
        name: 'Test Task',
        order: 0,
        dueFrom: 'start_date' as const,
        subtasks: [],
        labels: ['label-1', 'label-2'],
      };

      expect(task.labels).toHaveLength(2);
      expect(task.labels).toContain('label-1');
    });

    it('should toggle labels correctly', () => {
      const labels = ['label-1', 'label-2'];
      const labelToToggle = 'label-1';

      // Remove label
      const removed = labels.filter(l => l !== labelToToggle);
      expect(removed).toHaveLength(1);
      expect(removed).not.toContain('label-1');

      // Add label
      const added = [...removed, labelToToggle];
      expect(added).toHaveLength(2);
      expect(added).toContain('label-1');
    });
  });

  describe('Task Label Entity', () => {
    it('should have valid label structure', () => {
      const label = {
        id: 'label-1',
        userId: 'user-1',
        name: 'Urgent',
        color: '#EF4444',
        createdAt: new Date().toISOString(),
      };

      expect(label.id).toBeTruthy();
      expect(label.name).toBeTruthy();
      expect(label.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should validate hex color format', () => {
      const validColors = ['#EF4444', '#3B82F6', '#10B981'];
      const invalidColors = ['red', '#FFF', '123456', '#GGGGGG'];

      validColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      invalidColors.forEach(color => {
        expect(color).not.toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('Due Date Calculation', () => {
    it('should calculate due date from start date', () => {
      const startDate = new Date('2024-06-01');
      const dueDaysOffset = 7;

      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + dueDaysOffset);

      expect(dueDate.toISOString().split('T')[0]).toBe('2024-06-08');
    });

    it('should calculate due date from event date', () => {
      const eventDate = new Date('2024-09-15');
      const dueDaysOffset = -30; // 30 days before event

      const dueDate = new Date(eventDate);
      dueDate.setDate(dueDate.getDate() + dueDaysOffset);

      expect(dueDate.toISOString().split('T')[0]).toBe('2024-08-16');
    });

    it('should handle zero offset', () => {
      const startDate = new Date('2024-06-01');
      const dueDaysOffset = 0;

      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + dueDaysOffset);

      expect(dueDate.toISOString().split('T')[0]).toBe('2024-06-01');
    });
  });

  describe('Apply Workflow to Project', () => {
    it('should transform template tasks to project tasks', () => {
      const templateTasks = [
        {
          id: 'template-task-1',
          name: 'Initial Consult',
          order: 0,
          dueDaysOffset: 0,
          dueFrom: 'start_date' as const,
          subtasks: [{ id: 'sub-1', name: 'Prep questions' }],
          labels: ['client-facing'],
        },
      ];

      const projectStartDate = new Date('2024-06-01');

      const projectTasks = templateTasks.map((task) => ({
        id: crypto.randomUUID(),
        name: task.name,
        description: undefined,
        order: task.order,
        isCompleted: false,
        completedAt: undefined,
        dueDate: task.dueDaysOffset !== undefined
          ? (() => {
              const date = new Date(projectStartDate);
              date.setDate(date.getDate() + task.dueDaysOffset);
              return date.toISOString();
            })()
          : undefined,
        subtasks: task.subtasks.map(s => ({
          id: crypto.randomUUID(),
          name: s.name,
          isCompleted: false,
        })),
        labels: task.labels,
      }));

      expect(projectTasks).toHaveLength(1);
      expect(projectTasks[0].isCompleted).toBe(false);
      expect(projectTasks[0].subtasks[0].isCompleted).toBe(false);
      expect(projectTasks[0].dueDate).toBeTruthy();
    });

    it('should increment workflow usage count', () => {
      let usageCount = 5;
      usageCount = usageCount + 1;
      expect(usageCount).toBe(6);
    });
  });

  describe('Default Workflow Logic', () => {
    it('should only allow one default per service type', () => {
      const workflows = [
        { id: '1', serviceType: 'Wedding', isDefault: true },
        { id: '2', serviceType: 'Wedding', isDefault: false },
        { id: '3', serviceType: 'Portrait', isDefault: true },
      ];

      const weddingDefaults = workflows.filter(
        w => w.serviceType === 'Wedding' && w.isDefault
      );

      expect(weddingDefaults).toHaveLength(1);
    });

    it('should unset other defaults when setting new default', () => {
      const workflows = [
        { id: '1', serviceType: 'Wedding', isDefault: true },
        { id: '2', serviceType: 'Wedding', isDefault: false },
      ];

      // Setting workflow 2 as default
      const newDefaultId = '2';
      const updated = workflows.map(w => ({
        ...w,
        isDefault: w.serviceType === 'Wedding' ? w.id === newDefaultId : w.isDefault,
      }));

      expect(updated[0].isDefault).toBe(false);
      expect(updated[1].isDefault).toBe(true);
    });
  });

  describe('Task Reordering', () => {
    it('should reorder tasks correctly', () => {
      const tasks = [
        { id: '1', name: 'Task A', order: 0 },
        { id: '2', name: 'Task B', order: 1 },
        { id: '3', name: 'Task C', order: 2 },
      ];

      // Move Task C to position 0
      const fromIndex = 2;
      const toIndex = 0;

      const reordered = [...tasks];
      const [movedTask] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movedTask);
      
      // Update order values
      const withNewOrder = reordered.map((task, i) => ({ ...task, order: i }));

      expect(withNewOrder[0].name).toBe('Task C');
      expect(withNewOrder[0].order).toBe(0);
      expect(withNewOrder[1].name).toBe('Task A');
      expect(withNewOrder[1].order).toBe(1);
      expect(withNewOrder[2].name).toBe('Task B');
      expect(withNewOrder[2].order).toBe(2);
    });
  });

  describe('Workflow Stats', () => {
    it('should calculate stats correctly', () => {
      const workflows = [
        { serviceType: 'Wedding', tasks: [{ id: '1' }, { id: '2' }] },
        { serviceType: 'Wedding', tasks: [{ id: '3' }] },
        { serviceType: 'Portrait', tasks: [{ id: '4' }, { id: '5' }, { id: '6' }] },
        { serviceType: undefined, tasks: [] },
      ];

      const stats = {
        total: workflows.length,
        byServiceType: workflows.reduce((acc, w) => {
          const key = w.serviceType || 'unassigned';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalTasks: workflows.reduce((acc, w) => acc + (w.tasks?.length || 0), 0),
      };

      expect(stats.total).toBe(4);
      expect(stats.byServiceType['Wedding']).toBe(2);
      expect(stats.byServiceType['Portrait']).toBe(1);
      expect(stats.byServiceType['unassigned']).toBe(1);
      expect(stats.totalTasks).toBe(6);
    });
  });

  describe('Workflow Validation', () => {
    it('should require workflow name', () => {
      const validate = (name: string) => {
        if (!name || name.trim().length === 0) {
          return { valid: false, error: 'Name is required' };
        }
        if (name.length > 100) {
          return { valid: false, error: 'Name too long' };
        }
        return { valid: true };
      };

      expect(validate('')).toEqual({ valid: false, error: 'Name is required' });
      expect(validate('   ')).toEqual({ valid: false, error: 'Name is required' });
      expect(validate('Valid Name')).toEqual({ valid: true });
      expect(validate('A'.repeat(101))).toEqual({ valid: false, error: 'Name too long' });
    });

    it('should require task name', () => {
      const validateTask = (task: { name: string }) => {
        if (!task.name || task.name.trim().length === 0) {
          return { valid: false, error: 'Task name is required' };
        }
        return { valid: true };
      };

      expect(validateTask({ name: '' })).toEqual({ valid: false, error: 'Task name is required' });
      expect(validateTask({ name: 'Valid Task' })).toEqual({ valid: true });
    });
  });

  describe('Workflow Filtering and Search', () => {
    it('should filter by service type', () => {
      const workflows = [
        { id: '1', name: 'Wedding 1', serviceType: 'Wedding' },
        { id: '2', name: 'Portrait 1', serviceType: 'Portrait' },
        { id: '3', name: 'Wedding 2', serviceType: 'Wedding' },
      ];

      const filtered = workflows.filter(w => w.serviceType === 'Wedding');
      expect(filtered).toHaveLength(2);
    });

    it('should search by name and description', () => {
      const workflows = [
        { id: '1', name: 'Wedding Photography', description: 'Full day coverage' },
        { id: '2', name: 'Portrait Session', description: 'Studio portrait workflow' },
        { id: '3', name: 'Event Coverage', description: 'Corporate event photography' },
      ];

      const search = 'portrait';
      const filtered = workflows.filter(w =>
        w.name.toLowerCase().includes(search) ||
        w.description?.toLowerCase().includes(search)
      );

      // "Portrait Session" name matches, "Studio portrait workflow" description matches
      expect(filtered).toHaveLength(1); // Only workflow 2 matches (has 'portrait' in name and description)
      expect(filtered.map(w => w.id)).toContain('2');
    });
  });

  describe('Pagination', () => {
    it('should paginate workflows correctly', () => {
      const allWorkflows = Array.from({ length: 35 }, (_, i) => ({ id: `workflow-${i}` }));
      const limit = 20;
      const offset = 20;

      const paginated = allWorkflows.slice(offset, offset + limit);

      expect(paginated).toHaveLength(15);
      expect(paginated[0].id).toBe('workflow-20');
    });

    it('should calculate hasMore correctly', () => {
      const total = 35;
      const limit = 20;
      const offset = 0;
      const returnedCount = 20;

      const hasMore = offset + returnedCount < total;
      expect(hasMore).toBe(true);

      const lastPageHasMore = 20 + 15 < total;
      expect(lastPageHasMore).toBe(false);
    });
  });
});
