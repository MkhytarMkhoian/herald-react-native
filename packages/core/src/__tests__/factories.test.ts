import { describe, expect, test } from '@jest/globals';

import { Resolution, requireFallbackLast, type FallbackFactory } from '../index';

const handler = 'a-handler';

class Partial {
  toString() {
    return 'Partial';
  }
}

class Fallback implements FallbackFactory {
  readonly isFallback = true;

  toString() {
    return 'Fallback';
  }
}

class UnnamedFallback implements FallbackFactory {
  readonly isFallback = true;
}

describe('Resolution', () => {
  test('claimed carries its handlers', () => {
    expect(Resolution.claimed([handler]).handlers).toEqual([handler]);
  });

  test('claimed refuses an empty list and points to dropped', () => {
    expect(() => Resolution.claimed([])).toThrow('Use dropped()');
  });

  test('claimed keeps its own copy of the handlers', () => {
    const handlers = [handler];
    const claimed = Resolution.claimed(handlers);

    handlers.push('another');

    expect(claimed.handlers).toEqual([handler]);
  });

  test('claimed resolutions with the same handlers are equal', () => {
    expect(Resolution.claimed(['a', 'b'])).toEqual(Resolution.claimed(['a', 'b']));
    expect(Resolution.claimed(['a'])).not.toEqual(Resolution.claimed(['b']));
  });

  test('dropped and declined carry no handlers, and are not equal', () => {
    expect(Resolution.dropped().handlers).toEqual([]);
    expect(Resolution.declined().handlers).toEqual([]);
    expect(Resolution.dropped()).not.toEqual(Resolution.declined());
  });

  test('dropped and declined fit a resolution of any handler type', () => {
    const dropped: Resolution<number> = Resolution.dropped();
    const declined: Resolution<number> = Resolution.declined();

    expect(dropped.kind).toBe('dropped');
    expect(declined.kind).toBe('declined');
  });
});

describe('Resolution.firstOf', () => {
  const ask = (answer: Resolution<string>) => answer;

  test("returns the first answer that isn't a decline", () => {
    const answer = Resolution.firstOf(
      [Resolution.declined(), Resolution.claimed(['first']), Resolution.claimed(['second'])],
      ask,
    );

    expect(answer).toEqual(Resolution.claimed(['first']));
  });

  test('counts dropped as an answer', () => {
    expect(Resolution.firstOf([Resolution.declined(), Resolution.dropped()], ask)).toBe(
      Resolution.dropped(),
    );
  });

  test('declines when all decline, or there are none', () => {
    expect(Resolution.firstOf([Resolution.declined()], ask)).toBe(Resolution.declined());
    expect(Resolution.firstOf([], ask)).toBe(Resolution.declined());
  });

  test('stops asking once one has answered', () => {
    const asked: number[] = [];
    const answers = [Resolution.declined(), Resolution.dropped(), Resolution.declined()];

    Resolution.firstOf([0, 1, 2], (index) => {
      asked.push(index);
      return answers[index]!;
    });

    expect(asked).toEqual([0, 1]);
  });
});

describe('requireFallbackLast', () => {
  test('accepts a chain with the fallback last', () => {
    requireFallbackLast([new Partial(), new Partial(), new Fallback()]);
  });

  test('accepts a chain without a fallback', () => {
    requireFallbackLast([new Partial(), new Partial()]);
    requireFallbackLast([]);
  });

  test('refuses a fallback in the middle, with its name and position', () => {
    expect(() => requireFallbackLast([new Partial(), new Fallback(), new Partial()])).toThrow(
      'Fallback answers for everything, so nothing placed after it is ever asked. ' +
        'It is factory 2 of 3; move it to the end.',
    );
  });

  test('refuses a fallback first in a longer chain', () => {
    expect(() => requireFallbackLast([new Fallback(), new Partial()])).toThrow('factory 1 of 2');
  });

  test('refuses two fallbacks', () => {
    expect(() => requireFallbackLast([new Partial(), new Fallback(), new Fallback()])).toThrow(
      'A chain can end in one fallback factory; this one has 2: ' +
        'Fallback (factory 2), Fallback (factory 3).',
    );
  });

  test('names a factory without its own toString by its class', () => {
    expect(() => requireFallbackLast([new UnnamedFallback(), new Partial()])).toThrow(
      /^UnnamedFallback answers for everything/,
    );
  });
});
