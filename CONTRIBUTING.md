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
