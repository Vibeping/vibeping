import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockQueryBuilder, createMockSupabase } from './setup';

let mockServerSupabase: any;
let mockUserSupabase: any;

vi.mock('../lib/supabase', () => ({
  createServerClient: () => mockServerSupabase,
  createUserClient: (_token: string) => mockUserSupabase,
}));

const { GET } = await import('../app/api/v1/stats/route');

function makeRequest(params: Record<string, string>, headers?: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/v1/stats');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { headers });
}

describe('GET /api/v1/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const projectQB = createMockQueryBuilder({
      data: { id: 'proj-1', user_id: 'user-1' },
      error: null,
    });
    mockUserSupabase = createMockSupabase(projectQB);

    const eventsQB = createMockQueryBuilder({
      data: [
        {
          type: 'pageview',
          name: null,
          url: '/home',
          referrer: 'https://google.com',
          session_id: 's1',
          properties: {},
          created_at: new Date().toISOString(),
        },
        {
          type: 'pageview',
          name: null,
          url: '/about',
          referrer: '(direct)',
          session_id: 's2',
          properties: {},
          created_at: new Date().toISOString(),
        },
        {
          type: 'error',
          name: 'TypeError',
          url: '/home',
          referrer: null,
          session_id: 's1',
          properties: {},
          created_at: new Date().toISOString(),
        },
        {
          type: 'vital',
          name: 'LCP',
          url: '/home',
          referrer: null,
          session_id: 's1',
          properties: { value: 2500 },
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });
    // Make the events query builder resolve without .single() (it uses await on the chain)
    eventsQB.limit = vi.fn().mockReturnValue({
      then: (resolve: any) =>
        resolve({
          data: [
            {
              type: 'pageview',
              name: null,
              url: '/home',
              referrer: 'https://google.com',
              session_id: 's1',
              properties: {},
              created_at: new Date().toISOString(),
            },
            {
              type: 'pageview',
              name: null,
              url: '/about',
              referrer: '(direct)',
              session_id: 's2',
              properties: {},
              created_at: new Date().toISOString(),
            },
            {
              type: 'error',
              name: 'TypeError',
              url: '/home',
              referrer: null,
              session_id: 's1',
              properties: {},
              created_at: new Date().toISOString(),
            },
            {
              type: 'vital',
              name: 'LCP',
              url: '/home',
              referrer: null,
              session_id: 's1',
              properties: { value: 2500 },
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
    });

    mockServerSupabase = { from: vi.fn(() => eventsQB) };
  });

  it('requires project_id', async () => {
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/project_id/);
  });

  it('rejects invalid period', async () => {
    const res = await GET(
      makeRequest({ project_id: 'proj-1', period: 'invalid' }, { Authorization: 'Bearer tok123' })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid period/);
  });

  it('requires authentication', async () => {
    const res = await GET(makeRequest({ project_id: 'proj-1' }));
    expect(res.status).toBe(401);
  });

  it('returns 404 when project not found', async () => {
    const emptyQB = createMockQueryBuilder({ data: null, error: { message: 'not found' } });
    mockUserSupabase = createMockSupabase(emptyQB);

    const res = await GET(
      makeRequest({ project_id: 'bad-id' }, { Authorization: 'Bearer tok123' })
    );
    expect(res.status).toBe(404);
  });

  it('returns aggregated stats', async () => {
    const res = await GET(
      makeRequest({ project_id: 'proj-1', period: '7d' }, { Authorization: 'Bearer tok123' })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.period).toBe('7d');
    expect(json.totalPageviews).toBe(2);
    expect(json.uniqueSessions).toBe(2);
    expect(json.errorCount).toBe(1);
    expect(json.topPages).toHaveLength(2);
    expect(json.topReferrers).toHaveLength(2);
    expect(json.avgVitals).toHaveProperty('LCP', 2500);
    expect(json.totalEvents).toBe(4);
  });
});
