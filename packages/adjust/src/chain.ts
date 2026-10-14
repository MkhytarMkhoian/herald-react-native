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

import type { AdjustEventTracker, AdjustPropertySetter } from './handlers';

/**
 * Decides what Adjust gets for an event: claimed with the calls to make, dropped to send nothing,
 * or declined to let the next factory decide.
 */
export interface AdjustEventTrackerFactory {
  create(event: Event): Resolution<AdjustEventTracker>;
}

export interface AdjustPropertySetterFactory {
  create(property: Property): Resolution<AdjustPropertySetter>;
}

/**
 * Asks each factory in order and uses the first answer that isn't a decline. If all decline,
 * nothing is sent. Throws if a fallback factory isn't last.
 */
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

/**
 * Fails for any event that reaches it, so the error reporter shows events nobody mapped. Put it
 * last in a chain.
 */
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

/**
 * Sends events and properties to Adjust, as its factory chains decide. The calls for one event
 * run in order, and if one fails the rest don't run. Anything no factory claims isn't sent.
 */
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
