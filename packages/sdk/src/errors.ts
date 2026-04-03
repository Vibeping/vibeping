/**
 * VibePing SDK — Error auto-capture
 * Hooks into window.onerror and unhandledrejection.
 * Deduplicates errors with the same message+file within 5 seconds.
 */

import { EventType } from './types';
import type { ResolvedConfig, Transport, VibePingErrorEvent } from './types';
import { getSessionId } from './tracker';

const DEDUP_WINDOW_MS = 5000;

export interface ErrorTracker {
  start(): void;
  stop(): void;
}

/** Create an error tracker that captures uncaught errors and promise rejections */
export function createErrorTracker(
  config: ResolvedConfig,
  transport: Transport
): ErrorTracker {
  /** Map of "message|file" -> last seen timestamp for dedup */
  const seen = new Map<string, number>();
  const cleanupFns: Array<() => void> = [];

  /** Check if this error was recently seen (dedup) */
  function isDuplicate(message: string, file: string): boolean {
    const key = `${message}|${file}`;
    const now = Date.now();
    const lastSeen = seen.get(key);

    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
      return true;
    }

    seen.set(key, now);
    return false;
  }

  /** Build an error event */
  function buildErrorEvent(
    message: string,
    stack: string,
    file: string,
    line: number,
    column: number,
    errorType: string
  ): VibePingErrorEvent {
    return {
      type: EventType.Error,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      url: location.href,
      message,
      stack,
      file,
      line,
      column,
      errorType,
    };
  }

  function start(): void {
    if (typeof window === 'undefined') return;

    // Hook into window.onerror for uncaught errors
    const prevOnError = window.onerror;
    window.onerror = function (
      msg: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean | void {
      const message = typeof msg === 'string' ? msg : 'Unknown error';
      const file = source ?? '';
      const line = lineno ?? 0;
      const column = colno ?? 0;
      const stack = error?.stack ?? '';
      const errorType = error?.name ?? 'Error';

      if (!isDuplicate(message, file)) {
        transport.send(buildErrorEvent(message, stack, file, line, column, errorType));
        if (config.debug) {
          console.debug('[VibePing] Error captured:', message);
        }
      }

      // Call previous handler if it exists
      if (typeof prevOnError === 'function') {
        return prevOnError.call(window, msg, source, lineno, colno, error);
      }
    };
    cleanupFns.push(() => {
      window.onerror = prevOnError;
    });

    // Hook into unhandledrejection for promise rejections
    const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason;
      let message = 'Unhandled Promise Rejection';
      let stack = '';
      let errorType = 'UnhandledRejection';

      if (reason instanceof Error) {
        message = reason.message;
        stack = reason.stack ?? '';
        errorType = reason.name;
      } else if (typeof reason === 'string') {
        message = reason;
      }

      if (!isDuplicate(message, '')) {
        transport.send(buildErrorEvent(message, stack, '', 0, 0, errorType));
        if (config.debug) {
          console.debug('[VibePing] Unhandled rejection captured:', message);
        }
      }
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    cleanupFns.push(() =>
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    );

    if (config.debug) {
      console.debug('[VibePing] Error tracking started');
    }
  }

  function stop(): void {
    for (const fn of cleanupFns) fn();
    cleanupFns.length = 0;
    seen.clear();
  }

  return { start, stop };
}
