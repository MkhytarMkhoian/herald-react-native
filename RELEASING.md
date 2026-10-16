# Releasing

A release is a `vX.Y.Z` tag. Pushing it runs the **Publish** workflow, which publishes every
package to npm under that version, in dependency order. All packages always share one version.

A pre-release, such as `1.0.0-beta.1`, is published under npm's `next` tag, so a plain
`npm install @herald-analytics/core` keeps getting the last stable version. A stable version goes
under `latest`.

The very first release is different: it is published by hand, then automated publishing is turned
on. See [The first release](#the-first-release).

## Steps

1. **Update `CHANGELOG.md`.**
    - Under `## Version X.Y.Z`, replace `_Unreleased_` with the release date, `_YYYY-MM-DD_`.
    - Check that every change a user would notice is listed, each starting with `New:`, `Fix:`,
      `Upgrade:` or `Breaking:`.
2. **Set the version in every package.** The script also updates the ranges between the packages
   and in the example app. Then update the lock file:

    ```bash
    npm run set-version -- X.Y.Z
    npm install
    ```

3. **Update the version shown to readers,** in the install snippets of the READMEs.
4. **Check that everything passes:**

    ```bash
    npm run check
    npm run export -w herald-example
    ```

5. **Commit, tag and push:**

    ```bash
    git commit -am "Release X.Y.Z"
    git tag vX.Y.Z
    git push origin main vX.Y.Z
    ```

6. **Verify:**
    - The Publish workflow is green on the tag. It refuses to publish if a package's version or the
      change log doesn't match the tag.
    - Every package shows `X.Y.Z` on npm, such as
      [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), with a
      provenance badge.
    - A fresh Expo app installs the packages from npm and builds.

A version on npm is permanent. For 72 hours after publishing it can be unpublished, but the version
number can never be used again. When a release is wrong, fix it forward with the next version, and
mark the wrong one with `npm deprecate`.

## One-time setup

- **The `herald-analytics` organisation on npm,** which owns every package's name.
- **Automated publishing,** set up as in [The first release](#the-first-release). No npm token is
  stored in GitHub.
- **The `DOCS_DISPATCH_TOKEN` secret,** a GitHub token allowed to start herald-docs' workflows.
  After publishing, the Publish workflow uses it to redeploy the website, which takes its
  TypeScript samples, API reference and change log from the newest release tag.

## The first release

npm turns on automated publishing for a package from its settings page, which only exists once the
package does, so the first version is published by hand, from your machine.

1. **Sign in.** Log the command line in to the npm account that owns the `herald-analytics`
   organisation. It opens a browser to confirm, and asks for two-factor authentication:

    ```bash
    npm login
    ```

2. **Prepare the release** as in steps 1 to 4 above, and commit it. Don't tag it yet.
3. **Publish each package, in this order.** Each command builds the package, shows what it will
   upload, and asks for a one-time password from your two-factor app:

    ```bash
    for package in core log testing react firebase adjust mixpanel appsflyer amplitude; do
      npm publish --workspace "packages/$package" --access public --tag next
    done
    ```

   Use `--tag latest` instead of `--tag next` if the first version is a stable one.
4. **Don't tag this version.** Pushing its `v…` tag would start the Publish workflow, which fails
   because the version already exists. The first tagged release is the next version.
5. **Create the `npm` environment** in the GitHub repository: *Settings → Environments → New
   environment*, named `npm`. Under its deployment rules, allow only tags matching `v*`. Adding
   yourself as a required reviewer makes every release wait for your approval.
6. **Turn on automated publishing for each package.** On
   `https://www.npmjs.com/package/@herald-analytics/<package>/access`, under *Trusted Publisher*,
   choose *GitHub Actions* with:
    - organisation or user: `MkhytarMkhoian`;
    - repository: `herald-react-native`;
    - workflow file: `publish.yml`;
    - environment: `npm`.

   Then, under *Publishing access*, require two-factor authentication and disallow tokens, so only
   the workflow and you can publish.
7. **Release the next version with the steps above,** to check the workflow end to end.

## Adding a package

npm's automated publishing can't create a package, so a new one goes up by hand once:

1. Give it the version the other packages have now, and merge it to `main`.
2. Publish it from its directory with `npm publish --access public`, and the tag the current version
   uses.
3. Turn on its automated publishing, as in step 6 of [The first release](#the-first-release).

From the next tag on, the Publish workflow publishes it with the rest. It must already be in the
workflow's list, after the packages it depends on.
