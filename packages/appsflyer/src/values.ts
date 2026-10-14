import type { AnalyticsValue } from '@herald-analytics/core';

/**
 * The AppsFlyer calls Herald makes. Pass `AppsFlyer` from `react-native-appsflyer` 7, after
 * `init`.
 */
export interface AppsFlyerClient {
  logEvent(params: {
    eventName: string;
    eventValues?: Record<string, unknown> | null;
  }): Promise<void>;
  logAdRevenue(params: {
    monetizationNetwork: string;
    mediationNetwork: string;
    currencyIso4217Code: string;
    revenue: number;
    additionalParameters?: Record<string, unknown> | null;
  }): Promise<void>;
  start(): Promise<void>;
  stop(params: { shouldStop: boolean }): Promise<void>;
  setCustomerUserId(params: { customerId: string }): Promise<void>;
}

/**
 * The parameters with their types kept. AppsFlyer counts revenue only when `af_revenue` arrives as a
 * number, so a number must stay one.
 */
export function toAppsFlyerEventValues(
  parameters: Readonly<Record<string, AnalyticsValue>>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(parameters)) result[key] = value.value;
  return result;
}
