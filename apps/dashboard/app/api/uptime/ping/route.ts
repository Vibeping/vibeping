import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for Vercel serverless

async function pingUrl(
  url: string,
  timeoutMs = 5000
): Promise<{
  status_code: number | null;
  response_time_ms: number;
  is_up: boolean;
  error: string | null;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'VibePing-Uptime/1.0' },
    });
    const response_time_ms = Date.now() - start;
    const is_up = res.status >= 200 && res.status < 400;
    return {
      status_code: res.status,
      response_time_ms,
      is_up,
      error: is_up ? null : `HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    const response_time_ms = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status_code: null,
      response_time_ms,
      is_up: false,
      error: message.includes('abort') ? `Timeout after ${timeoutMs}ms` : message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const rl = rateLimit(`uptime-ping:${clientIp}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
          ...getRateLimitHeaders(rl.remaining, rl.reset),
        },
      }
    );
  }

  // Auth check: compare secret query param against env var
  const cronSecret = process.env.UPTIME_CRON_SECRET;
  if (cronSecret) {
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServerClient();

  // Fetch all enabled uptime checks
  const { data: checks, error: fetchError } = await supabase
    .from('uptime_checks')
    .select('id, url')
    .eq('enabled', true);

  if (fetchError) {
    return NextResponse.json(
      { error: 'Failed to fetch checks', details: fetchError.message },
      { status: 500 }
    );
  }

  if (!checks || checks.length === 0) {
    return NextResponse.json({ checked: 0, up: 0, down: 0 });
  }

  // Ping all URLs concurrently
  const results = await Promise.all(
    checks.map(async (check) => {
      const result = await pingUrl(check.url);
      return { check_id: check.id, ...result };
    })
  );

  // Insert all ping results
  const { error: insertError } = await supabase.from('uptime_pings').insert(results);

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to insert pings', details: insertError.message },
      { status: 500 }
    );
  }

  const up = results.filter((r) => r.is_up).length;
  const down = results.length - up;

  return NextResponse.json({ checked: results.length, up, down });
}
