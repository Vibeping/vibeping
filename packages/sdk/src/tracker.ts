import type { VibePingEvent, ResolvedConfig } from './types.js';
import type { Transport } from './transport.js';

/**
 * Pageview and session tracker.
 * Auto-detects SPA navigation (History API, React Router, etc.)
 */
export class Tracker {
  private config: ResolvedConfig;
  private transport: Transport;
  private sessionId: string;
  private currentUrl: string = '';
  private cleanupFns: Array<() => void> = [];

  constructor(config: ResolvedConfig, transport: Transport) {
    this.config = config;
    this.transport = transport;
    this.sessionId = this.getOrCreateSession();
  }

  /** Get the current session ID */
  getSessionId(): string {
    return this.sessionId;
  }

  /** Start tracking pageviews and sessions */
  start(): void {
    if (typeof window === 'undefined') return;

    // Track initial pageview
    this.trackPageview();

    // Listen for SPA navigation via History API
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      originalPushState(...args);
      this.onNavigation();
    };

    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      originalReplaceState(...args);
      this.onNavigation();
    };

    // Listen for popstate (back/forward)
    const onPopState = () => this.onNavigation();
    window.addEventListener('popstate', onPopState);

    this.cleanupFns.push(() => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', onPopState);
    });

    // Track session start
    this.sendEvent('session_start', {});
  }

  /** Stop tracking */
  stop(): void {
    this.sendEvent('session_end', {});
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }

  /** Handle SPA navigation */
  private onNavigation(): void {
    // Debounce — only track if URL actually changed
    const newUrl = window.location.href;
    if (newUrl === this.currentUrl) return;

    // Small delay to let the page settle (React Router, etc.)
    setTimeout(() => this.trackPageview(), 50);
  }

  /** Track a pageview */
  private trackPageview(): void {
    const url = window.location.href;
    if (url === this.currentUrl) return;

    this.currentUrl = url;

    this.sendEvent('pageview', {
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      title: document.title,
    });
  }

  /** Send a tracking event */
  private sendEvent(type: VibePingEvent['type'], properties: Record<string, unknown>): void {
    this.transport.enqueue({
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      properties,
    });
  }

  /** Get or create a session ID from sessionStorage */
  private getOrCreateSession(): string {
    const key = '__vibeping_sid';
    try {
      let sid = sessionStorage.getItem(key);
      if (!sid) {
        sid = this.generateId();
        sessionStorage.setItem(key, sid);
      }
      return sid;
    } catch {
      return this.generateId();
    }
  }

  /** Generate a random session ID */
  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
  }
}
