import { logEvent, type Analytics } from '@react-native-firebase/analytics';
import {
  Resolution,
  double,
  parametersOf,
  type Event,
  type EventParameters,
} from '@herald-analytics/core';
import {
  CompositeAdjustEventTrackerFactory,
  type AdjustEventTrackerFactory,
} from '@herald-analytics/adjust';
import {
  CompositeFirebaseEventTrackerFactory,
  GenericFirebaseEventTracker,
  GenericFirebaseEventTrackerFactory,
  RequireMappedFirebaseEventTrackerFactory,
  ScreenViewFirebaseEventTrackerFactory,
  toFirebaseParameters,
  type FirebaseEventTracker,
  type FirebaseEventTrackerFactory,
} from '@herald-analytics/firebase';

export class PayTapped implements Event {
  readonly name = 'pay_tapped';

  constructor(readonly plan: string) {}

  get parameters(): EventParameters {
    return { plan: this.plan };
  }
}

export class CardNumberSeen implements Event {
  readonly name = 'card_number_seen';

  constructor(readonly last4: string) {}
}

export class CheckoutCompleted implements Event {
  readonly name = 'checkout_completed';

  constructor(
    readonly value: number,
    readonly currency: string,
  ) {}

  get parameters(): EventParameters {
    return { value: double(this.value), currency: this.currency };
  }
}

// --8<-- [start:tracker]
export class PurchaseFirebaseEventTracker implements FirebaseEventTracker {
  constructor(
    private readonly event: CheckoutCompleted,
    private readonly firebaseAnalytics: Analytics,
  ) {}

  async track(): Promise<void> {
    // GA4's recommended purchase event, with the typed parameters.
    logEvent(this.firebaseAnalytics, 'purchase', toFirebaseParameters(parametersOf(this.event)));
  }
}
// --8<-- [end:tracker]

// --8<-- [start:factory]
export class CheckoutFirebaseEventTrackerFactory implements FirebaseEventTrackerFactory {
  constructor(private readonly firebaseAnalytics: Analytics) {}

  create(event: Event): Resolution<FirebaseEventTracker> {
    if (event instanceof CheckoutCompleted) {
      return Resolution.claimed([new PurchaseFirebaseEventTracker(event, this.firebaseAnalytics)]);
    }
    if (event instanceof PayTapped) {
      // Herald's own tracker
      return Resolution.claimed([new GenericFirebaseEventTracker(event, this.firebaseAnalytics)]);
    }
    if (event instanceof CardNumberSeen) {
      return Resolution.dropped(); // mine, and it goes nowhere
    }
    return Resolution.declined(); // not mine: ask the next factory
  }
}
// --8<-- [end:factory]

export function chains(firebaseAnalytics: Analytics): FirebaseEventTrackerFactory[] {
  // --8<-- [start:chain]
  const chain = new CompositeFirebaseEventTrackerFactory([
    new CheckoutFirebaseEventTrackerFactory(firebaseAnalytics), // feature factories first
    new ScreenViewFirebaseEventTrackerFactory(firebaseAnalytics), // then Herald's screen views
    new GenericFirebaseEventTrackerFactory(firebaseAnalytics), // then everything else
  ]);
  // --8<-- [end:chain]

  // --8<-- [start:strict]
  const strict = new CompositeFirebaseEventTrackerFactory([
    new CheckoutFirebaseEventTrackerFactory(firebaseAnalytics),
    new ScreenViewFirebaseEventTrackerFactory(firebaseAnalytics),
    new RequireMappedFirebaseEventTrackerFactory(), // an unclaimed event is reported
  ]);
  // --8<-- [end:strict]
  return [chain, strict];
}

export function defaultRules(
  firebaseAnalytics: Analytics,
  firebaseFactories: FirebaseEventTrackerFactory[],
  adjustFactories: AdjustEventTrackerFactory[],
): object[] {
  // --8<-- [start:default]
  // Firebase: events without a factory of their own are still sent, under their own name.
  const firebase = new CompositeFirebaseEventTrackerFactory([
    ...firebaseFactories,
    new GenericFirebaseEventTrackerFactory(firebaseAnalytics),
  ]);

  // Adjust: nothing at the end, so only events a factory handled are sent.
  const adjust = new CompositeAdjustEventTrackerFactory(adjustFactories);
  // --8<-- [end:default]
  return [firebase, adjust];
}
