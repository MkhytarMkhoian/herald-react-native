import { beforeEach, describe, expect, test } from '@jest/globals';
import { Identity, double, int } from '@herald-analytics/core';

import {
  EnabledSetRecord,
  FakeAnalyticsProvider,
  FlushedRecord,
  IdentifiedRecord,
  PropertySetRecord,
  ResetRecord,
  StartedRecord,
  TrackedRecord,
} from '../index';
import { TestEvent, TestProperty } from './support';

let analytics: FakeAnalyticsProvider;

beforeEach(() => {
  analytics = new FakeAnalyticsProvider();
});

describe('records', () => {
  test('every call goes into one list, in order', async () => {
    await analytics.start();
    await analytics.identify(new Identity('user-1'));
    await analytics.set(new TestProperty('plan', 'pro'));
    await analytics.track(new TestEvent('checkout_started'));
    await analytics.setEnabled(false);
    await analytics.flush();
    await analytics.reset();

    expect(analytics.records).toEqual([
      new StartedRecord(),
      new IdentifiedRecord(new Identity('user-1')),
      new PropertySetRecord(new TestProperty('plan', 'pro')),
      new TrackedRecord(new TestEvent('checkout_started')),
      new EnabledSetRecord(false),
      new FlushedRecord(),
      new ResetRecord(),
    ]);
  });

  test('the order across kinds can be checked', async () => {
    await analytics.set(new TestProperty('plan', 'pro'));
    await analytics.track(new TestEvent('checkout_started'));

    expect(analytics.records.map((record) => record.kind)).toEqual(['property', 'tracked']);
  });

  test('records are equal by kind and content', () => {
    expect(new EnabledSetRecord(true)).not.toEqual(new EnabledSetRecord(false));
    expect(new ResetRecord()).toEqual(new ResetRecord());
    expect(new StartedRecord()).not.toEqual(new FlushedRecord());
  });

  test('a list of records stays as it was when read', async () => {
    await analytics.track(new TestEvent('first'));
    const snapshot = analytics.records;

    await analytics.track(new TestEvent('second'));

    expect(snapshot).toHaveLength(1);
    expect(analytics.records).toHaveLength(2);
  });

  test('clear forgets the records and what was already asserted', async () => {
    await analytics.track(new TestEvent('checkout_started'));
    analytics.assertTracked('checkout_started');

    analytics.clear();

    analytics.assertNothingTracked().assertNothingElseTracked();
  });

  test('after clear, a new event must be checked again', async () => {
    await analytics.track(new TestEvent('checkout_started'));
    analytics.assertTracked('checkout_started');

    analytics.clear();
    await analytics.track(new TestEvent('debug_ping'));

    expect(() => analytics.assertNothingElseTracked()).toThrow(
      'Unexpected events tracked: debug_ping.',
    );
  });

  test('a bare number from plain JavaScript fails the call, as with a real vendor', async () => {
    await expect(
      analytics.track(new TestEvent('checkout_started', { seats: 3 as never })),
    ).rejects.toThrow("Parameter 'seats' of event 'checkout_started'");
    await expect(analytics.set(new TestProperty('seats', 3 as never))).rejects.toThrow(
      "Property 'seats'",
    );
    expect(analytics.records).toEqual([]);
  });
});

describe('passing assertions', () => {
  test('assertTracked compares parameters by type, not by their text', async () => {
    await analytics.track(
      new TestEvent('checkout_started', {
        plan: 'pro',
        seats: int(3),
        price: double(3.5),
        trial: false,
      }),
    );

    analytics.assertTracked('checkout_started', (event) =>
      event
        .param('plan', 'pro')
        .param('seats', int(3))
        .param('price', double(3.5))
        .param('trial', false),
    );
  });

  test('the tracked event itself is there for custom checks', async () => {
    const event = new TestEvent('checkout_started');
    await analytics.track(event);

    analytics.assertTracked('checkout_started', (tracked) => expect(tracked.event).toBe(event));
    expect(analytics.events).toEqual([event]);
  });

  test('noParameters passes on an event without parameters', async () => {
    await analytics.track(new TestEvent('checkout_started'));

    analytics.assertTracked('checkout_started', (event) => event.noParameters());
  });

  test('assertNotTracked passes when the event is missing', async () => {
    await analytics.track(new TestEvent('cart_viewed'));

    analytics.assertNotTracked('checkout_started');
  });

  test('assertTrackedTimes accepts zero', async () => {
    await analytics.track(new TestEvent('cart_viewed'));

    analytics.assertTrackedTimes('checkout_started', 0);
  });

  test('event assertions ignore calls that are not events', async () => {
    await analytics.start();
    await analytics.set(new TestProperty('plan', 'pro'));
    await analytics.identify(new Identity('user-1'));

    analytics.assertNothingTracked().assertNothingElseTracked();
  });

  test('assertPropertySet checks the last value, by type', async () => {
    await analytics.set(new TestProperty('plan', 'free'));
    await analytics.set(new TestProperty('plan', 'pro'));
    await analytics.set(new TestProperty('seats', int(3)));

    analytics.assertPropertySet('plan', 'pro').assertPropertySet('seats', int(3));
    expect(analytics.properties.map((property) => property.name)).toEqual([
      'plan',
      'plan',
      'seats',
    ]);
  });

  test('assertIdentified passes even after a later reset', async () => {
    await analytics.identify(new Identity('user-1'));
    await analytics.reset();

    analytics.assertIdentified('user-1');
  });
});
