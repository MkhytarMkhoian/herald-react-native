// The factory chain, the same for every vendor: factory interfaces, composites, the
// RequireMapped factories and the tracker service.

import {
  Resolution,
  UnhandledEventError,
  requireFallbackLast,
  type Event,
  type EventTrackerService,
  type FallbackFactory,
} from '@herald-analytics/core';

import type { AppsFlyerEventTracker } from './handlers';

/**
 * Decides what AppsFlyer gets for an event: claimed with the calls to make, dropped to send nothing,
 * or declined to let the next factory decide.
 */
export interface AppsFlyerEventTrackerFactory {
  create(event: Event): Resolution<AppsFlyerEventTracker>;
}

/**
 * Asks each factory in order and uses the first answer that isn't a decline. If all decline,
 * nothing is sent. Throws if a fallback factory isn't last.
 */
export class CompositeAppsFlyerEventTrackerFactory implements AppsFlyerEventTrackerFactory {
  private readonly factories: readonly AppsFlyerEventTrackerFactory[];

  constructor(factories: readonly AppsFlyerEventTrackerFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(event: Event): Resolution<AppsFlyerEventTracker> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(event));
  }
}

/**
 * Fails for any event that reaches it, so the error reporter shows events nobody mapped. Put it
 * last in a chain.
 */
export class RequireMappedAppsFlyerEventTrackerFactory
  implements AppsFlyerEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  create(event: Event): Resolution<AppsFlyerEventTracker> {
    throw new UnhandledEventError(event);
  }

  toString(): string {
    return 'RequireMappedAppsFlyerEventTrackerFactory';
  }
}

export interface AppsFlyerAnalyticsTrackerServiceOptions {
  readonly eventTrackerFactory: AppsFlyerEventTrackerFactory;
}

/**
 * Sends events to AppsFlyer, as its factory chains decide. The calls for one event
 * run in order, and if one fails the rest don't run. Anything no factory claims isn't sent.
 */
export class AppsFlyerAnalyticsTrackerService implements EventTrackerService {
  private readonly eventTrackerFactory: AppsFlyerEventTrackerFactory;

  constructor(options: AppsFlyerAnalyticsTrackerServiceOptions) {
    this.eventTrackerFactory = options.eventTrackerFactory;
  }

  async track(event: Event): Promise<void> {
    for (const handler of this.eventTrackerFactory.create(event).handlers) {
      await handler.track();
    }
  }
}
