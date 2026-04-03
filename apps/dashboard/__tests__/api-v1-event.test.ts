import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockQueryBuilder, createMockSupabase } from './setup';

// Shared mock references
let mockSupabase: any;
let projectQueryBuilder: any;
let eventsQueryBuilder: any;

vi.mock('../lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}));

// Dynamic import so mocks are in place
const { POST, OPTIONS } = await import('../app/api/v1/event/route');

function makeRequest(body: any, headers?: Record<string, string>) {
  return new NextRequest('http://localhost:3000/api/v1/event', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('POST /api/v1/event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectQueryBuilder = createMockQueryBuilder({
      data: { id: 'proj-123' },
      error: null,
    });
    eventsQueryBuilder = createMockQueryBuilder({ data: null, error: null });

    mockSupabase = createMockSupabase(projectQueryBuilder);
    // Route the `from` call based on table name
    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'projects') return projectQueryBuilder;
      if (table === 'events') return eventsQueryBuilder;
      return projectQueryBuilder;
    });
  });

  it('OPTIONS returns 204 with CORS headers', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('rejects request without api_key', async () => {
    const res = await POST(makeRequest({ events: [{ type: 'pageview' }] }));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toMatch(/api_key/i);
  });

  it('rejects request without events array', async () => {
    const res = await POST(makeRequest({ apiKey: 'test-key' }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/events array/i);
  });

  it('rejects request with empty events array', async () => {
    const res = await POST(makeRequest({ apiKey: 'test-key', events: [] }));
    await res.json();
    expect(res.status).toBe(400);
  });

  it('rejects more than 100 events', async () => {
    const events = Array.from({ length: 101 }, () => ({ type: 'pageview' }));
    const res = await POST(makeRequest({ apiKey: 'test-key', events }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/100/);
  });

  it('returns 401 for invalid API key', async () => {
    projectQueryBuilder.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const res = await POST(makeRequest({ apiKey: 'bad-key', events: [{ type: 'pageview' }] }));
    expect(res.status).toBe(401);
  });

  it('accepts api key from x-api-key header', async () => {
    const res = await POST(
      makeRequest({ events: [{ type: 'pageview', url: '/test' }] }, { 'x-api-key': 'hdr-key' })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.accepted).toBe(1);
    expect(mockSupabase.from).toHaveBeenCalledWith('events');
  });

  it('skips invalid event types and returns 400 if none valid', async () => {
    const res = await POST(makeRequest({ apiKey: 'test-key', events: [{ type: 'INVALID' }] }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/No valid events/);
  });

  it('inserts valid events and returns accepted count', async () => {
    const res = await POST(
      makeRequest({
        apiKey: 'test-key',
        events: [
          { type: 'pageview', url: '/home' },
          { type: 'error', name: 'TypeError' },
          { type: 'GARBAGE' }, // should be skipped
        ],
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.accepted).toBe(2);
    // CORS header present on success
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 500 when insert fails', async () => {
    eventsQueryBuilder = createMockQueryBuilder({ data: null, error: { message: 'db error' } });
    // Override: make insert resolve directly with error (not via .single)
    eventsQueryBuilder.insert = vi.fn(() => ({
      ...eventsQueryBuilder,
      then: vi.fn((resolve: any) => resolve({ data: null, error: { message: 'db error' } })),
    }));
    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'projects') return projectQueryBuilder;
      if (table === 'events') return eventsQueryBuilder;
      return projectQueryBuilder;
    });

    const res = await POST(makeRequest({ apiKey: 'test-key', events: [{ type: 'pageview' }] }));
    expect(res.status).toBe(500);
  });
});
