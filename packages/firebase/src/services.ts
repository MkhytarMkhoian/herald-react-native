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
 * Firebase's start, sign-in and consent.
 *
 * Firebase collects before consent unless `firebase.json` turns it off:
 * `"react-native": { "analytics_auto_collection_enabled": false }`. `setEnabled` then turns it on,
 * and Firebase remembers the choice.
 */
export class FirebaseAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  constructor(private readonly analytics: Analytics) {}

  /** Firebase starts itself, so there is nothing to do. */
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
