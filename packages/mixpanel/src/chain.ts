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

import type { MixpanelEventTracker, MixpanelPropertySetter } from './handlers';

/**
 * Decides what Mixpanel gets for an event: claimed with the calls to make, dropped to send nothing,
 * or declined to let the next factory decide.
 */
export interface MixpanelEventTrackerFactory {
  create(event: Event): Resolution<MixpanelEventTracker>;
}

export interface MixpanelPropertySetterFactory {
  create(property: Property): Resolution<MixpanelPropertySetter>;
}

/**
 * Asks each factory in order and uses the first answer that isn't a decline. If all decline,
 * nothing is sent. Throws if a fallback factory isn't last.
 */
export class CompositeMixpanelEventTrackerFactory implements MixpanelEventTrackerFactory {
  private readonly factories: readonly MixpanelEventTrackerFactory[];

  constructor(factories: readonly MixpanelEventTrackerFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(event: Event): Resolution<MixpanelEventTracker> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(event));
  }
}

/** Like {@link CompositeMixpanelEventTrackerFactory}, for properties. */
export class CompositeMixpanelPropertySetterFactory implements MixpanelPropertySetterFactory {
  private readonly factories: readonly MixpanelPropertySetterFactory[];

  constructor(factories: readonly MixpanelPropertySetterFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(property: Property): Resolution<MixpanelPropertySetter> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(property));
  }
}

/**
 * Fails for any event that reaches it, so the error reporter shows events nobody mapped. Put it
 * last in a chain.
 */
export class RequireMappedMixpanelEventTrackerFactory
  implements MixpanelEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  create(event: Event): Resolution<MixpanelEventTracker> {
    throw new UnhandledEventError(event);
  }

  toString(): string {
    return 'RequireMappedMixpanelEventTrackerFactory';
  }
}

export class RequireMappedMixpanelPropertySetterFactory
  implements MixpanelPropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  create(property: Property): Resolution<MixpanelPropertySetter> {
    throw new UnhandledPropertyError(property);
  }

  toString(): string {
    return 'RequireMappedMixpanelPropertySetterFactory';
  }
}

export interface MixpanelAnalyticsTrackerServiceOptions {
  readonly eventTrackerFactory: MixpanelEventTrackerFactory;
  readonly propertySetterFactory: MixpanelPropertySetterFactory;
}

/**
 * Sends events and properties to Mixpanel, as its factory chains decide. The calls for one event
 * run in order, and if one fails the rest don't run. Anything no factory claims isn't sent.
 */
export class MixpanelAnalyticsTrackerService
  implements EventTrackerService, PropertyTrackerService
{
  private readonly eventTrackerFactory: MixpanelEventTrackerFactory;
  private readonly propertySetterFactory: MixpanelPropertySetterFactory;

  constructor(options: MixpanelAnalyticsTrackerServiceOptions) {
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
