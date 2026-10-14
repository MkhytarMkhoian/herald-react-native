import { Adjust } from 'react-native-adjust';
import {
  AnalyticsValue,
  parametersOf,
  propertyValueOf,
  type Event,
  type Property,
} from '@herald-analytics/core';

import type { AdjustAdRevenueEvent, AdjustRevenueEvent } from './revenue';
import { toAdjustEvent } from './values';

// Adjust's calls hand the work to the native SDK and return nothing, so Herald can't see what
// happens after.

/** One call to Adjust for one event. A factory builds it. */
export interface AdjustEventTracker {
  track(): Promise<void>;
}

/** One call to Adjust for one property. A factory builds it. */
export interface AdjustPropertySetter {
  set(): Promise<void>;
}

/** Sends the event under `eventToken`. Its name isn't sent: the token identifies the event. */
export class TokenAdjustEventTracker implements AdjustEventTracker {
  constructor(
    readonly event: Event,
    readonly eventToken: string,
  ) {}

  async track(): Promise<void> {
    Adjust.trackEvent(toAdjustEvent(parametersOf(this.event), this.eventToken));
  }
}

export class RevenueAdjustEventTracker implements AdjustEventTracker {
  constructor(
    readonly event: AdjustRevenueEvent,
    readonly eventToken: string,
  ) {}

  async track(): Promise<void> {
    Adjust.trackEvent(this.event.toAdjustEvent(this.eventToken));
  }
}

/** Sends ad revenue. Unlike events, it needs no dashboard token. */
export class AdRevenueAdjustEventTracker implements AdjustEventTracker {
  constructor(readonly event: AdjustAdRevenueEvent) {}

  async track(): Promise<void> {
    Adjust.trackAdRevenue(this.event.toAdjustAdRevenue());
  }
}

/**
 * Adds the property as a global callback parameter, as text, so Adjust attaches it to every later
 * event.
 *
 * `AdjustAnalyticsService` keeps the user id in the same place, so a property named like its
 * identity parameter overwrites the user id.
 */
export class GenericAdjustPropertySetter implements AdjustPropertySetter {
  constructor(readonly property: Property) {}

  async set(): Promise<void> {
    const value = AnalyticsValue.asString(propertyValueOf(this.property));
    Adjust.addGlobalCallbackParameter(this.property.name, value);
  }
}
