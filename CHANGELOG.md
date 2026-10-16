# Change Log

## Version 1.0.0

_2026-10-16_

The first stable version, published under npm's `latest` tag: `npm install @herald-analytics/core`
now installs it. The packages' code is the same as in 1.0.0-beta.2.

 * New: the READMEs show how to install each vendor's own React Native package next to Herald's,
   and how to type-check an app that imports `react-native-appsflyer`.
 * New: the [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) shows the TypeScript
   code next to Android, Flutter and iOS, and has the API reference.

## Version 1.0.0-beta.2

_2026-10-16_

No changes to the packages: the first version published by GitHub Actions, with provenance, which
shows on npm where and how each package was built.

## Version 1.0.0-beta.1

_2026-10-16_

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
 * New: `@herald-analytics/react`, an optional package for tracking from React Native components,
   like Flutter's `herald_widgets`: `useTrackScreenView` and `useTrackOnScreen` track when a screen
   is shown or hidden, `useImpressions` tracks list items once they are really on screen, and
   `useAnalytics` gives components the tracker for taps. It works with React Navigation 7, and with
   Expo Router 57 or newer through `@herald-analytics/react/expo-router`.
 * New: an example app, built with Expo Router, that sends every call to the log and to an
   on-screen timeline.
