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

## Install

Install the core and one package for each vendor you use, next to that vendor's own React Native
package. For Firebase:

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
npm install @herald-analytics/core @herald-analytics/firebase
npm install --save-dev @herald-analytics/testing
```

Install the vendor's package yourself, as on the first line. npm would bring it in on its own, but
without adding it to your `package.json`, and React Native only links the native code of packages
listed there. Each vendor package's README gives its install line. Without Expo, use
`npm install` for the vendor's package too.

All packages share one version.

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

<!-- --8<-- [start:packages] -->
| Package | What it is |
| --- | --- |
| [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core) | Events, properties and the `Herald` fan-out, in plain TypeScript. |
| [`@herald-analytics/firebase`](https://www.npmjs.com/package/@herald-analytics/firebase) | Sends to Firebase Analytics (GA4). |
| [`@herald-analytics/adjust`](https://www.npmjs.com/package/@herald-analytics/adjust) | Sends to Adjust: events by dashboard token, purchases and ad revenue. |
| [`@herald-analytics/mixpanel`](https://www.npmjs.com/package/@herald-analytics/mixpanel) | Sends to Mixpanel: events, user profile and super properties. |
| [`@herald-analytics/appsflyer`](https://www.npmjs.com/package/@herald-analytics/appsflyer) | Sends to AppsFlyer: conversions, purchases, subscriptions and ad revenue. |
| [`@herald-analytics/amplitude`](https://www.npmjs.com/package/@herald-analytics/amplitude) | Sends to Amplitude: events, user properties, screen views and revenue. |
| [`@herald-analytics/log`](https://www.npmjs.com/package/@herald-analytics/log) | Prints every call, for debug builds. |
| [`@herald-analytics/testing`](https://www.npmjs.com/package/@herald-analytics/testing) | `FakeAnalyticsProvider`, a fake vendor that records events so your tests can check them. |
| [`@herald-analytics/react`](https://www.npmjs.com/package/@herald-analytics/react) | Optional: tracking from screens and lists, such as screen views and impressions. |

Each vendor package works over that vendor's official React Native package, which your app installs
itself, so React Native links its native code.
<!-- --8<-- [end:packages] -->

## Compatibility

<!-- --8<-- [start:compatibility] -->
Herald needs React Native 0.78 or newer and React 19. It is built and tested with Expo SDK 57, and
against these vendor packages:

| Package | Version |
| --- | --- |
| `@react-native-firebase/analytics` | 26 |
| `mixpanel-react-native` | 4 |
| `@amplitude/analytics-react-native` | 1.12 or newer |
| `react-native-adjust` | 5.8 or newer |
| `react-native-appsflyer` | 7 |

Each vendor package allows newer versions of its SDK within the same major version. A new major
version of an SDK may need a Herald release. `@herald-analytics/react` works with React Navigation 7
and Expo Router 57 or newer.
<!-- --8<-- [end:compatibility] -->

## TypeScript specifics

<!-- --8<-- [start:differences] -->
Herald's concepts are the same on every platform. Where TypeScript differs, the API follows it:

- **A number says its type.** JavaScript can't tell `3` from `3.0`, so a number is written
  `int(3)` or `double(9.99)`. A bare number doesn't compile, and `int` refuses a fraction. Text and
  true/false are written as they are.
- **Labels are fields.** A screen view has `readonly isScreenView = true`, and a user property
  `readonly isUserProperty = true`, because TypeScript's interfaces are gone at run time. Your own
  [markers](https://mkhytarmkhoian.github.io/herald-docs/guides/custom-markers/) work the same way,
  with a field and an `is…` check.
- **Factories pick events with `instanceof`,** so events are classes.
- **Calls don't wait for each other.** A call reaches every vendor at once and returns a promise that
  settles when they're all done. It never rejects: a vendor that fails goes to your error reporter.
  When order matters, such as turning collection off before tracking, `await` the earlier call.
- **Setup mistakes throw.** A provider without a name or capabilities, two providers with the same
  name, or a fallback factory that isn't last, throw when the app sets up Herald, with a message
  saying what to change.
<!-- --8<-- [end:differences] -->

## Example app

[`example`](example) is an Expo Router app that sends every Herald call to the log and to an
on-screen timeline.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, with the code
for React Native next to Android, Flutter and iOS. That code comes from
[`docs-samples`](docs-samples), which CI compiles and tests. To work on
Herald itself, see [CONTRIBUTING](CONTRIBUTING.md); to release it, [RELEASING](RELEASING.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).
