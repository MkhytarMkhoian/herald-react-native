import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';
import type { Mixpanel } from 'mixpanel-react-native';

/**
 * Mixpanel's start, sign-in and consent.
 *
 * Create Mixpanel opted out, so it sends nothing before consent. `start` can't opt out for you:
 * that deletes unsent events and the stored user every launch.
 */
export class MixpanelAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  constructor(private readonly mixpanel: Mixpanel) {}

  /** Mixpanel is ready once `init` has finished, so there is nothing to do. */
  async start(): Promise<void> {}

  /** Asks Mixpanel to send what it has. It doesn't say when it's done. */
  async flush(): Promise<void> {
    this.mixpanel.flush();
  }

  /** Flushes before opting out, because opting out deletes what Mixpanel hasn't sent. */
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
