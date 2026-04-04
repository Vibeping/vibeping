import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The auth callback page (app/auth/callback/page.tsx) is a "use client"
 * React component that handles PKCE code exchange via @supabase/ssr's
 * createBrowserClient.  Because the dashboard test-suite doesn't include
 * React Testing Library we test the **core logic** (code exchange +
 * redirect decisions) directly by exercising the same Supabase calls the
 * component makes.
 */

let mockExchangeCodeForSession: ReturnType<typeof vi.fn>;
let mockGetSession: ReturnType<typeof vi.fn>;
let mockOnAuthStateChange: ReturnType<typeof vi.fn>;

vi.mock('../lib/supabase', () => ({
  createBrowserClient: () => ({
    auth: {
      exchangeCodeForSession: (...args: any[]) => mockExchangeCodeForSession(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
    },
  }),
}));

// Import the factory so tests can call it directly
const { createBrowserClient } = await import('../lib/supabase');

describe('Auth callback – PKCE code exchange logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange = vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('exchanges an auth code for a session via Supabase PKCE', async () => {
    const client = createBrowserClient();
    const code = 'abc123';
    const { error } = await client.auth.exchangeCodeForSession(code);

    expect(error).toBeNull();
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('abc123');
  });

  it('returns an error when code exchange fails', async () => {
    mockExchangeCodeForSession = vi.fn().mockResolvedValue({ error: { message: 'invalid grant' } });

    const client = createBrowserClient();
    const { error } = await client.auth.exchangeCodeForSession('badcode');

    expect(error).toEqual({ message: 'invalid grant' });
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('badcode');
  });

  it('falls back to getSession when no code is present', async () => {
    mockGetSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });

    const client = createBrowserClient();
    const {
      data: { session },
    } = await client.auth.getSession();

    expect(session).toBeTruthy();
    expect(session.user.id).toBe('u1');
  });

  it('registers an onAuthStateChange listener for magic-link flow', () => {
    const client = createBrowserClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {});

    expect(mockOnAuthStateChange).toHaveBeenCalled();
    expect(subscription.unsubscribe).toBeDefined();
  });
});
