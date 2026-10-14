import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';

import type { AppsFlyerClient } from './values';

/**
 * AppsFlyer's lifecycle, identity and consent, over `AppsFlyer` once the app has called `init` and
 * `registerSessionReadyListener`.
 *
 * **AppsFlyer starts on consent, not on `start`.** `start` stops AppsFlyer, so a fresh install sends
 * nothing, not even the install, until `setEnabled` turns it on. AppsFlyer forgets both the stop and
 * the user id between launches, so on every cold start call `identify`, then `setEnabled` with the
 * stored answer.
 *
 * Granular consent, such as `setConsentData` or `anonymizeUser`, is set on `AppsFlyer` itself.
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

  /**
   * Does nothing: AppsFlyer can't clear the user id. It forgets it at the next cold start; until
   * then, events still carry it.
   */
  async reset(): Promise<void> {}
}
