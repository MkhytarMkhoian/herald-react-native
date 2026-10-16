# Herald example

An Expo Router app that sends every Herald call to the log and to an on-screen timeline.

It tracks screen views both ways Herald supports, so you can compare them:

- **Home and Product** use `useTrackScreenView` from the optional `@herald-analytics/react` package.
  A screen view is tracked each time the screen becomes visible, also when the user comes back to
  it.
- **Settings** tracks its own screen view with plain Herald, through the `EventTrackerService` it
  is given: once each time it opens. No extra package.

Home's product rows are tracked as impressions with `useImpressions`, once each is half on screen
for half a second. The other events (added to cart, order paid, consent, sign-in) are tracked the
plain way, from the screen that owns them.

`src/analytics/herald.ts` is the one place that knows the vendors. This app has two: the log, in
debug builds, and `TimelineAnalytics`, a provider of its own that shows every call on Home.

Run it from this folder with `npx expo run:ios` or `npx expo run:android`, and watch the timeline on
Home and the `[herald]` lines in the bundler's output.

The `plugins/with-scene-delegate.js` config plugin makes the iOS app adopt UIKit's scene life
cycle, which iOS 27 requires. Expo 57 ships what it needs, but its app template doesn't use it yet.
