import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';
import type { Mixpanel } from 'mixpanel-react-native';

/**
 * Mixpanel's lifecycle, identity and consent, over a `Mixpanel` the app has created.
 *
 * `start` doesn't opt out: `optOutTracking` deletes unsent events and the stored user, so doing it
 * every launch would wipe a user who agreed. Initialise Mixpanel with `init(true)`, which opts out
 * by default, instead; `setEnabled` opts in when the user agrees, and Mixpanel remembers it.
 *
 * To keep the user id away from Mixpanel, register the provider without `identity`.
 */
export class MixpanelAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  constructor(private readonly mixpanel: Mixpanel) {}

  /** Mixpanel is ready once `init` has finished, so there is nothing to do. */
  async start(): Promise<void> {}

  /** Asks Mixpanel to send what it has. Mixpanel sends in the background and doesn't say when. */
  async flush(): Promise<void> {
    this.mixpanel.flush();
  }

  /**
   * Opting out asks Mixpanel to flush first, as the other SDKs do. Mixpanel deletes what it hasn't
   * sent when it opts out, so an event tracked just before may still be lost.
   */
  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      this.mixpanel.optInTracking();
    } else {
      this.mixpanel.flush();
      this.mixpanel.optOutTracking();
    }
  }

  identify(identity: Identity): Promise<void> {
    return this.mixpanel.identify(identity.userId);
  }

  async reset(): Promise<void> {
    this.mixpanel.reset();
  }
}
