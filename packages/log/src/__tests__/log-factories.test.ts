import { beforeEach, expect, test } from '@jest/globals';
import { Resolution, UnhandledEventError, UnhandledPropertyError } from '@herald-analytics/core';

import {
  CompositeLogEventTrackerFactory,
  GenericLogEventTracker,
  GenericLogEventTrackerFactory,
  GenericLogPropertySetter,
  GenericLogPropertySetterFactory,
  RequireMappedLogEventTrackerFactory,
  RequireMappedLogPropertySetterFactory,
  ScreenViewLogEventTracker,
  ScreenViewLogEventTrackerFactory,
} from '../index';
import {
  ClaimingLogEventTrackerFactory,
  MessageLogEventTracker,
  TestEvent,
  TestProperty,
  TestScreenView,
} from './support';

const event = new TestEvent('an_event');
const screenView = new TestScreenView('checkout');
const property = new TestProperty('plan', 'pro');

let printed: string[];
const logger = (message: string) => {
  printed.push(message);
};

beforeEach(() => {
  printed = [];
});

test('the screen-view factory claims screen views and declines the rest', () => {
  const factory = new ScreenViewLogEventTrackerFactory(logger);

  expect(factory.create(screenView).handlers).toEqual([expect.any(ScreenViewLogEventTracker)]);
  expect(factory.create(event)).toBe(Resolution.declined());
});

test('the generic factories claim everything', () => {
  expect(new GenericLogEventTrackerFactory(logger).create(screenView).handlers).toEqual([
    expect.any(GenericLogEventTracker),
  ]);
  expect(new GenericLogPropertySetterFactory(logger).create(property).handlers).toEqual([
    expect.any(GenericLogPropertySetter),
  ]);
});

test('the require-mapped factories fail for anything that reaches them', () => {
  expect(() => new RequireMappedLogEventTrackerFactory().create(event)).toThrow(
    UnhandledEventError,
  );
  expect(() => new RequireMappedLogPropertySetterFactory().create(property)).toThrow(
    UnhandledPropertyError,
  );
});

test('a chain takes the first factory that does not decline', () => {
  const chain = new CompositeLogEventTrackerFactory([
    new ScreenViewLogEventTrackerFactory(logger),
    new GenericLogEventTrackerFactory(logger),
  ]);

  expect(chain.create(screenView).handlers).toEqual([expect.any(ScreenViewLogEventTracker)]);
  expect(chain.create(event).handlers).toEqual([expect.any(GenericLogEventTracker)]);
});

test('a chain with its fallback anywhere but last is refused', () => {
  expect(
    () =>
      new CompositeLogEventTrackerFactory([
        new GenericLogEventTrackerFactory(logger),
        new ScreenViewLogEventTrackerFactory(logger),
      ]),
  ).toThrow('GenericLogEventTrackerFactory answers for everything');
});

test('a custom factory placed first takes its event from the generic one', async () => {
  const chain = new CompositeLogEventTrackerFactory([
    new ClaimingLogEventTrackerFactory('an_event', [new MessageLogEventTracker(logger, 'custom')]),
    new GenericLogEventTrackerFactory(logger),
  ]);

  await chain.create(event).handlers[0]?.track();

  expect(printed).toEqual(['custom']);
  expect(chain.create(screenView).handlers).toEqual([expect.any(GenericLogEventTracker)]);
});
