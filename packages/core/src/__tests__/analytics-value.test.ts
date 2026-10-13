import { describe, expect, test } from '@jest/globals';

import {
  AnalyticsValue,
  double,
  int,
  parametersOf,
  propertyValueOf,
  type EventParameters,
} from '../index';
import { TestEvent, TestProperty } from './support';

describe('int and double', () => {
  test('int keeps a whole number', () => {
    expect(int(3)).toEqual({ type: 'int', value: 3 });
  });

  test('int refuses a fraction and points to double', () => {
    expect(() => int(2.5)).toThrow(
      'int() needs a whole number, not 2.5. Use double() for a fraction.',
    );
    expect(() => int(Number.NaN)).toThrow(RangeError);
  });

  test('int refuses a number too big to be exact', () => {
    expect(() => int(2 ** 53)).toThrow('too big');
  });

  test('double keeps any finite number', () => {
    expect(double(9.99)).toEqual({ type: 'double', value: 9.99 });
    expect(double(3)).toEqual({ type: 'double', value: 3 });
  });

  test('double refuses NaN and Infinity', () => {
    expect(() => double(Number.NaN)).toThrow('double() needs a finite number, not NaN.');
    expect(() => double(Infinity)).toThrow(RangeError);
  });

  test('a bare number does not compile', () => {
    // @ts-expect-error a number must say int() or double()
    const parameters: EventParameters = { seats: 3 };
    expect(parameters).toBeDefined();
  });
});

describe('AnalyticsValue.from', () => {
  test('types text and true/false, and keeps typed numbers', () => {
    expect(AnalyticsValue.from('pro')).toEqual({ type: 'string', value: 'pro' });
    expect(AnalyticsValue.from(false)).toEqual({ type: 'bool', value: false });
    expect(AnalyticsValue.from(int(3))).toEqual({ type: 'int', value: 3 });
    expect(AnalyticsValue.from(double(9.99))).toEqual({ type: 'double', value: 9.99 });
  });

  test('refuses a bare number from plain JavaScript and shows both fixes', () => {
    expect(() => AnalyticsValue.from(3 as never)).toThrow(
      "A number must say its type: int(3) or double(3). JavaScript can't tell 3 from 3.0.",
    );
  });

  test('checks a typed value built by hand', () => {
    expect(() => AnalyticsValue.from({ type: 'int', value: 2.5 })).toThrow('whole number');
    expect(() => AnalyticsValue.from({ type: 'int', value: '3' } as never)).toThrow(TypeError);
  });

  test('refuses anything else', () => {
    for (const input of [null, undefined, [], {}, { type: 'date', value: 1 }]) {
      expect(() => AnalyticsValue.from(input as never)).toThrow(
        'An analytics value is text, true/false, int(…) or double(…)',
      );
    }
  });

  test('values are equal by type and value, so 3 is not "3"', () => {
    expect(int(3)).toEqual(int(3));
    expect(int(3)).not.toEqual(AnalyticsValue.from('3'));
    expect(double(3)).not.toEqual(int(3));
    expect(AnalyticsValue.from(true)).not.toEqual(AnalyticsValue.from('true'));
  });
});

describe('AnalyticsValue.asString', () => {
  test('is the value as text', () => {
    expect(AnalyticsValue.asString(AnalyticsValue.from('pro'))).toBe('pro');
    expect(AnalyticsValue.asString(int(3))).toBe('3');
    expect(AnalyticsValue.asString(double(9.99))).toBe('9.99');
    expect(AnalyticsValue.asString(AnalyticsValue.from(true))).toBe('true');
  });

  test('keeps the .0 of a whole double, as on Android and iOS', () => {
    expect(AnalyticsValue.asString(double(3))).toBe('3.0');
  });
});

describe('parametersOf and propertyValueOf', () => {
  test('type every parameter', () => {
    const event = new TestEvent('checkout', { plan: 'pro', seats: int(3) });

    expect(parametersOf(event)).toEqual({ plan: { type: 'string', value: 'pro' }, seats: int(3) });
  });

  test('an event without parameters has none', () => {
    expect(parametersOf({ name: 'an_event' })).toEqual({});
  });

  test('a bad parameter is named, with the event', () => {
    const event = new TestEvent('checkout', { seats: 3 as never });

    expect(() => parametersOf(event)).toThrow(
      "Parameter 'seats' of event 'checkout': A number must say its type",
    );
  });

  test('a property value is typed, and a bad one is named', () => {
    expect(propertyValueOf(new TestProperty('plan', 'pro'))).toEqual({
      type: 'string',
      value: 'pro',
    });
    expect(() => propertyValueOf(new TestProperty('seats', 3 as never))).toThrow(
      "Property 'seats': A number must say its type",
    );
  });
});
