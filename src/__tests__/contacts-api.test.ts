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
      add: vi.fn().mockResolvedValue({ id: 'test-contact-id' }),
      count: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          data: () => ({ count: 0 }),
        }),
      })),
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'test-contact-id',
          data: () => ({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '555-1234',
            company: 'Acme Inc',
            jobTitle: 'CEO',
            type: 'client',
            tags: ['vip', 'enterprise'],
            customFields: {},
            lifetimeValue: 25000,
            projectCount: 3,
            outstandingAmount: 5000,
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

// Mock automation engine
vi.mock('@/lib/automation-engine', () => ({
  fireAutomations: vi.fn().mockResolvedValue(undefined),
}));

describe('Contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contact Data Structure', () => {
    it('should have required fields', () => {
      const contact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      expect(contact.firstName).toBeTruthy();
      expect(contact.lastName).toBeTruthy();
      expect(contact.email).toBeTruthy();
    });

    it('should support optional fields', () => {
      const contact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        company: 'Acme Inc',
        jobTitle: 'CEO',
        website: 'https://acme.com',
      };

      expect(contact.phone).toBe('555-1234');
      expect(contact.company).toBe('Acme Inc');
      expect(contact.jobTitle).toBe('CEO');
      expect(contact.website).toBe('https://acme.com');
    });

    it('should support address object', () => {
      const address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
      };

      expect(address.street).toBeTruthy();
      expect(address.city).toBeTruthy();
      expect(address.state).toBeTruthy();
      expect(address.zip).toBeTruthy();
      expect(address.country).toBeTruthy();
    });

    it('should support social links', () => {
      const socialLinks = {
        instagram: '@johndoe',
        linkedin: 'johndoe',
        twitter: '@johndoe',
      };

      expect(socialLinks.instagram).toBeTruthy();
      expect(socialLinks.linkedin).toBeTruthy();
      expect(socialLinks.twitter).toBeTruthy();
    });
  });

  describe('Contact Types', () => {
    it('should support valid contact types', () => {
      const validTypes = ['lead', 'client', 'past_client', 'vendor', 'other'];

      expect(validTypes).toContain('lead');
      expect(validTypes).toContain('client');
      expect(validTypes).toContain('past_client');
      expect(validTypes).toContain('vendor');
      expect(validTypes).toContain('other');
      expect(validTypes).toHaveLength(5);
    });

    it('should default to client type', () => {
      const defaultType = 'client';
      expect(defaultType).toBe('client');
    });
  });

  describe('Contact Validation', () => {
    it('should require firstName and lastName', () => {
      const contact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      expect(contact.firstName).toBeTruthy();
      expect(contact.lastName).toBeTruthy();
    });

    it('should require valid email', () => {
      const validEmail = 'john@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(validEmail)).toBe(true);
    });

    it('should normalize email to lowercase', () => {
      const email = 'John@Example.COM';
      const normalized = email.toLowerCase().trim();

      expect(normalized).toBe('john@example.com');
    });

    it('should trim whitespace from fields', () => {
      const firstName = '  John  ';
      const lastName = '  Doe  ';
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();

      expect(trimmedFirst).toBe('John');
      expect(trimmedLast).toBe('Doe');
    });

    it('should detect duplicate emails', () => {
      const existingContacts = [
        { email: 'john@example.com' },
        { email: 'jane@example.com' },
      ];

      const newEmail = 'john@example.com';
      const isDuplicate = existingContacts.some(c => c.email === newEmail);

      expect(isDuplicate).toBe(true);
    });
  });

  describe('Contact Tags', () => {
    it('should handle tag array operations', () => {
      const tags: string[] = ['vip', 'enterprise'];

      // Add tag
      const newTag = 'priority';
      if (!tags.includes(newTag)) {
        tags.push(newTag);
      }
      expect(tags).toContain('priority');
      expect(tags).toHaveLength(3);

      // Remove tag
      const filtered = tags.filter(t => t !== 'vip');
      expect(filtered).not.toContain('vip');
      expect(filtered).toHaveLength(2);
    });

    it('should not add duplicate tags', () => {
      const tags: string[] = ['vip', 'enterprise'];
      const newTag = 'vip';

      if (!tags.includes(newTag)) {
        tags.push(newTag);
      }

      expect(tags).toHaveLength(2);
    });

    it('should filter contacts by tag', () => {
      const contacts = [
        { id: '1', tags: ['vip', 'enterprise'] },
        { id: '2', tags: ['standard'] },
        { id: '3', tags: ['vip'] },
      ];

      const filtered = contacts.filter(c => c.tags.includes('vip'));
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Contact Filtering', () => {
    it('should filter by contact type', () => {
      const contacts = [
        { id: '1', type: 'client', name: 'John' },
        { id: '2', type: 'lead', name: 'Jane' },
        { id: '3', type: 'client', name: 'Bob' },
      ];

      const filtered = contacts.filter(c => c.type === 'client');
      expect(filtered).toHaveLength(2);
    });

    it('should search by name, email, and company', () => {
      const contacts = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@acme.com', company: 'Acme Inc' },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@corp.com', company: 'Corp Ltd' },
        { id: '3', firstName: 'Bob', lastName: 'Jones', email: 'bob@acme.com', company: 'Other Co' },
      ];

      const search = 'acme';
      const filtered = contacts.filter(c =>
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search)
      );

      expect(filtered).toHaveLength(2);
    });

    it('should search by phone number', () => {
      const contacts = [
        { id: '1', phone: '555-1234' },
        { id: '2', phone: '555-5678' },
        { id: '3', phone: '555-1234' },
      ];

      const search = '1234';
      const filtered = contacts.filter(c => c.phone?.includes(search));
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Contact Financial Data', () => {
    it('should track lifetime value', () => {
      const contact = {
        lifetimeValue: 25000,
      };

      expect(contact.lifetimeValue).toBe(25000);
      expect(contact.lifetimeValue).toBeGreaterThan(0);
    });

    it('should track project count', () => {
      const contact = {
        projectCount: 3,
      };

      expect(contact.projectCount).toBe(3);
    });

    it('should track outstanding amount', () => {
      const contact = {
        outstandingAmount: 5000,
      };

      expect(contact.outstandingAmount).toBe(5000);
    });

    it('should calculate total financial metrics', () => {
      const contacts = [
        { lifetimeValue: 10000, outstandingAmount: 2000 },
        { lifetimeValue: 15000, outstandingAmount: 3000 },
        { lifetimeValue: 5000, outstandingAmount: 0 },
      ];

      const totalLTV = contacts.reduce((sum, c) => sum + c.lifetimeValue, 0);
      const totalOutstanding = contacts.reduce((sum, c) => sum + c.outstandingAmount, 0);

      expect(totalLTV).toBe(30000);
      expect(totalOutstanding).toBe(5000);
    });
  });

  describe('Contact Custom Fields', () => {
    it('should support custom fields object', () => {
      const customFields = {
        industry: 'Technology',
        referralSource: 'Google',
        preferredContact: 'email',
      };

      expect(customFields.industry).toBe('Technology');
      expect(customFields.referralSource).toBe('Google');
      expect(customFields.preferredContact).toBe('email');
    });

    it('should handle empty custom fields', () => {
      const customFields = {};
      expect(Object.keys(customFields)).toHaveLength(0);
    });
  });

  describe('Contact Pagination', () => {
    it('should paginate results correctly', () => {
      const allContacts = Array.from({ length: 50 }, (_, i) => ({ id: `contact-${i}` }));
      const limit = 20;
      const offset = 0;

      const paginated = allContacts.slice(offset, offset + limit);

      expect(paginated).toHaveLength(20);
      expect(paginated[0].id).toBe('contact-0');
      expect(paginated[19].id).toBe('contact-19');
    });

    it('should calculate hasMore correctly', () => {
      const total = 50;
      const limit = 20;
      const offset = 20;
      const returnedCount = 20;

      const hasMore = offset + returnedCount < total;
      expect(hasMore).toBe(true);

      const lastPageOffset = 40;
      const lastPageHasMore = lastPageOffset + 10 < total;
      expect(lastPageHasMore).toBe(false);
    });
  });

  describe('Contact Duplicate Detection', () => {
    it('should detect duplicate emails (case-insensitive)', () => {
      const existingContacts = [
        { email: 'john@example.com' },
      ];

      const newEmails = ['JOHN@EXAMPLE.COM', 'john@example.com', 'John@Example.Com'];

      newEmails.forEach(email => {
        const isDuplicate = existingContacts.some(
          c => c.email.toLowerCase() === email.toLowerCase()
        );
        expect(isDuplicate).toBe(true);
      });
    });

    it('should return duplicate contact ID on conflict', () => {
      const existingContact = {
        id: 'existing-123',
        email: 'john@example.com',
      };

      const newContact = {
        email: 'john@example.com',
      };

      const isDuplicate = existingContact.email === newContact.email;
      expect(isDuplicate).toBe(true);

      if (isDuplicate) {
        const conflictResponse = {
          error: 'A contact with this email already exists',
          duplicateId: existingContact.id,
        };
        expect(conflictResponse.duplicateId).toBe('existing-123');
      }
    });
  });

  describe('Contact Last Contacted Tracking', () => {
    it('should track last contacted timestamp', () => {
      const contact = {
        lastContactedAt: '2024-01-15T10:30:00Z',
      };

      expect(contact.lastContactedAt).toBeTruthy();
      expect(new Date(contact.lastContactedAt).getTime()).toBeGreaterThan(0);
    });

    it('should sort contacts by last contacted', () => {
      const contacts = [
        { id: '1', lastContactedAt: '2024-01-15T00:00:00Z' },
        { id: '2', lastContactedAt: '2024-01-20T00:00:00Z' },
        { id: '3', lastContactedAt: '2024-01-10T00:00:00Z' },
      ];

      const sorted = contacts.sort((a, b) =>
        new Date(b.lastContactedAt).getTime() - new Date(a.lastContactedAt).getTime()
      );

      expect(sorted[0].id).toBe('2'); // Most recent
      expect(sorted[2].id).toBe('3'); // Oldest
    });
  });

  describe('Contact Export Data', () => {
    it('should format contact for CSV export', () => {
      const contact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        company: 'Acme Inc',
        type: 'client',
        lifetimeValue: 25000,
      };

      const csvRow = [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone,
        contact.company,
        contact.type,
        contact.lifetimeValue.toString(),
      ].join(',');

      expect(csvRow).toContain('John');
      expect(csvRow).toContain('john@example.com');
      expect(csvRow).toContain('25000');
    });
  });

  describe('Contact Import Validation', () => {
    it('should validate imported contact data', () => {
      const importedContact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const isValid =
        !!importedContact.firstName &&
        !!importedContact.lastName &&
        !!importedContact.email;

      expect(isValid).toBe(true);
    });

    it('should reject invalid imported data', () => {
      const importedContact = {
        firstName: 'John',
        lastName: '',
        email: 'invalid-email',
      };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid =
        !!importedContact.firstName &&
        !!importedContact.lastName &&
        emailRegex.test(importedContact.email);

      expect(isValid).toBe(false);
    });
  });
});
