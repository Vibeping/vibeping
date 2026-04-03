/**
 * Tests for the main SDK entry point (init, track, identify, destroy).
 *
 * NOTE: Since index.ts uses module-level singleton state (initialized, api),
 * and the module is auto-initializing (sets up window.__vibeping, DOMContentLoaded),
 * we test the sub-modules directly and test the public API surface here.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to reset module state between tests
// Use dynamic imports with vi.resetModules()

describe('SDK init()', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throw if config.id is not provided', async () => {
    const { init } = await import('../src/index');
    expect(() => init({ id: '' })).toThrow('[VibePing] config.id is required');
  });

  it('should return a VibePingAPI object with track, identify, flush, destroy', async () => {
    const { init } = await import('../src/index');
    const api = init({ id: 'proj_123' });

    expect(api).toBeDefined();
    expect(typeof api.track).toBe('function');
    expect(typeof api.identify).toBe('function');
    expect(typeof api.flush).toBe('function');
    expect(typeof api.destroy).toBe('function');

    api.destroy();
  });

  it('should return existing instance if already initialized', async () => {
    const { init } = await import('../src/index');
    const api1 = init({ id: 'proj_123' });
    const api2 = init({ id: 'proj_456' });

    expect(api1).toBe(api2);
    api1.destroy();
  });

  it('should allow re-init after destroy', async () => {
    const { init } = await import('../src/index');
    const api1 = init({ id: 'proj_123' });
    api1.destroy();

    const api2 = init({ id: 'proj_456' });
    expect(api2).toBeDefined();
    expect(api2).not.toBe(api1);
    api2.destroy();
  });

  it('should warn when calling track() before init()', async () => {
    const { track } = await import('../src/index');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    track('test_event');

    expect(warnSpy).toHaveBeenCalledWith('[VibePing] Not initialized. Call vibeping.init() first.');
    warnSpy.mockRestore();
  });

  it('should warn when calling identify() before init()', async () => {
    const { identify } = await import('../src/index');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    identify({ name: 'test' });

    expect(warnSpy).toHaveBeenCalledWith('[VibePing] Not initialized. Call vibeping.init() first.');
    warnSpy.mockRestore();
  });

  it('should use default API URL when not specified', async () => {
    const { init } = await import('../src/index');
    const api = init({ id: 'proj_123' });

    // We can't directly check the resolved config, but we can verify it doesn't throw
    expect(api).toBeDefined();
    api.destroy();
  });

  it('should accept custom API URL', async () => {
    const { init } = await import('../src/index');
    const api = init({ id: 'proj_123', apiUrl: 'https://custom.api.com' });
    expect(api).toBeDefined();
    api.destroy();
  });

  it('should track custom events via returned API', async () => {
    const { init } = await import('../src/index');
    const api = init({ id: 'proj_123' });

    // Should not throw
    api.track('button_click', { label: 'signup' });
    api.identify({ userId: 'user_123' });
    api.flush();

    api.destroy();
  });

  it('should track events via module-level track() after init', async () => {
    const { init, track } = await import('../src/index');
    init({ id: 'proj_123' });

    // Should not warn — SDK is initialized
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    track('test_event');
    expect(warnSpy).not.toHaveBeenCalledWith(
      '[VibePing] Not initialized. Call vibeping.init() first.'
    );

    const { init: init2 } = await import('../src/index');
    const api = init2({ id: 'proj_123' });
    api.destroy();
    warnSpy.mockRestore();
  });
});
