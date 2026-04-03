import { vi } from 'vitest';

// Set env vars before any module loads
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// ---- Supabase mock builder ----
// Creates a chainable mock that mimics Supabase's query builder pattern.
export function createMockQueryBuilder(resolvedValue: { data: any; error: any; count?: any }) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    then: vi.fn((resolve: any) => resolve(resolvedValue)),
  };
  // Make builder itself thenable so `await supabase.from('x').select()` works
  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  return builder;
}

export function createMockSupabase(queryBuilder: any) {
  return {
    from: vi.fn(() => queryBuilder),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
  };
}

// ---- Mock next/headers (cookies) ----
const cookieMap = new Map<string, string>();
export const mockCookieStore = {
  get: vi.fn((name: string) => {
    const value = cookieMap.get(name);
    return value ? { name, value } : undefined;
  }),
  set: vi.fn(({ name, value }: { name: string; value: string }) => {
    cookieMap.set(name, value);
  }),
  delete: vi.fn(({ name }: { name: string }) => {
    cookieMap.delete(name);
  }),
};

vi.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));
