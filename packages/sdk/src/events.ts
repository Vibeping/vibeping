import type { VibePingEvent, ResolvedConfig } from './types.js';
import type { Transport } from './transport.js';

/**
 * Custom event tracking — vibeping.track('event_name', { ...props })
 */
export class EventTracker {
  private config: ResolvedConfig;
  private transport: Transport;
  private sessionId: string;

  constructor(config: ResolvedConfig, transport: Transport, sessionId: string) {
    this.config = config;
    this.transport = transport;
    this.sessionId = sessionId;
  }

  /**
   * Track a custom event.
   * @param name - Event name (e.g. 'button_click', 'signup', 'purchase')
   * @param properties - Optional key-value properties
   */
  track(name: string, properties: Record<string, unknown> = {}): void {
    if (!name || typeof name !== 'string') {
      if (this.config.debug) {
        console.warn('[VibePing] track() requires a valid event name');
      }
      return;
    }

    const event: VibePingEvent = {
      type: 'custom',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      properties: {
        name,
        ...properties,
      },
    };

    this.transport.enqueue(event);

    if (this.config.debug) {
      console.log('[VibePing] Custom event:', name, properties);
    }
  }

  /**
   * Track a timed event.
   * Returns a function to call when the event ends.
   */
  trackTimed(name: string, properties: Record<string, unknown> = {}): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.track(name, { ...properties, duration });
    };
  }
}
