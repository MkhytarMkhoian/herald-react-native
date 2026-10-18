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
  CompositeMetaEventTrackerFactory,
  GenericMetaEventTracker,
  GenericMetaEventTrackerFactory,
  MetaAnalyticsService,
  MetaAnalyticsTrackerService,
  MetaPurchaseEvent,
  PurchaseMetaEventTracker,
  RequireMappedMetaEventTrackerFactory,
  type MetaAppEvents,
  type MetaEventTracker,
  type MetaEventTrackerFactory,
  type MetaSettings,
} from '../index';
import { TestEvent } from './support';

/** Records each call to Meta, in order, as [method, ...args]. */
function recorder(calls: unknown[][]): { appEvents: MetaAppEvents; settings: MetaSettings } {
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push([method, ...args]);
    };
  return {
    appEvents: {
      logEvent: record('logEvent'),
      logPurchase: record('logPurchase'),
      flush: record('flush'),
      setUserID: record('setUserID'),
    },
    settings: {
      initializeSDK: record('initializeSDK'),
      setAutoLogAppEventsEnabled: record('setAutoLogAppEventsEnabled'),
      setAdvertiserIDCollectionEnabled: record('setAdvertiserIDCollectionEnabled'),
    },
  };
}

class OrderPaidMetaEventTrackerFactory implements MetaEventTrackerFactory {
  constructor(private readonly appEvents: MetaAppEvents) {}

  create(event: Event): Resolution<MetaEventTracker> {
    if (event.name !== 'order_paid') return Resolution.declined();
    const purchase = new MetaPurchaseEvent({ name: event.name, amount: 3, currency: 'EUR' });
    return Resolution.claimed([new PurchaseMetaEventTracker(purchase, this.appEvents)]);
  }
}

let calls: unknown[][];
let appEvents: MetaAppEvents;
let settings: MetaSettings;

beforeEach(() => {
  calls = [];
  ({ appEvents, settings } = recorder(calls));
});

describe('consent', () => {
  test('consent finishes starting Meta, then turns its collection on', async () => {
    const service = new MetaAnalyticsService({ appEvents, settings });

    await service.setEnabled(true);

    expect(calls).toEqual([
      ['initializeSDK'],
      ['setAutoLogAppEventsEnabled', true],
      ['setAdvertiserIDCollectionEnabled', true],
    ]);
  });

  test('withdrawing consent turns collection off without starting Meta', async () => {
    const service = new MetaAnalyticsService({ appEvents, settings });
    await service.setEnabled(true);
    calls.length = 0;

    await service.setEnabled(false);

    expect(calls).toEqual([
      ['setAutoLogAppEventsEnabled', false],
      ['setAdvertiserIDCollectionEnabled', false],
    ]);
  });
});

describe('service', () => {
  test('sign-in, sign-out and flush reach Meta', async () => {
    const service = new MetaAnalyticsService({ appEvents, settings });

    await service.identify(new Identity('user-1'));
    await service.reset();
    await service.flush();

    expect(calls).toEqual([['setUserID', 'user-1'], ['setUserID', null], ['flush']]);
  });
});

describe('trackers', () => {
  test('the generic tracker logs the event under its own name, with true/false as text', async () => {
    const event = new TestEvent('fb_mobile_complete_registration', {
      method: 'email',
      step: int(2),
      score: double(1.5),
      invited: true,
    });

    await new GenericMetaEventTracker(event, appEvents).track();

    expect(calls).toEqual([
      [
        'logEvent',
        'fb_mobile_complete_registration',
        { method: 'email', step: 2, score: 1.5, invited: 'true' },
      ],
    ]);
  });

  test('a purchase goes through logPurchase with its amount and currency', async () => {
    const purchase = new MetaPurchaseEvent({
      name: 'order_paid',
      amount: 9.99,
      currency: 'EUR',
      parameters: { fb_content_id: 'pro' },
    });

    await new PurchaseMetaEventTracker(purchase, appEvents).track();

    expect(calls).toEqual([['logPurchase', 9.99, 'EUR', { fb_content_id: 'pro' }]]);
  });

  test('an amount that is not a finite number is refused', () => {
    expect(() => new MetaPurchaseEvent({ name: 'p', amount: NaN, currency: 'EUR' })).toThrow(
      RangeError,
    );
  });

  test('a call Meta refuses reaches the error reporter', async () => {
    const failing: MetaAppEvents = {
      ...appEvents,
      logEvent: () => {
        throw new Error('Meta is not initialised');
      },
    };
    const failures: AnalyticsFailure[] = [];
    const herald = new Herald({
      providers: [
        new HeraldProvider({
          name: 'meta',
          events: new MetaAnalyticsTrackerService({
            eventTrackerFactory: new GenericMetaEventTrackerFactory(failing),
          }),
        }),
      ],
      errorReporter: (failure) => {
        failures.push(failure);
      },
    });

    await herald.track(new TestEvent('tutorial_done'));

    expect(failures.map(String)).toEqual([
      'meta failed on Track(tutorial_done): Error: Meta is not initialised',
    ]);
  });
});

describe('factories', () => {
  test('a chain without a fallback sends only the conversions a factory handles', async () => {
    const tracker = new MetaAnalyticsTrackerService({
      eventTrackerFactory: new CompositeMetaEventTrackerFactory([
        new OrderPaidMetaEventTrackerFactory(appEvents),
      ]),
    });

    await tracker.track(new TestEvent('order_paid'));
    await tracker.track(new TestEvent('screen_scrolled'));

    expect(calls).toEqual([['logPurchase', 3, 'EUR', {}]]);
  });

  test('a fallback factory that is not last is refused', () => {
    expect(
      () =>
        new CompositeMetaEventTrackerFactory([
          new GenericMetaEventTrackerFactory(appEvents),
          new OrderPaidMetaEventTrackerFactory(appEvents),
        ]),
    ).toThrow('GenericMetaEventTrackerFactory answers for everything');
  });

  test('the require-mapped factory throws for anything that reaches it', () => {
    expect(() => new RequireMappedMetaEventTrackerFactory().create(new TestEvent('e'))).toThrow(
      UnhandledEventError,
    );
  });
});
