// Test setup file
import { vi } from 'vitest';

// Mock Next.js headers/cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn().mockReturnValue({ value: 'mock-token' }),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Map(),
}));
