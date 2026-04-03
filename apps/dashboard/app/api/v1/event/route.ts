import { NextRequest, NextResponse } from 'next/server';

interface IncomingEvent {
  type: string;
  timestamp: number;
  sessionId: string;
  url: string;
  properties: Record<string, unknown>;
}

interface EventPayload {
  apiKey: string;
  events: IncomingEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const body: EventPayload = await request.json();

    // Validate API key
    if (!body.apiKey || typeof body.apiKey !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid apiKey' },
        { status: 401 }
      );
    }

    // Validate events array
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required and must not be empty' },
        { status: 400 }
      );
    }

    // TODO: Validate API key against database
    // TODO: Store events in Supabase / ClickHouse
    // TODO: Process events for real-time aggregation

    console.log(`[VibePing] Received ${body.events.length} events for key ${body.apiKey.slice(0, 8)}...`);

    return NextResponse.json({
      success: true,
      accepted: body.events.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
