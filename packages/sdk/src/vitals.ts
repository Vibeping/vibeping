/**
 * VibePing SDK — Web Vitals tracking
 * Uses the web-vitals library if available, falls back to PerformanceObserver.
 * Tracks: LCP, FID, CLS, TTFB, INP
 */

import { EventType } from './types';
import type { ResolvedConfig, Transport, VitalEvent } from './types';
import { getSessionId } from './tracker';

export interface VitalsTracker {
  start(): void;
}

/** Build a vital event */
function buildVitalEvent(
  name: string,
  value: number,
  rating: string
): VitalEvent {
  return {
    type: EventType.Vital,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    url: location.href,
    name,
    value,
    rating,
  };
}

/** Rate a metric value (simplified thresholds based on web.dev) */
function rateLCP(value: number): string {
  if (value <= 2500) return 'good';
  if (value <= 4000) return 'needs-improvement';
  return 'poor';
}

function rateFID(value: number): string {
  if (value <= 100) return 'good';
  if (value <= 300) return 'needs-improvement';
  return 'poor';
}

function rateCLS(value: number): string {
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
}

function rateTTFB(value: number): string {
  if (value <= 800) return 'good';
  if (value <= 1800) return 'needs-improvement';
  return 'poor';
}

function rateINP(value: number): string {
  if (value <= 200) return 'good';
  if (value <= 500) return 'needs-improvement';
  return 'poor';
}

/** Try to use the web-vitals library */
async function tryWebVitals(
  config: ResolvedConfig,
  transport: Transport
): Promise<boolean> {
  try {
    // Dynamic import — only works if web-vitals is installed
    const wv = await import('web-vitals');

    const report = (name: string, rateFn: (v: number) => string) =>
      (metric: { value: number }): void => {
        transport.send(buildVitalEvent(name, metric.value, rateFn(metric.value)));
        if (config.debug) {
          console.debug(`[VibePing] Vital ${name}:`, metric.value);
        }
      };

    if (wv.onLCP) wv.onLCP(report('LCP', rateLCP));
    if (wv.onFID) wv.onFID(report('FID', rateFID));
    if (wv.onCLS) wv.onCLS(report('CLS', rateCLS));
    if (wv.onTTFB) wv.onTTFB(report('TTFB', rateTTFB));
    if (wv.onINP) wv.onINP(report('INP', rateINP));

    return true;
  } catch {
    return false;
  }
}

/** Fallback: use PerformanceObserver for basic metrics */
function fallbackVitals(
  config: ResolvedConfig,
  transport: Transport
): void {
  if (typeof PerformanceObserver === 'undefined') return;

  // TTFB from navigation timing
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      const ttfb = nav.responseStart - nav.requestStart;
      if (ttfb > 0) {
        transport.send(buildVitalEvent('TTFB', ttfb, rateTTFB(ttfb)));
      }
    }
  } catch {
    // Silently ignore if navigation timing unavailable
  }

  // LCP via PerformanceObserver
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        const value = last.startTime;
        transport.send(buildVitalEvent('LCP', value, rateLCP(value)));
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // LCP observer not supported
  }

  // CLS via PerformanceObserver
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // LayoutShift entries have a 'value' property
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!shift.hadRecentInput && shift.value) {
          clsValue += shift.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Report CLS on visibility hidden
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden' && clsValue > 0) {
          transport.send(buildVitalEvent('CLS', clsValue, rateCLS(clsValue)));
          clsObserver.disconnect();
        }
      },
      { once: true }
    );
  } catch {
    // CLS observer not supported
  }

  if (config.debug) {
    console.debug('[VibePing] Using fallback vitals (web-vitals not found)');
  }
}

/** Create a web vitals tracker */
export function createVitalsTracker(
  config: ResolvedConfig,
  transport: Transport
): VitalsTracker {
  return {
    start(): void {
      if (typeof window === 'undefined') return;

      // Try web-vitals library first, fallback otherwise
      void tryWebVitals(config, transport).then((ok) => {
        if (!ok) {
          fallbackVitals(config, transport);
        } else if (config.debug) {
          console.debug('[VibePing] Web vitals tracking started (web-vitals lib)');
        }
      });
    },
  };
}
