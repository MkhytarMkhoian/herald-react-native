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

// Adjust's calls return nothing, so Herald can't see a failure in the native SDK.

/** One call to Adjust for one event. A factory builds it. */
export interface AdjustEventTracker {
  track(): Promise<void>;
}

/** One call to Adjust for one property. A factory builds it. */
export interface AdjustPropertySetter {
  set(): Promise<void>;
}

/** Sends the event under `eventToken`. The token, not the name, tells Adjust which event it is. */
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

/** Sends ad revenue. It needs no dashboard token. */
export class AdRevenueAdjustEventTracker implements AdjustEventTracker {
  constructor(readonly event: AdjustAdRevenueEvent) {}

  async track(): Promise<void> {
    Adjust.trackAdRevenue(this.event.toAdjustAdRevenue());
  }
}

/**
 * Adds the property, as text, as a global callback parameter, sent with every later event. Don't
 * name a property like the user id's parameter, or it replaces the user id.
 */
export class GenericAdjustPropertySetter implements AdjustPropertySetter {
  constructor(readonly property: Property) {}

  async set(): Promise<void> {
    const value = AnalyticsValue.asString(propertyValueOf(this.property));
    Adjust.addGlobalCallbackParameter(this.property.name, value);
  }
}
