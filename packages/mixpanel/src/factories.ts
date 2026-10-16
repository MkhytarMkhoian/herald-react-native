import {
  Resolution,
  isScreenView,
  isUserProperty,
  type Event,
  type FallbackFactory,
  type Property,
} from '@herald-analytics/core';
import type { Mixpanel } from 'mixpanel-react-native';

import type { MixpanelEventTrackerFactory, MixpanelPropertySetterFactory } from './chain';
import {
  GenericMixpanelEventTracker,
  GenericMixpanelPropertySetter,
  ScreenViewMixpanelEventTracker,
  UserPropertyMixpanelPropertySetter,
  type MixpanelEventTracker,
  type MixpanelPropertySetter,
} from './handlers';

/** Tracks any event under its own name. It claims everything, so it goes last in a chain. */
export class GenericMixpanelEventTrackerFactory
  implements MixpanelEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  constructor(private readonly mixpanel: Mixpanel) {}

  create(event: Event): Resolution<MixpanelEventTracker> {
    return Resolution.claimed([new GenericMixpanelEventTracker(event, this.mixpanel)]);
  }

  toString(): string {
    return 'GenericMixpanelEventTrackerFactory';
  }
}

/** Sends every screen view as a `screen_view` event. */
export class ScreenViewMixpanelEventTrackerFactory implements MixpanelEventTrackerFactory {
  constructor(private readonly mixpanel: Mixpanel) {}

  create(event: Event): Resolution<MixpanelEventTracker> {
    if (!isScreenView(event)) return Resolution.declined();
    return Resolution.claimed([new ScreenViewMixpanelEventTracker(event, this.mixpanel)]);
  }
}

/**
 * Sets every user property on the People profile. Put it before
 * {@link GenericMixpanelPropertySetterFactory}, or that one takes user properties first.
 */
export class UserPropertyMixpanelPropertySetterFactory implements MixpanelPropertySetterFactory {
  constructor(private readonly mixpanel: Mixpanel) {}

  create(property: Property): Resolution<MixpanelPropertySetter> {
    if (!isUserProperty(property)) return Resolution.declined();
    return Resolution.claimed([new UserPropertyMixpanelPropertySetter(property, this.mixpanel)]);
  }
}

/** Sends every property as a super property. It goes last in a chain. */
export class GenericMixpanelPropertySetterFactory
  implements MixpanelPropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  constructor(private readonly mixpanel: Mixpanel) {}

  create(property: Property): Resolution<MixpanelPropertySetter> {
    return Resolution.claimed([new GenericMixpanelPropertySetter(property, this.mixpanel)]);
  }

  toString(): string {
    return 'GenericMixpanelPropertySetterFactory';
  }
}
