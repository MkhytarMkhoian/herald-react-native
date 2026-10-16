import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { AdjustConfig } from 'react-native-adjust';
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
  AdRevenueAdjustEventTracker,
  AdjustAdRevenueEvent,
  AdjustAnalyticsService,
  AdjustAnalyticsTrackerService,
  AdjustRevenueEvent,
  CompositeAdjustEventTrackerFactory,
  CompositeAdjustPropertySetterFactory,
  GenericAdjustPropertySetterFactory,
  RequireMappedAdjustEventTrackerFactory,
  RequireMappedAdjustPropertySetterFactory,
  RevenueAdjustEventTracker,
  TokenAdjustEventTrackerFactory,
  toAdjustEvent,
  type AdjustEventTracker,
  type AdjustEventTrackerFactory,
  type EventClass,
} from '../index';
import { TestEvent, TestProperty } from './support';

// Adjust's real JavaScript runs. Only its native module is replaced, by one that records each call
// as [method, ...arguments].
const sent: unknown[][] = [];

jest.mock('react-native', () => {
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      sent.push([method, ...args]);
    };
  const methods = [
    'initSdk',
    'trackEvent',
    'trackAdRevenue',
    'enable',
    'disable',
    'addGlobalCallbackParameter',
    'removeGlobalCallbackParameter',
  ];
  return {
    NativeModules: { Adjust: Object.fromEntries(methods.map((m) => [m, record(m)])) },
    NativeEventEmitter: class {},
    Platform: { OS: 'ios' },
  };
});

function sentMethods(): unknown[] {
  return sent.map(([method]) => method);
}

function sentArguments(method: string): unknown[] {
  return sent.filter(([m]) => m === method).map(([, ...args]) => args)[0] ?? [];
}

/** Adjust keeps callback parameters as a flat [key, value, key, value] list. */
function callbackParameters(adjustObject: unknown): Record<string, string> {
  const flat = (adjustObject as { callbackParameters: string[] }).callbackParameters;
  const result: Record<string, string> = {};
  for (let i = 0; i < flat.length; i += 2) result[flat[i]!] = flat[i + 1]!;
  return result;
}

function adShown({ unit = 'banner', slot = 2 } = {}) {
  return new AdjustAdRevenueEvent({
    name: 'ad_shown',
    source: 'admob_sdk',
    revenue: 0.5,
    currency: 'EUR',
    adRevenueUnit: unit,
    parameters: { slot: int(slot) },
  });
}

class SignUpCompleted implements Event {
  readonly name = 'sign_up_completed';
}

class CheckoutStarted implements Event {
  readonly name = 'checkout_started';
}

/** Sends `order_paid` as a purchase and `ad_shown` as ad revenue, as an app's billing would. */
class BillingAdjustEventTrackerFactory implements AdjustEventTrackerFactory {
  create(event: Event): Resolution<AdjustEventTracker> {
    if (event.name === 'order_paid') {
      const purchase = new AdjustRevenueEvent({ name: event.name, revenue: 4.99, currency: 'EUR' });
      return Resolution.claimed([new RevenueAdjustEventTracker(purchase, 'rev123')]);
    }
    if (event.name === 'ad_shown')
      return Resolution.claimed([new AdRevenueAdjustEventTracker(adShown())]);
    return Resolution.declined();
  }
}

let service: AdjustAnalyticsService;

beforeEach(() => {
  sent.length = 0;
  service = new AdjustAnalyticsService(
    new AdjustConfig('app-token', AdjustConfig.EnvironmentSandbox),
  );
});

describe('conversion', () => {
  test('an event becomes the token with every parameter as text', () => {
    const event = new TestEvent('checkout_started', {
      plan: 'pro',
      seats: int(3),
      price: double(5),
      trial: true,
    });

    const adjustEvent = toAdjustEvent(parametersOf(event), 'abc123');

    expect(adjustEvent).toMatchObject({ eventToken: 'abc123' });
    expect(callbackParameters(adjustEvent)).toEqual({
      plan: 'pro',
      seats: '3',
      price: '5.0',
      trial: 'true',
    });
  });

  test('a revenue event carries its revenue and deduplication id', () => {
    const adjustEvent = new AdjustRevenueEvent({
      name: 'order_paid',
      revenue: 9.99,
      currency: 'EUR',
      deduplicationId: 'order-1',
      parameters: { fare: 'adult' },
    }).toAdjustEvent('rev123');

    expect(adjustEvent).toMatchObject({
      eventToken: 'rev123',
      revenue: 9.99,
      currency: 'EUR',
      deduplicationId: 'order-1',
    });
    expect(callbackParameters(adjustEvent)).toEqual({ fare: 'adult' });
  });

  test('ad revenue sets only the fields that are present', () => {
    const adRevenue = new AdjustAdRevenueEvent({
      name: 'ad_shown',
      source: 'applovin_max_sdk',
      revenue: 0.01,
      currency: 'USD',
      adRevenueNetwork: 'network',
      parameters: { slot: int(2) },
    }).toAdjustAdRevenue();

    expect(adRevenue).toMatchObject({
      source: 'applovin_max_sdk',
      revenue: 0.01,
      currency: 'USD',
      adRevenueNetwork: 'network',
      adRevenueUnit: null,
      adImpressionsCount: null,
    });
    expect(callbackParameters(adRevenue)).toEqual({ slot: '2' });
  });

  test('a revenue that is not a number, or impressions that are not whole, are refused', () => {
    expect(
      () => new AdjustRevenueEvent({ name: 'a', revenue: Number.NaN, currency: 'EUR' }),
    ).toThrow('finite');
    expect(
      () =>
        new AdjustAdRevenueEvent({
          name: 'a',
          source: 's',
          revenue: 1,
          currency: 'EUR',
          adImpressionsCount: 1.5,
        }),
    ).toThrow('whole number');
  });

  test('revenue events are equal by value', () => {
    expect(
      new AdjustRevenueEvent({ name: 'a', revenue: 1, currency: 'EUR', parameters: { x: int(1) } }),
    ).toEqual(
      new AdjustRevenueEvent({ name: 'a', revenue: 1, currency: 'EUR', parameters: { x: int(1) } }),
    );
    expect(new AdjustRevenueEvent({ name: 'a', revenue: 1, currency: 'EUR' })).not.toEqual(
      new AdjustRevenueEvent({ name: 'a', revenue: 1, currency: 'USD' }),
    );
    expect(adShown()).toEqual(adShown());
    expect(adShown()).not.toEqual(adShown({ unit: 'interstitial' }));
    expect(adShown()).not.toEqual(adShown({ slot: 3 }));
  });
});

describe('factories', () => {
  test('the token factory claims events of a listed class, with its token', async () => {
    const factory = new TokenAdjustEventTrackerFactory([
      [SignUpCompleted, 'abc123'],
      [CheckoutStarted, 'def456'],
    ]);

    await factory.create(new CheckoutStarted()).handlers[0]?.track();

    expect(factory.create(new TestEvent('cart_viewed'))).toBe(Resolution.declined());
    expect(sentArguments('trackEvent')[0]).toMatchObject({ eventToken: 'def456' });
  });

  test("an event isn't matched by its name, only by its class", () => {
    const factory = new TokenAdjustEventTrackerFactory([[CheckoutStarted, 'def456']]);

    expect(factory.create(new TestEvent('checkout_started'))).toBe(Resolution.declined());
  });

  test('a subclass of a listed class gets its token', () => {
    class TrialCheckoutStarted extends CheckoutStarted {}
    const factory = new TokenAdjustEventTrackerFactory([[CheckoutStarted, 'def456']]);

    expect(factory.create(new TrialCheckoutStarted()).handlers).toEqual([
      expect.objectContaining({ eventToken: 'def456' }),
    ]);
  });

  test('a class listed twice is refused when the factory is built', () => {
    expect(
      () =>
        new TokenAdjustEventTrackerFactory([
          [CheckoutStarted, 'def456'],
          [CheckoutStarted, 'other'],
        ]),
    ).toThrow('CheckoutStarted has two Adjust tokens');
  });

  test('the token list cannot be changed after the factory is built', () => {
    const tokens: [EventClass, string][] = [[SignUpCompleted, 'abc123']];
    const factory = new TokenAdjustEventTrackerFactory(tokens);

    tokens.push([CheckoutStarted, 'def456']);

    expect(factory.create(new CheckoutStarted())).toBe(Resolution.declined());
  });

  test('an event name instead of a class does not compile, and is refused at run time', () => {
    // @ts-expect-error the list pairs classes, not names, with tokens
    expect(() => new TokenAdjustEventTrackerFactory([['checkout_started', 'def456']])).toThrow(
      'Adjust tokens are paired with event classes, not "checkout_started".',
    );
  });

  test('custom factories before the token factory send purchases and ad revenue', async () => {
    const tracker = new AdjustAnalyticsTrackerService({
      eventTrackerFactory: new CompositeAdjustEventTrackerFactory([
        new BillingAdjustEventTrackerFactory(),
        new TokenAdjustEventTrackerFactory([[CheckoutStarted, 'abc123']]),
      ]),
      propertySetterFactory: new CompositeAdjustPropertySetterFactory([
        new GenericAdjustPropertySetterFactory(),
      ]),
    });

    await tracker.track(new TestEvent('order_paid'));
    await tracker.track(new TestEvent('ad_shown'));
    await tracker.track(new TestEvent('unmapped'));
    await tracker.set(new TestProperty('plan', 'pro'));

    expect(sentMethods()).toEqual(['trackEvent', 'trackAdRevenue', 'addGlobalCallbackParameter']);
    expect(sentArguments('trackEvent')[0]).toMatchObject({ eventToken: 'rev123', revenue: 4.99 });
    expect(sentArguments('trackAdRevenue')[0]).toMatchObject({ source: 'admob_sdk' });
    expect(sentArguments('addGlobalCallbackParameter')).toEqual(['plan', 'pro']);
  });

  test('a fallback factory that is not last is refused', () => {
    expect(
      () =>
        new CompositeAdjustEventTrackerFactory([
          new RequireMappedAdjustEventTrackerFactory(),
          new TokenAdjustEventTrackerFactory([[CheckoutStarted, 'abc123']]),
        ]),
    ).toThrow('answers for everything');
    expect(
      () =>
        new CompositeAdjustPropertySetterFactory([
          new GenericAdjustPropertySetterFactory(),
          new RequireMappedAdjustPropertySetterFactory(),
        ]),
    ).toThrow('one fallback factory');
  });

  test('the require-mapped factories throw for anything that reaches them', () => {
    expect(() => new RequireMappedAdjustEventTrackerFactory().create(new TestEvent('e'))).toThrow(
      UnhandledEventError,
    );
    expect(() =>
      new RequireMappedAdjustPropertySetterFactory().create(new TestProperty('p', int(1))),
    ).toThrow(UnhandledPropertyError);
  });
});

describe('service', () => {
  test('start turns Adjust off before starting it, so it starts silent', async () => {
    await service.start();

    expect(sentMethods()).toEqual(['disable', 'initSdk']);
    expect(sentArguments('initSdk')[0]).toMatchObject({ appToken: 'app-token' });
  });

  test('consent turns Adjust on and off', async () => {
    await service.setEnabled(true);
    await service.setEnabled(false);

    expect(sentMethods()).toEqual(['enable', 'disable']);
  });

  test('identity is a global callback parameter', async () => {
    await service.identify(new Identity('user-1'));
    await service.reset();

    expect(sent).toEqual([
      ['addGlobalCallbackParameter', 'user_id', 'user-1'],
      ['removeGlobalCallbackParameter', 'user_id'],
    ]);
  });

  test('the identity parameter can be renamed', async () => {
    await new AdjustAnalyticsService(
      new AdjustConfig('app-token', AdjustConfig.EnvironmentSandbox),
      { identityParameter: 'customer' },
    ).identify(new Identity('user-1'));

    expect(sent).toEqual([['addGlobalCallbackParameter', 'customer', 'user-1']]);
  });
});
