'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function handleAuth() {
      // Check for OAuth code in query params (GitHub login)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        // PKCE OAuth flow — exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[auth/callback] Code exchange error:', error.message);
          setError(error.message);
          setTimeout(() => router.replace('/login?error=auth'), 2000);
          return;
        }
        router.replace('/');
        return;
      }

      // Magic link flow — Supabase client auto-detects hash fragment params
      // and processes them on initialization. Listen for the auth state change.
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          router.replace('/');
        }
      });

      // Fallback: check if session was already established
      await new Promise((r) => setTimeout(r, 1000));
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        subscription.unsubscribe();
        router.replace('/');
        return;
      }

      // Still no session — check hash for error params
      const hash = window.location.hash;
      if (hash.includes('error')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const errorDesc = hashParams.get('error_description') || 'Authentication failed';
        console.error('[auth/callback] Hash error:', errorDesc);
        setError(errorDesc);
        setTimeout(() => router.replace('/login?error=auth'), 2000);
        return;
      }

      // Wait a bit longer before giving up — magic link can be slow
      await new Promise((r) => setTimeout(r, 2000));
      const {
        data: { session: retrySession },
      } = await supabase.auth.getSession();
      if (retrySession) {
        subscription.unsubscribe();
        router.replace('/');
      } else {
        console.error('[auth/callback] No session after retries. URL:', window.location.href);
        setError('Could not complete sign in');
        setTimeout(() => router.replace('/login?error=auth'), 2000);
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🏓</div>
        {error ? (
          <>
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <p className="text-white text-lg font-medium">Signing you in...</p>
            <p className="text-slate-400 text-sm mt-2">Hang tight</p>
          </>
        )}
      </div>
    </div>
  );
}
