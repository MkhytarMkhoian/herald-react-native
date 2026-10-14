import type { AnalyticsValue } from '@herald-analytics/core';
import type { Types } from '@amplitude/analytics-react-native';

/**
 * The Amplitude client Herald calls: an instance from `createInstance()`, or the default one,
 * `import * as amplitude from '@amplitude/analytics-react-native'`.
 */
export type AmplitudeClient = Pick<
  Types.ReactNativeClient,
  'track' | 'identify' | 'revenue' | 'flush' | 'setOptOut' | 'setUserId' | 'reset'
>;

/** The parameters with every type kept: Amplitude takes text, numbers and flags as they are. */
export function toAmplitudeProperties(
  parameters: Readonly<Record<string, AnalyticsValue>>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(parameters)) result[key] = value.value;
  return result;
}
