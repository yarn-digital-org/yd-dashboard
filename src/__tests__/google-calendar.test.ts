import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserCalendarTokens, getValidAccessToken } from '@/lib/google-calendar-user';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                expiresAt: Date.now() + 3600000, // 1 hour from now
                email: 'test@example.com',
              }),
            }),
            update: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('Google Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  });

  describe('getUserCalendarTokens', () => {
    it('should retrieve user calendar tokens', async () => {
      const tokens = await getUserCalendarTokens('user-123');

      expect(tokens).toBeDefined();
      expect(tokens?.accessToken).toBe('mock-access-token');
      expect(tokens?.refreshToken).toBe('mock-refresh-token');
      expect(tokens?.email).toBe('test@example.com');
    });
  });

  describe('getValidAccessToken', () => {
    it('should return valid access token if not expired', async () => {
      const accessToken = await getValidAccessToken('user-123');

      expect(accessToken).toBe('mock-access-token');
    });

    it('should throw error if tokens not found', async () => {
      // Mock empty response
      const { adminDb } = await import('@/lib/firebase-admin');
      vi.mocked(adminDb.collection).mockReturnValueOnce({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({
                exists: false,
              }),
            })),
          })),
        })),
      } as any);

      await expect(getValidAccessToken('user-123')).rejects.toThrow(
        'Google Calendar not connected'
      );
    });
  });
});
