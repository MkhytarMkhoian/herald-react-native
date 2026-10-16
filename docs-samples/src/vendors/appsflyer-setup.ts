import { AppsFlyer } from 'react-native-appsflyer';
import { HeraldProvider } from '@herald-analytics/core';
import {
  AppsFlyerAnalyticsService,
  AppsFlyerAnalyticsTrackerService,
  CompositeAppsFlyerEventTrackerFactory,
  type AppsFlyerEventTrackerFactory,
} from '@herald-analytics/appsflyer';

export async function initAppsFlyer(): Promise<void> {
  // --8<-- [start:init]
  await AppsFlyer.init({ devKey: 'YOUR_DEV_KEY', appId: 'YOUR_APPLE_APP_ID' });
  // AppsFlyer 7 sends a session only on start(), once per foreground. While Herald keeps the SDK
  // stopped, before consent, it sends nothing.
  AppsFlyer.registerSessionReadyListener(() => {
    AppsFlyer.start();
  });
  // --8<-- [end:init]
}

export function appsFlyerProvider(
  featureFactories: AppsFlyerEventTrackerFactory[],
): HeraldProvider {
  // --8<-- [start:provider]
  const tracker = new AppsFlyerAnalyticsTrackerService({
    // Your conversions and revenue. Nothing at the end, so other events aren't sent.
    eventTrackerFactory: new CompositeAppsFlyerEventTrackerFactory(featureFactories),
  });
  const service = new AppsFlyerAnalyticsService(AppsFlyer); // initialised at start-up

  const provider = new HeraldProvider({
    name: 'appsflyer',
    events: tracker, // no properties: AppsFlyer keeps no user attributes
    identity: service,
    lifecycle: service,
    consent: service,
  });
  // --8<-- [end:provider]
  return provider;
}
