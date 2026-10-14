import {
  AnalyticsValue,
  parametersOf,
  propertyValueOf,
  type Event,
  type Property,
  type ScreenViewEvent,
} from '@herald-analytics/core';

import { logRecord } from './log-record';

/**
 * Where the log adapter prints.
 *
 * Every record is one call with one string, already formatted. Point it at whatever logging you
 * use, such as `(message) => console.log(message)`, and pass it to the adapter's factories.
 */
export type AnalyticsLogger = (message: string) => void;

/** One call to the log for one event. A factory builds it. */
export interface LogEventTracker {
  track(): Promise<void>;
}

/** One call to the log for one property. A factory builds it. */
export interface LogPropertySetter {
  set(): Promise<void>;
}

export class GenericLogEventTracker implements LogEventTracker {
  constructor(
    readonly event: Event,
    private readonly logger: AnalyticsLogger,
  ) {}

  async track(): Promise<void> {
    this.logger(logRecord('event', this.event.name, parametersOf(this.event)));
  }
}

export class ScreenViewLogEventTracker implements LogEventTracker {
  constructor(
    readonly event: ScreenViewEvent,
    private readonly logger: AnalyticsLogger,
  ) {}

  async track(): Promise<void> {
    this.logger(logRecord('screen', this.event.name, parametersOf(this.event)));
  }
}

export class GenericLogPropertySetter implements LogPropertySetter {
  constructor(
    readonly property: Property,
    private readonly logger: AnalyticsLogger,
  ) {}

  async set(): Promise<void> {
    const value = AnalyticsValue.asString(propertyValueOf(this.property));
    this.logger(logRecord('prop', `${this.property.name} = ${value}`));
  }
}
