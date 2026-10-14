import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';

import type { AmplitudeClient } from './values';

/**
 * Amplitude's lifecycle, identity and consent, over the Amplitude client the app has set up.
 *
 * Amplitude collects from the moment it's initialised. Initialise it with `optOut: true` so nothing
 * is sent before the user answers, then call `setEnabled` with the stored answer after `start` on
 * every launch.
 *
 * To keep the user id away from Amplitude, register the provider without `identity`.
 */
export class AmplitudeAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  constructor(private readonly amplitude: AmplitudeClient) {}

  /**
   * The app starts Amplitude with `init`, so there is nothing to do. Amplitude keeps calls made
   * before `init` finishes and sends them after.
   */
  async start(): Promise<void> {}

  /** Asks Amplitude to send what it has. Herald doesn't wait for the upload. */
  async flush(): Promise<void> {
    void this.amplitude.flush();
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.amplitude.setOptOut(!enabled);
  }

  async identify(identity: Identity): Promise<void> {
    this.amplitude.setUserId(identity.userId);
  }

  /**
   * Clears the user id and also changes the device id, so the next user isn't linked to the last
   * one.
   */
  async reset(): Promise<void> {
    this.amplitude.reset();
  }
}
