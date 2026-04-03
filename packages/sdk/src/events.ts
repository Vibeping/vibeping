/**
 * VibePing SDK — Custom event tracking
 * Provides track() and identify() methods with input validation.
 */

import { EventType } from './types';
import type {
  ResolvedConfig,
  Transport,
  CustomEvent,
  IdentifyEvent,
} from './types';
import { getSessionId } from './tracker';

/** Allowed property value types */
type PropValue = string | number | boolean;

/** Maximum event name length */
const MAX_NAME_LENGTH = 100;

/** Maximum number of property keys */
const MAX_PROP_KEYS = 50;

export interface EventTracker {
  /** Track a named event with optional properties */
  track(name: string, properties?: Record<string, PropValue>): void;
  /** Associate user data with the current session */
  identify(traits: Record<string, PropValue>): void;
}

/** Validate that a value is a valid property type */
function isValidPropValue(val: unknown): val is PropValue {
  return (
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean'
  );
}

/** Validate and sanitize properties object */
function validateProps(
  props: Record<string, unknown>,
  debug: boolean
): Record<string, PropValue> {
  const result: Record<string, PropValue> = {};
  const keys = Object.keys(props);

  if (keys.length > MAX_PROP_KEYS) {
    if (debug) {
      console.warn(
        `[VibePing] Properties exceed ${MAX_PROP_KEYS} keys, truncating`
      );
    }
    keys.length = MAX_PROP_KEYS;
  }

  for (const key of keys) {
    const val = props[key];
    if (isValidPropValue(val)) {
      result[key] = val;
    } else if (debug) {
      console.warn(
        `[VibePing] Property "${key}" has invalid type ${typeof val}, skipping`
      );
    }
  }

  return result;
}

/** Create a custom event tracker */
export function createEventTracker(
  config: ResolvedConfig,
  transport: Transport
): EventTracker {
  return {
    track(name: string, properties?: Record<string, PropValue>): void {
      // Validate event name
      if (typeof name !== 'string' || name.length === 0) {
        if (config.debug) {
          console.warn('[VibePing] Invalid event name, must be a non-empty string');
        }
        return;
      }

      if (name.length > MAX_NAME_LENGTH) {
        if (config.debug) {
          console.warn(
            `[VibePing] Event name exceeds ${MAX_NAME_LENGTH} chars, truncating`
          );
        }
        name = name.slice(0, MAX_NAME_LENGTH);
      }

      const validProps = properties
        ? validateProps(properties as Record<string, unknown>, config.debug)
        : {};

      const event: CustomEvent = {
        type: EventType.Custom,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        url: typeof location !== 'undefined' ? location.href : '',
        name,
        properties: validProps,
      };

      transport.send(event);

      if (config.debug) {
        console.debug('[VibePing] Custom event:', name, validProps);
      }
    },

    identify(traits: Record<string, PropValue>): void {
      if (!traits || typeof traits !== 'object') {
        if (config.debug) {
          console.warn('[VibePing] identify() requires an object');
        }
        return;
      }

      const validTraits = validateProps(
        traits as Record<string, unknown>,
        config.debug
      );

      const event: IdentifyEvent = {
        type: EventType.Identify,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        url: typeof location !== 'undefined' ? location.href : '',
        traits: validTraits,
      };

      transport.send(event);

      if (config.debug) {
        console.debug('[VibePing] Identify:', validTraits);
      }
    },
  };
}
