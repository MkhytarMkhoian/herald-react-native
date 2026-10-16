# Herald for Firebase

Sends Herald events and properties to Firebase Analytics (GA4), over
[`@react-native-firebase/analytics`](https://www.npmjs.com/package/@react-native-firebase/analytics)
26 and its modular API.

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
npm install @herald-analytics/core @herald-analytics/firebase
```

Install the vendor's package yourself, as on the first line, so React Native links its native
code. Then follow its own setup guide.

```ts
import { getAnalytics } from '@react-native-firebase/analytics';

const analytics = getAnalytics();
const tracker = new FirebaseAnalyticsTrackerService({
  eventTrackerFactory: new CompositeFirebaseEventTrackerFactory([
    new ScreenViewFirebaseEventTrackerFactory(analytics), // GA4's reserved screen_view
    new GenericFirebaseEventTrackerFactory(analytics), // everything else, as-is
  ]),
  propertySetterFactory: new CompositeFirebasePropertySetterFactory([
    new GenericFirebasePropertySetterFactory(analytics),
  ]),
});
const service = new FirebaseAnalyticsService(analytics);

const provider = new HeraldProvider({
  name: 'firebase',
  events: tracker,
  properties: tracker,
  identity: service,
  lifecycle: service,
  consent: service,
});
```

| Herald | Firebase |
| --- | --- |
| an event | `logEvent`: numbers stay numbers, true/false becomes text |
| a screen view | `logEvent('screen_view')` with `screen_name` |
| a property | `setUserProperty`, as text |
| `identify` / `reset` | `setUserId(id)` / `setUserId(null)` |
| `setEnabled` | `setAnalyticsCollectionEnabled` |

A reserved or badly formed event name goes to Herald's error reporter.

**Firebase collects before consent** unless you turn it off in `firebase.json`, next to your
`package.json`:

```json
{ "react-native": { "analytics_auto_collection_enabled": false } }
```

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
