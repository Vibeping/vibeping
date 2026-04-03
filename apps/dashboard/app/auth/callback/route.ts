import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'magiclink' | 'signup' | 'recovery' | 'email' | null;
  const next = searchParams.get('next') ?? '/';

  // Debug: log what params we're receiving
  console.log('[auth/callback] params:', {
    code: code ? `${code.substring(0, 10)}...` : null,
    token_hash: token_hash ? `${token_hash.substring(0, 10)}...` : null,
    type,
    allParams: Object.fromEntries(searchParams.entries()),
  });

  if (!code && !token_hash) {
    console.error('[auth/callback] No code or token_hash — redirecting to login');
    return NextResponse.redirect(new URL('/login?error=auth', origin));
  }

  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  let error: Error | null = null;

  if (token_hash && type) {
    // Magic link / email OTP flow — verify directly with token hash
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    error = verifyError;
  } else if (code) {
    // PKCE OAuth / code exchange flow
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    error = exchangeError;
  }

  if (error) {
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(new URL('/login?error=auth', origin));
  }

  return response;
}
