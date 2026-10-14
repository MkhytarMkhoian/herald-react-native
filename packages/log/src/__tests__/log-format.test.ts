import { beforeEach, expect, test } from '@jest/globals';
import { Identity, double, int } from '@herald-analytics/core';

import {
  GenericLogEventTracker,
  GenericLogPropertySetter,
  LogAnalyticsService,
  ScreenViewLogEventTracker,
} from '../index';
import { TestEvent, TestProperty, TestScreenView } from './support';

let printed: string[];
const logger = (message: string) => {
  printed.push(message);
};

beforeEach(() => {
  printed = [];
});

test('an event prints with its parameters, as one record', async () => {
  await new GenericLogEventTracker(
    new TestEvent('checkout_started', {
      plan: 'pro',
      seats: int(3),
      price: double(9.99),
      trial: false,
    }),
    logger,
  ).track();

  expect(printed).toEqual([
    [
      '[herald] event   checkout_started',
      '    ├─ plan  = pro',
      '    ├─ price = 9.99',
      '    ├─ seats = 3',
      '    └─ trial = false',
    ].join('\n'),
  ]);
});

test('keys are sorted, so the same event always prints the same way', async () => {
  await new GenericLogEventTracker(new TestEvent('e', { zulu: 'z', alpha: 'a' }), logger).track();

  expect(printed).toEqual(['[herald] event   e\n    ├─ alpha = a\n    └─ zulu  = z']);
});

test('a single parameter is closed, not branched', async () => {
  await new GenericLogEventTracker(new TestEvent('e', { only: int(1) }), logger).track();

  expect(printed).toEqual(['[herald] event   e\n    └─ only = 1']);
});

test('a whole double keeps its .0, so it reads as a double', async () => {
  await new GenericLogEventTracker(new TestEvent('e', { price: double(5) }), logger).track();

  expect(printed).toEqual(['[herald] event   e\n    └─ price = 5.0']);
});

test('a screen view prints its name, with its parameters', async () => {
  await new ScreenViewLogEventTracker(
    new TestScreenView('checkout', { source: 'cart' }),
    logger,
  ).track();

  expect(printed).toEqual(['[herald] screen  checkout\n    └─ source = cart']);
});

test('a property prints as name = value', async () => {
  await new GenericLogPropertySetter(new TestProperty('seats', int(2)), logger).set();

  expect(printed).toEqual(['[herald] prop    seats = 2']);
});

test('a bare number from plain JavaScript fails instead of printing', async () => {
  const event = new TestEvent('e', { seats: 3 as never });

  await expect(new GenericLogEventTracker(event, logger).track()).rejects.toThrow(
    "Parameter 'seats' of event 'e'",
  );
  expect(printed).toEqual([]);
});

test('kinds are padded so headlines line up', async () => {
  await new GenericLogEventTracker(new TestEvent('x'), logger).track();
  await new ScreenViewLogEventTracker(new TestScreenView('x'), logger).track();
  await new GenericLogPropertySetter(new TestProperty('x', int(1)), logger).set();
  await new LogAnalyticsService(logger).identify(new Identity('x'));
  await new LogAnalyticsService(logger).setEnabled(true);

  // '[herald] ' and a 7-wide kind with a space after it: every headline starts at column 17.
  expect(printed.map((line) => line.substring(17))).toEqual(['x', 'x', 'x = 1', 'x', 'true']);
});
