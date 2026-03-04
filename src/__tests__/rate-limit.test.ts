import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  recordFailedLogin,
  isAccountLocked,
  recordSuccessfulLogin,
  getClientIp,
} from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const ip = `test-${Date.now()}-1`;
      const result = checkRateLimit(ip, 5, 60000);
      expect(result.allowed).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const ip = `test-${Date.now()}-2`;
      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(ip, 5, 60000);
        expect(result.allowed).toBe(true);
      }
      // 6th should be blocked
      const blocked = checkRateLimit(ip, 5, 60000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });

    it('should reset after window expires', async () => {
      const ip = `test-${Date.now()}-3`;
      // Very short window
      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip, 3, 50); // 50ms window
      }
      // Should be blocked
      expect(checkRateLimit(ip, 3, 50).allowed).toBe(false);
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      // Should be allowed again
      const result = checkRateLimit(ip, 3, 50);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Account Lockout', () => {
    it('should not lock on first failed attempt', () => {
      const email = `lock-test-${Date.now()}@example.com`;
      recordFailedLogin(email);
      const result = isAccountLocked(email);
      expect(result.locked).toBe(false);
    });

    it('should lock after 5 failed attempts', () => {
      const email = `lock-test-5-${Date.now()}@example.com`;
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(email);
      }
      const result = isAccountLocked(email);
      expect(result.locked).toBe(true);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('should not lock after only 4 failed attempts', () => {
      const email = `lock-test-4-${Date.now()}@example.com`;
      for (let i = 0; i < 4; i++) {
        recordFailedLogin(email);
      }
      const result = isAccountLocked(email);
      expect(result.locked).toBe(false);
    });

    it('should clear lockout on successful login', () => {
      const email = `lock-clear-${Date.now()}@example.com`;
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(email);
      }
      expect(isAccountLocked(email).locked).toBe(true);
      
      recordSuccessfulLogin(email);
      expect(isAccountLocked(email).locked).toBe(false);
    });

    it('should normalize email for lockout', () => {
      const email = `LOCKTEST-${Date.now()}@Example.COM`;
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(email);
      }
      const result = isAccountLocked(email.toLowerCase());
      expect(result.locked).toBe(true);
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      });
      expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('should extract IP from x-real-ip', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '9.8.7.6' },
      });
      expect(getClientIp(req)).toBe('9.8.7.6');
    });

    it('should return unknown when no IP headers', () => {
      const req = new Request('http://localhost');
      expect(getClientIp(req)).toBe('unknown');
    });
  });
});
