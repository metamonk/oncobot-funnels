import { vi } from 'vitest';

// Set up environment variables
process.env.NEXT_PUBLIC_STARTER_TIER = 'test';
// Use defineProperty to set NODE_ENV in test environment
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
  configurable: true
});

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