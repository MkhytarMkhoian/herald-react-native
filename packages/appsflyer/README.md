# Herald for AppsFlyer

Sends Herald events to AppsFlyer, over [`react-native-appsflyer`](https://www.npmjs.com/package/react-native-appsflyer)
7: conversions, purchases, subscriptions and ad revenue. AppsFlyer keeps no user attributes, so
this package handles events only.

```ts
import { AppsFlyer } from 'react-native-appsflyer';

await AppsFlyer.init({ devKey: 'YOUR_DEV_KEY', appId: 'YOUR_APPLE_APP_ID' });
AppsFlyer.registerSessionReadyListener(() => {
  AppsFlyer.start();
});

const tracker = new AppsFlyerAnalyticsTrackerService({
  eventTrackerFactory: new CompositeAppsFlyerEventTrackerFactory(conversionFactories),
});
const service = new AppsFlyerAnalyticsService(AppsFlyer);

const provider = new HeraldProvider({
  name: 'appsflyer',
  events: tracker, // no properties
  identity: service,
  lifecycle: service,
  consent: service,
});
```

**AppsFlyer starts on consent.** `start()` stops the SDK, and `setEnabled(true)` resumes and
starts it. AppsFlyer forgets the stopped state and the customer user id between launches, so call
`identify` and then `setEnabled` with the stored answer on every cold start.

Purchases go through `AppsFlyerPurchaseEvent` (`af_purchase`), subscriptions through
`AppsFlyerSubscribeEvent` (`af_subscribe`) and ad revenue through `AppsFlyerAdRevenueEvent`.
A call settles once AppsFlyer has queued the event, and a refused call reaches Herald's error
reporter.

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
