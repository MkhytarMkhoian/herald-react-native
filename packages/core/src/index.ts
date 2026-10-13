/**
 * Herald: one analytics vocabulary, heard by every vendor.
 *
 * Your app describes what happened as an {@link Event}, and {@link Herald} sends it to every
 * analytics service you use. Each vendor's adapter lives in its own package.
 *
 * @packageDocumentation
 */

export type { AnalyticsErrorReporter } from './analytics-failure';
export { AnalyticsFailure } from './analytics-failure';
export type { AnalyticsOperation } from './analytics-operation';
export {
  FlushOperation,
  IdentifyOperation,
  ResetOperation,
  SetEnabledOperation,
  SetPropertyOperation,
  StartOperation,
  TrackOperation,
} from './analytics-operation';
export type { AnalyticsInput } from './analytics-value';
export { AnalyticsValue, double, int } from './analytics-value';
export type { Event, EventParameters, ScreenViewEvent } from './event';
export { isScreenView, parametersOf } from './event';
export type { FallbackFactory } from './fallback-factory';
export { isFallbackFactory, requireFallbackLast } from './fallback-factory';
export type { HeraldOptions, HeraldProviderOptions } from './herald';
export { Herald, HeraldProvider } from './herald';
export { Identity } from './identity';
export type { Property, UserProperty } from './property';
export { isUserProperty, propertyValueOf } from './property';
export type { Claimed, Declined, Dropped } from './resolution';
export { Resolution } from './resolution';
export type {
  AnalyticsLifecycleService,
  ConsentService,
  EventTrackerService,
  IdentifiableUserService,
  PropertyTrackerService,
} from './services';
export { UnhandledEventError, UnhandledPropertyError } from './unhandled-errors';
