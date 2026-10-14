import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { Identify, Revenue } from '@amplitude/analytics-react-native';
import {
  Identity,
  Resolution,
  UnhandledEventError,
  UnhandledPropertyError,
  double,
  int,
  parametersOf,
  type Event,
} from '@herald-analytics/core';

import {
  AmplitudeAnalyticsService,
  AmplitudeAnalyticsTrackerService,
  AmplitudeRevenueEvent,
  CompositeAmplitudeEventTrackerFactory,
  CompositeAmplitudePropertySetterFactory,
  GenericAmplitudeEventTracker,
  GenericAmplitudeEventTrackerFactory,
  GenericAmplitudePropertySetter,
  RequireMappedAmplitudeEventTrackerFactory,
  RequireMappedAmplitudePropertySetterFactory,
  RevenueAmplitudeEventTracker,
  ScreenViewAmplitudeEventTracker,
  ScreenViewAmplitudeEventTrackerFactory,
  toAmplitudeProperties,
  type AmplitudeClient,
  type AmplitudeEventTracker,
  type AmplitudeEventTrackerFactory,
} from '../index';
import { TestEvent, TestProperty, TestScreenView } from './support';

// Revenue and Identify come from Amplitude's plain JavaScript core; the rest of the SDK needs a
// device.
jest.mock('@amplitude/analytics-react-native', () => {
  const core = jest.requireActual<typeof import('@amplitude/analytics-core')>(
    '@amplitude/analytics-core',
  );
  return { Revenue: core.Revenue, Identify: core.Identify };
});

/** An Amplitude client that records each call, in order, as [method, ...arguments]. */
function recordingAmplitude(calls: unknown[][]): AmplitudeClient {
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push([method, ...args]);
      return { promise: new Promise(() => {}) };
    };
  return {
    track: record('track'),
    identify: record('identify'),
    revenue: record('revenue'),
    flush: record('flush'),
    setOptOut: record('setOptOut'),
    setUserId: record('setUserId'),
    reset: record('reset'),
  } as unknown as AmplitudeClient;
}

class OrderPaidAmplitudeEventTrackerFactory implements AmplitudeEventTrackerFactory {
  constructor(private readonly amplitude: AmplitudeClient) {}

  create(event: Event): Resolution<AmplitudeEventTracker> {
    if (event.name !== 'order_paid') return Resolution.declined();
    const purchase = new AmplitudeRevenueEvent({ name: event.name, price: 4.99 });
    return Resolution.claimed([new RevenueAmplitudeEventTracker(purchase, this.amplitude)]);
  }
}

let calls: unknown[][];
let amplitude: AmplitudeClient;

beforeEach(() => {
  calls = [];
  amplitude = recordingAmplitude(calls);
});

test('parameters keep their types', () => {
  const event = new TestEvent('e', {
    plan: 'pro',
    seats: int(3),
    price: double(9.99),
    trial: false,
  });

  expect(toAmplitudeProperties(parametersOf(event))).toEqual({
    plan: 'pro',
    seats: 3,
    price: 9.99,
    trial: false,
  });
});

describe('trackers', () => {
  test('the generic tracker sends the event under its own name, with typed properties', async () => {
    await new GenericAmplitudeEventTracker(
      new TestEvent('checkout_started', { seats: int(3), trial: false }),
      amplitude,
    ).track();

    expect(calls).toEqual([['track', 'checkout_started', { seats: 3, trial: false }]]);
  });

  test("a call doesn't wait for Amplitude's upload", async () => {
    // The recording client's promises never settle, like an upload that is still going.
    await new GenericAmplitudeEventTracker(new TestEvent('e'), amplitude).track();
  });

  test("a screen view is Amplitude's own, with its name as the screen name", async () => {
    await new ScreenViewAmplitudeEventTracker(
      new TestScreenView('CheckoutScreen', { source: 'cart' }),
      amplitude,
    ).track();

    expect(calls).toEqual([
      [
        'track',
        '[Amplitude] Screen Viewed',
        { source: 'cart', '[Amplitude] Screen Name': 'CheckoutScreen' },
      ],
    ]);
  });

  test('a screen view with its own screen name parameter is refused, and nothing is sent', async () => {
    const tracker = new ScreenViewAmplitudeEventTracker(
      new TestScreenView('CheckoutScreen', { '[Amplitude] Screen Name': 'other' }),
      amplitude,
    );

    await expect(tracker.track()).rejects.toThrow("can't have a '[Amplitude] Screen Name'");
    expect(calls).toEqual([]);
  });

  test('a property is set through identify, with its type', async () => {
    await new GenericAmplitudePropertySetter(new TestProperty('seats', int(2)), amplitude).set();

    const [[method, identify]] = calls as [[string, Identify]];
    expect(method).toBe('identify');
    expect(identify.getUserProperties()).toEqual({ $set: { seats: 2 } });
  });
});

describe('revenue', () => {
  const purchase = new AmplitudeRevenueEvent({
    name: 'order_paid',
    price: 4.99,
    quantity: 2,
    productId: 'pass_day',
    revenueType: 'purchase',
    currency: 'EUR',
    receipt: 'r',
    receiptSig: 's',
    insertId: 'order-1',
    parameters: { fare: 'adult' },
  });

  test('every field reaches the Revenue object, properties included', () => {
    expect(purchase.toAmplitudeRevenue().getEventProperties()).toEqual({
      $price: 4.99,
      $quantity: 2,
      $productId: 'pass_day',
      $revenueType: 'purchase',
      $currency: 'EUR',
      $receipt: 'r',
      $receiptSig: 's',
      fare: 'adult',
    });
  });

  test('the insert id travels as an event option', async () => {
    await new RevenueAmplitudeEventTracker(purchase, amplitude).track();

    const [[method, revenue, options]] = calls as [[string, Revenue, unknown]];
    expect(method).toBe('revenue');
    expect(revenue.getEventProperties()).toMatchObject({ $price: 4.99 });
    expect(options).toEqual({ insert_id: 'order-1' });
  });

  test('without an insert id no options are sent', async () => {
    await new RevenueAmplitudeEventTracker(
      new AmplitudeRevenueEvent({ name: 'order_paid', price: 1 }),
      amplitude,
    ).track();

    expect(calls[0]?.[2]).toBeUndefined();
  });

  test('a quantity that is not whole, or a price that is not a number, is refused', () => {
    expect(() => new AmplitudeRevenueEvent({ name: 'a', price: 1, quantity: 1.5 })).toThrow(
      'whole number',
    );
    expect(() => new AmplitudeRevenueEvent({ name: 'a', price: Number.NaN })).toThrow('finite');
  });

  test('revenue events are equal by value', () => {
    expect(new AmplitudeRevenueEvent({ name: 'a', price: 1, parameters: { x: int(1) } })).toEqual(
      new AmplitudeRevenueEvent({ name: 'a', price: 1, parameters: { x: int(1) } }),
    );
    expect(new AmplitudeRevenueEvent({ name: 'a', price: 1 })).not.toEqual(
      new AmplitudeRevenueEvent({ name: 'a', price: 2 }),
    );
  });

  test('a custom factory sends app events as revenue before the generic factory', async () => {
    const tracker = new AmplitudeAnalyticsTrackerService({
      eventTrackerFactory: new CompositeAmplitudeEventTrackerFactory([
        new OrderPaidAmplitudeEventTrackerFactory(amplitude),
        new GenericAmplitudeEventTrackerFactory(amplitude),
      ]),
      propertySetterFactory: new CompositeAmplitudePropertySetterFactory([]),
    });

    await tracker.track(new TestEvent('order_paid'));

    expect(calls.map(([method]) => method)).toEqual(['revenue']);
  });
});

describe('factories', () => {
  test('the screen-view factory claims screen views only', () => {
    const factory = new ScreenViewAmplitudeEventTrackerFactory(amplitude);

    expect(factory.create(new TestScreenView('Home')).handlers).toEqual([
      expect.any(ScreenViewAmplitudeEventTracker),
    ]);
    expect(factory.create(new TestEvent('other'))).toBe(Resolution.declined());
  });

  test('the require-mapped factories throw for anything that reaches them', () => {
    expect(() =>
      new RequireMappedAmplitudeEventTrackerFactory().create(new TestEvent('e')),
    ).toThrow(UnhandledEventError);
    expect(() =>
      new RequireMappedAmplitudePropertySetterFactory().create(new TestProperty('p', int(1))),
    ).toThrow(UnhandledPropertyError);
  });
});

describe('service', () => {
  let service: AmplitudeAnalyticsService;

  beforeEach(() => {
    service = new AmplitudeAnalyticsService(amplitude);
  });

  test("start doesn't touch Amplitude", async () => {
    await service.start();

    expect(calls).toEqual([]);
  });

  test('consent maps onto the opt-out', async () => {
    await service.setEnabled(false);
    await service.setEnabled(true);

    expect(calls).toEqual([
      ['setOptOut', true],
      ['setOptOut', false],
    ]);
  });

  test('identify, reset and flush reach Amplitude', async () => {
    await service.identify(new Identity('user-1'));
    await service.reset();
    await service.flush();

    expect(calls).toEqual([['setUserId', 'user-1'], ['reset'], ['flush']]);
  });
});
