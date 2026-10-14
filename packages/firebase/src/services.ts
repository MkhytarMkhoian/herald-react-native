import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';
import {
  setAnalyticsCollectionEnabled,
  setUserId,
  type Analytics,
} from '@react-native-firebase/analytics';

/**
 * Firebase's lifecycle, identity and consent, over the `Analytics` instance the app owns.
 *
 * **Before consent arrives, Firebase collects.** `start` doesn't opt out, because Firebase's
 * off-by-default switch is read when the SDK starts, before any JavaScript runs. Set it in the
 * native projects if a fresh install must collect nothing until the user has answered: in
 * `firebase.json` at the app's root, `"react-native": { "analytics_auto_collection_enabled": false }`.
 *
 * `setEnabled` then turns collection on, and Firebase keeps the choice across launches.
 *
 * To keep the user id away from Firebase, register the provider without `identity`.
 */
export class FirebaseAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  constructor(private readonly analytics: Analytics) {}

  /** Firebase Analytics starts itself with the app, so there is nothing to do. */
  async start(): Promise<void> {}

  /** Firebase has no flush API. */
  async flush(): Promise<void> {}

  setEnabled(enabled: boolean): Promise<void> {
    return setAnalyticsCollectionEnabled(this.analytics, enabled);
  }

  identify(identity: Identity): Promise<void> {
    return setUserId(this.analytics, identity.userId);
  }

  reset(): Promise<void> {
    return setUserId(this.analytics, null);
  }
}
