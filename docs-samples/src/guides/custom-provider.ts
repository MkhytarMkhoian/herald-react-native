import {
  AnalyticsValue,
  Herald,
  HeraldProvider,
  parametersOf,
  type Event,
  type EventTrackerService,
} from '@herald-analytics/core';

export interface EventsApi {
  send(name: string, parameters: Record<string, string>): Promise<void>;
}

// --8<-- [start:backend]
export class BackendAnalytics implements EventTrackerService {
  constructor(private readonly api: EventsApi) {}

  track(event: Event): Promise<void> {
    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(parametersOf(event))) {
      parameters[key] = AnalyticsValue.asString(value);
    }
    return this.api.send(event.name, parameters);
  }
}
// --8<-- [end:backend]

/** An event with personal data, which must stay on the device. */
export interface PiiEvent extends Event {
  readonly isPii: true;
}

function isPiiEvent(event: Event): event is PiiEvent {
  return 'isPii' in event && event.isPii === true;
}

// --8<-- [start:decorators]
/** Sends only some events, for a vendor that charges per event. */
export class SampledEventTracker implements EventTrackerService {
  constructor(
    private readonly inner: EventTrackerService,
    private readonly rate: number,
    private readonly random: () => number = Math.random,
  ) {}

  async track(event: Event): Promise<void> {
    if (this.random() < this.rate) await this.inner.track(event);
  }
}

export class ExceptEventTracker implements EventTrackerService {
  constructor(
    private readonly inner: EventTrackerService,
    private readonly excluded: (event: Event) => boolean,
  ) {}

  async track(event: Event): Promise<void> {
    if (!this.excluded(event)) await this.inner.track(event);
  }
}
// --8<-- [end:decorators]

export function register(api: EventsApi, adjustTracker: EventTrackerService): Herald {
  // --8<-- [start:register]
  const herald = new Herald({
    providers: [
      new HeraldProvider({
        name: 'backend',
        events: new ExceptEventTracker(new BackendAnalytics(api), isPiiEvent),
      }),
      new HeraldProvider({ name: 'adjust', events: new SampledEventTracker(adjustTracker, 0.1) }),
    ],
  });
  // --8<-- [end:register]
  return herald;
}
