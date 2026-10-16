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
 * Adjust's start, sign-in and consent.
 *
 * `start` turns Adjust off, then starts it, so nothing is sent until `setEnabled(true)`. Let it
 * start Adjust: don't call `Adjust.initSdk` yourself. Call `setEnabled` with the stored answer on
 * every launch.
 *
 * `identify` adds the user id as a global callback parameter, `user_id` by default.
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
