import {
  parametersOf,
  propertyValueOf,
  type Event,
  type Property,
  type ScreenViewEvent,
  type UserProperty,
} from '@herald-analytics/core';
import type { Mixpanel } from 'mixpanel-react-native';

import { toMixpanelProperties } from './values';

/** One call to Mixpanel for one event. A factory builds it. */
export interface MixpanelEventTracker {
  track(): Promise<void>;
}

/** One call to Mixpanel for one property. A factory builds it. */
export interface MixpanelPropertySetter {
  set(): Promise<void>;
}

export class GenericMixpanelEventTracker implements MixpanelEventTracker {
  constructor(
    readonly event: Event,
    private readonly mixpanel: Mixpanel,
  ) {}

  async track(): Promise<void> {
    this.mixpanel.track(this.event.name, toMixpanelProperties(parametersOf(this.event)));
  }
}

/**
 * Tracks the event as `screen_view`, with its name as `screen_name`, as GA4 does: Mixpanel has no
 * screen event of its own. Throws if the event has its own `screen_name` parameter.
 */
export class ScreenViewMixpanelEventTracker implements MixpanelEventTracker {
  constructor(
    readonly event: ScreenViewEvent,
    private readonly mixpanel: Mixpanel,
  ) {}

  async track(): Promise<void> {
    const properties = toMixpanelProperties(parametersOf(this.event));
    if ('screen_name' in properties) {
      throw new Error(
        `Screen view '${this.event.name}' can't have a 'screen_name' parameter: ` +
          "it holds the screen's name",
      );
    }
    this.mixpanel.track('screen_view', { ...properties, screen_name: this.event.name });
  }
}

/** Registers the property as a super property, sent with every later event. */
export class GenericMixpanelPropertySetter implements MixpanelPropertySetter {
  constructor(
    readonly property: Property,
    private readonly mixpanel: Mixpanel,
  ) {}

  async set(): Promise<void> {
    this.mixpanel.registerSuperProperties({
      [this.property.name]: propertyValueOf(this.property).value,
    });
  }
}

/** Sets the property on the user's People profile. */
export class UserPropertyMixpanelPropertySetter implements MixpanelPropertySetter {
  constructor(
    readonly property: UserProperty,
    private readonly mixpanel: Mixpanel,
  ) {}

  async set(): Promise<void> {
    this.mixpanel.getPeople().set(this.property.name, propertyValueOf(this.property).value);
  }
}
