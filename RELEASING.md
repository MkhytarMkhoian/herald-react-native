# Releasing

A release is a `vX.Y.Z` tag. Pushing it runs the **Publish** workflow, which publishes every
package to npm, then asks the website to redeploy. All packages share one version.

A pre-release, such as `1.1.0-beta.1`, goes under npm's `next` tag, so a plain
`npm install @herald-analytics/core` keeps getting the last stable version. A stable version goes
under `latest`.

## Steps

1. **Update `CHANGELOG.md`.** Under `## Version X.Y.Z`, put the release date, `_YYYY-MM-DD_`. Check
   that every change a user would notice is listed, each starting with `New:`, `Fix:`, `Upgrade:`
   or `Breaking:`.
2. **Set the version in every package,** then update the lock file:

    ```bash
    npm run set-version -- X.Y.Z
    npm install
    ```

3. **Check that everything passes:**

    ```bash
    npm run check
    npm run export -w herald-example
    ```

4. **Commit, tag and push:**

    ```bash
    git commit -am "Release X.Y.Z"
    git tag vX.Y.Z
    git push origin main vX.Y.Z
    ```

5. **Verify** that the Publish workflow is green, and that every package shows `X.Y.Z` on npm, such
   as [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core). The
   workflow refuses to publish if a version or the change log doesn't match the tag.

A version on npm is permanent: its number can never be used again. When a release is wrong, fix it
with the next version, and mark the wrong one with `npm deprecate`.

## One-time setup

Already done for this repository:

- **The `herald-analytics` organisation on npm,** which owns every package's name.
- **The `npm` environment** in the GitHub repository, which only `v*` tags can use.
- **Trusted publishing for each package,** on
  `https://www.npmjs.com/package/@herald-analytics/<package>/access`: *GitHub Actions*, user
  `MkhytarMkhoian`, repository `herald-react-native`, workflow `publish.yml`, environment `npm`. No
  npm token is stored in GitHub.
- **The `DOCS_DISPATCH_TOKEN` secret,** a GitHub token that can start herald-docs' workflows.

## Adding a package

npm's trusted publishing can't create a package, so a new one goes up by hand once:

1. Give it the version the other packages have, add it to the Publish workflow's list after the
   packages it depends on, and merge it to `main`.
2. Publish it from your machine, after `npm login`. Use a clean copy of `main`, so changes you
   haven't committed stay out of it. The package's types need `@herald-analytics/core`'s, which a
   fresh copy hasn't built yet, so build core first:

    ```bash
    git worktree add --detach /tmp/herald-rn-main main
    cd /tmp/herald-rn-main && npm ci
    npm run build -w @herald-analytics/core
    cd packages/<package> && npm publish --access public --dry-run
    npm publish --access public
    ```

   Then go back to your clone and remove it: `git worktree remove --force /tmp/herald-rn-main`.
3. Turn on its trusted publishing, as above.

From the next tag on, the workflow publishes it with the rest. npm can take a few minutes to show a
new version, so a version that seems missing right after publishing may only be late.
