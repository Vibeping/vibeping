/**
 * VibePing SDK — Main entry point
 * Initializes all tracking modules and exposes the public API.
 * Supports both ESM import and script tag usage.
 */

import type { VibePingConfig, ResolvedConfig, Transport } from './types';
import { createTransport } from './transport';
import { createTracker } from './tracker';
import { createErrorTracker } from './errors';
import { createVitalsTracker } from './vitals';
import { createEventTracker } from './events';

export type { VibePingConfig } from './types';
export { EventType } from './types';
export type {
  PageviewEvent,
  VibePingErrorEvent,
  VitalEvent,
  CustomEvent,
  SessionEvent,
  TransportPayload,
  VibePingEvent,
} from './types';

/** Default API URL */
const DEFAULT_API_URL = 'https://app.vibeping.dev';

/** Public API returned by init() */
export interface VibePingAPI {
  /** Track a custom event */
  track(name: string, properties?: Record<string, string | number | boolean>): void;
  /** Associate user traits with the session */
  identify(traits: Record<string, string | number | boolean>): void;
  /** Flush all pending events */
  flush(): void;
  /** Destroy the SDK and clean up */
  destroy(): void;
}

/** Singleton state */
let initialized = false;
let api: VibePingAPI | null = null;

/** Resolve config with defaults */
function resolveConfig(config: VibePingConfig): ResolvedConfig {
  return {
    id: config.id,
    apiUrl: (config.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, ''),
    debug: config.debug ?? false,
  };
}

/**
 * Initialize VibePing SDK
 * @param config - SDK configuration
 * @returns Public API for tracking events
 */
export function init(config: VibePingConfig): VibePingAPI {
  if (initialized && api) {
    if (config.debug) {
      console.warn('[VibePing] Already initialized, returning existing instance');
    }
    return api;
  }

  if (!config.id) {
    throw new Error('[VibePing] config.id is required');
  }

  if ('apiUrl' in config && !config.apiUrl) {
    console.warn(
      '[VibePing] apiUrl was explicitly set to empty. Events will not be sent. Set apiUrl in vibeping.init({ apiUrl: ... }) or omit it to use the default (https://app.vibeping.dev).'
    );
  }

  const resolved = resolveConfig(config);
  const transport: Transport = createTransport(resolved);
  const tracker = createTracker(resolved, transport);
  const errorTracker = createErrorTracker(resolved, transport);
  const vitalsTracker = createVitalsTracker(resolved, transport);
  const eventTracker = createEventTracker(resolved, transport);

  // Start all trackers
  tracker.start();
  errorTracker.start();
  vitalsTracker.start();

  initialized = true;

  api = {
    track: eventTracker.track,
    identify: eventTracker.identify,
    flush: () => transport.flush(),
    destroy: () => {
      tracker.stop();
      errorTracker.stop();
      transport.destroy();
      initialized = false;
      api = null;
    },
  };

  if (resolved.debug) {
    console.debug('[VibePing] Initialized with config:', resolved);
  }

  return api;
}

/**
 * Track a custom event (must call init() first)
 */
export function track(name: string, properties?: Record<string, string | number | boolean>): void {
  if (!api) {
    console.warn('[VibePing] Not initialized. Call vibeping.init() first.');
    return;
  }
  api.track(name, properties);
}

/**
 * Identify user traits (must call init() first)
 */
export function identify(traits: Record<string, string | number | boolean>): void {
  if (!api) {
    console.warn('[VibePing] Not initialized. Call vibeping.init() first.');
    return;
  }
  api.identify(traits);
}

/**
 * Auto-init from script tag: <script src="vibeping.js" data-id="proj_xxx">
 */
function autoInit(): void {
  if (typeof document === 'undefined') return;

  // Find our script tag by looking for data-id attribute
  const scripts = document.querySelectorAll('script[data-id]');
  for (const script of scripts) {
    const src = script.getAttribute('src') ?? '';
    // Match if the script src contains 'vibeping'
    if (src.includes('vibeping') || script.hasAttribute('data-vibeping')) {
      const id = script.getAttribute('data-id');
      if (id) {
        const apiUrl = script.getAttribute('data-api-url') ?? undefined;
        const debug = script.getAttribute('data-debug') === 'true';
        init({ id, apiUrl, debug });
        break;
      }
    }
  }
}

// Expose on window for script tag usage
if (typeof window !== 'undefined') {
  const w = window as Window & {
    __vibeping?: { init: typeof init; track: typeof track; identify: typeof identify };
  };
  w.__vibeping = { init, track, identify };
}

// Auto-init when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}
