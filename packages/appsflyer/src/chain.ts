import {
  Resolution,
  UnhandledEventError,
  requireFallbackLast,
  type Event,
  type EventTrackerService,
  type FallbackFactory,
} from '@herald-analytics/core';

import type { AppsFlyerEventTracker } from './handlers';

/** Decides what AppsFlyer gets for an event. */
export interface AppsFlyerEventTrackerFactory {
  create(event: Event): Resolution<AppsFlyerEventTracker>;
}

/** Asks each factory in order and uses the first that answers. Throws if a fallback isn't last. */
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

/** Fails for any event that reaches it, so the error reporter shows events nobody mapped. */
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

/** Sends events to AppsFlyer, as its factory chains decide. */
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
