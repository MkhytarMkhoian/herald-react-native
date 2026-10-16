/**
 * Sends Herald events and properties to Firebase Analytics (GA4).
 *
 * @packageDocumentation
 */

export type {
  FirebaseAnalyticsTrackerServiceOptions,
  FirebaseEventTrackerFactory,
  FirebasePropertySetterFactory,
} from './chain';
export {
  CompositeFirebaseEventTrackerFactory,
  CompositeFirebasePropertySetterFactory,
  FirebaseAnalyticsTrackerService,
  RequireMappedFirebaseEventTrackerFactory,
  RequireMappedFirebasePropertySetterFactory,
} from './chain';
export {
  GenericFirebaseEventTrackerFactory,
  GenericFirebasePropertySetterFactory,
  ScreenViewFirebaseEventTrackerFactory,
} from './factories';
export type { FirebaseEventTracker, FirebasePropertySetter } from './handlers';
export {
  GenericFirebaseEventTracker,
  GenericFirebasePropertySetter,
  ScreenViewFirebaseEventTracker,
} from './handlers';
export { FirebaseAnalyticsService } from './services';
export { toFirebaseParameters } from './values';
