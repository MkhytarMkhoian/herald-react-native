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

import type { AdjustEventTracker, AdjustPropertySetter } from './handlers';

/** Decides what Adjust gets for an event. */
export interface AdjustEventTrackerFactory {
  create(event: Event): Resolution<AdjustEventTracker>;
}

export interface AdjustPropertySetterFactory {
  create(property: Property): Resolution<AdjustPropertySetter>;
}

/** Asks each factory in order and uses the first that answers. Throws if a fallback isn't last. */
export class CompositeAdjustEventTrackerFactory implements AdjustEventTrackerFactory {
  private readonly factories: readonly AdjustEventTrackerFactory[];

  constructor(factories: readonly AdjustEventTrackerFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(event: Event): Resolution<AdjustEventTracker> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(event));
  }
}

/** Like {@link CompositeAdjustEventTrackerFactory}, for properties. */
export class CompositeAdjustPropertySetterFactory implements AdjustPropertySetterFactory {
  private readonly factories: readonly AdjustPropertySetterFactory[];

  constructor(factories: readonly AdjustPropertySetterFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(property: Property): Resolution<AdjustPropertySetter> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(property));
  }
}

/** Fails for any event that reaches it, so the error reporter shows events nobody mapped. */
export class RequireMappedAdjustEventTrackerFactory
  implements AdjustEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  create(event: Event): Resolution<AdjustEventTracker> {
    throw new UnhandledEventError(event);
  }

  toString(): string {
    return 'RequireMappedAdjustEventTrackerFactory';
  }
}

export class RequireMappedAdjustPropertySetterFactory
  implements AdjustPropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  create(property: Property): Resolution<AdjustPropertySetter> {
    throw new UnhandledPropertyError(property);
  }

  toString(): string {
    return 'RequireMappedAdjustPropertySetterFactory';
  }
}

export interface AdjustAnalyticsTrackerServiceOptions {
  readonly eventTrackerFactory: AdjustEventTrackerFactory;
  readonly propertySetterFactory: AdjustPropertySetterFactory;
}

/** Sends events and properties to Adjust, as its factory chains decide. */
export class AdjustAnalyticsTrackerService implements EventTrackerService, PropertyTrackerService {
  private readonly eventTrackerFactory: AdjustEventTrackerFactory;
  private readonly propertySetterFactory: AdjustPropertySetterFactory;

  constructor(options: AdjustAnalyticsTrackerServiceOptions) {
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
