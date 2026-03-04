import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Legal Pages', () => {
  describe('Terms of Service', () => {
    const termsPath = resolve(process.cwd(), 'src/app/terms/page.tsx');

    it('should have a terms page', () => {
      expect(existsSync(termsPath)).toBe(true);
    });

    it('should contain key legal sections', () => {
      const content = readFileSync(termsPath, 'utf-8');
      expect(content).toContain('Terms of Service');
      expect(content).toContain('Acceptance of Terms');
      expect(content).toContain('Acceptable Use');
      expect(content).toContain('Data Ownership');
      expect(content).toContain('Limitation of Liability');
      expect(content).toContain('Termination');
      expect(content).toContain('Governing Law');
    });

    it('should link to privacy policy', () => {
      const content = readFileSync(termsPath, 'utf-8');
      expect(content).toContain('/privacy');
    });
  });

  describe('Privacy Policy', () => {
    const privacyPath = resolve(process.cwd(), 'src/app/privacy/page.tsx');

    it('should have a privacy page', () => {
      expect(existsSync(privacyPath)).toBe(true);
    });

    it('should contain GDPR-required sections', () => {
      const content = readFileSync(privacyPath, 'utf-8');
      expect(content).toContain('Privacy Policy');
      expect(content).toContain('Data Controller');
      expect(content).toContain('Data We Collect');
      expect(content).toContain('Legal Basis for Processing');
      expect(content).toContain('Your Rights');
      expect(content).toContain('Data Retention');
      expect(content).toContain('Cookies');
    });

    it('should mention GDPR compliance', () => {
      const content = readFileSync(privacyPath, 'utf-8');
      expect(content).toContain('UK GDPR');
      expect(content).toContain('Data Protection Act 2018');
    });

    it('should mention right to be forgotten', () => {
      const content = readFileSync(privacyPath, 'utf-8');
      expect(content).toContain('right to be forgotten');
    });

    it('should mention ICO for complaints', () => {
      const content = readFileSync(privacyPath, 'utf-8');
      expect(content).toContain('ico.org.uk');
    });

    it('should link to terms', () => {
      const content = readFileSync(privacyPath, 'utf-8');
      expect(content).toContain('/terms');
    });
  });

  describe('Cookie Consent', () => {
    const cookieConsentPath = resolve(process.cwd(), 'src/components/CookieConsent.tsx');

    it('should have a cookie consent component', () => {
      expect(existsSync(cookieConsentPath)).toBe(true);
    });

    it('should have accept and decline options', () => {
      const content = readFileSync(cookieConsentPath, 'utf-8');
      expect(content).toContain('Accept');
      expect(content).toContain('Decline');
    });

    it('should link to privacy policy', () => {
      const content = readFileSync(cookieConsentPath, 'utf-8');
      expect(content).toContain('/privacy');
    });
  });

  describe('Registration page', () => {
    const registerPath = resolve(process.cwd(), 'src/app/register/page.tsx');

    it('should link to terms and privacy', () => {
      const content = readFileSync(registerPath, 'utf-8');
      expect(content).toContain('/terms');
      expect(content).toContain('/privacy');
    });
  });
});
