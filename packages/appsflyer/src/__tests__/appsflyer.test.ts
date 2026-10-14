import { beforeEach, describe, expect, test } from '@jest/globals';
import {
  Herald,
  HeraldProvider,
  Identity,
  Resolution,
  UnhandledEventError,
  double,
  int,
  type AnalyticsFailure,
  type Event,
} from '@herald-analytics/core';

import {
  AdRevenueAppsFlyerEventTracker,
  AppsFlyerAdRevenueEvent,
  AppsFlyerAnalyticsService,
  AppsFlyerAnalyticsTrackerService,
  AppsFlyerPurchaseEvent,
  AppsFlyerSubscribeEvent,
  CompositeAppsFlyerEventTrackerFactory,
  GenericAppsFlyerEventTracker,
  GenericAppsFlyerEventTrackerFactory,
  PurchaseAppsFlyerEventTracker,
  RequireMappedAppsFlyerEventTrackerFactory,
  SubscribeAppsFlyerEventTracker,
  type AppsFlyerClient,
  type AppsFlyerEventTracker,
  type AppsFlyerEventTrackerFactory,
} from '../index';
import { TestEvent } from './support';

/** An AppsFlyer that records each call, in order, as [method, params]. */
function recordingAppsFlyer(calls: unknown[][]): AppsFlyerClient {
  const record =
    (method: string) =>
    async (...args: unknown[]) => {
      calls.push([method, ...args]);
    };
  return {
    logEvent: record('logEvent'),
    logAdRevenue: record('logAdRevenue'),
    start: record('start'),
    stop: record('stop'),
    setCustomerUserId: record('setCustomerUserId'),
  };
}

class OrderPaidAppsFlyerEventTrackerFactory implements AppsFlyerEventTrackerFactory {
  constructor(private readonly appsFlyer: AppsFlyerClient) {}

  create(event: Event): Resolution<AppsFlyerEventTracker> {
    if (event.name !== 'order_paid') return Resolution.declined();
    const purchase = new AppsFlyerPurchaseEvent({ name: event.name, revenue: 3, currency: 'EUR' });
    return Resolution.claimed([new PurchaseAppsFlyerEventTracker(purchase, this.appsFlyer)]);
  }
}

let calls: unknown[][];
let appsFlyer: AppsFlyerClient;

beforeEach(() => {
  calls = [];
  appsFlyer = recordingAppsFlyer(calls);
});

describe('revenue types', () => {
  test('a purchase puts its revenue under af_revenue, and leaves absent fields out', () => {
    const purchase = new AppsFlyerPurchaseEvent({
      name: 'order_paid',
      revenue: 9.99,
      currency: 'EUR',
      quantity: 2,
      orderId: 'order-1',
      parameters: { fare: 'adult' },
    });

    expect(purchase.toAppsFlyerEventValues()).toEqual({
      fare: 'adult',
      af_revenue: 9.99,
      af_currency: 'EUR',
      af_quantity: 2,
      af_order_id: 'order-1',
    });
  });

  test('a subscription carries af_revenue and af_currency', () => {
    expect(
      new AppsFlyerSubscribeEvent({
        name: 'subscribed',
        revenue: 4.99,
        currency: 'USD',
        parameters: { plan: 'pro' },
      }).toAppsFlyerEventValues(),
    ).toEqual({ plan: 'pro', af_revenue: 4.99, af_currency: 'USD' });
  });

  test('a parameter with a key the event sets itself is refused', () => {
    const purchase = new AppsFlyerPurchaseEvent({
      name: 'order_paid',
      revenue: 1,
      currency: 'EUR',
      parameters: { af_revenue: double(100) },
    });

    expect(() => purchase.toAppsFlyerEventValues()).toThrow(
      "AppsFlyerPurchaseEvent(order_paid, 1 EUR) can't have a 'af_revenue' parameter",
    );
  });

  test('a key the purchase leaves empty is free for a parameter', () => {
    const purchase = new AppsFlyerPurchaseEvent({
      name: 'order_paid',
      revenue: 1,
      currency: 'EUR',
      parameters: { af_order_id: 'from-parameters' },
    });

    expect(purchase.toAppsFlyerEventValues()).toMatchObject({ af_order_id: 'from-parameters' });
  });

  test('a revenue that is not a number, or a quantity that is not whole, is refused', () => {
    expect(
      () => new AppsFlyerSubscribeEvent({ name: 'a', revenue: Infinity, currency: 'EUR' }),
    ).toThrow('finite');
    expect(
      () => new AppsFlyerPurchaseEvent({ name: 'a', revenue: 1, currency: 'EUR', quantity: 0.5 }),
    ).toThrow('whole number');
  });

  test('revenue events are equal by value', () => {
    expect(new AppsFlyerPurchaseEvent({ name: 'a', revenue: 1, currency: 'EUR' })).toEqual(
      new AppsFlyerPurchaseEvent({ name: 'a', revenue: 1, currency: 'EUR' }),
    );
    expect(new AppsFlyerSubscribeEvent({ name: 'a', revenue: 1, currency: 'EUR' })).not.toEqual(
      new AppsFlyerSubscribeEvent({ name: 'a', revenue: 2, currency: 'EUR' }),
    );
  });
});

describe('trackers', () => {
  test('the generic tracker logs the event under its own name, with typed values', async () => {
    await new GenericAppsFlyerEventTracker(
      new TestEvent('tutorial_done', { step: int(3), skipped: false }),
      appsFlyer,
    ).track();

    expect(calls).toEqual([
      ['logEvent', { eventName: 'tutorial_done', eventValues: { step: 3, skipped: false } }],
    ]);
  });

  test('a purchase with a clashing parameter sends nothing', async () => {
    const purchase = new AppsFlyerPurchaseEvent({
      name: 'order_paid',
      revenue: 1,
      currency: 'EUR',
      parameters: { af_currency: 'USD' },
    });

    await expect(new PurchaseAppsFlyerEventTracker(purchase, appsFlyer).track()).rejects.toThrow(
      "can't have a 'af_currency' parameter",
    );
    expect(calls).toEqual([]);
  });

  test('a purchase is logged as af_purchase and a subscription as af_subscribe', async () => {
    await new PurchaseAppsFlyerEventTracker(
      new AppsFlyerPurchaseEvent({ name: 'order_paid', revenue: 9.99, currency: 'EUR' }),
      appsFlyer,
    ).track();
    await new SubscribeAppsFlyerEventTracker(
      new AppsFlyerSubscribeEvent({ name: 'subscribed', revenue: 4.99, currency: 'USD' }),
      appsFlyer,
    ).track();

    expect(calls).toEqual([
      [
        'logEvent',
        { eventName: 'af_purchase', eventValues: { af_revenue: 9.99, af_currency: 'EUR' } },
      ],
      [
        'logEvent',
        { eventName: 'af_subscribe', eventValues: { af_revenue: 4.99, af_currency: 'USD' } },
      ],
    ]);
  });

  test('ad revenue goes through logAdRevenue', async () => {
    await new AdRevenueAppsFlyerEventTracker(
      new AppsFlyerAdRevenueEvent({
        name: 'ad_shown',
        monetizationNetwork: 'admob',
        mediationNetwork: 'google_admob',
        revenue: 0.01,
        currency: 'USD',
        parameters: { slot: int(2) },
      }),
      appsFlyer,
    ).track();

    expect(calls).toEqual([
      [
        'logAdRevenue',
        {
          monetizationNetwork: 'admob',
          mediationNetwork: 'google_admob',
          currencyIso4217Code: 'USD',
          revenue: 0.01,
          additionalParameters: { slot: 2 },
        },
      ],
    ]);
  });

  test('a call AppsFlyer refuses reaches the error reporter', async () => {
    const failing: AppsFlyerClient = {
      ...appsFlyer,
      logEvent: async () => {
        throw new Error('AppsFlyer is not initialised');
      },
    };
    const failures: AnalyticsFailure[] = [];
    const herald = new Herald({
      providers: [
        new HeraldProvider({
          name: 'appsflyer',
          events: new AppsFlyerAnalyticsTrackerService({
            eventTrackerFactory: new GenericAppsFlyerEventTrackerFactory(failing),
          }),
        }),
      ],
      errorReporter: (failure) => {
        failures.push(failure);
      },
    });

    await herald.track(new TestEvent('tutorial_done'));

    expect(failures.map(String)).toEqual([
      'appsflyer failed on Track(tutorial_done): Error: AppsFlyer is not initialised',
    ]);
  });
});

describe('factories', () => {
  test('a chain without a fallback sends only the conversions a factory handles', async () => {
    const tracker = new AppsFlyerAnalyticsTrackerService({
      eventTrackerFactory: new CompositeAppsFlyerEventTrackerFactory([
        new OrderPaidAppsFlyerEventTrackerFactory(appsFlyer),
      ]),
    });

    await tracker.track(new TestEvent('order_paid'));
    await tracker.track(new TestEvent('screen_scrolled'));

    expect(calls).toEqual([
      [
        'logEvent',
        { eventName: 'af_purchase', eventValues: { af_revenue: 3, af_currency: 'EUR' } },
      ],
    ]);
  });

  test('the generic factory claims everything', () => {
    expect(
      new GenericAppsFlyerEventTrackerFactory(appsFlyer).create(new TestEvent('any')).handlers,
    ).toEqual([expect.any(GenericAppsFlyerEventTracker)]);
  });

  test('a fallback factory that is not last is refused', () => {
    expect(
      () =>
        new CompositeAppsFlyerEventTrackerFactory([
          new GenericAppsFlyerEventTrackerFactory(appsFlyer),
          new OrderPaidAppsFlyerEventTrackerFactory(appsFlyer),
        ]),
    ).toThrow('GenericAppsFlyerEventTrackerFactory answers for everything');
  });

  test('the require-mapped factory throws for anything that reaches it', () => {
    expect(() =>
      new RequireMappedAppsFlyerEventTrackerFactory().create(new TestEvent('e')),
    ).toThrow(UnhandledEventError);
  });
});

describe('service', () => {
  test('start keeps the SDK stopped', async () => {
    await new AppsFlyerAnalyticsService(appsFlyer).start();

    expect(calls).toEqual([['stop', { shouldStop: true }]]);
  });

  test('granting consent resumes then starts, in that order', async () => {
    await new AppsFlyerAnalyticsService(appsFlyer).setEnabled(true);

    expect(calls).toEqual([['stop', { shouldStop: false }], ['start']]);
  });

  test('revoking consent stops the SDK and does not start it', async () => {
    await new AppsFlyerAnalyticsService(appsFlyer).setEnabled(false);

    expect(calls).toEqual([['stop', { shouldStop: true }]]);
  });

  test('identify sets the customer user id, and reset touches nothing', async () => {
    const service = new AppsFlyerAnalyticsService(appsFlyer);

    await service.identify(new Identity('user-1'));
    await service.reset();

    expect(calls).toEqual([['setCustomerUserId', { customerId: 'user-1' }]]);
  });
});
