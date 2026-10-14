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
npm test  # Jest
npm run build  # what npm will receive, in each package's lib/
```

## What every change needs

- **Code that matches its surroundings.** Run `npm run format`. Use the same naming and the same
  amount of comments as the code around your change.
- **Few comments, in simple words.** Document what a reader can't guess from the name: a vendor
  rule, a gotcha, why an order matters.
- **Core knows no vendor.** `@herald-analytics/core` never names a vendor, in code, docs or
  examples.
- **Plain TypeScript.** Classes and interfaces, as in the other SDKs. A label is an interface with a
  `true` field and an `is…` check, such as `ScreenViewEvent` and `isScreenView`.
- **Tests,** next to the code in `src/__tests__/`, named `*.test.ts`. A test file can also check
  that something doesn't compile, with `// @ts-expect-error`.
- **A careful public API.** Everything exported from a package's `src/index.ts` is Herald's API and
  can only change incompatibly in a major version. Keep helpers out of the export list.
- **A line in `CHANGELOG.md`** under the next, unreleased version, starting with `New:`, `Fix:`,
  `Upgrade:` or `Breaking:`.

## A new vendor package

A new vendor gets a package of its own, shaped like the existing ones. Use `mixpanel` as the
template, or `appsflyer` for a vendor that only takes events. A new vendor never needs a change to
`@herald-analytics/core`.

- [ ] **The package.** `packages/<vendor>`, with the vendor's React Native package as a peer
      dependency (the app installs it, so React Native links its native code) and as a dev
      dependency, a `LICENSE` copy, a `README.md` and the `tsconfig.build.json` every package has.
- [ ] **The factory chain,** the same as every other vendor's, in `src/chain.ts`: the factory
      interfaces, the composites (which call `requireFallbackLast`), the `RequireMapped` factories
      and the tracker service. Copy it from another vendor and rename.
- [ ] **The vendor's settings stay the app's.** The package takes a client the app has already
      configured, and never sets keys, endpoints, data residency or log levels itself.
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
- [ ] **What a call waits for.** A handler resolves once the vendor has the call, never after an
      upload; a refused call must reject, so Herald reports it.
- [ ] **Tests** for every service method, factory and handler, with a recording client or, when the
      vendor's JavaScript is a thin layer over its native module, a recorded native module.
- [ ] **Everywhere packages are listed:** the table in `README.md`, and a vendor page in herald-docs.

