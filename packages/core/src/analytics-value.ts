/**
 * A value that keeps its type, so a number reaches the vendor as a number. Apps write an
 * {@link AnalyticsInput}; vendor packages turn it into this.
 */
export type AnalyticsValue =
  | { readonly type: 'string'; readonly value: string }
  | { readonly type: 'int'; readonly value: number }
  | { readonly type: 'double'; readonly value: number }
  | { readonly type: 'bool'; readonly value: boolean };

/**
 * An event parameter or property value: text, true/false, or a number in {@link int} or
 * {@link double}. A bare number doesn't compile, because JavaScript can't tell `3` from `3.0`.
 */
export type AnalyticsInput = string | boolean | AnalyticsValue;

/** A whole number. Throws for a fraction such as 2.5. */
export function int(value: number): AnalyticsValue {
  if (!Number.isInteger(value)) {
    throw new RangeError(`int() needs a whole number, not ${value}. Use double() for a fraction.`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${value} is too big for JavaScript to keep exact.`);
  }
  return Object.freeze({ type: 'int', value });
}

/** A number that can have a fraction, such as a price. Throws for NaN and Infinity. */
export function double(value: number): AnalyticsValue {
  if (!Number.isFinite(value)) {
    throw new RangeError(`double() needs a finite number, not ${value}.`);
  }
  return Object.freeze({ type: 'double', value });
}

export const AnalyticsValue = {
  /** The typed value of an {@link AnalyticsInput}. Throws for anything else, such as a number. */
  from(input: AnalyticsInput): AnalyticsValue {
    if (typeof input === 'string') return Object.freeze({ type: 'string', value: input });
    if (typeof input === 'boolean') return Object.freeze({ type: 'bool', value: input });
    if (typeof input === 'number') {
      throw new TypeError(
        `A number must say its type: int(${input}) or double(${input}). ` +
          "JavaScript can't tell 3 from 3.0.",
      );
    }
    const value = input as { type?: unknown; value?: unknown } | null;
    if (value?.type === 'int' && typeof value.value === 'number') return int(value.value);
    if (value?.type === 'double' && typeof value.value === 'number') return double(value.value);
    if (value?.type === 'string' && typeof value.value === 'string') return input;
    if (value?.type === 'bool' && typeof value.value === 'boolean') return input;
    throw new TypeError(
      `An analytics value is text, true/false, int(…) or double(…), not ${JSON.stringify(input)}.`,
    );
  },

  /** The value as text, for vendors that take only text. A whole double keeps its `.0`. */
  asString(value: AnalyticsValue): string {
    if (value.type === 'double' && Number.isInteger(value.value)) return value.value.toFixed(1);
    return String(value.value);
  },
};
