import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnvironment } from '@/lib/env-validation';

describe('Environment Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set minimal valid env
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.FIREBASE_CREDENTIALS_BASE64 = 'dGVzdA==';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should pass with valid required env vars', () => {
    const result = validateEnvironment();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('JWT_SECRET'))).toBe(true);
  });

  it('should fail when JWT_SECRET is too short', () => {
    process.env.JWT_SECRET = 'short';
    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('32 characters'))).toBe(true);
  });

  it('should fail when Firebase credentials are missing', () => {
    delete process.env.FIREBASE_CREDENTIALS_BASE64;
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Firebase'))).toBe(true);
  });

  it('should accept FIREBASE_SERVICE_ACCOUNT as alternative', () => {
    delete process.env.FIREBASE_CREDENTIALS_BASE64;
    process.env.FIREBASE_SERVICE_ACCOUNT = '{"type":"service_account"}';
    const result = validateEnvironment();
    expect(result.valid).toBe(true);
  });

  it('should warn when RESEND_API_KEY is not set', () => {
    delete process.env.RESEND_API_KEY;
    const result = validateEnvironment();
    expect(result.warnings.some(w => w.includes('RESEND_API_KEY'))).toBe(true);
  });

  it('should warn when RESEND_API_KEY is placeholder', () => {
    process.env.RESEND_API_KEY = 'your_resend_api_key';
    const result = validateEnvironment();
    expect(result.warnings.some(w => w.includes('RESEND_API_KEY'))).toBe(true);
  });

  it('should warn when Google OAuth is not configured', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const result = validateEnvironment();
    expect(result.warnings.some(w => w.includes('GOOGLE_CLIENT_ID'))).toBe(true);
  });
});
