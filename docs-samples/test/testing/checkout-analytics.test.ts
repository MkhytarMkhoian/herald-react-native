import { expect, test } from '@jest/globals';
import type { Analytics } from '@react-native-firebase/analytics';
import {
  Herald,
  HeraldProvider,
  Resolution,
  int,
  type EventTrackerService,
  type PropertyTrackerService,
} from '@herald-analytics/core';
import {
  AnalyticsAssertionError,
  FakeAnalyticsProvider,
  PropertySetRecord,
  TrackedRecord,
} from '@herald-analytics/testing';

import {
  CardNumberSeen,
  CheckoutCompleted,
  CheckoutFirebaseEventTrackerFactory,
} from '../../src/concepts/factory-chain';
import { PlanSelected, PurchaseCount } from '../../src/concepts/vocabulary';
import { CheckoutStarted, CheckoutViewModel } from '../../src/quick-start';

// --8<-- [start:fake-provider]
test('checkout reports the plan and seats, once', async () => {
  const analytics = new FakeAnalyticsProvider();
  const herald = new Herald({
    providers: [new HeraldProvider({ name: 'test', events: analytics, properties: analytics })],
  });

  await new CheckoutViewModel(herald).onCheckout('pro', 3);

  analytics
    .assertTracked(
      'checkout_started',
      (event) => event.param('plan', 'pro').param('seats', int(3)), // the text '3' would fail
    )
    .assertNothingElseTracked();
});
// --8<-- [end:fake-provider]

// --8<-- [start:order]
test('the purchase count is set before the purchase event that should carry it', async () => {
  const analytics = new FakeAnalyticsProvider();
  const properties: PropertyTrackerService = analytics;
  const events: EventTrackerService = analytics;

  await properties.set(new PurchaseCount(1));
  await events.track(new PlanSelected('pro', 1, 9.99, false));

  expect(analytics.records).toEqual([expect.any(PropertySetRecord), expect.any(TrackedRecord)]);
});
// --8<-- [end:order]

// --8<-- [start:single-capability]
test('a class that takes one capability can be given the fake directly', async () => {
  const analytics = new FakeAnalyticsProvider();

  await new CheckoutViewModel(analytics).onCheckout('pro', 3);

  expect(analytics.events).toEqual([new CheckoutStarted('pro', 3)]);
});
// --8<-- [end:single-capability]

// --8<-- [start:factory]
test('the checkout factory claims its events and declines the rest', () => {
  const factory = new CheckoutFirebaseEventTrackerFactory({} as Analytics);

  expect(factory.create(new CheckoutCompleted(9.99, 'EUR')).kind).toBe('claimed');
  expect(factory.create(new CardNumberSeen('4242'))).toBe(Resolution.dropped());
  expect(factory.create(new CheckoutStarted('pro', 3))).toBe(Resolution.declined());
});
// --8<-- [end:factory]

test('an assertion that cannot fail is not a test', () => {
  expect(() => new FakeAnalyticsProvider().assertTracked('never')).toThrow(AnalyticsAssertionError);
});
