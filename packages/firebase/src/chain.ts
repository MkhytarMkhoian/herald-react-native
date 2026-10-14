// The factory chain, the same for every vendor: factory interfaces, composites, the
// RequireMapped factories and the tracker service.

import {
  Resolution,
  UnhandledEventError,
  UnhandledPropertyError,
  requireFallbackLast,
  type Event,
  type EventTrackerService,
  type FallbackFactory,
  type Property,
  type PropertyTrackerService,
} from '@herald-analytics/core';

import type { FirebaseEventTracker, FirebasePropertySetter } from './handlers';

/**
 * Decides what Firebase gets for an event: claimed with the calls to make, dropped to send nothing,
 * or declined to let the next factory decide.
 */
export interface FirebaseEventTrackerFactory {
  create(event: Event): Resolution<FirebaseEventTracker>;
}

export interface FirebasePropertySetterFactory {
  create(property: Property): Resolution<FirebasePropertySetter>;
}

/**
 * Asks each factory in order and uses the first answer that isn't a decline. If all decline,
 * nothing is sent. Throws if a fallback factory isn't last.
 */
export class CompositeFirebaseEventTrackerFactory implements FirebaseEventTrackerFactory {
  private readonly factories: readonly FirebaseEventTrackerFactory[];

  constructor(factories: readonly FirebaseEventTrackerFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(event: Event): Resolution<FirebaseEventTracker> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(event));
  }
}

/** Like {@link CompositeFirebaseEventTrackerFactory}, for properties. */
export class CompositeFirebasePropertySetterFactory implements FirebasePropertySetterFactory {
  private readonly factories: readonly FirebasePropertySetterFactory[];

  constructor(factories: readonly FirebasePropertySetterFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(property: Property): Resolution<FirebasePropertySetter> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(property));
  }
}

/**
 * Fails for any event that reaches it, so the error reporter shows events nobody mapped. Put it
 * last in a chain.
 */
export class RequireMappedFirebaseEventTrackerFactory
  implements FirebaseEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  create(event: Event): Resolution<FirebaseEventTracker> {
    throw new UnhandledEventError(event);
  }

  toString(): string {
    return 'RequireMappedFirebaseEventTrackerFactory';
  }
}

export class RequireMappedFirebasePropertySetterFactory
  implements FirebasePropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  create(property: Property): Resolution<FirebasePropertySetter> {
    throw new UnhandledPropertyError(property);
  }

  toString(): string {
    return 'RequireMappedFirebasePropertySetterFactory';
  }
}

export interface FirebaseAnalyticsTrackerServiceOptions {
  readonly eventTrackerFactory: FirebaseEventTrackerFactory;
  readonly propertySetterFactory: FirebasePropertySetterFactory;
}

/**
 * Sends events and properties to Firebase, as its factory chains decide. The calls for one event
 * run in order, and if one fails the rest don't run. Anything no factory claims isn't sent.
 */
export class FirebaseAnalyticsTrackerService
  implements EventTrackerService, PropertyTrackerService
{
  private readonly eventTrackerFactory: FirebaseEventTrackerFactory;
  private readonly propertySetterFactory: FirebasePropertySetterFactory;

  constructor(options: FirebaseAnalyticsTrackerServiceOptions) {
    this.eventTrackerFactory = options.eventTrackerFactory;
    this.propertySetterFactory = options.propertySetterFactory;
  }

  async track(event: Event): Promise<void> {
    for (const handler of this.eventTrackerFactory.create(event).handlers) {
      await handler.track();
    }
  }

  async set(property: Property): Promise<void> {
    for (const handler of this.propertySetterFactory.create(property).handlers) {
      await handler.set();
    }
  }
}
