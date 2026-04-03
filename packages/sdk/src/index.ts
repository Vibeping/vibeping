import type { VibePingConfig, ResolvedConfig } from './types.js';
import { Transport } from './transport.js';
import { Tracker } from './tracker.js';
import { ErrorTracker } from './errors.js';
import { VitalsCollector } from './vitals.js';
import { EventTracker } from './events.js';

export type { VibePingConfig, VibePingEvent, ErrorEvent, VitalMetric, CustomEvent } from './types.js';

const DEFAULT_ENDPOINT = 'https://api.vibeping.com/v1/event';

const DEFAULTS: Omit<ResolvedConfig, 'apiKey'> = {
  endpoint: DEFAULT_ENDPOINT,
  trackPageviews: true,
  trackErrors: true,
  trackVitals: true,
  flushInterval: 5000,
  batchSize: 25,
  debug: false,
};

/** VibePing SDK instance */
class VibePing {
  private config: ResolvedConfig;
  private transport: Transport;
  private tracker: Tracker;
  private errorTracker: ErrorTracker;
  private vitalsCollector: VitalsCollector;
  private eventTracker: EventTracker;
  private initialized = false;

  constructor(userConfig: VibePingConfig) {
    this.config = { ...DEFAULTS, ...userConfig } as ResolvedConfig;

    if (!this.config.apiKey) {
      throw new Error('[VibePing] apiKey is required');
    }

    this.transport = new Transport(this.config);
    this.tracker = new Tracker(this.config, this.transport);
    this.errorTracker = new ErrorTracker(this.config, this.transport, this.tracker.getSessionId());
    this.vitalsCollector = new VitalsCollector(this.config, this.transport, this.tracker.getSessionId());
    this.eventTracker = new EventTracker(this.config, this.transport, this.tracker.getSessionId());
  }

  /** Initialize all tracking */
  start(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.transport.start();

    if (this.config.trackPageviews) {
      this.tracker.start();
    }

    if (this.config.trackErrors) {
      this.errorTracker.start();
    }

    if (this.config.trackVitals) {
      this.vitalsCollector.start();
    }

    if (this.config.debug) {
      console.log('[VibePing] SDK initialized', { endpoint: this.config.endpoint });
    }
  }

  /** Stop all tracking and flush remaining events */
  stop(): void {
    this.tracker.stop();
    this.errorTracker.stop();
    this.transport.stop();
    this.initialized = false;
  }

  /** Track a custom event */
  track(name: string, properties?: Record<string, unknown>): void {
    this.eventTracker.track(name, properties);
  }

  /** Track a timed event — returns a stop function */
  trackTimed(name: string, properties?: Record<string, unknown>): () => void {
    return this.eventTracker.trackTimed(name, properties);
  }

  /** Manually capture an error */
  captureError(error: Error | string, extra?: Record<string, unknown>): void {
    this.errorTracker.captureError(error, extra);
  }
}

/** Create and start a VibePing instance */
export function init(config: VibePingConfig): VibePing {
  const instance = new VibePing(config);
  instance.start();
  return instance;
}

/** Convenience — also expose as default */
export default { init };
