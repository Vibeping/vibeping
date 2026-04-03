import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockExchangeCodeForSession: ReturnType<typeof vi.fn>;

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession: (...args: any[]) => mockExchangeCodeForSession(...args),
    },
  }),
}));

const { GET } = await import('../app/auth/callback/route');

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
  });

  it('redirects to /login when no code is provided', async () => {
    const req = new NextRequest('http://localhost:3000/auth/callback');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('/login');
  });

  it('exchanges code and redirects to / on success', async () => {
    const req = new NextRequest('http://localhost:3000/auth/callback?code=abc123');
    const res = await GET(req);
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('abc123');
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('/');
    expect(res.headers.get('Location')).not.toContain('/login');
  });

  it('redirects to custom next path', async () => {
    const req = new NextRequest('http://localhost:3000/auth/callback?code=abc123&next=/dashboard');
    const res = await GET(req);
    expect(res.headers.get('Location')).toContain('/dashboard');
  });

  it('redirects to /login when code exchange fails', async () => {
    mockExchangeCodeForSession = vi.fn().mockResolvedValue({ error: { message: 'invalid' } });
    const req = new NextRequest('http://localhost:3000/auth/callback?code=badcode');
    const res = await GET(req);
    expect(res.headers.get('Location')).toContain('/login');
  });
});
