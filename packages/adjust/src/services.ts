import { Adjust, type AdjustConfig } from 'react-native-adjust';
import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';

export interface AdjustAnalyticsServiceOptions {
  /** The global callback parameter that carries the user id. `user_id` by default. */
  readonly identityParameter?: string;
}

/**
 * Adjust's lifecycle, identity and consent.
 *
 * `start` turns Adjust off and only then starts it with `config`, so nothing is sent, not even the
 * install, until `setEnabled` turns it on. Turning it off after the start would be too late: the
 * first session would already be on its way. So let this service start Adjust; don't call
 * `Adjust.initSdk` yourself.
 *
 * `start` turns Adjust off on every launch, so call `setEnabled` with the stored answer after it.
 *
 * Adjust has no user id, so `identify` adds it as a global callback parameter, `user_id` unless
 * `identityParameter` says otherwise. Set up a parameter with that name in the Adjust dashboard, and
 * don't give a property the same name.
 */
export class AdjustAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  private readonly identityParameter: string;

  constructor(
    private readonly config: AdjustConfig,
    options: AdjustAnalyticsServiceOptions = {},
  ) {
    this.identityParameter = options.identityParameter ?? 'user_id';
  }

  async start(): Promise<void> {
    Adjust.disable();
    Adjust.initSdk(this.config);
  }

  /** Adjust has no flush API. */
  async flush(): Promise<void> {}

  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) Adjust.enable();
    else Adjust.disable();
  }

  async identify(identity: Identity): Promise<void> {
    Adjust.addGlobalCallbackParameter(this.identityParameter, identity.userId);
  }

  async reset(): Promise<void> {
    Adjust.removeGlobalCallbackParameter(this.identityParameter);
  }
}
