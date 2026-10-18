import { double, type Event, type EventParameters } from '@herald-analytics/core';

export interface MetaPurchaseEventOptions {
  /** Not sent. Only used in failure reports. */
  readonly name: string;
  /** The amount paid. */
  readonly amount: number;
  /** An ISO 4217 code, such as `EUR`. */
  readonly currency: string;
  /** Sent with the purchase. */
  readonly parameters?: EventParameters;
}

/**
 * A purchase, as Meta's standard `fb_mobile_purchase`, which Meta counts as revenue for ads. Your
 * factory builds one from your event and sends it with `PurchaseMetaEventTracker`. Throws for a bad
 * number.
 */
export class MetaPurchaseEvent implements Event {
  readonly name: string;
  readonly amount: number;
  readonly currency: string;
  readonly parameters: EventParameters;

  constructor(options: MetaPurchaseEventOptions) {
    double(options.amount); // throws for NaN or Infinity
    this.name = options.name;
    this.amount = options.amount;
    this.currency = options.currency;
    this.parameters = options.parameters ?? {};
  }

  toString(): string {
    return `MetaPurchaseEvent(${this.name}, ${this.amount} ${this.currency})`;
  }
}
