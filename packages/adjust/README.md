# Herald for Adjust

Sends Herald events to Adjust, over [`react-native-adjust`](https://www.npmjs.com/package/react-native-adjust)
5: events by dashboard token, purchases and ad revenue.

```bash
npx expo install react-native-adjust
npm install @herald-analytics/core @herald-analytics/adjust
```

Install the vendor's package yourself, as on the first line, so React Native links its native
code. Then follow its own setup guide.

```ts
import { AdjustConfig } from 'react-native-adjust';

const tracker = new AdjustAnalyticsTrackerService({
  eventTrackerFactory: new CompositeAdjustEventTrackerFactory([
    new TokenAdjustEventTrackerFactory([
      [SignUpCompleted, 'abc123'], // your event class and its dashboard token
      [CheckoutCompleted, 'def456'],
    ]),
  ]), // nothing at the end: only tokened events are sent
  propertySetterFactory: new CompositeAdjustPropertySetterFactory([
    new GenericAdjustPropertySetterFactory(),
  ]),
});
const service = new AdjustAnalyticsService(
  new AdjustConfig('YOUR_APP_TOKEN', AdjustConfig.EnvironmentProduction),
);
```

Events are matched by class, not by name, so the compiler checks the list, and renaming an event
can't quietly stop it reaching Adjust.

**Adjust starts silent.** `start()` turns Adjust off and only then starts it, so nothing is sent
until `setEnabled(true)`. Let the service start Adjust; don't call `Adjust.initSdk` yourself.

Adjust's calls return nothing, so Herald can't report a failure that happens in the native SDK.

Purchases go through `AdjustRevenueEvent` and `RevenueAdjustEventTracker`, ad revenue through
`AdjustAdRevenueEvent` and `AdRevenueAdjustEventTracker`. Your factory builds them from your own
events.

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
