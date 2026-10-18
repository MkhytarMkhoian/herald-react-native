import type {
  AnalyticsInput,
  Event,
  EventParameters,
  Property,
  ScreenViewEvent,
} from '@herald-analytics/core';

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
