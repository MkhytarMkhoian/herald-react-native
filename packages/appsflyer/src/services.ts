import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';

import type { AppsFlyerClient } from './values';

/**
 * AppsFlyer's start, sign-in and consent, once the app has called `init`.
 *
 * `start` stops AppsFlyer, so nothing is sent until `setEnabled(true)`. AppsFlyer forgets the stop
 * and the user id between launches, so on every launch call `identify`, then `setEnabled` with the
 * stored answer.
 */
export class AppsFlyerAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  constructor(private readonly appsFlyer: AppsFlyerClient) {}

  start(): Promise<void> {
    return this.appsFlyer.stop({ shouldStop: true });
  }

  /** AppsFlyer has no flush API. */
  async flush(): Promise<void> {}

  async setEnabled(enabled: boolean): Promise<void> {
    await this.appsFlyer.stop({ shouldStop: !enabled });
    if (enabled) await this.appsFlyer.start();
  }

  identify(identity: Identity): Promise<void> {
    return this.appsFlyer.setCustomerUserId({ customerId: identity.userId });
  }

  /** Does nothing: AppsFlyer can't clear the user id. It forgets it at the next launch. */
  async reset(): Promise<void> {}
}
