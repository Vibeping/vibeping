import { vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
});

vi.stubGlobal('fetch', mockFetch);

// Mock navigator.sendBeacon
vi.stubGlobal('navigator', {
  ...globalThis.navigator,
  sendBeacon: vi.fn().mockReturnValue(true),
  language: 'en-US',
});

// Mock crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  const cryptoMock = {
    randomUUID: () => '00000000-0000-0000-0000-000000000001',
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  };
  vi.stubGlobal('crypto', cryptoMock);
}

// Mock screen
vi.stubGlobal('screen', { width: 1920, height: 1080 });

// Mock PerformanceObserver
class MockPerformanceObserver {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
}
vi.stubGlobal('PerformanceObserver', MockPerformanceObserver);

// Clear sessionStorage before each test
beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
});

afterEach(() => {
  vi.restoreAllMocks();
});

export { mockFetch };
