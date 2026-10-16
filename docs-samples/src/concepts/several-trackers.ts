import type { Mixpanel } from 'mixpanel-react-native';
import { Resolution, double, type Event, type EventParameters } from '@herald-analytics/core';
import {
  GenericMixpanelEventTracker,
  type MixpanelEventTracker,
  type MixpanelEventTrackerFactory,
} from '@herald-analytics/mixpanel';

// --8<-- [start:event]
export class OrderPaid implements Event {
  readonly name = 'order_paid';

  constructor(
    readonly orderId: string,
    readonly total: number,
  ) {}

  get parameters(): EventParameters {
    return { order_id: this.orderId, total: double(this.total) };
  }
}
// --8<-- [end:event]

// --8<-- [start:tracker]
// Adds the amount to the buyer's profile, which Mixpanel's revenue reports read.
export class ChargeMixpanelEventTracker implements MixpanelEventTracker {
  constructor(
    private readonly event: OrderPaid,
    private readonly mixpanel: Mixpanel,
  ) {}

  async track(): Promise<void> {
    this.mixpanel.getPeople().trackCharge(this.event.total, {});
  }
}
// --8<-- [end:tracker]

// --8<-- [start:factory]
export class CheckoutMixpanelEventTrackerFactory implements MixpanelEventTrackerFactory {
  constructor(private readonly mixpanel: Mixpanel) {}

  create(event: Event): Resolution<MixpanelEventTracker> {
    if (event instanceof OrderPaid) {
      return Resolution.claimed([
        new GenericMixpanelEventTracker(event, this.mixpanel), // 1. the order_paid event, as usual
        new ChargeMixpanelEventTracker(event, this.mixpanel), // 2. a charge on the buyer's profile
      ]);
    }
    return Resolution.declined();
  }
}
// --8<-- [end:factory]
