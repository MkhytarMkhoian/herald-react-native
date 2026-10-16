import {
  AnalyticsValue,
  isScreenView,
  parametersOf,
  propertyValueOf,
  type AnalyticsLifecycleService,
  type ConsentService,
  type Event,
  type EventTrackerService,
  type IdentifiableUserService,
  type Identity,
  type Property,
  type PropertyTrackerService,
} from '@herald-analytics/core';

/**
 * A provider of your own: it keeps every call as a line, for the timeline on Home.
 *
 * Implementing Herald's interfaces is all a provider takes. This one implements all five, so it
 * sees the whole story (consent, sign-in, events and properties) in the order Herald sent it.
 */
export class TimelineAnalytics
  implements
    EventTrackerService,
    PropertyTrackerService,
    IdentifiableUserService,
    AnalyticsLifecycleService,
    ConsentService
{
  private lines: readonly string[] = [];
  private readonly listeners = new Set<() => void>();

  /** Every line, newest first. A new list after each call, so React sees the change. */
  getLines = (): readonly string[] => this.lines;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private add(line: string): void {
    this.lines = [line, ...this.lines];
    for (const listener of this.listeners) listener();
  }

  async track(event: Event): Promise<void> {
    const parameters = Object.entries(parametersOf(event)).map(
      ([key, value]) => `${key}=${AnalyticsValue.asString(value)}`,
    );
    const title = `${isScreenView(event) ? 'screen' : 'event'} ${event.name}`;
    this.add(parameters.length === 0 ? title : `${title}  ${parameters.join(', ')}`);
  }

  async set(property: Property): Promise<void> {
    this.add(`property ${property.name}=${AnalyticsValue.asString(propertyValueOf(property))}`);
  }

  async identify(identity: Identity): Promise<void> {
    this.add(`identify ${identity.userId}`);
  }

  async reset(): Promise<void> {
    this.add('reset');
  }

  async start(): Promise<void> {
    this.add('start');
  }

  async flush(): Promise<void> {
    this.add('flush');
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.add(`consent ${enabled}`);
  }
}
