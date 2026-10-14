import {
  Resolution,
  isScreenView,
  type Event,
  type FallbackFactory,
  type Property,
} from '@herald-analytics/core';

import type { AmplitudeEventTrackerFactory, AmplitudePropertySetterFactory } from './chain';
import {
  GenericAmplitudeEventTracker,
  GenericAmplitudePropertySetter,
  ScreenViewAmplitudeEventTracker,
  type AmplitudeEventTracker,
  type AmplitudePropertySetter,
} from './handlers';
import type { AmplitudeClient } from './values';

/**
 * Tracks any event under its own name, with its parameters. Claims every event, so it goes last in
 * a chain.
 */
export class GenericAmplitudeEventTrackerFactory
  implements AmplitudeEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  constructor(private readonly amplitude: AmplitudeClient) {}

  create(event: Event): Resolution<AmplitudeEventTracker> {
    return Resolution.claimed([new GenericAmplitudeEventTracker(event, this.amplitude)]);
  }

  toString(): string {
    return 'GenericAmplitudeEventTrackerFactory';
  }
}

/**
 * Claims every screen view as `[Amplitude] Screen Viewed` and declines everything else. To send
 * screen views differently, put your own factory before this one.
 */
export class ScreenViewAmplitudeEventTrackerFactory implements AmplitudeEventTrackerFactory {
  constructor(private readonly amplitude: AmplitudeClient) {}

  create(event: Event): Resolution<AmplitudeEventTracker> {
    if (!isScreenView(event)) return Resolution.declined();
    return Resolution.claimed([new ScreenViewAmplitudeEventTracker(event, this.amplitude)]);
  }
}

/**
 * Sets any property as an Amplitude user property, user properties included: Amplitude has one
 * kind of property. Claims every property, so it goes last in a chain.
 */
export class GenericAmplitudePropertySetterFactory
  implements AmplitudePropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  constructor(private readonly amplitude: AmplitudeClient) {}

  create(property: Property): Resolution<AmplitudePropertySetter> {
    return Resolution.claimed([new GenericAmplitudePropertySetter(property, this.amplitude)]);
  }

  toString(): string {
    return 'GenericAmplitudePropertySetterFactory';
  }
}
