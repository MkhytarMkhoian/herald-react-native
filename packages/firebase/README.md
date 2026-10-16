# Herald for Firebase

Sends Herald events and properties to Firebase Analytics (GA4), over
[`@react-native-firebase/analytics`](https://www.npmjs.com/package/@react-native-firebase/analytics)
26 and its modular API.

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
npm install @herald-analytics/core@next @herald-analytics/firebase@next
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
| an event | `logEvent`, with numbers as numbers and flags as `'true'`/`'false'` |
| a screen view | `logEvent('screen_view')` with `screen_name` |
| a property | `setUserProperty`, in its string form |
| `identify` / `reset` | `setUserId(id)` / `setUserId(null)` |
| `setEnabled` | `setAnalyticsCollectionEnabled` |

Firebase checks an event's name right away, so a reserved or badly formed name reaches Herald's
error reporter. It doesn't report what happens after that.

**Firebase collects before consent** unless collection starts off. Set it in `firebase.json` at
your app's root, which React Native Firebase applies to both native projects:

```json
{ "react-native": { "analytics_auto_collection_enabled": false } }
```

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
