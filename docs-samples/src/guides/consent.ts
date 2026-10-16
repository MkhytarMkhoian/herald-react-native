import type { AnalyticsLifecycleService, ConsentService } from '@herald-analytics/core';

/** However your app stores the user's answer. */
export interface AnalyticsConsentRepository {
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
}

// --8<-- [start:record]
export class PrivacySettingsController {
  constructor(
    private readonly consentRepository: AnalyticsConsentRepository,
    private readonly consent: ConsentService,
  ) {}

  async onAnalyticsConsentChanged(enabled: boolean): Promise<void> {
    await this.consentRepository.setEnabled(enabled); // save the answer first
    await this.consent.setEnabled(enabled); // then apply it to every vendor
  }
}
// --8<-- [end:record]

export async function startAnalytics(
  analytics: AnalyticsLifecycleService,
  consent: ConsentService,
  consentRepository: AnalyticsConsentRepository,
): Promise<void> {
  // --8<-- [start:restore]
  await analytics.start(); // some vendors start quiet here
  await consent.setEnabled(await consentRepository.isEnabled()); // so re-apply it, every launch
  // --8<-- [end:restore]
}
