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

// A call is done once Amplitude has the event. Herald doesn't wait for the upload.

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
 * Tracks the event as `[Amplitude] Screen Viewed`, with its name as `[Amplitude] Screen Name`.
 * Throws if the event has its own `[Amplitude] Screen Name` parameter. Don't also track screens
 * with Amplitude itself, or each one counts twice.
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

/** Sends the event through Amplitude's revenue API. */
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
