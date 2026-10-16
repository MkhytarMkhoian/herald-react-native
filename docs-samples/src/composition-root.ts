import type { Analytics } from '@react-native-firebase/analytics';
import type { Mixpanel } from 'mixpanel-react-native';
import type { AdjustConfig } from 'react-native-adjust';
import { Herald, HeraldProvider } from '@herald-analytics/core';
import {
  AdjustAnalyticsService,
  AdjustAnalyticsTrackerService,
  CompositeAdjustEventTrackerFactory,
  CompositeAdjustPropertySetterFactory,
  GenericAdjustPropertySetterFactory,
  TokenAdjustEventTrackerFactory,
  type EventClass,
} from '@herald-analytics/adjust';
import {
  AmplitudeAnalyticsService,
  AmplitudeAnalyticsTrackerService,
  CompositeAmplitudeEventTrackerFactory,
  CompositeAmplitudePropertySetterFactory,
  GenericAmplitudeEventTrackerFactory,
  GenericAmplitudePropertySetterFactory,
  ScreenViewAmplitudeEventTrackerFactory,
  type AmplitudeClient,
} from '@herald-analytics/amplitude';
import {
  CompositeFirebaseEventTrackerFactory,
  CompositeFirebasePropertySetterFactory,
  FirebaseAnalyticsService,
  FirebaseAnalyticsTrackerService,
  GenericFirebaseEventTrackerFactory,
  GenericFirebasePropertySetterFactory,
  ScreenViewFirebaseEventTrackerFactory,
} from '@herald-analytics/firebase';
import {
  CompositeMixpanelEventTrackerFactory,
  CompositeMixpanelPropertySetterFactory,
  GenericMixpanelEventTrackerFactory,
  GenericMixpanelPropertySetterFactory,
  MixpanelAnalyticsService,
  MixpanelAnalyticsTrackerService,
  ScreenViewMixpanelEventTrackerFactory,
  UserPropertyMixpanelPropertySetterFactory,
} from '@herald-analytics/mixpanel';

import type { AnalyticsConsentRepository } from './guides/consent';

// --8<-- [start:firebase-provider]
export function firebaseProvider(firebaseAnalytics: Analytics): HeraldProvider {
  const tracker = new FirebaseAnalyticsTrackerService({
    eventTrackerFactory: new CompositeFirebaseEventTrackerFactory([
      new ScreenViewFirebaseEventTrackerFactory(firebaseAnalytics), // GA4's reserved screen_view
      new GenericFirebaseEventTrackerFactory(firebaseAnalytics), // everything else, as-is
    ]),
    propertySetterFactory: new CompositeFirebasePropertySetterFactory([
      new GenericFirebasePropertySetterFactory(firebaseAnalytics),
    ]),
  });
  const service = new FirebaseAnalyticsService(firebaseAnalytics);
  return new HeraldProvider({
    name: 'firebase',
    events: tracker,
    properties: tracker,
    identity: service,
    lifecycle: service,
    consent: service,
  });
}
// --8<-- [end:firebase-provider]

export function mixpanelProvider(mixpanel: Mixpanel): HeraldProvider {
  const tracker = new MixpanelAnalyticsTrackerService({
    eventTrackerFactory: new CompositeMixpanelEventTrackerFactory([
      new ScreenViewMixpanelEventTrackerFactory(mixpanel),
      new GenericMixpanelEventTrackerFactory(mixpanel),
    ]),
    propertySetterFactory: new CompositeMixpanelPropertySetterFactory([
      new UserPropertyMixpanelPropertySetterFactory(mixpanel), // before the generic one
      new GenericMixpanelPropertySetterFactory(mixpanel),
    ]),
  });
  const service = new MixpanelAnalyticsService(mixpanel);
  return new HeraldProvider({
    name: 'mixpanel',
    events: tracker,
    properties: tracker,
    identity: service,
    lifecycle: service,
    consent: service,
  });
}

export function adjustProvider(
  config: AdjustConfig,
  tokens: readonly (readonly [EventClass, string])[],
): HeraldProvider {
  const tracker = new AdjustAnalyticsTrackerService({
    eventTrackerFactory: new CompositeAdjustEventTrackerFactory([
      new TokenAdjustEventTrackerFactory(tokens), // only events with a dashboard token
    ]),
    propertySetterFactory: new CompositeAdjustPropertySetterFactory([
      new GenericAdjustPropertySetterFactory(),
    ]),
  });
  const service = new AdjustAnalyticsService(config);
  return new HeraldProvider({
    name: 'adjust',
    events: tracker,
    properties: tracker,
    identity: service,
    lifecycle: service,
    consent: service,
  });
}

export function amplitudeProvider(amplitude: AmplitudeClient): HeraldProvider {
  const tracker = new AmplitudeAnalyticsTrackerService({
    eventTrackerFactory: new CompositeAmplitudeEventTrackerFactory([
      new ScreenViewAmplitudeEventTrackerFactory(amplitude),
      new GenericAmplitudeEventTrackerFactory(amplitude),
    ]),
    propertySetterFactory: new CompositeAmplitudePropertySetterFactory([
      new GenericAmplitudePropertySetterFactory(amplitude),
    ]),
  });
  const service = new AmplitudeAnalyticsService(amplitude);
  return new HeraldProvider({
    name: 'amplitude',
    events: tracker,
    properties: tracker,
    identity: service,
    lifecycle: service,
    consent: service,
  });
}

export interface Vendors {
  readonly firebaseAnalytics: Analytics;
  readonly mixpanel: Mixpanel;
  readonly adjustConfig: AdjustConfig;
  readonly adjustTokens: readonly (readonly [EventClass, string])[];
}

export function buildHerald({
  firebaseAnalytics,
  mixpanel,
  adjustConfig,
  adjustTokens,
}: Vendors): Herald {
  // --8<-- [start:herald]
  const herald = new Herald({
    providers: [
      firebaseProvider(firebaseAnalytics),
      mixpanelProvider(mixpanel),
      adjustProvider(adjustConfig, adjustTokens),
    ],
    errorReporter: (failure) => console.warn(`analytics: ${failure}`, failure.error),
  });
  // --8<-- [end:herald]
  return herald;
}

// --8<-- [start:start-from-main]
export async function startAnalytics(
  herald: Herald,
  consentRepository: AnalyticsConsentRepository, // however you store the answer
): Promise<void> {
  await herald.start(); // some vendors start quiet here
  await herald.setEnabled(await consentRepository.isEnabled()); // so re-apply the stored answer
}
// --8<-- [end:start-from-main]
