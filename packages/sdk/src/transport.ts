/**
 * VibePing SDK — Transport layer
 * Batches events in memory and flushes to the API endpoint.
 * Uses navigator.sendBeacon on page unload, fetch otherwise.
 * Retries once on failure.
 */

import type { ResolvedConfig, Transport, TransportPayload, VibePingEvent } from './types';

const SDK_VERSION = '0.1.0';
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 10;

/** Create a transport that batches and sends events to the API */
export function createTransport(config: ResolvedConfig): Transport {
  let buffer: VibePingEvent[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let destroyed = false;

  const endpoint = `${config.apiUrl}/api/v1/event`;

  /** Build the payload from the current buffer */
  function buildPayload(events: VibePingEvent[]): TransportPayload {
    return {
      projectId: config.id,
      events,
      sdkVersion: SDK_VERSION,
      sentAt: new Date().toISOString(),
    };
  }

  /** Send payload via fetch with one retry on failure */
  async function sendViaFetch(payload: TransportPayload): Promise<void> {
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json' };

    try {
      const res = await fetch(endpoint, { method: 'POST', headers, body, keepalive: true });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      // Retry once
      if (config.debug) {
        console.warn('[VibePing] Send failed, retrying...', err);
      }
      try {
        await fetch(endpoint, { method: 'POST', headers, body, keepalive: true });
      } catch (retryErr) {
        if (config.debug) {
          console.error('[VibePing] Retry failed, events dropped', retryErr);
        }
      }
    }
  }

  /** Send payload via sendBeacon (used on page unload) */
  function sendViaBeacon(payload: TransportPayload): void {
    const body = JSON.stringify(payload);
    const blob = new Blob([body], { type: 'application/json' });
    const sent = navigator.sendBeacon(endpoint, blob);
    if (!sent && config.debug) {
      console.warn('[VibePing] sendBeacon failed');
    }
  }

  /** Flush buffered events */
  function flush(useBeacon = false): void {
    if (buffer.length === 0) return;

    const events = buffer;
    buffer = [];
    const payload = buildPayload(events);

    if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      sendViaBeacon(payload);
    } else {
      void sendViaFetch(payload);
    }
  }

  /** Handle page visibility change / unload — flush with beacon */
  function onUnload(): void {
    flush(true);
  }

  let visibilityHandler: (() => void) | null = null;

  // Set up periodic flushing and unload handlers
  function start(): void {
    if (typeof window === 'undefined') return;

    timer = setInterval(() => flush(), FLUSH_INTERVAL_MS);

    // Use visibilitychange + pagehide for reliable unload detection
    visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        flush(true);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('pagehide', onUnload);
  }

  start();

  return {
    send(event: VibePingEvent): void {
      if (destroyed) return;
      buffer.push(event);

      if (config.debug) {
        console.debug('[VibePing] Event queued:', event.type, event);
      }

      // Flush if buffer is full
      if (buffer.length >= MAX_BUFFER_SIZE) {
        flush();
      }
    },

    flush(): void {
      flush();
    },

    destroy(): void {
      destroyed = true;
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      flush(true);
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', onUnload);
        if (visibilityHandler) {
          document.removeEventListener('visibilitychange', visibilityHandler);
          visibilityHandler = null;
        }
      }
    },
  };
}
