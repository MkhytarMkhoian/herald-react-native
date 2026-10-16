<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/MkhytarMkhoian/herald/main/docs/assets/readme-banner-dark.png">
  <img alt="Herald" src="https://raw.githubusercontent.com/MkhytarMkhoian/herald/main/docs/assets/readme-banner-light.png">
</picture>

> *A herald announces an event to whoever is listening.*

[![CI](https://github.com/MkhytarMkhoian/herald-react-native/actions/workflows/ci.yml/badge.svg)](https://github.com/MkhytarMkhoian/herald-react-native/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-website-indigo.svg)](https://mkhytarmkhoian.github.io/herald-docs/)

Herald is an analytics library for mobile apps. Your app describes what happened as an event, and
Herald sends that event to every analytics service you use: Firebase, Adjust, Mixpanel, AppsFlyer,
Amplitude, or one you build yourself.

This repository is the **React Native SDK**. It is the same design as the
[Android](https://github.com/MkhytarMkhoian/herald),
[Flutter](https://github.com/MkhytarMkhoian/herald-flutter) and
[iOS](https://github.com/MkhytarMkhoian/herald-ios) SDKs, written in TypeScript, over each vendor's
official React Native package.

**In development: not on npm yet.**

## In 30 seconds

An event is a class your app owns. Text and true/false are written as they are; a number says
whether it is whole, because JavaScript can't tell `3` from `3.0`:

```ts
import { int, type Event, type EventParameters } from '@herald-analytics/core';

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
```

`Herald` sends it to every vendor:

```ts
const herald = new Herald({
  providers: [
    new HeraldProvider({ name: 'analytics', events: analyticsTracker }),
    new HeraldProvider({ name: 'attribution', events: attributionTracker }),
  ],
  errorReporter: (failure) => crashReporter.record(failure.error, `${failure}`),
});

herald.track(new CheckoutStarted('pro', 3));
```

## Packages

| Package | What it is |
| --- | --- |
| [`@herald-analytics/core`](packages/core) | Events, properties and the `Herald` fan-out, in plain TypeScript. |
| [`@herald-analytics/firebase`](packages/firebase) | Sends to Firebase Analytics (GA4). |
| [`@herald-analytics/adjust`](packages/adjust) | Sends to Adjust: events by dashboard token, purchases and ad revenue. |
| [`@herald-analytics/mixpanel`](packages/mixpanel) | Sends to Mixpanel: events, user profile and super properties. |
| [`@herald-analytics/appsflyer`](packages/appsflyer) | Sends to AppsFlyer: conversions, purchases, subscriptions and ad revenue. |
| [`@herald-analytics/amplitude`](packages/amplitude) | Sends to Amplitude: events, user properties, screen views and revenue. |
| [`@herald-analytics/log`](packages/log) | Prints every call, for debug builds. |
| [`@herald-analytics/testing`](packages/testing) | `FakeAnalyticsProvider`, a fake vendor that records events so your tests can check them. |
| [`@herald-analytics/react`](packages/react) | Optional: tracking from screens and lists, such as screen views and impressions. |

Each vendor package works over that vendor's official React Native package, which your app installs
itself, so React Native links its native code.

## Example app

[`example`](example) is an Expo Router app that sends every Herald call to the log and to an
on-screen timeline.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides. To work on
Herald itself, see [CONTRIBUTING](CONTRIBUTING.md); to release it, [RELEASING](RELEASING.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).
