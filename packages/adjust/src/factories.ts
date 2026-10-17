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
 * The Adjust dashboard token for events of one class, or of a subclass of it:
 * `new AdjustToken(SignUpCompleted, 'abc123')`.
 */
export class AdjustToken {
  constructor(
    readonly eventClass: EventClass,
    readonly token: string,
  ) {
    if (typeof eventClass !== 'function') {
      throw new TypeError(
        `An Adjust token is for an event class, not ${JSON.stringify(eventClass)}.`,
      );
    }
  }

  /** Whether `event` is of this token's class, or of a subclass of it. */
  matches(event: Event): boolean {
    return event instanceof this.eventClass;
  }

  toString(): string {
    return `AdjustToken(${this.eventClass.name}, ${this.token})`;
  }
}

/**
 * Sends each event that has a token in `tokens` under that token, and declines the rest:
 * `new TokenAdjustEventTrackerFactory([new AdjustToken(SignUpCompleted, 'abc123')])`.
 *
 * Events are matched by class, not by name, so a renamed event keeps its token. Throws if a class
 * is listed twice.
 */
export class TokenAdjustEventTrackerFactory implements AdjustEventTrackerFactory {
  private readonly tokens: readonly AdjustToken[];

  constructor(tokens: readonly AdjustToken[]) {
    const seen = new Set<EventClass>();
    for (const token of tokens) {
      if (seen.has(token.eventClass)) {
        throw new Error(
          `${token.eventClass.name} has two Adjust tokens. Give each event one token.`,
        );
      }
      seen.add(token.eventClass);
    }
    this.tokens = Object.freeze([...tokens]);
  }

  create(event: Event): Resolution<AdjustEventTracker> {
    const match = this.tokens.find((token) => token.matches(event));
    if (match === undefined) return Resolution.declined();
    return Resolution.claimed([new TokenAdjustEventTracker(event, match.token)]);
  }
}

/**
 * Adds any property as a global callback parameter, since Adjust has no user profile. It claims
 * everything, so it goes last in a chain.
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
