import { AnalyticsValue } from '@herald-analytics/core';

/** Starts every record, so Herald's lines are easy to find. */
const logTag = '[herald]';

/** Length of the longest kind, `enabled`, so headlines line up. */
const kindWidth = 7;

/**
 * One record as one string: a headline, then one line per parameter, with values lined up. One
 * string, so another record can't split it.
 */
export function logRecord(
  kind: string,
  headline: string,
  parameters: Readonly<Record<string, AnalyticsValue>> = {},
): string {
  let record = `${logTag} ${headline === '' ? kind : `${kind.padEnd(kindWidth)} ${headline}`}`;
  const keys = Object.keys(parameters).sort();
  const keyWidth = Math.max(0, ...keys.map((key) => key.length));
  keys.forEach((key, index) => {
    const branch = index === keys.length - 1 ? '└─' : '├─';
    const value = AnalyticsValue.asString(parameters[key]!);
    record += `\n    ${branch} ${key.padEnd(keyWidth)} = ${value}`;
  });
  return record;
}
