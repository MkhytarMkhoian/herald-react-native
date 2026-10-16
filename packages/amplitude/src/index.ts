/**
 * Sends Herald events and properties to Amplitude: events, user properties, screen views and
 * revenue.
 *
 * @packageDocumentation
 */

export type {
  AmplitudeAnalyticsTrackerServiceOptions,
  AmplitudeEventTrackerFactory,
  AmplitudePropertySetterFactory,
} from './chain';
export {
  AmplitudeAnalyticsTrackerService,
  CompositeAmplitudeEventTrackerFactory,
  CompositeAmplitudePropertySetterFactory,
  RequireMappedAmplitudeEventTrackerFactory,
  RequireMappedAmplitudePropertySetterFactory,
} from './chain';
export {
  GenericAmplitudeEventTrackerFactory,
  GenericAmplitudePropertySetterFactory,
  ScreenViewAmplitudeEventTrackerFactory,
} from './factories';
export type { AmplitudeEventTracker, AmplitudePropertySetter } from './handlers';
export {
  GenericAmplitudeEventTracker,
  GenericAmplitudePropertySetter,
  RevenueAmplitudeEventTracker,
  ScreenViewAmplitudeEventTracker,
} from './handlers';
export type { AmplitudeRevenueEventOptions } from './revenue';
export { AmplitudeRevenueEvent } from './revenue';
export { AmplitudeAnalyticsService } from './services';
export type { AmplitudeClient } from './values';
export { toAmplitudeProperties } from './values';
