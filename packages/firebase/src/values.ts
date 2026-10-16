import { AnalyticsValue } from '@herald-analytics/core';

/** The parameters as GA4 takes them: numbers stay numbers, and true/false becomes text. */
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
