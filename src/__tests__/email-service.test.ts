import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendEmail,
  sendWelcomeEmail,
  sendInvoiceSentEmail,
  sendContractSentEmail,
  sendBookingConfirmationEmail,
  sendPasswordResetEmail,
} from '@/lib/email-service';

// Mock Resend
vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({
    data: { id: 'mock-message-id' },
    error: null,
  });

  return {
    Resend: class {
      emails = {
        send: mockSend,
      };
    },
  };
});

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock env vars
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test body</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id');
    });

    it('should return error when RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });

    it('should support multiple recipients', async () => {
      const result = await sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      const result = await sendWelcomeEmail('user@example.com', 'John Doe');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id');
    });
  });

  describe('sendInvoiceSentEmail', () => {
    it('should send invoice email with details', async () => {
      const result = await sendInvoiceSentEmail(
        'client@example.com',
        'INV-001',
        '$500.00',
        '2026-04-01'
      );

      expect(result.success).toBe(true);
    });

    it('should include download URL when provided', async () => {
      const result = await sendInvoiceSentEmail(
        'client@example.com',
        'INV-001',
        '$500.00',
        '2026-04-01',
        'https://example.com/download'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendContractSentEmail', () => {
    it('should send contract notification', async () => {
      const result = await sendContractSentEmail(
        'client@example.com',
        'Jane Smith',
        'Service Agreement 2026'
      );

      expect(result.success).toBe(true);
    });

    it('should include review URL when provided', async () => {
      const result = await sendContractSentEmail(
        'client@example.com',
        'Jane Smith',
        'Service Agreement',
        'https://example.com/review'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendBookingConfirmationEmail', () => {
    it('should send booking confirmation', async () => {
      const result = await sendBookingConfirmationEmail(
        'client@example.com',
        'John Doe',
        'Strategy Meeting',
        '2026-03-15',
        '2:00 PM'
      );

      expect(result.success).toBe(true);
    });

    it('should include location when provided', async () => {
      const result = await sendBookingConfirmationEmail(
        'client@example.com',
        'John Doe',
        'Strategy Meeting',
        '2026-03-15',
        '2:00 PM',
        'Conference Room A'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123'
      );

      expect(result.success).toBe(true);
    });

    it('should include user name when provided', async () => {
      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123',
        'John Doe'
      );

      expect(result.success).toBe(true);
    });
  });
});
