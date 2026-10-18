import { parametersOf, type Event } from '@herald-analytics/core';

import type { MetaPurchaseEvent } from './purchase';
import { toMetaParameters, type MetaAppEvents } from './values';

/** One call to Meta for one event. A factory builds it. */
export interface MetaEventTracker {
  track(): Promise<void>;
}

/** Logs the event under its own name. Use one of Meta's standard names for a conversion. */
export class GenericMetaEventTracker implements MetaEventTracker {
  constructor(
    readonly event: Event,
    private readonly appEvents: MetaAppEvents,
  ) {}

  async track(): Promise<void> {
    this.appEvents.logEvent(this.event.name, toMetaParameters(parametersOf(this.event)));
  }
}

export class PurchaseMetaEventTracker implements MetaEventTracker {
  constructor(
    readonly event: MetaPurchaseEvent,
    private readonly appEvents: MetaAppEvents,
  ) {}

  async track(): Promise<void> {
    this.appEvents.logPurchase(
      this.event.amount,
      this.event.currency,
      toMetaParameters(parametersOf(this.event)),
    );
  }
}
