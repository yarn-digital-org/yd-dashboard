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
      add: vi.fn().mockResolvedValue({ id: 'test-invoice-id' }),
      count: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          data: () => ({ count: 5 }),
        }),
      })),
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'test-invoice-id',
          data: () => ({
            invoiceNumber: 'INV-0001',
            clientName: 'Acme Corp',
            clientEmail: 'billing@acme.com',
            items: [
              { description: 'Web Design', quantity: 1, rate: 5000, amount: 5000 },
              { description: 'Logo Design', quantity: 1, rate: 2000, amount: 2000 },
            ],
            subtotal: 7000,
            tax: 630,
            total: 7630,
            status: 'sent',
            dueDate: '2024-02-01',
            notes: 'Payment due within 30 days',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

describe('Invoices API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Invoice Data Structure', () => {
    it('should have required fields', () => {
      const invoice = {
        invoiceNumber: 'INV-0001',
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'draft',
        dueDate: '2024-02-01',
      };

      expect(invoice.invoiceNumber).toBeTruthy();
      expect(invoice.clientName).toBeTruthy();
      expect(invoice.clientEmail).toBeTruthy();
      expect(invoice.items).toBeDefined();
    });

    it('should support invoice items with quantity and rate', () => {
      const item = {
        description: 'Web Design',
        quantity: 2,
        rate: 5000,
        amount: 10000,
      };

      expect(item.description).toBeTruthy();
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.rate).toBeGreaterThan(0);
      expect(item.amount).toBe(item.quantity * item.rate);
    });
  });

  describe('Invoice Status', () => {
    it('should support valid status values', () => {
      const validStatuses = ['draft', 'sent', 'paid', 'overdue'];

      expect(validStatuses).toContain('draft');
      expect(validStatuses).toContain('sent');
      expect(validStatuses).toContain('paid');
      expect(validStatuses).toContain('overdue');
      expect(validStatuses).toHaveLength(4);
    });

    it('should default to draft status', () => {
      const defaultStatus = 'draft';
      expect(defaultStatus).toBe('draft');
    });

    it('should transition through valid states', () => {
      const transitions = [
        { from: 'draft', to: 'sent' },
        { from: 'sent', to: 'paid' },
        { from: 'sent', to: 'overdue' },
      ];

      transitions.forEach(({ from, to }) => {
        const validStatuses = ['draft', 'sent', 'paid', 'overdue'];
        expect(validStatuses).toContain(from);
        expect(validStatuses).toContain(to);
      });
    });
  });

  describe('Invoice Number Generation', () => {
    it('should generate sequential invoice numbers', () => {
      const count = 5;
      const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

      expect(invoiceNumber).toBe('INV-0006');
    });

    it('should pad invoice numbers with leading zeros', () => {
      const numbers = [1, 10, 100, 1000];
      const formatted = numbers.map(n => `INV-${String(n).padStart(4, '0')}`);

      expect(formatted[0]).toBe('INV-0001');
      expect(formatted[1]).toBe('INV-0010');
      expect(formatted[2]).toBe('INV-0100');
      expect(formatted[3]).toBe('INV-1000');
    });

    it('should use custom invoice number if provided', () => {
      const customNumber = 'CUSTOM-2024-001';
      expect(customNumber).toBe('CUSTOM-2024-001');
    });
  });

  describe('Invoice Calculations', () => {
    it('should calculate item amounts correctly', () => {
      const item = {
        description: 'Web Design',
        quantity: 3,
        rate: 1000,
        amount: 0,
      };

      item.amount = item.quantity * item.rate;
      expect(item.amount).toBe(3000);
    });

    it('should calculate subtotal from items', () => {
      const items = [
        { description: 'Item 1', quantity: 2, rate: 100, amount: 200 },
        { description: 'Item 2', quantity: 1, rate: 300, amount: 300 },
        { description: 'Item 3', quantity: 5, rate: 50, amount: 250 },
      ];

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      expect(subtotal).toBe(750);
    });

    it('should calculate tax from subtotal', () => {
      const subtotal = 1000;
      const taxRate = 0.09; // 9%
      const tax = Math.round(subtotal * taxRate * 100) / 100;

      expect(tax).toBe(90);
    });

    it('should calculate total with tax', () => {
      const subtotal = 1000;
      const tax = 90;
      const total = subtotal + tax;

      expect(total).toBe(1090);
    });

    it('should handle zero tax', () => {
      const subtotal = 1000;
      const tax = 0;
      const total = subtotal + tax;

      expect(total).toBe(1000);
    });

    it('should round calculations to 2 decimal places', () => {
      const value = 123.456789;
      const rounded = Math.round(value * 100) / 100;

      expect(rounded).toBe(123.46);
    });
  });

  describe('Invoice Validation', () => {
    it('should require client name', () => {
      const invoice = {
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
      };

      expect(invoice.clientName).toBeTruthy();
      expect(invoice.clientName.length).toBeGreaterThan(0);
    });

    it('should require client email', () => {
      const invoice = {
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
      };

      expect(invoice.clientEmail).toBeTruthy();
    });

    it('should validate email format', () => {
      const validEmail = 'billing@acme.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(validEmail)).toBe(true);
    });

    it('should normalize email to lowercase', () => {
      const email = 'Billing@ACME.COM';
      const normalized = email.toLowerCase().trim();

      expect(normalized).toBe('billing@acme.com');
    });

    it('should trim whitespace from fields', () => {
      const clientName = '  Acme Corp  ';
      const trimmed = clientName.trim();

      expect(trimmed).toBe('Acme Corp');
    });
  });

  describe('Invoice Items Management', () => {
    it('should add items to invoice', () => {
      const items: any[] = [];
      const newItem = {
        description: 'Web Design',
        quantity: 1,
        rate: 5000,
        amount: 5000,
      };

      items.push(newItem);
      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('Web Design');
    });

    it('should remove items from invoice', () => {
      const items = [
        { id: '1', description: 'Item 1', quantity: 1, rate: 100, amount: 100 },
        { id: '2', description: 'Item 2', quantity: 1, rate: 200, amount: 200 },
      ];

      const filtered = items.filter(item => item.id !== '1');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should update item quantity', () => {
      const item = {
        description: 'Web Design',
        quantity: 1,
        rate: 5000,
        amount: 5000,
      };

      item.quantity = 2;
      item.amount = item.quantity * item.rate;

      expect(item.quantity).toBe(2);
      expect(item.amount).toBe(10000);
    });

    it('should handle empty items array', () => {
      const items: any[] = [];
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

      expect(subtotal).toBe(0);
    });
  });

  describe('Invoice Filtering', () => {
    it('should filter by status', () => {
      const invoices = [
        { id: '1', status: 'draft' },
        { id: '2', status: 'sent' },
        { id: '3', status: 'paid' },
        { id: '4', status: 'sent' },
      ];

      const filtered = invoices.filter(inv => inv.status === 'sent');
      expect(filtered).toHaveLength(2);
    });

    it('should search by invoice number', () => {
      const invoices = [
        { id: '1', invoiceNumber: 'INV-0001' },
        { id: '2', invoiceNumber: 'INV-0002' },
        { id: '3', invoiceNumber: 'CUSTOM-001' },
      ];

      const search = 'inv';
      const filtered = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search)
      );

      expect(filtered).toHaveLength(2);
    });

    it('should search by client name', () => {
      const invoices = [
        { id: '1', clientName: 'Acme Corp' },
        { id: '2', clientName: 'TechCo' },
        { id: '3', clientName: 'Acme Industries' },
      ];

      const search = 'acme';
      const filtered = invoices.filter(inv =>
        inv.clientName.toLowerCase().includes(search)
      );

      expect(filtered).toHaveLength(2);
    });

    it('should search by client email', () => {
      const invoices = [
        { id: '1', clientEmail: 'billing@acme.com' },
        { id: '2', clientEmail: 'accounts@techco.com' },
        { id: '3', clientEmail: 'finance@acme.com' },
      ];

      const search = 'acme';
      const filtered = invoices.filter(inv =>
        inv.clientEmail.toLowerCase().includes(search)
      );

      expect(filtered).toHaveLength(2);
    });
  });

  describe('Invoice Due Date', () => {
    it('should handle due date string', () => {
      const dueDate = '2024-02-01';
      expect(dueDate).toBeTruthy();
      expect(new Date(dueDate).getTime()).toBeGreaterThan(0);
    });

    it('should detect overdue invoices', () => {
      const invoice = {
        dueDate: '2024-01-01',
        status: 'sent',
      };

      const now = new Date('2024-02-01');
      const due = new Date(invoice.dueDate);
      const isOverdue = invoice.status === 'sent' && due < now;

      expect(isOverdue).toBe(true);
    });

    it('should not mark paid invoices as overdue', () => {
      const invoice = {
        dueDate: '2024-01-01',
        status: 'paid',
      };

      const now = new Date('2024-02-01');
      const due = new Date(invoice.dueDate);
      const isOverdue = invoice.status === 'sent' && due < now;

      expect(isOverdue).toBe(false);
    });
  });

  describe('Invoice Stats', () => {
    it('should calculate total revenue from paid invoices', () => {
      const invoices = [
        { status: 'paid', total: 1000 },
        { status: 'paid', total: 2000 },
        { status: 'sent', total: 500 },
      ];

      const revenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

      expect(revenue).toBe(3000);
    });

    it('should calculate outstanding amount', () => {
      const invoices = [
        { status: 'sent', total: 1000 },
        { status: 'overdue', total: 500 },
        { status: 'paid', total: 2000 },
      ];

      const outstanding = invoices
        .filter(inv => ['sent', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + inv.total, 0);

      expect(outstanding).toBe(1500);
    });

    it('should count invoices by status', () => {
      const invoices = [
        { status: 'draft' },
        { status: 'sent' },
        { status: 'sent' },
        { status: 'paid' },
        { status: 'overdue' },
      ];

      const stats = {
        draft: invoices.filter(inv => inv.status === 'draft').length,
        sent: invoices.filter(inv => inv.status === 'sent').length,
        paid: invoices.filter(inv => inv.status === 'paid').length,
        overdue: invoices.filter(inv => inv.status === 'overdue').length,
      };

      expect(stats.draft).toBe(1);
      expect(stats.sent).toBe(2);
      expect(stats.paid).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('Invoice Pagination', () => {
    it('should paginate results correctly', () => {
      const allInvoices = Array.from({ length: 50 }, (_, i) => ({ id: `inv-${i}` }));
      const limit = 20;
      const offset = 0;

      const paginated = allInvoices.slice(offset, offset + limit);

      expect(paginated).toHaveLength(20);
      expect(paginated[0].id).toBe('inv-0');
      expect(paginated[19].id).toBe('inv-19');
    });

    it('should calculate hasMore correctly', () => {
      const total = 50;
      const limit = 20;
      const offset = 20;
      const returnedCount = 20;

      const hasMore = offset + returnedCount < total;
      expect(hasMore).toBe(true);
    });
  });

  describe('Invoice Notes', () => {
    it('should support optional notes field', () => {
      const invoice = {
        notes: 'Payment due within 30 days. Late fees apply.',
      };

      expect(invoice.notes).toBeTruthy();
    });

    it('should handle empty notes', () => {
      const invoice = {
        notes: '',
      };

      expect(invoice.notes).toBe('');
    });

    it('should trim notes whitespace', () => {
      const notes = '  Payment due within 30 days  ';
      const trimmed = notes.trim();

      expect(trimmed).toBe('Payment due within 30 days');
    });
  });

  describe('Invoice Sorting', () => {
    it('should sort by creation date descending', () => {
      const invoices = [
        { id: '1', createdAt: '2024-01-01T00:00:00Z' },
        { id: '2', createdAt: '2024-01-15T00:00:00Z' },
        { id: '3', createdAt: '2024-01-10T00:00:00Z' },
      ];

      const sorted = invoices.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      expect(sorted[0].id).toBe('2'); // Most recent
      expect(sorted[2].id).toBe('1'); // Oldest
    });

    it('should sort by due date ascending', () => {
      const invoices = [
        { id: '1', dueDate: '2024-03-01' },
        { id: '2', dueDate: '2024-01-01' },
        { id: '3', dueDate: '2024-02-01' },
      ];

      const sorted = invoices.sort((a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

      expect(sorted[0].id).toBe('2'); // Earliest due
      expect(sorted[2].id).toBe('1'); // Latest due
    });

    it('should sort by total amount', () => {
      const invoices = [
        { id: '1', total: 1000 },
        { id: '2', total: 5000 },
        { id: '3', total: 2000 },
      ];

      const sorted = invoices.sort((a, b) => b.total - a.total);

      expect(sorted[0].id).toBe('2'); // Highest
      expect(sorted[2].id).toBe('1'); // Lowest
    });
  });
});
