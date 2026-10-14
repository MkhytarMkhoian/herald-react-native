import { parametersOf, type Event } from '@herald-analytics/core';

import type {
  AppsFlyerAdRevenueEvent,
  AppsFlyerPurchaseEvent,
  AppsFlyerSubscribeEvent,
} from './revenue';
import { toAppsFlyerEventValues, type AppsFlyerClient } from './values';

// AppsFlyer's calls settle once the event is queued, not when it's delivered.

/** One call to AppsFlyer for one event. A factory builds it. */
export interface AppsFlyerEventTracker {
  track(): Promise<void>;
}

export class GenericAppsFlyerEventTracker implements AppsFlyerEventTracker {
  constructor(
    readonly event: Event,
    private readonly appsFlyer: AppsFlyerClient,
  ) {}

  track(): Promise<void> {
    return this.appsFlyer.logEvent({
      eventName: this.event.name,
      eventValues: toAppsFlyerEventValues(parametersOf(this.event)),
    });
  }
}

export class PurchaseAppsFlyerEventTracker implements AppsFlyerEventTracker {
  constructor(
    readonly event: AppsFlyerPurchaseEvent,
    private readonly appsFlyer: AppsFlyerClient,
  ) {}

  async track(): Promise<void> {
    const eventValues = this.event.toAppsFlyerEventValues();
    await this.appsFlyer.logEvent({ eventName: 'af_purchase', eventValues });
  }
}

export class SubscribeAppsFlyerEventTracker implements AppsFlyerEventTracker {
  constructor(
    readonly event: AppsFlyerSubscribeEvent,
    private readonly appsFlyer: AppsFlyerClient,
  ) {}

  async track(): Promise<void> {
    const eventValues = this.event.toAppsFlyerEventValues();
    await this.appsFlyer.logEvent({ eventName: 'af_subscribe', eventValues });
  }
}

export class AdRevenueAppsFlyerEventTracker implements AppsFlyerEventTracker {
  constructor(
    readonly event: AppsFlyerAdRevenueEvent,
    private readonly appsFlyer: AppsFlyerClient,
  ) {}

  track(): Promise<void> {
    return this.appsFlyer.logAdRevenue({
      monetizationNetwork: this.event.monetizationNetwork,
      mediationNetwork: this.event.mediationNetwork,
      currencyIso4217Code: this.event.currency,
      revenue: this.event.revenue,
      additionalParameters: toAppsFlyerEventValues(parametersOf(this.event)),
    });
  }
}
