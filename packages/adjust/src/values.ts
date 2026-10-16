import { AdjustEvent } from 'react-native-adjust';
import { AnalyticsValue } from '@herald-analytics/core';

/** An `AdjustEvent` for `eventToken`, with the parameters as callback parameters, as text. */
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
