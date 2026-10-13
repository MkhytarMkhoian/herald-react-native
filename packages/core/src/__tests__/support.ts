import type {
  AnalyticsInput,
  AnalyticsLifecycleService,
  ConsentService,
  Event,
  EventParameters,
  EventTrackerService,
  IdentifiableUserService,
  Identity,
  Property,
  PropertyTrackerService,
} from '../index';

export class TestEvent implements Event {
  constructor(
    readonly name: string,
    readonly parameters: EventParameters = {},
  ) {}
}

export class TestProperty implements Property {
  constructor(
    readonly name: string,
    readonly value: AnalyticsInput,
  ) {}
}

export class RecordingService
  implements
    AnalyticsLifecycleService,
    EventTrackerService,
    PropertyTrackerService,
    IdentifiableUserService,
    ConsentService
{
  readonly received: string[] = [];
  failure: unknown = undefined;

  constructor(private readonly calls?: string[]) {}

  private async record(call: string): Promise<void> {
    this.received.push(call);
    this.calls?.push(call);
    if (this.failure !== undefined) throw this.failure;
  }

  track(event: Event) {
    return this.record(`track ${event.name}`);
  }

  set(property: Property) {
    return this.record(`set ${property.name}`);
  }

  identify(identity: Identity) {
    return this.record(`identify ${identity.userId}`);
  }

  reset() {
    return this.record('reset');
  }

  start() {
    return this.record('start');
  }

  flush() {
    return this.record('flush');
  }

  setEnabled(enabled: boolean) {
    return this.record(`enabled ${enabled}`);
  }
}

export class TestEventTracker implements EventTrackerService {
  constructor(private readonly onTrack: (event: Event) => Promise<void>) {}

  track(event: Event) {
    return this.onTrack(event);
  }
}

/** Lets pending promises settle. */
export function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
