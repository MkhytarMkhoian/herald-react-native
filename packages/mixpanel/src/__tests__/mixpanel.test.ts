import { beforeEach, describe, expect, test } from '@jest/globals';
import {
  Identity,
  Resolution,
  UnhandledEventError,
  UnhandledPropertyError,
  double,
  int,
  parametersOf,
} from '@herald-analytics/core';
import type { Mixpanel } from 'mixpanel-react-native';

import {
  CompositeMixpanelEventTrackerFactory,
  CompositeMixpanelPropertySetterFactory,
  GenericMixpanelEventTracker,
  GenericMixpanelEventTrackerFactory,
  GenericMixpanelPropertySetter,
  GenericMixpanelPropertySetterFactory,
  MixpanelAnalyticsService,
  MixpanelAnalyticsTrackerService,
  RequireMappedMixpanelEventTrackerFactory,
  RequireMappedMixpanelPropertySetterFactory,
  ScreenViewMixpanelEventTracker,
  ScreenViewMixpanelEventTrackerFactory,
  UserPropertyMixpanelPropertySetter,
  UserPropertyMixpanelPropertySetterFactory,
  toMixpanelProperties,
} from '../index';
import { TestEvent, TestProperty, TestScreenView, TestUserProperty } from './support';

/** A Mixpanel that records each call, in order, as [method, ...arguments]. */
function recordingMixpanel(calls: unknown[][]): Mixpanel {
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push([method, ...args]);
    };
  return {
    track: record('track'),
    registerSuperProperties: record('registerSuperProperties'),
    getPeople: () => ({ set: record('people.set') }),
    flush: record('flush'),
    optInTracking: record('optInTracking'),
    optOutTracking: record('optOutTracking'),
    identify: async (id: string) => {
      calls.push(['identify', id]);
    },
    reset: record('reset'),
  } as unknown as Mixpanel;
}

let calls: unknown[][];
let mixpanel: Mixpanel;

beforeEach(() => {
  calls = [];
  mixpanel = recordingMixpanel(calls);
});

test('parameters keep their types', () => {
  const event = new TestEvent('e', {
    plan: 'pro',
    seats: int(3),
    price: double(9.99),
    trial: false,
  });

  expect(toMixpanelProperties(parametersOf(event))).toEqual({
    plan: 'pro',
    seats: 3,
    price: 9.99,
    trial: false,
  });
});

describe('trackers', () => {
  test('the generic tracker sends the event under its own name', async () => {
    await new GenericMixpanelEventTracker(
      new TestEvent('checkout_started', { seats: int(3) }),
      mixpanel,
    ).track();

    expect(calls).toEqual([['track', 'checkout_started', { seats: 3 }]]);
  });

  test('a screen view is screen_view, with its name as screen_name', async () => {
    await new ScreenViewMixpanelEventTracker(
      new TestScreenView('CheckoutScreen', { source: 'cart' }),
      mixpanel,
    ).track();

    expect(calls).toEqual([
      ['track', 'screen_view', { source: 'cart', screen_name: 'CheckoutScreen' }],
    ]);
  });

  test('a screen view with its own screen_name parameter is refused, and nothing is sent', async () => {
    const tracker = new ScreenViewMixpanelEventTracker(
      new TestScreenView('CheckoutScreen', { screen_name: 'other' }),
      mixpanel,
    );

    await expect(tracker.track()).rejects.toThrow("can't have a 'screen_name' parameter");
    expect(calls).toEqual([]);
  });

  test('a property becomes a super property, with its type', async () => {
    await new GenericMixpanelPropertySetter(new TestProperty('seats', int(2)), mixpanel).set();

    expect(calls).toEqual([['registerSuperProperties', { seats: 2 }]]);
  });

  test('a user property is written to the People profile', async () => {
    await new UserPropertyMixpanelPropertySetter(
      new TestUserProperty('plan', 'pro'),
      mixpanel,
    ).set();

    expect(calls).toEqual([['people.set', 'plan', 'pro']]);
  });
});

describe('factories', () => {
  let tracker: MixpanelAnalyticsTrackerService;

  beforeEach(() => {
    tracker = new MixpanelAnalyticsTrackerService({
      eventTrackerFactory: new CompositeMixpanelEventTrackerFactory([
        new ScreenViewMixpanelEventTrackerFactory(mixpanel),
        new GenericMixpanelEventTrackerFactory(mixpanel),
      ]),
      propertySetterFactory: new CompositeMixpanelPropertySetterFactory([
        new UserPropertyMixpanelPropertySetterFactory(mixpanel),
        new GenericMixpanelPropertySetterFactory(mixpanel),
      ]),
    });
  });

  test('a user property reaches the profile and an ordinary one the super properties', async () => {
    await tracker.set(new TestUserProperty('plan', 'pro'));
    await tracker.set(new TestProperty('theme', 'dark'));

    expect(calls).toEqual([
      ['people.set', 'plan', 'pro'],
      ['registerSuperProperties', { theme: 'dark' }],
    ]);
  });

  test('screen views and other events take their own paths', async () => {
    await tracker.track(new TestScreenView('Home'));
    await tracker.track(new TestEvent('checkout_started'));

    expect(calls).toEqual([
      ['track', 'screen_view', { screen_name: 'Home' }],
      ['track', 'checkout_started', {}],
    ]);
  });

  test('the user-property factory declines an ordinary property', () => {
    expect(
      new UserPropertyMixpanelPropertySetterFactory(mixpanel).create(new TestProperty('a', int(1))),
    ).toBe(Resolution.declined());
  });

  test('the require-mapped factories throw for anything that reaches them', () => {
    expect(() => new RequireMappedMixpanelEventTrackerFactory().create(new TestEvent('e'))).toThrow(
      UnhandledEventError,
    );
    expect(() =>
      new RequireMappedMixpanelPropertySetterFactory().create(new TestProperty('p', int(1))),
    ).toThrow(UnhandledPropertyError);
  });
});

describe('service', () => {
  let service: MixpanelAnalyticsService;

  beforeEach(() => {
    service = new MixpanelAnalyticsService(mixpanel);
  });

  test("start doesn't touch Mixpanel, so it never opts out", async () => {
    await service.start();

    expect(calls).toEqual([]);
  });

  test('revoking consent flushes before opting out, and granting opts in', async () => {
    await service.setEnabled(false);
    await service.setEnabled(true);

    expect(calls).toEqual([['flush'], ['optOutTracking'], ['optInTracking']]);
  });

  test('flush sends what Mixpanel has buffered', async () => {
    await service.flush();

    expect(calls).toEqual([['flush']]);
  });

  test('identify and reset reach Mixpanel', async () => {
    await service.identify(new Identity('user-1'));
    await service.reset();

    expect(calls).toEqual([['identify', 'user-1'], ['reset']]);
  });
});
