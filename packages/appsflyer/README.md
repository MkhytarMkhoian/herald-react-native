# Herald for AppsFlyer

Sends Herald events to AppsFlyer, over [`react-native-appsflyer`](https://www.npmjs.com/package/react-native-appsflyer)
7: conversions, purchases, subscriptions and ad revenue. AppsFlyer keeps no user attributes, so
this package handles events only.

```bash
npx expo install react-native-appsflyer
npm install @herald-analytics/core@next @herald-analytics/appsflyer@next
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

**AppsFlyer starts on consent.** `start()` stops the SDK, and `setEnabled(true)` resumes and
starts it. AppsFlyer forgets the stopped state and the customer user id between launches, so call
`identify` and then `setEnabled` with the stored answer on every cold start.

Purchases go through `AppsFlyerPurchaseEvent` (`af_purchase`), subscriptions through
`AppsFlyerSubscribeEvent` (`af_subscribe`) and ad revenue through `AppsFlyerAdRevenueEvent`.
A call settles once AppsFlyer has queued the event, and a refused call reaches Herald's error
reporter.

## Type checking

`react-native-appsflyer` 7 ships its TypeScript source, so a strict `tsc` in your app reports an
error inside it as soon as one of your files imports it, with or without Herald. Without Jest's
types, then with them:

```
node_modules/react-native-appsflyer/index.ts: error TS2304: Cannot find name 'jest'.
node_modules/react-native-appsflyer/index.ts: error TS2708: Cannot use namespace 'jest' as a value.
```

`skipLibCheck` doesn't cover `.ts` files. Declare the name it checks for, in a `.d.ts` file of your
app:

```ts
// react-native-appsflyer checks for Jest with `typeof jest`.
declare var jest: unknown;
```

Herald itself never imports it: it describes the AppsFlyer calls it makes with its own
`AppsFlyerClient` type.

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
