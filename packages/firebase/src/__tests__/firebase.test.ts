import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
  Herald,
  HeraldProvider,
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
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperty,
  type Analytics,
} from '@react-native-firebase/analytics';

import {
  CompositeFirebaseEventTrackerFactory,
  CompositeFirebasePropertySetterFactory,
  FirebaseAnalyticsService,
  FirebaseAnalyticsTrackerService,
  GenericFirebaseEventTracker,
  GenericFirebaseEventTrackerFactory,
  GenericFirebasePropertySetter,
  GenericFirebasePropertySetterFactory,
  RequireMappedFirebaseEventTrackerFactory,
  RequireMappedFirebasePropertySetterFactory,
  ScreenViewFirebaseEventTracker,
  ScreenViewFirebaseEventTrackerFactory,
  toFirebaseParameters,
  type FirebaseEventTracker,
  type FirebaseEventTrackerFactory,
} from '../index';
import { TestEvent, TestProperty, TestScreenView } from './support';

jest.mock('@react-native-firebase/analytics', () => ({
  logEvent: jest.fn(),
  setUserProperty: jest.fn(async () => {}),
  setUserId: jest.fn(async () => {}),
  setAnalyticsCollectionEnabled: jest.fn(async () => {}),
}));

const analytics = { app: 'test' } as unknown as Analytics;

beforeEach(() => {
  jest.clearAllMocks();
});

class DropDebugPingFirebaseEventTrackerFactory implements FirebaseEventTrackerFactory {
  create(event: Event): Resolution<FirebaseEventTracker> {
    return event.name === 'debug_ping' ? Resolution.dropped() : Resolution.declined();
  }
}

describe('parameters', () => {
  test('numbers stay numbers and flags become text, since GA4 has no boolean type', () => {
    const event = new TestEvent('e', {
      plan: 'pro',
      seats: int(3),
      price: double(9.99),
      trial: false,
    });

    expect(toFirebaseParameters(parametersOf(event))).toEqual({
      plan: 'pro',
      seats: 3,
      price: 9.99,
      trial: 'false',
    });
  });
});

describe('trackers', () => {
  test('the generic tracker logs the event under its own name', async () => {
    await new GenericFirebaseEventTracker(
      new TestEvent('checkout_started', { seats: int(3) }),
      analytics,
    ).track();

    expect(logEvent).toHaveBeenCalledWith(analytics, 'checkout_started', { seats: 3 });
  });

  test('a name Firebase refuses fails the call, so Herald can report it', async () => {
    jest.mocked(logEvent).mockImplementationOnce(() => {
      throw new Error("the event name 'app_open' is reserved");
    });

    await expect(
      new GenericFirebaseEventTracker(new TestEvent('app_open'), analytics).track(),
    ).rejects.toThrow('reserved');
  });

  test('a screen view is logged as screen_view, with its name as the screen name', async () => {
    await new ScreenViewFirebaseEventTracker(
      new TestScreenView('CheckoutScreen', { source: 'cart' }),
      analytics,
    ).track();

    expect(logEvent).toHaveBeenCalledWith(analytics, 'screen_view', {
      source: 'cart',
      screen_name: 'CheckoutScreen',
    });
  });

  test('a screen view with its own screen_name parameter is refused, and nothing is sent', async () => {
    const tracker = new ScreenViewFirebaseEventTracker(
      new TestScreenView('CheckoutScreen', { screen_name: 'other' }),
      analytics,
    );

    await expect(tracker.track()).rejects.toThrow("can't have a 'screen_name' parameter");
    expect(logEvent).not.toHaveBeenCalled();
  });

  test('a property is set as a user property in its string form', async () => {
    await new GenericFirebasePropertySetter(new TestProperty('seats', int(2)), analytics).set();

    expect(setUserProperty).toHaveBeenCalledWith(analytics, 'seats', '2');
  });
});

describe('factories', () => {
  test('the screen-view factory claims screen views and declines the rest', () => {
    const factory = new ScreenViewFirebaseEventTrackerFactory(analytics);

    expect(factory.create(new TestScreenView('Home')).handlers).toEqual([
      expect.any(ScreenViewFirebaseEventTracker),
    ]);
    expect(factory.create(new TestEvent('other'))).toBe(Resolution.declined());
  });

  test('a chain sends screen views as screen views and everything else as-is', async () => {
    const tracker = new FirebaseAnalyticsTrackerService({
      eventTrackerFactory: new CompositeFirebaseEventTrackerFactory([
        new ScreenViewFirebaseEventTrackerFactory(analytics),
        new GenericFirebaseEventTrackerFactory(analytics),
      ]),
      propertySetterFactory: new CompositeFirebasePropertySetterFactory([
        new GenericFirebasePropertySetterFactory(analytics),
      ]),
    });

    await tracker.track(new TestScreenView('Home'));
    await tracker.track(new TestEvent('checkout_started'));
    await tracker.set(new TestProperty('plan', 'pro'));

    expect(jest.mocked(logEvent).mock.calls).toEqual([
      [analytics, 'screen_view', { screen_name: 'Home' }],
      [analytics, 'checkout_started', {}],
    ]);
    expect(setUserProperty).toHaveBeenCalledWith(analytics, 'plan', 'pro');
  });

  test('a generic factory anywhere but last is refused when the chain is built', () => {
    expect(
      () =>
        new CompositeFirebaseEventTrackerFactory([
          new GenericFirebaseEventTrackerFactory(analytics),
          new ScreenViewFirebaseEventTrackerFactory(analytics),
        ]),
    ).toThrow('GenericFirebaseEventTrackerFactory answers for everything');
  });

  test('a chain ending in RequireMapped reports an unclaimed event through Herald', async () => {
    const failures: unknown[] = [];
    const tracker = new FirebaseAnalyticsTrackerService({
      eventTrackerFactory: new CompositeFirebaseEventTrackerFactory([
        new ScreenViewFirebaseEventTrackerFactory(analytics),
        new RequireMappedFirebaseEventTrackerFactory(),
      ]),
      propertySetterFactory: new CompositeFirebasePropertySetterFactory([
        new RequireMappedFirebasePropertySetterFactory(),
      ]),
    });
    const herald = new Herald({
      providers: [new HeraldProvider({ name: 'firebase', events: tracker, properties: tracker })],
      errorReporter: (failure) => {
        failures.push(failure.error);
      },
    });

    await herald.track(new TestEvent('unwired'));
    await herald.set(new TestProperty('unwired', int(1)));

    expect(failures).toEqual([expect.any(UnhandledEventError), expect.any(UnhandledPropertyError)]);
    expect(logEvent).not.toHaveBeenCalled();
  });

  test('dropped keeps one event away from Firebase', async () => {
    const tracker = new FirebaseAnalyticsTrackerService({
      eventTrackerFactory: new CompositeFirebaseEventTrackerFactory([
        new DropDebugPingFirebaseEventTrackerFactory(),
        new GenericFirebaseEventTrackerFactory(analytics),
      ]),
      propertySetterFactory: new CompositeFirebasePropertySetterFactory([]),
    });

    await tracker.track(new TestEvent('debug_ping'));

    expect(logEvent).not.toHaveBeenCalled();
  });
});

describe('service', () => {
  test('consent maps to collection enabled', async () => {
    await new FirebaseAnalyticsService(analytics).setEnabled(false);

    expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(analytics, false);
  });

  test('identify and reset set and clear the user id', async () => {
    const service = new FirebaseAnalyticsService(analytics);

    await service.identify(new Identity('user-1'));
    await service.reset();

    expect(jest.mocked(setUserId).mock.calls).toEqual([
      [analytics, 'user-1'],
      [analytics, null],
    ]);
  });

  test('start and flush touch nothing, since Firebase starts itself and has no flush', async () => {
    const service = new FirebaseAnalyticsService(analytics);

    await service.start();
    await service.flush();

    for (const call of [logEvent, setUserProperty, setUserId, setAnalyticsCollectionEnabled]) {
      expect(call).not.toHaveBeenCalled();
    }
  });
});
