import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';

import type { AmplitudeClient } from './values';

/**
 * Amplitude's start, sign-in and consent.
 *
 * Initialise Amplitude with `optOut: true`, so it sends nothing before consent. It doesn't remember
 * the choice, so call `setEnabled` with the stored answer on every launch.
 */
export class AmplitudeAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  constructor(private readonly amplitude: AmplitudeClient) {}

  /** The app starts Amplitude with `init`, so there is nothing to do. */
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

  /** Clears the user id and changes the device id, so the next user isn't linked to this one. */
  async reset(): Promise<void> {
    this.amplitude.reset();
  }
}
