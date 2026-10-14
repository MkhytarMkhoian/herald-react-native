import { beforeEach, expect, test } from '@jest/globals';
import { Identity, double, int } from '@herald-analytics/core';

import { AnalyticsAssertionError, FakeAnalyticsProvider } from '../index';
import { TestEvent, TestProperty } from './support';

/** The message of the assertion error that `assertion` throws. */
function failureOf(assertion: () => unknown): string {
  try {
    assertion();
  } catch (error) {
    if (error instanceof AnalyticsAssertionError) return error.message;
    throw error;
  }
  throw new Error('Expected the assertion to fail.');
}

let analytics: FakeAnalyticsProvider;

beforeEach(() => {
  analytics = new FakeAnalyticsProvider();
});

// Every assertion must fail when it should, and say why.

test('assertTracked fails for a missing event, and shows what was tracked', async () => {
  await analytics.track(new TestEvent('cart_viewed'));

  const message = failureOf(() => analytics.assertTracked('checkout_started'));

  expect(message).toContain('checkout_started');
  expect(message).toContain('cart_viewed');
});

test('assertTracked fails for a duplicate, and points to assertTrackedTimes', async () => {
  await analytics.track(new TestEvent('checkout_started'));
  await analytics.track(new TestEvent('checkout_started'));

  const message = failureOf(() => analytics.assertTracked('checkout_started'));

  expect(message).toContain('2 were tracked');
  expect(message).toContain("assertTrackedTimes('checkout_started', 2)");
});

test('param fails for a missing parameter', async () => {
  await analytics.track(new TestEvent('checkout_started', { plan: 'pro' }));

  const message = failureOf(() =>
    analytics.assertTracked('checkout_started', (event) => event.param('seats', int(3))),
  );

  expect(message).toContain("Event 'checkout_started' has no parameter 'seats' { plan = pro }.");
});

test('param fails when a number was sent as text', async () => {
  await analytics.track(new TestEvent('checkout_started', { seats: '3' }));

  const message = failureOf(() =>
    analytics.assertTracked('checkout_started', (event) => event.param('seats', int(3))),
  );

  expect(message).toContain("Event 'checkout_started' parameter 'seats' was '3', expected int(3).");
});

test('param tells a whole double from an int', async () => {
  await analytics.track(new TestEvent('checkout_started', { seats: double(3) }));

  const message = failureOf(() =>
    analytics.assertTracked('checkout_started', (event) => event.param('seats', int(3))),
  );

  expect(message).toContain("parameter 'seats' was double(3), expected int(3).");
});

test('param refuses a bare number, as a mistake in the test', async () => {
  await analytics.track(new TestEvent('typed', { count: int(3) }));

  expect(() =>
    analytics.assertTracked('typed', (event) => event.param('count', 3 as never)),
  ).toThrow(TypeError);
});

test('noParameters fails for an event with parameters', async () => {
  await analytics.track(new TestEvent('checkout_started', { plan: 'pro' }));

  const message = failureOf(() =>
    analytics.assertTracked('checkout_started', (event) => event.noParameters()),
  );

  expect(message).toContain('plan');
});

test('assertNothingElseTracked fails for an event nobody checked', async () => {
  await analytics.track(new TestEvent('checkout_started'));
  await analytics.track(new TestEvent('debug_ping'));

  analytics.assertTracked('checkout_started');
  const message = failureOf(() => analytics.assertNothingElseTracked());

  expect(message).toContain('Unexpected events tracked: debug_ping.');
});

test('assertNothingElseTracked passes once every event was checked', async () => {
  await analytics.track(new TestEvent('checkout_started'));
  await analytics.track(new TestEvent('cart_viewed'));
  await analytics.track(new TestEvent('cart_viewed'));

  analytics
    .assertTracked('checkout_started')
    .assertTrackedTimes('cart_viewed', 2)
    .assertNothingElseTracked();
});

test('assertTrackedTimes fails for the wrong count', async () => {
  await analytics.track(new TestEvent('checkout_started'));

  const message = failureOf(() => analytics.assertTrackedTimes('checkout_started', 2));

  expect(message).toContain('2 times');
  expect(message).toContain('1 times');
});

test('assertNotTracked and assertNothingTracked fail when something was tracked', async () => {
  await analytics.track(new TestEvent('checkout_started'));

  failureOf(() => analytics.assertNotTracked('checkout_started'));
  failureOf(() => analytics.assertNothingTracked());
});

test('assertPropertySet fails for another value, and names it', async () => {
  await analytics.set(new TestProperty('total_purchases', int(41)));

  const message = failureOf(() => analytics.assertPropertySet('total_purchases', int(42)));

  expect(message).toContain(
    "Expected property 'total_purchases' to be int(42), but it was set to int(41).",
  );
});

test('assertPropertySet fails when the right value was overwritten, and shows both', async () => {
  await analytics.set(new TestProperty('plan', 'pro'));
  await analytics.set(new TestProperty('plan', 'free'));

  const message = failureOf(() => analytics.assertPropertySet('plan', 'pro'));

  expect(message).toContain("'pro' then 'free'");
});

test('assertPropertySet fails when a number was set as text', async () => {
  await analytics.set(new TestProperty('seats', '3'));

  const message = failureOf(() => analytics.assertPropertySet('seats', int(3)));

  expect(message).toContain("to be int(3), but it was set to '3'");
});

test('assertPropertySet fails for a property that was never set', async () => {
  await analytics.set(new TestProperty('plan', 'pro'));

  const message = failureOf(() => analytics.assertPropertySet('total_purchases', int(42)));

  expect(message).toContain('never was');
  expect(message).toContain('plan');
});

test('assertIdentified fails for another user', async () => {
  await analytics.identify(new Identity('user-2'));

  const message = failureOf(() => analytics.assertIdentified('user-1'));

  expect(message).toContain('user-1');
  expect(message).toContain('user-2');
});

test('a failure lists every kind of call, in order', async () => {
  await analytics.start();
  await analytics.identify(new Identity('user-1'));
  await analytics.set(new TestProperty('plan', 'pro'));
  await analytics.track(new TestEvent('cart_viewed', { items: int(2) }));
  await analytics.setEnabled(false);
  await analytics.flush();
  await analytics.reset();

  const message = failureOf(() => analytics.assertTracked('checkout_started'));

  expect(message.slice(message.indexOf('Recorded:\n') + 'Recorded:\n'.length)).toBe(
    [
      '  1. start',
      '  2. identify user-1',
      '  3. property plan = pro',
      '  4. event    cart_viewed { items = 2 }',
      '  5. enabled  false',
      '  6. flush',
      '  7. reset',
    ].join('\n'),
  );
});

test('a failure with nothing recorded says so', () => {
  const message = failureOf(() => analytics.assertTracked('checkout_started'));

  expect(message).toContain('nothing was recorded');
});

test('a failed assertion is an Error any test runner shows', () => {
  expect(() => analytics.assertTracked('checkout_started')).toThrow(Error);
  expect(() => analytics.assertTracked('checkout_started')).toThrow(/^Expected an event named/);
});
