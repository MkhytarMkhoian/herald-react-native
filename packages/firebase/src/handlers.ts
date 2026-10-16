import {
  AnalyticsValue,
  parametersOf,
  propertyValueOf,
  type Event,
  type Property,
  type ScreenViewEvent,
} from '@herald-analytics/core';
import { logEvent, setUserProperty, type Analytics } from '@react-native-firebase/analytics';

import { toFirebaseParameters } from './values';

/** One call to Firebase for one event. A factory builds it. */
export interface FirebaseEventTracker {
  track(): Promise<void>;
}

/** One call to Firebase for one property. A factory builds it. */
export interface FirebasePropertySetter {
  set(): Promise<void>;
}

/** Logs the event under its own name. Firebase refuses a reserved or badly formed name. */
export class GenericFirebaseEventTracker implements FirebaseEventTracker {
  constructor(
    readonly event: Event,
    private readonly analytics: Analytics,
  ) {}

  async track(): Promise<void> {
    logEvent(this.analytics, this.event.name, toFirebaseParameters(parametersOf(this.event)));
  }
}

/**
 * Logs the event as GA4's `screen_view`, with its name as `screen_name`. Throws if the event has
 * its own `screen_name` parameter.
 */
export class ScreenViewFirebaseEventTracker implements FirebaseEventTracker {
  constructor(
    readonly event: ScreenViewEvent,
    private readonly analytics: Analytics,
  ) {}

  async track(): Promise<void> {
    const parameters = toFirebaseParameters(parametersOf(this.event));
    if ('screen_name' in parameters) {
      throw new Error(
        `Screen view '${this.event.name}' can't have a 'screen_name' parameter: ` +
          "GA4 uses it for the screen's name",
      );
    }
    logEvent(this.analytics, 'screen_view', { ...parameters, screen_name: this.event.name });
  }
}

/** Sets the property as a Firebase user property, as text: Firebase takes only text there. */
export class GenericFirebasePropertySetter implements FirebasePropertySetter {
  constructor(
    readonly property: Property,
    private readonly analytics: Analytics,
  ) {}

  set(): Promise<void> {
    const value = AnalyticsValue.asString(propertyValueOf(this.property));
    return setUserProperty(this.analytics, this.property.name, value);
  }
}
