import {
  AnalyticsValue,
  Herald,
  HeraldProvider,
  parametersOf,
  type Event,
  type EventTrackerService,
} from '@herald-analytics/core';

/** The wrapper most apps already have, called from everywhere. */
export interface LegacyAnalytics {
  logEvent(name: string, params: Record<string, string>): Promise<void>;
}

// --8<-- [start:bridge]
// Step 1: Herald forwards to the old wrapper, so migrated and unmigrated code report the same.
export class LegacyEventTracker implements EventTrackerService {
  constructor(private readonly legacy: LegacyAnalytics) {}

  track(event: Event): Promise<void> {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(parametersOf(event))) {
      params[key] = AnalyticsValue.asString(value);
    }
    return this.legacy.logEvent(event.name, params);
  }
}

export function migratingHerald(legacy: LegacyAnalytics): Herald {
  return new Herald({
    providers: [new HeraldProvider({ name: 'legacy', events: new LegacyEventTracker(legacy) })],
  });
}
// --8<-- [end:bridge]
