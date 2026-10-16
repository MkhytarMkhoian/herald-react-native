# Herald for AppsFlyer

Sends Herald events to AppsFlyer, over [`react-native-appsflyer`](https://www.npmjs.com/package/react-native-appsflyer)
7: conversions, purchases, subscriptions and ad revenue. AppsFlyer keeps no user attributes, so
this package handles events only.

```bash
npx expo install react-native-appsflyer
npm install @herald-analytics/core @herald-analytics/appsflyer
```

Install the vendor's package yourself, as on the first line, so React Native links its native
code. Then follow its own setup guide.

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

**AppsFlyer starts on consent.** `start()` stops it, and `setEnabled(true)` starts it. AppsFlyer
forgets both the stop and the user id between launches, so on every launch call `identify`, then
`setEnabled` with the stored answer.

Purchases go through `AppsFlyerPurchaseEvent` (`af_purchase`), subscriptions through
`AppsFlyerSubscribeEvent` (`af_subscribe`), and ad revenue through `AppsFlyerAdRevenueEvent`.

## Type checking

`react-native-appsflyer` 7 ships its TypeScript source, so `tsc` in your app reports an error inside
it, with or without Herald. One of these:

```
node_modules/react-native-appsflyer/index.ts: error TS2304: Cannot find name 'jest'.
node_modules/react-native-appsflyer/index.ts: error TS2708: Cannot use namespace 'jest' as a value.
```

`skipLibCheck` doesn't help with `.ts` files. Add this to a `.d.ts` file in your app:

```ts
// react-native-appsflyer checks for Jest with `typeof jest`.
declare let jest: unknown;
```

Herald itself doesn't import it: it has its own `AppsFlyerClient` type.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
