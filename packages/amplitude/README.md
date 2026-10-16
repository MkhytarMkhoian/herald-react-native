# Herald for Amplitude

Sends Herald events and properties to Amplitude, over
[`@amplitude/analytics-react-native`](https://www.npmjs.com/package/@amplitude/analytics-react-native):
events, user properties, screen views and revenue.

```bash
npx expo install @amplitude/analytics-react-native @react-native-async-storage/async-storage
npm install @herald-analytics/core @herald-analytics/amplitude
```

Install the vendor's package yourself, as on the first line, so React Native links its native
code. Then follow its own setup guide.

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

An instance from `amplitude.createInstance()` works too.

A screen view becomes `[Amplitude] Screen Viewed`, so don't also track screens with Amplitude
itself. Purchases go through `AmplitudeRevenueEvent` and `RevenueAmplitudeEventTracker`.

Amplitude doesn't remember the opt-out, so call `setEnabled` with the stored answer on every
launch.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
