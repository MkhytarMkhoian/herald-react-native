import { AnalyticsValue } from '@herald-analytics/core';

/** Starts every record, so Herald's lines are easy to filter. */
const logTag = '[herald]';

/** Length of the longest kind, `enabled`, so headlines line up. */
const kindWidth = 7;

/**
 * Renders one record as one string: a header line, then a branch per parameter with the last one
 * closed by `└─`, values aligned on the longest key.
 *
 * One string, and one log call, so a record can't be split by another one. A record with no
 * headline (`reset`, `start`, `flush`) is the bare kind, with no padding to trail the line.
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
