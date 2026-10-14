# Herald core

Events, properties and the `Herald` fan-out: the core of Herald for React Native, in plain
TypeScript, with no vendor SDK. Vendors are separate packages.

```ts
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

const herald = new Herald({
  providers: [
    new HeraldProvider({ name: 'analytics', events: analyticsTracker, properties: analyticsTracker }),
    new HeraldProvider({ name: 'attribution', events: attributionTracker }),
  ],
  errorReporter: (failure) => crashReporter.record(failure.error, `${failure}`),
});

herald.track(new CheckoutStarted('pro', 3));
```

A number says whether it is whole, with `int(…)` or `double(…)`, because JavaScript can't tell `3`
from `3.0`. A bare number doesn't compile.

`Herald` implements all five capabilities — `EventTrackerService`, `PropertyTrackerService`,
`IdentifiableUserService`, `AnalyticsLifecycleService` and `ConsentService` — so give your classes
the one interface they use.

Each call runs against every vendor at once, and a failing vendor is reported without stopping the
others. A call never fails, so it's safe not to await it. Calls don't wait for each other, so when
order matters, await the earlier call.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages:
`@herald-analytics/log`, which prints every call for debug builds, and `@herald-analytics/testing`,
a fake vendor for tests.
