import type { AnalyticsInput, Event, EventParameters, Property } from '@herald-analytics/core';

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
