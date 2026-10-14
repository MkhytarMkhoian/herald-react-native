import { beforeEach, expect, test } from '@jest/globals';
import { Herald, HeraldProvider, Identity, int } from '@herald-analytics/core';

import {
  CompositeLogEventTrackerFactory,
  CompositeLogPropertySetterFactory,
  GenericLogEventTrackerFactory,
  GenericLogPropertySetterFactory,
  LogAnalyticsService,
  LogAnalyticsTrackerService,
  ScreenViewLogEventTrackerFactory,
  type AnalyticsLogger,
} from '../index';
import {
  ClaimingLogEventTrackerFactory,
  MessageLogEventTracker,
  TestEvent,
  TestProperty,
  TestScreenView,
  ThrowingLogEventTracker,
} from './support';

let printed: string[];
const logger = (message: string) => {
  printed.push(message);
};

beforeEach(() => {
  printed = [];
});

/** The usual setup: screen views, then every other event, and every property. */
function tracker(logger: AnalyticsLogger) {
  return new LogAnalyticsTrackerService({
    eventTrackerFactory: new CompositeLogEventTrackerFactory([
      new ScreenViewLogEventTrackerFactory(logger),
      new GenericLogEventTrackerFactory(logger),
    ]),
    propertySetterFactory: new CompositeLogPropertySetterFactory([
      new GenericLogPropertySetterFactory(logger),
    ]),
  });
}

test('lifecycle, identity and consent calls each print one line, in order', async () => {
  const service = new LogAnalyticsService(logger);

  await service.start();
  await service.setEnabled(true);
  await service.identify(new Identity('user-1'));
  await service.flush();
  await service.reset();
  await service.setEnabled(false);

  expect(printed).toEqual([
    '[herald] start',
    '[herald] enabled true',
    '[herald] user    user-1',
    '[herald] flush',
    '[herald] reset',
    '[herald] enabled false',
  ]);
});

test('the tracker service prints what its chains decide, through Herald', async () => {
  const log = tracker(logger);
  const herald = new Herald({
    providers: [new HeraldProvider({ name: 'log', events: log, properties: log })],
  });

  await herald.track(new TestScreenView('home'));
  await herald.set(new TestProperty('plan', 'pro'));

  expect(printed).toEqual(['[herald] screen  home', '[herald] prop    plan = pro']);
});

test('an unclaimed event or property is ignored by a chain without a fallback', async () => {
  const log = new LogAnalyticsTrackerService({
    eventTrackerFactory: new CompositeLogEventTrackerFactory([
      new ScreenViewLogEventTrackerFactory(logger),
    ]),
    propertySetterFactory: new CompositeLogPropertySetterFactory([]),
  });

  await log.track(new TestEvent('ignored'));
  await log.set(new TestProperty('ignored', int(1)));

  expect(printed).toEqual([]);
});

test('the handlers of one event run in order, and a failure stops the rest', async () => {
  const log = new LogAnalyticsTrackerService({
    eventTrackerFactory: new ClaimingLogEventTrackerFactory('e', [
      new MessageLogEventTracker(logger, 'first'),
      new ThrowingLogEventTracker(),
      new MessageLogEventTracker(logger, 'third'),
    ]),
    propertySetterFactory: new CompositeLogPropertySetterFactory([]),
  });

  await expect(log.track(new TestEvent('e'))).rejects.toThrow('tracker failed');
  expect(printed).toEqual(['first']);
});
