import type {
  AnalyticsLifecycleService,
  ConsentService,
  IdentifiableUserService,
  Identity,
} from '@herald-analytics/core';

import type { MetaAppEvents, MetaSettings } from './values';

export interface MetaAnalyticsServiceOptions {
  /** `AppEventsLogger` from `react-native-fbsdk-next`. */
  readonly appEvents: MetaAppEvents;
  /** `Settings` from `react-native-fbsdk-next`. */
  readonly settings: MetaSettings;
}

/**
 * Meta's start, sign-in and consent.
 *
 * `setEnabled` turns Meta's own collection on or off: the events it logs by itself, such as
 * installs, and the advertiser id. It doesn't stop the events your app logs. Turn Meta's automatic
 * collection off in both native projects, as `react-native-fbsdk-next`'s README shows, so a fresh
 * install collects nothing by itself. Then call `setEnabled` with the stored answer on every launch.
 */
export class MetaAnalyticsService
  implements AnalyticsLifecycleService, IdentifiableUserService, ConsentService
{
  private readonly appEvents: MetaAppEvents;
  private readonly settings: MetaSettings;

  constructor(options: MetaAnalyticsServiceOptions) {
    this.appEvents = options.appEvents;
    this.settings = options.settings;
  }

  /** Meta's SDK starts itself. */
  async start(): Promise<void> {}

  async flush(): Promise<void> {
    this.appEvents.flush();
  }

  async setEnabled(enabled: boolean): Promise<void> {
    // Finishes starting the SDK on Android, where AutoInitEnabled is false. Repeating it is harmless.
    if (enabled) this.settings.initializeSDK();
    this.settings.setAutoLogAppEventsEnabled(enabled);
    this.settings.setAdvertiserIDCollectionEnabled(enabled);
  }

  async identify(identity: Identity): Promise<void> {
    this.appEvents.setUserID(identity.userId);
  }

  async reset(): Promise<void> {
    this.appEvents.setUserID(null);
  }
}
