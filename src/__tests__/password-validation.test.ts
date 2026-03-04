import { describe, it, expect } from 'vitest';
import { validate, passwordSchema, registerSchema } from '@/lib/validation';

describe('Password Validation', () => {
  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      const result = passwordSchema.safeParse('MyPass123');
      expect(result.success).toBe(true);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Ab1cdef');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without uppercase letter', () => {
      const result = passwordSchema.safeParse('mypassword123');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without a number', () => {
      const result = passwordSchema.safeParse('MyPassword');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without lowercase letter', () => {
      const result = passwordSchema.safeParse('MYPASSWORD123');
      expect(result.success).toBe(false);
    });

    it('should accept complex passwords', () => {
      const result = passwordSchema.safeParse('C0mplex!Pass#word');
      expect(result.success).toBe(true);
    });

    it('should reject empty passwords', () => {
      const result = passwordSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject passwords over 128 characters', () => {
      const long = 'A1' + 'a'.repeat(127);
      const result = passwordSchema.safeParse(long);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate a complete registration', () => {
      const result = validate(registerSchema, {
        email: 'user@example.com',
        password: 'SecurePass1',
        name: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should reject registration with weak password', () => {
      const result = validate(registerSchema, {
        email: 'user@example.com',
        password: 'weak',
        name: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should reject registration with invalid email', () => {
      const result = validate(registerSchema, {
        email: 'not-an-email',
        password: 'SecurePass1',
        name: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should allow registration without name', () => {
      const result = validate(registerSchema, {
        email: 'user@example.com',
        password: 'SecurePass1',
      });
      expect(result.success).toBe(true);
    });
  });
});
