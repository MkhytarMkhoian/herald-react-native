import type { AnalyticsValue } from '@herald-analytics/core';

/** The App Events calls Herald makes. Pass `AppEventsLogger` from `react-native-fbsdk-next` 13. */
export interface MetaAppEvents {
  logEvent(eventName: string, parameters: Record<string, string | number>): void;
  logPurchase(
    purchaseAmount: number,
    currencyCode: string,
    parameters?: Record<string, string | number>,
  ): void;
  flush(): void;
  setUserID(userID: string | null): void;
}

/** The settings Herald changes. Pass `Settings` from `react-native-fbsdk-next` 13. */
export interface MetaSettings {
  initializeSDK(): void;
  setAutoLogAppEventsEnabled(enabled: boolean): void;
  setAdvertiserIDCollectionEnabled(enabled: boolean): void;
}

/**
 * Parameters as Meta takes them: numbers stay numbers, and true/false becomes text, since Meta's
 * parameters are text or numbers.
 */
export function toMetaParameters(
  parameters: Readonly<Record<string, AnalyticsValue>>,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(parameters)) {
    result[key] = value.type === 'bool' ? String(value.value) : value.value;
  }
  return result;
}
