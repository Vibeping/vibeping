import type { VibePingEvent, ResolvedConfig } from './types.js';

/**
 * Event transport — batches events and sends via Beacon API (preferred) or fetch.
 */
export class Transport {
  private queue: VibePingEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this.config = config;
  }

  /** Start the flush interval timer */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.config.flushInterval);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
      window.addEventListener('pagehide', () => this.flush());
    }
  }

  /** Stop the flush timer */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Final flush
    this.flush();
  }

  /** Add an event to the batch queue */
  enqueue(event: VibePingEvent): void {
    this.queue.push(event);

    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /** Flush all queued events to the server */
  flush(): void {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.config.batchSize);
    const payload = JSON.stringify({
      apiKey: this.config.apiKey,
      events: batch,
    });

    if (this.config.debug) {
      console.log('[VibePing] Flushing', batch.length, 'events');
    }

    this.send(payload);
  }

  /** Send payload using Beacon API (preferred) or fetch fallback */
  private send(payload: string): void {
    const url = this.config.endpoint;

    // Prefer sendBeacon for reliability during page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch((err) => {
        if (this.config.debug) {
          console.error('[VibePing] Transport error:', err);
        }
      });
    }
  }
}
