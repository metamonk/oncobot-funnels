import { vi } from 'vitest';

// Set up environment variables
process.env.NEXT_PUBLIC_STARTER_TIER = 'test';
process.env.NODE_ENV = 'test';

// Mock Next.js specific modules
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock auth modules
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  betterAuth: {
    api: {},
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  getUser: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      userHealthProfile: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      healthProfileResponse: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));