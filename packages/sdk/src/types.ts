/**
 * VibePing SDK — Type definitions
 * All event types, config, and transport payload types.
 */

/** SDK configuration passed to vibeping.init() */
export interface VibePingConfig {
  /** API key from VibePing dashboard (e.g. 'vp_abc123') */
  id: string;
  /** API endpoint URL (defaults to https://app.vibeping.dev) */
  apiUrl?: string;
  /** Enable debug logging to console */
  debug?: boolean;
}

/** Internal resolved config with defaults applied */
export interface ResolvedConfig {
  id: string;
  apiUrl: string;
  debug: boolean;
}

/** Event type discriminator */
export const enum EventType {
  Pageview = 'pageview',
  Error = 'error',
  Vital = 'vital',
  Custom = 'custom',
  Session = 'session',
  Identify = 'identify',
}

/** Base fields shared by all events */
export interface BaseEvent {
  /** Event type discriminator */
  type: EventType;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Session ID */
  sessionId: string;
  /** Current page URL */
  url: string;
}

/** Pageview event — fired on navigation */
export interface PageviewEvent extends BaseEvent {
  type: EventType.Pageview;
  referrer: string;
  title: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
}

/** Error event — captured from window.onerror / unhandledrejection */
export interface VibePingErrorEvent extends BaseEvent {
  type: EventType.Error;
  message: string;
  stack: string;
  file: string;
  line: number;
  column: number;
  errorType: string;
}

/** Web vital metric event */
export interface VitalEvent extends BaseEvent {
  type: EventType.Vital;
  /** Metric name: LCP, FID, CLS, TTFB, INP */
  name: string;
  /** Metric value */
  value: number;
  /** Rating: good, needs-improvement, poor */
  rating: string;
}

/** Custom user-defined event */
export interface CustomEvent extends BaseEvent {
  type: EventType.Custom;
  /** Event name */
  name: string;
  /** Optional properties */
  properties: Record<string, string | number | boolean>;
}

/** Session lifecycle event */
export interface SessionEvent extends BaseEvent {
  type: EventType.Session;
  /** Session action: start or end */
  action: 'start' | 'end';
  /** Duration in milliseconds (set on end) */
  duration: number;
}

/** Identify event — associate user data with a session */
export interface IdentifyEvent extends BaseEvent {
  type: EventType.Identify;
  /** User properties */
  traits: Record<string, string | number | boolean>;
}

/** Union of all event types */
export type VibePingEvent =
  | PageviewEvent
  | VibePingErrorEvent
  | VitalEvent
  | CustomEvent
  | SessionEvent
  | IdentifyEvent;

/** Batch payload sent to the API */
export interface TransportPayload {
  /** API key for authentication */
  apiKey: string;
  /** Batch of events */
  events: VibePingEvent[];
  /** SDK version */
  sdkVersion: string;
  /** Sent timestamp */
  sentAt: string;
}

/** Transport interface for sending events */
export interface Transport {
  /** Queue an event for sending */
  send(event: VibePingEvent): void;
  /** Flush all queued events immediately */
  flush(): void;
  /** Stop the transport (clear timers) */
  destroy(): void;
}
