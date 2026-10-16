import type {
  AnalyticsLifecycleService,
  ConsentService,
  Event,
  EventTrackerService,
  IdentifiableUserService,
  Identity,
  Property,
  PropertyTrackerService,
} from '@herald-analytics/core';

import type { LogEventTrackerFactory, LogPropertySetterFactory } from './factories';
import type { AnalyticsLogger } from './handlers';
import { logRecord } from './log-record';

export interface LogAnalyticsTrackerServiceOptions {
  readonly eventTrackerFactory: LogEventTrackerFactory;
  readonly propertySetterFactory: LogPropertySetterFactory;
}

/** Sends events and properties to the log, as its factory chains decide. */
export class LogAnalyticsTrackerService implements EventTrackerService, PropertyTrackerService {
  private readonly eventTrackerFactory: LogEventTrackerFactory;
  private readonly propertySetterFactory: LogPropertySetterFactory;

  constructor(options: LogAnalyticsTrackerServiceOptions) {
    this.eventTrackerFactory = options.eventTrackerFactory;
    this.propertySetterFactory = options.propertySetterFactory;
  }

  async track(event: Event): Promise<void> {
    for (const handler of this.eventTrackerFactory.create(event).handlers) {
      await handler.track();
    }
  }

  async set(property: Property): Promise<void> {
    for (const handler of this.propertySetterFactory.create(property).handlers) {
      await handler.set();
    }
  }
}

/**
 * Prints the calls that aren't events or properties: start, consent, sign-in and sign-out. It
 * prints the user id as-is, so use it in debug builds only.
 */
export class LogAnalyticsService
  implements IdentifiableUserService, AnalyticsLifecycleService, ConsentService
{
  constructor(private readonly logger: AnalyticsLogger) {}

  async identify(identity: Identity): Promise<void> {
    this.logger(logRecord('user', identity.userId));
  }

  async reset(): Promise<void> {
    this.logger(logRecord('reset', ''));
  }

  async start(): Promise<void> {
    this.logger(logRecord('start', ''));
  }

  async flush(): Promise<void> {
    this.logger(logRecord('flush', ''));
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.logger(logRecord('enabled', `${enabled}`));
  }
}
