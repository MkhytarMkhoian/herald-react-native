/**
 * A Herald vendor that prints every call, for debug builds.
 *
 * @packageDocumentation
 */

export type { LogEventTrackerFactory, LogPropertySetterFactory } from './factories';
export {
  CompositeLogEventTrackerFactory,
  CompositeLogPropertySetterFactory,
  GenericLogEventTrackerFactory,
  GenericLogPropertySetterFactory,
  RequireMappedLogEventTrackerFactory,
  RequireMappedLogPropertySetterFactory,
  ScreenViewLogEventTrackerFactory,
} from './factories';
export type { AnalyticsLogger, LogEventTracker, LogPropertySetter } from './handlers';
export {
  GenericLogEventTracker,
  GenericLogPropertySetter,
  ScreenViewLogEventTracker,
} from './handlers';
export type { LogAnalyticsTrackerServiceOptions } from './services';
export { LogAnalyticsService, LogAnalyticsTrackerService } from './services';
