import { MEDIATION_NETWORK } from 'react-native-appsflyer';
import { Resolution, double, type Event, type EventParameters } from '@herald-analytics/core';
import {
  AdRevenueAdjustEventTracker,
  AdjustAdRevenueEvent,
  AdjustRevenueEvent,
  RevenueAdjustEventTracker,
  type AdjustEventTracker,
  type AdjustEventTrackerFactory,
} from '@herald-analytics/adjust';
import {
  AmplitudeRevenueEvent,
  RevenueAmplitudeEventTracker,
  type AmplitudeClient,
  type AmplitudeEventTracker,
  type AmplitudeEventTrackerFactory,
} from '@herald-analytics/amplitude';
import {
  AdRevenueAppsFlyerEventTracker,
  AppsFlyerAdRevenueEvent,
  AppsFlyerPurchaseEvent,
  PurchaseAppsFlyerEventTracker,
  type AppsFlyerClient,
  type AppsFlyerEventTracker,
  type AppsFlyerEventTrackerFactory,
} from '@herald-analytics/appsflyer';

// --8<-- [start:purchase]
export class SubscriptionPurchased implements Event {
  // Firebase and Mixpanel log it as it is: GA4's recommended purchase, with typed parameters.
  readonly name = 'purchase';

  constructor(
    readonly plan: string,
    readonly price: number,
    readonly currency: string,
    readonly orderId: string,
  ) {}

  get parameters(): EventParameters {
    return { value: double(this.price), currency: this.currency, plan: this.plan };
  }
}
// --8<-- [end:purchase]

// --8<-- [start:mappings]
// Adjust: the tokened event, plus revenue, counted once per transaction.
function toAdjustRevenueEvent(event: SubscriptionPurchased): AdjustRevenueEvent {
  return new AdjustRevenueEvent({
    name: event.name,
    revenue: event.price,
    currency: event.currency,
    deduplicationId: event.orderId,
    parameters: event.parameters,
  });
}

// AppsFlyer: af_purchase, with the amount under af_revenue.
function toAppsFlyerPurchaseEvent(event: SubscriptionPurchased): AppsFlyerPurchaseEvent {
  return new AppsFlyerPurchaseEvent({
    name: event.name,
    revenue: event.price,
    currency: event.currency,
    contentId: event.plan,
    orderId: event.orderId,
    parameters: event.parameters,
  });
}

// Amplitude: the revenue API, deduplicated by the insert id.
function toAmplitudeRevenueEvent(event: SubscriptionPurchased): AmplitudeRevenueEvent {
  return new AmplitudeRevenueEvent({
    name: event.name,
    price: event.price,
    productId: event.plan,
    currency: event.currency,
    insertId: event.orderId,
    parameters: event.parameters,
  });
}
// --8<-- [end:mappings]

// --8<-- [start:factories]
export class BillingAdjustEventTrackerFactory implements AdjustEventTrackerFactory {
  create(event: Event): Resolution<AdjustEventTracker> {
    if (event instanceof SubscriptionPurchased) {
      return Resolution.claimed([
        new RevenueAdjustEventTracker(toAdjustRevenueEvent(event), 'abc123'),
      ]);
    }
    return Resolution.declined();
  }
}

export class BillingAppsFlyerEventTrackerFactory implements AppsFlyerEventTrackerFactory {
  constructor(private readonly appsFlyer: AppsFlyerClient) {}

  create(event: Event): Resolution<AppsFlyerEventTracker> {
    if (event instanceof SubscriptionPurchased) {
      return Resolution.claimed([
        new PurchaseAppsFlyerEventTracker(toAppsFlyerPurchaseEvent(event), this.appsFlyer),
      ]);
    }
    return Resolution.declined();
  }
}

export class BillingAmplitudeEventTrackerFactory implements AmplitudeEventTrackerFactory {
  constructor(private readonly amplitude: AmplitudeClient) {}

  create(event: Event): Resolution<AmplitudeEventTracker> {
    if (event instanceof SubscriptionPurchased) {
      return Resolution.claimed([
        new RevenueAmplitudeEventTracker(toAmplitudeRevenueEvent(event), this.amplitude),
      ]);
    }
    return Resolution.declined();
  }
}
// --8<-- [end:factories]

// --8<-- [start:ad-impression]
export class AdImpression implements Event {
  readonly name = 'ad_impression';

  constructor(
    readonly revenue: number,
    readonly network: string,
  ) {}

  get parameters(): EventParameters {
    return { network: this.network };
  }

  toAdjustAdRevenueEvent(): AdjustAdRevenueEvent {
    return new AdjustAdRevenueEvent({
      name: this.name,
      source: 'applovin_max_sdk',
      revenue: this.revenue,
      currency: 'USD',
      adRevenueNetwork: this.network,
      parameters: this.parameters,
    });
  }

  toAppsFlyerAdRevenueEvent(): AppsFlyerAdRevenueEvent {
    return new AppsFlyerAdRevenueEvent({
      name: this.name,
      monetizationNetwork: this.network,
      mediationNetwork: MEDIATION_NETWORK.APPLOVIN_MAX,
      revenue: this.revenue,
      currency: 'USD',
      parameters: this.parameters,
    });
  }
}

export class AdsAdjustEventTrackerFactory implements AdjustEventTrackerFactory {
  create(event: Event): Resolution<AdjustEventTracker> {
    if (event instanceof AdImpression) {
      return Resolution.claimed([new AdRevenueAdjustEventTracker(event.toAdjustAdRevenueEvent())]);
    }
    return Resolution.declined();
  }
}

export class AdsAppsFlyerEventTrackerFactory implements AppsFlyerEventTrackerFactory {
  constructor(private readonly appsFlyer: AppsFlyerClient) {}

  create(event: Event): Resolution<AppsFlyerEventTracker> {
    if (event instanceof AdImpression) {
      return Resolution.claimed([
        new AdRevenueAppsFlyerEventTracker(event.toAppsFlyerAdRevenueEvent(), this.appsFlyer),
      ]);
    }
    return Resolution.declined();
  }
}
// --8<-- [end:ad-impression]
