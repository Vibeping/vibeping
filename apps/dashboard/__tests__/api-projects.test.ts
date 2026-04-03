import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockQueryBuilder, createMockSupabase } from './setup';

const mockUser = { id: 'user-123', email: 'test@example.com' };
let mockGetUser: ReturnType<typeof vi.fn>;
let mockSupabase: any;

vi.mock('../lib/auth', () => ({
  getUser: () => mockGetUser(),
  createAuthClient: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}));

const { GET, POST, PATCH, DELETE: DELETE_handler } = await import('../app/api/projects/route');

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn().mockResolvedValue(mockUser);
    const projects = [
      { id: 'p1', name: 'Site A', url: 'https://a.com', api_key: 'vp_abc', created_at: '2024-01-01' },
    ];
    const projectsQB = createMockQueryBuilder({ data: projects, error: null });
    // Make the chained query resolve to the list (no .single())
    projectsQB.order = vi.fn().mockReturnValue({
      then: (resolve: any) => resolve({ data: projects, error: null }),
    });
    const countQB = createMockQueryBuilder({ data: null, error: null, count: 42 });
    countQB.select = vi.fn().mockReturnValue(countQB);
    countQB.eq = vi.fn().mockReturnValue({
      then: (resolve: any) => resolve({ count: 42 }),
    });

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'events') return countQB;
        return projectsQB;
      }),
    };
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser = vi.fn().mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns projects with event counts', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.projects).toHaveLength(1);
    expect(json.projects[0].name).toBe('Site A');
    expect(json.projects[0].event_count).toBe(42);
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn().mockResolvedValue(mockUser);
    const newProject = { id: 'p2', name: 'New Site', url: null, api_key: 'vp_xyz', created_at: '2024-01-02' };
    const insertQB = createMockQueryBuilder({ data: newProject, error: null });
    mockSupabase = createMockSupabase(insertQB);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser = vi.fn().mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('requires project name', async () => {
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/name/i);
  });

  it('creates a project with 201', async () => {
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Site', url: 'https://new.com' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.project).toBeDefined();
    expect(json.project.name).toBe('New Site');
  });
});

describe('PATCH /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn().mockResolvedValue(mockUser);
    const existing = { id: 'p1' };
    const existingQB = createMockQueryBuilder({ data: existing, error: null });
    const updatedProject = { id: 'p1', name: 'Updated', url: 'https://u.com', api_key: 'vp_abc', created_at: '2024-01-01' };
    const updateQB = createMockQueryBuilder({ data: updatedProject, error: null });

    // Need to differentiate between select (ownership check) and update
    let callCount = 0;
    const smartQB: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue(updateQB),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 1) return Promise.resolve({ data: existing, error: null });
        return Promise.resolve({ data: updatedProject, error: null });
      }),
    };
    mockSupabase = { from: vi.fn(() => smartQB) };
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser = vi.fn().mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'p1', name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('requires project ID', async () => {
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/ID/i);
  });

  it('returns 404 for non-existent project', async () => {
    const emptyQB = createMockQueryBuilder({ data: null, error: null });
    mockSupabase = { from: vi.fn(() => emptyQB) };

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'nonexistent', name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn().mockResolvedValue(mockUser);
    const existing = { id: 'p1' };
    const qb = createMockQueryBuilder({ data: existing, error: null });
    // delete().eq() needs to resolve
    qb.delete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: (resolve: any) => resolve({ error: null }),
        }),
        then: (resolve: any) => resolve({ error: null }),
      }),
    });
    mockSupabase = { from: vi.fn(() => qb) };
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser = vi.fn().mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/projects?id=p1', { method: 'DELETE' });
    const res = await DELETE_handler(req);
    expect(res.status).toBe(401);
  });

  it('requires project ID', async () => {
    const req = new NextRequest('http://localhost/api/projects', { method: 'DELETE' });
    const res = await DELETE_handler(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent project', async () => {
    const emptyQB = createMockQueryBuilder({ data: null, error: null });
    emptyQB.delete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        then: (resolve: any) => resolve({ error: null }),
      }),
    });
    mockSupabase = { from: vi.fn(() => emptyQB) };

    const req = new NextRequest('http://localhost/api/projects?id=bad', { method: 'DELETE' });
    const res = await DELETE_handler(req);
    expect(res.status).toBe(404);
  });

  it('deletes project successfully', async () => {
    const req = new NextRequest('http://localhost/api/projects?id=p1', { method: 'DELETE' });
    const res = await DELETE_handler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
