import { Resolution, type Event, type FallbackFactory } from '@herald-analytics/core';

import type { AppsFlyerEventTrackerFactory } from './chain';
import { GenericAppsFlyerEventTracker, type AppsFlyerEventTracker } from './handlers';
import type { AppsFlyerClient } from './values';

/**
 * Logs any event under its own name with its parameters. Claims everything, so it belongs last in
 * a chain.
 *
 * Most apps leave it out: AppsFlyer is for conversions, each one chosen on purpose, so a chain
 * without a fallback, where only the events a factory handles are sent, is the usual setup.
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
