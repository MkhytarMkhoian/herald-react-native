import { describe, expect, test } from '@jest/globals';

import {
  AnalyticsFailure,
  FlushOperation,
  Identity,
  IdentifyOperation,
  SetEnabledOperation,
  SetPropertyOperation,
  StartOperation,
  TrackOperation,
  UnhandledEventError,
  UnhandledPropertyError,
} from '../index';
import { TestEvent, TestProperty } from './support';

describe('operations', () => {
  test('are equal by kind and name', () => {
    expect(new TrackOperation('a')).toStrictEqual(new TrackOperation('a'));
    expect(new TrackOperation('a')).not.toStrictEqual(new TrackOperation('b'));
    expect(new SetEnabledOperation(true)).not.toStrictEqual(new SetEnabledOperation(false));
  });

  test('of different kinds are not equal, even with the same name', () => {
    expect(new StartOperation()).not.toStrictEqual(new FlushOperation());
  });

  test('print their kind and name', () => {
    expect(`${new TrackOperation('checkout')}`).toBe('Track(checkout)');
    expect(`${new SetPropertyOperation('plan')}`).toBe('SetProperty(plan)');
    expect(`${new SetEnabledOperation(false)}`).toBe('SetEnabled(false)');
    expect(`${new IdentifyOperation()}`).toBe('Identify');
  });
});

test('a failure reads as one line with the vendor, the call and the error', () => {
  const failure = new AnalyticsFailure(
    'analytics',
    new TrackOperation('checkout_started'),
    new Error('down'),
  );

  expect(`${failure}`).toBe('analytics failed on Track(checkout_started): Error: down');
});

describe('identity', () => {
  test('identities are equal by user id', () => {
    expect(new Identity('u')).toStrictEqual(new Identity('u'));
    expect(new Identity('u')).not.toStrictEqual(new Identity('v'));
  });

  test('hides its user id as text and as JSON', () => {
    const identity = new Identity('user-42');

    expect(`${identity}`).not.toContain('user-42');
    expect(JSON.stringify({ identity })).not.toContain('user-42');
    expect(identity.userId).toBe('user-42');
  });
});

describe('unhandled errors', () => {
  test('an unhandled event names the event and its class', () => {
    const error = new UnhandledEventError(new TestEvent('checkout'));

    expect(error.message).toContain("No factory claimed event 'checkout' (TestEvent)");
    expect(`${error}`).toMatch(/^UnhandledEventError: /);
  });

  test('an unhandled property names the property and its class', () => {
    const error = new UnhandledPropertyError(new TestProperty('plan', 'pro'));

    expect(error.message).toContain("No factory claimed property 'plan' (TestProperty)");
    expect(error).toBeInstanceOf(Error);
  });
});
