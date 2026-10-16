# Contributing

Thanks for helping with Herald. This page explains how to get a change ready to become part of the
React Native SDK.

Herald's design is shared with the [Android](https://github.com/MkhytarMkhoian/herald),
[Flutter](https://github.com/MkhytarMkhoian/herald-flutter) and
[iOS](https://github.com/MkhytarMkhoian/herald-ios) SDKs. A change to how Herald behaves — the
factory chain, the fan-out, a vendor's consent rules — belongs in all of them, so open an issue
first.

## Setting up

You need Node.js 24 or newer. The repository is an
[npm workspace](https://docs.npmjs.com/cli/using-npm/workspaces): one `npm install` at the root
installs every package.

```bash
npm install
npm run check  # all of the below
npm run format:check  # Prettier, 100 columns
npm run lint  # ESLint
npm run typecheck  # TypeScript, strict
npm test  # Jest, the packages' tests and the example's
npm run build  # what npm will receive, in each package's lib/
```

### The example app

[`example`](example) is an Expo app in the same workspace. It uses the packages' source directly, so
an edit shows up without building them first:

```bash
cd example
npx expo run:ios  # or run:android; builds the native app, then starts the bundler
```

The example sets the versions of React and React Native for the whole repository, through Expo:
when Expo moves to a new SDK, update `example/package.json` with `npx expo install --fix`, then the
root `package.json`'s `react`, `react-native` and `@react-native/*` versions and the `overrides`
to match. Two copies of React in one app break hooks, so they must stay the same.

### The website's code

The TypeScript on the [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) comes from
[`docs-samples`](docs-samples), which `npm run check` compiles and tests. Each piece sits between
`// --8<-- [start:name]` and `// --8<-- [end:name]` markers, and a page includes it by file and
name, so renaming one means changing that page. The website builds the API reference with
`npm run docs:api`.

## What every change needs

- **Code that matches its surroundings.** Run `npm run format`, and name things as the code around
  your change does.
- **Few comments, in simple words.** Only what a reader can't guess from the code: a vendor rule, a
  gotcha, why an order matters.
- **Core knows no vendor.** `@herald-analytics/core` never names a vendor, in code, docs or
  examples.
- **Plain TypeScript.** Classes and interfaces, as in the other SDKs. A label is an interface with a
  `true` field and an `is…` check, such as `ScreenViewEvent` and `isScreenView`.
- **Tests** in `src/__tests__/`, named `*.test.ts`, or `*.test.tsx` for components. A test can also
  check that something doesn't compile, with `// @ts-expect-error`.
- **A careful public API.** Everything a package's `src/index.ts` exports can only change in a
  breaking way in a major version, so keep helpers out of it.
- **A line in `CHANGELOG.md`** under the next, unreleased version, starting with `New:`, `Fix:`,
  `Upgrade:` or `Breaking:`.

## A new vendor package

A new vendor gets its own package, shaped like the others. Copy `mixpanel`, or `appsflyer` for a
vendor that only takes events. A new vendor never needs a change to `@herald-analytics/core`.

- [ ] **The package.** `packages/<vendor>`, with the vendor's React Native package as a peer
      dependency (the app installs it, so React Native links its native code) and as a dev
      dependency, a `LICENSE` copy, a `README.md` and the `tsconfig.build.json` every package has.
- [ ] **The factory chain,** the same as every other vendor's, in `src/chain.ts`: the factory
      interfaces, the composites (which call `requireFallbackLast`), the `RequireMapped` factories
      and the tracker service. Copy it from another vendor and rename.
- [ ] **The vendor's settings stay the app's.** The package takes a client the app has set up, and
      never sets keys, servers or log levels itself.
- [ ] **Services.** A `<Vendor>AnalyticsTrackerService` and a `<Vendor>AnalyticsService` for
      start-up, sign-in and consent.
- [ ] **Factories and handlers:**
    - [ ] a generic factory marked as a fallback (`isFallback = true`), if sending an event under its
          own name makes sense for this vendor;
    - [ ] one handler class for each different vendor call: `Generic<Vendor>EventTracker`,
          `ScreenView<Vendor>EventTracker`.
- [ ] **How consent works, backed by the vendor's own documentation.** What does a fresh install
      send? What does `setEnabled` call? Does the vendor remember the choice across launches?
- [ ] **Typed values.** Send numbers and booleans as themselves wherever the vendor accepts them.
- [ ] **What a call waits for.** A handler resolves once the vendor has the call, not after an
      upload. A refused call must reject, so Herald reports it.
- [ ] **Tests** for every service method, factory and handler, with a client that records calls.
- [ ] **Everywhere packages are listed:** the table in `README.md`, and a vendor page in herald-docs.

