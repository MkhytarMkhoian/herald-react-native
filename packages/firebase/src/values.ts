import { AnalyticsValue } from '@herald-analytics/core';

/**
 * The parameters with their types kept where GA4 has a matching type.
 *
 * GA4 accepts string and number parameters, so a number arrives as a number and stays aggregable.
 * It has no boolean parameter type, so a flag is written as its string form, `'true'` or `'false'`.
 */
export function toFirebaseParameters(
  parameters: Readonly<Record<string, AnalyticsValue>>,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(parameters)) {
    result[key] =
      value.type === 'int' || value.type === 'double'
        ? value.value
        : AnalyticsValue.asString(value);
  }
  return result;
}
