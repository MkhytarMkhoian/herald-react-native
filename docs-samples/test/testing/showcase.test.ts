import { beforeEach, expect, test } from '@jest/globals';
import {
  AnalyticsValue,
  Herald,
  HeraldProvider,
  Identity,
  double,
  int,
  type Event,
  type EventParameters,
  type EventTrackerService,
  type IdentifiableUserService,
  type PropertyTrackerService,
  type UserProperty,
} from '@herald-analytics/core';
import {
  FakeAnalyticsProvider,
  IdentifiedRecord,
  PropertySetRecord,
  ResetRecord,
  TrackedRecord,
} from '@herald-analytics/testing';

// --8<-- [start:app]
class CheckoutStarted implements Event {
  readonly name = 'checkout_started';

  constructor(
    readonly plan: string,
    readonly seats: number,
  ) {}

  get parameters(): EventParameters {
    return { plan: this.plan, seats: int(this.seats) };
  }
}

class OrderPaid implements Event {
  readonly name = 'order_paid';

  constructor(readonly total: number) {}

  get parameters(): EventParameters {
    return { total: double(this.total) };
  }
}

class PurchaseCount implements UserProperty {
  readonly name = 'total_purchases';
  readonly isUserProperty = true;

  constructor(readonly count: number) {}

  get value() {
    return int(this.count);
  }
}

class CheckoutViewModel {
  constructor(
    private readonly events: EventTrackerService,
    private readonly properties: PropertyTrackerService,
  ) {}

  start(plan: string, seats: number): Promise<void> {
    return this.events.track(new CheckoutStarted(plan, seats));
  }

  async pay(total: number, purchases: number): Promise<void> {
    await this.properties.set(new PurchaseCount(purchases));
    await this.events.track(new OrderPaid(total));
  }
}

class SessionViewModel {
  constructor(private readonly identity: IdentifiableUserService) {}

  signIn(userId: string): Promise<void> {
    return this.identity.identify(new Identity(userId));
  }

  signOut(): Promise<void> {
    return this.identity.reset();
  }
}
// --8<-- [end:app]

let analytics: FakeAnalyticsProvider;

beforeEach(() => {
  analytics = new FakeAnalyticsProvider();
});

test('through a real Herald', async () => {
  // --8<-- [start:through-herald]
  const analytics = new FakeAnalyticsProvider();
  const herald = new Herald({
    providers: [new HeraldProvider({ name: 'test', events: analytics, properties: analytics })],
  });

  await new CheckoutViewModel(herald, herald).start('pro', 3);

  analytics.assertTracked('checkout_started');
  // --8<-- [end:through-herald]
});

test('passed straight to the class', async () => {
  // --8<-- [start:direct]
  await new CheckoutViewModel(analytics, analytics).start('pro', 3);
  // --8<-- [end:direct]

  analytics.assertTracked('checkout_started');
});

test('parameters, compared by type', async () => {
  await new CheckoutViewModel(analytics, analytics).start('pro', 3);

  // --8<-- [start:parameters]
  analytics.assertTracked(
    'checkout_started',
    (event) => event.param('plan', 'pro').param('seats', int(3)), // the text '3' would fail
  );
  // --8<-- [end:parameters]
});

test('counting, absence and nothing else', async () => {
  const checkout = new CheckoutViewModel(analytics, analytics);
  await checkout.start('pro', 3);
  await checkout.start('pro', 3);

  // --8<-- [start:counting]
  analytics
    .assertTrackedTimes('checkout_started', 2) // repeats are expected
    .assertNotTracked('order_paid')
    .assertNothingElseTracked(); // every tracked event was checked above
  // --8<-- [end:counting]
});

test('properties: the last value counts', async () => {
  // --8<-- [start:properties]
  const checkout = new CheckoutViewModel(analytics, analytics);
  await checkout.pay(9.99, 1);
  await checkout.pay(4.99, 2);

  analytics.assertPropertySet('total_purchases', int(2)); // 1 was overwritten by 2
  // --8<-- [end:properties]
});

test('order across different calls', async () => {
  // --8<-- [start:order]
  await new CheckoutViewModel(analytics, analytics).pay(9.99, 1);

  expect(analytics.records).toEqual([expect.any(PropertySetRecord), expect.any(TrackedRecord)]);
  // --8<-- [end:order]
});

test('sign-in and sign-out', async () => {
  // --8<-- [start:identity]
  const session = new SessionViewModel(analytics);
  await session.signIn('user-42');
  await session.signOut();

  analytics.assertIdentified('user-42'); // passes even after the later reset
  expect(analytics.records).toEqual([
    new IdentifiedRecord(new Identity('user-42')),
    new ResetRecord(),
  ]);
  // --8<-- [end:identity]
});

test('your own checks', async () => {
  await new CheckoutViewModel(analytics, analytics).pay(9.99, 1);

  // --8<-- [start:custom-checks]
  analytics.assertTracked('order_paid', (event) => {
    expect((event.event as OrderPaid).total).toBeCloseTo(9.99);
  });
  expect(analytics.events).toEqual([expect.any(OrderPaid)]);
  expect(AnalyticsValue.from(analytics.properties[0]!.value)).toEqual(int(1));
  // --8<-- [end:custom-checks]
});

test('starting over mid-test', async () => {
  // --8<-- [start:clear]
  const checkout = new CheckoutViewModel(analytics, analytics);
  await checkout.start('pro', 3);
  analytics.clear(); // forget what came before

  await checkout.pay(9.99, 1);

  analytics.assertTracked('order_paid').assertNothingElseTracked();
  // --8<-- [end:clear]
});

test('a failure shows everything recorded', async () => {
  await new CheckoutViewModel(analytics, analytics).start('pro', 3);

  expect(
    // --8<-- [start:failure]
    () => analytics.assertTracked('checkout_started', (event) => event.param('seats', '3')),
    // --8<-- [end:failure]
  ).toThrow(
    "Event 'checkout_started' parameter 'seats' was int(3), expected '3'.\n" +
      '\n' +
      'Recorded:\n' +
      '  1. event    checkout_started { plan = pro, seats = 3 }',
  );
});
