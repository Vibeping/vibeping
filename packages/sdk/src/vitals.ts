import type { VibePingEvent, ResolvedConfig, VitalMetric } from './types.js';
import type { Transport } from './transport.js';

/**
 * Web Vitals collector — measures LCP, FID, CLS, FCP, TTFB, INP.
 * Uses the web-vitals library if available (optional peer dep).
 */
export class VitalsCollector {
  private config: ResolvedConfig;
  private transport: Transport;
  private sessionId: string;

  constructor(config: ResolvedConfig, transport: Transport, sessionId: string) {
    this.config = config;
    this.transport = transport;
    this.sessionId = sessionId;
  }

  /** Start collecting web vitals */
  async start(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Dynamically import web-vitals (optional peer dependency)
      const webVitals = await import('web-vitals');

      if (webVitals.onLCP) webVitals.onLCP((metric) => this.reportMetric(metric));
      if (webVitals.onFID) webVitals.onFID((metric) => this.reportMetric(metric));
      if (webVitals.onCLS) webVitals.onCLS((metric) => this.reportMetric(metric));
      if (webVitals.onFCP) webVitals.onFCP((metric) => this.reportMetric(metric));
      if (webVitals.onTTFB) webVitals.onTTFB((metric) => this.reportMetric(metric));
      if (webVitals.onINP) webVitals.onINP((metric) => this.reportMetric(metric));

      if (this.config.debug) {
        console.log('[VibePing] Web vitals tracking enabled');
      }
    } catch {
      if (this.config.debug) {
        console.log('[VibePing] web-vitals not installed, skipping vitals collection');
      }
    }
  }

  /** Report a web vital metric */
  private reportMetric(metric: { name: string; value: number; rating: string; delta: number }): void {
    const vital: VitalMetric = {
      name: metric.name as VitalMetric['name'],
      value: metric.value,
      rating: metric.rating as VitalMetric['rating'],
      delta: metric.delta,
    };

    const event: VibePingEvent = {
      type: 'vital',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      properties: vital,
    };

    this.transport.enqueue(event);

    if (this.config.debug) {
      console.log(`[VibePing] Vital ${vital.name}:`, vital.value, `(${vital.rating})`);
    }
  }
}
