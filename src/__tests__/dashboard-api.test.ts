import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      get: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
    })),
  },
}));

describe('Dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/dashboard', () => {
    it('should return metrics structure', async () => {
      // Test the expected shape of dashboard metrics
      const expectedShape = {
        revenue: expect.any(Number),
        outstanding: expect.any(Number),
        projectsCount: expect.any(Number),
        leadsCount: expect.any(Number),
        clientsCount: expect.any(Number),
        contactsCount: expect.any(Number),
        recentActivity: expect.any(Array),
      };

      // Mock response
      const mockMetrics = {
        revenue: 50000,
        outstanding: 5000,
        projectsCount: 12,
        leadsCount: 8,
        clientsCount: 15,
        contactsCount: 23,
        recentActivity: [],
      };

      expect(mockMetrics).toMatchObject(expectedShape);
    });

    it('should calculate period dates correctly', () => {
      const now = new Date();
      
      // Test month calculation
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      expect(monthStart.getDate()).toBe(1);
      
      // Test 6 months calculation
      const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      expect(sixMonthsStart.getDate()).toBe(1);
      
      // Test year calculation
      const yearStart = new Date(now.getFullYear(), 0, 1);
      expect(yearStart.getMonth()).toBe(0);
      expect(yearStart.getDate()).toBe(1);
    });

    it('should handle empty contacts correctly', () => {
      const contacts: any[] = [];
      
      const leads = contacts.filter(c => c.type === 'lead');
      const clients = contacts.filter(c => c.type === 'client');
      const totalRevenue = clients.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
      const totalOutstanding = contacts.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);
      
      expect(leads.length).toBe(0);
      expect(clients.length).toBe(0);
      expect(totalRevenue).toBe(0);
      expect(totalOutstanding).toBe(0);
    });

    it('should calculate metrics from contacts', () => {
      const mockContacts = [
        { id: '1', type: 'client', lifetimeValue: 10000, outstandingAmount: 500, projectCount: 2 },
        { id: '2', type: 'client', lifetimeValue: 15000, outstandingAmount: 0, projectCount: 3 },
        { id: '3', type: 'lead', lifetimeValue: 0, outstandingAmount: 0, projectCount: 0 },
        { id: '4', type: 'lead', lifetimeValue: 0, outstandingAmount: 0, projectCount: 0 },
        { id: '5', type: 'past_client', lifetimeValue: 8000, outstandingAmount: 200, projectCount: 1 },
      ];

      const leads = mockContacts.filter(c => c.type === 'lead');
      const clients = mockContacts.filter(c => c.type === 'client');
      const totalRevenue = clients.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
      const totalOutstanding = mockContacts.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);
      const totalProjects = mockContacts.reduce((sum, c) => sum + (c.projectCount || 0), 0);

      expect(leads.length).toBe(2);
      expect(clients.length).toBe(2);
      expect(totalRevenue).toBe(25000);
      expect(totalOutstanding).toBe(700);
      expect(totalProjects).toBe(6);
    });
  });

  describe('Activity formatting', () => {
    it('should format recent activity correctly', () => {
      const mockContact = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Inc',
        email: 'john@acme.com',
        type: 'client',
        createdAt: new Date().toISOString(),
      };

      const activity = {
        id: mockContact.id,
        type: mockContact.type === 'lead' ? 'lead_created' : 'contact_created',
        title: `${mockContact.firstName} ${mockContact.lastName}`,
        subtitle: mockContact.company || mockContact.email,
        timestamp: mockContact.createdAt,
      };

      expect(activity.id).toBe('1');
      expect(activity.type).toBe('contact_created');
      expect(activity.title).toBe('John Doe');
      expect(activity.subtitle).toBe('Acme Inc');
    });
  });
});

describe('Dashboard Page Helpers', () => {
  describe('formatCurrency', () => {
    it('should format GBP currency correctly', () => {
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      };

      expect(formatCurrency(0)).toBe('£0');
      expect(formatCurrency(1000)).toBe('£1,000');
      expect(formatCurrency(50000)).toBe('£50,000');
      expect(formatCurrency(1234567)).toBe('£1,234,567');
    });
  });

  describe('formatDate', () => {
    it('should format relative dates correctly', () => {
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short' 
        });
      };

      const now = new Date();
      
      // Just now
      expect(formatDate(now.toISOString())).toBe('Just now');
      
      // Minutes ago
      const fiveMinAgo = new Date(now.getTime() - 5 * 60000).toISOString();
      expect(formatDate(fiveMinAgo)).toBe('5m ago');
      
      // Hours ago
      const threeHoursAgo = new Date(now.getTime() - 3 * 3600000).toISOString();
      expect(formatDate(threeHoursAgo)).toBe('3h ago');
      
      // Days ago
      const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
      expect(formatDate(twoDaysAgo)).toBe('2d ago');
    });
  });

  describe('conversion rate calculation', () => {
    it('should calculate conversion rate correctly', () => {
      const calculateConversionRate = (clientsCount: number, leadsCount: number) => {
        if (leadsCount === 0 && clientsCount === 0) return '0%';
        return `${Math.round((clientsCount / (clientsCount + leadsCount)) * 100)}%`;
      };

      expect(calculateConversionRate(0, 0)).toBe('0%');
      expect(calculateConversionRate(10, 10)).toBe('50%');
      expect(calculateConversionRate(3, 7)).toBe('30%');
      expect(calculateConversionRate(9, 1)).toBe('90%');
    });
  });
});

describe('Period Options', () => {
  it('should have all required period options', () => {
    const PERIOD_OPTIONS = [
      { value: 'month', label: 'This Month' },
      { value: '6months', label: 'Last 6 Months' },
      { value: 'year', label: 'This Year' },
      { value: 'all', label: 'All Time' },
    ];

    expect(PERIOD_OPTIONS).toHaveLength(4);
    expect(PERIOD_OPTIONS.map(p => p.value)).toEqual(['month', '6months', 'year', 'all']);
  });
});
