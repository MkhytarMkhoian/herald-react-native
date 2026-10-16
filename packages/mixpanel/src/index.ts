/**
 * Sends Herald events and properties to Mixpanel: events, the People profile and super properties.
 *
 * @packageDocumentation
 */

export type {
  MixpanelAnalyticsTrackerServiceOptions,
  MixpanelEventTrackerFactory,
  MixpanelPropertySetterFactory,
} from './chain';
export {
  CompositeMixpanelEventTrackerFactory,
  CompositeMixpanelPropertySetterFactory,
  MixpanelAnalyticsTrackerService,
  RequireMappedMixpanelEventTrackerFactory,
  RequireMappedMixpanelPropertySetterFactory,
} from './chain';
export {
  GenericMixpanelEventTrackerFactory,
  GenericMixpanelPropertySetterFactory,
  ScreenViewMixpanelEventTrackerFactory,
  UserPropertyMixpanelPropertySetterFactory,
} from './factories';
export type { MixpanelEventTracker, MixpanelPropertySetter } from './handlers';
export {
  GenericMixpanelEventTracker,
  GenericMixpanelPropertySetter,
  ScreenViewMixpanelEventTracker,
  UserPropertyMixpanelPropertySetter,
} from './handlers';
export { MixpanelAnalyticsService } from './services';
export { toMixpanelProperties } from './values';
