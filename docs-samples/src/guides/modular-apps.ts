import type { Analytics } from '@react-native-firebase/analytics';
import {
  HeraldProvider,
  type Event,
  type EventParameters,
  type EventTrackerService,
} from '@herald-analytics/core';
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
import { CheckoutStarted } from '../quick-start';

// --8<-- [start:feature]
// The checkout feature package exposes its factories, and knows nothing about the app's other
// vendors.
export const CheckoutFactories = {
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
    ...CheckoutFactories.firebase(firebaseAnalytics),
    // ...ProfileAnalytics.firebase(firebaseAnalytics), one line per feature
  ]);
}
// --8<-- [end:root]

// --8<-- [start:vendor-module]
// The Firebase package knows every feature's events, through their API packages, so it lists the
// factories itself.
export function firebaseVendorProvider(firebaseAnalytics: Analytics): HeraldProvider {
  const tracker = new FirebaseAnalyticsTrackerService({
    eventTrackerFactory: new CompositeFirebaseEventTrackerFactory([
      new CheckoutFirebaseEventTrackerFactory(firebaseAnalytics), // one for each feature that needs one
      new ScreenViewFirebaseEventTrackerFactory(firebaseAnalytics),
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
// --8<-- [end:vendor-module]

// --8<-- [start:interface]
// The checkout API package: one method for each thing that can happen. No Herald, no vendors.
export interface CheckoutAnalytics {
  checkoutStarted(plan: string, seats: number): Promise<void>;
  paymentFailed(reason: string): Promise<void>;
}
// --8<-- [end:interface]

// --8<-- [start:feature]
// The checkout feature calls the interface, and knows nothing about analytics libraries.
export class PaymentViewModel {
  constructor(private readonly analytics: CheckoutAnalytics) {}

  onPaymentFailed(reason: string): Promise<void> {
    return this.analytics.paymentFailed(reason);
  }
}
// --8<-- [end:feature]

// --8<-- [start:implementation]
// The analytics package owns the events, and turns each call into one.
class PaymentFailed implements Event {
  readonly name = 'payment_failed';

  constructor(readonly reason: string) {}

  get parameters(): EventParameters {
    return { reason: this.reason };
  }
}

class HeraldCheckoutAnalytics implements CheckoutAnalytics {
  constructor(private readonly analytics: EventTrackerService) {}

  checkoutStarted(plan: string, seats: number): Promise<void> {
    return this.analytics.track(new CheckoutStarted(plan, seats));
  }

  paymentFailed(reason: string): Promise<void> {
    return this.analytics.track(new PaymentFailed(reason));
  }
}
// --8<-- [end:implementation]

// --8<-- [start:binding]
// The app hands each feature its interface, backed by Herald.
export function createPaymentViewModel(herald: EventTrackerService): PaymentViewModel {
  return new PaymentViewModel(new HeraldCheckoutAnalytics(herald));
}
// --8<-- [end:binding]
