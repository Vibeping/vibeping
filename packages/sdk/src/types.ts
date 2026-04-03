/** Configuration options for VibePing SDK */
export interface VibePingConfig {
  /** Your VibePing project API key */
  apiKey: string;
  /** Endpoint URL for event ingestion */
  endpoint?: string;
  /** Enable automatic pageview tracking (default: true) */
  trackPageviews?: boolean;
  /** Enable error tracking (default: true) */
  trackErrors?: boolean;
  /** Enable web vitals collection (default: true) */
  trackVitals?: boolean;
  /** Batch flush interval in ms (default: 5000) */
  flushInterval?: number;
  /** Max events per batch (default: 25) */
  batchSize?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/** Internal resolved config with defaults applied */
export interface ResolvedConfig extends Required<VibePingConfig> {}

/** Base event payload sent to the server */
export interface VibePingEvent {
  type: EventType;
  timestamp: number;
  sessionId: string;
  url: string;
  properties: Record<string, unknown>;
}

/** Supported event types */
export type EventType =
  | 'pageview'
  | 'error'
  | 'vital'
  | 'custom'
  | 'session_start'
  | 'session_end';

/** Error event payload */
export interface ErrorEvent {
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  type: 'uncaught' | 'unhandled_rejection' | 'manual';
}

/** Web vital metric */
export interface VitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

/** Custom event */
export interface CustomEvent {
  name: string;
  properties?: Record<string, unknown>;
}

/** Transport send function signature */
export type TransportSendFn = (events: VibePingEvent[]) => Promise<boolean>;
