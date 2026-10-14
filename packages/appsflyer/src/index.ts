/**
 * Sends Herald events to AppsFlyer: conversions, purchases, subscriptions and ad revenue. See the
 * package README for the setup.
 *
 * @packageDocumentation
 */

export type {
  AppsFlyerAnalyticsTrackerServiceOptions,
  AppsFlyerEventTrackerFactory,
} from './chain';
export {
  AppsFlyerAnalyticsTrackerService,
  CompositeAppsFlyerEventTrackerFactory,
  RequireMappedAppsFlyerEventTrackerFactory,
} from './chain';
export { GenericAppsFlyerEventTrackerFactory } from './factories';
export type { AppsFlyerEventTracker } from './handlers';
export {
  AdRevenueAppsFlyerEventTracker,
  GenericAppsFlyerEventTracker,
  PurchaseAppsFlyerEventTracker,
  SubscribeAppsFlyerEventTracker,
} from './handlers';
export type {
  AppsFlyerAdRevenueEventOptions,
  AppsFlyerPurchaseEventOptions,
  AppsFlyerSubscribeEventOptions,
} from './revenue';
export {
  AppsFlyerAdRevenueEvent,
  AppsFlyerPurchaseEvent,
  AppsFlyerSubscribeEvent,
} from './revenue';
export { AppsFlyerAnalyticsService } from './services';
export type { AppsFlyerClient } from './values';
export { toAppsFlyerEventValues } from './values';
