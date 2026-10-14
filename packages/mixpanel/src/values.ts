import type { AnalyticsValue } from '@herald-analytics/core';
import type { MixpanelProperties } from 'mixpanel-react-native';

/** The parameters with every type kept: Mixpanel takes text, numbers and flags as they are. */
export function toMixpanelProperties(
  parameters: Readonly<Record<string, AnalyticsValue>>,
): MixpanelProperties {
  const result: MixpanelProperties = {};
  for (const [key, value] of Object.entries(parameters)) result[key] = value.value;
  return result;
}
