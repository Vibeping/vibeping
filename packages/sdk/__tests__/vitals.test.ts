import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVitalsTracker } from '../src/vitals';
import type { ResolvedConfig, Transport, VibePingEvent } from '../src/types';

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    id: 'proj_test',
    apiUrl: 'https://api.test.com',
    debug: false,
    ...overrides,
  };
}

function makeMockTransport(): Transport & { events: VibePingEvent[] } {
  const events: VibePingEvent[] = [];
  return {
    events,
    send: vi.fn((event: VibePingEvent) => events.push(event)),
    flush: vi.fn(),
    destroy: vi.fn(),
  };
}

describe('VitalsTracker', () => {
  let transport: ReturnType<typeof makeMockTransport>;
  let config: ResolvedConfig;

  beforeEach(() => {
    config = makeConfig();
    transport = makeMockTransport();
  });

  it('should create a vitals tracker with start method', () => {
    const tracker = createVitalsTracker(config, transport);
    expect(tracker).toBeDefined();
    expect(typeof tracker.start).toBe('function');
  });

  it('should not throw when start() is called', () => {
    const tracker = createVitalsTracker(config, transport);
    expect(() => tracker.start()).not.toThrow();
  });

  it('should attempt to use web-vitals library (which will fail and use fallback)', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const tracker = createVitalsTracker(makeConfig({ debug: true }), transport);
    tracker.start();

    // Allow the dynamic import promise to resolve/reject
    await vi.dynamicImportSettled?.() ?? new Promise(r => setTimeout(r, 10));
    await new Promise(r => setTimeout(r, 0));

    debugSpy.mockRestore();
  });
});
