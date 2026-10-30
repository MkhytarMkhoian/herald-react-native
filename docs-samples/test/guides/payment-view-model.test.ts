import { expect, test } from '@jest/globals';

import { PaymentViewModel, type CheckoutAnalytics } from '../../src/guides/modular-apps';

// --8<-- [start:fake]
// The feature's test fakes its own interface: no Herald, no vendors.
class FakeCheckoutAnalytics implements CheckoutAnalytics {
  readonly checkouts: [string, number][] = [];
  readonly failedPayments: string[] = [];

  async checkoutStarted(plan: string, seats: number): Promise<void> {
    this.checkouts.push([plan, seats]);
  }

  async paymentFailed(reason: string): Promise<void> {
    this.failedPayments.push(reason);
  }
}

test('a failed payment reports its reason', async () => {
  const analytics = new FakeCheckoutAnalytics();

  await new PaymentViewModel(analytics).onPaymentFailed('card_declined');

  expect(analytics.failedPayments).toEqual(['card_declined']);
  expect(analytics.checkouts).toEqual([]);
});
// --8<-- [end:fake]
