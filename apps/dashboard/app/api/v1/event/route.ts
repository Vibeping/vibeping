import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase';

// ---- CORS helpers ----
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ---- Types ----
const VALID_TYPES = new Set(['pageview', 'error', 'vital', 'custom', 'session', 'identify']);

interface IncomingEvent {
  type: string;
  name?: string;
  url?: string;
  referrer?: string;
  title?: string;
  properties?: Record<string, unknown>;
  sessionId?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  browser?: string;
  os?: string;
  timestamp?: number;
}

interface EventPayload {
  apiKey?: string;
  events: IncomingEvent[];
}

// ---- POST /api/v1/event ----
export async function POST(request: NextRequest) {
  try {
    // Extract API key from body, header, or query
    const body: EventPayload = await request.json();
    const apiKey =
      body.apiKey ||
      request.headers.get('x-api-key') ||
      request.nextUrl.searchParams.get('api_key');

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid api_key' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Validate events array
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required and must not be empty' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Rate limit: max 100 events per request
    if (body.events.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 events per request' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createServerClient();

    // Look up project by api_key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Validate and transform events
    const rows = [];
    for (const evt of body.events) {
      if (!evt.type || !VALID_TYPES.has(evt.type)) {
        continue; // skip invalid event types silently
      }
      rows.push({
        project_id: project.id,
        type: evt.type,
        name: evt.name || null,
        url: evt.url || null,
        referrer: evt.referrer || null,
        title: evt.title || null,
        properties: evt.properties || {},
        session_id: evt.sessionId || null,
        screen_width: evt.screenWidth || null,
        screen_height: evt.screenHeight || null,
        language: evt.language || null,
        browser: evt.browser || null,
        os: evt.os || null,
        // country will be set server-side later via IP geolocation
        created_at: evt.timestamp ? new Date(evt.timestamp).toISOString() : new Date().toISOString(),
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid events in payload' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Batch insert
    const { error: insertError } = await supabase.from('events').insert(rows);

    if (insertError) {
      console.error('[VibePing] Event insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store events' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, accepted: rows.length },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('[VibePing] Event API error:', err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
