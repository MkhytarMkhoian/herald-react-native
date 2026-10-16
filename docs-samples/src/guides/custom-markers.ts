import { logEvent, type Analytics } from '@react-native-firebase/analytics';
import { Resolution, parametersOf, type Event } from '@herald-analytics/core';
import {
  toFirebaseParameters,
  type FirebaseEventTracker,
  type FirebaseEventTrackerFactory,
} from '@herald-analytics/firebase';

// --8<-- [start:marker]
/** Money returned to a customer. Your app's idea, so your app's marker. */
export interface RefundEvent extends Event {
  readonly isRefund: true;
  readonly amount: number;
  readonly currency: string;
  readonly transactionId: string;
}

// TypeScript interfaces are gone at run time, so the marker is a field, checked here.
export function isRefundEvent(event: Event): event is RefundEvent {
  return 'isRefund' in event && event.isRefund === true;
}

export class TicketRefunded implements RefundEvent {
  readonly name = 'ticket_refunded';
  readonly isRefund = true;

  constructor(
    readonly amount: number,
    readonly currency: string,
    readonly transactionId: string,
  ) {}
}
// --8<-- [end:marker]

// --8<-- [start:marker-tracker]
export class RefundFirebaseEventTracker implements FirebaseEventTracker {
  constructor(
    private readonly event: RefundEvent,
    private readonly firebaseAnalytics: Analytics,
  ) {}

  async track(): Promise<void> {
    // GA4's reserved refund event.
    logEvent(this.firebaseAnalytics, 'refund', {
      ...toFirebaseParameters(parametersOf(this.event)),
      transaction_id: this.event.transactionId,
      value: this.event.amount,
      currency: this.event.currency,
    });
  }
}

export class RefundFirebaseEventTrackerFactory implements FirebaseEventTrackerFactory {
  constructor(private readonly firebaseAnalytics: Analytics) {}

  create(event: Event): Resolution<FirebaseEventTracker> {
    if (isRefundEvent(event)) {
      return Resolution.claimed([new RefundFirebaseEventTracker(event, this.firebaseAnalytics)]);
    }
    return Resolution.declined();
  }
}
// --8<-- [end:marker-tracker]

// --8<-- [start:structured]
/** Names an event by where it happened, so two features can't pick the same name. */
export abstract class StructuredEvent implements Event {
  abstract readonly screen: string;
  abstract readonly component: string;
  abstract readonly action: string;

  get name(): string {
    return [this.screen, this.component, this.action].filter((part) => part !== '').join('_');
  }
}

export class CheckoutPayButtonTapped extends StructuredEvent {
  readonly screen = 'checkout';
  readonly component = 'pay_button';
  readonly action = 'tap';
}
// --8<-- [end:structured]

// --8<-- [start:structured-tracker]
export class StructuredFirebaseEventTracker implements FirebaseEventTracker {
  constructor(
    private readonly event: StructuredEvent,
    private readonly firebaseAnalytics: Analytics,
  ) {}

  async track(): Promise<void> {
    logEvent(this.firebaseAnalytics, this.event.component, {
      ...toFirebaseParameters(parametersOf(this.event)),
      screen: this.event.screen, // your call: spread the structure across
      action: this.event.action, // parameters, or let the name carry it alone
    });
  }
}
// --8<-- [end:structured-tracker]
