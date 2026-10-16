import {
  double,
  int,
  type Event,
  type EventParameters,
  type Property,
  type ScreenViewEvent,
  type UserProperty,
} from '@herald-analytics/core';

// The app's events. Screens track these and never name a vendor.

export class HomeViewed implements ScreenViewEvent {
  readonly name = 'home';
  readonly isScreenView = true;
}

export class ProductViewed implements ScreenViewEvent {
  readonly name = 'product';
  readonly isScreenView = true;

  constructor(readonly productId: string) {}

  get parameters(): EventParameters {
    return { product_id: this.productId };
  }
}

export class SettingsViewed implements ScreenViewEvent {
  readonly name = 'settings';
  readonly isScreenView = true;
}

/** A product row on Home was really seen: an impression. */
export class ProductListed implements Event {
  readonly name = 'product_listed';

  constructor(readonly productId: string) {}

  get parameters(): EventParameters {
    return { product_id: this.productId };
  }
}

export class AddedToCart implements Event {
  readonly name = 'added_to_cart';

  constructor(
    readonly productId: string,
    readonly price: number,
  ) {}

  get parameters(): EventParameters {
    return { product_id: this.productId, price: double(this.price) }; // stays a number to the vendor
  }
}

export class OrderPaid implements Event {
  readonly name = 'order_paid';

  constructor(
    readonly items: number,
    readonly total: number,
  ) {}

  get parameters(): EventParameters {
    return { items: int(this.items), total: double(this.total) };
  }
}

/** About the session. */
export class AppTheme implements Property {
  readonly name = 'app_theme';

  constructor(readonly dark: boolean) {}

  get value() {
    return this.dark ? 'dark' : 'light';
  }
}

/** About the person. */
export class PurchaseCount implements UserProperty {
  readonly name = 'total_purchases';
  readonly isUserProperty = true;

  constructor(readonly count: number) {}

  get value() {
    return int(this.count);
  }
}
