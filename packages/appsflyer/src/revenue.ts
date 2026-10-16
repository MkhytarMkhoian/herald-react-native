import {
  double,
  int,
  parametersOf,
  type Event,
  type EventParameters,
} from '@herald-analytics/core';

import { toAppsFlyerEventValues } from './values';

export interface AppsFlyerPurchaseEventOptions {
  /** Not sent. Only used in failure reports. */
  readonly name: string;
  readonly revenue: number;
  readonly currency: string;
  readonly contentId?: string;
  readonly contentType?: string;
  /** A whole number. */
  readonly quantity?: number;
  /** Sent as `af_order_id`. Makes a purchase sent twice count once. */
  readonly orderId?: string;
  /** Sent with the values above. Don't use their keys. */
  readonly parameters?: EventParameters;
}

/**
 * A purchase, sent as `af_purchase` with its revenue in `af_revenue`. Your factory builds one from
 * your event and sends it with `PurchaseAppsFlyerEventTracker`. Throws for a bad number.
 */
export class AppsFlyerPurchaseEvent implements Event {
  readonly name: string;
  readonly revenue: number;
  readonly currency: string;
  readonly contentId?: string;
  readonly contentType?: string;
  readonly quantity?: number;
  readonly orderId?: string;
  readonly parameters: EventParameters;

  constructor(options: AppsFlyerPurchaseEventOptions) {
    // Only to check the numbers: they throw for a bad one.
    double(options.revenue);
    if (options.quantity !== undefined) int(options.quantity);
    this.name = options.name;
    this.revenue = options.revenue;
    this.currency = options.currency;
    this.contentId = options.contentId;
    this.contentType = options.contentType;
    this.quantity = options.quantity;
    this.orderId = options.orderId;
    this.parameters = options.parameters ?? {};
  }

  /** The values AppsFlyer receives. Throws if a parameter uses a key this purchase sets. */
  toAppsFlyerEventValues(): Record<string, string | number | boolean> {
    const values: Record<string, string | number> = {
      af_revenue: this.revenue,
      af_currency: this.currency,
    };
    if (this.contentId !== undefined) values.af_content_id = this.contentId;
    if (this.contentType !== undefined) values.af_content_type = this.contentType;
    if (this.quantity !== undefined) values.af_quantity = this.quantity;
    if (this.orderId !== undefined) values.af_order_id = this.orderId;
    return withParameters(this, values);
  }

  toString(): string {
    return `AppsFlyerPurchaseEvent(${this.name}, ${this.revenue} ${this.currency})`;
  }
}

export interface AppsFlyerSubscribeEventOptions {
  /** Not sent. Only used in failure reports. */
  readonly name: string;
  readonly revenue: number;
  readonly currency: string;
  /** Sent with the values above. Don't use their keys. */
  readonly parameters?: EventParameters;
}

/**
 * A subscription, sent as `af_subscribe` with its revenue in `af_revenue`, by
 * `SubscribeAppsFlyerEventTracker`. Throws for a bad number.
 */
export class AppsFlyerSubscribeEvent implements Event {
  readonly name: string;
  readonly revenue: number;
  readonly currency: string;
  readonly parameters: EventParameters;

  constructor(options: AppsFlyerSubscribeEventOptions) {
    double(options.revenue); // throws for NaN or Infinity
    this.name = options.name;
    this.revenue = options.revenue;
    this.currency = options.currency;
    this.parameters = options.parameters ?? {};
  }

  /** The values AppsFlyer receives. Throws if a parameter uses a key this subscription sets. */
  toAppsFlyerEventValues(): Record<string, string | number | boolean> {
    return withParameters(this, { af_revenue: this.revenue, af_currency: this.currency });
  }

  toString(): string {
    return `AppsFlyerSubscribeEvent(${this.name}, ${this.revenue} ${this.currency})`;
  }
}

export interface AppsFlyerAdRevenueEventOptions {
  /** Not sent. Only used in failure reports. */
  readonly name: string;
  readonly monetizationNetwork: string;
  /** One of AppsFlyer's `MEDIATION_NETWORK` values, such as `MEDIATION_NETWORK.GOOGLE_ADMOB`. */
  readonly mediationNetwork: string;
  readonly revenue: number;
  readonly currency: string;
  readonly parameters?: EventParameters;
}

/** Ad revenue, sent by `AdRevenueAppsFlyerEventTracker`. Throws for a bad number. */
export class AppsFlyerAdRevenueEvent implements Event {
  readonly name: string;
  readonly monetizationNetwork: string;
  readonly mediationNetwork: string;
  readonly revenue: number;
  readonly currency: string;
  readonly parameters: EventParameters;

  constructor(options: AppsFlyerAdRevenueEventOptions) {
    double(options.revenue); // throws for NaN or Infinity
    this.name = options.name;
    this.monetizationNetwork = options.monetizationNetwork;
    this.mediationNetwork = options.mediationNetwork;
    this.revenue = options.revenue;
    this.currency = options.currency;
    this.parameters = options.parameters ?? {};
  }

  toString(): string {
    return `AppsFlyerAdRevenueEvent(${this.name}, ${this.revenue} ${this.currency})`;
  }
}

/** The event's parameters plus `values`. Throws if a parameter would be overwritten. */
function withParameters(
  event: Event,
  values: Record<string, string | number>,
): Record<string, string | number | boolean> {
  const parameters = toAppsFlyerEventValues(parametersOf(event));
  for (const key of Object.keys(parameters)) {
    if (key in values)
      throw new Error(`${event} can't have a '${key}' parameter: it sets that key itself`);
  }
  return { ...parameters, ...values };
}
