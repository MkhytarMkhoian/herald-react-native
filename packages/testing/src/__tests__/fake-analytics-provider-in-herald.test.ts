import { beforeEach, expect, test } from '@jest/globals';
import {
  Herald,
  HeraldProvider,
  type AnalyticsFailure,
  type Event,
  type EventTrackerService,
} from '@herald-analytics/core';

import { FakeAnalyticsProvider } from '../index';
import { TestEvent } from './support';

/** Keeps `debug_ping` away from `inner`. */
class ExceptDebugPing implements EventTrackerService {
  constructor(private readonly inner: EventTrackerService) {}

  async track(event: Event): Promise<void> {
    if (event.name !== 'debug_ping') await this.inner.track(event);
  }
}

let analytics: FakeAnalyticsProvider;

beforeEach(() => {
  analytics = new FakeAnalyticsProvider();
});

// The fake as a real provider, so the test runs through a real `Herald`.

test('an event tracked through Herald reaches the fake', async () => {
  const herald = new Herald({
    providers: [new HeraldProvider({ name: 'test', events: analytics, properties: analytics })],
  });

  await herald.track(new TestEvent('checkout_started', { plan: 'pro' }));

  analytics
    .assertTracked('checkout_started', (event) => event.param('plan', 'pro'))
    .assertNothingElseTracked();
});

test('a decorator shows in what the fake did not get', async () => {
  const herald = new Herald({
    providers: [new HeraldProvider({ name: 'test', events: new ExceptDebugPing(analytics) })],
  });

  await herald.track(new TestEvent('checkout_started'));
  await herald.track(new TestEvent('debug_ping'));

  analytics
    .assertTracked('checkout_started')
    .assertNotTracked('debug_ping')
    .assertNothingElseTracked();
});

test('a bad value reaches the error reporter, as with a real vendor', async () => {
  const failures: AnalyticsFailure[] = [];
  const herald = new Herald({
    providers: [new HeraldProvider({ name: 'test', events: analytics })],
    errorReporter: (failure) => {
      failures.push(failure);
    },
  });

  await herald.track(new TestEvent('checkout_started', { seats: 3 as never }));

  expect(failures.map(String)).toEqual([
    expect.stringContaining("test failed on Track(checkout_started): TypeError: Parameter 'seats'"),
  ]);
  analytics.assertNothingTracked();
});
