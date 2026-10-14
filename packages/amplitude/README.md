# Herald for Amplitude

Sends Herald events and properties to Amplitude, over
[`@amplitude/analytics-react-native`](https://www.npmjs.com/package/@amplitude/analytics-react-native):
events, user properties, screen views and revenue.

```ts
import * as amplitude from '@amplitude/analytics-react-native';

amplitude.init(apiKey, undefined, { optOut: true }); // silent until consent

const tracker = new AmplitudeAnalyticsTrackerService({
  eventTrackerFactory: new CompositeAmplitudeEventTrackerFactory([
    new ScreenViewAmplitudeEventTrackerFactory(amplitude),
    new GenericAmplitudeEventTrackerFactory(amplitude),
  ]),
  propertySetterFactory: new CompositeAmplitudePropertySetterFactory([
    new GenericAmplitudePropertySetterFactory(amplitude),
  ]),
});
const service = new AmplitudeAnalyticsService(amplitude);
```

An instance from `amplitude.createInstance()` works the same way.

Values keep their types. A screen view becomes `[Amplitude] Screen Viewed`, so don't also call
Amplitude's own `trackScreenView` or `trackScreenViewOnNavigationStateChange`. Purchases go
through `AmplitudeRevenueEvent` and `RevenueAmplitudeEventTracker`, deduplicated by `insertId`.

A call is done once Amplitude has the event: Herald doesn't wait for the upload. Call `setEnabled`
with the stored answer after `start` on every launch.

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
