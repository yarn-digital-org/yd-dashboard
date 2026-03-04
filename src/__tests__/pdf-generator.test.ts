import { describe, it, expect } from 'vitest';
import { generateInvoiceHtml, generateContractHtml } from '@/lib/pdf-generator';

describe('PDF Generator', () => {
  describe('generateInvoiceHtml', () => {
    it('should generate valid HTML for an invoice', () => {
      const html = generateInvoiceHtml({
        invoiceNumber: 'INV-001',
        date: '2026-03-01',
        dueDate: '2026-03-31',
        status: 'sent',
        from: { name: 'Yarn Digital', email: 'hello@yarn.com' },
        to: { name: 'Client Corp', email: 'client@corp.com' },
        items: [
          { description: 'Web Development', quantity: 1, rate: 5000, amount: 5000 },
          { description: 'Design', quantity: 2, rate: 1500, amount: 3000 },
        ],
        subtotal: 8000,
        tax: 1600,
        taxRate: 20,
        total: 9600,
        currency: '£',
        notes: 'Payment via bank transfer',
      });

      expect(html).toContain('INV-001');
      expect(html).toContain('Yarn Digital');
      expect(html).toContain('Client Corp');
      expect(html).toContain('Web Development');
      expect(html).toContain('£5000.00');
      expect(html).toContain('£9600.00');
      expect(html).toContain('Payment via bank transfer');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should escape HTML in content', () => {
      const html = generateInvoiceHtml({
        invoiceNumber: '<script>alert("xss")</script>',
        date: '2026-01-01',
        dueDate: '2026-02-01',
        status: 'draft',
        from: { name: 'Test' },
        to: { name: 'Test' },
        items: [],
        subtotal: 0,
        total: 0,
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('generateContractHtml', () => {
    it('should generate valid HTML for a contract', () => {
      const html = generateContractHtml({
        title: 'Service Agreement',
        date: '2026-03-01',
        parties: {
          provider: { name: 'Yarn Digital', address: '123 Main St' },
          client: { name: 'Client Corp', address: '456 Oak Ave' },
        },
        sections: [
          { title: 'Scope of Work', content: 'Development of website' },
          { title: 'Payment Terms', content: '50% upfront, 50% on completion' },
        ],
      });

      expect(html).toContain('Service Agreement');
      expect(html).toContain('Yarn Digital');
      expect(html).toContain('Client Corp');
      expect(html).toContain('Scope of Work');
      expect(html).toContain('Payment Terms');
      expect(html).toContain('Provider Signature');
      expect(html).toContain('Client Signature');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should number sections correctly', () => {
      const html = generateContractHtml({
        title: 'Test',
        date: '2026-01-01',
        parties: {
          provider: { name: 'A' },
          client: { name: 'B' },
        },
        sections: [
          { title: 'First', content: 'Content 1' },
          { title: 'Second', content: 'Content 2' },
          { title: 'Third', content: 'Content 3' },
        ],
      });

      expect(html).toContain('1. First');
      expect(html).toContain('2. Second');
      expect(html).toContain('3. Third');
    });
  });
});
