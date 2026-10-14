import {
  Resolution,
  type AnalyticsInput,
  type Event,
  type EventParameters,
  type Property,
  type ScreenViewEvent,
} from '@herald-analytics/core';

import type { AnalyticsLogger, LogEventTracker, LogEventTrackerFactory } from '../index';

export class TestEvent implements Event {
  constructor(
    readonly name: string,
    readonly parameters: EventParameters = {},
  ) {}
}

export class TestScreenView implements ScreenViewEvent {
  readonly isScreenView = true;

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

/** Prints a fixed message, standing in for a custom tracker. */
export class MessageLogEventTracker implements LogEventTracker {
  constructor(
    private readonly logger: AnalyticsLogger,
    private readonly message: string,
  ) {}

  async track(): Promise<void> {
    this.logger(this.message);
  }
}

/** Fails, standing in for a tracker that throws. */
export class ThrowingLogEventTracker implements LogEventTracker {
  async track(): Promise<void> {
    throw new Error('tracker failed');
  }
}

/** Claims the event called `eventName` with `handlers`, and declines the rest. */
export class ClaimingLogEventTrackerFactory implements LogEventTrackerFactory {
  constructor(
    private readonly eventName: string,
    private readonly handlers: LogEventTracker[],
  ) {}

  create(event: Event): Resolution<LogEventTracker> {
    return event.name === this.eventName
      ? Resolution.claimed(this.handlers)
      : Resolution.declined();
  }
}
