import type { Analytics } from '@react-native-firebase/analytics';
import { HeraldProvider } from '@herald-analytics/core';
import {
  CompositeFirebaseEventTrackerFactory,
  CompositeFirebasePropertySetterFactory,
  FirebaseAnalyticsService,
  FirebaseAnalyticsTrackerService,
  GenericFirebaseEventTrackerFactory,
  GenericFirebasePropertySetterFactory,
  ScreenViewFirebaseEventTrackerFactory,
  type FirebaseEventTrackerFactory,
} from '@herald-analytics/firebase';

import { CheckoutFirebaseEventTrackerFactory } from '../concepts/factory-chain';

// --8<-- [start:feature]
// The checkout feature package exposes its factories, and knows nothing about the app's other
// vendors.
export const CheckoutAnalytics = {
  firebase(firebaseAnalytics: Analytics): FirebaseEventTrackerFactory[] {
    return [new CheckoutFirebaseEventTrackerFactory(firebaseAnalytics)];
  },
};
// --8<-- [end:feature]

// --8<-- [start:root]
// The app builds the Firebase provider from whatever the features contribute.
export function firebaseProvider(
  firebaseAnalytics: Analytics,
  featureFactories: FirebaseEventTrackerFactory[], // from every feature, any order
): HeraldProvider {
  const tracker = new FirebaseAnalyticsTrackerService({
    eventTrackerFactory: new CompositeFirebaseEventTrackerFactory([
      ...featureFactories,
      new ScreenViewFirebaseEventTrackerFactory(firebaseAnalytics), // then placed by hand
      new GenericFirebaseEventTrackerFactory(firebaseAnalytics),
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

export function appFirebaseProvider(firebaseAnalytics: Analytics): HeraldProvider {
  return firebaseProvider(firebaseAnalytics, [
    ...CheckoutAnalytics.firebase(firebaseAnalytics),
    // ...ProfileAnalytics.firebase(firebaseAnalytics), one line per feature
  ]);
}
// --8<-- [end:root]
