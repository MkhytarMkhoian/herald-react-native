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

/**
 * Tracks any event under its own name, with its parameters. Claims every event, so it goes last in
 * a chain.
 */
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

/**
 * Claims every screen view as a `screen_view` event and declines everything else. To send screen
 * views differently, put your own factory before this one.
 */
export class ScreenViewMixpanelEventTrackerFactory implements MixpanelEventTrackerFactory {
  constructor(private readonly mixpanel: Mixpanel) {}

  create(event: Event): Resolution<MixpanelEventTracker> {
    if (!isScreenView(event)) return Resolution.declined();
    return Resolution.claimed([new ScreenViewMixpanelEventTracker(event, this.mixpanel)]);
  }
}

/**
 * Claims every user property for the People profile and declines everything else.
 *
 * Put it before {@link GenericMixpanelPropertySetterFactory}: a user property is also a property, so
 * the generic factory would take it first and the profile would never be written.
 */
export class UserPropertyMixpanelPropertySetterFactory implements MixpanelPropertySetterFactory {
  constructor(private readonly mixpanel: Mixpanel) {}

  create(property: Property): Resolution<MixpanelPropertySetter> {
    if (!isUserProperty(property)) return Resolution.declined();
    return Resolution.claimed([new UserPropertyMixpanelPropertySetter(property, this.mixpanel)]);
  }
}

/** Sends every property as a super property. Put it last in the chain. */
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
