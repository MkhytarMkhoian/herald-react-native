# Herald core

The core of Herald for React Native: events, properties, and `Herald`, which sends them to every
vendor. It uses no vendor SDK: each vendor has its own package.

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

A number is written `int(…)` or `double(…)`, because JavaScript can't tell `3` from `3.0`. A bare
number doesn't compile.

Give each class only the interface it uses, such as `EventTrackerService`, and pass `Herald` as
that.

A call reaches every vendor at once. If one vendor fails, the others still run, and the error goes
to your error reporter. Calls don't wait for each other: when order matters, await the first.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages:
`@herald-analytics/log`, which prints every call for debug builds, and `@herald-analytics/testing`,
a fake vendor for tests.
