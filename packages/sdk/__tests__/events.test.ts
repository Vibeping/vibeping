import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEventTracker } from '../src/events';
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

describe('EventTracker', () => {
  let transport: ReturnType<typeof makeMockTransport>;
  let config: ResolvedConfig;

  beforeEach(() => {
    config = makeConfig();
    transport = makeMockTransport();
  });

  describe('track()', () => {
    it('should send a custom event with name and properties', () => {
      const tracker = createEventTracker(config, transport);
      tracker.track('button_click', { color: 'blue', count: 5, active: true });

      expect(transport.send).toHaveBeenCalledTimes(1);
      const event = transport.events[0] as any;
      expect(event.type).toBe('custom');
      expect(event.name).toBe('button_click');
      expect(event.properties).toEqual({ color: 'blue', count: 5, active: true });
      expect(event.timestamp).toBeDefined();
      expect(event.sessionId).toBeDefined();
      expect(event.url).toBeDefined();
    });

    it('should send event with empty properties if none provided', () => {
      const tracker = createEventTracker(config, transport);
      tracker.track('page_loaded');

      const event = transport.events[0] as any;
      expect(event.properties).toEqual({});
    });

    it('should reject empty event name', () => {
      const tracker = createEventTracker(makeConfig({ debug: true }), transport);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.track('');

      expect(transport.send).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should truncate event names longer than 100 chars', () => {
      const tracker = createEventTracker(makeConfig({ debug: true }), transport);
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});

      const longName = 'a'.repeat(150);
      tracker.track(longName);

      const event = transport.events[0] as any;
      expect(event.name).toHaveLength(100);
    });

    it('should filter out properties with invalid value types', () => {
      const tracker = createEventTracker(makeConfig({ debug: true }), transport);
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});

      tracker.track('test', {
        valid_string: 'hello',
        valid_number: 42,
        valid_bool: true,
        invalid_obj: { nested: true } as any,
        invalid_arr: [1, 2] as any,
        invalid_null: null as any,
      });

      const event = transport.events[0] as any;
      expect(event.properties).toEqual({
        valid_string: 'hello',
        valid_number: 42,
        valid_bool: true,
      });
    });

    it('should truncate properties to 50 keys max', () => {
      const tracker = createEventTracker(makeConfig({ debug: true }), transport);
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});

      const props: Record<string, string> = {};
      for (let i = 0; i < 60; i++) {
        props[`key_${i}`] = `value_${i}`;
      }

      tracker.track('test', props);

      const event = transport.events[0] as any;
      expect(Object.keys(event.properties).length).toBe(50);
    });

    it('should support tracking multiple events', () => {
      const tracker = createEventTracker(config, transport);
      tracker.track('event_1');
      tracker.track('event_2');
      tracker.track('event_3');

      expect(transport.send).toHaveBeenCalledTimes(3);
      expect(transport.events).toHaveLength(3);
    });
  });

  describe('identify()', () => {
    it('should send an identify event with traits', () => {
      const tracker = createEventTracker(config, transport);
      tracker.identify({ name: 'John', age: 30, premium: true });

      expect(transport.send).toHaveBeenCalledTimes(1);
      const event = transport.events[0] as any;
      expect(event.type).toBe('identify');
      expect(event.traits).toEqual({ name: 'John', age: 30, premium: true });
      expect(event.sessionId).toBeDefined();
    });

    it('should reject non-object traits in debug mode', () => {
      const tracker = createEventTracker(makeConfig({ debug: true }), transport);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.identify(null as any);

      expect(transport.send).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should validate trait value types', () => {
      const tracker = createEventTracker(makeConfig({ debug: true }), transport);
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});

      tracker.identify({
        name: 'Alice',
        invalid: { foo: 'bar' } as any,
      });

      const event = transport.events[0] as any;
      expect(event.traits).toEqual({ name: 'Alice' });
    });
  });
});
