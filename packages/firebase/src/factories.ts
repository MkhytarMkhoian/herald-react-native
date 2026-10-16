import {
  Resolution,
  isScreenView,
  type Event,
  type FallbackFactory,
  type Property,
} from '@herald-analytics/core';
import type { Analytics } from '@react-native-firebase/analytics';

import type { FirebaseEventTrackerFactory, FirebasePropertySetterFactory } from './chain';
import {
  GenericFirebaseEventTracker,
  GenericFirebasePropertySetter,
  ScreenViewFirebaseEventTracker,
  type FirebaseEventTracker,
  type FirebasePropertySetter,
} from './handlers';

/** Logs any event under its own name. It claims everything, so it goes last in a chain. */
export class GenericFirebaseEventTrackerFactory
  implements FirebaseEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  constructor(private readonly analytics: Analytics) {}

  create(event: Event): Resolution<FirebaseEventTracker> {
    return Resolution.claimed([new GenericFirebaseEventTracker(event, this.analytics)]);
  }

  toString(): string {
    return 'GenericFirebaseEventTrackerFactory';
  }
}

/** Sends every screen view as GA4's own `screen_view` event. */
export class ScreenViewFirebaseEventTrackerFactory implements FirebaseEventTrackerFactory {
  constructor(private readonly analytics: Analytics) {}

  create(event: Event): Resolution<FirebaseEventTracker> {
    if (!isScreenView(event)) return Resolution.declined();
    return Resolution.claimed([new ScreenViewFirebaseEventTracker(event, this.analytics)]);
  }
}

/**
 * Sets any property as a Firebase user property, since Firebase has one kind. It claims everything,
 * so it goes last in a chain.
 */
export class GenericFirebasePropertySetterFactory
  implements FirebasePropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  constructor(private readonly analytics: Analytics) {}

  create(property: Property): Resolution<FirebasePropertySetter> {
    return Resolution.claimed([new GenericFirebasePropertySetter(property, this.analytics)]);
  }

  toString(): string {
    return 'GenericFirebasePropertySetterFactory';
  }
}
