import type { VibePingEvent, ResolvedConfig, ErrorEvent } from './types.js';
import type { Transport } from './transport.js';

/**
 * Error tracking — captures uncaught exceptions and unhandled promise rejections.
 */
export class ErrorTracker {
  private config: ResolvedConfig;
  private transport: Transport;
  private sessionId: string;
  private cleanupFns: Array<() => void> = [];

  constructor(config: ResolvedConfig, transport: Transport, sessionId: string) {
    this.config = config;
    this.transport = transport;
    this.sessionId = sessionId;
  }

  /** Start capturing errors */
  start(): void {
    if (typeof window === 'undefined') return;

    // Capture uncaught errors via window.onerror
    const onError = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): void => {
      const errorPayload: ErrorEvent = {
        message: error?.message || String(message),
        stack: error?.stack,
        source,
        lineno,
        colno,
        type: 'uncaught',
      };

      this.sendError(errorPayload);
    };

    // Capture unhandled promise rejections
    const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason;
      const errorPayload: ErrorEvent = {
        message: reason?.message || String(reason),
        stack: reason?.stack,
        type: 'unhandled_rejection',
      };

      this.sendError(errorPayload);
    };

    window.onerror = onError;
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    this.cleanupFns.push(() => {
      window.onerror = null;
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    });

    if (this.config.debug) {
      console.log('[VibePing] Error tracking enabled');
    }
  }

  /** Stop capturing errors */
  stop(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }

  /** Manually capture an error */
  captureError(error: Error | string, extra?: Record<string, unknown>): void {
    const err = typeof error === 'string' ? new Error(error) : error;
    const errorPayload: ErrorEvent = {
      message: err.message,
      stack: err.stack,
      type: 'manual',
    };

    this.sendError(errorPayload, extra);
  }

  /** Send an error event */
  private sendError(error: ErrorEvent, extra?: Record<string, unknown>): void {
    const event: VibePingEvent = {
      type: 'error',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      properties: {
        ...error,
        ...extra,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
    };

    this.transport.enqueue(event);

    if (this.config.debug) {
      console.log('[VibePing] Error captured:', error.message);
    }
  }
}
