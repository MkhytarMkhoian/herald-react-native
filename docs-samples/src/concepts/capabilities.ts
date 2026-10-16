import type { ConsentService, Event, EventTrackerService } from '@herald-analytics/core';

import { PlanSelected } from './vocabulary';

// --8<-- [start:consumers]
export class PaywallViewModel {
  constructor(private readonly analytics: EventTrackerService) {}

  onPlanSelected(plan: string, seats: number): Promise<void> {
    return this.analytics.track(new PlanSelected(plan, seats, 9.99, false));
  }
}

export class PrivacySettingsViewModel {
  constructor(private readonly consent: ConsentService) {}

  onAnalyticsToggled(allowed: boolean): Promise<void> {
    return this.consent.setEnabled(allowed);
  }
}
// --8<-- [end:consumers]

// --8<-- [start:fake]
// A fake is a small class, because the interface has one method.
export class RecordingEventTracker implements EventTrackerService {
  readonly tracked: Event[] = [];

  async track(event: Event): Promise<void> {
    this.tracked.push(event);
  }
}
// --8<-- [end:fake]

export function paywallWithFake(): PaywallViewModel {
  return new PaywallViewModel(new RecordingEventTracker());
}
