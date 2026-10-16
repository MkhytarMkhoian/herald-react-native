import { Resolution, type Event, type EventParameters } from '@herald-analytics/core';
import {
  AppsFlyerPurchaseEvent,
  PurchaseAppsFlyerEventTracker,
  type AppsFlyerClient,
  type AppsFlyerEventTracker,
  type AppsFlyerEventTrackerFactory,
} from '@herald-analytics/appsflyer';

// --8<-- [start:event]
// The event: what happened, in your app's words. It knows nothing about AppsFlyer.
export class TicketPurchased implements Event {
  readonly name = 'ticket_purchased';

  constructor(
    readonly fare: string,
    readonly price: number,
    readonly currency: string,
  ) {}

  get parameters(): EventParameters {
    return { fare: this.fare };
  }
}
// --8<-- [end:event]

// --8<-- [start:mapping]
// The mapping: the only code that knows how AppsFlyer wants a purchase.
function toAppsFlyerPurchaseEvent(event: TicketPurchased): AppsFlyerPurchaseEvent {
  return new AppsFlyerPurchaseEvent({
    name: event.name,
    revenue: event.price, // sent as af_revenue
    currency: event.currency,
    contentId: event.fare,
    parameters: event.parameters,
  });
}

// The factory: sends the purchase to AppsFlyer, using the mapping above.
export class TicketsAppsFlyerEventTrackerFactory implements AppsFlyerEventTrackerFactory {
  constructor(private readonly appsFlyer: AppsFlyerClient) {}

  create(event: Event): Resolution<AppsFlyerEventTracker> {
    if (event instanceof TicketPurchased) {
      return Resolution.claimed([
        new PurchaseAppsFlyerEventTracker(toAppsFlyerPurchaseEvent(event), this.appsFlyer),
      ]);
    }
    return Resolution.declined(); // not mine
  }
}
// --8<-- [end:mapping]
