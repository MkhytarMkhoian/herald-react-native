# Herald example

An Expo Router app that sends every Herald call to the log and to an on-screen timeline.

It tracks screen views both ways Herald supports, so you can compare them:

- **Home and Product** use `useTrackScreenView` from `@herald-analytics/react`: each time the screen
  becomes visible, also when the user comes back to it.
- **Settings** tracks its own screen view with plain Herald: once each time it opens.

Home's product rows are tracked with `useImpressions`, once each is half on screen for half a
second. The other events are tracked from the screen that owns them.

`src/analytics/herald.ts` is the one place that knows the vendors: the log, in debug builds, and
`TimelineAnalytics`, the app's own provider, which shows every call on Home.

Run it from this folder with `npx expo run:ios` or `npx expo run:android`, and watch the timeline on
Home and the `[herald]` lines in the bundler's output.

The `plugins/with-scene-delegate.js` config plugin makes the iOS app use UIKit scenes, which iOS 27
requires and Expo 57's template doesn't set up yet.
