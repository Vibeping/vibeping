import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockQueryBuilder, createMockSupabase } from './setup';

const mockUser = { id: 'user-123', email: 'test@example.com' };
let mockGetUser: any;
let mockSupabase: any;

vi.mock('../lib/auth', () => ({
  getUser: () => mockGetUser(),
  createAuthClient: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}));

const { POST } = await import('../app/api/uptime/checks/route');

function makeRequest(body: any) {
  return new NextRequest('http://localhost/api/uptime/checks', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/uptime/checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn().mockResolvedValue(mockUser);

    const projectQB = createMockQueryBuilder({ data: { id: 'proj-1' }, error: null });
    const insertResult = {
      id: 'check-1',
      url: 'https://example.com',
      project_id: 'proj-1',
      interval_seconds: 60,
      enabled: true,
    };
    const insertQB = createMockQueryBuilder({ data: insertResult, error: null });

    let callCount = 0;
    mockSupabase = {
      from: vi.fn(() => {
        callCount++;
        if (callCount === 1) return projectQB; // project lookup
        return insertQB; // uptime_checks insert
      }),
    };
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser = vi.fn().mockResolvedValue(null);
    const res = await POST(makeRequest({ url: 'https://example.com', project_id: 'proj-1' }));
    expect(res.status).toBe(401);
  });

  it('requires url and project_id', async () => {
    const res = await POST(makeRequest({ url: 'https://example.com' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/required/i);
  });

  it('validates URL format', async () => {
    const res = await POST(makeRequest({ url: 'not-a-url', project_id: 'proj-1' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid URL/i);
  });

  it('returns 404 when project not found', async () => {
    const emptyQB = createMockQueryBuilder({ data: null, error: null });
    mockSupabase = { from: vi.fn(() => emptyQB) };

    const res = await POST(makeRequest({ url: 'https://example.com', project_id: 'bad-id' }));
    expect(res.status).toBe(404);
  });

  it('creates uptime check with 201', async () => {
    const res = await POST(
      makeRequest({ url: 'https://example.com', project_id: 'proj-1' })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.url).toBe('https://example.com');
    expect(json.enabled).toBe(true);
  });
});
