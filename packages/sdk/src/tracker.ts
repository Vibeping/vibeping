/**
 * VibePing SDK — Pageview and session tracker
 * Auto-detects URL changes via popstate and History API monkey-patching.
 * Manages session IDs via sessionStorage.
 */

import { EventType } from './types';
import type { ResolvedConfig, Transport, PageviewEvent, SessionEvent } from './types';

const SESSION_KEY = '__vibeping_sid';
const SESSION_START_KEY = '__vibeping_sstart';

/** Generate a short random ID */
function generateId(): string {
  // Use crypto.randomUUID if available, else fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: random hex string
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Get or create session ID from sessionStorage */
export function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return generateId();

  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = generateId();
    sessionStorage.setItem(SESSION_KEY, sid);
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }
  return sid;
}

/** Get session start timestamp */
function getSessionStart(): number {
  if (typeof sessionStorage === 'undefined') return Date.now();
  const stored = sessionStorage.getItem(SESSION_START_KEY);
  return stored ? parseInt(stored, 10) : Date.now();
}

/** Build a pageview event from current page state */
function buildPageviewEvent(sessionId: string): PageviewEvent {
  return {
    type: EventType.Pageview,
    timestamp: new Date().toISOString(),
    sessionId,
    url: location.href,
    referrer: document.referrer,
    title: document.title,
    screenWidth: screen.width,
    screenHeight: screen.height,
    language: navigator.language,
  };
}

/** Build a session event */
function buildSessionEvent(
  sessionId: string,
  action: 'start' | 'end'
): SessionEvent {
  return {
    type: EventType.Session,
    timestamp: new Date().toISOString(),
    sessionId,
    url: location.href,
    action,
    duration: action === 'end' ? Date.now() - getSessionStart() : 0,
  };
}

export interface Tracker {
  start(): void;
  stop(): void;
}

/** Create a pageview/session tracker */
export function createTracker(config: ResolvedConfig, transport: Transport): Tracker {
  let lastUrl = '';
  let sessionId = '';
  const cleanupFns: Array<() => void> = [];

  // Original History methods (saved for monkey-patch cleanup)
  const origPushState = history.pushState.bind(history);
  const origReplaceState = history.replaceState.bind(history);

  /** Track a pageview if URL actually changed */
  function onUrlChange(): void {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    // Small delay to let title update (SPA routers often set title after nav)
    setTimeout(() => {
      transport.send(buildPageviewEvent(sessionId));
      if (config.debug) {
        console.debug('[VibePing] Pageview:', currentUrl);
      }
    }, 50);
  }

  function start(): void {
    if (typeof window === 'undefined') return;

    sessionId = getSessionId();
    lastUrl = location.href;

    // Send session start + initial pageview
    transport.send(buildSessionEvent(sessionId, 'start'));
    transport.send(buildPageviewEvent(sessionId));

    // Listen for popstate (back/forward navigation)
    const onPopState = (): void => onUrlChange();
    window.addEventListener('popstate', onPopState);
    cleanupFns.push(() => window.removeEventListener('popstate', onPopState));

    // Monkey-patch pushState and replaceState for SPA navigation detection
    history.pushState = function (
      ...args: Parameters<typeof history.pushState>
    ): void {
      origPushState(...args);
      onUrlChange();
    };

    history.replaceState = function (
      ...args: Parameters<typeof history.replaceState>
    ): void {
      origReplaceState(...args);
      onUrlChange();
    };

    cleanupFns.push(() => {
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
    });

    // Send session end on page unload
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        transport.send(buildSessionEvent(sessionId, 'end'));
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    cleanupFns.push(() =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
    );

    if (config.debug) {
      console.debug('[VibePing] Tracker started, session:', sessionId);
    }
  }

  function stop(): void {
    for (const fn of cleanupFns) fn();
    cleanupFns.length = 0;
  }

  return { start, stop };
}
