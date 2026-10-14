import { Identify } from '@amplitude/analytics-react-native';
import {
  parametersOf,
  propertyValueOf,
  type Event,
  type Property,
  type ScreenViewEvent,
} from '@herald-analytics/core';

import type { AmplitudeRevenueEvent } from './revenue';
import { toAmplitudeProperties, type AmplitudeClient } from './values';

// Amplitude reports how an upload went later, through its own logger. Herald doesn't wait for the
// upload, as on the other platforms: a call is done once Amplitude has the event.

/** One call to Amplitude for one event. A factory builds it. */
export interface AmplitudeEventTracker {
  track(): Promise<void>;
}

/** One call to Amplitude for one property. A factory builds it. */
export interface AmplitudePropertySetter {
  set(): Promise<void>;
}

export class GenericAmplitudeEventTracker implements AmplitudeEventTracker {
  constructor(
    readonly event: Event,
    private readonly amplitude: AmplitudeClient,
  ) {}

  async track(): Promise<void> {
    this.amplitude.track(this.event.name, toAmplitudeProperties(parametersOf(this.event)));
  }
}

const screenViewedEvent = '[Amplitude] Screen Viewed';
const screenNameProperty = '[Amplitude] Screen Name';

/**
 * Tracks the event as Amplitude's own `[Amplitude] Screen Viewed`, with its name as
 * `[Amplitude] Screen Name`.
 *
 * Don't also send Amplitude's own screen views (`trackScreenView` or
 * `trackScreenViewOnNavigationStateChange`), or every screen is counted twice.
 *
 * Throws if the event has its own `[Amplitude] Screen Name` parameter, because it would replace the
 * screen's name.
 */
export class ScreenViewAmplitudeEventTracker implements AmplitudeEventTracker {
  constructor(
    readonly event: ScreenViewEvent,
    private readonly amplitude: AmplitudeClient,
  ) {}

  async track(): Promise<void> {
    const properties = toAmplitudeProperties(parametersOf(this.event));
    if (screenNameProperty in properties) {
      throw new Error(
        `Screen view '${this.event.name}' can't have a '${screenNameProperty}' parameter: ` +
          "it holds the screen's name",
      );
    }
    this.amplitude.track(screenViewedEvent, {
      ...properties,
      [screenNameProperty]: this.event.name,
    });
  }
}

/**
 * Sends the event through Amplitude's revenue API. Its `insertId` goes as an event option, since
 * Amplitude's revenue type has no field for it.
 */
export class RevenueAmplitudeEventTracker implements AmplitudeEventTracker {
  constructor(
    readonly event: AmplitudeRevenueEvent,
    private readonly amplitude: AmplitudeClient,
  ) {}

  async track(): Promise<void> {
    const insertId = this.event.insertId;
    this.amplitude.revenue(
      this.event.toAmplitudeRevenue(),
      insertId === undefined ? undefined : { insert_id: insertId },
    );
  }
}

export class GenericAmplitudePropertySetter implements AmplitudePropertySetter {
  constructor(
    readonly property: Property,
    private readonly amplitude: AmplitudeClient,
  ) {}

  async set(): Promise<void> {
    const value = propertyValueOf(this.property).value;
    this.amplitude.identify(new Identify().set(this.property.name, value));
  }
}
