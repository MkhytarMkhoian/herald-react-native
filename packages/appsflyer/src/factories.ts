import { Resolution, type Event, type FallbackFactory } from '@herald-analytics/core';

import type { AppsFlyerEventTrackerFactory } from './chain';
import { GenericAppsFlyerEventTracker, type AppsFlyerEventTracker } from './handlers';
import type { AppsFlyerClient } from './values';

/**
 * Logs any event under its own name. It claims everything, so it goes last in a chain. Most apps
 * leave it out and send AppsFlyer only their chosen conversions.
 */
export class GenericAppsFlyerEventTrackerFactory
  implements AppsFlyerEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  constructor(private readonly appsFlyer: AppsFlyerClient) {}

  create(event: Event): Resolution<AppsFlyerEventTracker> {
    return Resolution.claimed([new GenericAppsFlyerEventTracker(event, this.appsFlyer)]);
  }

  toString(): string {
    return 'GenericAppsFlyerEventTrackerFactory';
  }
}
