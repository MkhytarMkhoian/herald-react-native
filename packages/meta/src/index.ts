/**
 * Sends Herald events to Meta App Events: conversions and purchases, for Meta's ads.
 *
 * @packageDocumentation
 */

export type { MetaAnalyticsTrackerServiceOptions, MetaEventTrackerFactory } from './chain';
export {
  CompositeMetaEventTrackerFactory,
  MetaAnalyticsTrackerService,
  RequireMappedMetaEventTrackerFactory,
} from './chain';
export { GenericMetaEventTrackerFactory } from './factories';
export type { MetaEventTracker } from './handlers';
export { GenericMetaEventTracker, PurchaseMetaEventTracker } from './handlers';
export type { MetaPurchaseEventOptions } from './purchase';
export { MetaPurchaseEvent } from './purchase';
export type { MetaAnalyticsServiceOptions } from './services';
export { MetaAnalyticsService } from './services';
export type { MetaAppEvents, MetaSettings } from './values';
export { toMetaParameters } from './values';
