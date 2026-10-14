import { AdjustEvent } from 'react-native-adjust';
import { AnalyticsValue } from '@herald-analytics/core';

/**
 * An `AdjustEvent` for the dashboard event `eventToken`, with these parameters as callback
 * parameters. Adjust's parameters are text, so values are sent in their string form.
 */
export function toAdjustEvent(
  parameters: Readonly<Record<string, AnalyticsValue>>,
  eventToken: string,
): AdjustEvent {
  const adjustEvent = new AdjustEvent(eventToken);
  for (const [key, value] of Object.entries(parameters)) {
    adjustEvent.addCallbackParameter(key, AnalyticsValue.asString(value));
  }
  return adjustEvent;
}
