import { createClient as _createClient } from '@supabase/supabase-js';
import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';

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
 * Browser-side Supabase client using @supabase/ssr.
 * Stores auth state (including PKCE code verifier) in cookies so the
 * server-side callback route can read them during code exchange.
 * This is critical for OAuth flows — using raw @supabase/supabase-js
 * stores in localStorage which the server can't access.
 */
export function createBrowserClient() {
  return _createBrowserClient(supabaseUrl, supabaseAnonKey);
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
