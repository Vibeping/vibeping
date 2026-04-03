import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createErrorTracker } from '../src/errors';
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

describe('ErrorTracker', () => {
  let transport: ReturnType<typeof makeMockTransport>;
  let config: ResolvedConfig;
  let savedOnError: OnErrorEventHandler;

  beforeEach(() => {
    config = makeConfig();
    transport = makeMockTransport();
    savedOnError = window.onerror;
  });

  afterEach(() => {
    window.onerror = savedOnError;
  });

  it('should capture errors via window.onerror', () => {
    const tracker = createErrorTracker(config, transport);
    tracker.start();

    // Simulate window.onerror
    window.onerror!(
      'Test error message',
      'https://example.com/app.js',
      42,
      10,
      new Error('Test error message')
    );

    expect(transport.send).toHaveBeenCalledTimes(1);
    const event = transport.events[0] as any;
    expect(event.type).toBe('error');
    expect(event.message).toBe('Test error message');
    expect(event.file).toBe('https://example.com/app.js');
    expect(event.line).toBe(42);
    expect(event.column).toBe(10);
    expect(event.errorType).toBe('Error');

    tracker.stop();
  });

  it('should capture unhandled promise rejections', () => {
    const tracker = createErrorTracker(config, transport);
    tracker.start();

    const error = new Error('Promise failed');
    const event = new Event('unhandledrejection') as any;
    event.reason = error;

    // Manually create and dispatch a PromiseRejectionEvent-like object
    window.dispatchEvent(
      Object.assign(new Event('unhandledrejection'), { reason: error })
    );

    expect(transport.send).toHaveBeenCalledTimes(1);
    const captured = transport.events[0] as any;
    expect(captured.type).toBe('error');
    expect(captured.message).toBe('Promise failed');
    expect(captured.errorType).toBe('Error');

    tracker.stop();
  });

  it('should handle string rejection reasons', () => {
    const tracker = createErrorTracker(config, transport);
    tracker.start();

    window.dispatchEvent(
      Object.assign(new Event('unhandledrejection'), { reason: 'string error' })
    );

    const captured = transport.events[0] as any;
    expect(captured.message).toBe('string error');
    expect(captured.errorType).toBe('UnhandledRejection');

    tracker.stop();
  });

  it('should deduplicate same errors within 5 seconds', () => {
    vi.useFakeTimers();
    const tracker = createErrorTracker(config, transport);
    tracker.start();

    // First error
    window.onerror!('Duplicate error', 'app.js', 1, 1, new Error('Duplicate error'));
    expect(transport.send).toHaveBeenCalledTimes(1);

    // Same error immediately — should be deduped
    window.onerror!('Duplicate error', 'app.js', 1, 1, new Error('Duplicate error'));
    expect(transport.send).toHaveBeenCalledTimes(1);

    // After 5 seconds, same error should be captured again
    vi.advanceTimersByTime(5001);
    window.onerror!('Duplicate error', 'app.js', 1, 1, new Error('Duplicate error'));
    expect(transport.send).toHaveBeenCalledTimes(2);

    tracker.stop();
    vi.useRealTimers();
  });

  it('should allow different errors within dedup window', () => {
    const tracker = createErrorTracker(config, transport);
    tracker.start();

    window.onerror!('Error A', 'app.js', 1, 1, new Error('Error A'));
    window.onerror!('Error B', 'app.js', 2, 1, new Error('Error B'));

    expect(transport.send).toHaveBeenCalledTimes(2);
    tracker.stop();
  });

  it('should clean up handlers on stop()', () => {
    const tracker = createErrorTracker(config, transport);
    tracker.start();
    tracker.stop();

    // After stop, onerror should be restored to original (null in jsdom)
    // Verify by setting a new onerror and checking the tracker doesn't interfere
    transport.send.mockClear();

    // The original onerror was null, so calling it would throw
    // Instead, verify that dispatching unhandledrejection doesn't trigger sends
    window.dispatchEvent(
      Object.assign(new Event('unhandledrejection'), { reason: new Error('After stop') })
    );
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('should handle missing error details gracefully', () => {
    const tracker = createErrorTracker(config, transport);
    tracker.start();

    // Call with minimal args
    window.onerror!('Unknown error', undefined, undefined, undefined, undefined);

    const captured = transport.events[0] as any;
    expect(captured.message).toBe('Unknown error');
    expect(captured.file).toBe('');
    expect(captured.line).toBe(0);
    expect(captured.column).toBe(0);
    expect(captured.stack).toBe('');
    expect(captured.errorType).toBe('Error');

    tracker.stop();
  });

  it('should call previous onerror handler', () => {
    const prevHandler = vi.fn();
    window.onerror = prevHandler;

    const tracker = createErrorTracker(config, transport);
    tracker.start();

    window.onerror!('Test', 'app.js', 1, 1, new Error('Test'));

    expect(prevHandler).toHaveBeenCalled();
    tracker.stop();
  });
});
