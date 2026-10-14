import {
  Resolution,
  type Event,
  type FallbackFactory,
  type Property,
} from '@herald-analytics/core';

import type { AdjustEventTrackerFactory, AdjustPropertySetterFactory } from './chain';
import {
  GenericAdjustPropertySetter,
  TokenAdjustEventTracker,
  type AdjustEventTracker,
  type AdjustPropertySetter,
} from './handlers';

/** An event class, such as `SignUpCompleted`. */
export type EventClass = abstract new (...args: never[]) => Event;

/**
 * Claims every event that is an instance of a class in `tokens`, with that class's dashboard
 * token, and declines the rest.
 *
 * ```ts
 * new TokenAdjustEventTrackerFactory([
 *   [SignUpCompleted, 'abc123'],
 *   [CheckoutStarted, 'def456'],
 * ]);
 * ```
 *
 * Events are matched by class, not by name, so the compiler checks the list, and renaming an event
 * can't quietly stop it reaching Adjust. Throws if a class is listed twice.
 *
 * Adjust only knows events created in its dashboard, so there is no generic event factory: an event
 * without a token isn't sent. One token per event; for an event that should count as several Adjust
 * events, write a factory that answers with several `TokenAdjustEventTracker`s and put it before
 * this one.
 */
export class TokenAdjustEventTrackerFactory implements AdjustEventTrackerFactory {
  private readonly tokens: readonly (readonly [EventClass, string])[];

  constructor(tokens: readonly (readonly [EventClass, string])[]) {
    const seen = new Set<EventClass>();
    for (const [eventClass] of tokens) {
      if (typeof eventClass !== 'function') {
        throw new TypeError(
          `Adjust tokens are paired with event classes, not ${JSON.stringify(eventClass)}.`,
        );
      }
      if (seen.has(eventClass)) {
        throw new Error(`${eventClass.name} has two Adjust tokens. Give each event one token.`);
      }
      seen.add(eventClass);
    }
    this.tokens = Object.freeze(tokens.map(([eventClass, token]) => [eventClass, token] as const));
  }

  create(event: Event): Resolution<AdjustEventTracker> {
    const match = this.tokens.find(([eventClass]) => event instanceof eventClass);
    if (match === undefined) return Resolution.declined();
    return Resolution.claimed([new TokenAdjustEventTracker(event, match[1])]);
  }
}

/**
 * Adds any property as a global callback parameter. Adjust has no user profile, so this covers
 * user properties too. Claims everything, so it belongs last in a chain.
 */
export class GenericAdjustPropertySetterFactory
  implements AdjustPropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  create(property: Property): Resolution<AdjustPropertySetter> {
    return Resolution.claimed([new GenericAdjustPropertySetter(property)]);
  }

  toString(): string {
    return 'GenericAdjustPropertySetterFactory';
  }
}
