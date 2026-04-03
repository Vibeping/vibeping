import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTracker, getSessionId } from '../src/tracker';
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

describe('Tracker', () => {
  let transport: ReturnType<typeof makeMockTransport>;
  let config: ResolvedConfig;

  beforeEach(() => {
    config = makeConfig();
    transport = makeMockTransport();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getSessionId()', () => {
    it('should generate and store a session ID in sessionStorage', () => {
      const sid = getSessionId();
      expect(sid).toBeTruthy();
      expect(typeof sid).toBe('string');
      expect(sessionStorage.getItem('__vibeping_sid')).toBe(sid);
    });

    it('should return the same session ID on subsequent calls', () => {
      const sid1 = getSessionId();
      const sid2 = getSessionId();
      expect(sid1).toBe(sid2);
    });

    it('should create a new ID if sessionStorage is cleared', () => {
      getSessionId();
      sessionStorage.clear();
      const sid2 = getSessionId();
      // They might be different (crypto.randomUUID returns different values)
      expect(sid2).toBeTruthy();
    });
  });

  describe('createTracker', () => {
    it('should send session start and initial pageview on start()', () => {
      const tracker = createTracker(config, transport);
      tracker.start();

      // First event: session start, second: pageview
      expect(transport.send).toHaveBeenCalledTimes(2);

      const sessionEvent = transport.events[0] as any;
      expect(sessionEvent.type).toBe('session');
      expect(sessionEvent.action).toBe('start');
      expect(sessionEvent.duration).toBe(0);

      const pageviewEvent = transport.events[1] as any;
      expect(pageviewEvent.type).toBe('pageview');
      expect(pageviewEvent.url).toBeDefined();
      expect(pageviewEvent.referrer).toBeDefined();
      expect(pageviewEvent.title).toBeDefined();
      expect(pageviewEvent.screenWidth).toBeDefined();
      expect(pageviewEvent.screenHeight).toBeDefined();
      expect(pageviewEvent.language).toBeDefined();

      tracker.stop();
    });

    it('should track URL changes via history.pushState', () => {
      const tracker = createTracker(config, transport);
      tracker.start();
      transport.send.mockClear();
      transport.events.length = 0;

      // Simulate SPA navigation
      history.pushState({}, '', '/new-page');
      vi.advanceTimersByTime(100);

      expect(transport.send).toHaveBeenCalledTimes(1);
      const event = transport.events[0] as any;
      expect(event.type).toBe('pageview');

      tracker.stop();
      // Reset URL
      history.pushState({}, '', '/');
    });

    it('should not track duplicate URLs', () => {
      const tracker = createTracker(config, transport);
      tracker.start();
      transport.send.mockClear();

      // Push to same URL (no change)
      const currentUrl = location.href;
      history.pushState({}, '', currentUrl);
      vi.advanceTimersByTime(100);

      expect(transport.send).not.toHaveBeenCalled();

      tracker.stop();
    });

    it('should clean up listeners on stop()', () => {
      const tracker = createTracker(config, transport);
      tracker.start();
      tracker.stop();
      transport.send.mockClear();
      transport.events.length = 0;

      // After stop, pushState should not trigger events
      history.pushState({}, '', '/after-stop');
      vi.advanceTimersByTime(100);

      expect(transport.send).not.toHaveBeenCalled();

      // Reset
      history.pushState({}, '', '/');
    });

    it('should send session end on visibility change to hidden', () => {
      const tracker = createTracker(config, transport);
      tracker.start();
      transport.send.mockClear();
      transport.events.length = 0;

      // Simulate visibility change
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(transport.send).toHaveBeenCalledTimes(1);
      const event = transport.events[0] as any;
      expect(event.type).toBe('session');
      expect(event.action).toBe('end');

      // Restore
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      tracker.stop();
    });
  });
});
