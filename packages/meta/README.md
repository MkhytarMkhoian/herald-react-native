# Herald for Meta

Sends Herald events to Meta's App Events, over
[`react-native-fbsdk-next`](https://www.npmjs.com/package/react-native-fbsdk-next) 13: conversions
and purchases, for Meta's ads. Meta keeps no user attributes, so this package handles events only.

```bash
npx expo install react-native-fbsdk-next
npm install @herald-analytics/core @herald-analytics/meta
```

Install the vendor's package yourself, as on the first line, so React Native links its native
code. Set Meta's app id and client token as its README shows, and turn its automatic collection
off there too, so Meta logs nothing by itself before consent.

```ts
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

const service = new MetaAnalyticsService({ appEvents: AppEventsLogger, settings: Settings });

const tracker = new MetaAnalyticsTrackerService({
  eventTrackerFactory: new CompositeMetaEventTrackerFactory(conversionFactories),
});

const provider = new HeraldProvider({
  name: 'meta',
  events: tracker, // no properties
  identity: service,
  lifecycle: service,
  consent: service,
});
```

**Consent.** `setEnabled` turns Meta's own collection on or off: the events it logs by itself, such
as installs, and the advertiser id. It doesn't stop the events your app logs. Call it with the
stored answer on every launch.

Purchases go through `MetaPurchaseEvent` (`fb_mobile_purchase`), and other conversions under Meta's
standard names, such as `AppEventsLogger.AppEvents.CompletedRegistration`.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
