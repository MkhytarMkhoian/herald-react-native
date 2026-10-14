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

import type { AmplitudeEventTracker, AmplitudePropertySetter } from './handlers';

/**
 * Decides what Amplitude gets for an event: claimed with the calls to make, dropped to send nothing,
 * or declined to let the next factory decide.
 */
export interface AmplitudeEventTrackerFactory {
  create(event: Event): Resolution<AmplitudeEventTracker>;
}

export interface AmplitudePropertySetterFactory {
  create(property: Property): Resolution<AmplitudePropertySetter>;
}

/**
 * Asks each factory in order and uses the first answer that isn't a decline. If all decline,
 * nothing is sent. Throws if a fallback factory isn't last.
 */
export class CompositeAmplitudeEventTrackerFactory implements AmplitudeEventTrackerFactory {
  private readonly factories: readonly AmplitudeEventTrackerFactory[];

  constructor(factories: readonly AmplitudeEventTrackerFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(event: Event): Resolution<AmplitudeEventTracker> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(event));
  }
}

/** Like {@link CompositeAmplitudeEventTrackerFactory}, for properties. */
export class CompositeAmplitudePropertySetterFactory implements AmplitudePropertySetterFactory {
  private readonly factories: readonly AmplitudePropertySetterFactory[];

  constructor(factories: readonly AmplitudePropertySetterFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(property: Property): Resolution<AmplitudePropertySetter> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(property));
  }
}

/**
 * Fails for any event that reaches it, so the error reporter shows events nobody mapped. Put it
 * last in a chain.
 */
export class RequireMappedAmplitudeEventTrackerFactory
  implements AmplitudeEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  create(event: Event): Resolution<AmplitudeEventTracker> {
    throw new UnhandledEventError(event);
  }

  toString(): string {
    return 'RequireMappedAmplitudeEventTrackerFactory';
  }
}

export class RequireMappedAmplitudePropertySetterFactory
  implements AmplitudePropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  create(property: Property): Resolution<AmplitudePropertySetter> {
    throw new UnhandledPropertyError(property);
  }

  toString(): string {
    return 'RequireMappedAmplitudePropertySetterFactory';
  }
}

export interface AmplitudeAnalyticsTrackerServiceOptions {
  readonly eventTrackerFactory: AmplitudeEventTrackerFactory;
  readonly propertySetterFactory: AmplitudePropertySetterFactory;
}

/**
 * Sends events and properties to Amplitude, as its factory chains decide. The calls for one event
 * run in order, and if one fails the rest don't run. Anything no factory claims isn't sent.
 */
export class AmplitudeAnalyticsTrackerService
  implements EventTrackerService, PropertyTrackerService
{
  private readonly eventTrackerFactory: AmplitudeEventTrackerFactory;
  private readonly propertySetterFactory: AmplitudePropertySetterFactory;

  constructor(options: AmplitudeAnalyticsTrackerServiceOptions) {
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
