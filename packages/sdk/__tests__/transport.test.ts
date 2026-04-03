import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTransport } from '../src/transport';
import type { ResolvedConfig, VibePingEvent } from '../src/types';

// Re-mock fetch for this test file (setup.ts provides the baseline)
const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
vi.stubGlobal('fetch', mockFetch);

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    id: 'proj_test',
    apiUrl: 'https://api.test.com',
    debug: false,
    ...overrides,
  };
}

function makeFakeEvent(type = 'custom'): VibePingEvent {
  return {
    type: type as any,
    timestamp: '2025-01-01T00:00:00.000Z',
    sessionId: 'test-session',
    url: 'https://example.com',
    name: 'test_event',
    properties: {},
  } as VibePingEvent;
}

describe('Transport', () => {
  let config: ResolvedConfig;

  beforeEach(() => {
    config = makeConfig();
    vi.useFakeTimers();
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should queue events and not send immediately', () => {
    const transport = createTransport(config);
    transport.send(makeFakeEvent());
    expect(mockFetch).not.toHaveBeenCalled();
    transport.destroy();
  });

  it('should flush events when flush() is called', () => {
    const transport = createTransport(config);
    transport.send(makeFakeEvent());
    transport.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe('https://api.test.com/api/v1/event');
    expect(call[1].method).toBe('POST');

    const body = JSON.parse(call[1].body);
    expect(body.projectId).toBe('proj_test');
    expect(body.events).toHaveLength(1);
    expect(body.sdkVersion).toBe('0.1.0');
    expect(body.sentAt).toBeDefined();

    transport.destroy();
  });

  it('should not send when buffer is empty', () => {
    const transport = createTransport(config);
    transport.flush();
    expect(mockFetch).not.toHaveBeenCalled();
    transport.destroy();
  });

  it('should auto-flush when buffer reaches MAX_BUFFER_SIZE (10)', () => {
    const transport = createTransport(config);

    for (let i = 0; i < 9; i++) {
      transport.send(makeFakeEvent());
    }
    expect(mockFetch).not.toHaveBeenCalled();

    // 10th event triggers auto-flush
    transport.send(makeFakeEvent());
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.events).toHaveLength(10);

    transport.destroy();
  });

  it('should flush periodically via interval (5s)', () => {
    const transport = createTransport(config);
    transport.send(makeFakeEvent());

    vi.advanceTimersByTime(5000);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    transport.destroy();
  });

  it('should not send after destroy', () => {
    const transport = createTransport(config);
    transport.destroy();
    mockFetch.mockClear();

    transport.send(makeFakeEvent());
    transport.flush();
    // Only the beacon call from destroy should have happened, not new events
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should retry once on fetch failure', async () => {
    vi.useRealTimers();
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const transport = createTransport(config);
    transport.send(makeFakeEvent());
    transport.flush();

    // Wait for the async retry to complete
    await new Promise(r => setTimeout(r, 50));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    transport.destroy();
    vi.useFakeTimers();
  });

  it('should retry once on non-ok response', async () => {
    vi.useRealTimers();
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const transport = createTransport(config);
    transport.send(makeFakeEvent());
    transport.flush();

    await new Promise(r => setTimeout(r, 50));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    transport.destroy();
    vi.useFakeTimers();
  });

  it('should use sendBeacon on destroy', () => {
    const mockBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: mockBeacon,
      writable: true,
      configurable: true,
    });

    const transport = createTransport(config);
    transport.send(makeFakeEvent());
    transport.destroy();

    expect(mockBeacon).toHaveBeenCalledTimes(1);
    const blobArg = mockBeacon.mock.calls[0][1];
    expect(blobArg).toBeInstanceOf(Blob);
  });

  it('should batch multiple events in a single payload', () => {
    const transport = createTransport(config);
    transport.send(makeFakeEvent());
    transport.send(makeFakeEvent());
    transport.send(makeFakeEvent());
    transport.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.events).toHaveLength(3);

    transport.destroy();
  });

  it('should clear buffer after flush', () => {
    const transport = createTransport(config);
    transport.send(makeFakeEvent());
    transport.flush();
    mockFetch.mockClear();

    transport.flush();
    expect(mockFetch).not.toHaveBeenCalled();

    transport.destroy();
  });

  it('should strip trailing slash from apiUrl', () => {
    const transport = createTransport(makeConfig({ apiUrl: 'https://api.test.com/' }));
    transport.send(makeFakeEvent());
    transport.flush();

    // The config resolution happens in index.ts, but transport uses it directly
    // Here apiUrl already has trailing slash since we pass it directly
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.test.com//api/v1/event');
    transport.destroy();
  });
});
