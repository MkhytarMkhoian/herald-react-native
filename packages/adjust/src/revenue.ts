import { AdjustAdRevenue, type AdjustEvent } from 'react-native-adjust';
import {
  AnalyticsValue,
  double,
  int,
  parametersOf,
  type Event,
  type EventParameters,
} from '@herald-analytics/core';

import { toAdjustEvent } from './values';

export interface AdjustRevenueEventOptions {
  /** Not sent. Only used in failure reports. */
  readonly name: string;
  readonly revenue: number;
  readonly currency: string;
  /** Makes a purchase sent twice count once. */
  readonly deduplicationId?: string;
  readonly parameters?: EventParameters;
}

/**
 * A purchase, in the fields Adjust's revenue tracking takes.
 *
 * Your events don't extend it: your Adjust factory builds one from your event and sends it with
 * `RevenueAdjustEventTracker`, under the purchase's dashboard token. Throws for a revenue that isn't
 * a finite number.
 */
export class AdjustRevenueEvent implements Event {
  readonly name: string;
  readonly revenue: number;
  readonly currency: string;
  readonly deduplicationId?: string;
  readonly parameters: EventParameters;

  constructor(options: AdjustRevenueEventOptions) {
    double(options.revenue); // throws for NaN or Infinity
    this.name = options.name;
    this.revenue = options.revenue;
    this.currency = options.currency;
    this.deduplicationId = options.deduplicationId;
    this.parameters = options.parameters ?? {};
  }

  toAdjustEvent(eventToken: string): AdjustEvent {
    const adjustEvent = toAdjustEvent(parametersOf(this), eventToken);
    adjustEvent.setRevenue(this.revenue, this.currency);
    if (this.deduplicationId !== undefined) adjustEvent.setDeduplicationId(this.deduplicationId);
    return adjustEvent;
  }

  toString(): string {
    return `AdjustRevenueEvent(${this.name}, ${this.revenue} ${this.currency})`;
  }
}

export interface AdjustAdRevenueEventOptions {
  /** Not sent. Only used in failure reports. */
  readonly name: string;
  /** Such as `applovin_max_sdk` or `admob_sdk`. */
  readonly source: string;
  readonly revenue: number;
  readonly currency: string;
  /** A whole number. */
  readonly adImpressionsCount?: number;
  readonly adRevenueNetwork?: string;
  readonly adRevenueUnit?: string;
  readonly adRevenuePlacement?: string;
  readonly parameters?: EventParameters;
}

/**
 * Ad revenue, in the fields Adjust's ad revenue tracking takes. Built by your Adjust factory and
 * sent with `AdRevenueAdjustEventTracker`. Throws for a revenue that isn't a finite number, or an
 * impression count that isn't whole.
 */
export class AdjustAdRevenueEvent implements Event {
  readonly name: string;
  readonly source: string;
  readonly revenue: number;
  readonly currency: string;
  readonly adImpressionsCount?: number;
  readonly adRevenueNetwork?: string;
  readonly adRevenueUnit?: string;
  readonly adRevenuePlacement?: string;
  readonly parameters: EventParameters;

  constructor(options: AdjustAdRevenueEventOptions) {
    // Called for their checks only: they throw for a wrong number.
    double(options.revenue);
    if (options.adImpressionsCount !== undefined) int(options.adImpressionsCount);
    this.name = options.name;
    this.source = options.source;
    this.revenue = options.revenue;
    this.currency = options.currency;
    this.adImpressionsCount = options.adImpressionsCount;
    this.adRevenueNetwork = options.adRevenueNetwork;
    this.adRevenueUnit = options.adRevenueUnit;
    this.adRevenuePlacement = options.adRevenuePlacement;
    this.parameters = options.parameters ?? {};
  }

  /** Parameters become callback parameters, as text. */
  toAdjustAdRevenue(): AdjustAdRevenue {
    const adRevenue = new AdjustAdRevenue(this.source);
    adRevenue.setRevenue(this.revenue, this.currency);
    if (this.adImpressionsCount !== undefined) {
      adRevenue.setAdImpressionsCount(this.adImpressionsCount);
    }
    if (this.adRevenueNetwork !== undefined) adRevenue.setAdRevenueNetwork(this.adRevenueNetwork);
    if (this.adRevenueUnit !== undefined) adRevenue.setAdRevenueUnit(this.adRevenueUnit);
    if (this.adRevenuePlacement !== undefined) {
      adRevenue.setAdRevenuePlacement(this.adRevenuePlacement);
    }
    for (const [key, value] of Object.entries(parametersOf(this))) {
      adRevenue.addCallbackParameter(key, AnalyticsValue.asString(value));
    }
    return adRevenue;
  }

  toString(): string {
    return `AdjustAdRevenueEvent(${this.name}, ${this.source}, ${this.revenue} ${this.currency})`;
  }
}
