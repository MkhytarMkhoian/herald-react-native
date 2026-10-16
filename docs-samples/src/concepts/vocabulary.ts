import {
  double,
  int,
  type Event,
  type EventParameters,
  type Property,
  type ScreenViewEvent,
  type UserProperty,
} from '@herald-analytics/core';

// --8<-- [start:no-parameters]
export class SignInTapped implements Event {
  readonly name = 'sign_in_tapped';
}
// --8<-- [end:no-parameters]

// --8<-- [start:parameters]
export class PlanSelected implements Event {
  readonly name = 'plan_selected';

  constructor(
    readonly plan: string,
    readonly seats: number,
    readonly price: number,
    readonly trial: boolean,
  ) {}

  get parameters(): EventParameters {
    return {
      plan: this.plan, // text
      seats: int(this.seats), // a whole number
      price: double(this.price), // a decimal number
      trial: this.trial, // true or false
    };
  }
}
// --8<-- [end:parameters]

// --8<-- [start:screen-view]
export class ProductScreenViewed implements ScreenViewEvent {
  readonly name = 'product'; // the screen's name in GA4, Mixpanel and Amplitude
  readonly isScreenView = true;

  constructor(readonly productId: string) {}

  get parameters(): EventParameters {
    return { product_id: this.productId };
  }
}
// --8<-- [end:screen-view]

// --8<-- [start:properties]
// Describes the session: a super property in Mixpanel, sent with every later event.
export class AppTheme implements Property {
  readonly name = 'app_theme';

  constructor(readonly dark: boolean) {}

  get value() {
    return this.dark ? 'dark' : 'light';
  }
}

// Describes the person: Mixpanel's people profile, Amplitude's user properties.
export class PurchaseCount implements UserProperty {
  readonly name = 'total_purchases';
  readonly isUserProperty = true;

  constructor(readonly count: number) {}

  get value() {
    return int(this.count);
  }
}
// --8<-- [end:properties]
