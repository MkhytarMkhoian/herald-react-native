/**
 * Sends Herald events to Adjust: events by dashboard token, purchases and ad revenue.
 *
 * @packageDocumentation
 */

export type {
  AdjustAnalyticsTrackerServiceOptions,
  AdjustEventTrackerFactory,
  AdjustPropertySetterFactory,
} from './chain';
export {
  AdjustAnalyticsTrackerService,
  CompositeAdjustEventTrackerFactory,
  CompositeAdjustPropertySetterFactory,
  RequireMappedAdjustEventTrackerFactory,
  RequireMappedAdjustPropertySetterFactory,
} from './chain';
export type { EventClass } from './factories';
export {
  AdjustToken,
  GenericAdjustPropertySetterFactory,
  TokenAdjustEventTrackerFactory,
} from './factories';
export type { AdjustEventTracker, AdjustPropertySetter } from './handlers';
export {
  AdRevenueAdjustEventTracker,
  GenericAdjustPropertySetter,
  RevenueAdjustEventTracker,
  TokenAdjustEventTracker,
} from './handlers';
export type { AdjustAdRevenueEventOptions, AdjustRevenueEventOptions } from './revenue';
export { AdjustAdRevenueEvent, AdjustRevenueEvent } from './revenue';
export type { AdjustAnalyticsServiceOptions } from './services';
export { AdjustAnalyticsService } from './services';
export { toAdjustEvent } from './values';
