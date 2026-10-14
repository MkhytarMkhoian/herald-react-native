/**
 * A Herald vendor that prints every call, for debug builds.
 *
 * ```ts
 * const logger: AnalyticsLogger = (message) => console.log(message);
 * const logTracker = new LogAnalyticsTrackerService({
 *   eventTrackerFactory: new CompositeLogEventTrackerFactory([
 *     new ScreenViewLogEventTrackerFactory(logger),
 *     new GenericLogEventTrackerFactory(logger),
 *   ]),
 *   propertySetterFactory: new CompositeLogPropertySetterFactory([
 *     new GenericLogPropertySetterFactory(logger),
 *   ]),
 * });
 * ```
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
