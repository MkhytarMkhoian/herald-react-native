import { AnalyticsValue } from '@herald-analytics/core';

/** A value as an app writes it, so a failure shows `int(3)` against `'3'`. */
export function describeValue(value: AnalyticsValue): string {
  switch (value.type) {
    case 'string':
      return `'${value.value}'`;
    case 'bool':
      return `${value.value}`;
    case 'int':
      return `int(${value.value})`;
    case 'double':
      return `double(${value.value})`;
  }
}

/** Parameters as failures show them: sorted by key, or nothing when there are none. */
export function describeParameters(parameters: Readonly<Record<string, AnalyticsValue>>): string {
  const keys = Object.keys(parameters).sort();
  if (keys.length === 0) return '';
  const entries = keys.map((key) => `${key} = ${AnalyticsValue.asString(parameters[key]!)}`);
  return ` { ${entries.join(', ')} }`;
}

export function sameValue(a: AnalyticsValue, b: AnalyticsValue): boolean {
  return a.type === b.type && a.value === b.value;
}
