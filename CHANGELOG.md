# Change Log

## Version 1.0.0-beta.1

_Unreleased_

The first preview of Herald for React Native: the design of the other SDKs, in TypeScript.

 * New: `@herald-analytics/core`, in plain TypeScript: events and properties with typed values,
   labels such as `ScreenViewEvent`, the five capability interfaces, the factory chain and the
   `Herald` fan-out.
 * New: `@herald-analytics/log`, which prints every call in the format of the other SDKs.
 * New: `@herald-analytics/testing`, with `FakeAnalyticsProvider` and its assertions. A failed
   assertion throws an `AnalyticsAssertionError`, so it works with any test runner.
 * New: `@herald-analytics/firebase`, `@herald-analytics/adjust`, `@herald-analytics/mixpanel`,
   `@herald-analytics/appsflyer` and `@herald-analytics/amplitude`, over
   `@react-native-firebase/analytics` 26, `react-native-adjust` 5, `mixpanel-react-native` 4,
   `react-native-appsflyer` 7 and `@amplitude/analytics-react-native` 1.
