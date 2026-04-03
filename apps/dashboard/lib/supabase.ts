import { createClient as _createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client with service role privileges.
 * Use this in API routes and server components that need full access.
 * NEVER expose the service role key to the browser.
 */
export function createServerClient() {
  return _createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Browser-side Supabase client with anon key.
 * Uses the public anon key — safe to expose in client bundles.
 * RLS policies protect data access.
 * PKCE flow ensures OAuth redirects use ?code= (server-exchangeable)
 * instead of #access_token= (implicit, client-only).
 */
export function createBrowserClient() {
  return _createClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: 'pkce' },
  });
}

/**
 * Create a Supabase client authenticated with a user's JWT.
 * Use this to make requests on behalf of the logged-in user.
 */
export function createUserClient(accessToken: string) {
  return _createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: { persistSession: false },
  });
}
