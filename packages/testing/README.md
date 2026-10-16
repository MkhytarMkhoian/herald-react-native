# Herald testing

A fake Herald vendor for tests. `FakeAnalyticsProvider` records every call instead of sending it,
and its assertions check what your code tracked. It works with any test runner: a failed assertion
throws an `AnalyticsAssertionError`.

```bash
npm install --save-dev @herald-analytics/testing@next
```

The examples below test this view model:

```ts
class CheckoutViewModel {
  constructor(
    private readonly events: EventTrackerService,
    private readonly properties: PropertyTrackerService,
  ) {}

  start(plan: string, seats: number) {
    return this.events.track(new CheckoutStarted(plan, seats));
  }

  async pay(total: number, purchases: number) {
    await this.properties.set(new PurchaseCount(purchases));
    await this.events.track(new OrderPaid(total));
  }
}
```

## Plug it in

Register the fake with a real `Herald`, so the test also runs your Herald setup:

```ts
const analytics = new FakeAnalyticsProvider();
const herald = new Herald({
  providers: [new HeraldProvider({ name: 'test', events: analytics, properties: analytics })],
});

await new CheckoutViewModel(herald, herald).start('pro', 3);

analytics.assertTracked('checkout_started');
```

Or pass it straight to the class: the fake has all five capabilities.

```ts
await new CheckoutViewModel(analytics, analytics).start('pro', 3);
```

## Events and their parameters

Values are written as in the event, and compared by type too, because a number and its text reach a
vendor differently:

```ts
analytics.assertTracked('checkout_started', (event) =>
  event.param('plan', 'pro').param('seats', int(3)), // the text '3' would fail
);
```

`assertTracked` expects exactly one such event, so a duplicate fails.

```ts
analytics
  .assertTrackedTimes('checkout_started', 2) // repeats are expected
  .assertNotTracked('order_paid')
  .assertNothingElseTracked(); // every tracked event was checked above
```

## Properties: the last value counts

```ts
const checkout = new CheckoutViewModel(analytics, analytics);
await checkout.pay(9.99, 1);
await checkout.pay(4.99, 2);

analytics.assertPropertySet('total_purchases', int(2)); // 1 was overwritten by 2
```

## Order across different calls

`records` lists every call in order, so you can check that a property was set before the event
that should carry it:

```ts
await new CheckoutViewModel(analytics, analytics).pay(9.99, 1);

expect(analytics.records.map((record) => record.kind)).toEqual(['property', 'tracked']);
```

## Sign-in and sign-out

```ts
const session = new SessionViewModel(analytics);
await session.signIn('user-42');
await session.signOut();

analytics.assertIdentified('user-42'); // passes even after the later reset
expect(analytics.records).toEqual([new IdentifiedRecord(new Identity('user-42')), new ResetRecord()]);
```

## Your own checks

```ts
analytics.assertTracked('order_paid', (event) =>
  expect((event.event as OrderPaid).total).toBeCloseTo(9.99),
);
expect(analytics.events[0]).toBeInstanceOf(OrderPaid);
```

`clear()` forgets everything recorded so far, for tests with several steps.

## When something is wrong

Every failure explains itself and lists everything the fake received:

```
Event 'checkout_started' parameter 'seats' was '3', expected int(3).

Recorded:
  1. event    checkout_started { plan = pro, seats = 3 }
```

Like a real vendor, the fake refuses a value that isn't an analytics value, such as a bare number
from plain JavaScript: the call fails, and through `Herald` it reaches the error reporter.

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
