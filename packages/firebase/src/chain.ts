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

/** Decides what Firebase gets for an event. */
export interface FirebaseEventTrackerFactory {
  create(event: Event): Resolution<FirebaseEventTracker>;
}

export interface FirebasePropertySetterFactory {
  create(property: Property): Resolution<FirebasePropertySetter>;
}

/** Asks each factory in order and uses the first that answers. Throws if a fallback isn't last. */
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

/** Fails for any event that reaches it, so the error reporter shows events nobody mapped. */
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

/** Sends events and properties to Firebase, as its factory chains decide. */
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
