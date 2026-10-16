# Herald for Mixpanel

Sends Herald events and properties to Mixpanel, over
[`mixpanel-react-native`](https://www.npmjs.com/package/mixpanel-react-native) 4: events, the
People profile and super properties.

```bash
npx expo install mixpanel-react-native
npm install @herald-analytics/core @herald-analytics/mixpanel
```

Install the vendor's package yourself, as on the first line, so React Native links its native
code. Then follow its own setup guide.

```ts
import { Mixpanel } from 'mixpanel-react-native';

const mixpanel = new Mixpanel(projectToken, false); // no automatic events
await mixpanel.init(true); // opted out by default: silent until consent

const tracker = new MixpanelAnalyticsTrackerService({
  eventTrackerFactory: new CompositeMixpanelEventTrackerFactory([
    new ScreenViewMixpanelEventTrackerFactory(mixpanel),
    new GenericMixpanelEventTrackerFactory(mixpanel),
  ]),
  propertySetterFactory: new CompositeMixpanelPropertySetterFactory([
    new UserPropertyMixpanelPropertySetterFactory(mixpanel), // People profile: must come first
    new GenericMixpanelPropertySetterFactory(mixpanel), // super properties
  ]),
});
const service = new MixpanelAnalyticsService(mixpanel);
```

Values keep their types. A user property goes to the People profile and any other property
becomes a super property. Revoking consent asks Mixpanel to flush, then opts out; Mixpanel sends in
the background, so an event tracked just before may still be lost.

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
